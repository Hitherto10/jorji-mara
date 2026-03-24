import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import webhooks from './routes/webhooks.js';
import products from './routes/products.js';

import limiter from './middleware/rateLimiter.js';


const app = express()
app.use(helmet())

app.use(cors({ origin: process.env.FRONTEND_URL }))

app.use(morgan('dev'))


// Global limiter — runs before EVERY route, no exceptions
app.use(limiter.globalLimiter);

// Webhooks need raw body — mount BEFORE express.json()
// app.use('/api/webhooks', webhooks)
app.use(express.json())

// Each route gets a specific limiter as its first middleware
// app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api', limiter.productReadLimiter, products)
// app.use('/api/categories', productReadLimiter, require('./routes/categories'))
// app.use('/api/collections', productReadLimiter, require('./routes/collections'))
// app.use('/api/cart', writeLimiter, require('./routes/cart'))
// app.use('/api/orders', writeLimiter, require('./routes/orders'))
// app.use('/api/reviews', writeLimiter, require('./routes/reviews'))
// app.use('/api/users', writeLimiter, require('./routes/users'))
// app.use('/api/payments', paymentLimiter, require('./routes/payments'))
// app.use('/api/newsletter', newsletterLimiter, require('./routes/newsletter'))
// app.use('/api/admin', adminLimiter, require('./routes/admin'))


const PORT = process.env.SERVER_PORT;
console.log(PORT)
app.listen(PORT, () => console.log(`Server Listening at port: ${PORT}`));