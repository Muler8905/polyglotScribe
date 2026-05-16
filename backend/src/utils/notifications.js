import Notification from '../models/Notification.js';
import { sendGeneralEmail } from '../config/email.js';
import User from '../models/User.js';

/**
 * Create a system notification for a user
 */
export const createNotification = async ({ userId, title, message, type = 'info', link = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Send notification to a single user (System and/or Email)
 */
export const sendUserNotification = async ({ userId, title, message, deliveryMethod = 'system' }) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    let systemResult = null;
    let emailResult = null;

    if (deliveryMethod === 'system' || deliveryMethod === 'both') {
      systemResult = await createNotification({ userId, title, message });
    }

    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      try {
        await sendGeneralEmail(user.email, title, message, user.displayName);
        emailResult = true;
      } catch (e) {
        console.error('Email sending failed:', e);
        emailResult = false;
      }
    }

    return { success: true, system: !!systemResult, email: emailResult };
  } catch (error) {
    console.error('Error in sendUserNotification:', error);
    return { success: false, message: error.message };
  }
};
