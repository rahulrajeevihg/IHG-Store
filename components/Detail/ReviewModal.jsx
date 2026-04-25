import styles from '@/styles/Components.module.scss'
import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useForm } from "react-hook-form";
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';
import { insert_review, insert_questionaproduct } from '@/libs/api'
import dynamic from 'next/dynamic';
const AlertUi = dynamic(() => import('../Common/AlertUi'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/Auth/AuthModal'), { ssr: false });
// import AlertUi from '../Common/AlertUi'
// import AuthModal from '@/components/Auth/AuthModal'

export default function ReviewModal({ product , type, setData}) {

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
        defaultValues: 
        (type && type == 'Questions') ? 
        {
            // name:localStorage['full_name'],
            // email:localStorage['customerUser_id'],
            question:''
        }:
        {
            // name:localStorage['full_name'],
            // email:localStorage['customerUser_id'],
            title:'',
            message:''  
        }
    });
    let [msg, setMsg] = useState({})
    let [star, setStar] = useState(-1)
    let [headerMsg, setHeaderMsg] = useState()
    let [sample, setSample] = useState(-1)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // setStar(-1)
        // console.log('star',star)

        if (typeof window != 'undefined' && localStorage && localStorage['email']) {
            setValue('name', localStorage['full_name'])
            setValue('email', localStorage['email'])
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {
              closeModal(); 
              hide()// Call your function to hide the popup
            }
          });
          
        if(visible){
            document.body.classList.add('active_visible')
        }else{
            document.body.classList.remove('active_visible')
        }

    }, [])



    const review = async (data) => {
     if(type && type == 'Questions'){
        let params = {
            sender_name: data.name,
            sender_email: data.email,
            sender_phone: localStorage['Customerphone'],
            question: data.question,
            product: product.name,
        }

        let datas = JSON.stringify(params)
        const resp = await insert_questionaproduct({data : datas});
       
        if (resp.message) {
            msg = { message: 'Thanks for your response !' }
            setMsg(msg)
            headerMsg = 'Alert'
            setHeaderMsg(headerMsg)
            setShowAlert(true)
            product.question_answers = product.question_answers ? product.question_answers : []
            product.question_answers.push(resp.message) 
            setData(product)
            setSample(sample + 1);
            // setValue('question', '')
            hide();

        }
     }else{
        if (data) {
            let params = {
                user_name: data.name,
                customer_email: data.email,
                title: data.title,
                message: data.message,
                item: product.name,
                rating: star,
                phone: ''
            }

            let datas=JSON.stringify(params)
            const resp = await insert_review({data : datas});
            if (resp.message) {
                msg = { message: 'Thanks for your response !' }
                setMsg(msg)
                headerMsg = 'Alert'
                setHeaderMsg(headerMsg)
                setShowAlert(true)
                // setValue('message', '')
                hide ()
            }
        }
     }
    }

    const hide = () => {
        setVisible(false);
    }

    let [showAlert,setShowAlert] = useState(false)
    const closeModal = () => {
        setShowAlert(false)
    }

    let [visibleLogin, setVisibleLogin] = useState(false)

    const checkLogin = () => {

      if(type && type == 'Questions'){
        setValue('question', '');
      }else{
        setValue('title', '');
        setValue('message', '');
        setStar(-1);
      }

      if(localStorage['api_key']){
        setVisible(true);
      }else{
        setVisibleLogin(true);
      } 
    }

    function hideAuth(){
       setVisibleLogin(false)
    }
    

    return (
        <>
            {visibleLogin && <AuthModal visible={visibleLogin} hide={hideAuth} />}

            {(type && type == 'Questions') ? 
             <div onClick={() => checkLogin()} className='flex  cursor-pointer items-center justify-end'><div className={`light_bg rounded-[5px] h-[36px] justify-center w-[150px] flex items-center gap-[10px]`}><Image className='cursor-pointer object-contain h-[14px] w-[14px]' src={'/detail/question.svg'} height={100} width={200} alt='share' /><p className='text-[13px]'>Add A Question</p></div></div>
             :
             <div onClick={() => checkLogin()} className='flex  cursor-pointer items-center justify-end '><div className={`light_bg rounded-[5px] h-[36px] justify-center w-[150px] flex items-center gap-[10px] `}><Image className='cursor-pointer object-contain h-[12px] w-[12px]' src={'/detail/plus-01.svg'} height={100} width={200} alt='share' /><p className='text-[13px]'>Add A Review</p></div></div>
            }

            {showAlert && <AlertUi button_2={'Ok'} closeModal={closeModal} isOpen={showAlert} headerMsg={headerMsg} alertMsg={msg} />}

            <div className={`${(type && type == 'Questions') ? 'question_modal' : 'review_modal'}`}>
                <Rodal visible={visible} animation='slideUp' onClose={hide}>
                   
                   <div className='flex flex-col h-full w-full'>

                    <h5 className='text-[14px] font-medium p-[10px] border-b-[1px] border-b-slate-100'>{(type && type == 'Questions') ? 'Add A Question' : 'Add A Review' }</h5>

                    <form className='h-full overflow-auto scrollbarHide' onSubmit={handleSubmit((data) => review(data))} autoComplete='off'>
                        <div className={`flex flex-col py-[15px] `}>
                            <label className={`text-[#808D9E] font-semibold `} htmlFor='name' >Name</label>
                            <input className={`${styles.input1}`} {...register('name', { required: { value: true, message: 'Name is required' } },)} />
                            {errors?.name && <p className={`${styles.danger}`}>{errors.name.message}</p>}
                        </div>

                        <div className={`flex flex-col pb-[15px] `}>
                            <label className={` text-[#808D9E] font-semibold`} htmlFor='email' >Email</label>

                            <input className={`${styles.input1}`} {...register('email', { required: { value: true, message: 'Email is required' }, pattern: { value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, message: "Please enter a valid email" } },)} />

                            {errors?.email && <p className={`${styles.danger}`}>{errors.email.message}</p>}
                        </div>


                       {(type && type == 'Questions') ? 
                          <div className={`flex flex-col pb-[15px] `}>
                                <label className={`text-[#808D9E] font-semibold `} htmlFor='question' >Question</label>
                                <input className={`${styles.input1}`} {...register('question', { required: { value: true, message: 'Question is required' } },)} />
                                {errors?.question && <p className={`${styles.danger}`}>{errors.question.message}</p>}
                          </div>
                         :
                         <>
                            <div className={`flex flex-col pb-[15px] `}>
                                <label className={`text-[#808D9E] font-semibold `} htmlFor='title' >Title</label>
                                <input className={`${styles.input1}`} {...register('title', { required: { value: true, message: 'Title is required' } },)} />
                                {errors?.title && <p className={`${styles.danger}`}>{errors.title.message}</p>}
                            </div>

                            <div className={`flex flex-col pb-[15px] `}>
                                <label className={`text-[#808D9E] font-semibold `} htmlFor='message' >Message</label>
                                <input className={`${styles.input1}`} {...register('message', { required: { value: true, message: 'Message is required' } },)} />
                                {errors?.message && <p className={`${styles.danger}`}>{errors.message.message}</p>}
                            </div>

                            <div className='flex gap-[10px]'>
                               {[0, 1, 2, 3, 4].map((res, i) => {
                                 return (
                                    <div key={res} className='' onClick={() => { setStar(res + 1) }}>
                                        <Image className='h-[35px] w-[35px] object-contain' src={res < star ? '/detail/star-f-01.svg' : '/detail/star-01.svg'} height={50} width={50} alt={'star' + res} />
                                    </div>
                                 )
                               })}
                            </div>
                        </>
                       }

          

                        <button type="submit" className={`h-[40px] float-right primary_bg w-[140px] rounded-[5px] text-white `}>{(type && type == 'Questions') ? 'Ask Question' : 'Submit Review'}</button>
                    </form>

                   </div>

                </Rodal>
            </div>
        </>

    )
} 