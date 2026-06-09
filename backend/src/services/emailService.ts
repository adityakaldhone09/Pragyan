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

function buildPasswordResetHtml(otp: string) {
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

export async function sendPasswordResetOTP(email: string, otp: string) {
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
