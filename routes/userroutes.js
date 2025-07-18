const express = require('express');
const usercontroller = require('./../controllers/usercontroller');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup',authController.signup);
router.post('/login',authController.login);
router.get('/logout',authController.logout);
router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword',authController.updatePassword);
router.get('/me',usercontroller.getMe,usercontroller.getuser);
router.patch('/updateMe',usercontroller.uploadUserPhoto,usercontroller.resizeUserPhoto,usercontroller.updateMe);
router.delete('/deleteMe',usercontroller.deleteMe);

router.use(authController.restrictTo('admin'));

router
.route('/')
.get(usercontroller.getallusers)
.post(usercontroller.createuser);
router
.route('/:id')
.get(usercontroller.getuser)
.patch(usercontroller.updateuser)
.delete(usercontroller.deleteuser);

module.exports = router;