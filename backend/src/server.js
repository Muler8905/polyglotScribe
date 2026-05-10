import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import appRoutes from "./routes/appRoutes.js";
import transcriptionRoutes from "./routes/transcriptionRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { ensureDefaultPlans } from "./controllers/billingController.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration - allow multiple frontend URLs
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway in development
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Debug route to test request body parsing
app.post('/api/debug', (req, res) => {
  console.log('Debug - Headers:', req.headers);
  console.log('Debug - Body:', req.body);
  res.json({
    success: true,
    receivedBody: req.body,
    bodyType: typeof req.body,
    headers: req.headers
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/app', appRoutes);
app.use("/api/app", appRoutes);
app.use("/api/transcriptions", transcriptionRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/public", webhookRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  try {
    await ensureDefaultPlans();
  } catch (err) {
    console.error("Failed to seed default plans", err);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
  });
};

start();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
