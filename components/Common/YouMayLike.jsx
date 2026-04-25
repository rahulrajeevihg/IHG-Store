import { useEffect, useState } from 'react'
import Image from 'next/image';
import { useRouter } from 'next/router';
// import ImageLoader from '@/components/ImageLoader'
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("@/components/ImageLoader"), { ssr: false });
export default function YouMayLike({ productList, rowCount, scroll_button, scroll_id, productBoxView }) {

  const router = useRouter()
  var slider = '';
  let isDown = false;
  const [sample,setSample] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768; // Adjust this value to define your mobile width threshold
      if (window.innerWidth <= mobileWidth) {
        
      } else {
        scrollingFn()
      }
    };

    handleResize(); // Initial check on component mount

    window.addEventListener('resize', handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener('resize', handleResize); // Clean up the event listener
    };
  }, [])

  function scrollingFn(){
    let slider_child_id = 'sliderID' + (scroll_id ? scroll_id : '')
    if (slider_child_id) {
        slider = document.getElementById(slider_child_id);
        (() => {
            slider.addEventListener('mousedown', start);
            slider.addEventListener('touchstart', start);

            slider.addEventListener('mousemove', move);
            slider.addEventListener('touchmove', move);

            slider.addEventListener('mouseleave', end);
            slider.addEventListener('mouseup', end);
            slider.addEventListener('touchend', end);
        })();
    }
  }

  const sctollTo = (direction) => {

     let slider_child_id = document.getElementById('sliderID' + (scroll_id ? scroll_id : ''))

      if (slider_child_id) {
          let slider_div = slider_child_id;
          let slider_width = slider_child_id.clientWidth
          if (direction == 'next') {
              slider_div.scrollBy({ top: 0, left: 250, behavior: 'smooth' });
          } else {
              slider_div.scrollBy({ top: 0, left: -250, behavior: 'smooth' });
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

  let startX = ''
  let scrollLeft = ''

  // start
  const end = () => {
      isDown = false;
      slider.classList.remove('active');
  }

  const start = (e) => {
      isDown = true;
      slider.classList.add('active');
      startX = e.pageX || e.touches[0].pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
  }

  const move = (e) => {
      if (!isDown) return;

      e.preventDefault();
      const x = e.pageX || e.touches[0].pageX - slider.offsetLeft;
      const dist = (x - startX);
      slider.scrollLeft = scrollLeft - dist;
  }

 

  return (
    <>
    
      <div className={`w-full relative`}>
         
           <div className={`${!scroll_button && 'hidden'} absolute top-[40%] left-[-13px] h-[35px] w-[35px] z-10 bg-[#fff] text-black border-[1px]  border-slate-200 rounded-full flex items-center justify-center  cursor-pointer md:hidden`} onClick={() => sctollTo('prev')} id={'prev_' + (scroll_id ? scroll_id : '')}> <Image className='h-[12px] object-contain' alt="Prev" src={'/rightArrow.svg'} width={35} height={35} /></div>
         
           <ul id={'sliderID' + (scroll_id ? scroll_id : '')} className={`${!scroll_button && 'flex-wrap'} ${scroll_button ? 'gap-[10px]' : ''} product_box w-full flex overflow-auto scrollbarHide lg:gap-[10px] ${(productBoxView && productBoxView == 'List View') ? 'p-[5px]' : ''}`}>
           {productList && productList.length != 0 && productList.map((item, index) => {
            return (
              <li onClick={() => router.push('/pr/' + item.route)}  key={index} className={`${rowCount ? rowCount : 'flex-[0_0_calc(25%_-_8px)]'} ${(productBoxView && productBoxView == 'List View') ? 'md:flex-[0_0_calc(100%_-_0px)] flex items-center mb-[5px] rounded-[5px] md:border-[1px] md:border-slate-200 p-[5px]' : (scroll_button ? 'md:flex-[0_0_calc(60%_-_0px)] rounded-[5px] border-[1px] border-slate-200': 'md:flex-[0_0_calc(50%_-_0px)] md:border-b-[1px] md:odd:border-r-[1px]')} lg:border-[1px] lg:border-slate-200 lg:rounded-[5px] relative bg-[#fff] cursor-pointer`} >
                <div className={`flex cursor-pointer items-center justify-center lg:h-[160px] md:h-[140px] relative ${(productBoxView && productBoxView == 'List View') ? '' : 'p-[10px] '}`}>
                  {/* <Image className='lg:h-[150px] md:h-[125px] object-contain' height={200} width={200} alt='logo' src={check_Image(item.mobile_image)}
                   onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/empty-states.jpg'; 
                  }}
                  ></Image> */}
                  <ImageLoader  height={150} width={200} style={`lg:h-[150px] md:h-[125px] object-contain`} src={item.product_image} title={item.item_title ? item.item_title : 's'}  ></ImageLoader>
                 
                </div>
                <h3  className='text-[14px] cursor-pointer mb-[10px] p-[10px_10px_0_10px] font-semibold line-clamp-2 capitalize text-center'>{item.item_title}</h3>
              </li>
            )
           })}
          </ul>

          <div className={`${!scroll_button && 'hidden'} absolute top-[40%] right-[-13px] h-[35px] w-[35px] z-10 bg-[#fff] text-black border-[1px] border-slate-200  rounded-full flex items-center justify-center cursor-pointer md:hidden`}onClick={() => sctollTo('next')} id={'next_' + (scroll_id ? scroll_id : '')}><Image className='h-[12px] object-contain' alt="forward" src={'/leftArrow.svg'} width={35} height={35} /> </div>
      </div>
    </>
  )
}
