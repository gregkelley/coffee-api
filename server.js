// starting file, where we listen to server
// Do all application setup in this file

const mongoose = require('mongoose');

// for access to config.env file
const dotenv = require('dotenv');

// MUST pull in the config files BEFORE pulling in/running the app
dotenv.config({ path: './config.env' });

const app = require('./app');
// const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connect to local db:
mongoose.connect(process.env.DATABASE_LOCAL, {

// .connect returns a promise which we need to handle in a .then
// mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connect and stuff'))
  .catch(err => console.log(`DB fail ${err}`));

const port = process.env.PORT || 3000;
// start our server
app.listen(port, () => {
    console.log(`App runing on ${port}...`);
})