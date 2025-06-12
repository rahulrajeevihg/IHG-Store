import { HomePage, seo_Image, getCurrentUrl } from "@/libs/api";
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
// import IsMobile from "@/libs/hooks/resize";
const MobileHeader = dynamic(() => import("@/components/Headers/mobileHeader/MobileHeader"))
const WebPageSection = dynamic(() => import("@/components/Builders/WebPageSection"))
import { resetFilter } from "@/redux/slice/homeFilter";
import { resetFilters } from "@/redux/slice/filtersList";

import Head from 'next/head'
import { useDispatch } from "react-redux";
import { setProductDetail } from "@/redux/slice/productDetail";
const ProductDetail = dynamic(() => import('@/components/Detail/ProductDetail'))
export default function Home() {
  let [isMobile, setIsMobile] = useState(false);
  const webSettings = useSelector((state) => state.webSettings.websiteSettings);
  const router = useRouter();
  const [loading, setLoading] = useState(false)
  const [theme_settings, setTheme_settings] = useState();

  const dispatch = useDispatch();

  useMemo(() => {
    if (webSettings && webSettings.app_settings) {
      let settings = webSettings.app_settings;
      setTheme_settings(settings);
    }
  }, [webSettings]);

  const [data, setData] = useState([])

  useEffect(() => {
    setLoading(true)
    const getData = async () => {
      const param = {
        application_type: "web",
        route: "default-home-page",
      };
      const resp = await HomePage(param);
      const data = resp.message ? resp.message : {}
      setData(data)
      setLoading(false)
    }

    getData();

    dispatch(resetFilter())
    dispatch(resetFilters())

  }, [])


  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768; // Adjust this value to define your mobile width threshold
      if (window.innerWidth <= mobileWidth) {
        isMobile = true
        setIsMobile(isMobile);
      } else {
        isMobile = false
        setIsMobile(isMobile);
      }

    };

    handleResize(); // Initial check on component mount

    window.addEventListener('resize', handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener('resize', handleResize); // Clean up the event listener
    };
  }, []);

  
  const [visible, setVisible] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const navigateDetail = (item) => {
    // console.log(item, "item")
    dispatch(setProductDetail(item.document));
    setCurrentProduct(item.document)
    document.body.style.overflow = "hidden"
    setVisible(true)
  }

  const hide = (status) => {
    setVisible(false)
    document.body.style.overflow = "unset"
    setCurrentProduct(null)
  }


  const memoizedData = useMemo(() => {
    // console.log(data, "data")
    if (data && data.page_content && data.page_content.length != 0) {
      return (
        <>
          {
            data.page_content.map((res, i) => (
              <WebPageSection openDetail={navigateDetail} key={res.section} isLast={i == data.page_content.length - 1} data={res} />
            ))
          }
        </>
      )
    }

  }, [data])




  return (
    <>
      {visible && <ProductDetail visible={visible} product={currentProduct} hide={hide} />}
      <Head>
        {/* <title>{data?.meta_info?.meta_title ? data?.meta_info?.meta_title : "Single Vendor"}</title> */}
        <title>{"IHG"}</title>
        <meta name="description" content={data?.meta_info?.meta_description ? data?.meta_info?.meta_description : "Single Vendor"} />
        <meta property="og:type" content={'Blog'} />
        <meta property="og:title" content={data?.meta_info?.meta_title ? data?.meta_info?.meta_title : "Single Vnedor"} />
        <meta key="og_description" property="og:description" content={data?.meta_info?.meta_description} />
        <meta property="og:image" content={seo_Image(data?.meta_info?.meta_image)}></meta>
        <meta property="og:url" content={getCurrentUrl(router.asPath)}></meta>
        <meta name="twitter:image" content={seo_Image(data?.meta_info?.meta_image)}></meta>
      </Head>

      <div className={`lg:hidden sticky top-0 z-[99] bg-white md:min-h-[45px] md:w-full your-element`}>
        {theme_settings && (
          <MobileHeader home={true} cart={true} search={true} theme_settings={theme_settings} />
        )}
      </div>



      <div className="fade-in min-h-screen">

        {loading ?
          <>
            <div className="animate-pulse">
              <div className="flex items-center justify-center w-full gap-[15px] h-full">
                <div className="w-full home md:min-h-[120px] your-element ">
                  {/* <!-- Skeleton for Image --> */}
                  <div className={`bg-gray-300 w-full ${isMobile ? 'h-[150px] ' : 'h-[500px] '} rounded-md`}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 space-y-2 lg:space-y-4 lg:gap-12 main-width lg:max-w-[1350px] lg:py-10 md:p-[10px] bg-white">
              {
                // Simulate multiple skeleton loaders for grid items
                Array(8).fill(null).map((_, i) => (
                  <div className="flex-[0_0_auto] text-center lg:px-[14px] justify-center flex flex-col space-y-2 items-center cursor-pointer" key={i}>
                    {/* Skeleton loader for Image */}
                    <div className="bg-gray-300 size-[55px] lg:size-[70px] rounded-[50%]"></div>
                    {/* Skeleton loader for Title */}
                    <div className="bg-gray-300 h-[20px] lg:h-[25px] w-3/4 rounded-md"></div>
                  </div>
                ))
              }
            </div>
          </>
          :
          <>
            {memoizedData}
          </>
        }
      </div>




    </>

  );
}


// export async function getServerSideProps() {
//   const param = {
//     application_type: "web",
//     route: "default-home-page",
//   };

//   const resp = await HomePage(param);
//   const data = resp.message ? resp.message : {}


//   if (!data) {
//     return {
//       notFound: true,
//     }
//   }

//   return {
//     props: { data },
//     // revalidate: 120
//   }
// }
