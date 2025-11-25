import { query, getClient } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-1';

/**
 * Extract audio from video URL (placeholder - implement with ffmpeg or similar)
 */
const extractAudioFromVideo = async (videoUrl) => {
  // TODO: Implement audio extraction using ffmpeg or cloud service
  // For now, return the video URL as placeholder
  logger.warn('Audio extraction not implemented yet', { videoUrl });
  return videoUrl;
};

/**
 * Transcribe audio using Whisper API
 * 
 * Bug Fix: Previous implementation had incorrect Content-Type and body format.
 * OpenAI Whisper API requires multipart/form-data with the actual audio file.
 */
const transcribeAudio = async (audioUrl, language = null) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (!audioUrl) {
    throw new Error('Audio URL is required for transcription');
  }

  try {
    // Download the audio file from URL
    logger.info('Downloading audio file for transcription', { audioUrl });
    const audioResponse = await fetch(audioUrl);
    
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    // Get the audio file as a buffer
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    // Determine file extension from URL or Content-Type
    const contentType = audioResponse.headers.get('content-type') || '';
    let fileExtension = 'mp3'; // default
    let fileName = 'audio.mp3';
    
    if (audioUrl.match(/\.(mp3|m4a|wav|webm|ogg|flac|mp4)$/i)) {
      fileExtension = audioUrl.match(/\.([^.]+)$/i)[1].toLowerCase();
      fileName = `audio.${fileExtension}`;
    } else if (contentType.includes('audio/mpeg')) {
      fileExtension = 'mp3';
      fileName = 'audio.mp3';
    } else if (contentType.includes('audio/mp4')) {
      fileExtension = 'm4a';
      fileName = 'audio.m4a';
    } else if (contentType.includes('audio/wav')) {
      fileExtension = 'wav';
      fileName = 'audio.wav';
    } else if (contentType.includes('audio/webm')) {
      fileExtension = 'webm';
      fileName = 'audio.webm';
    }

    // Create FormData for multipart/form-data upload
    // Node.js 18+ has FormData built-in
    const FormData = globalThis.FormData;
    const formData = new FormData();
    
    // Create a Blob from the buffer and append it to FormData
    // In Node.js, we can append a Blob directly
    const audioBlob = new Blob([audioBuffer], { 
      type: contentType || `audio/${fileExtension}` 
    });
    
    formData.append('file', audioBlob, fileName);
    formData.append('model', WHISPER_MODEL);
    
    if (language) {
      formData.append('language', language);
    }
    
    formData.append('response_format', 'verbose_json');

    // Send the request with FormData
    // Don't set Content-Type header manually - fetch will set it automatically with the boundary
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        // Content-Type will be set automatically by fetch with proper boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Whisper API error response', { 
        status: response.status, 
        error: errorText,
        audioUrl 
      });
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    logger.info('Transcription successful', { 
      audioUrl, 
      language,
      textLength: result.text?.length || 0,
      segments: result.segments?.length || 0
    });
    return result;
  } catch (error) {
    logger.error('Transcription error', error, { audioUrl, language });
    throw error;
  }
};

/**
 * Translate text to English using OpenAI
 */
const translateToEnglish = async (text, sourceLanguage) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLanguage} to English. Maintain the original meaning and tone.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Translation API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    logger.error('Translation error', error, { sourceLanguage });
    throw error;
  }
};

/**
 * Generate summary using OpenAI
 */
const generateSummary = async (transcript) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a content summarizer. Create a concise, informative summary (2-3 paragraphs) of the following transcript.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Summary API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    logger.error('Summary generation error', error);
    throw error;
  }
};

/**
 * Extract key learnings using OpenAI
 */
const extractKeyLearnings = async (transcript) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract 5-10 key learnings or insights from the following transcript. Return as a JSON array of strings, each learning should be a concise bullet point.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Key learnings API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    return parsed.learnings || [];
  } catch (error) {
    logger.error('Key learnings extraction error', error);
    throw error;
  }
};

/**
 * Segment transcript into chapters
 */
const segmentChapters = async (transcript, segments) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze the transcript and identify logical chapter breaks. Return as JSON array with {title, start_time, end_time} objects.',
          },
          {
            role: 'user',
            content: `Transcript: ${transcript}\n\nSegments with timestamps: ${JSON.stringify(segments)}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chapter segmentation API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    return parsed.chapters || [];
  } catch (error) {
    logger.error('Chapter segmentation error', error);
    throw error;
  }
};

/**
 * Auto-tag content based on transcript
 */
const autoTagContent = async (transcript, title) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze the content and suggest 3-5 relevant topic tags. Return as JSON array of strings.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nTranscript: ${transcript.substring(0, 1000)}...`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Auto-tagging API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);
    return parsed.tags || [];
  } catch (error) {
    logger.error('Auto-tagging error', error);
    throw error;
  }
};

/**
 * Process session through AI pipeline
 */
export const processSessionAI = async (sessionId, options = {}) => {
  try {
    logger.info('Starting AI processing for session', { sessionId });

    // Get session
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionResult.rows[0];
    const language = session.language || 'en';

    // Step 1: Extract audio (if needed)
    let audioUrl = session.audio_file_url;
    if (!audioUrl && session.main_video_url) {
      audioUrl = await extractAudioFromVideo(session.main_video_url);
    }

    if (!audioUrl) {
      throw new Error('No audio source available for transcription');
    }

    // Step 2: Transcribe audio
    logger.info('Transcribing audio', { sessionId, language });
    const transcription = await transcribeAudio(audioUrl, language);
    const originalTranscript = transcription.text;
    const segments = transcription.segments || [];

    // Store original transcript
    await query(
      `INSERT INTO ai_content (id, session_id, content_type, content, language)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, content_type) 
       DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP`,
      [
        uuidv4(),
        sessionId,
        'transcript_original',
        JSON.stringify({ text: originalTranscript, segments }),
        language,
      ]
    );

    // Step 3: Translate to English (if not already English)
    let englishTranscript = originalTranscript;
    if (language !== 'en' && language !== 'english') {
      logger.info('Translating to English', { sessionId, sourceLanguage: language });
      englishTranscript = await translateToEnglish(originalTranscript, language);

      // Store English translation
      await query(
        `INSERT INTO ai_content (id, session_id, content_type, content, language)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (session_id, content_type) 
         DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP`,
        [
          uuidv4(),
          sessionId,
          'transcript_english',
          JSON.stringify({ text: englishTranscript }),
          'en',
        ]
      );
    }

    // Step 4: Generate summary
    logger.info('Generating summary', { sessionId });
    const summary = await generateSummary(englishTranscript);
    await query(
      `INSERT INTO ai_content (id, session_id, content_type, content, language)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, content_type) 
       DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP`,
      [
        uuidv4(),
        sessionId,
        'summary',
        JSON.stringify({ text: summary }),
        'en',
      ]
    );

    // Step 5: Extract key learnings
    logger.info('Extracting key learnings', { sessionId });
    const keyLearnings = await extractKeyLearnings(englishTranscript);
    await query(
      `INSERT INTO ai_content (id, session_id, content_type, content, language)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, content_type) 
       DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP`,
      [
        uuidv4(),
        sessionId,
        'key_learnings',
        JSON.stringify({ learnings: keyLearnings }),
        'en',
      ]
    );

    // Step 6: Segment chapters
    logger.info('Segmenting chapters', { sessionId });
    const chapters = await segmentChapters(englishTranscript, segments);
    
    // Store chapters in chapters table
    await query('DELETE FROM chapters WHERE session_id = $1', [sessionId]);
    for (const chapter of chapters) {
      await query(
        `INSERT INTO chapters (id, session_id, title, start_time, end_time, order_index)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          sessionId,
          chapter.title,
          chapter.start_time,
          chapter.end_time,
          chapter.order_index || 0,
        ]
      );
    }

    // Step 7: Auto-tag
    logger.info('Auto-tagging content', { sessionId });
    const tags = await autoTagContent(englishTranscript, session.title);
    
    // Update session topics if tags are available
    if (tags && tags.length > 0) {
      // Store as auto_tags in ai_content
      await query(
        `INSERT INTO ai_content (id, session_id, content_type, content, language)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (session_id, content_type) 
         DO UPDATE SET content = $4, updated_at = CURRENT_TIMESTAMP`,
        [
          uuidv4(),
          sessionId,
          'auto_tags',
          JSON.stringify({ tags }),
          'en',
        ]
      );
    }

    logger.info('AI processing completed', { sessionId });

    return {
      success: true,
      sessionId,
      processed: {
        transcript_original: !!originalTranscript,
        transcript_english: language !== 'en',
        summary: !!summary,
        key_learnings: keyLearnings.length,
        chapters: chapters.length,
        auto_tags: tags.length,
      },
    };
  } catch (error) {
    logger.error('AI processing error', error, { sessionId });
    throw error;
  }
};

/**
 * Get AI content for a session
 */
export const getAIContent = async (sessionId) => {
  try {
    const result = await query(
      'SELECT * FROM ai_content WHERE session_id = $1 ORDER BY processed_at DESC',
      [sessionId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get AI content error', error, { sessionId });
    throw error;
  }
};

export default {
  processSessionAI,
  getAIContent,
};

