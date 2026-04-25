import { check_Image } from "@/libs/api";
import Image from "next/image";
// import ImageLoader from "../ImageLoader";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });
// import { useState, useEffect } from "react";
export default function OurTeam({ data,isMobile }) {
  // console.log(data)
  // const [isMobile, setIsMobile] = useState(false);
  // useEffect(() => {
  //   const handleResize = () => {
  //     const mobileWidth = 768; // Adjust this value to define your mobile width threshold
  //     if (window.innerWidth <= mobileWidth) {
  //       setIsMobile(true);
  //     } else {
  //       setIsMobile(false);
  //     }
  //   };

  //   handleResize(); // Initial check on component mount

  //   window.addEventListener("resize", handleResize); // Event listener for window resize

  //   return () => {
  //     window.removeEventListener("resize", handleResize); // Clean up the event listener
  //   };
  // }, []);
  return (
    <>
      <div>
        {data &&
          data.length != 0 &&
          (data.section_name == "Our Team 1" ||
            data.section_name == "Our Team 2") && (
            <div
              className={`${
                data.section_name == "Our Team 1"
                  ? ""
                  : ""
              }`}
            >
              <div className="">
                <div className=" w-[100%] flex flex-col justify-center items-center md:px-[10px]">
                  {/* <h1 className={`${data.title.includes('Team')?"text-red-500":"text-black"}`}>{data.title}</h1> */}
                  <h1 className="flex gap-[5px] lg:mb-[20px]">
                    {data.title.split(" ").map((word, i) => (
                      <span key={i}
                        className={`${
                          i == 0 ? "text-black" : "primary_color"
                        } md:text-[24px] lg:text-[34px] font-semibold`}
                      >
                        {word}
                      </span>
                    ))}
                  </h1>
                  <p className="text-center md:text-[14px] lg:text-[16px]  hyphens-auto md:my-[10px] lg:mb-[20px]">
                    {data.subtitle}
                  </p>
                </div>
                <div
                  className={`flex md:flex-nowrap md:overflow-y-hidden md:overflow-auto   lg:w-[calc(100%_+_20px)]  ${
                    data.section_name == "Our Team 1"
                      ? " gap-[10px] flex-wrap md:mx-[10px]"
                      : data.section_name == "Our Team 2"
                      ? " gap-[10px]  mx-auto md:mx-[10px]"
                      : ""
                  } lg:flex-wrap`}
                >
                  {data.cardimage.map((item, i) => {
                    return (
                      <>
                        {data.section_name == "Our Team 1" && (
                          <div
                            key={i}
                            className="md:flex-[0_0_calc(100%_-_20px)] lg:flex-[0_0_calc(33.33%_-_10px)]"
                          >
                            <div className="md:h-[300px] lg:h-[450px] relative">
                              <ImageLoader
                                style={`w-[100%] h-[100%] object-cover rounded-[10px]`}
                                src={item.card_image}
                                alt={item.item ? item.item : "s"}
                                height={isMobile ? 300 : 450}
                                width={isMobile ? "100%" : "100%"}
                              />
                              <div className="absolute bottom-0 top-0 right-0 left-0  rounded-[10px] card_image_overlay">
                                <div className="absolute  w-[100%] bottom-[40px]">
                                  <h4 className="text-[#fff] text-center mb-[10px] text-[20px] md:text-[18px]">
                                    {item.card_title}
                                  </h4>
                                  <h6 className="text-[#fff] opacity-[.5] text-center mb-[10px] text-[16px]">
                                    {item.designation}
                                  </h6>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {data.section_name == "Our Team 2" && (
                          <div
                            key={i}
                            className="md:flex-[0_0_calc(85%_-_5px)] lg:flex-[0_0_calc(25%_-_10px)] group"
                          >
                            <div className="h-[312px] relative ">
                              <ImageLoader
                                style={`w-[100%] h-[100%] object-cover rounded-[10px] transition-all duration-500 ease-in-out  cursor-pointer`}
                                src={item.card_image}
                                title={item.item ? item.item : "s"}
                                width={isMobile ? "100%" : "100%"}
                                height={312}
                              />
                              <div className="absolute bottom-0 top-0 right-0 left-0  rounded-[10px] group-hover:bg-primary ">
                                <div className="absolute  w-[100%] bottom-[40px] hidden group-hover:block">
                                  <h4 className="text-[#fff] text-center mb-[10px] text-[20px] md:text-[18px]">
                                    {item.card_title}
                                  </h4>
                                  <h6 className="text-[#fff] opacity-[.5] text-center mb-[10px] text-[16px]">
                                    {item.designation}
                                  </h6>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        {data && data.length != 0 && data.section_name == "Our Team 3" && (
          <>
            <div className="md:w-[90%] md:mx-auto">
              <div className="flex mx-auto w-[calc(100%_+_20px)] gap-[20px]  flex-wrap">
                <div className="md:flex-[0_0_calc(100%_-_20px)] lg:flex-[0_0_calc(33.33%_-_20px)] flex flex-col items-center justify-center">
                  <h1 className="flex gap-[5px]  ">
                    {data.title.split(" ").map((word, i) => (
                      <span key={i}
                        className={`${
                          i == 0 ? "text-black" : "primary_color"
                        } md:text-[24px] lg:text-[34px]  font-semibold`}
                      >
                        {word}
                      </span>
                    ))}
                  </h1>
                  <p className="text-center text-[14px]  lg:text-[16px] ">
                    {data.subtitle}
                  </p>
                </div>
                {data.cardimage.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className="md:flex-[0_0_calc(100%_-_20px)] lg:flex-[0_0_calc(33.33%_-_20px)]  group"
                    >
                      <div className="h-[270px] lg:h-[350px] relative ">
                        <ImageLoader
                                style={`w-[100%] h-[100%] object-cover rounded-[10px] transition-all duration-500 ease-in-out  cursor-pointer`}
                                src={item.card_image}
                                title={item.item ? item.item : "s"}
                                width={isMobile ? "100%" : "100%"}
                                height={isMobile ? 270 : 350}
                        />
                        <div className="absolute hidden group-hover:block bottom-0 top-0 right-0 left-0  rounded-[10px] group-hover:bg-[#06060675] ">
                          <h4 className="text-[#fff] text-center mt-[37%] mb-[10px] text-[20px] md:text-[22px]">
                            {item.card_title}
                          </h4>
                          <h6 className="text-[#fff] opacity-[.5] text-center mb-[10px] text-[16px]">
                            {item.designation}
                          </h6>
                          <div className="flex items-center justify-center gap-[25px] mt-[15px]">
                            <Image
                              src={check_Image(item.linkedin)}
                              width={10}
                              height={10}
                              alt="linkedlin"
                              className="w-[30px]"
                            />
                            <Image
                              src={check_Image(item.mail)}
                              width={10}
                              height={10}
                              alt="mail"
                              className="w-[30px]"
                            />
                            <Image
                              src={check_Image(item.skype)}
                              width={10}
                              height={10}
                              alt="skype"
                              className="w-[30px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {data && data.length != 0 && data.section_name == "Our Team 4" && (
          <>
            <div className="w-full md:w-[95%] md:mx-auto ">
              <div className="flex items-center justify-center mb-[40px]">
                <h1 className="flex gap-[5px] relative my-[20px] after:content-['' ] after:absolute  after:bottom-0 after:left-0 after:h-1 after:text-center after:rounded-[5px]  after:w-[100%] after:bg-primary ">
                  {data.title.split(" ").map((word, i) => (
                    <span key={i}
                      className={`${
                        i == 0 ? "text-black" : "primary_color"
                      } text-[30px] font-semibold`}
                    >
                      {word}
                    </span>
                  ))}
                </h1>
              </div>
              <div className="flex md:flex-nowrap   overflow-auto  lg:flex-wrap   gap-[10px]">
                {data.cardimage.map((item, i) => {
                  return (
                    <div
                      className="md:flex-[0_0_calc(75%_-_10px)] lg:flex-[0_0_calc(25%_-_10px)] "
                      key={i}
                    >
                      <div className="md:h-[270px] lg:h-[335px] w-[100%]">
                        <ImageLoader
                          style={`md:h-[270px] lg:h-[335px] w-[100%] rounded-[10px] object-cover`}
                          src={item.card_image}
                          title={item.item ? item.item : "s"}
                          height={"100%"}
                          width={"100%"}
                        />
                      </div>
                      <div className="text-center">
                        <h1 className="md:text-[18px] lg:text-[22px] font-semibold">
                          {item.card_title}
                        </h1>
                        <p className="text-[#121828] opacity-[.5] text-center lg:mb-[10px] md:text-[12px] lg:text-[16px]">
                          {item.designation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
        {data &&
          data.length != 0 &&
          (data.section_name == "Our Team 5" ||
            data.section_name == "Our Team 6") && (
            <>
              <div className=" mx-[10px]  mb-[40px]">
                <div className="flex flex-col gap-1 items-center justify-center mb-[25px]">
                  <h1
                    className={`flex gap-[5px] ${
                      data.section_name == "Our Team 6"
                        ? "relative after:content-['' ] after:absolute  after:bottom-0 after:left-0 after:h-1 after:text-center after:rounded-[5px]  after:w-[100%] after:bg-primary"
                        : ""
                    } `}
                  >
                    {data.span_title.split(" ").map((word, i) => (
                      <span key={i}
                        className={`${
                          i == 0 ? "text-black" : "primary_color"
                        } text-[30px] font-semibold`}
                      >
                        {word}
                      </span>
                    ))}
                  </h1>
                  <p className="md:text-center">{data.sub_title}</p>
                </div>
                <div className="flex flex-wrap items-center md:justify-start lg:justify-center md:gap-[10px] ">
                  {data.data.map((item, i) => {
                    return (
                      <div
                        className={`${
                          data.section_name == "Our Team 6"
                            ? "md:flex-[0_0_calc(100%_-_10px)] "
                            : "md:flex-[0_0_calc(50%_-_10px)] "
                        }lg:flex-grow-0 lg:flex-shrink-0 lg:w-1/3 flex items-center justify-center flex-col mb-[20px] `}
                        key={i}
                      >
                        <div className="md:w-[150px] lg:w-[200px] md:h-[150px] lg:h-[200px] rounded-[50%] overflow-hidden flex  border_primary2 border-[20px]">
                          <ImageLoader
                          style={`w-[200px] md:h-[147px] lg:h-[197px]  rounded-[50%] object-cover ${
                            data.section_name == "Our Team 6" ? "" : "p-[5px]"
                          }`}
                          src={item.image}
                          title={item.item ? item.item : "s"}
                          height={isMobile? 147 : 197}
                          width={"100%"}
                          
                          />
                        </div>
                        {/* <div className="h-[30px] w-[30px] bg-black rounded-full"></div> */}
                        <div className="text-center">
                          <h1 className=" text-[18px] mt-[22px] mb-[10px] font-semibold">
                            {item.name}
                          </h1>
                          <p className="text-[12px]  font-normal">
                            {item.role}
                          </p>
                          <p
                            className={`${
                              data.section_name == "Our Team 6"
                                ? "flex text-[14px] lg:text-[16px]"
                                : "hidden"
                            }  my-[14px]  text-justify`}
                          >
                            {item.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        {data && data.length != 0 && data.section_name == "Our Team 7" && (
          <>
            <div className="md:w-[90%] md:mx-auto  mb-[40px]">
              <div className="  ">
                <h1 className="flex gap-[5px]  md:text-[26px] lg:text-[30px] mt-[28px] mb-[10px] font-semibold before:content-[''] before:relative before:inline-block before:w-[5%] before:h-[5%] before:rounded-[50px] before:lg:mr-[10px] before:mt-[28px]  before:bottom-[2px] before:border-[2px] before:border-primary">
                  {data.title1}
                </h1>
                <h4 className=" text-[22px]  mb-[10px] font-normal">
                  {data.title2}
                </h4>
              </div>
              <div className="flex  gap-[20px] flex-wrap items-center">
                {data.data.map((item, i) => {
                  return (
                    <div
                      className="md:flex-[0_0_calc(100%_-_5px)] lg:flex-[0_0_calc(25%_-_15px)] relative overflow-hidden h-[23rem] rounded-[10px] group cursor-pointer"
                      key={i}
                    >
                      <div className="">
                        <ImageLoader
                          style={`object-cover w-full max-h-full`}
                          src={item.image}
                          title={item.item ? item.item : "s"}
                          height={320}
                          width={isMobile?"100%":"100%"}
                        />
                      </div>
                      <div className=" absolute w-[100%] h-[100%] top-0 bottom-0 rounded-[10px] card_image_overlay "></div>
                      {/* <div className="h-[30px] w-[30px] bg-black rounded-full"></div> */}
                      <div className="text-center z-1 absolute flex flex-col right-[60px] left-[60px] bottom-[30px] items-center ">
                        <h1 className=" text-[22px] mt-[22px] mb-[10px] text-[#ffffff]">
                          {item.name}
                        </h1>
                        <p className="text-[16px]  font-normal text-[#ffffff]">
                          {item.role}
                        </p>
                        <div className="flex items-center justify-center gap-[20px] absolute bottom-[15px] opacity-0 group-hover:opacity-[100%] ">
                          <Image
                            src={check_Image(item.icon_1)}
                            width={10}
                            height={10}
                            alt="linkedlin"
                            className="w-[30px]"
                          />
                          <Image
                            src={check_Image(item.icon_2)}
                            width={10}
                            height={10}
                            alt="mail"
                            className="w-[30px]"
                          />
                          <Image
                            src={check_Image(item.icon_3)}
                            width={10}
                            height={10}
                            alt="skype"
                            className="w-[30px]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {data && data.length != 0 && data.section_name == "Our Team 8" && (
          <div className="flex md:flex-col items-start md:gap-[10px] lg:gap-[20px] mb-[40px] md:w-[90%] md:mx-auto">
            <div className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(40%_-_20px)] lg:pr-[30px] ">
              <div className="flex flex-col lg:gap-[20px] border-b-[1px]">
                <h5 className="text-[18px] primary_color">{data.sub_title}</h5>
                <h2 className="text-[32px] font-bold mb-[20px]">
                  {data.title}
                </h2>
              </div>
              {data.content_data.map((value, i) => {
                return (
                  <div
                    key={i}
                    className={`flex flex-col lg:gap-[20px] ${
                      i === data.content_data.length - 1
                        ? " "
                        : "border-b-[1px]"
                    } pt-[10px]`}
                  >
                    <h1 className="text-[22px] primary_color font-semibold mt-[10px] mb-[10px]">
                      {value.title}
                    </h1>
                    <h3 className="text-[16px] font-normal pb-[10px]">
                      {value.content}
                    </h3>
                  </div>
                );
              })}
            </div>
            <div className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(60%_-_20px)] flex flex-wrap md:gap-[10px] md:mt-[20px] ">
              {data.image_data.map((item, idx) => {
                return (
                  <div className="flex-[0_0_calc(50%_-_5px)] " key={idx}>
                    <div className="flex items-center justify-end">
                      <div className="lg:w-[240px] overflow-hidden h-[240px] rounded-[10px]">
                        <ImageLoader
                          style={`w-full h-full rounded-[10px] object-cover`}
                          src={item.image}
                          title={item.item ? item.item : "s"}
                          height={240}
                          width={isMobile?"100%":"100%"}
                        />
                      </div>
                    </div>
                    <div className="text-center  lg:ml-[28%] mb-[10px]">
                      <h1 className=" md:text-[18px] lg:text-[22px] font-semibold  mt-[28px] mb-[10px]">
                        {item.name}
                      </h1>
                      <p className="text-[14px]  font-normal">{item.role}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
