import { check_Image } from "@/libs/api";
import Image from "next/image";
import Carousel from "react-multi-carousel";
// import ImageLoader from "../ImageLoader";
import { useState, useEffect,useRef } from "react";
// import ViewAll from "@/components/Common/ViewAll";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });
const ViewAll = dynamic(() => import("@/components/Common/ViewAll"), { ssr: false });
// const Carousel = dynamic(() => import("react-multi-carousel"));
export default function Testimonial({ data }) {
  const customCarouselStyles = {
    border: "1px solid #ccc",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexWrap: "wrap",
  };
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselRef = useRef(null);
  // console.log(carouselRef)

  useEffect(() => {
    const autoplay = setInterval(() => {
      goToNextSlide();
    }, 3000); // Change the interval duration as needed (in milliseconds)

    return () => clearInterval(autoplay); // Cleanup interval on unmount
  }, [currentSlide]);
  const goToPrevSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? data.data.length - 3 : prevSlide - 3
    );
  };

  const goToNextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 3) % data.data.length);
  };
  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768; // Adjust this value to define your mobile width threshold
      if (window.innerWidth <= mobileWidth) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    handleResize(); // Initial check on component mount

    window.addEventListener("resize", handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener("resize", handleResize); // Clean up the event listener
    };
  }, []);

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items:
        data.section_name == "Testimonials Style 1"
          ? 4
          : data.section_name == "Testimonials Style 2"
          ? 6
          : data.section_name == "Testimonials Style 3"
          ? 3
          : data.section_name == "Testimonials Style 4"
          ? 1
          : data.section_name == "Testimonials Style 5"
          ? 1
          : data.section_name == "Testimonials Style 6"
          ? 3
          : data.section_name == "Testimonials Style 7"
          ? 2
          : null,
      paritialVisibilityGutter: 60,
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items:
        data.section_name == "Testimonials Style 4" ||
        data.section_name == "Testimonials Style 5"
          ? 1
          : 3,
      paritialVisibilityGutter: 50,
    },
    mobile: {
      breakpoint: { max: 768, min: 464 },
      items: 2,
      paritialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      paritialVisibilityGutter: 30,
    },
  };

  const removeArrowOnDeviceType = ["tablet", "mobile", "desktop"];


    // setInterval(()=>{
        // {data.section_name == "Testimonials Style 6" && sctollTo('next')} 
    // },1000)
  
  // const sctollTo = (direction) => {
  //   let custom_slider = document.getElementById("slider_id");
  //   let slider_div = document.getElementById("slider_child_id");
  //   let slider_width = custom_slider.clientWidth;
  //   let val = Array.from(slider_div.childNodes);
  //   let last=slider_div.lastElementChild
  //   let first=slider_div.firstElementChild
  //   let totalWidth = val.length * (val[0].offsetWidth + 20);
  //   let hoverTimeout;
  //   if (direction == "next") {
  //     clearTimeout(hoverTimeout);
  //     slider_div.scrollBy({ top: 0, left: 50, behavior: 'smooth' });
  //     slider_div.insertBefore(last,first)
  //     // hoverTimeout = setInterval(() => {
  //     //   {data.section_name == "Testimonials Style 6" && sctollTo('next')} 
  //     // }, 5000);

  //   } else {
  //     clearTimeout(hoverTimeout);
  //     slider_div.scrollBy({ top: 0, left: -50, behavior: 'smooth' });
  //     slider_div.scrollLeft -= val[0].offsetWidth + 20;
  //     slider_div.insertBefore(first,last)
  //     // hoverTimeout = setInterval(() => {
  //     //   {data.section_name == "Testimonials Style 6" && sctollTo('next')} 
  //     // }, 5000);
  //   }
  // }

 
    // setInterval(() => {
    //   {data.section_name == "Testimonials Style 6" && sctollTo('next')} 
    // }, 6000);

    const handleNextClick = () => {
      if (carouselRef.current) {
        carouselRef.current.next(1); // Move forward by 1 item
      }
    };
  
    const handlePrevClick = () => {
      if (carouselRef.current) {
        carouselRef.current.previous(1); // Move back by 1 item
      }
    };
 

  return (
    <>
      {(data.section_name == "Testimonials Style 1" ||
        data.section_name == "Testimonials Style 3" ||
        data.section_name == "Testimonials Style 4" ||
        data.section_name == "Testimonials Style 5" || 
        data.section_name == "Testimonials Style 7" )&& (
        <>
          <div
            className={`${
              data.section_name == "Testimonials Style 1"
                ? "test_1"
                : data.section_name == "Testimonials Style 3"
                ? "test_3"
                : data.section_name == "Testimonials Style 4"
                ? "test_4 w-[90%] mx-auto md:mb-[20px] lg:mt-[80px]"
                : data.section_name == "Testimonials Style 5"
                ? "test_5 md:mb-[20px] lg:mt-[50px] w-[90%] mx-auto"
                : ""
            } `}
          >
          
          <ViewAll data={data} />


            {/* <div
              className={`${
                data.section_name == "Testimonials Style 4"
                  ? "md:pt-[35px] hidden"
                  : data.section_name == "Testimonials Style 5"
                  ? "hidden"
                  : "md:pb-[5px]"
              }`}
            >
              <p className="text-center text-[20px] primary_color">
                {data.reference_document}
              </p>
              <h1 className="text-center text-[30px] font-semibold ">
                {data.title}
              </h1>
            </div> */}

            <Carousel
              //  className="flex flex-wrap"
              //  style={customCarouselStyles}
              autoPlay={true}
              removeArrowOnDeviceType={
                data.section_name == "Testimonials Style 5"
                  ? !removeArrowOnDeviceType
                  : removeArrowOnDeviceType
              }
              autoPlaySpeed={2500}
              infinite
              pauseOnHover
              responsive={responsive}
              slidesToSlide={1}
              swipeable={true}
              
              showDots={
                data.section_name == "Testimonials Style 3" ? true : false
              }
              renderDotsOutside={true}
            >
              {/* <h1>hello world</h1> */}
              {data && data.data && data.data.length != 0 &&
                data.data.map((item, i) => {
                  return (
                    <>
                      {data.section_name != "Testimonials Style 7" && <div
                        className={` ${
                          data.section_name == "Testimonials Style 3"
                            ? "h-[320px]  mx-[1rem] p-[10px] flex flex-col gap-2"
                            : data.section_name == "Testimonials Style 1"
                            ? "h-[330px] flex flex-col gap-[10px] items-start justify-start m-[1rem] p-[10px] border-none shadow-lg "
                            : data.section_name == "Testimonials Style 4"
                            ? "flex md:flex-col lg:mx-[10px] gap-[10px] lg:h-[400px] border-none  "
                            : data.section_name == "Testimonials Style 5"
                            ? "flex md:flex-col lg:mx-[10px] gap-[10px] lg:h-[400px] border-none   w-full "
                            : ""
                        } border rounded-t-md rounded-b-md `}
                        key={i}
                      >
                        <div
                          className={`${
                            data.section_name == "Testimonials Style 1"
                              ? "w-[80px] h-[80px] rounded-[50%] flex items-center justify-start"
                              : data.section_name == "Testimonials Style 3"
                              ? "h-[100px] p-[10px]"
                              : data.section_name == "Testimonials Style 4"
                              ? "lg:flex-[0_0_calc(50%_-_10px)] h-[400px] md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px]"
                              : data.section_name == "Testimonials Style 5"
                              ? "lg:flex-[0_0_calc(50%_-_10px)] h-[400px] md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px]"
                              : "h-[200px] w-full"
                          } `}
                        >
                           {data.section_name == "Testimonials Style 1"  && <ImageLoader
                                style={`w-[80px] h-[80px] rounded-[50%] object-cover`}
                                src={item.image}
                                title={item.title ? item.title : "s"}
                                height={isMobile ? 80 : 80}
                                width={isMobile ? "100%" : "100%"}/>}
                          {data.section_name == "Testimonials Style 3"  && <ImageLoader
                                style={`w-[100px] h-[100px] rounded-[10px] object-cover`}
                                src={item.image}
                                title={item.title ? item.title : "s"}
                                height={isMobile ? 100 : 100}
                                width={isMobile ? "100%" : "100%"}/>}
                                  {data.section_name == "Testimonials Style 4"  && <ImageLoader
                                style={`w-full lg:w-[80%] h-full object-cover md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px]`}
                                src={item.image}
                                title={item.title ? item.title : "s"}
                                height={isMobile ? 400 : 400}
                                width={isMobile ? "100%" : "100%"}/>}
                                   {data.section_name == "Testimonials Style 5"  && <ImageLoader
                                style={`w-full lg:w-[80%] h-full object-cover md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px]`}
                                src={item.image}
                                title={item.title ? item.title : "s"}
                                height={isMobile ? 400 : 400}
                                width={isMobile ?"100%" : "100%"}/>}



                          {/* <Image
                            src={check_Image(item.image)}
                            width={30}
                            height={30}
                            className={`${
                              data.section_name == "Testimonials Style 1"
                                ? "w-[80px] h-[80px] rounded-[50%] object-cover"
                                : data.section_name == "Testimonials Style 3"
                                ? "w-[100px] h-[100px] rounded-[10px] object-cover "
                                : data.section_name == "Testimonials Style 4"
                                ? " w-full lg:w-[80%] h-full object-cover md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px]"
                                : data.section_name == "Testimonials Style 5"
                                ? "w-full lg:w-[80%] h-full object-cover md:rounded-[10px] lg:rounded-tl-[20px] lg:rounded-bl-[20px] "
                                : "w-full h-full object-contain rounded-t-md"
                            }`}
                          /> */}
                        </div>
                        <div
                          className={`${
                            data.section_name == "Testimonials Style 1"?"flex flex-col gap-[10px]"
                            :data.section_name == "Testimonials Style 4"
                              ? "lg:flex-[0_0_calc(50%_-_10px)] flex flex-col items-start justify-center gap-[10px] "
                              : data.section_name == "Testimonials Style 5"
                              ? "lg:flex-[0_0_calc(50%_-_10px)]  flex flex-col items-start justify-start gap-[10px]"
                              : ""
                          } p-[10px]`}
                        >
                          <h1
                            className={`${
                              data.section_name == "Testimonials Style 4"
                                ? "md:text-[20px] lg:mb-[30px] lg:text-[40px]  primary_color font-bold"
                                : data.section_name == "Testimonials Style 5"
                                ? "md:text-[20px] lg:mb-[30px] lg:text-[40px]  font-bold"
                                : "text-[16px] font-semibold"
                            }`}
                          >{`"${item.title}"`}</h1>
                          {data.section_name == "Testimonials Style 1" &&
                          <h3 className="md:text-[12px] lg:text-[16px] font-medium">
                            {item.posted_by}
                          </h3>}
                          <p
                            className={`line-clamp-4 text-[13px] font-normal text-[#182b44] ${
                              data.section_name == "Testimonials Style 4"
                                ? "lg:mb-[30px] text-[15px]"
                                : data.section_name == "Testimonials Style 5"
                                ? "lg:mb-[30px] text-[15px]"
                                : ""
                            } `}
                          >
                            {item.content}
                          </p>
                          {(data.section_name == "Testimonials Style 3" ||
                            data.section_name == "Testimonials Style 4" ||
                            data.section_name == "Testimonials Style 5") && (
                            <>
                              <div>
                                <h3 className="font-semibold">{item.name1}</h3>
                                <p className="text-[14px] text-[#182b44] ">
                                  {item.role}
                                </p>
                              </div>
                            </>
                          )}
                          {data.section_name == "Testimonials Style 1" &&
                              <div className="flex flex-row mb-[10px]">
                              {[1, 2, 3, 4, 5].map((item, i) => {
                                return (
                                  <div key={i}>
                                    <Image
                                      src={"/detail/star-f-01.svg"}
                                      height={10}
                                      width={20}
                                      alt="star"
                                    />
                                  </div>
                                );
                              })}
                            </div>}
                      
                        </div>
                      </div>}

                      {data.section_name == "Testimonials Style 7" && 
                       <div className="light_bg rounded-[8px] lg:mr-[1rem] p-[40px]">
                         <p className={`min-h-[88px] overflow-hidden line-clamp-4 text-[13px] font-normal text-[#182b44] `}>{item.content} </p>
                          
                         <div className="flex items-center justify-between pt-[20px]">
                           <div className="flex items-center gap-[8px]">
                             <div className="border-[1px] border-slate-200 rounded-[5px] p-[4px]"><Image style={{ objectFit: 'contain' }} className='h-[40px] w-[50px]' height={60}  width={60} alt='vantage' src={check_Image(item.image)} /></div>
                             <h6 className="text-[14px] text-semibold">{item.posted_by}</h6>
                           </div>

                           <Image style={{ objectFit: 'contain' }} className='h-[40px] w-[50px]' height={60}  width={60} alt='vantage' src={'/Home/Testimonials_Style_7.jpg'} />

                         </div> 

                       </div>
                      }
                    </>
                  );
                })}
            </Carousel>
          </div>
        </>
      )}

      {data.section_name == "Testimonials Style 6" && (
        <>
          <div className="relative md:px-[10px] lg:my-[50px] test_6" id="slider_id">
            <div className="lg:w-[80%] lg:mx-auto mb-[40px] flex items-center justify-between">
              <h1 className=" text-[30px] font-semibold primary_color">
                {data.title}
              </h1>
              {/* <p className="text-[18px] font-normal">{data.span_title}</p> */}
              <div className="flex gap-4 md:hidden">
                <div
                 onClick={handlePrevClick}
                  className="text-[20px] cursor-pointer w-[30px] h-[30px] rounded-[5px] shadow-md flex items-center justify-center"
                >
                  <Image
                    src={"/rightArrow.svg"}
                    width={20}
                    height={20}
                    alt="rightarrow"
                    className=" w-[25px] h-[20px] p-[5px]"
                  />
                </div>
                <div
               onClick={handleNextClick}
                  className="text-[20px] cursor-pointer w-[30px] h-[30px] rounded-[5px] shadow-md flex items-center justify-center"
                >
                  <Image
                    src={"/leftArrow.svg"}
                    width={20}
                    height={20}
                    alt="leftarrow"
                    className=" w-[25px] h-[20px] p-[5px]"
                  />
                </div>
              </div>
            </div>

            <Carousel
             autoPlay={true}
             ref={carouselRef} 
             removeArrowOnDeviceType={removeArrowOnDeviceType}
             autoPlaySpeed={2500}
              infinite
              pauseOnHover
              responsive={responsive}
              slidesToSlide={1}
              swipeable={true}>
              {data &&
                data.data &&
                data.data.length != 0 &&
                data.data.map((item, i) => {
                  return (
                    <>
                      <div
                        key={i}
                        className=" mx-[1rem] rounded-[10px] relative   h-[230px] shadow-lg"
                      >
                        <div className="flex items-center justify-center flex-col pt-[50px]  ">
                          <div className="h-[100px] w-[100px] rounded-[50%]  overflow-hidden flex  border_primary2 absolute top-[-60px]">
                            <ImageLoader
                                style={`h-[100px] w-[100px] p-[5px] rounded-[50%] object-contain shadow-md`}
                                src={item.image}
                                title={item.item ? item.item : "s"}
                                height={isMobile ? 100 : 100}
                                width={isMobile ? "100%" : "100%"}
                            />
                          </div>
                          <h1 className="text-[20px] font-semibold">
                            {item.name1}
                          </h1>
                          <p className="text-[16px] font-normal">{item.role}</p>
                          <p className="line-clamp-3 px-[20px] text-[12px] ">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })}
            
  
            </Carousel>
            </div>
        </>
      )}

      {data.section_name == "Testimonials Style 2" && (
        <>
          <div className="md:w-[90%] md:mx-auto lg:my-[50px]">
            <div>
              <h1 className="text-[34px] text-[#121828] font-semibold">
                {data.subtitle}
              </h1>
            </div>
            <div className="flex overflow-auto lg:flex-wrap gap-[10px] md:px-[10px] lg:px-[20px]">
              {data.data &&
                data.data.length != 0 &&
                data.data.map((item, i) => {
                  return (
                    <div key={i} className="md:flex-[0_0_calc(85%_-_10px)] lg:flex-[0_0_calc(33.33%_-_10px)] shadow-[#0000003d_0_3px_8px] my-[10px] p-[2%] rounded-[10px]">
                      <div className="my-[10px] ">
                        <div className="flex flex-row mb-[10px]">
                          {[1, 2, 3, 4, 5].map((item, ind) => {
                            return (
                              <div key={ind}>
                                <Image
                                  src={"/detail/star-f-01.svg"}
                                  height={10}
                                  width={20}
                                  alt="star"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[13px] leading-6 line-clamp-5">
                          {item.content}
                        </p>
                      </div>
                      <div className="flex gap-[10px] items-center">
                        <div className="w-[50px] h-[50px] rounded-[50%]">
                          <ImageLoader
                                style={`w-[100%] h-[100%] object-cover rounded-[50%]`}
                                src={item.image}
                                title={item.title ? item.title : "s"}
                                height={isMobile ? 50 : 50}
                                width={isMobile ? "100%" : "100%"}
                       
                          />
                        </div>
                        <div className="leading-tight">
                          <h1 className="md:text-[18px] lg:text-[22px]">
                            {item.title}
                          </h1>
                          <h3 className="md:text-[12px] lg:text-[16px]">
                            {item.posted_by}
                          </h3>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* {data.section_name == "Testimonials Style 6" && (
        <div className="slider-container flex">
        <button onClick={goToPrevSlide} className="slider-button">
          Prev
        </button>
        {data.data.map((slide, index) => (
          <div
            key={index}
            className={`slide ${index == currentSlide  ?'active' : ''} `}
          >
            <Image src={check_Image(slide.image)} width={30} height={30} alt={`Slide ${index}`} />
            
          </div>
        ))}
        <button onClick={goToNextSlide} className="slider-button">
          Next
        </button>
      </div>
      )} */}

    </>
  );
}
