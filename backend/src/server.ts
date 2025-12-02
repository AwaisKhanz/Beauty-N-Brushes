import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { testDatabaseConnection } from './config/database';
import logger from './utils/logger';
import { mediaProcessorService } from './services/media-processor.service';
import { initializeNotificationJobs } from './jobs/notifications.job';
import { initializeSocketIO } from './config/socket.server';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import providerRoutes from './routes/provider.routes';
import serviceRoutes from './routes/service.routes';
import bookingRoutes from './routes/booking.routes';
import onboardingRoutes from './routes/onboarding.routes';
import instagramRoutes from './routes/instagram.routes';
import aiRoutes from './routes/ai.routes';
import webhookRoutes from './routes/webhook.routes';
import uploadRoutes from './routes/upload.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import calendarRoutes from './routes/calendar.routes';
import inspirationRoutes from './routes/inspiration.routes';
import settingsRoutes from './routes/settings.routes';
import serviceDraftRoutes from './routes/serviceDraft.routes';
import teamRoutes from './routes/team.routes';
import adminRoutes from './routes/admin.routes';
import reviewRoutes from './routes/review.routes';
import likeRoutes from './routes/like.routes';
import favoriteRoutes from './routes/favorite.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import savedSearchRoutes from './routes/savedSearch.routes';
import financeRoutes from './routes/finance.routes';
import analyticsRoutes from './routes/analytics.routes';
import clientManagementRoutes from './routes/client-management.routes';
import locationRoutes from './routes/location.routes';
import subscriptionRoutes from './routes/subscription.routes';

const app: Application = express();
const PORT = process.env.PORT || 8000;

// ================================
// Middleware
// ================================

// Security middleware with relaxed CSP for uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'http://localhost:8000', 'http://localhost:3000'],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Webhook routes MUST come before body parsing middleware
// Stripe requires raw body for signature verification
app.use('/api/v1/webhooks', webhookRoutes);

// Cookie parser middleware (must come before routes that use cookies)
app.use(cookieParser(process.env.COOKIE_SECRET));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
// process.cwd() = backend/, so uploads is at backend/uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
logger.info(`📁 Serving static files from: ${uploadsPath}`);
app.use(
  '/uploads',
  (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  },
  express.static(uploadsPath)
);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ================================
// Routes
// ================================

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/instagram', instagramRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/inspiration', inspirationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/service-drafts', serviceDraftRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/saved-searches', savedSearchRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/clients', clientManagementRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// ================================
// Start Server
// ================================

async function startServer() {
  try {
    // Test database connection
    await testDatabaseConnection();

    // Initialize notification jobs
    initializeNotificationJobs();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    await initializeSocketIO(httpServer);
    logger.info('✅ Socket.IO initialized');

    // Initialize cron jobs
    const { initializeCronJobs } = await import('./jobs');
    await initializeCronJobs();
    logger.info('✅ Cron jobs initialized');

    // Start the server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    });

    // Automatic recovery: Re-queue stuck/pending media after server startup
    setTimeout(async () => {
      try {
        logger.info('🔧 Running startup media recovery...');
        const result = await mediaProcessorService.recoverStuckMedia();

        if (result.recovered > 0) {
          logger.info(
            `♻️  Recovered ${result.recovered} media items (${result.pending} pending, ${result.stuck} stuck)`
          );
        } else {
          logger.info('✅ No stuck media found');
        }
      } catch (error) {
        logger.error('Failed to recover stuck media:', error);
      }
    }, 3000); // Wait 3 seconds after startup
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
