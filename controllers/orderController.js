const fs = require('fs');
const Order = require('../models/orderModel');

// return all the orders
exports.getAllOrders = async (req, res) => {
    try {
        console.log(`req.body: ${JSON.stringify(req.body)}`);
        console.log(`req.query: ${JSON.stringify(req.query)}`);
        //BUILD QUERY  1) basic Filtering
        // need an actual copy of the req object, not just a reference to it.
        // {...req.query} the ... destructures the obj and the {} restructure it as a new obj
        // in this way we create a new copy. kind of a trick. 
        const queryObj = {...req.query};
        // now exclude any fields that we don't want to use for db filter
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];
        // excludedFields.forEach(el => delete queryObj[el]);
        // const excludedFields = ['fields'];
        // excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);

        // 2) Advanced Filtering. need to convert gte to $gte
        // use regex to convert gt, gte, lt, lte
        // convert obj to string, do a replace
        console.log(`queryStr: ${queryStr}`);

        queryStr = queryStr.replace('"open":"1"', '"closedDate":null');

        console.log(`queryStr: ${queryStr}`);




        // Order.find() returns a query. If we want to do other things, we need to get that obj, perform
        // sort and what not and then await the result... as follows
        // to sort by price, ascending: &sort=price  descending: &sort=-price
        let orderQuery = Order.find(JSON.parse(queryStr));

        // EXECUTE QUERY
        const orders = await orderQuery;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: {
                orders: orders
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getSingleOrder = async (req, res) => {

    try {
        const order = await Order.findById(req.params.id);
        // .findById is a helper function for findOne. Equivalent code:
        // Order.findOne({ _id: req.params.id });

        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
    
}

exports.createOrder = async (req, res) => {
  try {
    // create a new instance of Order and save it in the database
    const newOrder = await Order.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            order: newOrder
        }
    });
  } catch (err) {
      res.status(400).json({
          status: 'fail',
          message: err
      })
  }
}

exports.updateOrder = async (req, res) => {
    try {
      // create a new instance of Order and save it in the database
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
      });
      res.status(201).json({
          status: 'success',
          data: { order: order }
      });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
  }

  exports.deleteOrder = async (req, res) => {
    try {
      // create a new instance of Order and save it in the database
      await Order.findByIdAndDelete(req.params.id);
      res.status(201).json({
          status: 'success',
          data: null
      });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
  }
