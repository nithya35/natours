const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//const router = express.Router();
const router = express.Router({mergeParams: true});
//basically router will have access to parameters only on its routes
//in create review case , we are making use of reviewRouter from tourRouter
//so to get access to tourId from the route we are enabling this option

//routes that will be forwarded to this router from tour router
//post /tours/:tourId/reviews
//get /tours/:tourId/reviews

router.use(authController.protect);

router
.route('/')
.get(reviewController.getAllReviews)
.post(authController.restrictTo('user'),reviewController.setTourUserIds,reviewController.createReview);
router
.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user','admin'),reviewController.updateReview)
.delete(authController.restrictTo('user','admin'),reviewController.deleteReview);

module.exports = router;