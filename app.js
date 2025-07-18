const path = require('path');

const express = require('express');

const morgan = require('morgan');

const rateLimit = require('express-rate-limit');

const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');

const xss = require('xss-clean');

const hpp = require('hpp');

const cookieParser = require('cookie-parser');

const compression = require('compression');

const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const viewRouter = require('./routes/viewRoutes');
const toursrouter = require('./routes/tourroutes');
const usersrouter = require('./routes/userroutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const bookingController = require('./controllers/bookingController');

const app = express();

app.enable('trust proxy');

app.set('view engine','pug'); 
app.set('views',path.join(__dirname,'views'));

app.use(cors());
//set Access-Control-Allow-Origin header to *
//which means everyone
//we can only allow specific origins
//for example we have backend at api.natours.com and frontend at natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))
//only frontend origin can make requests to api

//browser send an options request when there is preflight phase
app.options('*',cors());
//instead of * we can only select specific routes

app.use(express.static(path.join(__dirname,'public')));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://js.stripe.com"
      ],
      styleSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://fonts.googleapis.com",
        "'unsafe-inline'"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://api.stripe.com"
      ],
      imgSrc: ["'self'", "data:", "https://api.mapbox.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      workerSrc: ["'self'", "blob:"]
    }
  })
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit requests from same ip
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
//this will allow max 100 requests from an IP in an hour

app.use('/api',limiter);

app.post('/webhook-checkout',express.raw({type: 'application/json'}),bookingController.webhookCheckout);
//generally stripe will do post request to this
//we need body coming with request in raw form but not as json
//we added body parsing as a raw body
//thatswhy we define this route here

app.use(express.json());

app.use(express.urlencoded({extended: true,limit: '10kb'}));
app.use(cookieParser()); //parses data from cookies

//data sanitization against NoSQL query injection
app.use(mongoSanitize());
//it will filter out all dollar signs and dots

//data sanitization against xss
//this will clean user input from malicious html code
app.use(xss());

//prevent parameter pollution
//example if we have ?sort=duration&sort=price it doesnt make any sense
//app.use(hpp());  //it will take only last one
//but for some parameters we want duplicate fields
// ?duration=5&duration=9
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

app.use(compression());

app.use((req, res, next) => {
  req.createdTime = new Date().toISOString();
  next();
});

app.use('/',viewRouter);
app.use('/api/v1/tours', toursrouter); 
app.use('/api/v1/users', usersrouter);

app.use('/api/v1/reviews',reviewRouter);

app.use('/api/v1/bookings',bookingRouter);

app.all('*',(req,res,next)=>{
  next(new AppError(`Can't find ${req.originalUrl} on this server`,404));
});
//for all undefined routes

app.use(globalErrorHandler);

module.exports = app;
