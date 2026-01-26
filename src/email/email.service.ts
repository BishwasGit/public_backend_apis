import { Injectable } from '@nestjs/common';
import { logger } from '../common/logger/logger';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    templateId?: string;
    dynamicData?: any;
}

@Injectable()
export class EmailService {
    private sendGridApiKey: string;
    private fromEmail: string;

    constructor() {
        this.sendGridApiKey = process.env.SENDGRID_API_KEY || '';
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@mentalhealth.com';

        if (!this.sendGridApiKey) {
            logger.warn('SendGrid API key not configured. Emails will be logged only.');
        }
    }

    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            if (!this.sendGridApiKey) {
                // Mock email sending - log instead
                logger.info(`[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
                logger.info(`[MOCK EMAIL] Content: ${options.text || options.html}`);
                return true;
            }

            // Real SendGrid implementation (when API key is provided)
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(this.sendGridApiKey);

            const msg = {
                to: options.to,
                from: this.fromEmail,
                subject: options.subject,
                text: options.text,
                html: options.html,
                templateId: options.templateId,
                dynamicTemplateData: options.dynamicData,
            };

            await sgMail.send(msg);
            logger.info(`Email sent successfully to ${options.to}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send email to ${options.to}:`, error);
            return false;
        }
    }

    // Welcome email
    async sendWelcomeEmail(email: string, alias: string, role: string): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: 'Welcome to Mental Health Platform',
            html: `
        <h1>Welcome, ${alias}!</h1>
        <p>Thank you for joining our mental health platform as a ${role}.</p>
        <p>We're here to support your journey.</p>
      `,
        });
    }

    // Session confirmation
    async sendSessionConfirmation(
        email: string,
        sessionDetails: { psychologist: string; date: string; time: string; price: number }
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: 'Session Confirmed',
            html: `
        <h1>Your Session is Confirmed</h1>
        <p><strong>Psychologist:</strong> ${sessionDetails.psychologist}</p>
        <p><strong>Date:</strong> ${sessionDetails.date}</p>
        <p><strong>Time:</strong> ${sessionDetails.time}</p>
        <p><strong>Price:</strong> $${sessionDetails.price}</p>
        <p>We look forward to seeing you!</p>
      `,
        });
    }

    // Session reminder (1 hour before)
    async sendSessionReminder(
        email: string,
        sessionDetails: { psychologist: string; time: string; roomLink: string }
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: 'Session Reminder - Starting in 1 Hour',
            html: `
        <h1>Your Session Starts Soon</h1>
        <p>Your session with ${sessionDetails.psychologist} starts in 1 hour at ${sessionDetails.time}.</p>
        <p><a href="${sessionDetails.roomLink}">Join Session</a></p>
      `,
        });
    }

    // Payment receipt
    async sendPaymentReceipt(
        email: string,
        receiptDetails: { amount: number; description: string; date: string }
    ): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: 'Payment Receipt',
            html: `
        <h1>Payment Receipt</h1>
        <p><strong>Amount:</strong> $${receiptDetails.amount}</p>
        <p><strong>Description:</strong> ${receiptDetails.description}</p>
        <p><strong>Date:</strong> ${receiptDetails.date}</p>
        <p>Thank you for your payment!</p>
      `,
        });
    }

    // Psychologist verification approved
    async sendVerificationApproved(email: string, alias: string): Promise<boolean> {
        return this.sendEmail({
            to: email,
            subject: 'Your Account Has Been Verified',
            html: `
        <h1>Congratulations, ${alias}!</h1>
        <p>Your psychologist account has been verified.</p>
        <p>You can now start accepting patients and offering sessions.</p>
      `,
        });
    }

    // Withdrawal request notification (to admin)
    async sendWithdrawalRequestNotification(
        adminEmail: string,
        userAlias: string,
        amount: number,
        requestId: string,
    ): Promise<boolean> {
        return this.sendEmail({
            to: adminEmail,
            subject: '🔔 New Withdrawal Request',
            html: `
        <h2>New Withdrawal Request</h2>
        <p>A new withdrawal request has been submitted:</p>
        <ul>
          <li><strong>User:</strong> ${userAlias}</li>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Request ID:</strong> ${requestId}</li>
        </ul>
        <p>Please review and process this request in the admin panel.</p>
      `,
        });
    }

    // Withdrawal approved notification (to user)
    async sendWithdrawalApprovedNotification(
        userEmail: string,
        userAlias: string,
        amount: number,
    ): Promise<boolean> {
        return this.sendEmail({
            to: userEmail,
            subject: '✅ Withdrawal Request Approved',
            html: `
        <h2>Withdrawal Request Approved</h2>
        <p>Dear ${userAlias},</p>
        <p>Your withdrawal request has been approved!</p>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Status:</strong> Approved - Payment Processing</li>
        </ul>
        <p>Your payment is being processed and will be completed shortly.</p>
        <p>You will receive another notification once the payment is completed.</p>
      `,
        });
    }

    // Withdrawal rejected notification (to user)
    async sendWithdrawalRejectedNotification(
        userEmail: string,
        userAlias: string,
        amount: number,
        reason: string,
    ): Promise<boolean> {
        return this.sendEmail({
            to: userEmail,
            subject: '❌ Withdrawal Request Rejected',
            html: `
        <h2>Withdrawal Request Rejected</h2>
        <p>Dear ${userAlias},</p>
        <p>Unfortunately, your withdrawal request has been rejected.</p>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <p>If you have any questions, please contact support.</p>
      `,
        });
    }

    // Payment completed notification (to user)
    async sendPaymentCompletedNotification(
        userEmail: string,
        userAlias: string,
        amount: number,
    ): Promise<boolean> {
        return this.sendEmail({
            to: userEmail,
            subject: '💰 Payment Completed',
            html: `
        <h2>Payment Completed</h2>
        <p>Dear ${userAlias},</p>
        <p>Your withdrawal payment has been completed successfully!</p>
        <ul>
          <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
          <li><strong>Status:</strong> Payment Completed</li>
        </ul>
        <p>The funds have been transferred to your account.</p>
        <p>Thank you for using our platform!</p>
      `,
        });
    }
}
