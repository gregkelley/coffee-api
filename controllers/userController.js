const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

// return all the users
exports.getAllUsers = catchAsync(async (req, res) => {
    //BUILD QUERY  1) basic Filtering
    // need an actual copy of the req object, not just a reference to it.
    // {...req.query} the ... destructures the obj and the {} restructure it as a new obj
    // in this way we create a new copy. kind of a trick. 
    const queryObj = {...req.query};
    // now exclude any fields that we don't want to use for db filter
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);

    // User.find() returns a query. If we want to do other things, we need to get that obj, perform
    // sort and what not and then await the result... as follows
    // to sort by price, ascending: &sort=price  descending: &sort=-price
    let userQuery = User.find(JSON.parse(queryStr));

    // EXECUTE QUERY
    const users = await userQuery;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users: users
        }
    });
});

exports.getSingleUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    // .findById is a helper function for findOne. Equivalent code:
    // User.findOne({ _id: req.params.id });

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.createUser = catchAsync(async (req, res) => {
    // create a new instance of User and save it in the database
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});


// lesson 138
// when doing update, user is only allowed to update certain items. That is enforced here by filtering
// for those items. usually email, name. password is done in it's own function, not here.
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.updateMe = catchAsync( async ( req, res, next ) => {
    // create error if user attempts to update password. um. okay.
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Cannot update password with this, use updatePassword', 400));
    }

    // 2. filter incoming data
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3. else update user document. cannot use user.save() because that requires fields that we may not
    // provide in the updated data
    // user.id is provided by the authController.protect middleware. see routing.
    // need to make sure we only allow name and email to be updated. ie, changing role to admin would be
    // huge security hole.
    const updUser = await User.findByIdAndUpdate(req.user.id, 
        // filter the req.body
        filteredBody, 
        {new: true, runValidators: true}
        );

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        data: {
            user: updUser
        }
    });
});

exports.deleteMe = catchAsync( async ( req, res, next ) => {

    await User.findByIdAndUpdate(req.user.id, 
        {active: false}
        );

    // SEND RESPONSE
    res.status(204).json({  // 204 == deleted
        status: 'success',
        data: null
    });
});


// exports.updateUser = catchAsync(async (req, res) => {
//     // create a new instance of User and save it in the database
//     const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//         new: true,
//         runValidators: true
//     });
//     res.status(201).json({
//         status: 'success',
//         data: { user: user }
//     });
// });

//   exports.deleteUser = async (req, res) => {
//     try {
//       // create a new instance of User and save it in the database
//       await User.findByIdAndDelete(req.params.id);
//       res.status(201).json({
//           status: 'success',
//           data: null
//       });
//     } catch (err) {
//         res.status(400).json({
//             status: 'fail',
//             message: err
//         })
//     }
//   }
