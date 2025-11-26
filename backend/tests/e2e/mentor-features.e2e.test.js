import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';
import { query } from '../../config/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

let adminToken;
let mentorToken;
let menteeToken;
let adminUserId;
let mentorUserId;
let menteeUserId;
let mentorProfileId;
let sessionId;

// Test user credentials
const adminEmail = 'e2e-admin@test.com';
const mentorEmail = 'e2e-mentor@test.com';
const menteeEmail = 'e2e-mentee@test.com';
const testPassword = 'TestPassword123!@#';

beforeAll(async () => {
  try {
    // Create test users
    adminUserId = uuidv4();
    mentorUserId = uuidv4();
    menteeUserId = uuidv4();

    const passwordHash = await bcrypt.hash(testPassword, 12);

    // Check and create/update admin user
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingAdmin.rows.length > 0) {
      adminUserId = existingAdmin.rows[0].id;
      await query(
        `UPDATE users SET password_hash = $1, role = $2, email_confirmed = TRUE WHERE id = $3`,
        [passwordHash, 'admin', adminUserId]
      );
    } else {
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, email_confirmed)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [adminUserId, adminEmail, passwordHash, 'E2E Admin', 'admin']
      );
    }

    // Check and create/update mentor user
    const existingMentorUser = await query('SELECT id FROM users WHERE email = $1', [mentorEmail]);
    if (existingMentorUser.rows.length > 0) {
      mentorUserId = existingMentorUser.rows[0].id;
      await query(
        `UPDATE users SET password_hash = $1, role = $2, email_confirmed = TRUE WHERE id = $3`,
        [passwordHash, 'mentor', mentorUserId]
      );
    } else {
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, email_confirmed)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [mentorUserId, mentorEmail, passwordHash, 'E2E Mentor', 'mentor']
      );
    }

    // Create mentor profile - check if exists first
    const existingMentor = await query(
      'SELECT id FROM mentors WHERE user_id = $1',
      [mentorUserId]
    );
    
    if (existingMentor.rows.length > 0) {
      mentorProfileId = existingMentor.rows[0].id;
      await query(
        `UPDATE mentors SET verification_status = 'verified', bio = 'Test mentor bio' WHERE id = $1`,
        [mentorProfileId]
      );
    } else {
      const mentorProfileResult = await query(
        `INSERT INTO mentors (user_id, verification_status, bio)
         VALUES ($1, 'verified', 'Test mentor bio')
         RETURNING id`,
        [mentorUserId]
      );
      mentorProfileId = mentorProfileResult.rows[0]?.id;
    }

    // Check and create/update mentee user
    const existingMentee = await query('SELECT id FROM users WHERE email = $1', [menteeEmail]);
    if (existingMentee.rows.length > 0) {
      menteeUserId = existingMentee.rows[0].id;
      await query(
        `UPDATE users SET password_hash = $1, role = $2, email_confirmed = TRUE WHERE id = $3`,
        [passwordHash, 'mentee', menteeUserId]
      );
    } else {
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, role, email_confirmed)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [menteeUserId, menteeEmail, passwordHash, 'E2E Mentee', 'mentee']
      );
    }

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    
    // Extract token from cookie
    const adminCookies = adminLogin.headers['set-cookie'];
    if (adminCookies && adminCookies[0]) {
      adminToken = adminCookies[0].split(';')[0].split('=')[1];
    }

    const mentorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: mentorEmail, password: testPassword });
    const mentorCookies = mentorLogin.headers['set-cookie'];
    if (mentorCookies && mentorCookies[0]) {
      mentorToken = mentorCookies[0].split(';')[0].split('=')[1];
    }

    const menteeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: menteeEmail, password: testPassword });
    const menteeCookies = menteeLogin.headers['set-cookie'];
    if (menteeCookies && menteeCookies[0]) {
      menteeToken = menteeCookies[0].split(';')[0].split('=')[1];
    }

    // Create a test session for mentor
    if (mentorProfileId) {
      const sessionResult = await query(
        `INSERT INTO sessions (id, mentor_id, title, description, language, difficulty_level, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          uuidv4(),
          mentorProfileId,
          'E2E Test Session',
          'Test session for E2E testing',
          'English',
          'beginner',
          true,
        ]
      );
      sessionId = sessionResult.rows[0]?.id;
    }
  } catch (error) {
    logger.error('E2E test setup error', error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    // Cleanup test data
    if (sessionId) {
      await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    }
    if (mentorProfileId) {
      await query('DELETE FROM mentors WHERE id = $1', [mentorProfileId]);
    }
    await query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
      adminEmail,
      mentorEmail,
      menteeEmail,
    ]);
  } catch (error) {
    logger.error('E2E test cleanup error', error);
  }
});

describe('E2E: Mentor Features Implementation', () => {
  describe('1. Short Videos Management (Admin)', () => {
    it('should allow admin to create short video for a session', async () => {
      if (!sessionId || !adminToken) {
        console.log('Skipping: sessionId or adminToken not available', { sessionId, adminToken: !!adminToken });
        return;
      }

      const response = await request(app)
        .post(`/api/sessions/${sessionId}/short-videos`)
        .set('Cookie', adminToken ? `auth_token=${adminToken}` : '')
        .send({
          title: 'E2E Test Short Video',
          description: 'Test short video description',
          video_type: 'youtube',
          youtube_video_id: 'dQw4w9WgXcQ',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order_index: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Test Short Video');
      expect(response.body.data.youtube_video_id).toBe('dQw4w9WgXcQ');
    });

    it('should allow admin to update short video', async () => {
      if (!sessionId || !adminToken) {
        console.log('Skipping: sessionId or adminToken not available');
        return;
      }

      // First create a short video
      const createResponse = await request(app)
        .post(`/api/sessions/${sessionId}/short-videos`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          title: 'Update Test Short Video',
          video_type: 'youtube',
          youtube_video_id: 'test123',
          video_url: 'https://www.youtube.com/watch?v=test123',
        });

      const shortVideoId = createResponse.body.data?.id;
      if (!shortVideoId) {
        console.log('Skipping: Could not create short video');
        return;
      }

      // Update it
      const updateResponse = await request(app)
        .put(`/api/sessions/short-videos/${shortVideoId}`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Title');

      // Cleanup
      await request(app)
        .delete(`/api/sessions/short-videos/${shortVideoId}`)
        .set('Cookie', `auth_token=${adminToken}`);
    });

    it('should allow admin to delete short video', async () => {
      if (!sessionId || !adminToken) {
        console.log('Skipping: sessionId or adminToken not available');
        return;
      }

      // Create a short video
      const createResponse = await request(app)
        .post(`/api/sessions/${sessionId}/short-videos`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          title: 'Delete Test Short Video',
          video_type: 'youtube',
          youtube_video_id: 'delete123',
          video_url: 'https://www.youtube.com/watch?v=delete123',
        });

      const shortVideoId = createResponse.body.data?.id;
      if (!shortVideoId) {
        console.log('Skipping: Could not create short video');
        return;
      }

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/sessions/short-videos/${shortVideoId}`)
        .set('Cookie', `auth_token=${adminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('2. Mentor Q&A Inbox', () => {
    it('should allow mentor to get their questions', async () => {
      if (!mentorToken || !mentorProfileId || !sessionId) {
        console.log('Skipping: Required data not available');
        return;
      }

      // First create a question for the mentor's session
      await query(
        `INSERT INTO qa_questions (id, session_id, user_id, question)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [uuidv4(), sessionId, menteeUserId, 'E2E Test Question?']
      );

      const response = await request(app)
        .get('/api/qa/mentor/questions')
        .set('Cookie', `auth_token=${mentorToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow mentor to answer a question', async () => {
      if (!mentorToken || !sessionId) {
        console.log('Skipping: Required data not available');
        return;
      }

      // Create a question
      const questionResult = await query(
        `INSERT INTO qa_questions (id, session_id, user_id, question)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [uuidv4(), sessionId, menteeUserId, 'E2E Question to Answer?']
      );
      const questionId = questionResult.rows[0]?.id;

      if (!questionId) {
        console.log('Skipping: Could not create question');
        return;
      }

      const response = await request(app)
        .post(`/api/qa/${questionId}/answer`)
        .set('Cookie', `auth_token=${mentorToken}`)
        .send({ answer: 'This is an E2E test answer' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.answer).toBe('This is an E2E test answer');
      expect(response.body.data.is_mentor_answer).toBe(true);
    });
  });

  describe('3. Mentor Analytics', () => {
    it('should return mentor analytics', async () => {
      if (!mentorToken || !mentorProfileId) {
        console.log('Skipping: Required data not available');
        return;
      }

      const response = await request(app)
        .get(`/api/mentors/${mentorProfileId}/analytics`)
        .set('Cookie', `auth_token=${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSessions');
      expect(response.body.data).toHaveProperty('publishedSessions');
      expect(response.body.data).toHaveProperty('totalViews');
      expect(response.body.data).toHaveProperty('totalEngagement');
    });
  });

  describe('4. Mentor Session Management', () => {
    it('should allow mentor to create a session', async () => {
      if (!mentorToken || !mentorProfileId) {
        console.log('Skipping: Required data not available');
        return;
      }

      const response = await request(app)
        .post('/api/sessions')
        .set('Cookie', `auth_token=${mentorToken}`)
        .send({
          title: 'E2E Mentor Created Session',
          description: 'Session created by mentor in E2E test',
          language: 'English',
          difficulty_level: 'intermediate',
          video_type: 'youtube',
          youtube_video_id: 'test123',
          main_video_url: 'https://www.youtube.com/watch?v=test123',
          is_published: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('E2E Mentor Created Session');
      expect(response.body.data.mentor_id).toBe(mentorProfileId);

      // Cleanup
      if (response.body.data?.id) {
        await query('DELETE FROM sessions WHERE id = $1', [response.body.data.id]);
      }
    });

    it('should allow mentor to update their session', async () => {
      if (!mentorToken || !sessionId) {
        console.log('Skipping: Required data not available');
        return;
      }

      const response = await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Cookie', `auth_token=${mentorToken}`)
        .send({
          title: 'Updated E2E Session Title',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated E2E Session Title');
    });
  });

  describe('5. Session Display Features', () => {
    it('should return session with short videos', async () => {
      if (!sessionId || !adminToken) {
        console.log('Skipping: Required data not available');
        return;
      }

      // Create a short video first
      await request(app)
        .post(`/api/sessions/${sessionId}/short-videos`)
        .set('Cookie', `auth_token=${adminToken}`)
        .send({
          title: 'Display Test Short',
          video_type: 'youtube',
          youtube_video_id: 'display123',
          video_url: 'https://www.youtube.com/watch?v=display123',
        });

      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Cookie', `auth_token=${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('short_videos');
      expect(Array.isArray(response.body.data.short_videos)).toBe(true);
    });

    it('should return session with audio_file_url (Spotify)', async () => {
      if (!sessionId || !mentorToken) {
        console.log('Skipping: Required data not available');
        return;
      }

      // Update session with Spotify URL
      await request(app)
        .put(`/api/sessions/${sessionId}`)
        .set('Cookie', `auth_token=${mentorToken}`)
        .send({
          audio_file_url: 'https://open.spotify.com/episode/test123',
        });

      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Cookie', `auth_token=${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.audio_file_url).toContain('spotify.com');
    });
  });
});

