import  rateLimit from 'express-rate-limit';

// ── GLOBAL ──
const globalLimiter = /** @type {import('express').RequestHandler} */ (
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

// ── AUTH ──
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
})

// ── PAYMENT ──
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
})

// ── PRODUCT READS ──
const productReadLimiter = /** @type {import('express').RequestHandler} */ (
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
    })
);
// ── WRITE OPERATIONS ──
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
})

// ── ADMIN ──
const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
})

// ── NEWSLETTER ──
const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
})

export default {
    globalLimiter,
    authLimiter,
    paymentLimiter,
    productReadLimiter,
    writeLimiter,
    adminLimiter,
    newsletterLimiter,
};
