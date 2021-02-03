const AppError = require('./../utils/appError');

// status 400 == Bad request
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    console.log('handleCastErrorDB', message);
    return new AppError(message, 400);
}
const handleDuplicateFieldsDB = err => {
    // const val = err.message.match(/(["'])(\\?.)*?\1/)[0];
    const val = err.keyValue.name;
    console.log('handle Dup: ', val)
    const message = `Duplicate field value: [${val}]. Please use another.`
    return new AppError(message, 400);
}
const handleInvalidID = err => {
    const message = err.message;
    console.log('handleInvalidID', message);
    return new AppError(message, 400);
}
const handleValidationErrorDB = err => {
    // const message = `You sent bad joojoo. Try to do better in the future.`;
    // the message coming back from Mongoose says exactly what we need to send to the user
    return new AppError(err.message, 400);
}

// deal with things that we have not manually coded fer.
const handleDefault = err => {
    const message = `You sent bad joojoo. Try to do better in the future.`;
    // console.log('handleDefault', message);
    return new AppError(message, 400);
}

// web token verificaton fail
const handleJWTError = () => new AppError('Invalid token, please login again', 401);
const handleJWTExpiredError = () => new AppError('Expired login, please login again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {
    if(err.isOperational) {
        console.log('sendErrorProd ', err);
        // trusted client we can send err info to
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        })
    } else {
        // programming or other unknown error
        // unknown user/client, limit err info. ie Production
        console.error('Error ', err);

        res.status(500).json({
            status: err,
            message: 'Something went all south'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500; // default err code. 500 = internal server error
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        console.log('dev err: ', err);
        sendErrorDev(err, res);
    } else if(process.env.NODE_ENV === 'production') {
        console.log('prod err:', err);

        // make a hard copy of the passed in mongoose error to work with
        // this err destructuring does not work because an err is now different in prod
        // vs Dev environments.
        //let nerror = { ...err };
        let nerror = { ...err, name: err.name, message: err.message };
        console.log('nerror: ', nerror);

        // create meaningful experiences for the user. er, meaningful errors
        // this DOES NOT WORK because the name is NOT CastError. It is just fucking Error
        if(nerror.name === 'CastError') nerror = handleCastErrorDB(nerror);
        else if(nerror.name === 'Error') nerror = handleInvalidID(nerror);
        
        else if(nerror.code === 11000) nerror = handleDuplicateFieldsDB(nerror);

        // validation error (during update, maybe in other places.)
        else if(nerror._message === "Validation failed") nerror = handleValidationErrorDB(nerror);

        // if JWT token is invalid or does not match
        else if(nerror.name === 'JsonWebTokenError') nerror = handleJWTError();
        else if(nerror.name === 'TokenExpiredError') nerror = handleJWTExpiredError();

        // else nerror = handleDefault(nerror);
        // console.log('errorController prod err ', error);

        sendErrorProd(nerror, res);
    }
};