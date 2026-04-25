import { useState, useMemo } from 'react'
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router'

export default function MobileCategoryFilter({ category_list, closeModal, data }) {

  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  const router = useRouter();

  useMemo(() => {

    if (webSettings && webSettings.all_categories) {
      // setCurrent_category(webSettings.all_categories);
    }

  }, [webSettings, category_list])

  function navigate(route, obj) {
    if (obj.child && obj.child.length == 0) {
      router.push(route)
    }
  }



  const changeCategory = (item) => {
    router.replace(`/list?category=${item}`, null, { locale: true, scroll: false, shallow: true })
    // router.push("/" + item.redirect_url)
    // const val = item.redirect_url.split("=")[1]
    // console.log(val, "val")
    // dispatch(setFilter([item]))
    // dispatch(setBrand([]))
  }


  return (
    <>

      <div className={`h-full ${data ? "opacity-100" : "opacity-0"} transition-all duration-500 ease-linear overflow-auto scrollbarHide min-h-screen fade-in`}>
        {data.length != 0 &&
          data.map((child1, index1) => {
            return (
              <div className='border-[1px] border-slate-100 rounded-[5px] p-[10px] m-[10px]'>

                <div className='flex items-center'>
                  <h6 key={index1} className="flex items-center w-full gap-[5px] min-h-[40px]">
                    {/* <Image className='cursor-pointer h-[50px] w-[50px] pr-[7px] object-contain rounded-[7px]' height={80} width={80} alt='logo' src={check_Image(child1.mobile_image)}></Image> */}
                    <span onClick={() => { changeCategory(child1) }} className={`${(router.asPath == ('/' + child1)) ? 'primary_color' : ''} w-full cursor-pointer text-[13px] font-medium line-clamp-1`}>{child1}</span>
                  </h6>
                  <Image onClick={() => { changeCategory(child1) }} className='cursor-pointer h-[10px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                </div>


                {/* {(child && child.activeChild == (index1 + 1)) && child1.child.length != 0 &&
                    child1.child.map((child2, index2) => {
                      return (
                        <>
                          <h6 className="flex items-center gap-[5px] pl-[20px] min-h-[38px]">
                            <Image onClick={() => { navigate('/' + child1.route, child1), setChild({ ...child, activeChild_1: (child.activeChild_1 && child.activeChild_1 == (index2 + 1)) ? -1 : (index2 + 1) }) }} key={index2} className='cursor-pointer h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                            <span onClick={() => { child2.route ? (router.push('/' + child2.route), (closeModal && closeModal())) : null }} className={`cursor-pointer w-full text-[12px] font-medium line-clamp-1 ${(router.asPath == ('/' + child2.route)) ? 'primary_color' : ''} `}>{child2.category_name}</span>
                          </h6>
                          {(child && child.activeChild_1 == (index2 + 1)) && child2.child.length != 0 &&
                            child2.child.map((child3, index3) => {
                              return (
                                <h6 onClick={() => { child3.route ? (router.push('/' + child3.route), (closeModal && closeModal())) : null }} key={index3} className="flex items-center gap-[5px] pl-[30px] min-h-[38px]">
                                  <Image className='cursor-pointer h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                                  <span className={`cursor-pointer text-[12px] font-medium line-clamp-1 ${(router.asPath == ('/' + child3.route)) ? 'primary_color' : ''} `}>{child3.category_name}</span>
                                </h6>
                              )
                            })}
                        </>

                      )

                    })} */}

              </div>
            )
          })
        }
      </div>

    </>
  )
}
