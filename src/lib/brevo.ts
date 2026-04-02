export async function sendEmailViaBrevo(
  toEmail: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME;

    console.log('🔵 [BREVO] Starting email send...', {
      toEmail,
      subject,
      hasApiKey: !!apiKey,
      senderEmail,
    });

    if (!apiKey || !senderEmail || !senderName) {
      console.error('❌ [BREVO] Missing Brevo environment variables', {
        hasApiKey: !!apiKey,
        hasEmail: !!senderEmail,
        hasName: !!senderName,
      });
      throw new Error('Brevo configuration missing');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ [BREVO] API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData,
      });
      return false;
    }

    console.log('✅ [BREVO] Email sent successfully!', {
      to: toEmail,
      messageId: responseData?.messageId,
      status: response.status,
    });
    return true;
  } catch (error) {
    console.error('❌ [BREVO] Exception:', error);
    return false;
  }
}

export function generateApprovalEmailTemplate(userName: string, role: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            padding: 0; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #16a34a; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h2 {
            margin: 0;
            font-size: 28px;
          }
          .content { 
            background-color: white; 
            padding: 30px 20px; 
            text-align: left;
          }
          .content p {
            margin: 12px 0;
          }
          .btn-wrapper {
            text-align: center;
            margin: 25px 0;
          }
          .btn { 
            background-color: #16a34a; 
            color: #ffffff !important; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            font-weight: 600;
            font-size: 14px;
          }
          .btn:hover {
            background-color: #15803d;
          }
          .footer { 
            text-align: center; 
            padding: 20px;
            background-color: #f9f9f9;
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #e5e5e5;
          }
          .footer p {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🎉 Congratulations!</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Great news! Your join request has been <strong>approved</strong>!</p>
            <p>You have been assigned the role of <strong>${role.toUpperCase()}</strong> in our platform.</p>
            <p>You can now log in and start exploring all the features available to you.</p>
            <div class="btn-wrapper">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://fundex.com'}/dashboard/${role}" class="btn">Go to Dashboard</a>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 13px;">If you have any questions, please don't hesitate to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fundex Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateRejectionEmailTemplate(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 20px auto; 
            padding: 0; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #ef4444; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h2 {
            margin: 0;
            font-size: 24px;
          }
          .content { 
            background-color: white; 
            padding: 30px 20px; 
            text-align: left;
          }
          .content p {
            margin: 12px 0;
          }
          .footer { 
            text-align: center; 
            padding: 20px;
            background-color: #f9f9f9;
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #e5e5e5;
          }
          .footer p {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Join Request Update</h2>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for your interest in joining our platform.</p>
            <p>Unfortunately, your join request has been <strong>rejected</strong> at this time.</p>
            <p>This decision may be due to various factors, and you're welcome to reach out to our support team if you'd like more information or would like to reapply in the future.</p>
            <p style="margin-top: 20px; color: #666; font-size: 13px;">If you have any questions, please feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Fundex Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
