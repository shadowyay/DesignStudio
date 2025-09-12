import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter for sending emails
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : undefined;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: port || 465,
      secure: typeof secure === 'boolean' ? secure : true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback to Gmail service if explicit SMTP host is not provided
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  });
};

// Generate verification token
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  try {
    const transporter = createTransporter();

    const frontendBase = process.env.FRONTEND_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const verificationUrl = `${frontendBase}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Verify Your Email - SmartServe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SmartServe!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Please verify your email address</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for registering with SmartServe! To complete your registration and start using our platform, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="color: #667eea; word-break: break-all; font-size: 14px; margin: 10px 0;">
              ${verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This verification link will expire in 24 hours. If you didn't create an account with SmartServe, 
                you can safely ignore this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send verification success email
export const sendVerificationSuccessEmail = async (email: string, name: string) => {
  try {
    const transporter = createTransporter();
    const frontendBase = process.env.FRONTEND_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Email Verified Successfully - SmartServe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Email Verified!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your account is now active</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${name},</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Great news! Your email address has been successfully verified. Your SmartServe account is now fully activated 
              and you can start using all our features.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendBase}/user/auth" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Login to Your Account
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0;">
              Thank you for choosing SmartServe. We're excited to have you as part of our community!
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification success email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification success email:', error);
    return false;
  }
};

// Send task acceptance notification to user (task owner)
export const sendTaskAcceptedEmailToUser = async (
  userEmail: string, 
  userName: string, 
  taskTitle: string,
  taskDescription: string,
  volunteerName: string,
  volunteerEmail: string,
  _taskId: string
) => {
  try {
    const transporter = createTransporter();
    const frontendBase = process.env.FRONTEND_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: userEmail,
      subject: `Your Task "${taskTitle}" Has Been Accepted! - SmartServe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Task Accepted!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">A volunteer has accepted your task</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Great news! Your task has been accepted by a volunteer. Here are the details:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Task Details:</h3>
              <p style="color: #333; margin: 5px 0; font-weight: bold;">Title: ${taskTitle}</p>
              <p style="color: #666; margin: 5px 0;">Description: ${taskDescription}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Volunteer Details:</h3>
              <p style="color: #333; margin: 5px 0; font-weight: bold;">Name: ${volunteerName}</p>
              <p style="color: #666; margin: 5px 0;">Email: ${volunteerEmail}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              You can contact the volunteer directly via their email or through our platform. Please coordinate 
              the details of when and where to meet for the task completion.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendBase}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                View Task Details
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Thank you for using SmartServe to connect with volunteers in your community!
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Task accepted email sent to user successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending task accepted email to user:', error);
    return false;
  }
};

// Send task acceptance confirmation to volunteer
export const sendTaskAcceptedEmailToVolunteer = async (
  volunteerEmail: string,
  volunteerName: string,
  taskTitle: string,
  taskDescription: string,
  userName: string,
  userEmail: string,
  taskLocation: string,
  taskAmount: number,
  _taskId: string
) => {
  try {
    const transporter = createTransporter();
    const frontendBase = process.env.FRONTEND_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    
    const mailOptions = {
      from: process.env.SMTP_USER || 'your-email@gmail.com',
      to: volunteerEmail,
      subject: `Task Acceptance Confirmed: "${taskTitle}" - SmartServe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Task Confirmed!</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">You've successfully accepted a task</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Hi ${volunteerName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for accepting this volunteer opportunity! Here are the task details and contact information:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Task Details:</h3>
              <p style="color: #333; margin: 5px 0; font-weight: bold;">Title: ${taskTitle}</p>
              <p style="color: #666; margin: 5px 0;">Description: ${taskDescription}</p>
              <p style="color: #666; margin: 5px 0;">Location: ${taskLocation}</p>
              <p style="color: #333; margin: 5px 0; font-weight: bold; color: #28a745;">Amount: ₹${taskAmount.toFixed(2)}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin: 0 0 10px 0;">Task Owner Contact:</h3>
              <p style="color: #333; margin: 5px 0; font-weight: bold;">Name: ${userName}</p>
              <p style="color: #666; margin: 5px 0;">Email: ${userEmail}</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Please reach out to the task owner to coordinate the details. Make sure to discuss the timing, 
              meeting location, and any specific requirements for completing the task.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendBase}/volunteer-dashboard" 
                 style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                View My Tasks
              </a>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1565c0; margin: 0; font-size: 14px; text-align: center;">
                💡 <strong>Tip:</strong> Completing tasks successfully earns you points and helps build your volunteer reputation!
              </p>
            </div>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Thank you for being part of the SmartServe volunteer community. Together, we make a difference!
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Task acceptance confirmation email sent to volunteer successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending task acceptance confirmation email to volunteer:', error);
    return false;
  }
};
