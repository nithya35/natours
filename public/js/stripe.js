import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51RhoZaQ8zHLXlRJ52ctorBejEIyvWAGxzd0ptJbDAKFg8vOHB3TeXns6TArOkiXusrGW28RZAHqfzU86K0FHbptR00UhfRgUb8');
//public key

export const bookTour = async tourId =>{
    try{
        //1) get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        //console.log(session);

        //2) create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch(err){
        console.log(err);
        showAlert('error',err);
    }
};