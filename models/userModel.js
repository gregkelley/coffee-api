const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    // userId: {
    //     type: Number,
    //     required: [true, 'user Id required for orders'],
    //     unique: true
    // },
    name: {
        type: String,
        required: [true, 'user Name required'],
        trim: true,
        maxlength: [80, 'User name 80 chars max'],
        minLength: [3, 'User name must be 3 to 80 chars']
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    email: {
        type: String,
        required: [true, 'A User must have the emailz'],
        unique: true,
        lowercase: true,
        validator: [validator.isEmail, 'valid email required']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'must have weak password'],
        minLength: [8],
        select: false    // not show up in output (select)
    },
    passwordConfirm: {
        type: String,
        required: [true, 'must have a matching weak password'],
        validate: {
            // this only works on CREATE and SAVE!  not on Update
            // must use function() so this keyword is local, not inherited
            validator: function(el) {
                console.log(`User Model: passwordConfirm: validator: ${el}`);
                return el === this.password;
            }
        },
        message: 'passwords do not match'
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});


// use mongoose document middleware to implement hashing of password
// .pre so this happens before db save
userSchema.pre('save', async function(next) {
    // if pw not modified, exit
    if(!this.isModified('password')) return next();

    // use bcrypt to hash the pw. 12 is the "cost", ie how cpu intensive this
    // hash operation is going to be
    this.password = await bcrypt.hash(this.password, 12);

    // delete confirm pw field - don't need it in the db. duh
    this.passwordConfirm = undefined; // undefined will not be persisted in db
    next();
});

// Lesson 136 Password reset
userSchema.pre('save', async function(next) {
    // run right before a new user document is saved
    if(!this.isModified('password') || this.isNew ) return next();

    // to prevent race condition where token is created slightly before the password is saved,
    // adjust the createdAt time by 1 second. 
    this.passwordChangedAt = Date.now() - 1000;
    next();
})

// Lesson 139. Sort for only active users in the generic find all bitches
// use a regex to get all versions of find*
userSchema.pre(/^find/, function(next) {
    // only return records where that active flag is not set to false. not all records have an
    // active flag because no design was done and users were originally created w/o this flag. _tf
    // this points to current query
    this.find({ active: { $ne: false }});
    next();
});

// create an instance method - available on all documents of this collection
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    // returns true if the two passwords are the same
    // candidate is passed in, userPW is pulled from db in encrypted form
    return await bcrypt.compare(candidatePassword, userPassword);
    // bcrypt.compare(string, hashedpassword);
}

// look at user, check pw to see if it was changed after they logged in
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    // console.log('changed: ', this.passwordChangedAt);
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp;
    }
    return false; // pw not changed
};

// Lesson 134 - reset user password
userSchema.methods.createPasswordResetToken = function() {
    // use random bytes function from built in crypto module
    const resetToken = crypto.randomBytes(32).toString('hex');

    // create a hash of this token, store in db and have it to compare to request from user
    // don't want to store plain token, even temporarily in the db
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //expires in 10 min

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
