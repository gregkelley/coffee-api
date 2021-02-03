const fs = require('fs');
const User = require('../models/userModel');

// return all the users
exports.getAllUsers = async (req, res) => {
    try {
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
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getSingleUser = async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        // .findById is a helper function for findOne. Equivalent code:
        // User.findOne({ _id: req.params.id });

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
    
}

exports.createUser = async (req, res) => {
  try {
    // create a new instance of User and save it in the database
    const newUser = await User.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
  } catch (err) {
      res.status(400).json({
          status: 'fail',
          message: err
      })
  }
}

exports.updateUser = async (req, res) => {
    try {
      // create a new instance of User and save it in the database
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
      });
      res.status(201).json({
          status: 'success',
          data: { user: user }
      });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        })
    }
  }

  exports.deleteUser = async (req, res) => {
    try {
      // create a new instance of User and save it in the database
      await User.findByIdAndDelete(req.params.id);
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
