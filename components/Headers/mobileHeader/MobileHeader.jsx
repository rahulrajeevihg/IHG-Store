import { useEffect, useState } from 'react'
import { check_Image, clear_cartitem, get_cart_items, logout } from '@/libs/api';
import Image from 'next/image';
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
const SideMenu = dynamic(() => import('@/components/Headers/mobileHeader/SideMenu'), { ssr: false });
const AlertUi = dynamic(() => import('@/components/Common/AlertUi'), { ssr: false });
const Modals = dynamic(() => import('@/components/Detail/Modals'), { ssr: false });
// import SideMenu from '@/components/Headers/mobileHeader/SideMenu'
// import AlertUi from '@/components/Common/AlertUi';
import { toast } from 'react-toastify';
import { setCustomerInfo } from '@/redux/slice/logInInfo';
import { setCartItems } from '@/redux/slice/cartSettings'
import { resetSetFilters } from '@/redux/slice/ProductListFilters';
import { resetFilters, setAllFilter } from '@/redux/slice/filtersList';
// import Modals from '@/components/Detail/Modals'

export default function MobileHeader({ home, back_btn, share, search, cart, clear_cart, title, titleDropDown, titleClick, empty_div, navigateLink, theme_settings,detailModal }) {

  const router = useRouter();
  const cartCount = useSelector((state) => state.cartSettings.cartCount)
  const [alertUi, setAlertUi] = useState(false)
  const [alertMsg, setAlertMsg] = useState({})
  let [sideMenu, setSideMenu] = useState(false)
  const dispatch = useDispatch();

  function logoutFn() {
    setAlertUi(true);
    setAlertMsg({ message: 'Are you sure do you want to logout ?' });
  }

  async function handle_logout(value) {
    if (value == 'Yes' && (alertMsg && alertMsg.alert == 'cart')) {
      ModalClose(value)
    } else if (value == 'Yes' && alertUi) {
      setAlertUi(false);
      // Invalidate the Frappe session server-side (clears the sid HttpOnly cookie)
      await logout();
      localStorage.clear();
      dispatch(setCustomerInfo({ logout: true }));
      toast.success("You have successfully logged out!")
      router.push('/');
    } else {
      setAlertUi(false);
    }
  }

  async function ClearCart() {
    setAlertMsg({ message: 'Do you want to delete all the item', alert: 'cart' });
    setAlertUi(true);
  }

  async function ModalClose(value) {
    setAlertUi(false);
    if (value == 'Yes') {
      let param = { customer_id: localStorage['customerRefId'] }
      const resp = await clear_cartitem(param);
      get_cart_item()
      setAlertMsg({});

    }
  }

  async function get_cart_item() {
    // let res = await get_cart_items();
    // if (res && res.message && res.message.status && res.message.status == "success") {
    //   dispatch(setCartItems(res.message));
    // }
  }

  const [showSearch, setShowSearch] = useState(false)
  let [searchValue, setSearchValue] = useState('')
  function getSearchTxt(eve) {
    searchValue = eve.target.value
    // console.log(searchValue)
    setSearchValue(searchValue);
  }

  function navigateToSearch(route) {
    router.push(route)
    // setSearchValue('')
  }

  async function handleSearch() {
    if (searchValue !== '') {
      if (searchValue && searchValue != '') {
        navigateToSearch('/list?search=' + searchValue)
      }
    }
  }

  useEffect(()=>{
    if(router.asPath === '/list'){
      setSearchValue('')
    }

    if(router.query.search && router.query.search !== ''){
      setSearchValue(router.query.search)
    }
  },[router.asPath, router.query])

  const clearSearchValue = () => {
    setSearchType('All')
      setSearchValue('')
      dispatch(resetSetFilters())
      // dispatch(setAllFilter({...initialState}))
      dispatch(resetFilters())
      localStorage.setItem('sort_by', 'stock:desc')
  
      if (router.asPath.includes('/list')) {
        router.push('/list')
      }
  
    }

    const [searchType, setSearchType] = useState('')

    const handleSearchType = (event)=>{
        setSearchType(event.target.value)
        // setSearchType()
        dispatch(setAllFilter({'search_type': event.target.value}))
      }
  // console.log('route', router.query.search)

  return (
    <>

      {sideMenu &&
        <>
          <div className={`fixed sidebar ${sideMenu ? 'sideActive' : ''} `} >
            <SideMenu setSideMenu={setSideMenu} sideMenu={sideMenu} logout={logoutFn} />
          </div>
          <Backdrop />
        </>
      }


      {alertUi &&
        <AlertUi isOpen={alertUi} closeModal={(value) => handle_logout(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
      }

      <div className='lg:hidden md:min-h-[45px] your-element border-b-[1px] border-b-slate-100 sticky top-0 z-[99] bg-white'>
        
        {
          <div className={`flex items-center justify-between p-[10px] min-h[40px]`}>
            {back_btn &&
              <div className='flex items-center gap-5'>
                <div onClick={() => { detailModal ? detailModal(null) : navigateLink ? router.push(navigateLink) : router.back() }} className='flex items-center justify-center  h-[30px] w-[30px] cursor-pointer primary_bg rounded-[50%]'>
                  <Image style={{ objectFit: 'contain' }} className='h-[15px] object-contain' height={40} width={40} alt='vantage' src={'/Arrow/rightArrowWhite.svg'}></Image>
                </div>
                <Image onClick={() => router.push('/')} className='w-auto h-[20px] object-contain' height={60} width={100} alt='logo' src={'/logo.png'}></Image>
              </div>
            }

            {
              !back_btn && (
                <div className='flex items-center gap-4'>
                  <div onClick={() => setSideMenu(true)} className="cursor-pointer">
                    <Image src="/Navbar/menu.svg" height={24} width={24} alt="menu" />
                  </div>
                  <Image onClick={() => router.push('/')} className='w-auto h-[20px] object-contain' height={60} width={100} alt='logo' src={'/logo.png'}></Image>
                </div>
              )
            }

            {/* {title &&
              <div onClick={() => { titleClick && titleClick() }} className={`flex items-center justify-center gap-[3px] ${clear_cart ? 'w-[50%]' : 'w-[70%]'}`}>
                <h6 className={`text-[15px] text-center font-semibold line-clamp-1`}>{title} </h6>
                {titleDropDown && <Image style={{ objectFit: 'contain' }} className='h-[10px] object-contain' height={20} width={20} alt='vantage' src={'/Arrow/downArrowBlack.svg'}></Image>}
              </div>
            } */}

            {(search || (router.query.search)) &&
              <div className={`flex items-center gap-[8px] transition-all ease-in duration-500 delay-100 ${showSearch ? 'w-[250px]' : ''}`}>
                {search &&
                  <>
                    {/* router.push('/search') */}
                    <select name="" id="" value={searchType} onChange={(e)=> handleSearchType(e)}  className="border border-gray-300 outline-none p-[5px_10px] rounded-[30px]">
                    <option value="All">All</option>
                    <option value="item_code">Item Code</option>
                  </select>
                    {!showSearch && <div onClick={() => { setShowSearch(!showSearch) }} className='flex transition-all ease-in duration-500 delay-100 items-center justify-end'>
                      <Image onClick={() => { }} style={{ objectFit: 'contain' }} className='h-[20px] object-contain' height={40} width={40} alt='vantage' src={'/search.svg'}></Image>
                    </div>}

                    <div className={`transition-all ease-in duration-500 delay-100 ${!showSearch ? 'h-0 w-0 opacity-0' : 'opacity-100 p-[5px_10px] h-[30px] flex items-center w-full border_color rounded-[20px]'} `}>
                      
                      <input id='search' value={searchValue} spellcheck="false" onChange={(eve) => { getSearchTxt(eve) }} className='w-[95%] text-[14px]' placeholder='Search Products' />
                      {searchValue && <Image onClick={() => clearSearchValue()} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer mr-2' height={25} width={25} alt='vantage' src={'/Navbar/cancel.svg'}></Image>}
                      <Image onClick={() => { searchValue == '' ? null : handleSearch() }} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer' height={25} width={25} alt='vantage' src={'/search.svg'}></Image>
                    </div>
                  </>
                }


              </div>
            }


            {empty_div &&
              <div></div>
            }
          </div>
        }
      </div>
    </>
  )


}


const Backdrop = () => {
  return (
    <div className='backdrop'>
      <div className="h-[100%] flex flex-col gap-[10px] items-center  justify-center">
        <div class="animate-spin rounded-full h-[40px] w-[40px] border-l-2 border-t-2 border-black"></div>
      </div>
    </div>
  )
}

