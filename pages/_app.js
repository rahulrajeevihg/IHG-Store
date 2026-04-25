import '@/styles/globals.scss'
import { memo, useEffect, useState } from 'react'
import ErrorBoundary from '@/components/Exception/ErrorBoundary'
import { get_all_masters } from '@/libs/api';
import store from '@/redux/store'
import dynamic from 'next/dynamic';
const BottomTabs = dynamic(() => import('@/components/Common/BottomTabs'))
const WebHeader = dynamic(() => import('@/components/Headers/WebHeader'))
import RootLayout from '@/layouts/RootLayout'
// const RootLayout = dynamic(() => import('@/layouts/RootLayout'))
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Provider } from 'react-redux'
// import nProgress from "nprogress";
// import "nprogress/nprogress.css"

import 'react-lazy-load-image-component/src/effects/blur.css';
import 'rodal/lib/rodal.css'
import 'react-multi-carousel/lib/styles.css';
import 'tailwindcss/tailwind.css';
const BrandCategory = dynamic(() => import('@/components/Common/BrandCategory'))
import settig from '@/libs/websiteSettings'
import ScrollToTopButton from '@/components/Common/ScrollToTop';
import Image from 'next/image';
const ProductDetail = dynamic(() => import('@/components/Detail/ProductDetail'))
<<<<<<< HEAD
import { enforceSessionTimeout, hasAuthSession, touchSessionActivity } from '@/libs/auth';
=======
>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
// console.log('setting', settig.message)

// import { GoogleOAuthProvider } from '@react-oauth/google';
// import { Poppins } from 'next/font/google'




// const poppins = Poppins({
//   weight: ['300', '400', '500', '600', '700'],
//   display: 'block',
//   preload: true,
//   style: 'normal',
//   subsets: ['latin']
// })


function App({ Component, pageProps }) {

  const router = useRouter();
  let [website_settings, setWebsite_settings] = useState()
  const [activeTab, setActiveTab] = useState(0)
  const [pageKey, setPageKey] = useState(Date.now()); // A unique key for each page
  useEffect(() => {

    // if (navigator && typeof window != 'undefined') {
    //   if ('serviceWorker' in navigator) {
    //     window.addEventListener('load', () => {
    //       // console.log('service work')
    //       navigator.serviceWorker.register('/service-worker.js')
    //         .then(registration => {
    //           // console.log('Service Worker registered: ', registration);
    //         })
    //         .catch(error => {
    //           // console.log('Service Worker registration failed: ', error);
    //         });
    //     });
    //   }
    // }

    // let cls = 0;
    // new PerformanceObserver((entryList) => {
    //   for (const entry of entryList.getEntries()) {
    //     // 500 ms input exclusion window
    //     if (!entry.hadRecentInput) {
    //       cls += entry.value;
    //       console.log('Current CLS value:', cls, entry);
    //     }
    //   }
    //   // the buffered flag enables observer to access entries from before the observer creation
    // }).observe({ type: 'layout-shift', buffered: true });


    get_websiteSettings()

    // setTimeout(() => {
    //   loadScripts()
    // }, 4000);


  }, []);

  useEffect(() => {
<<<<<<< HEAD
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const clearStaleBrowserCaches = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
        }
      } catch (error) {
        console.error("Failed to clear stale service workers or caches", error);
      }
    };

    clearStaleBrowserCaches();
  }, []);

  useEffect(() => {
    // nProgress.configure({ showSpinner: false })
    const handleStart = (e) => {
      touchSessionActivity();
=======
    // nProgress.configure({ showSpinner: false })
    const handleStart = (e) => {
>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
      if (e == '/' && localStorage['api_key']) {
        getValue()
      }
      document.body.style.overflow = "unset"
      setDetailVisible(false);
      // console.log(e,'e')
      if (!e.includes('pr')) {
        const detail = localStorage['product_detail'];
        if (detail && JSON.parse(detail)) {
          localStorage.removeItem('product_detail')
        }
      }
      // nProgress.start()
    };
    const handleComplete = (e) => {
<<<<<<< HEAD
      touchSessionActivity();
=======
>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
      setPageKey(Date.now());
      // nProgress.done()
    };


    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    }

  }, [router])

  async function get_websiteSettings() {
    setWebsite_settings(settig.message);
    // let res = await websiteSettings();
    // if (res && res.message) {
    //   website_settings = res.message;
    //   setWebsite_settings(website_settings)
    // }
  }

  const [categoryData, setCategoryData] = useState([])

  // const getCategoryList = async () => {
  //   try {
  //     const data = await get_all_category()
  //     setCategoryData(data.data)
  //     console.log('catego', data.data)
  //   } catch {

  //   }
  // }


  useEffect(() => {
    // getCategoryList()
    if (typeof window !== "undefined" && localStorage['api_key']) {
      getValue()
    }

  }, [])

<<<<<<< HEAD
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    let lastWrite = 0;

    const recordActivity = () => {
      if (!hasAuthSession()) {
        return;
      }

      const now = Date.now();
      if (now - lastWrite < 15000) {
        return;
      }

      lastWrite = now;
      touchSessionActivity();
    };

    recordActivity();

    const intervalId = window.setInterval(() => {
      enforceSessionTimeout();
    }, 30000);

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
    };
  }, [])

=======
>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
  // const loadScripts = () => {
  //   // let lightScipt = document.createElement('script')
  //   // lightScipt.src = "https://cdn.jsdelivr.net/npm/lightgallery@1.6.12/dist/js/lightgallery.min.js"
  //   // lightScipt.async = true;
  //   let lightLink = document.createElement('link')
  //   lightLink.rel = "stylesheet";
  //   lightLink.href = "https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.6.12/css/lightgallery.min.css"
  //   // let jquery = document.createElement('script')
  //   // jquery.src = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min.js"
  //   // jquery.async = true;
  //   // document.head.appendChild(jquery)
  //   // document.head.appendChild(lightScipt)
  //   document.head.appendChild(lightLink)
  // }


  const getActiveTab = (tab_data) => {
    setActiveTab(tab_data)
  }


  const [tabs, setTabs] = useState([

    {
      menu_label: 'Home',
      alt_menu_label: 'Home Icon',
      redirect_url: '/',
      icon: '/Tabs/Home.svg',
      active_icon: '/Tabs/Home-filled.svg',
      tab: 'home',
      enable: 1,
    },
    {
      menu_label: 'Category',
      alt_menu_label: 'Categories',
      redirect_url: '/tabs/category',
      icon: '/Tabs/Category.svg',
      active_icon: '/Tabs/category-filled.svg',
      tab: 'category',
      enable: 1
    },
    // {
    //   menu_label: 'Brands',
    //   alt_menu_label: 'Brands',
    //   redirect_url: '/tabs/brand-list',
    //   icon: '/Tabs/Cart-1.svg',
    //   active_icon: '/Tabs/Cart-fill.svg',
    //   tab: 'brands',
    //   enable: 1
    // },
    {
      menu_label: 'List',
      alt_menu_label: 'List',
      redirect_url: '/list',
      icon: '/Tabs/list.svg',
      active_icon: '/Tabs/list-filled.svg',
      tab: 'list',
      enable: 1
    },
    {
      menu_label: 'Account',
      alt_menu_label: 'User Profile',
      redirect_url: '/profile',
      icon: '/account.svg',
      active_icon: '/account-filled.svg',
      tab: 'my-profile',
      enable: 1
    },

  ])

  const [shown, setShown] = useState(false)

  useEffect(() => {
    let routeLink = router.asPath;
    let value = tabs.find(res => { return res.redirect_url != '/tabs/yourcart' && res.redirect_url.includes(routeLink) });
    if (value) {
      setShown(true)
    } else {
      if (routeLink && routeLink.includes('/search')) {
        setShown(true)
      } else {
        setShown(false)
      }
    }


    if (routeLink === '/') {
      localStorage.removeItem("sort_by");
    }
  }, [router])


  useEffect(() => {
    const handleBeforeUnload = (event) => {
      localStorage.removeItem("sort_by",);
      // event.preventDefault();
      // event.returnValue = ""; 
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [])

  const [masterValue, setMasterValues] = useState()
  const getValue = async () => {
    try {
      const mastersRes = await get_all_masters(router);
      if (mastersRes && mastersRes.message) {
        // console.log("master", mastersRes.message)
        // console.log(mastersRes.message, "mastersRes.message")
        setMasterValues(mastersRes.message)
        setCategoryData(mastersRes.message.item_group)
      }
      // else{
      //   console.log("error", mastersRes)
      //   router.push("/login")
      //   localStorage.clear();
      // }
    } catch (e) {
      console.error("err", e)
    }
  }


  const [detailVisible, setDetailVisible] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const navigateDetail = (item) => {
    setCurrentProduct(item)
    document.body.style.overflow = "hidden"
    setDetailVisible(true)
  }

  const DetailHide = (status) => {
    setDetailVisible(false)
    document.body.style.overflow = "unset"
    setCurrentProduct(null)
  }

  // console.log(detailVisible);

  return (
    <>
      <script src="https://cdn.jsdelivr.net/npm/typesense-instantsearch-adapter@2/dist/typesense-instantsearch-adapter.min.js"></script>
      {/* <!-- You might want to pin the version of the adapter used if you don't want to always receive the latest minor version --> */}
      <div className="page-container">
        <ErrorBoundary >
          <Provider store={store}>
            <ToastContainer position={'bottom-right'} autoClose={2000} />
            <RootLayout >
              {website_settings && website_settings.app_settings.favicon &&
                <Head>
                  {/* <link rel="shortcut icon" href={check_Image(website_settings.app_settings.favicon)} /> */}
                  <link rel="shortcut icon" href={'/logo.png'} />
                </Head>}

              {router.pathname != "/login" && router.pathname != "/seller/[login]" && <WebHeader website_settings={website_settings && website_settings} categoryData={categoryData} navigateDetail={navigateDetail} />}
              {/* <main className={`${poppins.className} min-h-screen w-full`}> */}
              {/* router.pathname == "/pr/[...detail]" ? pageKey : null */}
              {/* <div key={pageKey} className="page fade-enter fade-enter-active"> */}
              {detailVisible && <ProductDetail visible={detailVisible} productData={currentProduct} hide={DetailHide} />}
              <div className="page fade-enter fade-enter-active">
                <Component  {...pageProps} />
              </div>
              {/* </main> */}
              <div className='lg:hidden'>
                {router.pathname != "/login" && <BottomTabs tabs={tabs} getActiveTab={getActiveTab} activeTab={activeTab} />}
              </div>

              {router.pathname != "/login" && !router.asPath.includes('profile') && <div className="fixed lg:hidden bottom-[90px] right-[20px]">
                <div onClick={() => router.push('/scanner')} className={`size-[50px] bg-[#000] rounded-[50%] flex items-center justify-center`}>
                  <Image height={25} width={25} className='size-[25px]' src={'/scanner-fixed.svg'} alt="Scanner" ></Image>
                </div>
              </div>}


              <div id='footer'>
                {(masterValue && masterValue['item_group']) && (router.pathname != "/login" && !router.asPath.includes('profile') && router.pathname != "/[...list]") && <>
                  <div className="bg-[#F0F0F0] py-[30px]" >

                    <BrandCategory title={'Popular Categories'} keys={'item_group'} masterValue={masterValue} />
                    <BrandCategory title={'Popular Brands'} keys={'brand'} masterValue={masterValue} sliceKey={30} />

                  </div>
                  <div className='border-t border-t-[#ddd] w-full text-center bg-[#F0F0F0] py-2'>
<<<<<<< HEAD
                    © 2025 products.ihgind.com. All Rights Reserved.
=======
                    © 2025 ihg-sigma.vercel.app. All Rights Reserved.
>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
                  </div>

                </>}
              </div>

              <div className='md:hidden'>
                <ScrollToTopButton />
              </div>
            </RootLayout>
          </Provider>
        </ErrorBoundary>
      </div>

    </>
  )
}

export default memo(App)
<<<<<<< HEAD
=======

>>>>>>> e4e0643b7f53e8b6c06657ac882610c03eedce54
