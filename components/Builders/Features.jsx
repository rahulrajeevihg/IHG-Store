import { check_Image } from "@/libs/api"
import Image from "next/image"
import Link from "next/link"

export default function Features({ data }) {
  return (
    <div className="main-width  md:w-[90%] md:mx-auto">
      {data.section_name == "Features Style 1" &&
        <div className="flex md:flex-col gap-[10px] lg:my-[50px]">
          <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-col items-center justify-center my-[20px]">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
            <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.content}</p>
          </div>
          <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-wrap items-center justify-center gap-[30px]">
            {
              data.cards_item.map((item, i) => {
                return (
                  <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)]  lg:flex-[0_0_calc(50%_-_15px)] ${(i % 2 != 0) ? "lg:mt-[40px]" : ""} shadow-[#63636326_0_2px_8px] w-[270px] h-[270px] rounded-[5px] p-[20px]`}>
                    <div className="w-[35px] h-[35px] ">
                      <Image src={check_Image(item.icon)} width={30} height={30} alt="icon" className="w-[100%] h-[100%]" />
                    </div>
                    <h1 className="text-[22px] text-[#121828] my-[20px]">{item.title1}</h1>
                    <p className="text-[16px] text-[#4e565f]">{item.subtitle}</p>
                  </div>
                )
              })
            }
          </div>
        </div>
      }
      {data.section_name == "Features Style 2" &&
        <div className="lg:my-[50px]">
          <div className=" flex flex-col items-center justify-center my-[20px]">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
            <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.sub_title}</p>
          </div>
          <div className=" flex flex-wrap items-center justify-center gap-[30px]">
            {
              data.list_points.map((item, i) => {
                return (
                  <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)]  lg:flex-[0_0_calc(33.33%_-_30px)] shadow-[#63636326_0_2px_8px]  rounded-[5px] p-[0_20px_5px]`}>
                    <h1 className="text-[22px] text-[#121828]  mt-[20px]">{item.number_count}</h1>
                    <h1 className="text-[22px] text-[#121828] ">{item.list_title}</h1>
                    <div className="border-b-[6px] py-[15px] border-primary ">
                      <p className="text-[16px] text-[#4e565f]">{item.listconent}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      }

      {data.section_name == "Features Style 3" &&
        <div className="flex md:flex-col gap-[10px] lg:my-[50px]">
          <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-col items-center justify-center my-[20px]">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
            <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
          </div>
          <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-wrap items-center justify-center gap-[30px]">
            {
              data.liststyle.map((item, i) => {
                return (
                  <div key={i} className={` flex md:flex-col w-[100%] gap-[15px] lg:gap-[20px] `}>
                    <div className="lg:flex-[0_0_calc(14%_-_20px)] flex items-center justify-center ">
                      <div className=" h-[72px] w-[72px] bg-[#f6f0ff] rounded-[162px] flex items-center justify-center">
                        <Image src={check_Image(item.list_icon)} width={30} height={30} alt="icon" className="" />
                      </div>
                    </div>
                    <div className="lg:flex-[0_0_calc(86%_-_20px)] ">
                      <h1 className="text-[22px] text-[#121828] my-[20px]">{item.list_title}</h1>
                      <p className="text-[16px] text-[#4e565f]">{item.list_content}</p>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      }

      {data.section_name == "Features Style 4" &&
        <div className="lg:my-[50px]">
          <div className=" flex flex-col items-center justify-center my-[20px]">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] ">{data.title}</h1>
            <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.sub_title}</p>
          </div>
          <div className=" flex flex-wrap items-center justify-center gap-[30px]">
            {
              data.list_points.map((item, i) => {
                return (
                  <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)]  lg:flex-[0_0_calc(33.33%_-_30px)] md:border ${i % 2 != 0 ? "lg:border-l-[1px] lg:border-r-[1px]" : ""} p-[5px_30px_10px] flex flex-col gap-[20px] items-center justify-center`}>
                    <div className=" h-[72px] w-[72px] bg-[#f6f0ff] rounded-[162px] flex items-center justify-center">
                      <Image src={check_Image(item.list_icon)} width={30} height={30} alt="icon" className="" />
                    </div>
                    <h1 className="text-[22px] text-[#121828] ">{item.list_title}</h1>
                    <p className="text-[16px] text-[#4e565f] text-center">{item.listconent}</p>
                    <Link href={item.btn_redirect_url}>
                      <div className="flex items-center justify-center gap-[5px]">
                        <span className="text-[18px] text-[#121828] text-center font-semibold">{item.btn_text}</span>
                        <span className="text-[18px] text-[#121828] text-center">{">"}</span>
                      </div>
                    </Link>
                  </div>
                )
              })
            }
          </div>
        </div>
      }
      {data.section_name == "Features Style 5" &&
        <div className="lg:my-[50px]">
          <div className=" flex flex-col items-center justify-center my-[20px] lg:w-[75%] lg:mx-auto">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal mb-[20px] text-center ">{data.title}</h1>
            <p className=" md: text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
          </div>
          <div className=" flex flex-wrap items-center justify-center gap-[30px]">
            {
              data.list_points.map((item, i) => {
                return (
                  <div key={i} className={`md:flex-[0_0_calc(100%_-_15px)]  lg:flex-[0_0_calc(33.33%_-_30px)]  hover:border-[#b492e6] hover:border-[2px]  shadow-[#959da533_0_8px_24px]  p-[5px_30px_10px] flex flex-col gap-[20px] items-center justify-center`}>
                    <div className=" h-[72px] w-[72px] bg-[#f6f0ff] rounded-[162px] flex items-center justify-center">
                      <Image src={check_Image(item.list_icon)} width={30} height={30} alt="icon" className="" />
                    </div>
                    <h1 className="text-[22px] text-[#121828] ">{item.list_title}</h1>
                    <p className="text-[16px] text-[#4e565f] text-center">{item.listconent}</p>
                    <Link href={"/"}>
                      <div className="flex items-center justify-center gap-[5px]">
                        <span className="text-[18px] text-[#121828] text-center font-semibold">{item.btn_text}</span>
                        <span className="text-[18px] text-[#121828] text-center">{">"}</span>
                      </div>
                    </Link>
                  </div>
                )
              })
            }
          </div>
        </div>
      }
      {data.section_name == "Features Style 6" &&
        <div className="flex md:flex-col gap-[20px] lg:my-[50px]">
          <div className=" lg:flex-[0_0_calc(40%_-_20px)] ">
            <h1 className="md:text-[26px] lg:text-[34px] text-[#121828] font-semibold leading-normal my-[20px]  ">{data.title}<span className="md:text-[16px]">{data.spantitle}</span></h1>
            <p className=" md:text-[16px] lg:text-[24px] text-[#121828] mb-[20px] ">{data.title2}{data.spantitle2}</p>
            <p className=" md:text-[14px] lg:text-[16px] text-[#4e565f]">{data.subtitle}</p>
          </div>
          <div className=" lg:flex-[0_0_calc(60%_-_20px)] flex flex-wrap items-center justify-center gap-[20px]">
            {
              data.liststyle.map((item, i) => {
                return (
                  <div key={i} className={`${(i == 0 || i == 4) ? "lg:flex-[0_0_calc(55%_-_20px)] lg:items-end lg:justify-end" : i == 3 ? "lg:flex-[0_0_calc(55%_-_20px)]" : "lg:flex-[0_0_calc(45%_-_20px)]"} md:flex-[0_0_calc(100%_-_20px)]   flex flex-col gap-[20px] `}>
                    <div className={`${(i == 0 || i == 3 || i == 4) ? "lg:w-[70%]" : "lg:w-[100%]"} flex gap-[5px] items-center md:h-[48px] lg:h-[70px] bg-[#f3f4f6] p-[0_10px_0_15px] rounded-[5px] duration-[2s] hover:bg-[#55ff] cursor-pointer`}>
                      <Image src={check_Image(item.list_icon)} width={30} height={30} alt="icon" className="h-[20px]" />
                      <h1 className=" text-[#121828] md:text-[16px] lg:text-[18px] ">{item.list_title}</h1>
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