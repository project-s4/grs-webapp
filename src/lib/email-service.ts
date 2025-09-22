// Email service for complaint notifications
export class EmailService {
  private static readonly EMAIL_CONFIG = {
    from: process.env.EMAIL_FROM || 'noreply@grievance-portal.com',
    enabled: process.env.EMAIL_ENABLED === 'true',
  };

  // Send complaint submission confirmation
  static async sendComplaintConfirmation(
    userEmail: string,
    userName: string,
    trackingId: string,
    complaintTitle: string
  ): Promise<boolean> {
    try {
      if (!this.EMAIL_CONFIG.enabled) {
        console.log('Email service disabled, skipping confirmation email');
        return true;
      }

      const emailData = {
        to: userEmail,
        from: this.EMAIL_CONFIG.from,
        subject: `Complaint Submitted Successfully - ${trackingId}`,
        html: this.generateConfirmationEmail(userName, trackingId, complaintTitle),
      };

      // Here you would integrate with your email provider (SendGrid, AWS SES, etc.)
      // For now, just log the email data
      console.log('📧 Sending complaint confirmation email:', emailData);
      
      // Simulate email sending
      await this.simulateEmailSend(emailData);
      
      return true;
    } catch (error) {
      console.error('Failed to send complaint confirmation email:', error);
      return false;
    }
  }

  // Send status update notification
  static async sendStatusUpdate(
    userEmail: string,
    userName: string,
    trackingId: string,
    complaintTitle: string,
    oldStatus: string,
    newStatus: string,
    notes?: string
  ): Promise<boolean> {
    try {
      if (!this.EMAIL_CONFIG.enabled) {
        console.log('Email service disabled, skipping status update email');
        return true;
      }

      const emailData = {
        to: userEmail,
        from: this.EMAIL_CONFIG.from,
        subject: `Complaint Status Updated - ${trackingId}`,
        html: this.generateStatusUpdateEmail(
          userName,
          trackingId,
          complaintTitle,
          oldStatus,
          newStatus,
          notes
        ),
      };

      console.log('📧 Sending status update email:', emailData);
      await this.simulateEmailSend(emailData);
      
      return true;
    } catch (error) {
      console.error('Failed to send status update email:', error);
      return false;
    }
  }

  // Send notification to department
  static async sendDepartmentNotification(
    departmentEmail: string,
    trackingId: string,
    complaintTitle: string,
    description: string,
    priority: string,
    userName: string
  ): Promise<boolean> {
    try {
      if (!this.EMAIL_CONFIG.enabled) {
        console.log('Email service disabled, skipping department notification');
        return true;
      }

      const emailData = {
        to: departmentEmail,
        from: this.EMAIL_CONFIG.from,
        subject: `New Complaint Assignment - ${trackingId}`,
        html: this.generateDepartmentNotificationEmail(
          trackingId,
          complaintTitle,
          description,
          priority,
          userName
        ),
      };

      console.log('📧 Sending department notification email:', emailData);
      await this.simulateEmailSend(emailData);
      
      return true;
    } catch (error) {
      console.error('Failed to send department notification email:', error);
      return false;
    }
  }

  // Generate confirmation email HTML
  private static generateConfirmationEmail(
    userName: string,
    trackingId: string,
    complaintTitle: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Complaint Submitted Successfully</h2>
        
        <p>Dear ${userName},</p>
        
        <p>Thank you for submitting your complaint. We have received your grievance and assigned it the tracking ID: <strong>${trackingId}</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Complaint Details:</h3>
          <p><strong>Tracking ID:</strong> ${trackingId}</p>
          <p><strong>Title:</strong> ${complaintTitle}</p>
          <p><strong>Status:</strong> Pending</p>
        </div>
        
        <p>You can track the progress of your complaint using the tracking ID on our portal.</p>
        
        <p>We will keep you updated on the progress via email.</p>
        
        <p>Best regards,<br>Grievance Redressal Team</p>
      </div>
    `;
  }

  // Generate status update email HTML
  private static generateStatusUpdateEmail(
    userName: string,
    trackingId: string,
    complaintTitle: string,
    oldStatus: string,
    newStatus: string,
    notes?: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Complaint Status Update</h2>
        
        <p>Dear ${userName},</p>
        
        <p>There has been an update on your complaint with tracking ID: <strong>${trackingId}</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Complaint Details:</h3>
          <p><strong>Tracking ID:</strong> ${trackingId}</p>
          <p><strong>Title:</strong> ${complaintTitle}</p>
          <p><strong>Previous Status:</strong> ${this.capitalizeFirstLetter(oldStatus)}</p>
          <p><strong>Current Status:</strong> <span style="color: #059669; font-weight: bold;">${this.capitalizeFirstLetter(newStatus)}</span></p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        
        <p>You can view more details and track the progress on our portal.</p>
        
        <p>Best regards,<br>Grievance Redressal Team</p>
      </div>
    `;
  }

  // Generate department notification email HTML
  private static generateDepartmentNotificationEmail(
    trackingId: string,
    complaintTitle: string,
    description: string,
    priority: string,
    userName: string
  ): string {
    const priorityColor = priority === 'urgent' ? '#dc2626' : 
                         priority === 'high' ? '#ea580c' : 
                         priority === 'medium' ? '#ca8a04' : '#16a34a';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Complaint Assignment</h2>
        
        <p>A new complaint has been assigned to your department for review and action.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Complaint Details:</h3>
          <p><strong>Tracking ID:</strong> ${trackingId}</p>
          <p><strong>Title:</strong> ${complaintTitle}</p>
          <p><strong>Submitted by:</strong> ${userName}</p>
          <p><strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${this.capitalizeFirstLetter(priority)}</span></p>
          <p><strong>Description:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 4px;">${description}</p>
        </div>
        
        <p>Please login to the admin portal to review and take appropriate action.</p>
        
        <p>Best regards,<br>Grievance Redressal System</p>
      </div>
    `;
  }

  // Simulate email sending (replace with actual email service integration)
  private static async simulateEmailSend(emailData: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Email sent successfully (simulated)');
        resolve();
      }, 100);
    });
  }

  // Helper function to capitalize first letter
  private static capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1).replace('_', ' ');
  }
}
