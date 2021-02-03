const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// the router formerly known as userRouter
const router = express.Router();

// alias example. Lesson 99
// router
//     .route('/allusers')
//     .get(userController.aliasTopUsers, userController.getAllUsers);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updatePassword', authController.protect, authController.updatePassword);


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