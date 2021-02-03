const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: Number,
        required: [true, 'user Id required for orders'],
        unique: true
    },
    userName: {
        type: String,
        required: [true, 'user Name required']
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});
const User = mongoose.model('User', userSchema);

module.exports = User;
