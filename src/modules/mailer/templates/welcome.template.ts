export interface WelcomeTemplateOptions {
  firstName: string;
  loginUrl?: string;
  supportEmail?: string;
  appName?: string;
}

export function welcomeTemplate({
  firstName,
  loginUrl = 'https://yourapp.com/login',
  supportEmail = 'support@yourapp.com',
  appName = 'MyApp',
}: WelcomeTemplateOptions): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to ${appName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f6f9;
      color: #333;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      padding: 40px 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255,255,255,0.8);
      font-size: 15px;
      margin-top: 6px;
    }
    .body {
      padding: 40px 32px;
    }
    .body p {
      font-size: 15px;
      line-height: 1.7;
      color: #555;
      margin-bottom: 16px;
    }
    .body p strong {
      color: #1a1a2e;
    }
    .cta-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .divider {
      border: none;
      border-top: 1px solid #eef0f3;
      margin: 24px 0;
    }
    .features {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 12px;
    }
    .feature-item {
      display: table-row;
    }
    .feature-icon {
      display: table-cell;
      width: 40px;
      vertical-align: top;
      padding-top: 2px;
      font-size: 20px;
    }
    .feature-text {
      display: table-cell;
      vertical-align: top;
      font-size: 14px;
      color: #555;
      line-height: 1.6;
    }
    .feature-text strong {
      display: block;
      color: #1a1a2e;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .footer {
      background: #f8f9fb;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #eef0f3;
    }
    .footer p {
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <h1>Welcome to ${appName} 🎉</h1>
      <p>We're so glad you're here</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p>Hi <strong>${firstName}</strong>,</p>

      <p>
        Thank you for creating your account. Your registration is complete and
        your account is ready to use.
      </p>

      <div class="cta-wrapper">
        <a href="${loginUrl}" class="cta-button">Get Started →</a>
      </div>

      <hr class="divider" />

      <p><strong>Here's what you can do next:</strong></p>

      <div class="features">
        <div class="feature-item">
          <div class="feature-icon">👤</div>
          <div class="feature-text">
            <strong>Complete your profile</strong>
            Add a photo and personal details so others can find you.
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔔</div>
          <div class="feature-text">
            <strong>Set your preferences</strong>
            Customize notifications and privacy settings.
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">💬</div>
          <div class="feature-text">
            <strong>Reach out anytime</strong>
            Our support team is available 24/7 for any questions.
          </div>
        </div>
      </div>

      <hr class="divider" />

      <p>
        If you did not create this account, please ignore this email or contact
        us at <a href="mailto:${supportEmail}" style="color:#6366f1;">${supportEmail}</a>.
      </p>

      <p>Welcome aboard,<br/><strong>The ${appName} Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        © ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
        You're receiving this email because you signed up at ${appName}.<br/>
        <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}
