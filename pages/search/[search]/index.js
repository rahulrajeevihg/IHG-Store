import { useEffect } from 'react';
import SearchCom from '@/components/Search/SearchCom'
import { useRouter } from 'next/router'


export default function index() {

  const router = useRouter();

  useEffect(() => {
    // if (router.query.search) {
    //   // setSearchRoute(router.query.search);
    // }
  }, [router])



  return (
    <>

      {router.query.search && <SearchCom searchRoute={router.query.search} />}

      {/* <div className='flex items-center md:hidden pt-[10px] main-width'>
        <BreadCrumb />
      </div>

      <MobileHeader back_btn={true} title={'Search'} empty_div={true} />

      <div class={`lg:flex main-width lg:py-[10px] gap-[10px]`}>

       <div className='lg:hidden  flex items-center justify-center sticky py-[10px] border-b-[1px] border-b-slate-100 top-[50px] bg-[#fff] z-[99]'>
          <div className="p-[5px_10px] h-[38px] flex items-center w-[75%] m-0_auto] border_color rounded-[20px]">
            <input value={searchValue} id='search' onChange={(eve)=>{getSearchTxt(eve)}} onFocus={()=>{ setActiveSearch(true)}} onBlur={()=>{setActiveSearch(true)}} className='w-[95%] text-[14px]' placeholder='Search Products'/>
            {(theme_settings && theme_settings.header_search_icon) && <Image onClick={()=>{searchValue == '' ? null : navigateToSearch('/search/' + searchValue)}} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer' height={25}  width={25} alt='vantage' src={check_Image(theme_settings.header_search_icon)}></Image>}
          </div>
       </div>  
        
        {(router.query.search  && searchValue) ?
         <></>
         :
         <div className="w-full">
           {productList.length != 0 ? <ProductBox productList={productList} rowCount={'flex-[0_0_calc(20%_-_8px)]'}  /> :
            <>{theme_settings && <NoProductFound cssClass={'flex-col h-[calc(100vh_-_265px)] w-full'} api_empty_icon={theme_settings.nofound_img} heading={'No Products Found!'} />}</>
           }
           <div className='more' ref={cardref}></div>
         </div>
        }
      </div> */}
    </>
  )

}

