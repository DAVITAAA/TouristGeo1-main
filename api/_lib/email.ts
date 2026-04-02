import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(to: string, otp: string, type: 'registration' | 'password_reset' = 'registration') {
  const subject = type === 'registration'
    ? 'TouristGeo - Verification Code'
    : 'TouristGeo - Password Reset Code';

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #22c55e; margin: 0; font-size: 28px;">TouristGeo</h1>
      </div>
      <div style="text-align: center; padding: 24px; background: #f0fdf4; border-radius: 12px; margin-bottom: 24px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
          ${type === 'registration' ? 'Your verification code is:' : 'Your password reset code is:'}
        </p>
        <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #16a34a; padding: 12px;">
          ${otp}
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        This code expires in 10 minutes. If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: 'TouristGeo <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error('Failed to send verification email');
  }
}
