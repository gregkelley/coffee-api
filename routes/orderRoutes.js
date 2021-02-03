const express = require('express');
const orderController = require('./../controllers/orderController');

// the router formerly known as orderRouter
const router = express.Router();

// alias example. Lesson 99
// router
//     .route('/allorders')
//     .get(orderController.aliasTopOrders, orderController.getAllOrders);

// need to get orders by cust id
router
    .route('/')
    .get(orderController.getAllOrders)
    .post(orderController.createOrder);

router
    .route('/:id')
    .get(orderController.getSingleOrder)
    .patch(orderController.updateOrder)
    .delete(orderController.deleteOrder);

module.exports = router;