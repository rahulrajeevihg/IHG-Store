import { check_Image } from "@/libs/api"
import Image from "next/image"
export default function GridList({ data }) {
   return (
      <div className="main-width md:w-[90%] md:mx-auto">
         {data.section_name == "Grid with offset icons" &&
            <div>
               <div className=" flex flex-col items-center justify-center my-[20px]">
                  <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
               </div>
               <div className=" flex flex-wrap items-center justify-center md:gap-[35px] lg:gap-[70px_0] md:p-[40px_0_20px] lg:pt-[70px]">
                  {
                     data.cardsectionmain2.map((item, i) => {
                        return (
                           <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)] my-[10px] lg:mx-[10px] p-[20px] relative lg:flex-[0_0_calc(50%_-_30px)] flex flex-col items-center justify-center shadow-[#63636326_0_2px_8px]  rounded-[5px] `}>
                              <div className=" absolute top-[-30px] h-[64px] w-[64px] primary_bg rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="" />
                              </div>
                              <div className="p-[40px_16px_16px] flex flex-col items-center justify-center">
                                 <h1 className="text-[22px] text-[#121828] font-semibold ">{item.title1}</h1>
                                 <p className="text-[16px] text-[#4e565f] text-center">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }
         {data.section_name == "Centered 2x2 grid" &&
            <div>
               <div className=" flex flex-col items-center justify-center my-[20px]">
                  <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.content}</p>
               </div>
               <div className=" flex flex-wrap items-center justify-center  md:p-[40px_0_20px] ">
                  {
                     data.cardsectionmain1.map((item, i) => {
                        return (
                           <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)] my-[10px] lg:mx-[10px] p-[10px] lg:p-[20px] lg:flex-[0_0_calc(50%_-_30px)] flex md:flex-col lg:gap-[20px]  items-center justify-center shadow-[#63636326_0_2px_8px]  rounded-[5px] `}>
                              <div className=" lg:flex-[0_0_calc(15%_-_20px)] h-[64px] w-[64px] primary_bg rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="" />
                              </div>
                              <div className="lg:flex-[0_0_calc(85%_-_20px)] md:p-[16px]  flex flex-col items-start justify-center">
                                 <h1 className="md:text-[18px] lg:text-[22px] text-[#121828] lg:my-[20px] font-semibold ">{item.title1}</h1>
                                 <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] mb-[20px] ">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }
         {data.section_name == "4x2 grid on brand" &&
            <div>
               <div className=" flex flex-col items-start justify-center my-[20px]">
                  <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.content}</p>
               </div>
               <div className=" flex flex-wrap md:gap-[10px] lg:gap-[20px]  ">
                  {
                     data.cardsection6.map((item, i) => {
                        return (
                           <div key={i} className={`md:flex-[0_0_calc(100%_-_10px)]  p-[10px] lg:p-[20px] lg:flex-[0_0_calc(25%_-_20px)] flex flex-col lg:gap-[20px]`}>
                              <div className="  h-[64px] w-[64px] primary_bg rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="" />
                              </div>
                              <div className="   flex flex-col items-start justify-center">
                                 <h1 className="md:text-[18px] lg:text-[22px] text-[#121828] lg:my-[20px] font-semibold ">{item.title1}</h1>
                                 <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] mb-[20px]">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }
         {data.section_name == "Simple three column" &&
            <div className="my-[20px]">
               <div className=" flex flex-wrap md:gap-[15px] lg:gap-[20px]  ">
                  {
                     data.cardsection1.map((item, i) => {
                        return (
                           <div key={i} className={`md:flex-[0_0_calc(100%_-_10px)]  p-[10px] lg:p-[20px] lg:flex-[0_0_calc(33.33%_-_20px)] flex flex-col items-center rounded-[10px] justify-center shadow-[0_12px_55px_#0000000d] lg:gap-[20px]`}>
                              <div className="  h-[64px] w-[64px]  rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="w-[100%] h-[100%]" />
                              </div>
                              <div className="   flex flex-col items-center justify-center">
                                 <h1 className="md:text-[18px] lg:text-[22px] text-[#121828]  font-semibold ">{item.title1}</h1>
                                 <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] text-center">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }
         {data.section_name == "With feature grid list" &&
            <div>
               <div className=" flex flex-col items-center justify-center my-[20px]">
                  <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
               </div>
               <div className=" flex flex-wrap md:gap-[10px] lg:gap-[20px]  ">
                  {
                     data.cardsection4.map((item, i) => {
                        return (
                           <div key={i} className={` rounded-[10px] md:flex-[0_0_calc(100%_-_10px)] gap-[10px]  p-[10px] lg:p-[20px] lg:flex-[0_0_calc(25%_-_20px)] flex  lg:gap-[20px] shadow-[0_12px_55px_#0000000d]`}>
                              <div className=" shrink-0  h-[34px] w-[34px] bg-primary  rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="" />
                              </div>
                              <div className="   flex flex-col items-start justify-center">
                                 <h1 className="md:text-[18px] lg:text-[22px] text-[#121828]  font-semibold ">{item.title1}</h1>
                                 <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] mb-[20px]">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }

         {data.section_name == "Offset 2x2 grid" &&
            <div className="flex md:flex-col gap-[10px]">
               <div className=" lg:flex-[0_0_calc(50%_-_10px)] flex flex-col items-start justify-start my-[20px]">
                  <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
                  <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
               </div>
               <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-wrap md:gap-[10px] lg:gap-[20px]  ">
                  {
                     data.cardsectionmain5.map((item, i) => {
                        return (
                           <div key={i} className={`md:flex-[0_0_calc(100%_-_10px)] gap-[10px]  p-[10px] lg:p-[20px] lg:flex-[0_0_calc(50%_-_20px)] flex flex-col rounded-[10px]  lg:gap-[20px] shadow-[0_12px_55px_#0000000d]`}>
                              <div className=" shrink-0  h-[34px] w-[34px] bg-primary  rounded-[10px] flex items-center justify-center">
                                 <Image src={check_Image(item.icon1)} width={30} height={30} alt="icon" className="" />
                              </div>
                              <div className="   flex flex-col items-start justify-center">
                                 <h1 className="md:text-[18px] lg:text-[22px] text-[#121828]  font-semibold ">{item.title1}</h1>
                                 <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] mb-[20px]">{item.content1}</p>
                              </div>
                           </div>
                        )
                     })
                  }
               </div>
            </div>
         }
      </div>
   )
}