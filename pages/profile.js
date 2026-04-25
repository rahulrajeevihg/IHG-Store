import AlertUi from '@/components/Common/AlertUi'
import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader'
import { resetCust } from '@/redux/slice/customerInfo'
import { setCustomerInfo } from '@/redux/slice/logInInfo'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

const profile = () => {
    const [customerName, setCustomerName] = useState('')
    const [alertUi, setAlertUi] = useState(false)
    const [alertMsg, setAlertMsg] = useState({})
    const dispatch = useDispatch();
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCustomerName(localStorage['full_name'])
        }
    }, [])


    const moveToProfile = () => {
        setAlertUi(true);
        setAlertMsg({ message: 'Are you sure do you want to logout ?' });
    }

    function logout(value) {
        if (value == 'Yes' && alertUi) {
            setAlertUi(false);
            localStorage.clear();
            dispatch(setCustomerInfo({ logout: true }));
            dispatch(resetCust({}));
            toast.success("You have successfully logged out!")
            Cookies.remove('api_key')
            Cookies.remove('api_secret')
            router.push('/login');
        } else {
            setAlertUi(false);
        }
    }

    return (
        <>
            {alertUi &&
                <AlertUi isOpen={alertUi} closeModal={(value) => logout(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
            }

            <MobileHeader back_btn={true} />

            <main className='md:min-h-[calc(100vh_-_115px)] lg:hidden p-[10px] relative'>
                <div className='flex items-center gap-[10px]'>
                    <Image height={50} alt='profile' width={50} src="/profile.svg"></Image>
                    <h6 className='text-[15px] font-semibold'>{customerName}</h6>
                </div>


                <div className='flex items-center justify-between absolute bottom-[10px] w-[95%]'>
                    <div className='flex items-center gap-[10px] cursor-pointer'>
                        <Image height={20} width={20} className='size-[20px]' alt='forward' src={'/Navbar/Logout.svg'}></Image>
                        <h6 onClick={moveToProfile} className={`text-[15px] font-medium`}>Logout</h6>
                    </div>

                    <Image height={20} width={20} className='size-[15px]' alt='forward' src={'/forwardIcon.svg'}></Image>
                </div>
            </main>
        </>
    )
}

export default profile