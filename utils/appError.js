// Error handler class

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);  // sets the message property to incoming message

        console.log('AppError ', message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // use to indicate a bug in the code - like for Dev errors and stuff
        this.isOperational = true;

        // keep our error class from becoming part of the stack trace. wild.
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;