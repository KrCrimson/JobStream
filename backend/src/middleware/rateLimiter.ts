import rateLimit from 'express-rate-limit';

// Desactivar completamente en desarrollo
const isDevelopment = process.env.NODE_ENV !== 'production';

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: isDevelopment ? 100000 : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment, // Skip completamente en desarrollo
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100000 : 5, // Prácticamente sin límite en desarrollo
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  skip: () => isDevelopment, // Skip completamente en desarrollo
});

export const jobCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 100000 : 50,
  message: 'Too many jobs created, please slow down',
  skip: () => isDevelopment, // Skip completamente en desarrollo
});
