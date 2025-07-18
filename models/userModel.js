const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true, 
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user','guide','lead-guide','admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false  //so it will not be shown in any output
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only works on create and save
            validator: function(el){
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//encrypting password by using middleware
userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,12);
    //The 12 is the salt rounds (also called cost factor), which controls how expensive the hash operation is. 
    //A higher number means more time and computation to hash, making it more secure but slower.
    //during salting a random string called salt is generated and is combined with password before hashing
    //for same passwords of 2 users - hash passwords will be different - that is the power of salting

    this.passwordConfirm = undefined;

    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew){
        return next();
    }
    this.passwordChangedAt = Date.now()-1000;
    //sometimes this will be set a bit after token is created
    //because sometimes saving to database is bit slower than issuing jsonwebtoken
    //the user will not be able to login because we check whether password is changed after token is created
    //so thatswhy we do -1000ms
    next();
});

userSchema.pre(/^find/,function(next){
    this.find({active: {$ne: false}});
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    //we have to pass userpassword also because directly we cannot access it by this.password
    //as we set select:false for password in schema
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
       const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
       //passwordChangedAt will be in date format and JWTTimeStamp in seconds
       return JWTTimestamp < changedTimeStamp;
    }
    return false;  //default - if there is no passwordChangedAt
}

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
    //similar to password this also should be encrypted and shouldnt be stored plain in database
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10*60*1000;

    return resetToken;
    //we must send unencrypted reset token to user via mail
}

const User = mongoose.model('User',userSchema);

module.exports = User;