const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const Tour = require('./../models/tourmodels');
const User = require('./../models/userModel');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.tourId);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
                        ]
                    }
                },
                quantity: 1
            }
        ]
    });

    res.status(200).json({
        status: 'success',
        session: session
    });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const { tour, user, price } = req.query;
//     if (!tour || !user || !price) {
//         return next();
//     }
//     await Booking.create({ tour, user, price });
//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const userdoc = await User.findOne({email: session.customer_email});
    const user = userdoc._id;
    const price = session.amount_total/100;
    await Booking.create({tour,user,price});
};

exports.webhookCheckout = (req,res,next)=>{
    const signature = req.headers['stripe-signature'];

    let event;
    try{
        event = stripe.webhooks.constructEvent(req.body,signature,process.env.STRIPE_WEBHOOK_SECRET);
        //here req.body should be in raw form not json
    } catch(err){
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if(event.type==='checkout.session.completed'){
        createBookingCheckout(event.data.object);
    }
    res.status(200).json({received: true});
}

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
