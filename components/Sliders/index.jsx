import Carousel from "react-multi-carousel";
// import 'react-multi-carousel/lib/styles.css';
// import styles from '@/styles/Slider.module.scss'
// import Image from 'next/image';
// import { check_Image } from '@/libs/api';
import { useRouter } from 'next/router';
import dynamic from "next/dynamic";
import Image from "next/image";
import { check_Image } from "@/libs/api";
const ImageLoader = dynamic(() => import('../ImageLoader'))
import Slider from "react-slick";
// import ImageLoader from '../ImageLoader';
export default function Sliders({ data, perView, imgClass, event, isMobile }) {

  const router = useRouter();
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: perView ? perView : 3,
      paritialVisibilityGutter: 60
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 1,
      paritialVisibilityGutter: 50
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      paritialVisibilityGutter: 30
    }
  }


  // const loading = () => {
  //   return isMobile ? '/Home/slide_mob.png' : '/Home/slide_web.png'
  // }



  return (
    <>
      {
        (
          <>
            {data.length != 0 ?
              <Carousel
                autoPlay
                arrows={!isMobile}
                autoPlaySpeed={7000}
                // infinite
                pauseOnHover
                responsive={responsive}
                slidesToSlide={1}
                swipeable
              >
                {data.map((res, index) => {
                  return (
                    <div onClick={() => res.route ? router.push(`/${router.asPath.split('/')[1]}/category/${res.route}`) : null} className={`${event ? '' : 'flex items-center justify-center gap-[15px] h-full'}`} key={index}>
                      <div className={`lg:flex-[0_0_calc(30%_-_10px)] home your-element md:w-full`}>
                        {/* <ImageLoader slide={true} isMobile={isMobile} style={`${imgClass ? imgClass : 'h-[300px]'} w-full your-element`} height={570} width={1500} src={(isMobile ? res.mobile_image1 : res.image ? res.image : res.web_image1 ? res.web_image1 : null)} title={res.item ? res.item : ''} /> */}
                        {/* // : */}

                        <Image alt={''}  loading='lazy' src={check_Image(isMobile ? res.mobile_image1 : res.image ? res.image : res.web_image1 ? res.web_image1 : null)} height={isMobile ? 250 : 500} width={isMobile ? 500 : 1500} className={`${imgClass ? imgClass : 'h-[300px]'} your-element w-full `} />
                      </div>
                    </div>
                  )
                })}
              </Carousel>
              
              : <SliderCom data={data} isMobile={isMobile} perView={perView} imgClass={imgClass} event={event} />
            }
          </>
        )
      }

      {/* <div className="main-width bg-cover lg:mt-10">
        <div className="p-4 lg:p-[60px] bg-cover" style={{ backgroundImage: 'url("/Home/Hero.png")' }}>
          <div>
            <h1 className="font-bold text-[24px] lg:text-[48px]">Elevate Your Shopping Experience</h1>
            <p className="mt-2 text-sm lg:text-[20px] font-medium text-[#606060] w-full lg:w-[55%] leading-[24px] lg:leading-[36px]">Explore a world of innovation with our handpicked selection of iPhones and top-notch smartphones. Elevate your daily routine with the latest in mobile technology.</p>

            <button className="py-1 lg:py-2 px-2 lg:px-3 rounded bg-black font-bold text-xs lg:text-lg text-white mt-4">
              ⚡Shop Now
            </button>
          </div>

          <div className="lg:flex space-y-3 justify-between mt-8">
            <div className="lg:flex gap-4 space-y-2 items-center">
              <div className="flex items-center gap-2">
                <Image src="/Home/shield.png" width={13} height={16} alt="" />
                <p className="lg:text-lg font-bold">Certifiied Sellers</p>
              </div>

              <div className="flex items-center gap-2">
                <Image src="/Home/star.png" width={13} height={16} alt="" />
                <p className="lg:text-lg font-bold">12 Months Warranty</p>
              </div>

              <div className="flex items-center gap-2">
                <Image src="/Home/calendar.png" width={13} height={16} alt="" />
                <p className="lg:text-lg font-bold">14 Days Returns</p>
              </div>
            </div>

            <div className="border rounded bg-white py-1 lg:py-2 px-2 lg:px-3 flex gap-1 w-fit">
              <p className="text-sm lg:text-base">Loved by <span className="font-bold">30,00,000</span> Customers</p>
              <Image src="/Home/Heart.png" width={24} height={24} />
            </div>
          </div>
        </div>
      </div> */}
    </>
  )
}


const Skeleton = () => {
  return (
    <>
      <div className="w-[95%] lg:py-0 md:p-[10px] flex lg:gap-[30px] md:flex-col animate-pulse mx-auto ">
        <div className="w-[100%] md:w-[300px] lg:h-[750px] bg-slate-300 ">

        </div>
        {/* <div className="lg:flex-[0_0_calc(40%_-_10px)] flex">
                  <div className='md:hidden'>
                      <div className='h-[90px] w-[90px] bg-slate-300 rounded'></div>
                      <div className='h-[90px] my-[10px] w-[90px] bg-slate-300 rounded'></div>
                      <div className='h-[90px] w-[90px] bg-slate-300 rounded'></div>
                      <div className='h-[90px] mt-[10px] w-[90px] bg-slate-300 rounded'></div>
                  </div>
                  <div className='lg:ml-[10px] md:w-full md:mb-[10px] h-[400px] bg-slate-300 w-[calc(100%_-_10px)] rounded'></div>
              </div>

              <div className="lg:flex-[0_0_calc(60%_-_10px)]">
                  <div className='h-[30px] w-[40%] bg-slate-300 rounded'></div>
                  <div className='h-[30px] w-[75%] my-[15px] bg-slate-300 rounded'></div>
                  <div className='h-[30px] w-[20%] mb-[15px] bg-slate-300 rounded'></div>
                  <div className='h-[30px] w-[50%] mb-[15px] bg-slate-300 rounded'></div>
                  <div className='h-[30px] w-[20%] mb-[15px] bg-slate-300 rounded'></div>


                  <div className='md:hidden flex mb-[15px] gap-[10px]'>
                      <div className='h-[40px] w-[150px] bg-slate-300 rounded'></div>
                      <div className='h-[40px] w-[60px] bg-slate-300 rounded'></div>
                      <div className='h-[40px] w-[60px] bg-slate-300 rounded'></div>
                  </div>

                  <div className='h-[30px] mb-[15px] w-[40%] bg-slate-300 rounded'></div>

                  <div className='h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded'></div>
                  <div className='h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded'></div>
                  <div className='h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded'></div>
                  <div className='h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded'></div>

              </div> */}
      </div>
    </>
  )
}


// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const CustomPrevArrow = ({ onClick }) => (
  <button
    className="absolute md:hidden left-4 top-1/2 transform -translate-y-1/2 bg-white text-white p-4 rounded-full shadow-lg z-10 opacity-75 hover:opacity-100"
    onClick={onClick}
  >
    <Image src={'/rightArrow.svg'} width={15} height={15} />
  </button>
);

const CustomNextArrow = ({ onClick }) => (
  <button
    className="absolute md:hidden right-4 top-1/2 transform -translate-y-1/2 bg-white text-white p-4 rounded-full shadow-lg z-10 opacity-75 hover:opacity-100"
    onClick={onClick}
  >
    <Image src={'/leftArrow.svg'} width={15} height={15} />
  </button>
);

const SliderCom = ({data, isMobile, perView, imgClass, event,}) => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
  };

  const images = [
    "https://via.placeholder.com/800x400?text=Slide+1",
    "https://via.placeholder.com/800x400?text=Slide+2",
    "https://via.placeholder.com/800x400?text=Slide+3",
  ];

  return (
    <div className="min-w-full h-full mx-auto p-4">
      <Slider {...settings}>
      {data.map((res, index) => {
                  return (
                    <div onClick={() => res.route ? router.push(`/${router.asPath.split('/')[1]}/category/${res.route}`) : null} key={index}>
                      <div className={`home your-element md:w-full`}>
                        {/* {isMobile ? */}
                        {/* <ImageLoader slide={true} isMobile={isMobile} style={`${imgClass ? imgClass : 'h-[300px]'} w-full your-element`} height={570} width={1500} src={(isMobile ? res.mobile_image1 : res.image ? res.image : res.web_image1 ? res.web_image1 : null)} title={res.item ? res.item : ''} /> */}
                        {/* // : */}

                        <Image alt={''}  loading='lazy' src={check_Image(isMobile ? res.mobile_image1 : res.image ? res.image : res.web_image1 ? res.web_image1 : null)} height={isMobile ? 250 : 500} width={isMobile ? 500 : 1500} className={`${'h-full w-full object-cover'} your-element w-full `} />
                        {/* } */}
                      </div>
                    </div>
                  )
                })}
      </Slider>
    </div>
  );
};

