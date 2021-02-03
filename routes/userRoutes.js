const express = require('express');
const userController = require('./../controllers/userController');

// the router formerly known as userRouter
const router = express.Router();

// alias example. Lesson 99
// router
//     .route('/allusers')
//     .get(userController.aliasTopUsers, userController.getAllUsers);


router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getSingleUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;