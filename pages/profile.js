import AlertUi from '@/components/Common/AlertUi'
import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader'
import { resetCust } from '@/redux/slice/customerInfo'
import { setCustomerInfo } from '@/redux/slice/logInInfo'
import { logout } from '@/libs/api'
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

    async function logout_user(value) {
        if (value == 'Yes' && alertUi) {
            setAlertUi(false);
            // Invalidate the Frappe session server-side (clears the sid HttpOnly cookie)
            await logout();
            localStorage.clear();
            dispatch(setCustomerInfo({ logout: true }));
            dispatch(resetCust({}));
            toast.success("You have successfully logged out!")
            router.push('/login');
        } else {
            setAlertUi(false);
        }
    }

    return (
        <>
            {alertUi &&
                <AlertUi isOpen={alertUi} closeModal={(value) => logout_user(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
            }

            <MobileHeader back_btn={true} />

	            <main className='md:min-h-[calc(100vh_-_115px)] lg:hidden p-[10px] relative'>
	                <div className='flex items-center gap-[10px]'>
	                    <Image height={50} alt='profile' width={50} src="/profile.svg"></Image>
	                    <h6 className='text-[15px] font-semibold'>{customerName}</h6>
	                </div>

	                <div className='mt-[20px] rounded-[16px] border border-[#e7edf3] bg-white p-[14px] shadow-[0_10px_24px_rgba(15,23,42,0.05)]'>
	                    <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]'>Workflow</p>
	                    <h6 className='mt-[6px] text-[15px] font-semibold text-[#111827]'>Product Data Issues</h6>
	                    <p className='mt-[6px] text-[13px] leading-[1.6] text-[#667085]'>
	                        Track the product corrections you have reported and follow the product team workflow.
	                    </p>
	                    <button
	                        type='button'
	                        onClick={() => router.push('/product-data-issues')}
	                        className='mt-[12px] inline-flex h-[42px] items-center rounded-[12px] bg-[#111827] px-[14px] text-[12px] font-semibold uppercase tracking-[0.08em] text-white'
	                    >
	                        Open Issue Queue
	                    </button>
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
