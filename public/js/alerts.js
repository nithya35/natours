export const hideAlert=()=>{
    const el = document.querySelector('.alert');
    if(el){
        el.parentElement.removeChild(el);
    }
};

//type is success or error - based on that we will have different css
export const showAlert = (type,msg,time=5)=>{
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin',markup);
    window.setTimeout(hideAlert,time*1000);
};