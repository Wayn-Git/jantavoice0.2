const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Use provided SMTP settings, or fallback to Ethereal/console logging for dev
  const isProduction = process.env.NODE_ENV === 'production';
  const hasSMTP = process.env.SMTP_HOST && process.env.SMTP_USER;

  let transporter;

  if (hasSMTP) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Note: In production without SMTP, we just gracefully log it to avoid crashing
    if (!isProduction) {
      console.log('⚠️ No SMTP config found. Generating ethereal test account...');
    }
    // Only generate test account if we haven't already and we want to use ethereal
    // However, for simplicity and immediate testing locally/render:
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows'
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'Janta Voice'} <${process.env.FROM_EMAIL || 'noreply@jantavoice.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message.replace(/\n/g, '<br>'), // Simple HTML fallback
  };

  try {
    const info = await transporter.sendMail(message);
    
    if (!hasSMTP) {
      console.log('\n\n==================== EMAIL INTERCEPTED ====================');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`\nMessage:\n${options.message}`);
      console.log('===========================================================\n\n');
    } else {
      console.log(`Email sent to ${options.email}: ${info.messageId}`);
    }
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new Error('Failed to send email. Ensure SMTP details are correct.');
  }
};

module.exports = sendEmail;
