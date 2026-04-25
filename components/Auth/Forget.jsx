import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form';
import styles from '@/styles/Components.module.scss'
import Image from 'next/image';
import { forgetPassword } from '@/libs/api';
import { useRouter } from 'next/router';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AlertUi from '../Common/AlertUi'

export default function Forget({ hide, checkModal,visible, setVisible }) {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    let [msg, setMsg] = useState({})
    let [headerMsg, setHeaderMsg] = useState()
    const forget = async (data) => {
        if (data) {
            // console.log(data)
            let datas = { user: data.email }
            const resp = await forgetPassword(datas);
            if (resp.message.status == 'Failed') {
                msg = { message: resp.message.message }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
                setVisible(visible)
            } else {
                msg = { message: ' Password reset link have been sent to your email address' }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
            }
        }
    }

    let [showAlert, setShowAlert] = useState(false)
    const closeModal = () => {
        setShowAlert(false)
          setVisible(visible)
    }
    return (
        <>
            {showAlert && <AlertUi button_2={'Ok'} closeModal={closeModal} isOpen={showAlert} headerMsg={headerMsg} alertMsg={msg} />}


            <div className='w-full text-center'>
                <h2 className='text-[20px] font-semibold primary_color'>Forgot Password</h2>
                <p className='text-[14px]'>Don't have an account? <span className='primary_color text-[15px] cursor-pointer' onClick={() => checkModal('signup')}>Sign Up</span></p>
            </div>
            <form onSubmit={handleSubmit((data) => forget(data))} autoComplete='off'>
                <div className={`flex flex-col py-5 relative`}>
                    <label className={`${styles.label} text-[#808D9E]`} htmlFor='email' >Email </label>
                    <div className='border rounded-[5px] flex gap-[5px] mt-[5px] p-[0_10px] h-[40px] items-center'>
                        {/* absolute  left-[10px] ${errors.email?.message ? 'bottom-[50px]' : 'bottom-[30px]'} */}
                        <Image className={`t-[10px] ${errors.email?.message ? 'bottom-[48px]' : 'bottom-[25px]'} h-[23px] w-[20px] object-contain`} src={'/login/mail-01.svg'} height={15} width={15} alt={"pass"} />
                        <input className={`${styles.input} ${styles.border_left} h-full`} placeholder='Enter Your Email' {...register('email', { required: { value: true, message: 'Email is required' }, pattern: { value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, message: "Please enter a valid email" } },)} />
                    </div>
                    {errors?.email && <p className={`${styles.danger}`}>{errors.email.message}</p>}
                </div>

                <button type="submit" className={`${styles.loginBtn} `}>Submit</button>
            </form>

        </>
    )
}