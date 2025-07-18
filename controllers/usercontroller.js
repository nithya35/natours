const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
//this way image will be stored as a buffer
//it will be available as req.file.buffer

const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true);
    }
    else{
        cb(new AppError('Not an image! Please upload only images.',404),false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async(req,res,next)=>{
    if(!req.file){
        return next();
    }
    //as we saved to memory req.file.filename will not be set
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    //as we are making toFormat('jpeg') below directly we will keep ext as jpeg
    await sharp(req.file.buffer)
        .resize(500,500)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/users/${req.file.filename}`);
    //last we are saving to disc after image processing

    next();
});

const filterObj = (obj, ...allowedFields)=>{
    const newObj = {};
    Object.keys(obj).forEach(el=>{
        if(allowedFields.includes(el)){
            newObj[el]=obj[el];
        }
    });
    return newObj;
}

exports.getallusers = factory.getAll(User);

exports.getMe = (req,res,next) => {
    req.params.id = req.user.id;
    next();
}

exports.updateMe = catchAsync(async(req,res,next) =>{
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for password update.Please use updateMyPassword',400));
    }

    //if we get user by findbyid and use save() for updating it is not going to work
    //because it will ask for confirmPassword field during save()
    const filteredBody = filterObj(req.body,'name','email');
    //generally here we dont want to allow user to update fields like role to admin
    //thatswhy we are allowing only specific fields to update

    //console.log(req.file)
    if(req.file){
        filteredBody.photo = req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data:{
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id, {active: false});
    res.status(204).json({
        status: 'success',
        data:null
    });
});
exports.createuser = (req,res)=>{
    res.status(500).json({  
        status:'error',
        message:'This route is not defined! Please use /signup instead'
    });
};

exports.getuser = factory.getOne(User);

exports.updateuser = factory.updateOne(User);
//do not update passwords with this

exports.deleteuser = factory.deleteOne(User);