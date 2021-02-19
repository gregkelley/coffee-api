// const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const orderRouter = require('./routes/orderRoutes');
const globalErrorHandler = require('./controllers/errorController');


// create an app instance of express
const app = express();

// helmet() returns functions that will be used each time the middleware stack is traversed
app.use(helmet());  // security HTTP headers

console.log(`current env: ${process.env.NODE_ENV}`);
if(process.env.NODE_ENV === 'development') {
    // middleware for logging. using the dev option. there are others.
    app.use(morgan('dev'));
}

// express middleware
app.use(express.json());

// set access rate limit - prevent brute force attacks, DDOS (right...)
const limiter = rateLimit({
    // max 100 requests per hour
    max: 100,   // TODO: make sure this limit makes sense
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour. Or a month.'
});
app.use('/api', limiter);  // only for /api routes

// TODO: make sure the size limit here makes sense
// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); // limit body size to 10kb

// if the body size was not too large, sanitize the content here
app.use(mongoSanitize());  // prevent NoSQL injection
app.use(xss());   // remove malicious html code, possibly w/ javascript

// may not need this for coffee. TODO: update whiteList
app.use(hpp({
    whitelist: ['duration', 'price']
}));  // Prevent parser pollution

// serve static files. make public dir available to callers
// allows us to serve static files without a route
app.use(express.static(`${__dirname}/public`));

// create our own middleware
// app.use((req, res, next) => {
//     console.log('Hello from the Middleware');
//     next(); // must always call next or the flow stops. bitch.
// })

// manipulate the req object
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next(); // must always call next or the flow stops. bitch.
})

// because we moved the routes to their own files, they become their own mini apps
// and we can use them as middleware

// using the router must come after the route is defined.
// 'mounting' the router on a new route
app.use('/api/v1/user', userRouter);
app.use('/api/v1/order', orderRouter);

// this has to be here at the end. If it is above, it will supercede other handlers
// default - 404 - router
// app.all for all URL verbs: GET, POST, YADA, BITCH
app.all('*', (req, res, next) => {
    // #3 - use our own error class to deal with errors.
    next(new AppError(`Cannot find ${req.originalUrl}`), 404);
})

// define middleware for handling errors. All errors handled in one place. yay.
app.use(globalErrorHandler);


module.exports = app;