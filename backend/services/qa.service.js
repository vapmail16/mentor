import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from './email.service.js';

/**
 * Create a question
 */
export const createQuestion = async (userId, sessionId, questionData) => {
  try {
    const { question } = questionData;

    const questionId = uuidv4();

    const result = await query(
      `INSERT INTO qa_questions (id, session_id, user_id, question)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [questionId, sessionId, userId, question]
    );

    // Get session and mentor info to send notification
    const sessionResult = await query(
      `SELECT s.title, s.mentor_id, m.user_id as mentor_user_id, u.email as mentor_email, u.full_name as mentor_name
       FROM sessions s
       JOIN mentors m ON s.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      
      // Send notification email to mentor (async, don't block)
      emailService.sendMentorAnswerEmail(
        session.mentor_email,
        session.mentor_name,
        'A Mentee', // TODO: Get actual user name
        question,
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/qa/${questionId}`
      ).catch((error) => {
        logger.error('Failed to send mentor notification', error, { questionId });
      });
    }

    // Get full question with user info
    const fullQuestion = await getQuestionById(questionId);
    return fullQuestion;
  } catch (error) {
    logger.error('Create question error', error, { userId, sessionId });
    throw error;
  }
};

/**
 * Get question by ID
 */
export const getQuestionById = async (questionId) => {
  try {
    const result = await query(
      `SELECT q.*, 
              u.full_name as user_name, u.avatar_url as user_avatar
       FROM qa_questions q
       JOIN users u ON q.user_id = u.id
       WHERE q.id = $1`,
      [questionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const question = result.rows[0];

    // Get answers
    const answersResult = await query(
      `SELECT a.*, 
              u.full_name as answerer_name, u.avatar_url as answerer_avatar
       FROM qa_answers a
       JOIN users u ON a.answered_by = u.id
       WHERE a.question_id = $1
       ORDER BY a.is_mentor_answer DESC, a.upvotes DESC, a.created_at ASC`,
      [questionId]
    );
    question.answers = answersResult.rows;

    return question;
  } catch (error) {
    logger.error('Get question by ID error', error, { questionId });
    throw error;
  }
};

/**
 * Get questions for a session
 */
export const getSessionQuestions = async (sessionId, filters = {}) => {
  try {
    const { is_answered, limit = 50, offset = 0 } = filters;

    let queryText = `
      SELECT q.*, 
             u.full_name as user_name, u.avatar_url as user_avatar
      FROM qa_questions q
      JOIN users u ON q.user_id = u.id
      WHERE q.session_id = $1
    `;

    const params = [sessionId];
    let paramCount = 2;

    if (is_answered !== undefined) {
      queryText += ` AND q.is_answered = $${paramCount}`;
      params.push(is_answered);
      paramCount++;
    }

    queryText += `
      ORDER BY q.is_answered ASC, (q.upvotes - q.downvotes) DESC, q.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Get session questions error', error, { sessionId });
    throw error;
  }
};

/**
 * Answer a question
 */
export const answerQuestion = async (userId, questionId, answerData) => {
  try {
    const { answer } = answerData;

    // Check if user is a mentor
    const mentorResult = await query(
      `SELECT id FROM mentors WHERE user_id = $1`,
      [userId]
    );

    const isMentorAnswer = mentorResult.rows.length > 0;

    const answerId = uuidv4();

    const result = await query(
      `INSERT INTO qa_answers (id, question_id, answered_by, answer, is_mentor_answer)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [answerId, questionId, userId, answer, isMentorAnswer]
    );

    // Update question as answered if mentor answered
    if (isMentorAnswer) {
      await query(
        `UPDATE qa_questions 
         SET is_answered = TRUE, answered_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [questionId]
      );

      // Send notification to question asker
      const questionResult = await query(
        `SELECT q.user_id, u.email, u.full_name
         FROM qa_questions q
         JOIN users u ON q.user_id = u.id
         WHERE q.id = $1`,
        [questionId]
      );

      if (questionResult.rows.length > 0) {
        const question = questionResult.rows[0];
        const mentorResult = await query(
          `SELECT u.full_name FROM mentors m
           JOIN users u ON m.user_id = u.id
           WHERE m.user_id = $1`,
          [userId]
        );
        const mentorName = mentorResult.rows[0]?.full_name || 'The Mentor';

        emailService.sendMentorAnswerEmail(
          question.email,
          question.full_name,
          mentorName,
          answer,
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/qa/${questionId}`
        ).catch((error) => {
          logger.error('Failed to send answer notification', error, { answerId });
        });
      }
    }

    // Get full answer with user info
    const fullAnswer = await query(
      `SELECT a.*, 
              u.full_name as answerer_name, u.avatar_url as answerer_avatar
       FROM qa_answers a
       JOIN users u ON a.answered_by = u.id
       WHERE a.id = $1`,
      [answerId]
    );

    return fullAnswer.rows[0];
  } catch (error) {
    logger.error('Answer question error', error, { userId, questionId });
    throw error;
  }
};

/**
 * Vote on question or answer
 */
export const vote = async (userId, questionId, answerId, voteType) => {
  try {
    if (!['upvote', 'downvote'].includes(voteType)) {
      throw new Error('Invalid vote type');
    }

    const voteId = uuidv4();
    const table = questionId ? 'qa_questions' : 'qa_answers';
    const id = questionId || answerId;
    const voteColumn = questionId ? 'question_id' : 'answer_id';

    // Check if already voted
    const existingResult = await query(
      `SELECT id, vote_type FROM qa_votes 
       WHERE ${voteColumn} = $1 AND user_id = $2`,
      [id, userId]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.vote_type === voteType) {
        // Remove vote
        await query(
          `DELETE FROM qa_votes 
           WHERE ${voteColumn} = $1 AND user_id = $2`,
          [id, userId]
        );

        // Update vote count
        const column = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        await query(
          `UPDATE ${table} 
           SET ${column} = GREATEST(${column} - 1, 0)
           WHERE id = $1`,
          [id]
        );

        return { voted: false };
      } else {
        // Update vote
        await query(
          `UPDATE qa_votes 
           SET vote_type = $1
           WHERE ${voteColumn} = $2 AND user_id = $3`,
          [voteType, id, userId]
        );

        // Update vote counts
        const oldColumn = existing.vote_type === 'upvote' ? 'upvotes' : 'downvotes';
        const newColumn = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        await query(
          `UPDATE ${table} 
           SET ${oldColumn} = GREATEST(${oldColumn} - 1, 0),
               ${newColumn} = ${newColumn} + 1
           WHERE id = $1`,
          [id]
        );

        return { voted: true, voteType };
      }
    } else {
      // New vote
      await query(
        `INSERT INTO qa_votes (id, ${voteColumn}, user_id, vote_type)
         VALUES ($1, $2, $3, $4)`,
        [voteId, id, userId, voteType]
      );

      // Update vote count
      const column = voteType === 'upvote' ? 'upvotes' : 'downvotes';
      await query(
        `UPDATE ${table} 
         SET ${column} = ${column} + 1
         WHERE id = $1`,
        [id]
      );

      return { voted: true, voteType };
    }
  } catch (error) {
    logger.error('Vote error', error, { userId, questionId, answerId });
    throw error;
  }
};

export default {
  createQuestion,
  getQuestionById,
  getSessionQuestions,
  answerQuestion,
  vote,
};

