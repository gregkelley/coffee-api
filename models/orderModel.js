const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: Number
    },
    custId: {
        type: Number,
        required: [true, 'customer Id required for orders']
    },
    orderId: Number,
    orderDate: {
        type: Date,
        default: Date.now
    },
    closedDate: {
        type: Date,
        default: null
    },
    // nested paths cannot have validation...
    coffeeItems: [
        {
            name: String,
            grind: String,
            quantity: Number,
            notes: String
        }
    ]
});
// name that gets created ??? in the mongoDB in lowercase letters. ie: orders.  not sure about this.
const Orders = mongoose.model('Orders', orderSchema);

module.exports = Orders;
