import { useState, useEffect, useRef } from 'react';
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';
import { get_product_enquiries } from '@/libs/api';
import Image from 'next/image';

export default function QuestionSection({visible, hide , item}) {

  let [data,setData] = useState()
  let [loader,setLoader] = useState(true);
  let [pageLoader,setPageLoader] = useState(false);
  let [no_product,setNoProduct] = useState(true);
  let [page_no,setPageNo] = useState(1);
  let cardref = useRef();

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
        item:item,
        page_no:page_no,
        page_len:10
      }

      let res = await get_product_enquiries(datas);
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
          <h6 className='header border-b-[1px] border-slate-200 h-[45px] flex items-center text-[16px] font-semibold p-[10px] mb-[10px]'>Questions</h6>

          {loader ? <Skeleton /> 
           :
            <div onScroll={!no_product ? loadMore : ''} className='scrollbarHide overflow-auto h-full p-0_10px]'>
            {data.map((resp, i) => {
                return (
                <div className={`${resp.is_approved == 1 ? '' :'hidden'} py-[7px]`} key={resp.customer}>
                  <div className='flex items-center gap-[10px]'><Image className='h-[25px] w-[25px] object-contain' src={'/detail/profile-01.svg'} height={50} width={100} alt={'profile'} /><p className='text-[14px] font-[500] '>{resp.user_name}</p></div>
                  <p className='pt-[3px] text-[13px] capitalize'><span className='gray_color text-[12px]'>Question : </span>{resp.question}</p>
                  {resp.answers && resp.answers.length != 0 && 
                    resp.answers.map((res,j)=>{
                      return(
                      <p className='pt-[3px] text-[13px] capitalize'><span className='gray_color text-[12px]'>Answer : </span>{res.answer}</p>
                      )
                  })
                  }
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