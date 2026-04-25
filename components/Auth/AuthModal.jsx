import { useState } from 'react'
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';
import dynamic from 'next/dynamic';
const Login = dynamic(() => import('./Login'), { ssr: false });
const Forget = dynamic(() => import('./Forget'), { ssr: false });
// import Login from './Login'
// import SignUp from './SignUp'
// import Forget from './Forget'
// import OTP from './OTP'
import { useSelector } from 'react-redux';
import { check_Image } from '@/libs/api';
import Image from 'next/image'
// import GoogleSignInButton from './GoogleSignInButton';

export default function AuthModal({ visible, hide, page, cssClass, setVisible }) {
    //  console.log(page)
    let [modal, setModal] = useState('login');
    let webSettings = useSelector(s => s.webSettings)
    // console.log(webSettings)
    const checkModal = (data) => {
        if (data) {
            // console.log(data)
            setModal(data)
        }
    }

    // if(visible){
    //     document.body.classList.add('active_visible')
    //   }else{
    //     document.body.classList.remove('active_visible')
    //   }

    return (
        <>
            {page ?
                <LoginScreen cssClass={cssClass} webSettings={webSettings} modal={modal} checkModal={checkModal} hide={hide} />
                : <div className='auth_modal'>
                    <Rodal visible={visible} animation='slideUp' onClose={hide}>
                        <LoginScreen visible={visible} setVisible={setVisible} webSettings={webSettings} modal={modal} checkModal={checkModal} hide={hide} />
                    </Rodal>
                </div>
            }
        </>
    )
}


const LoginScreen = ({ webSettings, modal, checkModal, hide, cssClass, visible, setVisible }) => {
    // const handleSuccess = (response) => {
    //     console.log('Google Sign-In success:', response);
    //     // console.log(parseJwt(response.credential))
    //     socialLogin(parseJwt(response.credential))
    // };

    // const handleFailure = (error) => {
    //     console.error('Google Sign-In error:', error);
    // };

    // const parseJwt = (token) => {
    //     var base64Url = token.split('.')[1];
    //     var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    //     var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
    //         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    //     }).join(''));

    //     return JSON.parse(jsonPayload);
    // }

    // const socialLogin = async (data) => {
    //     let payload = {
    //         data: JSON.stringify({
    //             email: data.email,
    //             user_name: data.given_name,
    //             uid: data.jti,
    //             phone: 6381915110,
    //             provider: "oauth-google"
    //         }),
    //         get_user_token: 1
    //     }

    //     const resp = await social_login(payload)
    //     console.log(resp, 'resp')
    // }


    return (
        <div className={`${cssClass ? cssClass : 'h-full'} flex gap-5 w-full md:items-center md:justify-center`}>
            {/* <div className='md:hidden flex-[0_0_calc(60%_-_10px)] h-full'>
                {webSettings && webSettings.websiteSettings && webSettings.websiteSettings.login_image && <Image src={check_Image(webSettings.websiteSettings.login_image)} height={200} width={400} alt={'go-1 Market'} className={`w-full h-full rounded-[10px_0_0_10px]`} />}
            </div> */}
            {webSettings && <div className={`flex w-full flex-col justify-center items-center md:px-[10px]`}>
                <div className='w-full lg:w-[450px] lg:h-[450px]'>
                {modal == 'login' ? <Login checkModal={(mod) => checkModal(mod)} hide={hide} />
                        : modal == 'forget' ? <Forget checkModal={(mod) => checkModal(mod)} hide={hide} visible={visible} setVisible={setVisible} />
                                : <>{modal}</>}
                </div>
                {/* <div> */}
                    {/* <div className='flex h-[50px] w-[75px] rounded-[10px] border cursor-pointer items-center justify-center '> */}
                        {/* <Image height={20} className='h-[25px] w-[25px] object-contain' width={20} alt='google' src={'/google-login.svg'} /> */}
                        {/* <p>Continue with Google</p> onClick={() => signIn('google')} */}
                        {/* {<GoogleLogin buttonText="" clientId="189689673866-irqdceaurkp36epq803g6gdbcsj0rum7.apps.googleusercontent.com" onSuccess={responseGoogle} onFailure={responseGoogle} cookiePolicy={'single_host_origin'}/>} */}
                        {/* <GoogleOAuthProvider clientId="189689673866-irqdceaurkp36epq803g6gdbcsj0rum7.apps.googleusercontent.com"></GoogleOAuthProvider>; */}
                        {/* <GoogleSignInButton onSuccess={handleSuccess} onFailure={handleFailure} /> */}
                        {/* <GoogleLogin
                            onSuccess={handleSuccess}
                            onFailure={handleFailure}
                        /> */}
                        {/* <button onClick={() => signIn("google")}>Login with Google</button> */}
                    {/* </div> */}

                    {/* <div id="apple" className='flex items-center h-[50px] w-[75px] rounded-[10px] cursor-pointer justify-center border'>
                        <Image height={20} className='h-[25px] w-[25px] object-contain' width={20} alt='apple' src={'/Apple-login.svg'} />
                        <p>Continue with Apple</p>
                    </div> */}
                {/* </div> */}
            </div>}
        </div>
    )
}
