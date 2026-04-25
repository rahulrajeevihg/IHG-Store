import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MobileHeader = dynamic(() => import("@/components/Headers/mobileHeader/MobileHeader"));
const AuthModal = dynamic(() => import("@/components/Auth/AuthModal"));

import { useRouter } from 'next/router'
import Image from 'next/image';
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { SESSION_EXPIRED_FLAG } from "@/libs/auth";

export default function login() {

  const router = useRouter();
  const [show, setShow] = useState(true)
  useEffect(() => {
   
    const sessionReason = sessionStorage.getItem(SESSION_EXPIRED_FLAG);
    if (sessionReason === 'timeout') {
      toast.info('Session timed out after 20 minutes of inactivity. Please log in again.');
      sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    } else if (sessionReason === 'expired') {
      toast.info('Your session expired. Please log in again.');
      sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
    }

    if (Cookies.get("api_key")) {
      setShow(false)
      hide()
    }else{
      localStorage.clear()
    }
  }, [router])

  function hide() {
    router.push('/')
  }

  

  return (
    <>
      {
        show ?
          <>
            {/* <MobileHeader navigateLink={'/'} back_btn={true} title={'Login'} empty_div={true} /> */}
            {/* <div onClick={() => router.push('/')} className="flex items-center gap-[7px] p-[15px_15px_15px_50px] md:hidden cursor-pointer">
              <div className={`h-[35px] w-[35px] z-10 bg-[#fff] text-black border-[1px]  border-slate-100 rounded-full flex items-center justify-center  cursor-pointer md:hidden`}> <Image className='h-[12px] object-contain' alt="Prev" src={'/rightArrow.svg'} width={35} height={35} /></div>
              <span>Go Home</span>
            </div> */}
            <AuthModal cssClass={'h-[calc(100vh_-_68px)] lg:w-[90%] lg:m-[0_auto] md:p-[20px] lg:p-[50px]'} page={true} hide={hide} />

          </>

          : <></>
      }
    </>
  );
}

export async function getServerSideProps({ req }) {
  const token = req.cookies.api_key || null;

  // If the token exists and the user is on the login page, redirect to the home page or previous URL
  if (token) {
    return {
      redirect: {
        // destination: req.cookies.preurl ? req.cookies.preurl : '/',
        destination: '/',
        permanent: false,
      },
    };
  }

  // If no token, continue rendering the login page
  return {
    props: {}, // Return props for the login page
  };
}
