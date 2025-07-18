const mongoose = require('mongoose');
const Tour = require('./tourmodels');
const reviewSchema = new mongoose.Schema({
        review: {
            type: String,
            required: [true, 'Review cannot be empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true,'Review must belong to a tour.']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true,'Review must belong to a user']
        }
    },
    {
       toJSON: {virtuals: true} ,
       toObject: {virtuals: true}
    }
);

reviewSchema.index({tour: 1, user: 1},{unique: true});
//each combination of tour and user must be unique

reviewSchema.pre(/^find/,function(next){
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

//static methods
reviewSchema.statics.calcAverageRatings = async function(tourId){
    //in static method - this refers to model
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ]);
    //console.log(stats);
    if(stats.length>0){
        await Tour.findByIdAndUpdate(tourId,{
           ratingsQuantity: stats[0].nRating,
           ratingsAverage: stats[0].avgRating
        });
    }
    //if all reviews of that tour are deleted then stats will be empty
    else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

reviewSchema.post('save',function(){
    //this points to current review document which is saved
    //Review.calcAverageRatings(this.tour);
    //Review model is not yet defined
    //we shouldn't keep this pre middleware after creating model
    this.constructor.calcAverageRatings(this.tour);
    //this.constructor points to model
});
//to calculate and save no of ratings and ratings average of tours after creating review

//to calculate and save no of ratings and ratings average of tours after deleting and modifying review
//findByIdAndUpdate triggers findOneAndUpdate internally
//similarly for delete
reviewSchema.pre(/^findOneAnd/,async function(next){
   //here this refers to query but not document
   //const r = await this.findOne();
   this.r = await this.findOne(); //we used this.r to send info from premiddleware to postmiddleware
   //this will give original document but not updated one in update case
   //in delete case the document that is going to be deleted
   next();
});

reviewSchema.post(/^findOneAnd/,async function(){
   //await this.findOne() doesnt work here as query is already executed
   //thatswhy we use both pre and post middleware
   await this.r.constructor.calcAverageRatings(this.r.tour);
   //instead of this we have to use this.r to call constructor
   //although this.r is not modified review or may be a deleted review we only need tourid from that
   //id will not be modified anyhow
});

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;