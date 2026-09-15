const nodemailer = require("nodemailer");

let testTransporter = null;

async function getTransporter() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === "true",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Otherwise use an Ethereal test account or local mock
    if (!testTransporter) {
        try {
            const testAccount = await nodemailer.createTestAccount();
            testTransporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            console.log("Using Ethereal test mailer account:", testAccount.user);
        } catch (err) {
            console.warn("Could not create test mail account, using json transport:", err.message);
            testTransporter = nodemailer.createTransport({
                jsonTransport: true
            });
        }
    }
    return testTransporter;
}

async function sendInstructorEmail({ to, instructorName, senderName, senderEmail, subject, message, room }) {
    if (!to) {
        throw new Error("Recipient email is required.");
    }

    const transporter = await getTransporter();

    const fromAddress = process.env.EMAIL_FROM || `"CRMS Administrator" <${process.env.EMAIL_USER || "crms-noreply@college.edu"}>`;
    const mailSubject = subject || `[CRMS] Message regarding ${room || "Campus Rooms"} from Campus Staff`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fb; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0d8c7a; padding: 24px; color: #ffffff; text-align: left; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { margin: 4px 0 0 0; font-size: 12px; opacity: 0.85; }
        .body { padding: 24px; }
        .badge { display: inline-block; background: #e2f5f1; color: #087364; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; margin-bottom: 16px; }
        .message-box { background: #f8fafc; border-left: 4px solid #0d8c7a; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
        .details { font-size: 12px; color: #64748b; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>College Room Management System</h1>
          <p>Official Instructor Notification</p>
        </div>
        <div class="body">
          <div class="badge">Direct Staff Message</div>
          <p style="font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">Dear ${instructorName || "Instructor"},</p>
          <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">You have received a new message from the CRMS Administrator.</p>
          
          <div class="message-box">${message}</div>

          <div class="details">
            <p style="margin: 4px 0;"><strong>Sender:</strong> ${senderName || "Campus Administrator"} (${senderEmail || "staff@crms.local"})</p>
            ${room ? `<p style="margin: 4px 0;"><strong>Assigned Room:</strong> ${room}</p>` : ""}
            <p style="margin: 4px 0;"><strong>Sent Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <div class="footer">
          This is an automated notification sent via CRMS. Please coordinate with campus administration if needed.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        replyTo: senderEmail || undefined,
        subject: mailSubject,
        text: `Dear ${instructorName || "Instructor"},\n\n${message}\n\nFrom: ${senderName || "Administrator"} (${senderEmail || "staff@crms.local"})\nRoom: ${room || "N/A"}`,
        html: htmlContent
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log(`[Email Sent] To: ${to} | Subject: ${mailSubject} | MessageId: ${info.messageId}`);
    if (previewUrl) {
        console.log(`[Email Preview URL]: ${previewUrl}`);
    }

    return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        recipient: to
    };
}

module.exports = {
    sendInstructorEmail
};
