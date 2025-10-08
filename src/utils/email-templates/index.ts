// Base email template wrapper
export const emailLayout = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaSinaSnap</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 10px 10px;
      font-size: 14px;
      color: #6b7280;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SaaSinaSnap</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} SaaSinaSnap. All rights reserved.</p>
    <p>You're receiving this email because you're a valued member of our platform.</p>
  </div>
</body>
</html>
`;

// Welcome email template
export const welcomeEmail = (userName: string, businessName?: string) => emailLayout(`
  <h2>Welcome to SaaSinaSnap!</h2>
  <p>Hi ${userName},</p>
  <p>We're thrilled to have you join SaaSinaSnap${businessName ? ` with ${businessName}` : ''}! You've just taken the first step towards launching your SaaS product in a snap.</p>
  <p>With SaaSinaSnap, you can:</p>
  <ul>
    <li>Manage your API keys and integrations</li>
    <li>Configure white-label branding for your platform</li>
    <li>Track analytics and monitor performance</li>
    <li>Handle subscriptions and billing seamlessly</li>
  </ul>
  <p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">Get Started</a>
  </p>
  <p>If you have any questions, feel free to reach out to our support team.</p>
  <p>Best regards,<br>The SaaSinaSnap Team</p>
`);

// Subscription update email template
export const subscriptionUpdateEmail = (
  userName: string,
  productName: string,
  action: "upgraded" | "downgraded" | "cancelled" | "renewed"
) => emailLayout(`
  <h2>Subscription ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
  <p>Hi ${userName},</p>
  <p>Your subscription to <strong>${productName}</strong> has been ${action}.</p>
  ${action === "cancelled" ? `
    <p>We're sorry to see you go! Your subscription will remain active until the end of your current billing period.</p>
    <p>If you change your mind, you can reactivate your subscription anytime from your dashboard.</p>
  ` : `
    <p>Thank you for your continued trust in our platform!</p>
  `}
  <p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="button">View Dashboard</a>
  </p>
  <p>Best regards,<br>The SaaSinaSnap Team</p>
`);

// Notification email template
export const notificationEmail = (
  userName: string,
  title: string,
  message: string,
  ctaText?: string,
  ctaUrl?: string
) => emailLayout(`
  <h2>${title}</h2>
  <p>Hi ${userName},</p>
  <p>${message}</p>
  ${ctaText && ctaUrl ? `
    <p>
      <a href="${ctaUrl}" class="button">${ctaText}</a>
    </p>
  ` : ''}
  <p>Best regards,<br>The SaaSinaSnap Team</p>
`);

// Password reset email template (enhancement)
export const passwordResetEmail = (userName: string, resetUrl: string) => emailLayout(`
  <h2>Reset Your Password</h2>
  <p>Hi ${userName},</p>
  <p>We received a request to reset your password. Click the button below to create a new password:</p>
  <p>
    <a href="${resetUrl}" class="button">Reset Password</a>
  </p>
  <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  <p>This link will expire in 1 hour for security reasons.</p>
  <p>Best regards,<br>The SaaSinaSnap Team</p>
`);

// API key created notification
export const apiKeyCreatedEmail = (
  userName: string,
  keyName: string,
  apiKey: string
) => emailLayout(`
  <h2>New API Key Created</h2>
  <p>Hi ${userName},</p>
  <p>A new API key named "<strong>${keyName}</strong>" has been created for your account.</p>
  <p><strong>Important:</strong> This is the only time we'll show you the full API key. Please store it securely:</p>
  <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; word-break: break-all;">
    ${apiKey}
  </div>
  <p>If you didn't create this API key, please revoke it immediately from your dashboard and contact support.</p>
  <p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/api-keys" class="button">Manage API Keys</a>
  </p>
  <p>Best regards,<br>The SaaSinaSnap Team</p>
`);
