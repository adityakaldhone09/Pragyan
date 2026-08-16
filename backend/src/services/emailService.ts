import nodemailer from 'nodemailer';
import { config } from '@/config/env';

const SMTP_TIMEOUT_MS = 8_000;

function isTimeoutError(error: unknown) {
  return error instanceof Error && /timed? out/i.test(error.message);
}

function createTransporter() {
  const { host, port, user, password } = config.email;

  if (!host || !user || !password) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user,
      pass: password,
    },
  });
}

async function sendWithTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Escape HTML special chars to prevent XSS in email templates */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Convert integer rating to filled/empty star HTML */
function buildStars(rating: number): string {
  const filled = '&#9733;'; // â˜…
  const empty  = '&#9734;'; // â˜†
  return [1, 2, 3, 4, 5]
    .map((n) => `<span style="color:${n <= rating ? '#f59e0b' : '#d1d5db'};font-size:18px;">${n <= rating ? filled : empty}</span>`)
    .join('');
}

/** Short human-readable reference ID from MongoDB ObjectId */
function buildRefId(id: string): string {
  const hex = id.replace(/[^a-f0-9]/gi, '').toUpperCase();
  return `FB-${hex.slice(0, 8).toUpperCase()}`;
}

/** Format a Date or ISO string for display in emails */
function formatEmailDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function buildPasswordResetHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset Your Password</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8edf7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0e1a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:rgba(15,23,42,0.95);border:1px solid rgba(139,92,246,0.25);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px;text-align:center;background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);">
                <h1 style="margin:0;font-size:28px;color:#ffffff;">Pragyan</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h2 style="margin:0 0 12px;font-size:22px;color:#ffffff;">Reset Your Password</h2>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                  Use the verification code below to reset your Pragyan account password.
                </p>
                <div style="margin:0 0 24px;padding:20px;border-radius:12px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.25);text-align:center;">
                  <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#ffffff;">${otp}</span>
                </div>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">
                  This code is valid for <strong style="color:#06b6d4;">10 minutes</strong>.
                  If you did not request a password reset, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function buildFeedbackAdminHtml(feedback: any, user: any) {
  const imageBlock = feedback.imageUrl || feedback.screenshotUrl
    ? `<p><strong>Image:</strong> ${feedback.imageUrl || feedback.screenshotUrl}</p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="font-family:Arial,sans-serif;background:#f7f8fc;padding:24px;color:#0f172a;">
    <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <h2 style="margin:0 0 12px;color:#4f46e5;">New Feedback Received - Pragyan</h2>
      <p>A new feedback has been submitted.</p>
      <p><strong>User:</strong> ${user?.fullName || 'Unknown'}<br />
      <strong>Email:</strong> ${user?.email || 'Not provided'}</p>
      <p><strong>Category:</strong> ${feedback.category}<br />
      <strong>Rating:</strong> ${feedback.rating}/5<br />
      <strong>Priority:</strong> ${feedback.priority}<br />
      <strong>Title:</strong> ${feedback.title}</p>
      <p><strong>Description:</strong><br />${feedback.description}</p>
      ${imageBlock}
      <p><strong>Submission Time:</strong> ${new Date(feedback.createdAt).toLocaleString()}</p>
      <p>View in Admin Dashboard</p>
    </div>
  </body>
</html>
  `.trim();
}

function buildFeedbackUserHtml(feedback: any, user: any): string {
  const refId      = buildRefId(String(feedback.id ?? ''));
  const firstName  = esc((user?.firstName || (user?.fullName ?? '').split(' ')[0]) || 'there');
  const category   = esc(feedback.category ?? 'General');
  const priority   = esc(feedback.priority ?? 'Medium');
  const title      = esc(feedback.title    ?? '');
  const desc       = esc(feedback.description ?? '');
  const submitted  = formatEmailDate(feedback.createdAt ?? new Date());
  const stars      = buildStars(Number(feedback.rating) || 0);
  const supportEmail = process.env.SUPPORT_EMAIL || config.email.user || 'support@pragyan.ai';

  // Priority badge colour
  const priorityColor = priority === 'High' ? '#ef4444' : priority === 'Low' ? '#22c55e' : '#f59e0b';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Thank You for Your Feedback â€“ Pragyan</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">

        <!-- â”€â”€ HEADER â”€â”€ -->
        <tr><td style="background:linear-gradient(135deg,#6d28d9 0%,#4f46e5 50%,#0ea5e9 100%);border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Pragyan</h1>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1.5px;text-transform:uppercase;">AI Career Intelligence Platform</p>
        </td></tr>

        <!-- â”€â”€ BODY â”€â”€ -->
        <tr><td style="background:#ffffff;padding:36px 36px 28px;">

          <!-- Greeting -->
          <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f172a;">Hello, ${firstName} ðŸ‘‹</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">
            Thank you for taking the time to share your feedback with us. We have successfully received your submission and our team will review it as soon as possible.
          </p>

          <!-- Reference badge -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:13px;color:#64748b;font-weight:500;">Reference ID</span>
            <span style="display:inline-block;margin-left:auto;background:#4f46e5;color:#fff;font-size:13px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">${refId}</span>
          </div>

          <!-- Feedback summary card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
            style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <tr><td style="background:#f8fafc;padding:12px 20px;border-bottom:1px solid #e2e8f0;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Feedback Summary</span>
            </td></tr>

            <tr><td style="padding:0;">
              <!-- Category row -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;width:40%;font-weight:500;">Category</td>
                  <td style="padding:12px 20px;font-size:13px;color:#0f172a;font-weight:600;">${category}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;background:#fafafa;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:500;">Rating</td>
                  <td style="padding:12px 20px;">${stars}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:500;">Priority</td>
                  <td style="padding:12px 20px;">
                    <span style="display:inline-block;background:${priorityColor}1a;color:${priorityColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${priority}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;background:#fafafa;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:500;">Title</td>
                  <td style="padding:12px 20px;font-size:13px;color:#0f172a;font-weight:600;">${title}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Description</td>
                  <td style="padding:12px 20px;font-size:13px;color:#334155;line-height:1.6;">${desc}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;font-size:13px;color:#64748b;font-weight:500;">Submitted</td>
                  <td style="padding:12px 20px;font-size:13px;color:#0f172a;">${submitted}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Closing message -->
          <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#475569;">
            Your feedback helps us continuously improve Pragyan and deliver a better experience for all users. We appreciate your support.
          </p>
          <p style="margin:0;font-size:15px;color:#475569;">â€” <strong style="color:#0f172a;">Team Pragyan</strong></p>
        </td></tr>

        <!-- â”€â”€ FOOTER â”€â”€ -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:#64748b;">
            Need help? Contact us at
            <a href="mailto:${esc(supportEmail)}" style="color:#4f46e5;text-decoration:none;font-weight:500;">${esc(supportEmail)}</a>
          </p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">
            This is an automated message. Please do not reply to this email directly.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

async function sendMailWithFallback(to: string, subject: string, html: string, text: string) {
  const transporter = createTransporter();
  const from = config.email.from || config.email.user;

  if (!transporter || !from) {
    if (config.nodeEnv !== 'production') {
      console.warn(`[emailService] Email not configured. Skipping email to ${to}`);
      return;
    }
    throw new Error('Email service is not configured');
  }

  try {
    await sendWithTimeout(
      transporter.sendMail({ from, to, subject, html, text }),
      SMTP_TIMEOUT_MS,
      'Email delivery timed out'
    );
  } catch (error) {
    if (config.nodeEnv !== 'production') {
      console.warn(`[emailService] Failed to send email to ${to}:`, error instanceof Error ? error.message : error);
      return;
    }
    throw error;
  }
}

export async function sendFeedbackSubmissionAdminEmail(
  feedback: any,
  user?: any,
): Promise<{ sent: boolean; error?: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || config.email.user || '';
  if (!adminEmail) {
    console.warn('[emailService] ADMIN_EMAIL not configured â€” skipping admin notification');
    return { sent: false, error: 'Admin email not configured' };
  }

  try {
    await sendMailWithFallback(
      adminEmail,
      'New Feedback Received â€“ Pragyan',
      buildFeedbackAdminHtml(feedback, user),
      `New feedback submitted.\nUser: ${user?.fullName || 'Unknown'}\nEmail: ${user?.email || 'N/A'}\nCategory: ${feedback.category}\nRating: ${feedback.rating}/5\nPriority: ${feedback.priority}\nTitle: ${feedback.title}\n\n${feedback.description}`,
    );
    console.info(`[emailService] âœ“ Admin notification sent to ${adminEmail} for feedback ${feedback.id}`);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[emailService] âœ— Admin notification failed for feedback ${feedback.id}:`, message);
    return { sent: false, error: message };
  }
}

export async function sendFeedbackSubmissionUserEmail(
  feedback: any,
  user?: any,
): Promise<{ sent: boolean; error?: string }> {
  if (!user?.email) {
    console.warn('[emailService] sendFeedbackSubmissionUserEmail: no user email, skipping');
    return { sent: false, error: 'No user email address available' };
  }

  const refId     = buildRefId(String(feedback.id ?? ''));
  const firstName = (user?.firstName || (user?.fullName ?? '').split(' ')[0]) || 'there';

  const plainText = [
    `Hello ${firstName},`,
    '',
    'Thank you for sharing your feedback with Pragyan.',
    'We have successfully received your submission and our team will review it shortly.',
    '',
    'â”€â”€â”€ Feedback Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€',
    `Reference ID : ${refId}`,
    `Category     : ${feedback.category ?? ''}`,
    `Rating       : ${feedback.rating ?? 0}/5`,
    `Priority     : ${feedback.priority ?? 'Medium'}`,
    `Title        : ${feedback.title ?? ''}`,
    `Description  : ${feedback.description ?? ''}`,
    `Submitted    : ${formatEmailDate(feedback.createdAt ?? new Date())}`,
    'â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€',
    '',
    'Your feedback helps us improve Pragyan for everyone. We appreciate your support.',
    '',
    'â€” Team Pragyan',
    '',
    'This is an automated message. Please do not reply directly.',
  ].join('\n');

  try {
    await sendMailWithFallback(
      user.email,
      'Thank You for Your Feedback â€“ Pragyan',
      buildFeedbackUserHtml(feedback, user),
      plainText,
    );
    console.info(`[emailService] âœ“ Confirmation email sent to ${user.email} for feedback ${feedback.id}`);
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[emailService] âœ— Failed to send confirmation email to ${user.email}:`, message);
    return { sent: false, error: message };
  }
}

export function buildEmailVerificationHtml(fullName: string, verificationLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8edf7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0e1a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:rgba(15,23,42,0.95);border:1px solid rgba(139,92,246,0.25);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 28px;text-align:center;background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);">
                <h1 style="margin:0;font-size:28px;color:#ffffff;">Pragyan AI</h1>
                <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Your Career Guide</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <h2 style="margin:0 0 16px;font-size:22px;color:#e8edf7;">Welcome, ${esc(fullName)}! ðŸŽ‰</h2>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5e1;">
                  Thank you for signing up for Pragyan AI. To get started, please verify your email address by clicking the button below:
                </p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="${esc(verificationLink)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
                    Verify Email Address
                  </a>
                </div>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
                <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
                  This verification link expires in 24 hours.
                </p>
                <div style="margin:24px 0 0;padding:16px;background:rgba(139,92,246,0.1);border-left:3px solid #8b5cf6;border-radius:4px;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#cbd5e1;">
                    <strong>Alternative:</strong> If the button doesn't work, copy and paste this link into your browser:<br/>
                    <a href="${esc(verificationLink)}" style="color:#8b5cf6;word-break:break-all;">${esc(verificationLink)}</a>
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid rgba(139,92,246,0.2);text-align:center;">
                <p style="margin:0;font-size:12px;color:#64748b;">
                  Â© ${new Date().getFullYear()} Pragyan AI. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

async function sendVerificationEmail(email: string, fullName: string, verificationLink: string) {
  const transporter = createTransporter();
  const from = config.email.from || config.email.user;

  // Always log the link so it is visible in Render logs even if SMTP is not configured
  console.info(`[emailService] Verification link for ${email}: ${verificationLink}`);

  if (!transporter || !from) {
    console.error('[emailService] EMAIL_* env vars not configured â€” cannot send verification email.');
    console.error('[emailService] Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM on your server.');
    // Do NOT throw â€” registration must still succeed when SMTP is unconfigured
    return;
  }

  try {
    await sendWithTimeout(
      transporter.sendMail({
        from,
        to: email,
        subject: 'Pragyan AI - Verify Your Email Address',
        html: buildEmailVerificationHtml(fullName, verificationLink),
        text: `Welcome to Pragyan AI, ${fullName}!\n\nPlease verify your email address by clicking this link:\n${verificationLink}\n\nThis link expires in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.`,
      }),
      SMTP_TIMEOUT_MS,
      'Email verification delivery timed out'
    );
    console.info(`[emailService] Verification email sent successfully to ${email}`);
  } catch (error) {
    // Log SMTP errors always so they appear in production logs
    console.error(`[emailService] SMTP error sending verification email to ${email}:`, error instanceof Error ? error.message : error);
    console.error(`[emailService] Manual fallback verification link: ${verificationLink}`);
    // Do NOT throw â€” registration must succeed even if email fails
  }
}

async function sendPasswordResetOTP(email: string, otp: string) {
  const transporter = createTransporter();
  const from = config.email.from || config.email.user;

  if (!transporter || !from) {
    if (config.nodeEnv !== 'production') {
      console.warn(`[emailService] Email not configured. Password reset OTP for ${email}: ${otp}`);
      return;
    }

    throw new Error('Email service is not configured');
  }

  try {
    await sendWithTimeout(
      transporter.sendMail({
        from,
        to: email,
        subject: 'Pragyan - Reset Your Password',
        html: buildPasswordResetHtml(otp),
        text: `Pragyan - Reset Your Password\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes.`,
      }),
      SMTP_TIMEOUT_MS,
      'Password reset email delivery timed out'
    );
  } catch (error) {
    if (config.nodeEnv !== 'production') {
      console.warn(`[emailService] Failed to send email. Password reset OTP for ${email}: ${otp}`);
      console.warn('[emailService] SMTP error:', error instanceof Error ? error.message : error);
      return;
    }

    if (isTimeoutError(error)) {
      throw new Error('Unable to send verification email in time. Please try again later.');
    }

    throw error;
  }
}

export { sendPasswordResetOTP, sendVerificationEmail };
