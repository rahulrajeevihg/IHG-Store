import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { get_search_products, get_brand_based_products, check_Image, typesense_search_items } from '@/libs/api';
import ProductBox from '@/components/Product/ProductBox'
import { useRouter } from 'next/router'
import NoProductFound from '@/components/Common/NoProductFound';
import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader'
import Image from 'next/image';
import SearchProduct from '@/components/Search/SearchProduct';

export default function SearchCom({ searchRoute = '', title, type }) {

  let [productList, setProductList] = useState([]);
  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  let [searchValue, setSearchValue] = useState(searchRoute)
  const [activeSearch, setActiveSearch] = useState(false);
  const [loader, setLoader] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);

  const router = useRouter();
  let page_no = 1;
  let no_product = false;

  let cardref = useRef();

  useEffect(() => {

    if (searchRoute) {
      setLoader(true)
      getProductList(searchRoute);


      const intersectionObserver = new IntersectionObserver(entries => {

        if (entries[0].intersectionRatio <= 0) return;

        if (!no_product) {
          if (page_no > 1) {
            setPageLoader(true)
            getProductList(searchValue)
          }
        }
      });

      intersectionObserver.observe(cardref?.current);

      return () => {
        cardref?.current && intersectionObserver.unobserve(cardref?.current)
      }
    }

  }, [searchRoute])


  async function getProductList(searchRoute) {

    getSearchProducts(searchRoute)

  }


  async function getSearchProducts(inputText) {
    const queryParams = new URLSearchParams({
      q: `${inputText}`,
      query_by: "item_name,item_code",
      page: page_no,
      per_page: "15",
      exhaustive_search: "true",
      query_by_weights: "4,2"
      // query_by_weights: "1,2,3",
      // filter_by: `item_code:${inputText} || item_description:${inputText}`
    });

    const data = await typesense_search_items(queryParams);
    const res = data.hits || [];
    setLoader(false)
    setPageLoader(false)
    if (res && res.length != 0) {
      if (page_no == 1) {
        setProductList(res)
      } else {
        setProductList(d => d = [...d, ...res])
      }
      page_no = page_no + 1
      no_product = false;
    } else {
      page_no == 1 ? setProductList([]) : null;
      no_product = true;
    }
  }

  const [theme_settings, setTheme_settings] = useState()

  useMemo(() => {
    if (webSettings && webSettings.app_settings) {
      let settings = webSettings.app_settings;
      setTheme_settings(settings);
    }

  }, [webSettings])

  // useMemo(() => {
  //    console.log('loader',loader)
  // }, [loader])

  async function handleKeyDown(event) {
    if (event.key === 'Enter') {
      if (searchValue && searchValue != '') {
        if (searchRoute == '') {
          navigateToSearch('/search/' + searchValue)
        } else {
          setLoader(true)
          page_no = 1;
          no_product = true;
          getProductList(searchValue)
        }
      }
    }
  }

  function getSearchTxt(eve) {
    searchValue = eve.target.value
    // console.log(searchValue)
    if (searchValue != '') {
      setLoader(true)
      page_no = 1;
      no_product = true;
      getProductList(searchValue)
    }

    setSearchValue(searchValue);
  }


  function navigateToSearch(route) {
    router.push(route)
    // setSearchValue('')
    setActiveSearch(false)
  }

  useEffect(()=>{
    if(router.asPath === '/list'){
      setSearchValue('')
    }
  },[router.asPath])

  return (
    <>
      <div className='flex items-center md:hidden pt-[10px] main-width '>
        {/* <BreadCrumb /> */}
      </div>

      <MobileHeader back_btn={true} title={title ? title : (searchRoute == '' ? 'Search' : 'Search(' + searchRoute + ')')} search={searchRoute == '' ? false : true} empty_div={searchRoute == '' ? true : false} />

      <div class={`lg:flex main-width lg:max-w-[1350px] lg:py-[10px] gap-[10px]`}>

        {/* {searchRoute == '' ? */}

          <>
            <div className='lg:hidden flex items-center justify-center sticky py-[10px] border-b-[1px] border-b-slate-100 top-[50px] bg-[#fff] z-[99]'>
              <div className="p-[5px_10px] h-[38px] flex items-center w-[75%] mx-auto border_color rounded-[20px]">
                <input value={searchValue} id='search' spellcheck="false" onKeyDown={handleKeyDown} onChange={(eve) => { getSearchTxt(eve) }} onFocus={() => { setActiveSearch(true) }} onBlur={() => { setActiveSearch(true) }} className='w-[95%] text-[14px]' placeholder='Search Products' />
                {(theme_settings && theme_settings.header_search_icon) && <Image onClick={() => { searchValue == '' ? null : navigateToSearch('/search/' + searchValue) }} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer' height={25} width={25} alt='vantage' src={'/search.svg'}></Image>}
              </div>
            </div>
            {/* {webSettings.all_categories && <SearchProduct router={router} loader={loader} all_categories={webSettings.all_categories} searchValue={searchValue} get_search_products={get_search_products} searchProducts={productList} theme_settings={theme_settings} navigateToSearch={navigateToSearch} /> } */}
          </>

          {/* : */}

          <div className="w-full md:mb-[65px]">
            {loader ? <Skeleton />
              :
              <>
                {productList.length != 0 ?
                  <ProductBox productList={productList} rowCount={'flex-[0_0_calc(20%_-_8px)]'} /> :
                  <>{theme_settings && <NoProductFound cssClass={'flex-col h-[calc(100vh_-_265px)] w-full'} api_empty_icon={theme_settings.nofound_img} heading={'No Products Found!'} />}</>
                }
              </>
            }

            <div className='more' ref={cardref}></div>
            {pageLoader &&
              <div id="wave">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            }

          </div>

        {/* } */}
      </div>
    </>
  )
}

const Skeleton = ({ }) => {
  return (
    <>
      <div className={`flex items-center animate-pulse lg:gap-[10px] flex-wrap`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((res, index) => {
          return (
            <div className='flex-[0_0_calc(25%_-_8px)] md:flex-[0_0_calc(50%_-_0px)] h-[358px] border-[1px] border-slate-200 rounded-[5px]'>
              <div className='bg-slate-100 h-[182px] md:h-[140px] mb-[10px]'></div>
              <div className='p-[8px]'>
                <div className='bg-slate-100 h-[18px] mb-[5px] w-[80%] rounded-[5px]'></div>
                <div className='bg-slate-100 h-[25px] mb-[5px] w-[100%] rounded-[5px]'></div>
                <div className='bg-slate-100 h-[25px] mb-[5px] w-[60%] rounded-[5px]'></div>
                <div className='bg-slate-100 h-[30px] mb-[5px] w-[75%] rounded-[5px]'></div>
              </div>
              <div className='p-[0_8px_8px_8px] flex items-center justify-between'>
                <div className='bg-slate-100 h-[25px] w-[35%] rounded-[5px]'></div>
                <div className='bg-slate-100 h-[25px] text-end w-[35%] rounded-[5px]'></div>
              </div>
            </div>
          )
        })
        }
      </div>
    </>
  )
}