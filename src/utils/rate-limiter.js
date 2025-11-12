/**
 * Rate Limiting Utility
 * Prevents API abuse by limiting requests per IP/user
 */

// Simple in-memory rate limiter
// For production, consider using Redis
class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if request should be allowed
   * @param {string} identifier - IP address or user ID
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
   */
  checkLimit(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const recentRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (recentRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetAt = oldestRequest + this.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - recentRequests.length,
      resetAt: now + this.windowMs,
    };
  }

  /**
   * Reset rate limit for identifier
   * @param {string} identifier
   */
  reset(identifier) {
    this.requests.delete(identifier);
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const recentRequests = timestamps.filter(
        timestamp => now - timestamp < this.windowMs
      );

      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Create rate limiter instances
export const apiRateLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export const authRateLimiter = new RateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // 5 login attempts per 15 minutes
);

/**
 * Middleware to apply rate limiting
 * @param {Object} limiter - Rate limiter instance
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(limiter = apiRateLimiter) {
  return (req, res, next) => {
    // Get identifier (IP or user ID)
    const identifier = req.user?.id ||
                      req.headers['x-forwarded-for'] ||
                      req.connection.remoteAddress ||
                      'unknown';

    const result = limiter.checkLimit(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetAt: new Date(result.resetAt).toISOString(),
      });
    }

    if (next) next();
    return true;
  };
}

export default RateLimiter;
