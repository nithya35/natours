import axios from 'axios';
import {showAlert} from './alerts';
export const login = async(email,password)=>{
    try{
       const res = await axios({
           method: 'POST',
           url: '/api/v1/users/login',
           data: {
             email: email,
             password: password
           }
       });
       if(res.data.status === 'success'){
          showAlert('success','Logged in successfully');
          window.setTimeout(()=>{
            location.assign('/');
          },1000);
       }
    } catch(err){
        showAlert('error',err.response.data.message);
    }
};

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account created successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async() =>{
  try{
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if(res.data.status = 'success'){
      location.reload(true);
    }
  }catch(err){
    console.log(err.response);
    showAlert('error','Error logging out! Try again.');
  }
}