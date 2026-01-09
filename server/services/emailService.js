require('dotenv').config();
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('Initializing email service with:', {
      service: process.env.EMAIL_SERVICE,
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
    });

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      debug: true,
      logger: true
    });
  }

  async sendMatchNotification(lostItem, foundItem, matchScore) {
    try {
      // Send email to person who lost the item
      await this.sendEmailToLostPerson(lostItem, foundItem, matchScore);
      
      // Send email to person who found the item
      await this.sendEmailToFoundPerson(lostItem, foundItem, matchScore);
      
      console.log('Match notifications sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send match notifications:', error);
      return false;
    }
  }

  async sendEmailToLostPerson(lostItem, foundItem, matchScore) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: lostItem.contactInfo,
      subject: `Good News! We found a match for your lost ${lostItem.itemType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">🎉 Great News! We Found a Match!</h2>
          
          <p>Dear User,</p>
          
          <p>We have found a potential match for your lost <strong>${lostItem.itemType}</strong> that you reported on ${new Date(lostItem.dateLost).toLocaleDateString()}.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Match Details:</h3>
            <p><strong>Match Confidence:</strong> ${Math.round(matchScore * 100)}%</p>
            <p><strong>Found Item Description:</strong> ${foundItem.description}</p>
            <p><strong>Location Found:</strong> ${foundItem.location}</p>
            <p><strong>Date Found:</strong> ${new Date(foundItem.dateFound).toLocaleDateString()}</p>
            ${foundItem.imageUrl ? `<img src="${foundItem.imageUrl}" alt="Found item" style="max-width: 100%; height: auto; border-radius: 4px;">` : ''}
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Next Steps:</h4>
            <p>Please contact the person who found this item to verify if it belongs to you.</p>
            <p><strong>Contact Information:</strong> ${foundItem.contactInfo}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Note: Please verify the item carefully before making any claims. The platform is not responsible for the accuracy of the matches.
          </p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Foundry Lost & Found System.<br>
            If you didn't report a lost item, please ignore this email.
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailToFoundPerson(lostItem, foundItem, matchScore) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: foundItem.contactInfo,
      subject: `Potential Match Found for the ${foundItem.itemType} You Found`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">🔍 Potential Match Found!</h2>
          
          <p>Dear User,</p>
          
          <p>We have found a potential match for the <strong>${foundItem.itemType}</strong> you found on ${new Date(foundItem.dateFound).toLocaleDateString()}.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Match Details:</h3>
            <p><strong>Match Confidence:</strong> ${Math.round(matchScore * 100)}%</p>
            <p><strong>Lost Item Description:</strong> ${lostItem.description}</p>
            <p><strong>Location Lost:</strong> ${lostItem.location}</p>
            <p><strong>Date Lost:</strong> ${new Date(lostItem.dateLost).toLocaleDateString()}</p>
            ${lostItem.imageUrl ? `<img src="${lostItem.imageUrl}" alt="Lost item" style="max-width: 100%; height: auto; border-radius: 4px;">` : ''}
          </div>
          
          <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Next Steps:</h4>
            <p>Someone who lost this item may contact you soon. Please be prepared to:</p>
            <ul>
              <li>Verify the description matches the item you found</li>
              <li>Ask for specific details to confirm ownership</li>
              <li>Arrange a safe meeting place for item return</li>
            </ul>
            <p><strong>Contact Information of Lost Item Owner:</strong> ${lostItem.contactInfo}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Please exercise caution when sharing personal information and meeting strangers. Choose public places for item exchanges.
          </p>
          
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Foundry Lost & Found System.<br>
            If you didn't report a found item, please ignore this email.
          </p>
        </div>
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send messages');
      return true;
    } catch (error) {
      console.error('Email service configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
