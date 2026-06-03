import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { testConnection, performMigration } from './db';
import { logger } from './utils/logger';
import { corsOptions } from './utils/corsconfig';

import authRoutes   from './routes/authRoutes';
import adminRoutes  from './routes/adminRoutes';
import internRoutes from './routes/internRoutes';
// import userRoutes from './routes/userRoutes';

const app = express();
const PORT = process.env.PORT || 8000;

// Security headers
app.use(helmet());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.', errors: [] },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later.', errors: [] },
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Emerson API Docs',
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Routes
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/auth/login', loginLimiter);
app.use('/api/admin',  adminRoutes);
app.use('/api/intern', internRoutes);
app.use('/api/onboarding', internRoutes); // alias so frontend /api/onboarding/* works
// app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ success: false, message: 'Internal Server Error', errors: [] });
});

async function start(): Promise<void> {
  try {
    await testConnection();
    await performMigration();
    logger.success('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database — shutting down', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    logger.success(`Server running on http://localhost:${PORT}`);
    logger.info(`API docs at http://localhost:${PORT}/api-docs`);
  });
}

start();
