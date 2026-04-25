import { useEffect, useState } from 'react'
import Image from 'next/image';
import dynamic from 'next/dynamic';
const ImageLoader = dynamic(() => import('@/components/ImageLoader'))
import { useSelector } from 'react-redux';
import { check_Image, checkMobile } from '@/libs/api';
// import Link from 'next/link'
import { useRouter } from 'next/router';
const ProductDetail = dynamic(()=> import('../Detail/ProductDetail'))
// import ProductDetail from '../Detail/ProductDetail';

export default function ProductBox({ productList, size, rowCount, leftHorizontalImage, scroll_button, scroll_id, productBoxView, home, remove_bg, openFilter, tabView, pagination,openDetail }) {

  const webSettings = useSelector((state) => state.webSettings.websiteSettings);
  const [sample, setSample] = useState(0)


  const sctollTo = (direction) => {

    let slider_child_id = document.getElementById('sliderID' + (scroll_id ? scroll_id : ''))

    if (slider_child_id) {
      let slider_div = slider_child_id;
      let slider_width = slider_child_id.clientWidth
      if (size) {
        //  console.log(data.left_image ,"ghjkl")
        if (direction == 'next') {
          slider_div.scrollBy({ top: 0, left: 300, behavior: 'smooth' });
        } else {
          slider_div.scrollBy({ top: 0, left: -300, behavior: 'smooth' });
        }
      }
      else {
        if (direction == 'next') {
          slider_div.scrollBy({ top: 0, left: 250, behavior: 'smooth' });
        } else {
          slider_div.scrollBy({ top: 0, left: -250, behavior: 'smooth' });
        }
      }

      let nextBtn = document.getElementById('next_' + (scroll_id ? scroll_id : ''))
      let prevBtn = document.getElementById('prev_' + (scroll_id ? scroll_id : ''))

      // console.log(slider_div.scrollLeft)
      // console.log(slider_div.offsetWidth + slider_div.scrollLeft)
      // console.log(slider_div.scrollWidth)

      if (slider_div.scrollLeft == 0) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
      } else if (slider_div.offsetWidth + slider_div.scrollLeft == slider_div.scrollWidth - 1) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
      } else if (slider_div.scrollLeft > 0) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
      }

      setSample(sample + 1)
    }
  }

  const [isMobile, setIsMobile] = useState()
  useEffect(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile)
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [])

  const checkIsMobile = async () => {
    let isMobile = await checkMobile();
    setIsMobile(isMobile);
  }

  const router = useRouter()
  // const [visible, setVisible] = useState(false)
  // const [currentProduct,setCurrentProduct] = useState(null)
  const navigateDetail = (item) => {
    openDetail(item)
    
    // localStorage['product_detail'] = JSON.stringify(item.document)
    // router.push('/pr/' + item.document.item_code)
  }

  // const hide = (status) => {
  //   setVisible(false)
  //   setCurrentProduct(null)
  // }

  return (
    <>
      {/* {visible && <ProductDetail visible={visible} data={currentProduct} hide={hide} />} */}
      <div className={`w-full relative your-element ${home ? 'md:min-h-[300px]' : ''}`}>

        <div className={`${!scroll_button && 'hidden'} absolute top-[40%] left-[-22px] h-[35px] w-[35px] z-10 bg-[#fff] text-black border-[1px]  border-slate-100 rounded-full flex items-center justify-center  cursor-pointer md:hidden`} onClick={() => sctollTo('prev')} id={'prev_' + (scroll_id ? scroll_id : '')}> <Image className='h-[12px] object-contain' alt="Prev" src={'/rightArrow.svg'} width={35} height={35} /></div>

        <ul id={'sliderID' + (scroll_id ? scroll_id : '')} className={`fade-in ${home ? 'lg:gap-[20px]' : 'lg:gap-[10px]'} ${!scroll_button && 'md:grid md:grid-cols-2'} ${scroll_button ? 'gap-[10px]' : ''} product_box w-full flex overflow-auto scrollbarHide ${(productBoxView && productBoxView == 'List View') ? 'p-[5px] md:grid md:!grid-cols-1 lg:grid lg:grid-cols-2 tab:grid-cols-2 lg:gap-5' : 'lg:grid lg:grid-cols-5 tab:grid-cols-3 2xl:grid-cols-5 lg:gap-3'} ${openFilter && tabView ? (productBoxView && productBoxView == 'List View') ? 'tab:!grid-cols-1' : 'tab:!grid-cols-2' : ''} ${(home) ? 'md:min-h-[300px] md:w-full your-element' : ''}`}>

          {leftHorizontalImage && <Image src={check_Image(leftHorizontalImage)} width={400} height={400} alt="icon1" className="lg:hidden h-[300px] w-[200px] object-cover" />}


          {(productList && productList.length != 0 && Array.isArray(productList)) && productList.map((item, index) => {
            return (
              <li key={index} ref={index == productList.length - 5 ? pagination : null} className={`fade-in ${rowCount ? rowCount : 'flex-[0_0_calc(25%_-_8px)]'} ${(productBoxView && productBoxView == 'List View') ? 'lg:flex-[0_0_calc(50%_-_5px)] md:flex-[0_0_calc(100%_-_0px)] flex items-center mb-[5px] p-[5px] lg:p-[10px] lg:h-fit lg:gap-[10px] lg:rounded-[5px]' : (scroll_button ? 'md:flex-[0_0_calc(60%_-_0px)] ' : 'md:flex-[0_0_calc(50%_-_0px)] lg:flex lg:flex-col lg:justify-between')} relative your-element border`} >


                <div className={`${remove_bg ? '' : 'product_images'} product_images_container  flex cursor-pointer items-center justify-center lg:h-[160px] 2xl:h-[185px] ${(productBoxView && productBoxView == 'List View') ? 'md:h-[140] md:w-[140px] lg:w-[25%] lg:!h-[120px]' : 'md:h-[170px] md:w-[100%] '} your-element `}>
                  <div onClick={() => navigateDetail(item)} className={` ${productBoxView && productBoxView == 'List View' ? 'lg:!h-[120px]' : 'lg:h-[160px] 2xl:h-[185px]'}  md:h-[125px] md:w-[125px] lg:w-full your-element`}><ImageLoader height={(productBoxView && productBoxView == 'List View') ? (isMobile ? 120 : 120) : isMobile ? 125 : window.innerWidth >= 1400 ? 185 : 160} width={'100'} style={`${productBoxView && productBoxView == 'List View' ? 'lg:!h-[120px] lg:rounded-[5px]' : 'lg:h-[160px] 2xl:h-[185px]'}  lg:w-full md:h-[125px] md:w-[125px] object-cover your-element`} src={item.document.website_image_url} title={item.item ? item.item : ''} /></div>
                  {/* <Link onClick={() => navigateDetail(item)} href={'/pr/' + item.document.item_code} className={` ${productBoxView && productBoxView == 'List View' ? 'lg:!h-[120px]' : 'lg:h-[160px] 2xl:h-[185px]'}  md:h-[125px] md:w-[125px] lg:w-full your-element`}><ImageLoader height={(productBoxView && productBoxView == 'List View') ? (isMobile ? 120 : 120) : isMobile ? 125 : window.innerWidth >= 1400 ? 185 : 160} width={'100'} style={`${productBoxView && productBoxView == 'List View' ? 'lg:!h-[120px] lg:rounded-[5px]' : 'lg:h-[160px] 2xl:h-[185px]'}  lg:w-full md:h-[125px] md:w-[125px] object-cover your-element`} src={item.document.website_image_url} title={item.item ? item.item : ''} /></Link> */}
                  {(item.document.offer_rate && (item.document.offer_rate < item.document.rate)) ? <h6 className={`bg-[#009f58]  text-[#fff] p-[1px_5px] absolute top-0 ${productBoxView && productBoxView == 'List View' ? 'right-0 left-auto rounded-[0_5px_0_5px]' : 'left-0 rounded-[0_0_5px_0]'} left-0 text-[12px]`}>{parseInt(((item.document.rate - item.document.offer_rate) / item.document.rate) * 100)}<span className='px-[0px] text-[#fff] text-[12px]'>% (AED {parseFloat(item.document.rate - item.document.offer_rate).toFixed(2)}) off</span> </h6> : <></>}

                </div>

                <div className={`${(productBoxView && productBoxView == 'List View') ? 'md:w-full lg:w-[75%] lg:p-0' : ''} p-[10px]`}>
                  {/* <Link href={'/pr/' + item.route} className={`${productBoxView && productBoxView == 'List View' ? 'h-fit' : 'h-[50px] lg:h-[65px]'} text-[14px] lg:text-[18px] cursor-pointer py-[5px] font-[700] line-clamp-2 capitalize`}>{item.item}</Link> */}

                  <div className={`flex gap-1 mt-2 mb-[5px] ${(productBoxView && productBoxView == 'List View') ? 'lg:m-0 tab:flex-col' : 'flex-row items-center'}`}>
                    {item.document.product_type && <p className={`bg-[#097be42e] text-[#0889ff] uppercase px-[5px] py-0 text-[10px]  tracking-[0.4px] rounded-[3px] w-fit`}>{item.document.product_type}</p>}
                    {item.document.new_arrival === 1 && <p className='bg-[#d0d0d0] px-[5px] py-0 text-[10px] text-[#000] tracking-[0.4px] rounded-[3px] w-fit'>New Arrival</p>}
                    {item.document.hot_product === 1 && <p className='bg-[#d0d0d0] px-[5px] py-0 text-[10px] text-[#000] tracking-[0.4px] rounded-[3px] w-fit'>Upcoming</p>}
                  </div>

                  {/* <div className='flex items-center gap-[10px] justify-between mb-1'> */}
                  <p onClick={() => navigateDetail(item)} className={`line-clamp-1 cursor-pointer text-[14px] md:text-[12px] font-medium md:leading-[2.1] lg:leading-[25px] openSens gray_color`}>{item.document.item_code}</p>

                  {/* mt-1 mb-[5px] min-h-[20px] */}

                  {/* </div> */}

                  <p onClick={() => navigateDetail(item)} className={`line-clamp-1 cursor-pointer mb-1 text-[12px] md:text-[11px] md:leading-[2.1] lg:leading-[20px] openSens text-[#888] ${(productBoxView && productBoxView == 'List View') ? 'lg:m-0 lg:line-clamp-1 cursor-pointer min-h-[unset]' : ''}`}>{item.document.item_name}</p>
                  {/* <p dangerouslySetInnerHTML={{ __html: item.document.item_description }} className={`line-clamp-2 text-[13px] md:text-[12px] md:h-[45px] h-[50px] md:leading-[2.1] lg:leading-[25px] openSens innerHtml_desc`} /> */}

                  {/* {item.document.brand && <p onClick={() => navigateDetail(item)} className={`line-clamp-2 cursor-pointer text-[15px] md:text-[12px] font-semibold md:leading-[2.1] lg:leading-[25px] openSens gray_color`}>Brand : <span className='text-[14px]'>{item.document.brand}</span></p>} */}
                  <div className={`flex items-center gap-5 justify-between mt-2 ${(productBoxView && productBoxView == 'List View') ? 'lg:m-0' : ''}`}>
                    {(webSettings && webSettings.currency) && <h3 className={`text-[14px] primary_color inline-flex gap-[6px] float-left font-semibold openSens `}>AED {item.document.offer_rate > 0 ? (<p className='text-green-600 font-semibold'>{parseFloat(item.document.offer_rate).toFixed(2)} <span className=' line-through font-medium text-gray-700 ml-[2px]'>{parseFloat(item.document.rate).toFixed(2)}</span></p>) : (<p className='font-semibold'>{parseFloat(item.document.rate).toFixed(2)}</p>)}</h3>}

                  </div>

                  <div className='flex items-center gap-1 justify-between md:flex-wrap'>
                    <div className='flex items-center gap-[4px]'>
                      <Image src={'/stock.svg'} height={13} width={13} alt='stock' />
                      {item.document.stock > 0 && <p className={`uppercase lg:text-[10px] 2xl:text-[11px] md:text-[11px] md:leading-[2.1] font-semibold lg:leading-[25px] text-[#189E46]`}>{item.document.stock ? item.document.stock : '0'} {item.document.stock_uom ? item.document.stock_uom : ''}</p>}
                      {item.document.stock < 1 && <p className={`lg:text-[10px] 2xl:text-[11px]  uppercase md:text-[11px] md:leading-[2.1] font-semibold lg:leading-[25px] text-red-600`}>Out of stock</p>}
                    </div>
                    {item.document.brand && <div className='flex items-center gap-[4px]'>
                      <Image src={'/brand.svg'} height={13} width={13} alt='brand' />
                      <p onClick={() => navigateDetail(item)} className={`line-clamp-2 cursor-pointer !lg:text-[9px] md:text-[12px] font-semibold md:leading-[2.1] lg:leading-[25px] openSens gray_color`}><span className='text-[9px] 2xl:text-[11px] md:text-[10px] font-semibold'>{item.document.brand}</span></p>
                    </div>}
                  </div>
                </div>
              </li>
            )
          })}

        </ul>

        <div className={`${!scroll_button && 'hidden'} absolute top-[40%] right-[-10px] h-[35px] w-[35px] z-10 bg-[#fff] text-black border-[1px] border-slate-100  rounded-full flex items-center justify-center cursor-pointer md:hidden`} onClick={() => sctollTo('next')} id={'next_' + (scroll_id ? scroll_id : '')}><Image className='h-[12px] object-contain' alt="forward" src={'/leftArrow.svg'} width={35} height={35} /> </div>

      </div>
    </>
  )
}
