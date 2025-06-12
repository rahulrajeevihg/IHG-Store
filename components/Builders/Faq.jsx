import Image from "next/image";
// import ImageLoader from "../ImageLoader";
import { useState } from "react";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });

export default function Faq({ data,isMobile }) {
  const [openIndex, setOpenIndex] = useState(null);

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
  const toggleAccordion = (i) => {
    if (openIndex === i) {
      setOpenIndex(null);
    } else {
      setOpenIndex(i);
    }
  };

  return (
    <>
      {(data.section_name == "FAQ Style 1" ||
        data.section_name == "FAQ Style 2" ||
        data.section_name == "FAQ Style 3" ||
        data.section_name == "FAQ Style 4") && (
        <>
          <div
            className={`${
              data.section_name == "FAQ Style 3"
                ? "w-full flex justify-between items-center"
                : "lg:flex-[0_0_calc(50%_-_10px)]"
            } my-[40px]`}
          >
            {data &&
              (data.section_name == "FAQ Style 1" ||
                data.section_name == "FAQ Style 4") && (
                <div className="h-[100%] w-[100%] flex items-center justify-center">
                  <ImageLoader
                                style={`w-[100%] h-full object-contain`}
                                src={  data.section_name == "FAQ Style 4"
                                ? data.left_image
                                : data.right_image}
                                title={data.title ? data.title : "s"}
                                height={isMobile ? 300 : 450}
                                width={isMobile ? "100%" : "100%"}
                 
                  />
                </div>
              )}
            {data && data.section_name == "FAQ Style 2" && (
              <>
                <h1 className="text-[28px] font-bold primary_color lg:text-[#090808] text-center lg:text-start">
                  {data.title}
                </h1>
                <p className="text-[#181b29] text-[16px] font-normal text-center lg:text-justify">
                  {data.sub_title}
                </p>
              </>
            )}
            {data && data.section_name == "FAQ Style 3" && (
              <>
                <h1 className="text-[20px] lg:text-[28px] font-bold primary_color lg:text-[#090808] ">
                  {data.title}
                </h1>
                <button className="primary_btn lg:px-[10px] lg:py-[5px]">
                  {JSON.parse(data.btn).btn_text}
                </button>
              </>
            )}
          </div>
          <div
            className={`flex flex-col  lg:flex-[0_0_calc(50%_-_10px)] ${
              data.section_name == "FAQ Style 3"
                ? "border "
                : "gap-3 lg:px-[20px]"
            } `}
          >
            {data && data.section_name == "FAQ Style 1" && (
              <>
                <h1 className="text-[24px] font-bold primary_color lg:text-[#090808] text-center lg:text-start">
                  {data.title}
                </h1>
                {/* <p className="text-[#181b29] text-[16px] font-normal text-center lg:text-start">
              {data.sub_title}
            </p> */}
              </>
            )}
            {data && data.section_name == "FAQ Style 4" && (
              <>
                <h1 className="text-[28px] font-bold primary_color lg:text-[#090808] text-center lg:text-start transition ease-in-out duration-700 hover:text-blue-900">
                  {data.title}
                </h1>
                <p className="text-[#181b29] text-[16px] font-normal text-center lg:text-start">
                  {data.sub_title}
                </p>
              </>
            )}
            {data &&
              data.data.map((c, i) => {
                return (
                  <div
                    key={i}
                    className={`${
                      (data.section_name == "FAQ Style 1" &&
                      data.section_name == "FAQ Style 2" &&
                      openIndex === i)
                        ? "border border-[#e8691d]  p-2 transition ease-in-out duration-500"
                        : (data.section_name == "FAQ Style 3" && openIndex === i)
                        ? "  bg-gray-200 md:px-[10px] transition ease-in-out duration-500"
                        : "border-b md:px-[10px] transition ease-in-out duration-500"
                    } py-5   lg:p-5`}
                  >
                    <div
                      onClick={() => toggleAccordion(i)}
                      className="cursor-pointer flex justify-between items-center transition ease-in-out duration-500"
                    >
                      <h5
                        className={`md:text-[18px] lg:text-[18px] font-medium ${
                          openIndex === i ? "text-[#e8691d]" : " text-black"
                        }`}
                      >
                        {c.question}
                      </h5>
                      {openIndex === i ? (
                        <Image
                          src={
                            data.section_name == "FAQ Style 3" ||
                            data.section_name == "FAQ Style 4"
                              ? "/minu.svg"
                              : "/up-arrow.png"
                          }
                          width={10}
                          height={10}
                          alt="/up-arrow.png"
                          className={`${
                            data.section_name == "FAQ Style 3" ||
                            data.section_name == "FAQ Style 4"
                              ? "w-[20px] h-[20px]"
                              : ""
                          }transition ease-in-out duration-500`}
                        />
                      ) : (
                        <Image
                          src={
                            data.section_name == "FAQ Style 3" ||
                            data.section_name == "FAQ Style 4"
                              ? "/plus.svg"
                              : "/down-arrow.png"
                          }
                          width={10}
                          height={10}
                          alt="/down-arrow.png"
                          className={`${
                            data.section_name == "FAQ Style 3" ||
                            data.section_name == "FAQ Style 4"
                              ? "w-[20px] h-[20px]"
                              : ""
                          }transition ease-in-out duration-500`}
                        />
                      )}
                    </div>
                    {openIndex === i && <p className={`transition-opacity ease-in-out duration-500 ${openIndex === i ? "opacity-100" : "opacity-0"}`}>{c.answer}</p>}
                  </div>
                );
              })}
          </div>
        </>
      )}

      {data.section_name == "FAQ Style 5" && (
        <>
        <div className="my-[40px]">
          <div className="flex justify-between items-center w-full ">
            <h1 className=" md:flex-[0_0_calc(70%)] text-[20px] lg:text-[28px] font-bold primary_color lg:text-[#090808] ">
              {data.title}
            </h1>
            <p className="  md:flex-[0_0_calc(30%)] primary_color flex items-center justify-center gap-[5px] ">
              {JSON.parse(data.btn).btn_text}
              <Image src={"/rightArrow.svg"} width={10} height={10} alt="rightarrow" className="rotate-180 "/>
            </p>
          </div>
          <div className="flex border-b md:hidden lg:mt-[30px] lg:pb-[20px]">
                <div className="flex-[0_0_calc(50%)]">
                  <h3 className="text-[18px] text-[#121828] font-semibold">Questions</h3>
                </div>
                <div className="flex-[0_0_calc(50%)]">
                  <h3 className="text-[18px] text-[#121828] font-semibold">Answer</h3>
                </div>
              </div>

          {data && data.data && data.data.length != 0 && ( data.data.map((item,i)=>{
            return(
                <div className="flex md:flex-col lg:flex-row border-b lg:justify-center lg:pb-[40px] pt-[10px]  lg:items-center">
                <div className="lg:flex-[0_0_calc(50%_-_10px)] pb-[20px] ">
                  <h3 className="text-[18px] font-semibold">{item.question}</h3>
                </div>
                <div className="lg:flex-[0_0_calc(50%_-_10px)] pb-[20px]">
                  <p className="md:text-[14px] lg:text-[16px] text-[#4e565f] font-normal">{item.answer}</p>
                </div>
              </div>
            )
          })
         
          )}
          </div>
        </>
      )}
    </>
  );
}
