import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import styles from '@/styles/Components.module.scss'
import Image from 'next/image';
import { login, get_customer_info, storeCustomerInfo, social_login } from '@/libs/api';
import { useDispatch } from 'react-redux';
import { setCustomerInfo } from '@/redux/slice/logInInfo'
import { setDetail } from '@/redux/slice/customerInfo'
import AlertUi from '../Common/AlertUi'
import Cookies from 'js-cookie';
// import { GoogleLogin } from '@react-oauth/google';
// import FacebookLogin from 'react-facebook-login';


export default function LogIn({ hide, checkModal }) {

    const [show, setShow] = useState(false)
    let [msg, setMsg] = useState({})
    let [headerMsg, setHeaderMsg] = useState()
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const dispatch = useDispatch();

    // const [userName,setUserName] = useState('')
    // const [passWord,setPassword] = useState('')
    let [remember_me_check, setRememberMe] = useState(false)

    
    useEffect(() => {
        let cookie_username;
        let cookie_password;
        let cookie_user_type;
        let username1 = document.getElementById('emailId')
        // console.log('3123214',username1)
        if (Cookies.get('username') && Cookies.get('password')) {
            cookie_username = Cookies.get('username');
            cookie_password = Cookies.get('password');
            cookie_user_type = Cookies.get('user_type');
            setRememberMe(true);
            let username = document.getElementById('emailId')
            let password = document.getElementById('password')
            if (username && password) {
                username.value = cookie_username
                password.value = cookie_password

                setValue('email', cookie_username);
                setValue('password', cookie_password);
                //  clearErrors('email');
                //  clearErrors('password');
            }
        }

    }, [])

    function clearErrors(fieldName) {
        const form = document.querySelector('form');
        form.reset({ fieldName });
    }

    async function log_in(data) {
        // console.log(data)
        if (data) {
            let datas = {
                email: data.email,
                pwd: data.password
            }
            let val = await login(datas);
            if (val.message.message == 'Success') {
                const dateNow = new Date();
                dateNow.setDate(dateNow.getDate() + 30);
                Cookies.set('api_key',val.message.api_key, { expires: dateNow })
                Cookies.set('api_secret',val.message.api_secret, { expires: dateNow })
                localStorage['api_key'] = val.message.api_key
                localStorage['api_secret'] = val.message.api_secret
                dispatch(setCustomerInfo(val));
                dispatch(setDetail(val))
                // getCustomerInfo({ email: data.email, guest_id: localStorage['customerRefId'] }, datas)
                // localStorage['customerUser_id'] = val.message.user_id;
                // localStorage['customer_id'] = val.message.customer_id;
                localStorage['full_name'] = val.full_name;
                localStorage['roles'] = JSON.stringify(val.message.roles);
                hide()
            }
            else {
                msg = { message: val.message.message ? val.message.message : 'Something wen wrong try again later' }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
            }
        }
    }

    const rememberMe = (queryparam) => {
        // console.log('queryparam',queryparam)
        if (!Cookies.get('password') && !Cookies.get('username')) {
            const dateNow = new Date();
            dateNow.setDate(dateNow.getDate() + 14);
            Cookies.set('username', queryparam.username, { expires: dateNow });
            Cookies.set('password', queryparam.password, { expires: dateNow });
            Cookies.set('customer_id', queryparam.customer_id, { expires: dateNow });
        } else if (Cookies.get('customer_id') && Cookies.get('customer_id') !== queryparam.customer_id) {
            const dateNow = new Date();
            dateNow.setDate(dateNow.getDate() + 14);
            Cookies.set('username', queryparam.username, { expires: dateNow });
            Cookies.set('password', queryparam.password, { expires: dateNow });
            Cookies.set('customer_id', queryparam.customer_id, { expires: dateNow });
        }
    }

    const getCustomerInfo = async (mail, datas) => {
        const dateNow = new Date();
        dateNow.setDate(dateNow.getDate() + 14);
        const resp = await get_customer_info(mail);
        if (resp.message && resp.message.length != 0) {
            storeCustomerInfo(resp);
            document.cookie = `customerRefId=${localStorage["customerRefId"]};expires=${dateNow}`; 
            dispatch(setCustomerInfo(resp.message[0]));
            dispatch(setDetail(resp.message[0]))

            let queryparam = { 'username': datas.usr, 'password': datas.pwd, 'customer_id': (resp.message[0] && resp.message[0].name) ? resp.message[0].name : resp.message[0].name }

            if (remember_me_check) {
                rememberMe(queryparam);
            } else {
                if (Cookies.get('customer_id') == queryparam.customer_id) {
                    Cookies.remove('username');
                    Cookies.remove('password');
                    Cookies.remove('customer_id');
                }
            }
        }
    }

    let [showAlert, setShowAlert] = useState(false)
    const closeModal = () => {
        setShowAlert(false)
        // setTimeout(() => {
        //     hide()
        // }, 200);
    }

    // Google Login
    const handleSuccess = (response) => {
        // console.log(parseJwt(response.credential))
        socialLogin(parseJwt(response.credential))
    };

    const handleFailure = (error) => {
        console.error('Google Sign-In error:', error);
    };

    const parseJwt = (token) => {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));


        return JSON.parse(jsonPayload);
    }

    const socialLogin = async (data) => {
        let payload = {
            data: JSON.stringify({
                email: data.email,
                user_name: data.given_name,
                uid: data.jti,
                phone: data.phone ? data.phone : '',
                provider: "oauth-google"
            }),
            get_user_token: 1
        }

        const resp = await social_login(payload)
        // console.log(resp,"resp")
        if (resp.message && resp.message.message && resp.message.message == 'Logged In') {
            localStorage['api_key'] = resp.message.api_key
            localStorage['api_secret'] = resp.message.api_secret

            // getCustomerInfo({ email: data.email, guest_id: localStorage['customerRefId'] }, datas)
            let mail = {
                email: data.email,
                guest_id: localStorage['customerRefId']
            }
            const res = await get_customer_info(mail);
            if (res.message && res.message.length != 0) {
                storeCustomerInfo(res);
                dispatch(setCustomerInfo(res.message[0]));
                dispatch(setDetail(res.message[0]))
                localStorage['roles'] = JSON.stringify(res.message[0].roles_list);
            }
            // localStorage['customerUser_id'] = val.message.user_id;
            // localStorage['customer_id'] = val.message.customer_id;
            localStorage['full_name'] = resp.full_name;
            hide()
        } else {
            msg = { message: (val.message && val.message.message) ? val.message.message : 'Something wen wrong try again later' }
            setMsg(msg)
            headerMsg = 'Alert'
            setHeaderMsg(headerMsg)
            setShowAlert(true)
        }

    }

    // Facebook Login
    const responseFacebook = (response) => {
        // Handle response from Facebook login
        if (response.accessToken) {
            // Successful login
            handleFacebookLogin(response);
        } else {
            // Error or login canceled
            // console.log('Facebook login failed:', response);
        }
    };

    const handleFacebookLogin = (response) => {
        // Handle login response
        // console.log('Facebook login response:', response);
        // Redirect or update state accordingly
    };

    return (
        <>
            {showAlert && <AlertUi button_2={'Ok'} closeModal={closeModal} isOpen={showAlert} headerMsg={headerMsg} alertMsg={msg} />}
            {/* <div className='container h-full md:h-[calc(100vh_-_50px)] overflow-auto md:p-[0_15px] lg:justify-center gap-[20px] '> */}

            <div className='w-full text-center flex items-center justify-center'>
                {/* <h2 className='text-[20px] font-semibold'>Welcome</h2> */}
                <Image className="" height={200} width={200} src="/login-logo.svg" />
                {/* <p className='text-[14px]'>Don't have an account? <span className='primary_color text-[15px] cursor-pointer' onClick={() => checkModal('signup')}>Sign Up</span></p> */}
            </div>
            <form onSubmit={handleSubmit((data) => log_in(data))} autoComplete='off'>
                <div className={`flex flex-col py-5 relative`}>
                    <label className={`${styles.label} `} htmlFor='email' >Username / Email Address</label>
                    <div className='border rounded-[5px] flex gap-[5px] mt-[5px] p-[0_10px] h-[40px] items-center'>
                        <Image className={`t-[10px] ${errors.email?.message ? 'bottom-[48px]' : 'bottom-[25px]'} h-[23px] w-[20px] object-contain`} src={'/login/mail-01.svg'} height={15} width={15} alt={"pass"} />
                        <input id='emailId' placeholder='Email' className={`${styles.input} ${styles.border_left} h-full`} 
                        {...register('email',)} 
                        // { required: { value: true, message: 'Email is required' }, 
                        // pattern: { value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, message: "Please enter a valid email" } 
                        // },)} 
                        />
                    </div>
                    {errors?.email && <p className={`${styles.danger}`}>{errors.email.message}</p>}
                </div>
                <div className={`flex flex-col  pb-4 relative`}>
                    <label className={` ${styles.label}`} htmlFor='password'>Password</label>
                    <div className='border rounded-[5px] flex gap-[5px] mt-[5px] p-[0_10px] h-[40px] items-center'>
                        {/* absolute  left-[10px] ${errors.password?.message ? 'bottom-[45px]' : 'bottom-[25px]'} */}
                        <Image onClick={() => setShow(!show)} className={` h-[23px] w-[20px] cursor-pointer object-contain`} src={show ? '/login/password-02.svg' : '/login/password-01.svg'} height={15} width={15} alt={"pass"} />
                        <input id='password' placeholder='Password' type={`${show ? 'text' : 'password'}`} className={`${styles.input} ${styles.border_left} h-full`} {...register('password', { required: { value: true, message: 'Password is required' } })} />
                        <Image onClick={() => setShow(!show)} className={` h-[23px] w-[20px] cursor-pointer object-contain`} src={show ? '/login/eye.svg' : '/login/eye-hide.svg'} height={15} width={15} alt={"pass"} />
                        {/* <button onClick={()=> setShow(!show)}>show</button> */}
                    </div>
                    {errors.password && <p className={`${styles.danger}`}>{errors.password.message}</p>}
                </div>

                <button type="submit" className={`${styles.loginBtn} `}>Log In</button>
                {/* {wrong && <p className='text-center pt-[5px] text-[#ff1010] font-semibold'>Please check your email or password</p>} */}
            </form>

            {/* <div onClick={() => checkModal('otp')} className='flex gap-[10px] mt-5 w-[75%] md:w-full m-[0_auto] h-[45px] cursor-pointer rounded-[5px] border items-center justify-center '>
                <Image height={20} width={20} alt='google' src={'/login/otp.svg'} />
                <p className=' font-[500]' >Sign In with OTP</p>
            </div> */}

            {/* <div className='m-[0_auto] py-[10px]'> */}
                {/* <GoogleLogin
                    onSuccess={handleSuccess}
                    onFailure={handleFailure}
                    shape='rectangular'
                /> */}


                {/* <LoginSocialFacebook
                    isOnlyGetToken
                    appId={"341622788230249"}
                    onLoginStart={(loginStart) => {
                        console.log(loginStart, 'loginStart')
                    }}
                    onResolve={({ provider, data }) => {
                        console.log(provider, 'provider')
                        console.log(data, 'data')
                    }}
                    onReject={(err) => {
                        console.log(err, 'err')
                    }}
                >
                    <FacebookLoginButton />
                </LoginSocialFacebook> */}


            {/* </div> */}
            {/* <div className='m-[0_auto] pb-[10px]'>
                <FacebookLogin
                    appId={"341622788230249"}
                    // appId={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}
                    autoLoad={false}
                    fields="name,email,picture"
                    callback={responseFacebook}
                    // onFailure={(res)=>{
                    //     console.log(res,'err onFailure')
                    // }}
                    cssClass="facebook-login-button p-[8px_40px] flex items-center gap-[10px] text-[13px] border rounded-[3px]"
                    icon="fa-facebook"
                    textButton="Login with Facebook"
                    dispatch
                />
            </div> */}

            {/* </div> */}

        </>
    )
}







