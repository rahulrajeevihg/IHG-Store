import { useEffect, useMemo, useState, useRef } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/router'
import { check_Image, currencyFormatter1, stored_customer_info, clear_cartitem, get_cart_items, move_all_tocart, get_search_products, typesense_search_items, logout } from '@/libs/api';
import { useSelector, useDispatch } from 'react-redux';

import AlertUi from '@/components/Common/AlertUi';
import AuthModal from '@/components/Auth/AuthModal'
import SearchProduct from '@/components/Search/SearchProduct';
import { setCustomerInfo } from '@/redux/slice/logInInfo';
import { resetCust } from '@/redux/slice/customerInfo';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import SearchCom from '@/components/Search/SearchCom';

import { resetFilters, setAllFilter } from '@/redux/slice/filtersList';
import { resetSetFilters } from '@/redux/slice/ProductListFilters';
import { startTour } from '@/redux/slice/tourSlice';
import { LMSHeaderBadge } from '@/components/LMS';
import dynamic from 'next/dynamic';

export default function MainHeader({ header_template, theme_settings, website_settings, all_categories, navigateDetail }) {

  const router = useRouter();
  const cartCount = useSelector((state) => state.cartSettings.cartCount)
  const wishlistCount = useSelector((state) => state.cartSettings.wishlistCount)
  const cartValue = useSelector((state) => state.cartSettings.cartValue)
  const loginInfo = useSelector((state) => state.logInInfo.customerInfo)
  const business = useSelector((state) => state.webSettings.business);
  const adddressInfo = useSelector((state) => state.webSettings.adddressInfo);
  const cartItems = useSelector((state) => state.cartSettings.cartItems)

  const [loader, setLoader] = useState(false);

  const dispatch = useDispatch();
  const searchRef = useRef(null)

  useMemo(() => {
    // console.log(cartItems,'cartItems')
    // console.log(router,'router')
  }, [cartItems])


  useEffect(() => {
    const handleClickOutside = (event) => {
      // console.log(searchRef.current.contains(event.target))
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // console.log("hello world")
        setActiveSearch(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      // console.log("world hello")
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(false)
  const [activeSearch, setActiveSearch] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [customerName, setCustomerName] = useState()
  const [customerMenu, setCustomerMenu] = useState(false)
  let [enableLocation, setEnableLocation] = useState(false)

  let tabsValue = [
    { 'label': 'Shopping Cart' },
    { 'label': 'Wishlist' }
  ]

  const [tabs, setTabs] = useState(tabsValue)
  let [localValue, setLocalValue] = useState(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let localValue = stored_customer_info()
      setLocalValue(localValue);
    }

    // const handleClick = (event) => {
    //   setActiveSearch(false)
    // };

    // window.addEventListener('click', handleClick);

    // return () => {
    //   window.removeEventListener('click', handleClick);
    // };

  }, [])


  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (business || localStorage['business'] || (adddressInfo && adddressInfo.address)) {
      let localValue = stored_customer_info()
      setLocalValue(localValue);
    }
  }, [business, adddressInfo]);

  const closeModal = () => {
    // console.log("tfgyhujkl")
    setIsOpen(false)
  }

  const openModal = (type) => {
    tabs.map(res => {
      if (res.label == type) {
        res.isActive = true;
      } else {
        res.isActive = false;
      }
    })
    setActiveTab(type)
    setTabs(tabs)
    setIsOpen(true)

  }

  useMemo(() => {

  }, [cartCount, wishlistCount, cartValue, tabs])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((loginInfo && loginInfo.full_name) || localStorage['full_name']) {
      setCustomerName(localStorage['full_name'])
    } else {
      setCustomerName()
    }
  }, [loginInfo])

  const [enableModal, setEnableModal] = useState(false)
  const [alertMsg, setAlertMsg] = useState({})

  async function get_cart_item() {
    // let res = await get_cart_items();
    // if (res && res.message && res.message.status && res.message.status == "success") {
    //   dispatch(setCartItems(res.message));
    // }
  }

  async function ClearCart() {
    setAlertMsg({ message: 'Do you want to delete all the item' });
    setEnableModal(true);
  }

  async function moveToCart() {
    let param = { customer_id: localStorage['customerRefId'] }
    const res = await move_all_tocart(param);
    if (res && res.message && res.message.status == 'success') {
      get_cart_item()
      setAlertMsg({});
      openModal('Shopping Cart')
    }
  }


  async function ModalClose(value) {
    setEnableModal(false);
    if (value == 'Yes') {
      let param = { customer_id: localStorage['customerRefId'] }
      const resp = await clear_cartitem(param);
      get_cart_item()
      setAlertMsg({});

    }
  }

  let [visible, setVisible] = useState(false)
  const hide = () => {
    setVisible(false);
  }
  const checkUser = () => {

    if (localStorage && localStorage['full_name']) {
      moveToProfile()
    } else {
      router.push('/login')
    }
  }

  const [searchProducts, setSearchProducts] = useState([]);

  const initialState = {
    q: "*",
    page_no: 1,
    item_code: "",
    item_description: "",
    sort_by: 'stock:desc',
    hot_product: false,
    show_promotion: false,
    in_stock: false,
    brand: [],
    price_range: { min: 0, max: 100000 },
    stock_range: { min: 0, max: 100000 },
    product_type: [],
    has_variants: false,
    custom_in_bundle_item: false,
    category_list: [],
    item_group: [],
    beam_angle: [],
    lumen_output: [],
    mounting: [],
    ip_rate: [],
    lamp_type: [],
    power: [],
    input: [],
    dimension: '',
    material: [],
    body_finish: [],
    warranty_: [],
    output_voltage: [],
    output_current: [],
    color_temp_: []
  }


  async function getSearchValues(inputText) {
    // let data = { "search_text": inputText, "page_no": 1, "page_len": 15 }
    // let res = await get_search_products(data);
    // setLoader(false)
    // if (res && res.message && res.message.length != 0) {
    //   setSearchProducts(res.message);
    // } else {
    //   setSearchProducts([])
    // }


    if (inputText.length >= 3) {
      const queryParams = new URLSearchParams({
        // q: `${searchType == 'All' ? (inputText ? inputText : '*') : '*'}`,
        q: `${searchType != 'item_code' ? `${inputText}` : inputText}`,
        query_by: `${searchType == 'item_code' ? 'item_code' : "item_name,item_description,item_code"}`,
        page: "1",
        per_page: "20",
        // query_by_weights: "1,2,3",
        exhaustive_search: searchType == 'All' ? "true" : 'false',
        // filter_by: `${searchType != 'All' ? 'item_code:='${inputText} : ''}`
        // filter_by: `${searchType !== 'All' ? `item_code:='${inputText}'` : ''}`
      });

      if (searchType == 'item_code') {
      queryParams.set('infix', 'always');
      }

      const data = await typesense_search_items(queryParams);
      const initialData = data.hits || [];
      setLoader(false)
      if (initialData && initialData.length > 0) {
        setSearchProducts(initialData);
      } else {
        setSearchProducts([]);
      }
    }
    // console.log(initialData, "initialData")

  }

  function getSearchTxt(eve) {
    eve = eve.target.value

    if (eve != '') {
      setSearchValue(eve);
      debounceSearch(eve);
    } else {
      setSearchValue(eve);
      setSearchProducts([])
    }
    // setSearchValue(eve);
    // debounceSearch(searchValue);
  }

  let debounceTimer;
  const debounceSearch = (inputText) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setActiveSearch(true)
      setLoader(true)
      getSearchValues(inputText)
      // console.log('Perform search for:', inputText);
    }, 600); // Adjust the debounce delay (in milliseconds) 
  };

  const [searchType, setSearchType] = useState('')

  async function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (searchValue && searchValue != '') {
        navigateToSearch('/list?search=' + searchValue)
      }
    }
  }


  const handleSearchType = (event)=>{
    setSearchType(event.target.value)
    // setSearchType()
    dispatch(setAllFilter({'search_type': event.target.value}))
  }

  function navigateToSearch(route) {
    router.push(route)
    // setSearchValue('')
    setActiveSearch(false)
  }

  useEffect(() => {
    if (router.asPath === '/list') {
      setSearchValue('')
    }

    dispatch(setAllFilter({'search_type': searchType}))
  }, [router.asPath])

  const productFilter = useSelector((state) => state.FiltersList.filtersValue)


  // useEffect(()=>{
  //   if(router.asPath.includes('/list') && searchValue === ''){
  //     router.replace("/list")
  //   }
  // }, [searchValue])

  const [alertUi, setAlertUi] = useState(false)


  let dropDownList = [
    { 'title': 'My Profile', route: '/profile?my_account=edit-profile' },
    { 'title': 'My Order', route: '/profile?my_account=orders' },
    { 'title': 'My Cart', route: '/profile?my_account=mycart' },
    { 'title': 'Product Queries', route: '/product-queries' },
    { 'title': 'Logout', route: '' },
  ]
  const moveToProfile = () => {
    // console.log(res, "res")

    setAlertUi(true);
    setAlertMsg({ message: 'Are you sure do you want to logout ?' });
  }

  async function handle_logout(value) {
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

  // const hidePopUp=()=>{
  //   setVisible(false)
  // }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {
      closeModal();
      hide()// Call your function to hide the popup
    }
  });

  // if (visible || isOpen) {
  //   document.body.classList.add('active_visible')
  // } else {
  //   document.body.classList.remove('active_visible')
  // }


  // Lock body scroll while the cart/menu overlay is open, restoring the previous
  // value on close OR unmount. Previously this ran in a useMemo gated on
  // cartValue, so closing the overlay while the cart was empty never restored
  // scroll — a stuck-scroll leak.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!(visible || isOpen)) return;
    if (document.body.classList.contains('active_visible')) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [visible, isOpen])

  // console.log(isOpen,"open")



  function closeModalLoaction() {
    setEnableLocation(enableLocation = !enableLocation)
  }

  const dropdownRef = useRef(null);
  const [isLogout, setIsLogout] = useState(false);

  // useEffect(() => {
  //   function handleClickOutside(event) {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setIsLogout(false);
  //     }
  //   }

  //   document.addEventListener("click", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("click", handleClickOutside);
  //   };
  // }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLogout(false);
      }
    };

    if (isLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLogout]);

  const clearSearchValue = () => {
    setSearchType('All')
    setSearchValue('')
    dispatch(resetSetFilters())
    // dispatch(setAllFilter({...initialState}))
    dispatch(setAllFilter({'search_type': ''}))
    dispatch(resetFilters())
    localStorage.setItem('sort_by', 'stock:desc')

    if (router.asPath.includes('/list')) {
      router.push('/list')
      console.log(productFilter)
    }

  }



  return (
    <>
      {/* <ToastContainer position={'bottom-right'} autoClose={2000}  /> */}
      


      {visible && <AuthModal visible={visible} hide={hide} setVisible={setVisible} />}

      {enableModal &&
        <AlertUi isOpen={enableModal} closeModal={(value) => ModalClose(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
      }

      {alertUi &&
        <AlertUi isOpen={alertUi} closeModal={(value) => handle_logout(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
      }

      <div className='flex items-center justify-between gap-[10px] w-[100%]'>
        {header_template && header_template.items.length != 0 &&
          header_template.items.map((res, index) => {
            return (
              <div key={index}>
                {(res.section_name == 'Header Logo' && res.section_type == 'Static Section') &&
                  <div className=''>
                    {/* /h-[100px] */}
                    {/* {theme_settings.website_logo && <Image onClick={() => { router.push('/') }} className='cursor-pointer  w-[150px] object-cover' height={60} width={100} alt='logo' src={check_Image(theme_settings.website_logo)}></Image>} */}
                    <Image onClick={() => { router.push('/') }} className='cursor-pointer object-cover' height={41} width={51} alt='logo' src={'/logo.png'}></Image>
                  </div>
                }

                {(res.section_name == 'Header Menu' && res.section_type == 'Menu') &&
                  <div className={`flex-[0_0_calc(45%_-_0px)] ${router.pathname === '/list' ? 'invisible pointer-events-none' : ''}`}>
                    <div key={index} className={`${website_settings.enable_multi_store == 1 ? 'w-full' : 'w-full'} relative flex justify-end gap-3`}>
                      <select name="" id="" value={searchType} onChange={(e)=> handleSearchType(e)}  className="border border-gray-300 outline-none p-2 rounded-[30px] px-3">
                    <option value="All">All</option>
                    <option value="item_code">Item Code</option>
                  </select>
                      <div className="animated-search-glow p-[5px_10px_5px_20px] h-[35px] flex items-center w-[69.5%] border_color rounded-[30px]">
                        <input data-tour="header-search-input" value={searchValue} autoComplete='off' id='search' spellCheck="false" onKeyDown={handleKeyDown} ref={searchRef} onChange={(eve) => { getSearchTxt(eve) }} onFocus={() => { setActiveSearch(true) }} onBlur={() => { setActiveSearch(true) }} className='w-[95%] text-[14px]' placeholder='Search Products' />
                        {searchValue && <Image onClick={() => clearSearchValue()} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer mr-2' height={25} width={25} alt='vantage' src={'/Navbar/cancel.svg'}></Image>}
                        <Image onClick={() => { searchValue == '' ? null : navigateToSearch('/list?search=' + searchValue) }} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer' height={25} width={25} alt='vantage' src={'/search.svg'}></Image>
                      </div>
                      {searchValue.length >= 3 && (activeSearch && searchProducts && searchProducts.length > 0) && <div className='w-[69.5%] p-[10px] max-h-[350px] min-h-[150px] overflow-auto scrollbarHide absolute top-[43px] bg-[#fff] z-99 rounded-[8px] shadow-[0_0_5px_#ddd]'>
                        <SearchProduct router={router} navigateDetail={navigateDetail} loader={loader} all_categories={all_categories} searchValue={searchValue} get_search_products={get_search_products} searchProducts={searchProducts} theme_settings={theme_settings} navigateToSearch={navigateToSearch} /> </div>}
                    </div>
                  </div>
                }

                {(res.section_name == 'Header Button' && res.section_type == 'Static Section') &&
                  <div className='pl-[15px] flex gap-[25px] items-center justify-end'>


                    <div>
                      <Link href={"/scanner"}>
                        <Image src="/qr_scanner.svg" height={20} width={20} alt="QR scanner" />
                      </Link>
                    </div>

                    <button
                      data-tour="tour-relaunch-button"
                      onClick={() => {
                        try {
                          if (typeof window !== 'undefined') {
                            localStorage.removeItem('ihg_v1');
                            if (router.pathname !== '/list') {
                              router.push('/list').then(() => dispatch(startTour()));
                            } else {
                              dispatch(startTour());
                            }
                          }
                        } catch (error) {
                          console.error('Tour error:', error);
                          toast.error('Unable to start the tour right now.');
                        }
                      }}
                      className="headerBtbs text-[16px] font-bold hover:opacity-70 transition-opacity"
                      title="Restart product tour"
                    >
                      ?
                    </button>

                    <LMSHeaderBadge />

                    {/* <div onClick={() => { checkUser() }} onMouseEnter={() => customerName ? setCustomerMenu(true) : null} onMouseLeave={() => customerName ? setCustomerMenu(false) : null} class="relative  cursor-pointer flex flex-row-reverse items-center">
                      <div className='headerBtbs'>
                        <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[23px]' height={25} width={25} alt='vantage' src={'/profile.svg'}></Image>
                      </div>
                      <p className='text-[16px] font-bold text-center line-clamp-1 bottom-[-21px]'>{customerName ? (customerName) : 'Login'}</p>


                    </div> */}

                    <Link data-tour="header-cart-icon" href="/tabs/yourcart" className="relative headerBtbs text-[#111827]">
                      <CartIcon className='h-[24px] w-[24px]' />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button
                        data-tour="header-user-menu"
                        onClick={() => customerName ? setIsLogout(true) : router.push('/login')}
                        className="flex items-center justify-center"
                      >
                        <p className='text-[16px] font-bold text-center line-clamp-1 bottom-[-21px]'>{customerName ? (customerName) : 'Login'}</p>

                        <div className='headerBtbs'>
                          <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[23px]' height={25} width={25} alt='vantage' src={'/profile.svg'}></Image>
                        </div>
                      </button>

                      {isLogout && customerName && (
                        <div ref={dropdownRef} className="absolute right-0 mt-1 w-48 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 z-50">
                          <div className="text-gray-700">
                            <div
                              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-gray-100 cursor-pointer"
                              onClick={() => { checkUser() }} onMouseEnter={() => customerName ? setCustomerMenu(true) : null}
                            >
                              <Image height={20} width={20} className='size-[15px]' alt='forward' src={'/Navbar/Logout.svg'}></Image>
                              Logout
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                }

              </div>
            )
          })
        }
      </div>
    </>
  )
}

function CartIcon({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H7" />
    </svg>
  );
}
