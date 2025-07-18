const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourmodels');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './config.env' });
const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(db,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false
}).then(con=>{
  console.log("Database connected successfully");
});

//read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));

//import data into db
const importData = async() => {
    try{
        await Tour.create(tours);
        //tours is array
        // so it will create document for each object in array
        await User.create(users,{validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Data successfully loaded!');
    } catch(err){
        console.log(err);
    }
    process.exit();
}

// delete all data from db
const deleteData = async() => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        //mongoose is a layer of abstraction over mongodb.so some functions are similar like deleteMany
        console.log('Data successfully deleted!');
    } catch(err){
        console.log(err);
    }
    process.exit();
}

if(process.argv[2]==='--import'){
    importData();
}
else if(process.argv[2]==='--delete'){
    deleteData();
}
// if you want to see what will be in process.argv just do console.log(process.argv)
//simply it will contain what we gave in command line

// we give --import or --delete in command line while we are running this file

// first run delete and then import
// we will have all data in tours-simple.json in our database