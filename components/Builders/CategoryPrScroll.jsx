import Image from "next/image"
import { check_Image } from "@/libs/api"
import dynamic from "next/dynamic"
// import { useEffect, useMemo, useState } from "react"
const ImageLoader = dynamic(() => import('../ImageLoader'))
const ProductBox = dynamic(() => import('../Product/ProductBox'))

const CategoryPrScroll = ({ data, i, isMobile }) => {
    // let [load, setLoad] = useState(true)


    // useEffect(() => {
    //     loading()
    // }, [])

    // const loading = () => {
    //     if (!isMobile) {
    //         load = false
    //         setLoad(load)
    //     } else {
    //         setTimeout(() => {
    //             load = false
    //             setLoad(load)
    //         }, 500);
    //     }
    // }

    // const memoziedState = useMemo(() => {
    //     // console.log(data,'data memoziedState')
    //     return (
    //         <>
    //             {load ? <div className=" main-width gap-[15px] !bg-no-repeat your-element md:p-[15px_10px] md:bg-white md:min-h-[400px] md:w-full">
    //                 <Skeleton />
    //             </div> :
    //                 <div className=" main-width gap-[15px] !bg-no-repeat your-element md:min-h-[400px] md:w-full">
    //                     {data.top_image && <div className="flex items-center justify-center lg:mt-[50px] relative your-element md:min-h-full">
    //                         <Image src={check_Image(data.top_image)} className="your-element" width={600} height={300} alt={data.title} />
    //                     </div>}

    //                     <div className={`${data.top_image ? "lg:mt-[30px]" : "lg:mt-[50px]"} your-element lg:pb-[30px]  md:w-full md:min-h-[55px]`}>
    //                         <h1 className="text-center uppercase lg:text-[34px] your-element font-normal text-[#340C0C] md:text-[24px]">{data.title}</h1>
    //                         <p className="text-center uppercase text-[18px] font-light text-[#684140] your-element md:min-h-[30px] md:w-full">{data.sub_title}</p>
    //                     </div>

    //                     <div className="flex items-center md:flex-col gap-[15px] your-element md:min-h-[340px] md:w-full">
    //                         {data.left_image && <div className="md:hidden overflow-hidden home flex-[0_0_calc(25%_-_15px)] mr-[10px]  group flex items-end h-fit relative ">
    //                             <ImageLoader src={data.left_image} width={400} height={400} title={"icon1"} className="h-[380px] w-[325px] object-cover your-element" />
    //                             <div className="absolute transition-[opacity_0.3s_ease] opacity-0 group-hover:opacity-[1] top-0 left-0 right-0 bottom-0 bg-[#0000001c] w-[100%] h-[100%]"></div>
    //                             <div className="absolute transition-[top_0.3s_ease] !duration-700 opacity-0 group-hover:opacity-[1] group-hover:top-0  flex flex-col gap-[20px]  items-center pb-[30px]  justify-end  top-[100%] left-0 w-[100%] h-[100%]">
    //                                 <h1 className="text-white transition-[opacity_0.3s_ease] group-hover:opacity-1 text-[20px] font-semibold tracking-[2px]">{data.hover_text}</h1>
    //                                 <div className="h-[40px] w-[40px] rounded-[50%] rotate-180  flex items-center justify-center arrow-circle" >
    //                                     <Image src={"/Arrow.svg"} width={15} height={15} alt="arrow" />
    //                                 </div>
    //                             </div>

    //                         </div>}

    //                         <div className={` md:p-[20px_10px] md:w-full ${data.left_image ? "lg:flex-[0_0_calc(75%_-_15px)]" : " lg:flex-[0_0_calc(100%)]"} your-element md:min-h-[340px]`}>
    //                             <ProductBox
    //                                 productList={data.data}
    //                                 rowCount={data.left_image ? "flex-[0_0_calc(33.33%_-_10px)]" : "flex-[0_0_calc(25%_-_10px)]"}
    //                                 scroll_button={true}
    //                                 scroll_id={data.section_name + i}
    //                                 size={data.left_image ? true : false}
    //                                 home={true}
    //                             //  leftHorizontalImage={data.left_image}
    //                             />
    //                         </div>
    //                     </div>
    //                 </div>


    //             }
    //         </>
    //     )
    // }, [load])
    // console.log(data, 'data from CategoryPrScroll')
    return (
        <>
            {/* {memoziedState} */}

            <div className="main-width gap-[15px] your-element  md:w-full">
                {data.top_image && <div className="flex items-center justify-center md:mt-[30px] lg:mt-[50px] relative your-element">
                    <Image src={check_Image(data.top_image)} className="your-element" width={600} height={300} alt={data.title} />
                </div>}

                {data.title && <div className={`${data.top_image ? "lg:mt-[30px]" : "lg:mt-[50px]"} your-element lg:pb-[30px]  md:w-full md:min-h-[55px]`}>
                    {data.title && <h1 className="text-center uppercase lg:text-[34px] your-element font-normal text-[#340C0C] md:text-[24px]">{data.title}</h1>}
                    {data.sub_title && <p className="text-center uppercase text-[18px] font-light text-[#684140] your-element md:min-h-[30px] md:w-full">{data.sub_title}</p>}
                </div>}

                <div className={`flex items-center md:flex-col gap-[15px] your-element md:min-h-[340px] md:w-full ${!data.title && "lg:mt-[30px]"} `}>
                    {data._left_image && <div className="md:hidden overflow-hidden home flex-[0_0_calc(25%_-_15px)] mr-[10px]  group flex items-end h-fit relative ">
                        <ImageLoader src={data._left_image} width={400} height={400} title={"icon1"} className="h-[380px] w-[325px] object-cover your-element" />
                        {/* <Image src={check_Image(data.left_image)} width={400} height={400} alt="icon1" className="h-[380px] w-[325px] object-cover your-element" /> */}
                        <div className="absolute transition-[opacity_0.3s_ease] opacity-0 group-hover:opacity-[1] top-0 left-0 right-0 bottom-0 bg-[#0000001c] w-[100%] h-[100%]"></div>
                        <div className="absolute transition-[top_0.3s_ease] !duration-700 opacity-0 group-hover:opacity-[1] group-hover:top-0  flex flex-col gap-[20px]  items-center pb-[30px]  justify-end  top-[100%] left-0 w-[100%] h-[100%]">
                            <h1 className="text-white transition-[opacity_0.3s_ease] group-hover:opacity-1 text-[20px] font-semibold tracking-[2px]">{data.hover_text}</h1>
                            <div className="h-[40px] w-[40px] rounded-[50%] rotate-180  flex items-center justify-center arrow-circle" >
                                <Image src={"/Arrow.svg"} width={15} height={15} alt="arrow" />
                            </div>
                        </div>

                    </div>}

                    {/* py-[30px] */}
                    <div className={` md:p-[20px_10px] md:w-full ${data._left_image ? "w-[75%]" : "w-[100%]"} your-element md:min-h-[340px]`}>
                        {/* <ViewAll data={data} viewAll={false} headerCss={'text-[#fff]'} /> */}
                        <ProductBox
                            productList={data.data}
                            rowCount={data._left_image ? "flex-[0_0_calc(33.33%_-_10px)]" : "flex-[0_0_calc(25%_-_10px)]"}
                            scroll_button={true}
                            scroll_id={data.section_name + i}
                            size={data._left_image ? true : false}
                            home={true}
                        //  leftHorizontalImage={data.left_image}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default CategoryPrScroll

const Skeleton = () => {
    return (
        <>
            <div className={`animate-pulse`}>

                <div className='flex flex-col items-center justify-center'>
                    <div className='bg-slate-200 md:h-[40px] mb-[10px] md:w-[140px] rounded-[5px]'></div>
                    <div className='bg-slate-200 md:h-[30px] mb-[5px] md:w-[220px] rounded-[5px]'></div>
                </div>

                <div className={`flex items-center md:py-[20px] animate-pulse lg:gap-[10px] md:gap-[15px] overflow-auto scrollbarHide`}>
                    {[1, 2, 3, 4, 5].map((res, index) => {
                        return (
                            <div className='flex-[0_0_calc(25%_-_8px)] md:flex-[0_0_calc(60%_-_0px)] h-[305px] border-[1px] border-slate-200 rounded-[5px]'>
                                <div className='bg-slate-200 h-[200px] md:h-[140px] mb-[10px] md:m-[10px]'></div>
                                <div className='p-[8px]'>
                                    <div className='bg-slate-200 h-[20px] mb-[5px] w-[100%] rounded-[5px]'></div>
                                    <div className='bg-slate-200 h-[20px] mb-[10px] w-[40%] rounded-[5px]'></div>
                                    <div className='bg-slate-200 h-[15px] mb-[5px] w-[100%] rounded-[5px]'></div>
                                </div>
                                <div className='p-[0_8px_8px_8px] flex items-center justify-between'>
                                    <div className='bg-slate-200 h-[25px] w-[35%] rounded-[5px]'></div>
                                    <div className='bg-slate-200 h-[25px] text-end w-[35%] rounded-[5px]'></div>
                                </div>
                            </div>
                        )
                    })
                    }
                </div>


            </div>
        </>
    )
}
