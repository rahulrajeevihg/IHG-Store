import { check_Image } from "@/libs/api";
import Image from "next/image";
import Carousel from "react-multi-carousel";

export default function Clients({ data }) {
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 5,
      paritialVisibilityGutter: 60,
    },
    tablet: {
      breakpoint: { max: 1024, min: 768 },
      items: 3,
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
  return (
    <>
      <div className="main-width clients_style md:px-[10px]">
        {data.section_name == "Clients Style 1" && (
          <>
            <div className="flex flex-col justify-center items-center">
              <h1 className="md:text-[18px] lg:text-[34px] font-semibold my-[20px]">
                {data.title} {data.spantitle}
              </h1>
              <p className="text-[16px] text-[#4e565f] mb-[16px]">
                {data.subtitle}
              </p>
            </div>
            <Carousel
              //   autoPlay={true}
              autoPlaySpeed={2500}
              infinite
              pauseOnHover
              responsive={responsive}
              slidesToSlide={1}
              swipeable={true}
            >
              {data.logos.map((item, i) => {
                return (
                  <div
                    key={i}
                    className="max-h-[150px] border text-center rounded-[10px] overflow-hidden flex items-center justify-center mx-[1rem]"
                  >
                    <div className="h-[100%] block  ">
                      <Image
                        src={check_Image(item.logo)}
                        width={30}
                        height={30}
                        alt="logo"
                        className="w-[110px] h-[150px]"
                      />
                    </div>
                  </div>
                );
              })}
            </Carousel>
          </>
        )}
        {data.section_name == "Clients Style 2" && (
          <>
            <div className="flex flex-col justify-center items-center">
              <h1 className="md:text-[18px] lg:text-[34px] font-semibold my-[20px]">
                {data.title} {data.spantitle}
              </h1>
              <p className="text-[16px] text-[#4e565f] mb-[16px]">
                {data.subtitle}
              </p>
            </div>
            <div className="flex lg:flex-wrap gap-[10px] overflow-auto" >
              {data.logos.map((item, i) => {
                return (
                  <div key={i} className={`md:flex-[0_0_calc(80%_-_10px)] lg:flex-[0_0_calc(20%_-_10px)] max-h-[150px] border text-center rounded-[10px] overflow-hidden `}>
                    <div className="h-[100%]  flex justify-center items-center   ">
                      <Image
                        src={check_Image(item.logo)}
                        width={30}
                        height={30}
                        alt="logo"
                        className="w-[110px] h-[150px]"
                      />
                    </div>
                  </div>
                );
              })}
              {/* <div></div> */}
            </div>
          </>
        )}
      </div>
    </>
  );
}
