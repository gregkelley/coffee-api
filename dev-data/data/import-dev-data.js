// running this from the command line:
// node dev-data/data/import-dev-data.js --import
// node dev-data/data/import-dev-data.js --delete

// script to load static json file with dev data into db
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./../../models/customerModel');
const Order = require('./../../models/orderModel');

// MUST pull in the config files BEFORE pulling in/running the app
dotenv.config({ path: './config.env' });

// const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
// connect to local db:
mongoose.connect(process.env.DATABASE_LOCAL, {

//mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connect and stuff'))
  .catch(err => console.log(`DB fail ${err}`));

// read file. convert to JSON object
const customers = JSON.parse(fs.readFileSync(`${__dirname}/customers.json`, 'utf-8'));
const orders = JSON.parse(fs.readFileSync(`${__dirname}/orders.json`, 'utf-8'));

// import
const importCustomer = async () => {
    try {
        await Customer.create(customers);
        console.log('Customer Data successfully loaded!');
        process.exit();
    }catch(err) {
        console.log(err)
    }
};

const importOrders = async () => {
    try {
        await Order.create(orders);
        console.log('Order Data successfully loaded!');
        process.exit();
    }catch(err) {
        console.log(err);
        process.exit();
    }
};

// delete all data from collection
const deleteCustomer = async () => {
    try {
        await Customer.deleteMany();
        console.log('Customer Data successfully nuked!');
        process.exit();
    }catch(err) {
        console.log(err)
    }
};

const deleteOrders = async () => {
    try {
        await Order.deleteMany();
        console.log('Order Data successfully nuked!');
        process.exit();
    }catch(err) {
        console.log(err)
        process.exit();
    }
};

// same as running a python program, we get argv list that we can read.
if(process.argv[2] === '--import') {
    importCustomer();
} else if( process.argv[2] === '--delete') {
    deleteCustomer();
} else if( process.argv[2] === '--deleteOrders') {
    deleteOrders();
} else if( process.argv[2] === '--importOrders') {
    importOrders();
}

// node dev-data/data/import-dev-data.js --deleteOrders

// looking at command line args as passed into the process
// console.log(process.argv);