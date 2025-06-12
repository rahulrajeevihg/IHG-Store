import Image from "next/image";
import { check_Image } from "@/libs/api";
// import ImageLoader from "../ImageLoader";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });
export default function SellerContent({ data, isMobile }) {
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
      {data.section_name == "Left Content Right Image" || data.section_name == "Right Content Left Image" &&
        <div
          className={`${data.section_name == "Left Content Right Image"
              ? "lg:flex-row-reverse md:flex-col-reverse  lg:my-[30px] md:px-[10px] md:py-[10px] "
              : "lg:flex-row md:flex-col  lg:my-[30px] md:px-[10px] md:py-[10px] "
            }flex   `}
        >
          <div className={`lg:flex-[0_0_calc(40%_-_10px)]`}>
            <div className="h-[300px] w-[100%] rounded-[8px] flex items-center justify-center ">
              <ImageLoader
                style={`h-full  w-full object-cover rounded-[8px] `}
                src={
                  data.left_image
                    ? check_Image(data.left_image)
                    : check_Image(data.right_image)
                }
                title={data.title ? data.title : "s"}
                height={isMobile ? 300 : 300}
                width={isMobile ? '100%' : "100%"}
              />
            </div>
          </div>
          <div
            className={`  ${data.section_name == "Left Content Right Image"
                ? "lg:mr-[20px] "
                : "lg:ml-[20px] "
              } lg:flex-[0_0_calc(60%_-_10px)] `}
          >
            <h1 className="primary_color text-[35px] font-bold md:text-[20px]">
              {data.title}
            </h1>
            <p className="text-[16px] text-[#212121] text-justify">
              {data.content}
            </p>
          </div>
        </div>}
      {data.section_name == "Left Image Right Side List Style One" &&
        <div className="flex md:flex-col gap-[10px] w-[90%] mx-auto md:my-[20px]">
          <div className="lg:flex-[0_0_calc(50%_-_10px)]">
            <div className="w-[100%]">
              <Image src={check_Image(data.left_image)} width={30} height={30} alt="leftimage" className="w-[100%] " />
            </div>
          </div>
          <div className="lg:flex-[0_0_calc(50%_-_10px)] ">
            <div className="lg:ml-[70px] flex  flex-col gap-[10px] items-start justify-center h-[100%]">
              <h1 className="" >
                <span className="md:text-[26px] lg:text-[34px] leading-[1] font-semibold text-[#121828]">{data.title}</span>
                <span className="md:text-[26px] lg:text-[34px] font-semibold primary_color">{data.spantitle}</span>
              </h1>
              <p className="md:text-[14px] lg:text-[16px] text-[#4e565f]">{data.content}</p>
              {data.listpoints.map((item, i) => {
                return (
                  <>
                    <h4 key={i} className="text-[16px] text-[#4e565f] flex  gap-3 pb-[10px] mt-[10px]"><Image src={check_Image(item.list_icon)} width={10} height={10} alt={item.list_title} className="w-[22px]" /> {item.list_title}</h4>
                  </>
                )
              })}
            </div>
          </div>
        </div>
      }
      {data.section_name == "Left Side List Style Two and Right Image" &&
        <div className="flex md:flex-col gap-[10px] w-[90%] mx-auto md:my-[20px] ">
          <div className="lg:flex-[0_0_calc(50%_-_10px)] ">
            <div className="flex flex-col gap-[10px] items-start justify-center h-[100%]">
              <h1 className="" >
                <span className="md:text-[26px] lg:text-[34px] leading-[1] font-semibold text-[#121828]">{data.title}</span>
                <span className="md:text-[26px] lg:text-[34px] font-semibold primary_color">{data.spantitle}</span>
              </h1>
              <p className="md:text-[14px] lg:text-[16px] text-[#4e565f]">{data.content}</p>
              {data.listpoints.map((item, i) => {
                return (
                  <div className="border-l-[5px] w-[100%] px-[20px] mb-[10px] border-[#4e565f] hover:border-primary">
                    <h4 key={i} className="text-[22px] text-[#121828]  pb-[10px]">{item.list_title}</h4>
                    <p className="text-[16px] text-[#4e565f]">{item.listconent}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="lg:flex-[0_0_calc(50%_-_10px)]">
            <div className="w-[100%]">
              <Image src={check_Image(data.right_image)} width={30} height={30} alt="leftimage" className="w-[100%] " />
            </div>
          </div>
        </div>
      }
      {data.section_name == "Center title with content and center Image" &&
        <div className="lg:w-[100%] md:w-[90%] md:mx-auto text-center">
          <h1 className="text-[34px] text-[#121828] font-semibold">{data.title}</h1>
          <p className="text-[16px] text-[#4e565f] mb-[20px]">{data.content}</p>
          <div className="w-[100%] ">
            <Image src={check_Image(data.center_image)} width={10} height={10} className="w-[100%] md:max-h-[166px] md:min-h-[166px] lg:max-h-[557px] lg:min-h-[557px] object-cover" alt="center_image" />
          </div>
        </div>
      }
      {data.section_name == "Full Bg with overlay Text Right Image" &&
        <div style={{ backgroundImage: `url('${check_Image(data.bg_image)}')`, backgroundSize: 'cover' }} className="bg-no-repeat  w-[100%] object-cover ">
          <div className="main-width flex md:flex-col py-[30px] h-[100%] ">
            <div className="lg:flex-[0_0_calc(50%_-_10px)] h-[100%] md:py-[20px] md:px-[10px]  lg:py-[30px] lg:px-[40px] ">
              <h1 className="text-white md:text-[26px] md:text-center lg:text-[34px] font-bold">{data.title}</h1>
              <h6 className="text-white md:text-[16px] md:text-center lg:text-[18px]">{data.subtitle}</h6>
              <div className=" lg:overflow-auto lg:h-[300px] scrollbarHide">
                <h1 className="text-white md:text-[14px] md:text-justify lg:text-[16px]">{data.content}</h1>
              </div>
            </div>
            <div className="lg:flex-[0_0_calc(50%_-_10px)]  md:py-[20px] md:px-[10px] ">
              <div className="lg:h-[425px] w-[100%]">
                <Image src={check_Image(data.right_image)} width={30} height={30} alt="right_image" className="h-[100%] w-[100%] object-cover" />
              </div>
            </div>
          </div>
        </div>
      }
      {data.section_name == "Full Bg with overlay Text" &&
        <div style={{ backgroundImage: `url('${check_Image(data.bg_image)}')`, backgroundSize: 'cover' }} className="bg-no-repeat  w-[100%] object-cover ">
          <div className="main-width flex md:flex-col py-[30px] h-[100%] ">
            <div className=" h-[100%] md:py-[20px] md:px-[10px]  lg:py-[30px] lg:px-[40px] ">
              <h1 className="text-white md:text-[26px] md:text-center lg:text-[34px] font-bold">{data.title}</h1>
              <h6 className="text-white md:text-[16px] md:text-center lg:text-[18px]">{data.subtitle}</h6>
              <div className=" lg:w-[50%]">
                <h1 className="text-white md:text-[14px] md:text-justify lg:text-[16px]">{data.content}</h1>
              </div>
              {data.btn && JSON.parse(data.btn).btn_text &&
                <div className="md:text-center mt-[10px]">
                  <button className="border border-white text-white text-[16px] px-[10px] py-[5px] rounded-[5px]">{JSON.parse(data.btn).btn_text}</button>
                </div>}
            </div>
            {/* <div className="lg:flex-[0_0_calc(50%_-_10px)]  md:py-[20px] md:px-[10px] ">
           <div className="lg:h-[425px] w-[100%]">
         <Image src={check_Image(data.right_image)} width={30} height={30} alt="right_image" className="h-[100%] w-[100%] object-cover"/>
         </div>
         </div> */}
          </div>
        </div>
      }

      {data.section_name == "Left Content Right Image with Subtitle" &&
        <div className="flex md:flex-col-reverse gap-[10px] w-[90%] mx-auto">
          <div className="lg:flex-[0_0_calc(50%_-_10px)] flex flex-col items-start justify-center gap-[20px]">
            <h5 className=" md:text-[16px] lg:text-[18px] text-[#121828]">{data.subtitle}</h5>
            <h1 className="md:text-[16px] lg:text-[34px] text-[#121828] font-bold leading-normal">{data.title}</h1>
            <p className="md:text-[14px] lg:text-[16px] text-[#4e565f]">{data.description}</p>
          </div>
          <div className="lg:flex-[0_0_calc(50%_-_10px)]">
            <div className="lg:p-[20px]">
              <Image src={check_Image(data.right_img)} width={30} height={30} alt="right_image" className="w-full object-contain" />
            </div>
          </div>
        </div>
      }
    </>
  );
}
