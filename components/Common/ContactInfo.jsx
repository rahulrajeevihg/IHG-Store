import { enquiry_data, check_Image } from '@/libs/api';
import styles from '@/styles/checkout.module.scss';
// import style from '@/styles/Components.module.scss';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
// import ReCAPTCHA from "react-google-recaptcha"
import { useForm } from "react-hook-form";
// import { recaptcha } from "@/libs/config/siteConfig"
import Link from 'next/link'

export default function ContactInfo({ data, contactInfo }) {
    // const siteKey = recaptcha;
    // const [formList, setFormList] = useState({
    //     username: '',
    //     mailid: '',
    //     phonenumber: '',
    //     subject: '',
    //     message: ''
    // })
    // const [errorMessage, setErrorMessage] = useState({})
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const recaptchaRef = useRef();
    const {
        register,
        handleSubmit,reset,
        formState: { errors },
      } = useForm();
    // const handleSumbit = (e) => {
    //     e.preventDefault();
    //     let validationError = {}
    //     if (formList.username.length == 0) {
    //         validationError.username = "username is required"
    //     }

    //     if (formList.mailid.length == 0) {
    //         validationError.mailid = "mailid is required"
    //     } else if (!formList.mailid.match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/)) {
    //         validationError.mailid = 'Invalid email address';
    //     }

    //     if (!formList.phonenumber.match(/^\d{10}$/)) {
    //         validationError.phonenumber = 'Invalid phone number (10 digits required)';
    //     }
    //     if (formList.subject.length == 0) {
    //         validationError.subject = "subject is required"
    //     }
    //     if (formList.message.length == 0) {
    //         validationError.message = "message is required"
    //     }
    //     if(!recaptchaValue){
    //         validationError.recaptchaValue=""
    //     }

    //     setErrorMessage(validationError)

    //     if (Object.keys(validationError).length === 0) {
    //         storeData()
    //         setFormList({
    //             username: '',
    //             mailid: '',
    //             phonenumber: '',
    //             subject: '',
    //             message: ''
    //         })
    //     }
       

    // }

    const storeData = async (data) => {
        // console.log(data)
        // reset()
        const resp = await enquiry_data(data)
        if (resp) { 
            toast.success("Message sent successfully...")
            reset()
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            setRecaptchaValue(null);
         }
    }

    // const handleChange = (e) => {
    //     setFormList({ ...formList, [e.target.name]: e.target.value })
    // }


    return (
        <>
            {/* <ToastContainer position={'bottom-right'} autoClose={2000} /> */}
            <div className="border  flex flex-row md:flex-col-reverse w-full lg:p-2">
                <div style={{ background: data.bt1_bg ? `url(${check_Image(data.bt1_bg)})` : '#f9f9f9' }} className="flex flex-col rounded-[8px] gap-4 flex-[0_0_calc(35%)] py-[10px] px-[30px] !bg-cover !bg-no-repeat">
                    <div >
                        <div className="flex gap-2 items-center py-1">
                            <div className=''>
                                <Image className='h-[21px] w-[23px]' src={check_Image(data.icon)} width={30} height={30} />
                            </div>
                            <p className="text-[14px] text-[#ffff] font-bold">Our Address</p>
                        </div>
                        <p className="text-[#ffff] text-[14px] font-normal">{data.address_content}</p>
                    </div>
                    <div >
                        <div className="flex gap-2 items-center py-1">
                            <div className=''>
                                <Image className='h-[21px] w-[23px]' src={check_Image(data.phone_icon)} width={30} height={30} />
                            </div>
                            <p className="text-[14px] text-[#ffff] font-bold">Mobile</p>
                        </div>
                        <p className="text-[#ffff] text-[14px] font-normal">{data.phone_no}</p>
                    </div>
                    <div className='py-3'>
                        <div className="flex gap-2 items-center py-1">
                            <div className=''>
                                <Image className='h-[21px] w-[23px]' src={check_Image(data.email_icon)} width={30} height={30} />
                            </div>
                            <p className="text-[14px] text-[#ffff] font-bold">Email</p>
                        </div>
                        <p className="text-[#ffff] text-[14px] font-normal">{data.email_id}</p>
                    </div>

                    {data.social_links && data.social_links.length != 0 && <div className='flex items-center flex-wrap gap-[14px] py-[10px]'>
                        {data.social_links && data.social_links.map((res, index) => {
                            return (
                                <div key={index} className='flex items-center justify-center p-[5px] h-[35px] w-[35px]'><Link className='flex items-center justify-center' href={res.redirect_link ? res.redirect_link :'#' } target='_blank'><Image src={check_Image(res.icon)} height={30} width={30} alt='icon' className='h-[20px] w-[25px] object-contain' /></Link></div>
                            )
                        })}
                    </div>}

                </div>
                <form className="flex-[0_0_calc(65%)] py-[10px] px-[30px] lg:p-[50px] md:p-[25px] md:mt-[20px] "     onSubmit={handleSubmit((data) => storeData(data))} autoComplete="off">
                    <h1 className='text-[20px] text-[#070707] font-semibold pb-3'> Send Us A Message  </h1>
                    <div className="flex md:flex-wrap gap-[15px]">
                        <div className="flex-[0_0_calc(50%_-_7px)] md:flex-[0_0_calc(100%_-_7px)]">
                            <label className='text-[14px] text-[#070707] font-medium'  htmlFor="username" >User Name</label>
                            <input   placeholder="User name" className={`w-full ${styles.custom_input}`}   {...register("username", {required: { value: true, message: "Username is required" },})}/>
                            {errors?.username && <p className={`${styles.danger}  pb-1`}>{errors.username.message}</p>}
                        </div>
                        <div className="flex-[0_0_calc(50%_-_7px)] md:flex-[0_0_calc(100%_-_7px)]">
                            <label className='text-[14px] text-[#070707] font-medium' htmlFor="mailid">Email</label>
                            <input  placeholder="Email" className={`w-full ${styles.custom_input}`} {...register("mailid", {required: { value: true, message: "E-mail id is required" },    pattern: {value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,message: "Please enter a valid email",  },})} />
                            {errors?.mailid && <p className={`${styles.danger}  pb-1`}>{errors.mailid.message}</p>}
                        </div>
                    </div>
                    <div className="flex md:flex-wrap gap-[10px]">
                        <div className="flex-[0_0_calc(50%_-_7px)] md:flex-[0_0_calc(100%_-_7px)]">
                            <label className='text-[14px] text-[#070707] font-medium' htmlFor='phonenumber'>Phone Number</label>
                            <input  placeholder="Phone number" className={`w-full ${styles.custom_input}`} {...register("phonenumber", {required: { value: true, message: "Phonenumber is required" },  pattern: {value: /^[0-9]{10}$/,message: "Invalid phone number format",},})}/>
                            {errors?.phonenumber && <p className={`${styles.danger} pb-1`}>{errors.phonenumber.message}</p>}
                        </div>
                        <div className="flex-[0_0_calc(50%_-_7px)] md:flex-[0_0_calc(100%_-_7px)]">
                            <label className='text-[14px] text-[#070707] font-medium' htmlFor='subject'>Subject</label>
                            <input  placeholder="Subject" className={`w-full ${styles.custom_input}`} {...register("subject", {required: { value: true, message: "Subject is required" },})}/>
                            {errors?.subject && <p className={`${styles.danger} pb-1`}>{errors.subject.message}</p>}
                        </div>
                    </div>
                    <div className="flex md:flex-wrap gap-[10px]">
                        <div className="flex-[0_0_calc(100%_-_7px)]">
                            <label className='text-[14px] text-[#070707] font-medium' htmlFor=''>Message</label>
                            <textarea type="text" name='message' placeholder="Message" className={`w-full ${styles.custom_input} outline-none`} rows="4" {...register("message", {required: { value: true, message: "Message is required" },})}/>
                            {errors?.message && <p className={`${styles.danger} pb-1`}>{errors.message.message}</p>}

                        </div>
                    </div>
                    <div className='md:w-[100px]'>
                        {/* <ReCAPTCHA ref={recaptchaRef} sitekey={recaptcha} onChange={(value)=>setRecaptchaValue(value)}  aria-required="true" /> */}
                        {/* {errorMessage.recaptchaValue && <p className={`${style.danger} `}>{errorMessage.recaptchaValue}</p>} */}

                    </div>

                    <div className="flex items-center justify-center mt-[25px]">
                        <button type="submit" className='bg-red-700 text-white h-[40px] md:w-[40%] lg:w-[25%] text-[14px] rounded-sm'>Submit</button>
                    </div>
                </form>
            </div>
        </>

    )
}