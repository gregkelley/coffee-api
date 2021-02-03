// 2/2021 this is a copy of Jonas file from class.

const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES}
    );
};

// send a common response to the client
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    res.status(statusCode).json({
        status: 'success',
        // send the created token to the client. client will need to store this
        token,
        data: {
            user: user
        }
    });    
}


exports.signup = catchAsync (async (req, res, next) => {
    // security fail: not vetting the req.body. A person can specify their 
    // role as Admin in the body and we don't want that
    // const newUser = await User.create(req.body);
    const newUser = await User.create({ 
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    createSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);
    // // log the new user in

    // res.status(201).json({
    //     status: 'success',
    //     // send the created token to the client. client will need to store this
    //     token,
    //     data: {
    //         user: newUser
    //     }
    // });
});

exports.login = catchAsync(async (req, res, next) => {
    // const email = req.body.email;  // should use ES6 destructuring
    const {email, password} = req.body;

    // check if email / pw exists
    if (!email || !password) {
        // create new error that global err middleware will pick up
        return next( new AppError('please provide email and password', 400));
        // need the return cuz we have error and need to leave, not keep going in this code
    }

    // check if user exists and if pw is correct
    // + == explicitly select the password which by default is not returned.
    const user = await User.findOne( {email: email})  // or just {email}  ES6
                .select('+password');  
    // console.log(user);

    // use the bcrypt pkg to compare the password. done in user model
    // only query for pw if the user is actually found. thus this logic:
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401)); // unauthorized
    }

    // if check check check, send tolkein to client
    createSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });
});

// Lesson 131
// authorize users middleware function.
exports.protect = catchAsync (async (req, res, next) => {
    
    let token;
    // 1. Get token from request. token should be sent in HTTP header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // console.log(token);

    if (!token) { 
        return next(new AppError('Not Logged in!', 401));
    }
    // 2. validate token. yay.
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // the next checks are extreme corner case things. If you want to be really secure, use them.
    // 3. Check that user exists (not deleted before this request was sent)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('User no longer exists', 401));
    }

    // 4. Check if user changed pw after tolkein was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User pw changed, please login again', 401));
    }

    // save the user info for later middleware functions. ie: restrictTo   oh yeah.
    req.user = currentUser;
    // fall thru, grant access to protected route
    next();
})

// restrict access to various functions. Need to pass in roles for this to work.
// accomplished by wrapping the middleware function in a function that returns the role array
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['lead-guide', 'admin']
        if(!roles.includes(req.user.role)) {
            return next(new AppError('Do not have permission for this action', 403));
        }

        //otherwise, permission is granted, continue
        next();
    };
};

exports.forgotPassword = catchAsync (async (req, res, next) => {
    // retrieve user with email
    const user = await User.findOne({ email: req.body.email});
    if(!user) {
        return next(new AppError('Email not exist', 404));
    }
    // Generate random reset token
    const resetToken = user.createPasswordResetToken(); // creates token. 
    // save updated user info but turn off validation since we do not have all required fields
    await user.save({validateBeforeSave: false});


    // send token in email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot Password? Submit new password and pw confirm to: ${resetURL}\nIf you didn't forget your password, go full on panic city.`;

    // need to handle this error here so we can deal with extra stuff
    try {
        await sendEmail({
            email: user.email,  // same as req.body.email
            subject: 'Your email reset token. (valid for 10 minutes)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        // clean up in the db if we had a fail
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('Error sending Email. Try later maybe.', 500));
    }
});


exports.resetPassword = catchAsync (async (req, res, next) => {
    // 1. get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    console.log(hashedToken);
    // find this user in the db based on the ResetToken that we created and put into their record.
    // can also search for the reset time in the query
    const user = await User.findOne( { passwordResetToken: hashedToken, 
        passwordResetExpires: {$gt: Date.now() }});

    // 2. if token not expired and there is a user, set new pw
    if (!user) {
        return next(new AppError('Password reset time has expired', 400));
    }

    // 3. update changedPasswordAt property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 4. log the user in, send JWT to client
    createSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });
});

// Lesson 137
exports.updatePassword = catchAsync(async (req, res, next) => {
// my implementation which does work.
    // // 1. get user from collection
    // const {email, oldPassword} = req.body;

    // // check if email / pw exists
    // if (!email || !oldPassword) {
    //     // create new error that global err middleware will pick up
    //     return next( new AppError('please provide email and password', 400));
    //     // need the return cuz we have error and need to leave, not keep going in this code
    // }

    // // check if user exists and if pw is correct
    // // + == explicitly select the password which by default is not returned.
    // const user = await User.findOne( {email: email})  // or just {email}  ES6
    //             .select('+password');  
    // console.log(user);

    // // 2. Check if password entered by User matches current password
    // user.password = req.body.password;
    // user.passwordConfirm = req.body.passwordConfirm;
    // // 3. if so, update password
    // await user.save();

    // // 4. Log user in, send JWT to client
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

// Jonas' implementation
    // 1. Get user from collection (db)
    const user = await User.findById(req.user.id).select('+password');
    // user.id comes from the JWT token of the user who is logged in. Do not need to pass it in.

    // 2. Check current password
    if (!(await user.correctPassword(req.body.oldPassword, user.password ))) {
        return next(new AppError('Current password does not match', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    // 3. if so, update password
    await user.save();
    // User.findByIdAndUpdate will not work for updating pw

    // 4. Log user in, send JWT to client
    createSendToken(user, 200, res);
});