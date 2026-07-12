const getVerificationEmail = (fullName, otpCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background: linear-gradient(135deg, #FFC107, #FFA000);
          padding: 40px 20px;
          text-align: center;
          color: #1a1a1a;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content h2 {
          margin-top: 0;
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .content p {
          font-size: 15px;
          color: #555555;
          margin: 16px 0;
        }
        .code-box {
          background-color: #FFFDE7;
          border: 1px dashed #FFC107;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code-text {
          font-family: "Courier New", Courier, monospace;
          font-size: 36px;
          font-weight: 700;
          color: #E65100;
          letter-spacing: 6px;
          margin: 0;
        }
        .footer {
          background-color: #fafbfc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #eef2f6;
          font-size: 12px;
          color: #888888;
        }
        .footer p {
          margin: 4px 0;
        }
        .footer a {
          color: #E65100;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PlovDev</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName || 'learner'},</h2>
          <p>Thank you for registering on our platform! To complete your registration and verify your account, please use the verification code below:</p>
          <div class="code-box">
            <h2 class="code-text">${otpCode}</h2>
          </div>
          <p>Please note that this code is valid for <strong>10 minutes</strong>. If you did not sign up for this account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PlovDev. All rights reserved.</p>
          <p>Need support? Contact us at <a href="mailto:support@plovdev.com">support@plovdev.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getResetPasswordEmail = (fullName, otpCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f4f6f8;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background: linear-gradient(135deg, #FFC107, #FFA000);
          padding: 40px 20px;
          text-align: center;
          color: #1a1a1a;
        }
        .header h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content h2 {
          margin-top: 0;
          font-size: 20px;
          color: #1a1a1a;
          font-weight: 600;
        }
        .content p {
          font-size: 15px;
          color: #555555;
          margin: 16px 0;
        }
        .code-box {
          background-color: #FFFDE7;
          border: 1px dashed #FFC107;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code-text {
          font-family: "Courier New", Courier, monospace;
          font-size: 36px;
          font-weight: 700;
          color: #E65100;
          letter-spacing: 6px;
          margin: 0;
        }
        .footer {
          background-color: #fafbfc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #eef2f6;
          font-size: 12px;
          color: #888888;
        }
        .footer p {
          margin: 4px 0;
        }
        .footer a {
          color: #E65100;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName || 'learner'},</h2>
          <p>We received a request to reset your password. Please use the verification code below to authorize the password reset:</p>
          <div class="code-box">
            <h2 class="code-text">${otpCode}</h2>
          </div>
          <p>This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} PlovDev. All rights reserved.</p>
          <p>Need support? Contact us at <a href="mailto:support@plovdev.com">support@plovdev.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {getVerificationEmail , getResetPasswordEmail}