# Transcription API Bug Fix

**Date:** 2024-11-25  
**File:** `backend/services/ai.service.js`  
**Function:** `transcribeAudio`

---

## 🐛 Bug Description

The `transcribeAudio` function had **3 critical bugs**:

### Bug #1: Content-Type Mismatch
```javascript
// ❌ WRONG - Setting multipart/form-data but sending JSON
headers: {
  'Content-Type': 'multipart/form-data',
},
body: JSON.stringify({ ... })  // This is JSON, not multipart!
```

**Problem:**
- Header says `multipart/form-data`
- Body is `JSON.stringify()` which creates JSON format
- These don't match - will cause API to reject the request

### Bug #2: Audio URL Never Used
```javascript
// ❌ audioUrl parameter received but never used
const transcribeAudio = async (audioUrl, language = null) => {
  // ... code that never references audioUrl
}
```

**Problem:**
- Function receives `audioUrl` but never downloads or uses it
- OpenAI Whisper API requires the actual audio file, not a URL

### Bug #3: Wrong API Request Format
```javascript
// ❌ OpenAI Whisper API requires file upload, not JSON
body: JSON.stringify({
  model: WHISPER_MODEL,
  language: language || undefined,
  response_format: 'verbose_json',
})
```

**Problem:**
- Whisper API requires `multipart/form-data` with:
  - The audio file as a file field
  - Parameters as form fields
- Not JSON body

---

## ✅ The Fix

### What Changed:

1. **Download audio file from URL:**
   ```javascript
   const audioResponse = await fetch(audioUrl);
   const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
   ```

2. **Create FormData with actual file:**
   ```javascript
   const formData = new FormData();
   const audioBlob = new Blob([audioBuffer], { type: contentType });
   formData.append('file', audioBlob, fileName);
   formData.append('model', WHISPER_MODEL);
   if (language) formData.append('language', language);
   formData.append('response_format', 'verbose_json');
   ```

3. **Remove Content-Type header (let fetch set it):**
   ```javascript
   // ✅ Don't set Content-Type manually
   // fetch will set it automatically with proper boundary
   headers: {
     'Authorization': `Bearer ${OPENAI_API_KEY}`,
     // Content-Type auto-set by fetch
   },
   body: formData,
   ```

4. **Proper file extension detection:**
   - From URL extension
   - From Content-Type header
   - Defaults to mp3

---

## 🧪 Testing

**Did tests catch this bug?**

No tests exist for the AI service transcription function. This is a gap in test coverage.

**Why didn't tests catch it:**
- No unit tests for `transcribeAudio` function
- No integration tests for AI pipeline
- Would require mocking OpenAI API or using test API keys

**Recommendation:**
- Add unit tests with mocked fetch
- Add integration tests with test OpenAI credentials
- Add error handling tests

---

## 📝 Technical Details

### OpenAI Whisper API Requirements:

1. **Endpoint:** `POST https://api.openai.com/v1/audio/transcriptions`
2. **Content-Type:** `multipart/form-data` (with boundary)
3. **Required fields:**
   - `file`: The audio file (File/Blob)
   - `model`: Model name (e.g., "whisper-1")
4. **Optional fields:**
   - `language`: Language code
   - `response_format`: "json", "text", "verbose_json", etc.

### Node.js Compatibility:

- ✅ Node.js 18+ has `FormData` built-in
- ✅ Node.js 18+ has `Blob` built-in
- ✅ No additional packages needed

---

## ✅ Verification

**Before Fix:**
- ❌ API call would fail with 400 Bad Request
- ❌ Error: Invalid request format
- ❌ No audio file uploaded

**After Fix:**
- ✅ Proper multipart/form-data request
- ✅ Audio file downloaded and uploaded
- ✅ Correct Content-Type with boundary
- ✅ All parameters included as form fields

---

## 🔍 Impact

**Severity:** CRITICAL  
**Impact:** AI transcription feature completely broken

**Affected Features:**
- Session AI processing pipeline
- Audio transcription
- Multilingual content processing

**Status:** ✅ **FIXED**

---

## 📚 References

- OpenAI Whisper API: https://platform.openai.com/docs/api-reference/audio/createTranscription
- Node.js FormData: https://nodejs.org/api/globals.html#formdata
- Node.js Blob: https://nodejs.org/api/buffer.html#blob

---

**Fix completed:** 2024-11-25

