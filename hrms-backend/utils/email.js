const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

let transporterInstance = null;

// Helper to get or create nodemailer transporter
async function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If credentials exist in environment variables, use them
  if (host && port && user && pass) {
    console.log('Configuring email transporter with custom SMTP settings...');
    transporterInstance = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465, // true for 465, false for other ports
      auth: { user, pass }
    });
    return transporterInstance;
  }

  // Fallback: Create Ethereal Test Account dynamically
  console.log('No custom SMTP settings found. Generating Ethereal test email account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: testAccount.host,
      port: testAccount.port,
      secure: testAccount.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`Ethereal Test SMTP configured. Log user: ${testAccount.user}`);
    return transporterInstance;
  } catch (error) {
    console.error('Failed to create Ethereal SMTP transporter:', error.message);
    throw error;
  }
}

/**
 * Sends a notification email with the payslip PDF attachment.
 * @param {string} toEmail - Recipient email
 * @param {string} employeeName - Recipient name
 * @param {string} monthName - Month name (e.g. July)
 * @param {number} year - Year
 * @param {string} pdfPath - Absolute path to the PDF file
 */
async function sendPayslipEmail(toEmail, employeeName, monthName, year, pdfPath) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || 'noreply@hrms.com';

    const mailOptions = {
      from: `"HR Department" <${fromAddress}>`,
      to: toEmail,
      subject: `Payslip for ${monthName} ${year}`,
      text: `Hello ${employeeName},\n\nPlease find attached your payslip for the month of ${monthName} ${year}.\n\nBest Regards,\nHR Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; color: #333;">
          <div style="background-color: #2E3B4E; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 22px;">HRMS Company</h2>
            <p style="margin: 5px 0 0; font-size: 14px;">Monthly Salary Slip Notification</p>
          </div>
          <div style="padding: 25px; line-height: 1.6;">
            <p>Dear <strong>${employeeName}</strong>,</p>
            <p>Your payslip for the month of <strong>${monthName} ${year}</strong> has been generated and is now available.</p>
            <p>We have attached the PDF payslip to this email for your records. You can also view and download it anytime by logging into the employee portal.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <span style="background-color: #F4F6F8; padding: 15px 25px; border-radius: 5px; font-weight: bold; border: 1px dashed #d0d0d0; display: inline-block;">
                Pay Month: ${monthName} ${year}
              </span>
            </div>
            
            <p>If you notice any discrepancies, please reach out to the HR department immediately.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Payslip_${monthName}_${year}.pdf`,
          path: pdfPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Payslip email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);

    // If using ethereal, output the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
      return previewUrl;
    }
    return null;
  } catch (error) {
    console.error('Error sending payslip email:', error.message);
    throw error;
  }
}

module.exports = { sendPayslipEmail };
