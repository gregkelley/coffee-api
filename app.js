// const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const orderRouter = require('./routes/orderRoutes');

const globalErrorHandler = require('./controllers/errorController');


// create an app instance of express
const app = express();

console.log(`current env: ${process.env.NODE_ENV}`);
if(process.env.NODE_ENV === 'development') {
    // middleware for logging. using the dev option. there are others.
    app.use(morgan('dev'));
}

// express middleware
app.use(express.json());

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