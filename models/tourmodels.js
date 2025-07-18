const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourschema = new mongoose.Schema({
  name: {
    type: String,
    required: [true,'A tour must have a name'],
    unique: true,
    trim: true,
    //trim works only for strings.it removes all whitespaces at beginning and end of string
    maxlength: [40,'A tour name must have less or equal than 40 characters'],
    minlength: [10,'A tour name must have more or equal than 10 characters'],
  },
  slug: String,
  duration:{
    type: Number,
    required: [true,'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true,'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true,'A tour must have a difficulty'],
    enum:{
        values: ['easy','medium','difficult'],
        message: 'Difficulty is either easy,medium or difficult'
    } 
    //enum is validator on mongoose only for strings
    //it allows us to specify what are allowed values
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above or equal to 1.0'],
    max: [5,'Rating must be below or equal to 5.0'],
    //min and max are validators by mongoose
    //they work for numbers and dates
    set: val => Math.round(val*10)/10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true,'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate:{
       validator: function(val){
           //val refers to entered priceDiscount value
           return val<this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true,'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String, // we save name of image in database
    required: [true,'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false //it will be never shown to user
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //geoJSON
    type: {
       type: String,
       default: 'Point',
       enum: ['Point']
    },
    coordinates: [Number], // array of numbers - longitude first and then latitude
    address: String,
    description: String
  }, 
  locations: [  
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
       type: mongoose.Schema.ObjectId,
       ref: 'User'
    }
  ]
},{
  toJSON: {virtuals: true}, // each time data is outputted as json,we want virtuals to be part of output
  toObject: {virtuals: true}
});
//first object for schema definition and second object for schema options

tourschema.index({price: 1,ratingsAverage: -1});
tourschema.index({slug: 1});

tourschema.index({startLocation: '2dsphere'});
//for geospatial data it should be indexed to a 2dsphere

tourschema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
//here arrow function is not used but a regular function is used beacuse we need access to this
//which is not possible in arrow function

tourschema.virtual('reviews',{
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
tourschema.pre('save',function(next){ 
    //console.log(this);
    //this points to currently processed document
    this.slug = slugify(this.name,{lower: true});
    next();
});

tourschema.pre(/^find/,function(next){
    this.find({secretTour: {$ne: true}});
    this.start=Date.now();
    //this points to current query
    next();
});
//now this applies to all querys starting with find

tourschema.pre(/^find/,function(next){
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next();
});

tourschema.post(/^find/,function(docs,next){
  //this function will get access of docs
  //docs are all documents returned by query
  console.log(`query took ${Date.now()-this.start} milliseconds`);
  //console.log(docs);
  next();
});

const Tour = mongoose.model('Tour',tourschema);
module.exports = Tour;