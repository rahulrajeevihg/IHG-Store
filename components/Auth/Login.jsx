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
import { touchSessionActivity } from '@/libs/auth';

export default function LogIn({ hide, checkModal }) {

    const [show, setShow] = useState(false)
    let [msg, setMsg] = useState({})
    let [headerMsg, setHeaderMsg] = useState()
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const dispatch = useDispatch();

    let [remember_me_check, setRememberMe] = useState(false)

    useEffect(() => {
        let cookie_username;
        let cookie_password;
        let cookie_user_type;
        let username1 = document.getElementById('emailId')
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
            }
        }

    }, [])

    function clearErrors(fieldName) {
        const form = document.querySelector('form');
        form.reset({ fieldName });
    }

    async function log_in(data) {
        const email = data?.email || document.getElementById('emailId')?.value;
        const password = data?.password || document.getElementById('password')?.value;

        if (email && password) {
            let datas = {
                email: email,
                pwd: password
            }
            let val = await login(datas);

            if (val?._error) {
                msg = { message: val?.message?.message || 'Login failed. Please try again.' }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
                return;
            }

            if (val && (val.message === 'Logged In' || val.message?.message === 'Logged In')) {
                touchSessionActivity();

                localStorage['full_name'] = val.full_name || '';
                if (val.message?.roles) {
                    localStorage['roles'] = JSON.stringify(val.message.roles);
                }

                dispatch(setCustomerInfo(val));
                dispatch(setDetail(val))

                await getCustomerInfo({ email: email, guest_id: localStorage['customerRefId'] }, { usr: email, pwd: password });

                hide()
            } else {
                const errMsg = val?.message?.message || val?.message || 'Invalid credentials. Please try again.';
                msg = { message: errMsg }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
            }
        }
    }

    const rememberMe = (queryparam) => {
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
        if (resp && Array.isArray(resp.message) && resp.message.length > 0) {
            storeCustomerInfo(resp);
            document.cookie = `customerRefId=${localStorage["customerRefId"]};expires=${dateNow}`;
            dispatch(setCustomerInfo(resp.message[0]));
            dispatch(setDetail(resp.message[0]))

            let queryparam = { 'username': datas.usr, 'password': datas.pwd, 'customer_id': resp.message[0]?.name || '' }

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
    }

    const handleSuccess = (response) => {
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
        if (resp.message && resp.message.message && resp.message.message == 'Logged In') {
            localStorage['api_key'] = resp.message.api_key
            localStorage['api_secret'] = resp.message.api_secret
            touchSessionActivity();

            let mail = {
                email: data.email,
                guest_id: localStorage['customerRefId']
            }
            const res = await get_customer_info(mail);
            if (res && res.message && res.message.length != 0) {
                storeCustomerInfo(res);
                dispatch(setCustomerInfo(res.message[0]));
                dispatch(setDetail(res.message[0]))
                localStorage['roles'] = JSON.stringify(res.message[0].roles_list);
            }
            localStorage['full_name'] = resp.full_name;
            hide()
        } else {
            msg = { message: (resp && resp.message && resp.message.message) ? resp.message.message : 'Something went wrong try again later' }
            setMsg(msg)
            headerMsg = 'Alert'
            setHeaderMsg(headerMsg)
            setShowAlert(true)
        }
    }

    return (
        <>
            <style>{`
                .glass-login-container {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    overflow: hidden;
                    padding: 24px;
                }
                .glass-login-container::before {
                    content: '';
                    position: absolute;
                    top: -20%;
                    right: -10%;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .glass-login-container::after {
                    content: '';
                    position: absolute;
                    bottom: -20%;
                    left: -10%;
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
                    pointer-events: none;
                }
                .glass-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 400px;
                    padding: 48px 44px;
                    background: #ffffff;
                    border: 1px solid rgba(99, 102, 241, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.08);
                    animation: cardSlideIn 0.5s ease-out;
                }
                @keyframes cardSlideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .logo-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 28px;
                }
                .logo-wrapper img {
                    width: 56px;
                    height: 56px;
                }
                .glass-title {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: #0f172a;
                    text-align: center;
                    margin-bottom: 6px;
                    letter-spacing: -0.5px;
                }
                .glass-subtitle {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 14px;
                    color: #64748b;
                    text-align: center;
                    margin-bottom: 32px;
                }
                .glass-form-group {
                    margin-bottom: 18px;
                }
                .glass-label {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 7px;
                    letter-spacing: 0.1px;
                }
                .glass-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 14px;
                    height: 46px;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                .glass-input-wrapper:focus-within {
                    background: #ffffff;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
                }
                .glass-input-wrapper svg {
                    width: 17px;
                    height: 17px;
                    color: #94a3b8;
                    flex-shrink: 0;
                }
                .glass-input-wrapper:focus-within svg {
                    color: #6366f1;
                }
                .glass-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 14px;
                    outline: none;
                    padding: 0;
                }
                .glass-input::placeholder {
                    color: #c0ccd9;
                }
                .glass-toggle-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    color: #94a3b8;
                    transition: color 0.2s ease;
                }
                .glass-toggle-btn:hover {
                    color: #6366f1;
                }
                .glass-toggle-btn svg {
                    width: 17px;
                    height: 17px;
                }
                .glass-error {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 12px;
                    color: #ef4444;
                    margin-top: 5px;
                }
                .glass-submit-btn {
                    width: 100%;
                    height: 46px;
                    margin-top: 24px;
                    background: #4f46e5;
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                    letter-spacing: 0.2px;
                }
                .glass-submit-btn:hover {
                    background: #4338ca;
                    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
                    transform: translateY(-1px);
                }
                .glass-submit-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
                }
                .glass-checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin: 18px 0 0 0;
                }
                .glass-checkbox {
                    appearance: none;
                    -webkit-appearance: none;
                    width: 17px;
                    height: 17px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 5px;
                    cursor: pointer;
                    background: #ffffff;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    position: relative;
                }
                .glass-checkbox:checked {
                    background: #4f46e5;
                    border-color: #4f46e5;
                }
                .glass-checkbox:checked::after {
                    content: '';
                    position: absolute;
                    left: 4px;
                    top: 1px;
                    width: 5px;
                    height: 9px;
                    border: 2px solid #ffffff;
                    border-top: none;
                    border-left: none;
                    transform: rotate(45deg);
                }
                .glass-checkbox-label {
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                    font-size: 13px;
                    color: #4b5563;
                    cursor: pointer;
                    user-select: none;
                }
                @media (max-width: 640px) {
                    .glass-card {
                        max-width: 100%;
                        padding: 36px 28px;
                    }
                    .glass-title {
                        font-size: 22px;
                    }
                }
            `}</style>
            {showAlert && <AlertUi button_2={'Ok'} closeModal={closeModal} isOpen={showAlert} headerMsg={headerMsg} alertMsg={msg} />}

            <div className='glass-login-container'>
                <div className='glass-card'>
                    <div className='logo-wrapper'>
                        <Image
                            height={56}
                            width={56}
                            src="/logo.png"
                            alt="IHG Logo"
                            priority
                        />
                    </div>

                    <h1 className='glass-title'>Welcome Back</h1>
                    <p className='glass-subtitle'>Sign in to your IHG account</p>

                    <form onSubmit={handleSubmit((data) => log_in(data))} autoComplete='off'>
                        <div className='glass-form-group'>
                            <label htmlFor='email' className='glass-label'>Username</label>
                            <div className='glass-input-wrapper'>
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                    <path d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                                </svg>
                                <input
                                    id='emailId'
                                    type='text'
                                    placeholder='Enter your username'
                                    className='glass-input'
                                    {...register('email')}
                                />
                            </div>
                            {errors?.email && <p className='glass-error'>{errors.email.message}</p>}
                        </div>

                        <div className='glass-form-group'>
                            <label htmlFor='password' className='glass-label'>Password</label>
                            <div className='glass-input-wrapper'>
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                    <path d='M12 1C6.5 1 2 5.5 2 11v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-5.5-4.5-10-10-10zm0 2c4.4 0 8 3.6 8 8v2h-1V9c0-3.9-3.1-7-7-7s-7 3.1-7 7v4H4v-2c0-4.4 3.6-8 8-8z' strokeWidth='1.5'/>
                                </svg>
                                <input
                                    id='password'
                                    type={show ? 'text' : 'password'}
                                    placeholder='••••••••'
                                    className='glass-input'
                                    {...register('password', { required: { value: true, message: 'Password is required' } })}
                                />
                                <button
                                    type='button'
                                    className='glass-toggle-btn'
                                    onClick={() => setShow(!show)}
                                    aria-label='Toggle password visibility'
                                >
                                    {show ? (
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                            <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                                            <circle cx='12' cy='12' r='3' strokeWidth='1.5' fill='none'/>
                                        </svg>
                                    ) : (
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                            <path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                                            <line x1='1' y1='1' x2='23' y2='23' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <p className='glass-error'>{errors.password.message}</p>}
                        </div>

                        <div className='glass-checkbox-group'>
                            <input
                                type='checkbox'
                                id='rememberMe'
                                className='glass-checkbox'
                                checked={remember_me_check}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor='rememberMe' className='glass-checkbox-label'>
                                Keep me signed in
                            </label>
                        </div>

                        <button type='submit' className='glass-submit-btn'>
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}
