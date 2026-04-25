import { useEffect, useState, useRef, useMemo } from 'react'
import { stored_customer_info } from '@/libs/api';
import Image from 'next/image';
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic';
const Accordions = dynamic(() => import('@/components/Common/Accordions'), { ssr: false })
// import Accordions from '@/components/Common/Accordions'
import { useSelector } from 'react-redux';

export default function SideMenu({ sideMenu, setSideMenu, logout }) {

  const ref = useRef(null);
  const router = useRouter();
  const loginInfo = useSelector((state) => state.logInInfo.customerInfo)

  let [localValue, setLocalValue] = useState(undefined);

  let shop = [
    {
      title: 'Categories',
      route: '/tabs/category',
      icon: '/Sidemenu/category.svg',
      enable: 1
    },
    // {
    //   title: 'Wishlist',
    //   route: '/tabs/wishlist',
    //   icon: '/Sidemenu/heart.svg',
    //   enable: 1
    // },
    // {
    //   title: 'MyCart',
    //   route: '/tabs/yourcart',
    //   icon: '/Sidemenu/mycart.svg',
    //   enable: 1
    // },
    // {
    //   title: 'Orders',
    //   route: '/tabs/my-orders',
    //   icon: '/Sidemenu/cart.svg',
    //   enable: 1
    // },
    {
      title: 'Profile',
      route: '/profile?my_account=',
      icon: '/Sidemenu/user-sidemenu.svg',
      enable: 1
    },
    // {
    //   title: 'Wallet',
    //   route: '/tabs/wallet',
    //   icon: '/Sidemenu/wallet.svg',
    //   enable: 1
    //   // (this.db.website_settings && this.db.website_settings.enable_wallet == 1) ? 1 : 0
    // },
    // {
    //   title: 'Reward Points',
    //   route: '/reward-points',
    //   icon: '/Sidemenu/Reward.svg',
    //   enable: 0
    //   // (this.db.website_settings && this.db.website_settings.enable_loyalty == 1) ? 1 : 0
    // },
  ]

  let policy = [
    {
      title: 'Terms & conditions',
      // route:'/terms/terms-condition',
      icon: '/Sidemenu/terms.svg',
      enable: 1
    },
    {
      title: 'Privacy Policy',
      // route:'/terms/privacy-policy',
      icon: '/Sidemenu/privacy-policy.svg',
      enable: 1
    },
    {
      title: 'Return Policy',
      // route:'/terms/return-policy',
      icon: '/Sidemenu/privacy-policy.svg',
      enable: 1
    },
    {
      title: 'Cancellation Policy',
      // route:'/terms/return-policy',
      icon: '/Sidemenu/cancellation-policy.svg',
      enable: 0
    }
  ]


  let menu = [
    {
      title: 'Home',
      route: '/',
      icon: '/Sidemenu/home.svg',
      enable: 1,

    },
    {
      title: 'Shop',
      icon: '/Sidemenu/shop.svg',
      enable: 1,
      child: shop,
    },
    // {
    //   title: 'Policies',
    //   // route: '/terms-condition',
    //   icon: '/Sidemenu/terms.svg',
    //   enable: 1,
    //   child: policy,
    // },

  ]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let localValue = stored_customer_info()
      setLocalValue(localValue);
      // let childMenus = menu.filter(res=>{return (res.child && res.child.length != 0)})
      // let datas = [];

      // if(childMenus.length != 0){
      //   childMenus.map(res=>{
      //     datas.push({ title: res.title, content: res.child })
      //   })
      // }

      // setAccordionData(datas)
    }
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target) && sideMenu) {
        setSideMenu(false)
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [])

  function menuClickFn(res) {
    if (res.route) {
      router.push('/' + res.route);
      setSideMenu(false)
    }
  }

  function loginAndlogout() {
    if (localValue && localValue.cust_name) {
      logout()
      setSideMenu(false)
    } else {
      router.push('/login')
    }
  }


  useMemo(() => {
    if (loginInfo && loginInfo.logout) {
      let localValue = stored_customer_info()
      setLocalValue(localValue);
    }
  }, [loginInfo])

  return (
    <>
      <div className='p-[10px] h-[calc(100vh_-_55px)] overflow-auto scrollbarHide' ref={ref} >

        <div className='min-h-[70px] flex items-center justify-start gap-[10px]'>
          <div className="flex items-center h-[50px]"><Image className='h-[45px] w-[60px] object-contain' height={100} width={100} src={'/Tabs/Profile-Avatar.svg'} alt='profile'></Image></div>
          {(localValue && localValue.cust_name) ?
            <div>
              <h6 className='text-[15px] font-semibold'>{localValue.cust_name}</h6>
            </div>
            :
            <h6 className='text-[15px] font-semibold'>Hello,</h6>
          }
        </div>

        <ul>
          {
            menu.map((res, index) => {
              return (
                <>
                  {res.enable == 1 &&
                    <>
                      {(res.child && res.child.length != 0) ?
                        <Accordions menuName={'sideMenu'} items={res.child} obj={res} indexValue={index} menuClickFn={menuClickFn} />
                        :
                        <li onClick={() => { menuClickFn(res) }} className='flex items-center gap-[6px] p-[10px_13px]'>
                          <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[25px] object-contain' height={40} width={40} alt='vantage' src={res.icon}></Image>
                          <h5 className='text-[14px] font-medium'>{res.title}</h5>
                        </li>
                      }
                    </>
                  }

                </>
              )
            })
          }
        </ul>

        <div onClick={() => { loginAndlogout() }} className='flex items-center gap-[6px] p-[10px_13px] fixed bottom-0 right-0 left-0 w-full bg-[#fff] z-[99] h-[55px] border-t-[1px] border-t-slate-200'>
          <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[25px] object-contain' height={40} width={40} alt='vantage' src={(localValue && localValue.cust_name) ? '/Sidemenu/login.svg' : '/Sidemenu/logout.svg'}></Image>
          <h5 className='text-[14px] font-medium'>{(localValue && localValue.cust_name) ? 'Logout' : 'Login'}</h5>
        </div>
      </div>
    </>
  )


}