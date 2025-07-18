const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourmodels');

const APIFeatures = require('./../utils/apifeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
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

exports.uploadTourImages = upload.fields([
  {name: 'imageCover',maxCount: 1},
  {name: 'images',maxCount: 3}
]);

exports.resizeTourImages = catchAsync(async(req,res,next)=>{
  console.log(req.files);
  if(!req.files.imageCover || !req.files.images){
    return next();
  }

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000,1333) 
    .toFormat('jpeg')
    .jpeg({quality: 90}) 
    .toFile(`public/img/tours/${req.body.imageCover}`);
  
  req.body.images=[];
  await Promise.all(req.files.images.map(async(file,i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .jpeg({quality: 90}) 
      .toFile(`public/img/tours/${filename}`);

    req.body.images[i] = filename;
  }));
    
  next();
});

exports.aliasTopTours = (req,res,next)=>{
    req.query.limit='5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

exports.getalltours = factory.getAll(Tour);

exports.gettour = factory.getOne(Tour, {path: 'reviews'});

exports.createtour = factory.createOne(Tour);

exports.updatetour = factory.updateOne(Tour);

exports.deletetour = factory.deleteOne(Tour);

//aggregation pipeline
exports.gettourstats = catchAsync(async(req,res,next)=>{
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                $group: {
                    _id: '$difficulty', 
                    num: {$sum: 1}, 
                    numRatings: {$sum: '$ratingsQuantity'},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'}
                }
            },
            {
                $sort: {avgPrice: 1} 
            },
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });
});

exports.getMonthlyPlan = catchAsync(async(req,res,next)=>{
       const year = req.params.year * 1;
       const plan = await Tour.aggregate([
           {
             $unwind: '$startDates'
             //basically our startDates is an array
             //this will create one separate document for each date in array
           },
           {
             $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
             }
           },
           {
             $group: {
                _id: { $month: '$startDates'},
                numTourStarts: { $sum: 1},
                tours: { $push: '$name'}
             }
           },
           {
             $addFields: { month: '$_id'}
           },
           {
             $project: {
                _id: 0
             }
           },
           {
             $sort: {numTourStarts: -1}
           },
        //    {
        //      $limit: 6
        //      //it will only show top 6 months
        //    }
       ])
       res.status(200).json({
          status: 'success',
          data: {
            plan
          }
       });
});

exports.getToursWithin = catchAsync(async(req,res,next)=>{
  const {distance, latlng, unit} = req.params;
  const [lat,lng] = latlng.split(',');

  if(!lat || !lng){
    next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
  }
  const radius = unit === 'mi' ? distance/3963.2 : distance/6378.1;
  //dividing by radius of earth to convert to radians
  const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lng,lat],radius]}}});

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async(req,res,next)=>{
  const {latlng,unit} = req.params;
  const [lat,lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  // m to mi or m to km

  if(!lat || !lng){
    next(new AppError('Please provide latitude and longitude in the format lat,lng',400));
  }
  //for geoNear stage atleast one field should be indexed
  //first stage should be geoNear compulsory
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { //from this point we will calculate distances to locations present in geospatially indexed field
          type: 'Point',
          coordinates: [lng*1,lat*1] //*1 to convert to integers
        },
        distanceField: 'distance', //all distances will be stored here
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

