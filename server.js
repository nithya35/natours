const mongoose = require('mongoose');
const dotenv = require('dotenv');
//loads environment variables from .env file to process.env

process.on('uncaughtException',err=>{
  console.log('UNCAUGHT EXCEPTION! Shutting down..');
  console.log(err.name,err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const db = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);
mongoose.connect(db,{
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false
  // these are just options related to depreciation warnings
}).then(con=>{
  //console.log(con.connections);
  console.log("Database connected successfully");
});

const app = require('./app');

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection',err=>{
  console.log(err.name,err.message);
  console.log("UNHANDLER REJECTION! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM',()=>{
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(()=>{
    console.log('Process terminated!');
  });
});
