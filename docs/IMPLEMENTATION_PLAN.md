# Implementation Plan - Missing Features

**Date:** 2025-01-XX  
**Status:** Planning  
**Goal:** Complete missing features from requirements document  
**Estimated Timeline:** 4-6 weeks

---

## Overview

Based on the gap analysis, we have **~60-70% completion**. This plan addresses the remaining **30-40%** with focus on core user-facing features first.

**Key Finding:** Most backend infrastructure exists. Gaps are primarily in **UI/UX implementation**.

---

## Important Clarifications (Per User Requirements)

### Video Management Approach
- **Videos are YouTube embeds** - Not building custom video player
- **We leverage YouTube** for all video hosting and management
- **Just reference YouTube links** in the app

### Chapter Concept
- **Chapters = Separate sessions/videos from the same mentor**
- If mentor has 10 videos, each video is a "chapter"
- Users navigate between chapters (different session pages)
- NOT video segments within one video

### Short Videos
- **Short videos = YouTube shorts links** that admins add
- Admins can add multiple YouTube shorts links per session
- Each session can have many shorts
- Display as clickable cards/links

### Audio
- **Audio = Spotify links** (not built-in player)
- Admins can add Spotify URL to sessions
- Users click to open Spotify

### AI Pipeline
- **User will create separate utility** for AI processing/editing
- Main app just needs to **display** AI outputs (already done)
- No need for AI pipeline UI in main app

### Removed from Scope
- ❌ Audio extraction (user will create separate utility)
- ❌ Custom audio player (using Spotify links)
- ❌ Playback speed controls
- ❌ Keyboard shortcuts
- ❌ Chapter timestamp jumping
- ❌ AI pipeline management UI (separate utility)
- ❌ AI output editing UI (separate utility)

---

## Phase 1: Core Player Experience (Week 1-2) 🔴 **CRITICAL**

### Priority: HIGHEST - Core user experience depends on this

### 1.1 Add Short Videos Support (YouTube Shorts Links)
**Files:** 
- `frontend/src/pages/admin/AdminSessions.tsx` (MODIFY) - Add short videos management
- `frontend/src/pages/SessionDetail.tsx` (MODIFY) - Display short videos

**Requirements:**
- Admin can add multiple YouTube shorts links per session
- Each session can have many YouTube shorts links
- Users can see and click on short videos in the session page
- Short videos are displayed alongside the main video

**Tasks:**
- [ ] Add "Manage Short Videos" button/modal in AdminSessions
- [ ] Create form to add YouTube shorts links:
  - Title
  - Description  
  - YouTube URL (full URL or video ID)
  - Order/index
- [ ] Display short videos in SessionDetail page (grid/list)
- [ ] When user clicks a short video, it opens in YouTube embed
- [ ] Allow reordering short videos (drag & drop or up/down buttons)
- [ ] Allow editing/deleting short videos

**Backend APIs Needed:**
- `POST /api/sessions/:id/short-videos` - Already exists ✅
- `PUT /api/short-videos/:id` - Need to create
- `DELETE /api/short-videos/:id` - Need to create

**Dependencies:**
- Short videos table already exists
- YouTube URL utilities already exist

**Estimated Time:** 2-3 days

---

### 1.2 Chapter Navigation (Separate Sessions from Same Mentor)
**Files:**
- `frontend/src/pages/MentorDetail.tsx` (ENHANCE) - Already shows sessions
- `frontend/src/pages/SessionDetail.tsx` (MODIFY) - Add chapter navigation

**Requirements:**
- Chapters = Separate videos/sessions from the same mentor
- If a mentor has 10 videos, each is a chapter
- Users can navigate between chapters (different session pages)
- We leverage YouTube for video hosting - just reference YouTube links here

**Tasks:**
- [ ] On SessionDetail page, show "Other Videos from This Mentor" section
- [ ] List all other sessions from the same mentor
- [ ] Display them as chapter cards that link to other session pages
- [ ] Show "Chapter 1", "Chapter 2", etc. labels
- [ ] Allow clicking to navigate to other sessions (chapters)
- [ ] Show current chapter indicator
- [ ] Add "Previous Chapter" / "Next Chapter" navigation buttons

**Backend APIs Available:**
- `GET /api/sessions` with `mentor_id` filter - Already exists ✅

**Dependencies:**
- Session has `mentor_id` to fetch other sessions
- MentorDetail already shows this, need similar in SessionDetail

**Estimated Time:** 1-2 days

**Note:** This is different from AI-generated chapters. These are actual separate sessions from the mentor that users can navigate between.

---

### 1.3 YouTube Video Embed Enhancement
**File:** `frontend/src/components/VideoPlayer.tsx`

**Requirements:**
- Videos are embedded YouTube videos (not custom player)
- Users click on video and it runs in YouTube embedded player
- Simple, clean YouTube embed integration

**Tasks:**
- [ ] Ensure ReactPlayer properly handles YouTube URLs
- [ ] Verify YouTube embed works correctly
- [ ] Test with both full URLs and video IDs
- [ ] Ensure proper aspect ratio and responsive design
- [ ] Remove unnecessary custom controls (YouTube handles this)

**Current Status:**
- ReactPlayer already supports YouTube ✅
- Component exists and works ✅

**Estimated Time:** 0.5 days (just verification/testing)

---

### 1.4 Add Spotify Audio Links Support
**Files:**
- `frontend/src/pages/SessionDetail.tsx` (MODIFY)
- `frontend/src/pages/admin/AdminSessions.tsx` (MODIFY)

**Requirements:**
- Audio will be Spotify links (not built-in audio player)
- Admins can add Spotify links to sessions
- Users can click to open Spotify links

**Tasks:**
- [ ] Add Spotify URL field to session creation/edit forms
- [ ] Store Spotify URL in `audio_file_url` or new `spotify_url` field
- [ ] Display Spotify link button on session page
- [ ] Open Spotify link in new tab/window
- [ ] Show Spotify embed preview (optional enhancement)

**Database:**
- Can use existing `audio_file_url` field to store Spotify URL
- Or add `spotify_url` field to sessions table (if needed)

**Estimated Time:** 1 day

---

### 1.5 Remove/Defer Features
**Items Removed from Scope:**
- ❌ Audio extraction implementation - User will create separate utility
- ❌ Custom audio player component - Using Spotify links instead
- ❌ Playback speed controls - Not required
- ❌ Keyboard shortcuts - Not required
- ❌ Chapter timestamp jumping - Not required
- ❌ Custom video player controls - Using YouTube embed

**Note:** These items are out of scope per user requirements.

---

## Phase 2: Mentor Dashboard (Week 3) 🔴 **HIGH PRIORITY** - yes we need to create this 

### 2.1 Create Mentor Analytics Dashboard
**File:** `frontend/src/pages/MentorDashboard.tsx` (NEW)

**Tasks:**
- [ ] Create mentor dashboard page (`/mentor/dashboard`)
- [ ] Display analytics:
  - Total views (chart over time)
  - Watch time statistics
  - Top performing sessions
  - Engagement metrics (comments, Q&A)
  - Demographics (if available)
- [ ] Add filters (date range, session selection)
- [ ] Add export functionality (optional)
- [ ] Use charts library (recharts, chart.js)

**Backend APIs Available:**
- `GET /api/mentors/:id/analytics` - Already exists

**Estimated Time:** 3-4 days

**Dependencies:**
- Add route to `frontend/src/App.tsx`
- Add navigation link for mentors

---

### 2.2 Create Mentor Q&A Inbox - yes we need to create this 
**File:** `frontend/src/pages/MentorQAInbox.tsx` (NEW)

**Tasks:**
- [ ] Create Q&A inbox page (`/mentor/qa`)
- [ ] List all unanswered questions for mentor's sessions
- [ ] Show question, session, asker, timestamp
- [ ] Allow mentor to answer questions inline
- [ ] Mark questions as answered
- [ ] Filter by session, answered/unanswered
- [ ] Show notification badge for unanswered count
- [ ] Add email notifications integration (already exists)

**Backend APIs Available:**
- `GET /api/qa/mentor/questions` - Need to create this endpoint
- `POST /api/qa/:id/answer` - Already exists

**Estimated Time:** 2-3 days

**Backend Work Needed:**
- [ ] Create `GET /api/qa/mentor/questions` endpoint
  - Filter questions by mentor's sessions
  - Include session info, asker info
  - Support filters (answered/unanswered)

---

### 2.3 Add Session Management for Mentors  - yes we need to create this 
**File:** `frontend/src/pages/MentorSessions.tsx` (NEW)

**Tasks:**
- [ ] Create mentor session management page (`/mentor/sessions`)
- [ ] List mentor's sessions (already filtered in Sessions page)
- [ ] Add "Create Session" button
- [ ] Add "Edit Session" functionality
- [ ] Show session analytics (views, engagement)
- [ ] Allow triggering AI processing
- [ ] Allow publishing/unpublishing

**Backend APIs Available:**
- `POST /api/sessions` - Already exists (requires mentor role)
- `PUT /api/sessions/:id` - Already exists

**Estimated Time:** 2-3 days

**Note:** Can reuse admin session creation modal, adapted for mentors

---

## Phase 3: Admin Enhancements (Week 4) 🟡 **DEFERRED**

**Status:** User will create separate utility for AI pipeline management and editing. This phase is deferred.

### 3.1 AI Pipeline Management UI - **DEFERRED**
- User will create separate utility for triggering AI processing
- No UI needed in main app

### 3.2 AI Output Editing Interface - **DEFERRED**  
- User will create separate utility for editing AI outputs
- Main app just needs to **display** AI outputs (already implemented)

### 3.3 Short Videos Management UI ✅ **KEEP THIS**
**File:** `frontend/src/pages/admin/AdminSessions.tsx` (MODIFY)

**Tasks:**
- [ ] Add "Manage Short Videos" button on session row
- [ ] Create modal to manage short videos for a session
- [ ] List existing short videos (YouTube shorts links)
- [ ] Add "Add Short Video" form:
  - Title, description
  - YouTube URL (full URL or video ID)
  - Order index
- [ ] Allow reordering (drag & drop or up/down buttons)
- [ ] Allow editing/deleting short videos
- [ ] Preview short videos in embed

**Backend APIs Available:**
- `POST /api/sessions/:id/short-videos` - Already exists ✅
- Need to add: `PUT /api/short-videos/:id`
- Need to add: `DELETE /api/short-videos/:id`

**Estimated Time:** 2-3 days

**Backend Work Needed:**
- [ ] Create update endpoint for short videos
- [ ] Create delete endpoint for short videos

---

### 3.4 Enhanced Admin Analytics Dashboard - **DEFERRED**
- Can be done later if needed
- Basic stats already exist

**Note:** Phase 3 is mostly deferred. Only short videos management is kept.

---

## Phase 4: Certificates & Downloads (Week 5) 🟡 **MEDIUM PRIORITY**

### 4.1 Certificate PDF Generation
**File:** `backend/services/certificate.service.js` (NEW)

**Tasks:**
- [ ] Choose PDF library (pdfkit, puppeteer, jsPDF)
- [ ] Design certificate template
- [ ] Generate PDF with:
  - User name
  - Program title
  - Completion date
  - QR code (image)
  - Certificate number
  - Platform branding
- [ ] Upload PDF to S3
- [ ] Update certificate record with `pdf_url`
- [ ] Return PDF URL

**Dependencies:**
- QR code already generated (uses external API)
- S3 configured for file storage

**Estimated Time:** 3-4 days

**Recommended Library:** `pdfkit` (Node.js native, no browser needed)

---

### 4.2 Certificate Viewing/Downloading UI
**Files:**
- `frontend/src/pages/Certificates.tsx` (NEW)
- `frontend/src/pages/CertificateDetail.tsx` (NEW)

**Tasks:**
- [ ] Create certificates page (`/certificates`)
- [ ] List user's earned certificates
- [ ] Display certificate card with:
  - Program title
  - Completion date
  - QR code preview
  - Download button
- [ ] Create certificate detail page (`/certificates/:id`)
- [ ] Show full certificate with PDF viewer
- [ ] Add download PDF button
- [ ] Add share functionality (optional)

**Backend APIs Available:**
- `GET /api/certificates` - Get user certificates
- `GET /api/certificates/:id` - Get certificate by ID

**Estimated Time:** 2-3 days

---

### 4.3 Certificate Verification Page
**File:** `frontend/src/pages/CertificateVerify.tsx` (NEW)

**Tasks:**
- [ ] Create verification page (`/certificate/verify/:number`)
- [ ] Accept certificate number (from QR code)
- [ ] Verify certificate exists and is valid
- [ ] Display certificate details (name, program, date)
- [ ] Show "Verified" badge
- [ ] Handle invalid/expired certificates

**Backend APIs Needed:**
- [ ] `GET /api/certificates/verify/:number` - Verify certificate

**Estimated Time:** 1 day

---

### 4.4 Offline Download Functionality
**Files:**
- `backend/routes/downloads.routes.js` (NEW)
- `frontend/src/components/DownloadButton.tsx` (NEW)

**Tasks:**
- [ ] Create download endpoints:
  - `GET /api/downloads/audio/:sessionId` - Download audio
  - `GET /api/downloads/video/:sessionId` - Download video (if allowed)
  - `GET /api/downloads/transcript/:sessionId` - Download transcript
- [ ] Check `download_allowed` flag for videos
- [ ] Generate signed URLs (S3 presigned URLs or token-based)
- [ ] Add expiration time for download URLs (24 hours)
- [ ] Create download button component
- [ ] Add download buttons to session page:
  - Audio download (if available)
  - Video download (if allowed)
  - Transcript download
  - Summary download

**Backend Work:**
- [ ] Implement DRM-like token system (JWT tokens with expiration)
- [ ] Track downloads (optional - analytics)

**Estimated Time:** 3-4 days

---

## Phase 5: Remaining Features (Week 6+) 🟢 **LOWER PRIORITY**

### 5.1 Guest Access Improvements
**Files:**
- `frontend/src/pages/GuestCatalog.tsx` (NEW)
- Modify `frontend/src/pages/Sessions.tsx`

**Tasks:**
- [ ] Create guest-accessible catalog page (no login required)
- [ ] Show session previews (first 2 minutes or thumbnail)
- [ ] Limit preview duration in video player
- [ ] Add "Sign up to watch full video" CTAs
- [ ] Allow guest browsing but block full content

**Estimated Time:** 2 days

---

### 5.2 Gamification UI
**Files:**
- `frontend/src/pages/Achievements.tsx` (NEW)
- `frontend/src/components/BadgeDisplay.tsx` (NEW)

**Tasks:**
- [ ] Create achievements/badges page (`/achievements`)
- [ ] Display earned badges
- [ ] Display progress toward unearned badges
- [ ] Show streak counter
- [ ] Add badge notifications (toast when earned)
- [ ] Add badge display to dashboard/profile

**Backend APIs Available:**
- `GET /api/gamification/badges` - Get user badges
- `GET /api/gamification/streak` - Get user streak

**Estimated Time:** 2-3 days

---

### 5.3 Live Sessions Feature
**Files:**
- `backend/services/liveSession.service.js` (NEW)
- `frontend/src/pages/LiveSessions.tsx` (NEW)
- `frontend/src/pages/MentorLiveSessions.tsx` (NEW)

**Tasks:**
- [ ] Create live session database schema (already exists)
- [ ] Create live session service
- [ ] Integrate YouTube Live API or Zoom SDK
- [ ] Create mentor live session scheduling UI
- [ ] Create mentee registration UI
- [ ] Create live session viewing page
- [ ] Add live Q&A box during session
- [ ] Auto-archive replay to mentor's sessions

**Estimated Time:** 1-2 weeks (complex integration)

**Note:** Can be deferred if not immediately needed

---

### 5.4 Corporate/School Plans
**Files:**
- Multiple new files for organization management

**Tasks:**
- [ ] Design organization schema (may need new tables)
- [ ] Create organization management UI
- [ ] Implement bulk licensing
- [ ] Add organization admin roles
- [ ] Add private groups functionality
- [ ] Add organization-specific learning paths
- [ ] Add progress tracking for organizations

**Estimated Time:** 2-3 weeks (major feature)

**Note:** Can be Phase 2 project if not needed initially

---

## Technical Tasks (Cross-Phase)

### Backend API Endpoints Needed

1. **Mentor Q&A Endpoint** ✅ **REQUIRED**
   ```
   GET /api/qa/mentor/questions
   Query params: answered, session_id, limit, offset
   Returns: Questions for mentor's sessions
   ```
   **Status:** Need to create this endpoint

2. **Short Video Update/Delete** ✅ **REQUIRED**
   ```
   PUT /api/short-videos/:id
   Body: { title, description, youtube_video_id, order_index }
   
   DELETE /api/short-videos/:id
   ```
   **Status:** Need to create these endpoints
   **Note:** POST endpoint already exists ✅

3. **Certificate Verification** ✅ **REQUIRED**
   ```
   GET /api/certificates/verify/:number
   Returns: Certificate details if valid
   ```
   **Status:** Need to create this endpoint

4. **Download Endpoints** ✅ **REQUIRED**
   ```
   GET /api/downloads/transcript/:sessionId (with token)
   GET /api/downloads/summary/:sessionId (with token)
   ```
   **Status:** Need to create these endpoints
   **Note:** Audio/video downloads not needed (using Spotify/YouTube links)

### Backend API Endpoints - REMOVED FROM SCOPE

❌ **AI Content Update/Approve Endpoints** - Not needed (user creating separate utility)  
❌ **Enhanced Admin Analytics** - Deferred for now

---

## Dependencies & Prerequisites

### External Services Needed
- [ ] S3 bucket configured (for certificate PDFs and transcripts/summaries)
- [ ] QR code service (already using external API - fine) ✅
- ✅ YouTube (for video hosting) - Already using
- ✅ Spotify (for audio links) - Just need to add links

### Libraries to Install

**Frontend:**
- [ ] `recharts` or `chart.js` - For mentor analytics charts
- [ ] `react-player` - Already installed ✅ (for YouTube embeds)
- [ ] `react-beautiful-dnd` - For drag & drop (short videos reordering) - Optional

**Backend:**
- [ ] `pdfkit` or `puppeteer` - For certificate PDF generation
- [ ] `aws-sdk` - For S3 uploads (if not already) - For certificate PDFs

### Libraries Removed from Scope
- ❌ `fluent-ffmpeg` - Not needed (no audio extraction)
- ❌ `@ffmpeg/ffmpeg` - Not needed (no audio extraction)
- ❌ `@tiptap/react` or `react-quill` - Not needed (no AI editing UI)

---

## Testing Requirements

### For Each Phase:

**Unit Tests:**
- [ ] Test new components
- [ ] Test new service functions
- [ ] Test new API endpoints

**Integration Tests:**
- [ ] Test complete user flows
- [ ] Test mentor dashboard workflows
- [ ] Test admin AI pipeline workflows

**E2E Tests:**
- [ ] Test YouTube video embed functionality
- [ ] Test short videos display and navigation
- [ ] Test chapter navigation (mentor's other sessions)
- [ ] Test mentor Q&A workflow
- [ ] Test certificate generation and download
- [ ] Test Spotify link access

---

## Success Metrics

### Phase 1 (Player Experience - Simplified)
- ✅ Users can see and click YouTube short videos
- ✅ Users can navigate between mentor's videos (chapters)
- ✅ Users can access Spotify audio links
- ✅ YouTube videos embed correctly

### Phase 2 (Mentor Dashboard)
- ✅ Mentors can view analytics
- ✅ Mentors can answer questions from inbox
- ✅ Mentors can manage their sessions

### Phase 3 (Admin - Short Videos Only)
- ✅ Admins can add/edit/delete YouTube shorts links
- ✅ Admins can reorder short videos

### Phase 4 (Certificates & Downloads)
- ✅ Certificates can be downloaded as PDF
- ✅ Users can download transcripts/summaries offline
- ✅ Certificates can be verified via QR code

---

## Risk Assessment

### High Risk Items
1. **PDF Generation** - Formatting challenges
2. **Live Sessions** - Third-party API integration complexity (deferred)

### Medium Risk Items
1. **Offline Downloads** - Security/token management

### Low Risk Items
1. **Short Videos Management** - Straightforward CRUD with YouTube links
2. **Chapter Navigation** - Just linking to other session pages
3. **Mentor Dashboard** - Backend APIs exist
4. **Certificates UI** - Straightforward CRUD
5. **Gamification UI** - Backend complete

**Note:** Risk reduced significantly since no custom video/audio player needed

---

## Quick Wins (Can Do First)

1. **Mentor Q&A Inbox** - Backend exists, just needs UI (2-3 days)
2. **Chapter Navigation** (Mentor's Other Sessions) - Backend exists, just needs UI (1-2 days)
3. **Short Videos Display** - Backend exists, just needs UI to show YouTube shorts links (1 day)
4. **Badge Display** - Backend complete, just needs UI (2 days)

**Recommendation:** Start with Quick Wins to build momentum, then tackle Phase 1.

---

## Estimated Timeline Summary (REVISED)

- **Phase 1:** 1 week (Core Player Experience - simplified)
  - Short videos management UI
  - Chapter navigation (mentor's other sessions)
  - Spotify links support
  - YouTube embed verification
- **Phase 2:** 1 week (Mentor Dashboard)
  - Analytics dashboard
  - Q&A inbox
  - Session management
- **Phase 3:** 0.5 week (Admin - Short Videos Management only)
  - Short videos CRUD UI
- **Phase 4:** 1 week (Certificates & Downloads)
  - Certificate PDF generation
  - Certificate UI
  - Download functionality
- **Phase 5:** 2+ weeks (Remaining Features - optional)
  - Guest access
  - Gamification UI
  - Live sessions (if needed)

**Total:** 3.5-4 weeks for core features (Phases 1-4, simplified)

**Note:** Timeline reduced because:
- No custom video player features needed
- No audio extraction/player needed
- AI pipeline management deferred
- Focus on YouTube/Spotify link management only

---

## Summary of Changes from Original Plan

### ✅ Kept in Scope
1. **Short Videos Management** - YouTube shorts links that admins can add
2. **Chapter Navigation** - Navigate between mentor's different sessions
3. **Mentor Dashboard** - Analytics, Q&A inbox, session management
4. **Certificates & Downloads** - PDF generation, verification, transcript downloads
5. **Spotify Audio Links** - Simple link support (not custom player)

### ❌ Removed from Scope
1. **Audio Extraction** - User will create separate utility
2. **Custom Audio Player** - Using Spotify links instead
3. **Playback Speed Controls** - Not required
4. **Keyboard Shortcuts** - Not required
5. **Chapter Timestamp Jumping** - Not required
6. **AI Pipeline Management UI** - User will create separate utility
7. **AI Output Editing UI** - User will create separate utility, app just displays
8. **Custom Video Player Controls** - Using YouTube embed (ReactPlayer)

### 🔄 Clarified Understanding
- **Videos = YouTube embeds** (leverage YouTube, don't build custom player)
- **Chapters = Separate mentor sessions** (not video segments)
- **Short Videos = YouTube shorts links** (admins add multiple per session)
- **Audio = Spotify links** (not custom player)

### 📊 Timeline Impact
- **Original:** 5-7 weeks
- **Revised:** 3.5-4 weeks
- **Reduction:** ~40% faster due to simplified scope

---

## Next Steps

1. **Review this revised plan** - Confirm scope matches requirements
2. **Prioritize phases** - Start with Quick Wins for momentum
3. **Set up development environment** - Install required libraries
4. **Create detailed task breakdowns** - Break Phase 1 into smaller tasks
5. **Start with Quick Wins** - Mentor Q&A inbox, short videos display
6. **Begin Phase 1** - Short videos management and chapter navigation

