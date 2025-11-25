import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { escapeHtml } from '../utils/htmlEscape.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'noreply@mentorplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Resend client
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  logger.warn('RESEND_API_KEY not configured. Email service disabled.');
}

/**
 * Send email using Resend
 */
const sendEmail = async (to, subject, html, text = null) => {
  if (!resend) {
    logger.warn('Email service not configured. Skipping email send.', { to, subject });
    return;
  }

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    });

    logger.info('Email sent successfully', {
      to,
      subject,
      emailId: result.id,
      provider: 'resend',
    });

    return result;
  } catch (error) {
    logger.error('Error sending email via Resend', error, {
      to,
      subject,
      provider: 'resend',
    });
    throw error;
  }
};

/**
 * Welcome email template
 */
export const sendWelcomeEmail = async (email, name, confirmationUrl) => {
  const subject = '🎉 Welcome to Mentor Platform!';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Mentor Platform! 🎓</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p>Thank you for joining Mentor Platform! We're excited to have you on this learning journey.</p>
            <p>Your account has been successfully created. Please confirm your email address to get started:</p>
            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you have any questions, feel free to reach out to us.</p>
            <p>Happy learning!<br>The Mentor Platform Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mentor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${name},\n\nThank you for joining Mentor Platform! We're excited to have you on this learning journey.\n\nYour account has been successfully created. Please confirm your email address by visiting:\n\n${confirmationUrl}\n\nThis link will expire in 24 hours.\n\nHappy learning!\nThe Mentor Platform Team`;

  return await sendEmail(email, subject, html, text);
};

/**
 * Subscription confirmation email
 */
export const sendSubscriptionConfirmationEmail = async (email, name, planType, amount) => {
  const subject = '✅ Subscription Confirmed - Mentor Platform';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p>Your subscription to Mentor Platform has been confirmed!</p>
            <p><strong>Plan:</strong> ${escapeHtml(planType)}</p>
            <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
            <p>You now have full access to all content on the platform.</p>
            <div style="text-align: center;">
              <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <p>If you have any questions, feel free to reach out to us.</p>
            <p>Happy learning!<br>The Mentor Platform Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mentor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

/**
 * New mentor/session notification email
 */
export const sendNewContentNotificationEmail = async (email, name, contentTitle, contentType = 'session') => {
  const subject = `📚 New ${contentType === 'session' ? 'Session' : 'Content'} Available - Mentor Platform`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Content Available! 📚</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p>We have exciting news! A new ${contentType === 'session' ? 'session' : 'content'} is now available:</p>
            <p style="font-size: 18px; font-weight: bold;">${escapeHtml(contentTitle)}</p>
            <div style="text-align: center;">
              <a href="${FRONTEND_URL}/sessions" class="button">View ${contentType === 'session' ? 'Session' : 'Content'}</a>
            </div>
            <p>Happy learning!<br>The Mentor Platform Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mentor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

/**
 * Certificate award email
 */
export const sendCertificateEmail = async (email, name, certificateUrl, learningPathTitle) => {
  const subject = '🏆 Certificate of Completion - Mentor Platform';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Congratulations! 🏆</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p>Congratulations! You have successfully completed the learning path:</p>
            <p style="font-size: 18px; font-weight: bold;">${escapeHtml(learningPathTitle)}</p>
            <p>Your certificate is ready for download!</p>
            <div style="text-align: center;">
              <a href="${certificateUrl}" class="button">Download Certificate</a>
            </div>
            <p>Keep up the great work!<br>The Mentor Platform Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mentor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

/**
 * Mentor answer notification email
 */
export const sendMentorAnswerEmail = async (email, name, mentorName, questionText, answerUrl) => {
  const subject = `💬 ${mentorName} answered your question - Mentor Platform`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You Got an Answer! 💬</h1>
          </div>
          <div class="content">
            <p>Hi ${escapeHtml(name)},</p>
            <p><strong>${escapeHtml(mentorName)}</strong> has answered your question:</p>
            <p style="font-style: italic; background: #fff; padding: 15px; border-left: 3px solid #667eea;">${escapeHtml(questionText)}</p>
            <div style="text-align: center;">
              <a href="${answerUrl}" class="button">View Answer</a>
            </div>
            <p>The Mentor Platform Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Mentor Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

export const emailService = {
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
  sendNewContentNotificationEmail,
  sendCertificateEmail,
  sendMentorAnswerEmail,
};

