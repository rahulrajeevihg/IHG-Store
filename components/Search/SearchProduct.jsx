import React, { useState, useEffect, useMemo, useRef } from 'react';
import NoProductFound from '@/components/Common/NoProductFound';
import Image from 'next/image';
import { get_search_products, check_Image } from '@/libs/api';
import dynamic from 'next/dynamic';


export default function SearchProduct({ loader, all_categories, router, searchValue, navigateToSearch, get_search_products, searchProducts, theme_settings, navigateDetail }) {

const setProductDetails = (item)=>{
  localStorage['product_detail'] = JSON.stringify(item.document)
}



  return (
    <>
    
      {searchValue != '' ?
        <div className='md:mb-[65px]'>
          {loader ? <Skeleton /> :
            <>
              {searchProducts.length == 0 ?
                <NoProductFound cssClass={'flex-col h-[calc(100vh_-_265px)]'} api_empty_icon={theme_settings.nofound_img} heading={'No Products Found!'} />
                :
                searchProducts.map((res, index) => {
                  return (
                    <div onClick={() => { navigateDetail(res.document)}} key={index} className='py-[5px] flex items-center border-b-[1px] cursor-pointer border-b-slate-100 last:border-b-[0px] justify-between hover:bg-[#f1f1f1]'>
                      <div className='cursor-pointer flex items-center gap-[10px]' key={index}>
                        <Image className='h-[55px] w-[55px] object-contain' height={60} width={60} alt={res?.document?.item_name} src={check_Image(res?.document?.website_image_url)}></Image>
                        <h6 className='text-[12px] line-clamp-2'>{res?.document?.item_name}</h6>
                      </div>

                      <Image className='h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                    </div>
                  )
                })
              }
            </>
          }
        </div>
        :
        <></>
        // <div className='md:p-[10px]'>
        //   <h6 className="text-[14px] gray_color font-medium pt-[6px] ">Enter a text to search a products...</h6>
        //   <h6 className="text-[15px] font-medium py-[6px]">Top Categories</h6>
        //   <div className='gap-[10px] grid grid-cols-3'>
        //     {all_categories.map((res, index) => {
        //       return (
        //         <div className='cursor-pointer flex items-center justify-center flex-col' onClick={() => { navigateToSearch('/' + res.route) }} key={index}>
        //           {/* <Image  className='h-[50px] object-contain' height={60}  width={60} alt='logo' src={check_Image(res.mobile_image)}></Image> */}
        //           <h6 className='text-[12px] text-center uppercase '>{res.category_name}</h6>
        //         </div>
        //       )
        //     })}
        //   </div>
        // </div>
      }
    </>
  )
}


const Skeleton = ({ }) => {
  return (
    <>
      <div className={`animate-pulse lg:gap-[10px] flex-wrap`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((res, index) => {
          return (
            <div className='border-b-[1px] border-b-slate-200 p-[10px] flex items-center gap-[10px]'>
              <div className='bg-slate-100 h-[55px] w-[55px] '></div>
              <div className='bg-slate-100 h-[20px] mb-[5px] w-[80%] rounded-[5px]'></div>
            </div>
          )
        })
        }
      </div>
    </>
  )
}