import Image from "next/image";
import { check_Image } from "@/libs/api";
import Link from "next/link";
// import ImageLoader from "../ImageLoader";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });
// import { useState, useEffect } from "react";

export default function CardList({ data,isMobile }) {
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
   {(data.section_name == "4 Column Card Image with link" ||
    data.section_name == "Card Image with link") && <div className="md:px-[10px]">
      <div className=" text-center lg:px-[20px]">
        <h1 className="text-[24px] font-semibold primary_color">
          {data.title}
        </h1>
        <p className=" text-[14px] font-normal">{data.content}</p>
      </div>
      <div className="flex md:flex-col lg:flex-row gap-[10px] ">
        {data &&
          data.cardimage &&
          data.cardimage.length != 0 &&
          data.cardimage.map((item, i) => {
            return (
              <div
                className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(25%_-_10px)] bg-white shadow-xl p-[10px] rounded-[5px]"
                key={i}
              >
                <div className="h-[200px] w-[100%] rounded-[5px] flex items-center justify-center">
                  <ImageLoader
                                style={`w-full h-[200px] object-cover rounded-[5px]`}
                                src={item.image1}
                                title={item.item ? item.item : "s"}
                                height={isMobile ? "100%" : "100%"}
                                width={isMobile ? "100%" : "100%"}
                  />
                </div>
                <div className="my-[20px] text-center">
                  <Link href={item.btn_link1}>
                    <button className="primary_bg py-[5px] px-[10px] rounded-[5px] text-white ">
                      {item.btn_text1}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        {data &&
          data.cardimage1 &&
          data.cardimage1.length != 0 &&
          data.cardimage1.map((item, i) => {
            return (
              <div
                className="md:flex-[0_0_calc(100%_-_10px)] lg:flex-[0_0_calc(33.33%_-_10px)] bg-white shadow-xl p-[10px] rounded-[5px]"
                key={i}
              >
                <div className="h-[200px] rounded-[5px] w-[100%] flex items-center justify-center ">
                  <ImageLoader
                                style={`w-full h-[200px] object-cover rounded-[5px]`}
                                src={item.image1}
                                title={item.item ? item.item : "s"}
                                height={isMobile ? 200 : 200}
                                width={isMobile ? "100%" : "100%"}
                  />
                </div>

                <div className="my-[20px] text-center">
                  <Link href={item.btn_link1}>
                    <button className="primary_bg py-[5px] px-[10px] rounded-[5px] text-white ">
                      {item.btn_text1}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
      </div>
    </div>}
    {data.section_name == "Left Image Right Card List Style Four" &&
    <div className="w-[90%] mx-auto">
      <div className="text-center">
        <p className="md:text-[20px] lg:text-[24px]">{data.subtitle}</p>
        <h1 className="md:text-[26px] lg:text-[34px] font-semibold">{data.title}</h1>
      </div>
     
        {data.cardlist.map((item,i)=>{
          return(
            <div key={i} className={`flex md:flex-col md:h-[400px] md:relative  my-[30px] ${item.img_position =="Right" ?"lg:flex-row-reverse":" lg:flex-row"}`}>
             <div className="lg:flex-[0_0_calc(50%_-_10px)]">
              <Image src={check_Image(item.list_img)} width={30} height={30} alt={item.img_position} className="w-[100%] rounded-[5px]"/>
             </div>
             <div className="lg:flex-[0_0_calc(50%_-_10px)] lg:relative h-[100%]">
              <div className={` absolute  md:top-[50%] md:right-[10px] md:left-[10px] bg-white rounded-[10px] md:px-[10px] md:py-[20px]  lg:py-[10px] lg:px-[20px]  md:h-[200px] lg:h-[280px] shadow-[0_10px_30px_-10px_#97a3b880] ${item.img_position =="Right" ? "lg:right-[-37px] lg:left-0 lg:top-[70px]":"lg:left-[-37px] lg:right-0 lg:top-[70px]"}`}>
                <div className="flex flex-col items-start justify-center h-[100%]">
              <h1 className="flex text-[18px] text-[#121828] font-medium gap-[5px]"><Image src={check_Image(item.list_icon)} width={15} height={15} alt={item.img_position}/>{item.list_title}</h1>
              <p className="text-[16px] text-[#4e565f] md:line-clamp-5">{item.listconent}</p>
              </div>
              </div>
             </div>
            </div>
          )
        })}
    
    </div>
    }
    </>
  );
}
