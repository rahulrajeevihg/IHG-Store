// export default function Accordion({ data }) {
//     return (
//         <>
//             <div class="group outline-none accordion-section" tabindex="1">
//                 <div class="group bg-gray-900 flex justify-between px-4 py-3 items-center text-gray-500 transition ease duration-500 cursor-pointer pr-10 relative">
//                     <div class="group-focus:text-white transition ease duration-500">
//                         Title for Tab - 1
//                     </div>
//                     <div class="h-8 w-8 border border-gray-700 rounded-full items-center inline-flex justify-center transform transition ease duration-500 group-focus:text-white group-focus:-rotate-180 absolute top-0 right-0 mb-auto ml-auto mt-2 mr-2">
//                         <i class="fas fa-chevron-down"></i>
//                     </div>
//                 </div>
//                 <div class="group-focus:max-h-screen max-h-0 bg-gray-800 px-4 overflow-hidden ease duration-500">
//                     <p class="p-2 text-gray-400 text-justify">
//                         Lorem ipsum dolor sit amet consectetur adipisicing elit. Fugiat,
//                         repellat amet doloribus consequuntur eos similique provident
//                         tempora voluptates iure quia fuga dicta voluptatibus culpa
//                         mollitia recusandae delectus id suscipit labore?
//                     </p>
//                 </div>
//             </div>
//         </>
//     )
// }


import { useState } from 'react';
// import {
//     Accordion,
//     // AccordionItem,
//     AccordionButton,
//     AccordionPanel,
//     AccordionIcon,
//     Box
// } from '@chakra-ui/react'
import dynamic from 'next/dynamic';
import Image from 'next/image';
const ReviewModal = dynamic(() => import('../Detail/ReviewModal'), { ssr: false });
const QuestionSection = dynamic(() => import('../Detail/QuestionSection'), { ssr: false });
const ReviewSection = dynamic(() => import('../Detail/ReviewSection'), { ssr: false });
// import ReviewModal from '../Detail/ReviewModal'
// import QuestionSection from '../Detail/QuestionSection'
// import ReviewSection from '../Detail/ReviewSection'

const Accordions = ({ items, product, menuName, obj, indexValue, menuClickFn, setData }) => {

  const [openIndex, setOpenIndex] = useState(0);

  const handleAccordionClick = (index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className={`your-element ${menuName == 'sideMenu' ? '' : 'my-[10px]'} w-full`}>
      <>
        {!menuName && items.map((res, i) => {
          return (
            <AccordionItem
              key={i}
              title={res.title}
              res={res}
              product={product}
              setData={setData}
              isOpen={i === openIndex}
              onClick={() => handleAccordionClick(i)}
            />
            // <Accordion key={i} allowToggle defaultIndex={i== 0 ? [0] : null} className='mb-[10px]'>
            //     <AccordionItem>
            //         <h2 className='md:font-[500] text-[15px] font-semibold '>
            //             <AccordionButton className='h-[50px] bg-[#f5f5f5] rounded-[5px]'>
            //                 <Box as="span" flex='1' textAlign='left'>
            //                     {res.title}
            //                 </Box>
            //                 <AccordionIcon />
            //             </AccordionButton>
            //         </h2>
            //         <div className="productDetailAccordion">
            //           <AccordionPanel pb={4}>

            //               <>
            //               {(res.title === 'Ratings & Reviews') &&
            //                 <div className=''>
            //                   <Reviews data={res.content} product={product} />
            //                   <ReviewModal product={product} />
            //                 </div>
            //               }

            //               {(res.title === 'Questions') &&
            //                 <div className=''>
            //                   <Questions data={res.content} product={product} />
            //                   <ReviewModal setData={setData} product={product} type={'Questions'} />
            //                 </div>
            //               }

            //               {(res.title === 'Product Specification') &&<div className=''><Specifications data={res.content} /></div>}
            //               {(res.title === 'Highlights') &&<div className=''><HightLights data={res.content} /></div>}
            //               {(res.title === 'Return Policy' || res.title == 'Description' || res.title == 'Product Detail') && <div className={` transition-all  overflow-hidden text-[13px]`} dangerouslySetInnerHTML={{ __html: res.content }} />}
            //               </>

            //           </AccordionPanel>
            //         </div>
            //     </AccordionItem>
            // </Accordion>
          )
        })}


        {menuName == 'sideMenu' &&

          <AccordionItem1
            key={indexValue}
            obj={obj}
            items={items}
            isOpen={indexValue === openIndex}
            onClick={() => handleAccordionClick(indexValue)}
            menuClickFn={menuClickFn}
          />

          //  <Accordion key={indexValue} allowToggle className=''>
          //     <AccordionItem>
          //     <h2 className='md:font-[500] text-[15px] font-semibold '>
          //         <AccordionButton className='h-[50px] rounded-[5px] p-[0px]'>
          //             <Box as="span" flex='1' textAlign='left'>
          //              <div className='flex items-center gap-[8px]'>
          //                <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[25px] object-contain' height={40}  width={40} alt='vantage' src={obj.icon}></Image>
          //                <h5 className='text-[14px] font-medium'>{obj.title}</h5>  
          //              </div>
          //             </Box>
          //             <AccordionIcon />
          //         </AccordionButton>
          //     </h2>
          //     <div className="menuAccordion">
          //         <AccordionPanel pb={4}>
          //             <SideMenu menu={items} menuClickFn={menuClickFn}/>
          //         </AccordionPanel>
          //     </div>
          //     </AccordionItem>
          //  </Accordion>
        }

      </>

    </div >
  );
};

export default Accordions;

const AccordionItem1 = ({ title, obj, isOpen, onClick, items, menuClickFn }) => (
  <div className={`accordion-item ${isOpen ? 'open' : ''}`} >

    <div onClick={onClick} className="flex items-center justify-between cursor-pointer p-[10px_13px] accordion-title">
      <div className='flex items-center gap-[8px]'>
        <Image style={{ objectFit: 'contain' }} className='h-[25px] w-[25px] object-contain' height={40} width={40} alt='vantage' src={obj.icon}></Image>
        <h5 className='text-[14px] font-medium'>{obj.title}</h5>
      </div>
      <Image src={isOpen ? "/up-arrow.png" : "/down-arrow.png"} width={10} height={10} alt="" className={`w-[12px] h-[12px] opacity-[0.6] transition ease-in-out duration-500`} />
    </div>

    <div className={`${isOpen ? 'block p-[0px_10px_10px_10px] bg-[#f5f5f5]' : 'hidden'} productDetailAccordion`}>
      <>
        <SideMenu menu={items} menuClickFn={menuClickFn} />
      </>

    </div>

  </div>
);

const AccordionItem = ({ title, res, isOpen, onClick, setData, product }) => (
  <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
    {/* <div>
      
    </div> */}
    <div onClick={onClick} className="flex items-center justify-between cursor-pointer  p-[0_15px] h-[50px] light_bg mb-[10px] accordion-title rounded-[5px]">
      <h5 className={`text-[14px] font-medium `}>{title}</h5>
      <Image src={isOpen ? "/up-arrow.png" : "/down-arrow.png"} width={10} height={10} alt="" className={`w-[12px] h-[12px] opacity-[0.6] transition ease-in-out duration-500`} />
    </div>

    <div className={`${isOpen ? 'block m-[0px_10px_10px_10px]' : 'hidden'} productDetailAccordion`}>
      <>
        {(res.title === 'Ratings & Reviews') &&
          <div className=''>
            <Reviews data={res.content} product={product} />
            <ReviewModal product={product} />
          </div>
        }

        {(res.title === 'Questions') &&
          <div className=''>
            <Questions data={res.content} product={product} />
            <ReviewModal setData={setData} product={product} type={'Questions'} />
          </div>
        }

        {(res.title === 'Product Specification') && <div className=''><Specifications data={res.content} /></div>}
        {(res.title === 'Highlights') && <div className=''><HightLights data={res.content} /></div>}
        {(res.title === 'Return Policy' || res.title == 'Description' || res.title == 'Product Detail') && <div className={` transition-all  overflow-hidden text-[13px] innerHtml_content`} dangerouslySetInnerHTML={{ __html: res.content }} />}

      </>

    </div>

  </div>
);

const SideMenu = ({ menu, menuClickFn }) => {
  return (
    <div className='p-[0px_10px] '>
      <ul>
        {
          menu.map((res, index) => {
            return (
              <>
                {res.enable == 1 &&
                  <li onClick={() => { menuClickFn(res) }} className='flex items-center gap-[8px] p-[10px_0]'>
                    <Image style={{ objectFit: 'contain' }} className='h-[22px] w-[22px] object-contain' height={40} width={40} alt='vantage' src={res.icon}></Image>
                    <h5 className='text-[13px] font-medium'>{res.title}</h5>
                  </li>
                }
              </>
            )
          })
        }
      </ul>
    </div>
  )
}

const Specifications = ({ data }) => {
  return (
    <div className='border-[1px] border-slate-100 rounded-[5px] '>
      {data.map((specification, index) => {
        return (
          <div className='last:border-b-[0px] border-b-[1px] border-slate-b-100 p-[10px]' key={index}>
            <h6 className='text-[14px] font-medium'>{specification.name}</h6>
            {specification.groups.map((group, j) => {
              return (
                <div key={j} className='flex items-center flex-wrap'>
                  <h6 className='text-[13px] w-[43%] text-left'>{group.specification_attribute}</h6>
                  <span className='w-[2%]'>:</span>
                  <h6 className='text-[13px] font-medium w-[45%]'>{group.options}</h6>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}


const HightLights = ({ data }) => {
  return (
    <>
      {data.map((res, index) => {
        return (
          <div key={index} className='flex items-baseline gap-[5px] mb-[5px] last:mb-[0]'>
            <Image className='h-[10px] w-[6px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
            <h6 className='text-[13px]'>{res.highlights}</h6>
          </div>
        )
      })}
    </>
  )
}

const Reviews = ({ data, product }) => {

  const [visible, setVisible] = useState(false);

  const hide = () => {
    setVisible(false)
    document.body.classList.remove('active_visible');
  }

  return (
    <>

      {visible &&
        <ReviewSection visible={visible} hide={hide} item={product.name} />
      }

      {data && data.length != 0 ? <>
        {data.slice(0, 5).map((resp, i) => {
          return (
            <div className='py-[7px]' key={resp.customer}>
              <div className='flex items-center gap-[10px]'><Image className='h-[25px] w-[25px] object-contain' src={'/detail/profile-01.svg'} height={50} width={100} alt={'profile'} /><p className='text-[14px] font-[500] '>{resp.customer}</p></div>

              <div className='flex items-center gap-[5px]'>
                <div className='flex items-center gap-[3px]'>
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

        {(data && data.length) == 5 ?
          <button onClick={() => { document.body.classList.add('active_visible'), setVisible(true) }} className='mt-[13px] flex items-center text-[12px] font-medium p-[4px_8px] light_bg rounded-[5px]'>
            <span className='text-[12px] font-semibold'>Show More </span>
            <Image className='ml-[2px] cursor-pointer h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/downArrowBlack.svg'}></Image>
          </button>
          : <></>}

      </> : <p className='text-[13px]'> No Reviews Found </p>}
      {/* <ReviewModal /> */}
    </>
  )
}

const Questions = ({ data, product }) => {

  const [visible, setVisible] = useState(false);

  const hide = () => {
    setVisible(false)
    document.body.classList.remove('active_visible');
  }

  return (
    <>
      {visible &&
        <QuestionSection visible={visible} hide={hide} item={product.name} />
      }
      {data && data.length != 0 ? <>
        {data.slice(0, 5).map((resp, i) => {
          return (
            <div className={`${resp.is_approved == 1 ? '' : 'hidden'} py-[7px]`} key={resp.customer}>
              <div className='flex items-center gap-[10px]'><Image className='h-[25px] w-[25px] object-contain' src={'/detail/profile-01.svg'} height={50} width={100} alt={'profile'} /><p className='text-[14px] font-[500] '>{resp.user_name}</p></div>
              <p className='pt-[3px] text-[13px] capitalize'><span className='gray_color text-[12px]'>Question : </span>{resp.question}</p>
              {resp.answers && resp.answers.length != 0 &&
                resp.answers.map((res, j) => {
                  return (
                    <p className='pt-[3px] text-[13px] capitalize'><span className='gray_color text-[12px]'>Answer : </span>{res.answer}</p>
                  )
                })
              }
            </div>
          )
        })}
        {data.length > 5 ?
          <button onClick={() => { document.body.classList.add('active_visible'), setVisible(true) }} className='mt-[13px] flex items-center text-[12px] font-medium p-[4px_8px] light_bg rounded-[5px]'>
            <span className='text-[12px] font-semibold'>Show More </span>
            <Image className='ml-[2px] cursor-pointer h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/downArrowBlack.svg'}></Image>
          </button>
          : <></>}
      </>
        : <p className='text-[13px]'> No Questions Found </p>}
      {/* <ReviewModal /> */}
    </>
  )
}