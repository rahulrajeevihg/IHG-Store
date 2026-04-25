import { check_Image } from "@/libs/api";
import Image from "next/image";

export default function Counters({ data }) {
  return (
    <>
      <div className="main-width md:w-[90%] md:mx-auto md:py-[30px] ">
        {data.section_name == "Counters 1" && (
          <div className="flex md:flex-col gap-[10px] lg:gap-[20px] w-[100%]">
            <div className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(50%_-_20px)] flex flex-col items-start justify-center">
              <h3 className="md:text-[16px] lg:text-[18px] font-medium">
                {data.subtitle}
              </h3>
              <h1 className="md:text-[26px] lg:text-[34px] font-semibold my-[10px] lg:my-[20px] leading-normal">
                {data.title}
              </h1>
              <p className="md:text-[14px] md:mb-[10px] lg:text-[16px] text-[#4e565f]">
                {data.description}
              </p>
            </div>
            <div className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(50%_-_20px)] w-[100%] flex flex-wrap  shadow-[#00000026_0_5px_15px]">
              {data.counterbox.map((item, i) => {
                return (
                  <div key={i}
                    className={`md:flex-[0_0_calc(50%)] lg:flex-[0_0_calc(50%)]  flex flex-col  items-center justify-center md:p-[25px] lg:p-[20px] ${
                      i == 0
                        ? "border-b-[1px] border-r-[1px]"
                        : i == 1
                        ? " border-b-[1px] "
                        : i == 2
                        ? " border-r-[1px] "
                        : ""
                    } `}
                  >
                    <h1 className="text-[32px] font-semibold lg:text-[55px] lg:mt-[40px] ">
                      {item.count_value}
                    </h1>
                    <p className="text-[14px]  lg:text-[16px] lg:mb-[20px]">
                      {item.count_title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.section_name == "Counters 2" && (
          <div className="w-[100%] ">
            <div className="flex flex-col w-[100%] justify-center items-center lg:items-center lg:justify-center md:gap-[10px] lg:gap-[20px]">
              <h1 className="text-[24px] lg:text-[34px] font-semibold text-center leading-normal">
                {data.title}
              </h1>
              <p className="text-[18px] font-normal">{data.subtitle}</p>
            </div>

            <div className="flex md:flex-col md:justify-center md:items-center gap-[10px] lg:gap-[20px] mt-[20px]">
              {data.counterbox.map((item, i) => {
                return (
                  <div key={i}
                    className={`lg:flex-[0_0_calc(33.33%_-_20px)]  flex flex-col  items-center justify-center  p-[35px] ${
                      i == 0
                        ? "bg-[#fff7eb]"
                        : i == 1
                        ? " bg-[#e6efff] "
                        : i == 2
                        ? " bg-[#fff0f0] "
                        : ""
                    }  rounded-tr-[20px]  rounded-br-[20px] rounded-bl-[20px]`}
                  >
                    <h1
                      className={`text-[32px] font-semibold lg:text-[55px] ${
                        i == 0
                          ? "text-[#ffaf47]"
                          : i == 1
                          ? " text-[#4395f9] "
                          : i == 2
                          ? " text-[#ff6b6b] "
                          : ""
                      }`}
                    >
                      {item.count_value}
                    </h1>
                    <p className="text-[14px]  lg:text-[22px]">
                      {item.count_title}
                    </p>
                    {/* <span>{item.count_description}</span> */}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {data.section_name == "Counters 3" && (
          <div className="w-[100%] ">
            <div className="flex flex-col w-[100%] justify-center items-center lg:items-center lg:justify-center md:gap-[10px] lg:gap-[10px] mb-[20px]">
              <h1 className="text-[24px] lg:text-[34px] font-semibold text-center leading-normal">
                {data.title}
              </h1>
              <p className="text-[15px] md:text-[#121828] lg:text-[#4e565f] font-normal text-center md:line-clamp-3">
                {data.sub_title}
              </p>
            </div>

            <div className=" w-[100%]">
              <div className={`grid_counters `}>
                {data.counterbox.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className={`grid_item_counters text-center ${
                        (i + 1) % 3 != 0 ? "border_right" : ""
                      } hover:bg-[#e6efff] md:p-[2px]`}
                    >
                      <h4 className="text-[22px] mb-[10px]">
                        {item.count_value}
                      </h4>
                      <p className="text-[14px]  lg:text-[16px]  lg:text-[#4e565f] lg:my-[16px] md:line-clamp-1">
                        {item.count_title}
                      </p>
                      {/* <span>{item.count_description}</span> */}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {data.section_name == "Counters 4" && (
          <div className="w-[100%] flex md:flex-col gap-[10px]">
            <div className="lg:flex-[0_0_calc(50%_-_10px)]">
              <h4 className="text-[18px] text-[#121828]">{data.subtitle}</h4>
              <h1 className="text-[24px] lg:text-[34px] font-semibold my-[20px] leading-normal">
                {data.title}
              </h1>
              {/* <p className="text-[15px] md:text-[#121828] lg:text-[#4e565f] font-normal text-center md:line-clamp-3">
                {data.sub_title}
              </p> */}
              <div className=" w-[100%] flex-wrap flex gap-[10px]">
                {data.counterbox.map((item, i) => {
                  return (
                    <div key={i} className="flex-[0_0_calc(50%_-_10px)] ">
                      <div className="w-[48px] h-[48px] rounded-[5px] p-[10px] shadow-[#63636333_0_2px_8px]">
                        <Image
                          src={check_Image(item.icon)}
                          width={30}
                          height={30}
                          alt="icon"
                        />
                      </div>

                      <h1 className="text-[34px] mt-[15px] font-semibold ">{item.count_value}</h1>
                      <p className="text-[16px] my-[16px]">{item.count_title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:flex-[0_0_calc(50%_-_10px)] flex items-center justify-center">
              <div className="lg:w-[500px] lg:h-[570px] text-center ">
                <Image
                  src={check_Image(data.right_image)}
                  width={40}
                  height={40}
                  alt="right_image"
                  className="w-[100%] h-[100%]"
                />
              </div>
            </div>
          </div>
        )}
          {data.section_name == "Counters 5" && (
          <div className="w-[100%] flex md:flex-col gap-[10px]">
            <div className="lg:flex-[0_0_calc(50%_-_10px)]">
            <h1 className="text-[24px] lg:text-[34px] font-semibold my-[20px] leading-normal">
                {data.title}
              </h1>
              <h4 className="text-[18px] text-[#121828]">{data.sub_title}</h4>
              {/* <p className="text-[15px] md:text-[#121828] lg:text-[#4e565f] font-normal text-center md:line-clamp-3">
                {data.sub_title}
              </p> */}
              <div className=" w-[100%] flex-wrap flex gap-[10px]">
                {data.counter_data.map((item, i) => {
                  return (
                    <div key={i} className="md:flex-[0_0_calc(50%_-_10px)] lg:flex-[0_0_calc(33.33%_-_10px)] ">
                      <h1 className="md:text-[18px] lg:text-[22px] mt-[15px] font-normal  ">{item.count_value}</h1>
                      <p className=" md:text-[14px] lg:text-[16px] my-[10px] text-[#4e565f]">{item.count_title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:flex-[0_0_calc(50%_-_10px)] flex gap-[10px] py-[15px] lg:justify-end">
              <div className=" md:flex-[0_0_calc(60%_-_10px)] lg:flex-[0_0_calc(40%_-_10px)] h-[230px] shadow-[#0000003d_0_3px_8px] rounded-[10px]">
                <Image
                  src={check_Image(data.images)}
                  width={40}
                  height={40}
                  alt="right_image"
                  className="w-[100%] h-[100%] object-cover rounded-[10px]"
                />
              </div>
              <div className="md:flex-[0_0_calc(40%_-_10px)] lg:flex-[0_0_calc(30%_-_10px)] mt-[30%] md:max-h-[150px] overflow-hidden lg:max-h-[180px] shadow-[#0000003d_0_3px_8px] rounded-[10px]">
              <Image
                  src={check_Image(data.images)}
                  width={40}
                  height={40}
                  alt="right_image"
                  className="w-[100%] h-[250px] object-cover rounded-[10px]"
                />
                </div>
            </div>
          </div>
        )}
        {data.section_name == "Counters 6" && (
          <div className=" primary_bg py-[30px] rounded-[10px]">
             <div className="flex md:flex-wrap  justify-between items-center lg:py-[15px] lg:px-[30px] ">
              {data.counter_data.map((item,i)=>{
                return(
                  <div key={i} className="md:flex-[0_0_calc(50%)] md:p-[10px] flex md:flex-col relative md:justify-center items-center">
                    <h1 className="md:text-[40px] lg:text-[65px] text-white">{item.count_value}</h1>
                    <p className="md:text-[14px] lg:text-[16px] text-white lg:self-end">{item.count_title}</p>
                    <div className="absolute top-[5px] right-[15px] text-white">
                     +
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
        )}
      </div>
    </>
  );
}
