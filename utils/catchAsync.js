// catch an asynchronous error
// because fn is async, it returns a Promise
module.exports = fn => {
    // console.log('catchAsync');
    return (req, res, next) => {
        // fn(req, res, next).catch(err => next(err));
        // somehow the above line is the same as this:
        fn(req, res, next).catch(next);
        // somehow, if an error occurs, the catch function propogates the error to 
        // errorController, our error handling middleware. the route sort of falls through
        // to the error handler
    };
};