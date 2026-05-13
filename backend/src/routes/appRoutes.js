import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import {
  getAllUsers,
  updateUserTokens,
  toggleAdminRole,
  deleteUserTranscriptions,
  adminCreateUser,
  adminDeleteUser,
  getAdminStats,
  getSystemSettings,
  updateSystemSettings,
} from '../controllers/adminController.js';

import {
  getProfile,
  updateProfile,
} from '../controllers/profileController.js';
import {
  getHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage,
} from '../controllers/heroImageController.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { getUserStats } from '../controllers/statsController.js';

const router = express.Router();

// Profile routes
router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);

// Hero images routes (public read, admin write)
router.get('/hero-images', getHeroImages);
router.post('/hero-images', protect, requireAdmin, createHeroImage);
router.patch('/hero-images/:id', protect, requireAdmin, updateHeroImage);
router.delete('/hero-images/:id', protect, requireAdmin, deleteHeroImage);

// Notification routes
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:id/read', protect, markAsRead);
router.post('/notifications/mark-all-read', protect, markAllAsRead);
router.delete('/notifications/:id', protect, deleteNotification);

// Stats routes
router.get('/stats', protect, getUserStats);

// Admin routes
router.get('/admin/users', protect, requireAdmin, getAllUsers);
router.post('/admin/users', protect, requireAdmin, adminCreateUser);
router.patch('/admin/users/:userId/tokens', protect, requireAdmin, updateUserTokens);
router.post('/admin/users/:userId/toggle-admin', protect, requireAdmin, toggleAdminRole);
router.delete('/admin/users/:userId', protect, requireAdmin, adminDeleteUser);
router.delete('/admin/users/:userId/transcriptions', protect, requireAdmin, deleteUserTranscriptions);
router.get('/admin/stats', protect, requireAdmin, getAdminStats);
router.get('/admin/settings', protect, requireAdmin, getSystemSettings);
router.patch('/admin/settings', protect, requireAdmin, updateSystemSettings);



export default router;
