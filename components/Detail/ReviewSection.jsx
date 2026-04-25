import { useState, useEffect, useRef } from 'react';
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';
import { get_product_reviews_list } from '@/libs/api';
import Image from 'next/image';

export default function ReviewSection({visible, hide , item}) {

  let [data,setData] = useState()
  let [loader,setLoader] = useState(true);
  let [pageLoader,setPageLoader] = useState(false);
  let [no_product,setNoProduct] = useState(true);
  let [page_no,setPageNo] = useState(1);
  let cardref = useRef();

  useEffect(()=>{
  },[])


  useEffect(() => {
    
    getQuestions()

    // const intersectionObserver = new IntersectionObserver(entries => {
    //   console.log('wredsdx')
    //   if (entries[0].intersectionRatio <= 0) return;

    //   if (!no_product) {
    //      if(page_no > 1){
    //         setPageLoader(true)
    //         getQuestions()
    //      }
    //   }
    // });

    // intersectionObserver.observe(cardref?.current);

    // return () => {
    //   cardref?.current && intersectionObserver.unobserve(cardref?.current)
    // }
   
  }, [])

  function loadMore(event){
    // console.log('data');
    if(!no_product){
        let value = event.target.offsetHeight + event.target.scrollTop + 1;
        value = value.toFixed();
        if(value >= event.target.scrollHeight){
        page_no = page_no + 1
        setPageNo(page_no)
        setPageLoader(true)
        getQuestions()
        }
    }
  }

  async function getQuestions() {

      let datas = {
        product:item,
        page_no:page_no - 1,
        page_len:10
      }

      let res = await get_product_reviews_list(datas);
      setLoader(false);
      setPageLoader(false);
  
      if (res && res.message && res.message.length != 0) {
        if (page_no == 1) {
          setData(res.message)
        } else {
          setData(d => d = [...d, ...res.message])
        }

        no_product = false
      } else {
        page_no == 1 ? setData([]) : null;
        no_product = true;
      }

      setNoProduct(no_product)
  }


  return (
    <div className='question-popup'>
      <Rodal visible={visible} animation='slideUp' onClose={()=>{hide(undefined)}}>
      
        <div className='flex flex-col h-full w-full p-[0_10px]'>
          <h6 className='header border-b-[1px] border-slate-200 h-[45px] flex items-center text-[16px] font-semibold p-[10px] mb-[10px]'>Ratings & Reviews</h6>

          {loader ? <Skeleton /> 
           :
            <div onScroll={!no_product ? loadMore : ''} className='scrollbarHide overflow-auto h-full p-0_10px]'>
           {data.map((resp, i) => {
                    return (
                        <div className='py-[7px]' key={resp.customer}>
                            <div className='flex items-center gap-[10px]'><Image className='h-[25px] w-[25px] object-contain' src={'/detail/profile-01.svg'} height={50} width={100} alt={'profile'} /><p className='text-[14px] font-[500] '>{resp.customer}</p></div>
                            
                            <div className='flex items-center flex-wrap gap-[5px]'>
                              <div className='flex items-center  gap-[3px]'>
                                {[0.2, 0.4, 0.6, 0.8, 1].map((res, i) => {
                                   return (
                                    <>{(resp.rating && res <= resp.rating) ? <Image key={i} className='h-[15px] w-[15px] object-contain' src={'/detail/star-f-01.svg'} height={50} width={50} alt={'star' + res} />
                                     : <Image key={i} className='h-[15px] w-[15px] object-contain' src={'/detail/star-01.svg'} height={50} width={50} alt={'star' + res} />
                                    }</>
                                  )
                                })}
                              </div>
                              <p className='text-[14px] capitalize'>{resp.review_title}</p>
                            </div>  
                            
                            <p className='text-[12px] capitalize gray_color'>{resp.review_message}</p>
                        </div>
                    )
                })}
            {/* {pageLoader && 
               <div id="wave">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
               </div>
            } */}
            </div>
          }  

          <div className='more' ref={cardref}></div>

        </div>
         

     </Rodal>
    </div>
  )

}


const Skeleton = ({}) =>{
    return(
        <div className="h-[100%] flex flex-col gap-[10px] items-center  justify-center">
          <div class="animate-spin rounded-full h-[40px] w-[40px] border-l-2 border-t-2 border-black"></div>
          <span className='text-[15px]'>Loading...</span>
        </div>
    )
}