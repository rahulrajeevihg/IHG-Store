import { useMemo, useState, useEffect } from "react";
import Image from 'next/image';
import { check_Image } from '@/libs/api';
import Link from 'next/link'
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import Brands from "../Common/Brands";
import ChooseCategory from "../Common/ChooseCategory";
import { useRouter } from "next/router";
import ProductSection from "./ProductSection";
import { resetFilter, setFilter } from "@/redux/slice/homeFilter";
import { resetFilters } from "@/redux/slice/filtersList";


const ImageLoader = dynamic(() => import('../ImageLoader'));
const Faq = dynamic(() => import('@/components/Builders/Faq'));
const SellerContent = dynamic(() => import('@/components/Builders/SellerContent'));
const OurTeam = dynamic(() => import('@/components/Builders/OurTeam'));
const CardList = dynamic(() => import('@/components/Builders/CardList'));
const Testimonial = dynamic(() => import('@/components/Common/Testimonial'));
const SubHeader = dynamic(() => import('@/components/Common/SubHeader'));
const ContactInfo = dynamic(() => import('@/components/Common/ContactInfo'));
const Counters = dynamic(() => import('@/components/Builders/Counters'));
const Features = dynamic(() => import('@/components/Builders/Features'));
const GridList = dynamic(() => import('@/components/Builders/GridList'));
const ListStyle = dynamic(() => import('@/components/Builders/ListStyle'));
const Clients = dynamic(() => import('@/components/Builders/Clients'));
const HomePageBuilder = dynamic(() => import('@/components/Builders/HomePageBuilder'));
const Banner = dynamic(() => import('@/components/Builders/Banner'));
const CategoryList = dynamic(() => import('@/components/Builders/CategoryList'));
const Autumn = dynamic(() => import('@/components/Builders/Autumn'));
const ShopCategory = dynamic(() => import('@/components/Builders/ShopCategory'));
const Product = dynamic(() => import('@/components/Builders/Product'));
const GridItem = dynamic(() => import('@/components/Builders/GridItem'));
const OfferZone = dynamic(() => import('@/components/Builders/OfferZone'));
const CategoryPrScroll = dynamic(() => import('@/components/Builders/CategoryPrScroll'));
const CategoryPr = dynamic(() => import('@/components/Builders/CategoryPr'));
const ProductBox = dynamic(() => import('@/components/Product/ProductBox'));
const ViewAll = dynamic(() => import('@/components/Common/ViewAll'));
const Sliders = dynamic(() => import('@/components/Sliders/index'));
// const InfiniteSlide = dynamic(() => import('@/components/Builders/InfiniteSlide'));

// import HorizontalSlider from "./HorizontalSlider";


export default function WebPageSection({ data, i, isLast,openDetail }) {
  // console.log(data)

  const router = useRouter()
  let [isMobile, setIsMobile] = useState(false);
  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  const dispatch = useDispatch()
  useEffect(() => {
    const handleResize = () => {
      const mobileWidth = 768; // Adjust this value to define your mobile width threshold
      if (window.innerWidth <= mobileWidth) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }

      // if (window.innerWidth == 768) {
      //   getHomePageValues()
      // }

    };

    handleResize(); // Initial check on component mount

    window.addEventListener('resize', handleResize); // Event listener for window resize

    return () => {
      window.removeEventListener('resize', handleResize); // Clean up the event listener
    };
  }, []);

  const changeBg = ($event, title, type, ids, hover) => {

    if (ids % 2 != 0) {
      document.getElementById(ids + title).style.backgroundImage = `url(${check_Image(hover)})`
      document.getElementById(ids + title).style.backgroundRepeat = "no-repeat"
      document.getElementById(ids + title).style.backgroundPosition = "left bottom -40px"
      document.getElementById(ids + title).style.backgroundSize = "auto"
      document.getElementById(ids + title).style.justifyContent = "start"
      document.getElementById(ids + title).style.alignItems = "flex-end"
      // document.getElementById(ids+title).style.transition= "all 1s ease"
      // document.getElementById(ids+title).style.transform= "translate(-35px,-35px)"


      //  document.getElementById(ids+title).style.alignItems = "flex-start"
      document.getElementById(ids + title).style.marginLeft = "10px"
    } else {
      document.getElementById(ids + title).style.backgroundImage = `url(${check_Image(hover)})`
      document.getElementById(ids + title).style.backgroundRepeat = "no-repeat"
      document.getElementById(ids + title).style.backgroundPosition = "right bottom"
      document.getElementById(ids + title).style.backgroundSize = "contain"
      document.getElementById(ids + title).style.justifyContent = "flex-start"
      // document.getElementById(ids+title).style.transform= "translate(-35px,-35px)"

      // document.getElementById(ids+title).style. transition= "all 1s ease-in"
      //  document.getElementById(ids+title).style.algnItems = "flex-start"
      document.getElementById(ids + title).style.marginLeft = "10px"
    }


  }

  const removeBg = ($event, title, type, ids, hover) => {
    document.getElementById(ids + title).style.backgroundImage = null
    document.getElementById(ids + title).style.justifyContent = "center"
    document.getElementById(ids + title).style.backgroundRepeat = null
    document.getElementById(ids + title).style.backgroundPosition = null
    document.getElementById(ids + title).style.backgroundSize = null
    document.getElementById(ids + title).style.alignItems = null
    document.getElementById(ids + title).style.marginLeft = null
    document.getElementById(ids + title).style.transition = null
    // document.getElementById(ids+title).style.transform= null


  }

  const categoryData = [
    {
      "img": "/Home/category/1.png",
      "name": "Lighting & Electrical"
    },
    {
      "img": "/Home/category/2.png",
      "name": "Electrical & Wiring"
    },
    {
      "img": "/Home/category/3.png",
      "name": "Home & Office Furniture"
    },
    {
      "img": "/Home/category/4.png",
      "name": "Home Decor & Accessories"
    },
    {
      "img": "/Home/category/5.png",
      "name": "Signage & Fabrication"
    },
    {
      "img": "/Home/category/6.png",
      "name": "Tools & Kits"
    },
    {
      "img": "/Home/category/7.png",
      "name": "Digital & IT"
    },
    {
      "img": "/Home/category/1.png",
      "name": "Miscellaneous"
    },
  ]

  const changeCategory = (item) => {
    const val = item.redirect_url.split("=")[1]
    router.push(`/list?category=${val}`)
    // router.push("/" + item.redirect_url)
    // dispatch(setFilter({ item_group: [val] }));
    // dispatch(setBrand([]))
  }
  

  useEffect(()=>{
    dispatch(resetFilter())
    dispatch(resetFilters())
  })
 

  // console.log("datett", data);


  return (
    <>
      <div className={`fade-in mb-[20px] ${isLast ? 'lg:pb-10' : ''} your-element ${data.section_name == "Two Column Layout with background down products" ? 'md:min-h-[800px] md:w-full' : (data.section_name == 'Category Products With Horizontal Background') ? 'md:min-h-[390px] md:w-full' : data.section_name == 'Category Product' ? 'md:min-h-[390px] md:w-full' : ''} md:mb-[10px] ${data.section_name == "Content Slider" ? 'tab:min-h-[280px] tab:max-h-[300px] lg:min-h-[400px] lg:max-h-[440px] lg:overflow-hidden lg:!mb-0 home_slide w-full !md:min-h-[200px]' : ''}`}>

        {/* <div className={`mb-[20px] your-element ${data.section_name == "Two Column Layout with background down products" ? 'md:min-h-[800px] md:w-full' : (data.section_name == 'Category Products With Horizontal Background' || data.section_name == 'Category Product') ? 'md:min-h-[390px] md:w-full' : ''} md:mb-[10px] ${data.section_name == "Content Slider" ? 'lg:min-h-[700px] w-full md:min-h-[200px]' : ''}`}> */}
        {
          data.section_name == "Content Slider" &&
          data.sliders &&
          data.sliders.length != 0 && (
            <Sliders
              imgClass={"lg:object-cover w-full !h-full"}
              isMobile={isMobile}
              event={true}
              data={data.sliders}
              perView={1}
              className="gap-0"
            />
          )
        }




        {
          data.section_name == "Shop By Categories" && data.categories && data.categories.length > 0 && (
            <div>
              <div className="main-width lg:max-w-[1350px] lg:py-10 md:p-[10px]  bg-white">
                <ViewAll data={{ title: "Browse our Categories" }} viewAll={false} />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 space-y-2 lg:space-y-4 lg:gap-12">
                  {
                    data.categories.map((item, i) => (
                      <div onClick={() => changeCategory(item)} className="flex-[0_0_auto] text-center lg:px-[14px] justify-center flex flex-col space-y-2 items-center cursor-pointer" key={item.title}>
                        <Image src={check_Image(item.icon)} width={100} height={10} className="w-[55px] lg:w-[70px] h-[55px] lg:h-[70px]" />
                        <p className="text-sm lg:text-lg font-semibold">{item.title}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )
        }

        {
          data.section_name == "Dynamic Product Section" && data.filters && (
            <>
              {/* <ChooseCategory data={data} /> */}
              <ProductSection data={data} openDetail={openDetail} isMobile={isMobile} />
            </>
          )
        }




        {
          data.section_name == "Shop By Brands" && data.data && data.data.length > 0 && (
            <Brands data={data.data} />
          )
        }

        {data && data.section_name == "Sub Header" && (
          <SubHeader data={data} />
        )}

        <div className="main-width">
          {data && data.section_name == "Contact Info" && data.content && data.content == 'contact-us' && (
            <ContactInfo data={data} />
          )}
        </div>
        {data.section_name == "CTA Banner" || data.section_name == "Single Column Banner" &&
          // console.log(data)
          //   <div className="overflow-hidden main-width">
          //  <ImageLoader src={data.image} slide={true} isMobile={isMobile}  width={00} height={260}  className="h-[260px] w-[100%] object-cover your-element" style={"w-full h-full "} />
          //  </div>

          <div className="main-width lg:max-w-[1350px] md:p-[10px] lg:pb-5">
            <Image src={check_Image(data.banner)} width={600} height={100} title="cta_banner_image" className="w-[100%]   md:object-contain lg:object-fit"
            />
          </div>
        }

        {/* {data && data.section_name == 'Content Infinite Slide' && <>
      {data.data && data.data.length > 0 && <div className="overflow-hidden w-full"><InfiniteSlide data={data.data} /></div>}
  </>} */}

        {(data.section_name == "Banner 1 Column" ||
          data.section_name == "Banner 2 Column" ||
          data.section_name == "Banner 3 Column" ||
          data.section_name == "Column 2 Offers Banner" ||
          data.section_name == "Banner 6 Column") && (
            <Banner
              key={i}
              data={data}
              css={
                data && data.section_name == "Banner 3 Column"
                  ? `lg:flex-[0_0_calc(33.33%_-_5px)] md:flex-[0_0_calc(80%_-_10px)]`
                  : data && data.section_name == "Banner 2 Column"
                    ? `first:lg:flex-[0_0_calc(60%_-_10px)] last:lg:flex-[0_0_calc(40%_-_1px)]`
                    : data && data.section_name == "Banner 6 Column"
                      ? "lg:flex-[0_0_calc(16.66%_-_7px)] md:flex-[0_0_calc(44%_-_7px)]"
                      : ""
              }
            />
          )}

        {data.section_name == "App Download" && !isMobile && (
          <div key={i} className="w-[100%] ">
            <HomePageBuilder data={data} bgImg={data.section_bg} isMobile={isMobile} />
          </div>
        )}
        {data.section_name == "Category Products 1 - 3 List" &&
          isMobile && (
            <>
              <Product data={data} />
            </>
          )}
        {data.section_name == "Category Listing Mobile" && isMobile && (
          <div>
            <Product data={data} />
          </div>

        )}

        {data.section_name == "Category List" && isMobile && (
          <div key={i} className="w-[100%] ">
            <ViewAll data={data} viewAll={true} />
            <CategoryList title={data.title} data={data.data} />
          </div>
        )}

        {(data.section_type == "Predefined Section" && data.section_name == "Shop By Category") && (
          <div key={i} className="w-[100%] main-width md:p-[10px]">
            <ViewAll data={data} viewAll={false} />
            <ShopCategory title={data.title} data={data.data} />
          </div>
        )}

        {(data.section_name == "Two Column Layout with Center Logo" &&
          <div className="mt-[50px] relative w-[100%]">
            <div className="flex w-[100%] your-element md:flex-col">
              {data.list && data.list.length != 0 && data.list.map((item, i) => {
                return (
                  <div onMouseEnter={($event) => changeBg($event, item.title, 'enter', i, item.hover_image)} onMouseLeave={($event) => removeBg($event, item.title, 'enter', i, item.hover_image)} className={`flex-[0_0_calc(50%)] transition-all ease-in-out duration-1000 delay-300 overflow-hidden cursor-pointer  flex odd:lg:!mb-[80px] even:!flex-row-reverse even:lg:!mt-[80px] odd:!rounded-tr-[45px] even:!rounded-bl-[45px]`} style={{ backgroundColor: `${item.bgcolor ? item.bgcolor : "transparent"}` }}>
                    <div id={item.title} className="lg:flex-[0_0_calc(40%)] group1 your-element min-h-full w-full">
                      <ImageLoader src={item.image} bg={item.bgcolor} width={500} height={260} title={item.title} className="h-[260px] w-full object-cover your-element" style={"w-full h-full mix-blend-multiply object-cover your-element"} />
                      {/* <Image src={check_Image(item.image)} alt={item.title} className="mix-blend-multiply your-element" width={300} height={300} /> */}
                    </div>
                    <div id={i + item.title} className={`lg:flex-[0_0_calc(60%)] min-h-full w-full md:flex-[0_0_auto] md:px-[10px] flex flex-col justify-center transition-all ease-in-out duration-1000 delay-300 ${i == 0 ? " items-start ml-[30px] " : "items-center ml-0"}  `} >
                      <div className="my-[20px]">
                        <span className="text-[14px] font-normal leading-[18px] tracking-[45%]  text-[#131313]">{item.span_title}</span>
                        <h1 className="text-[24px] md:text-[16px] font-medium leading-[25.2px] traccking-[9px] my-[10px] text-[#340C0C]">{item.title}</h1>
                        <h1 className="text-[16px] md:text-[14px] text-[#ffffff] font-medium leading-[#25.92px] ">{item.content}</h1>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="absolute md:w-[75px] w-[200px] top-[50%] left-[50%] right-[50%] " style={{ transform: "translate(-50%, -50%)" }}>
              <Image src={check_Image(data.center_logo)} width={150} height={150} alt="centerlogo" className="mx-auto md:object-contain your-element" />
            </div>
          </div>

        )}

        {data.section_name == "Best Sellers" && (

          <div key={i} className="w-[100%] py-[20px] md:p-[20px_10px] !bg-cover !bg-no-repeat" style={{ background: data.background_images ? `url(${check_Image(data.background_images)})` : '#f1f1f1' }}>
            <div className="main-width">
              <ViewAll data={data} viewAll={false} />
              <ProductBox
                productList={data.data.slice(0, 10)}
                remove_bg={true}
                home={true}
                rowCount={"flex-[0_0_calc(20%_-_16px)]"}
                scroll_button={isMobile ? true : false}
                scroll_id={isMobile ? data.section_name + i : null}
              />
            </div>
          </div>
        )}

        {data.section_name == "Category Products" && (
          <div key={i} className="main-width md:bg-[#fff] md:p-[0_10px_10px_10px]">
            <ViewAll data={data} viewAll={true} />

            <ProductBox
              home={true}
              productList={data.data.slice(0, 10)}
              rowCount={"flex-[0_0_calc(20%_-_16px)]"}
              scroll_button={isMobile ? true : false}
              scroll_id={isMobile ? data.section_name + i : null}
            />
          </div>
        )}

        {(data.section_name == "Category List With Left Image" && data.section_type == "Lists") && (
          <div key={i} className="main-width flex">
            <div className="md:hidden flex-[0_0_35%]"> <Image alt={'Banner'} src={check_Image(data.left_image)} quality={100} height={300} width={1500} className={`'h-[400px] md:h-[165px] object-cover w-full `} /></div>
            <div className="md:p-[20px_10px] p-[23px] lg:flex-[0_0_65%] bg-cover bg-no-repeat" style={{ background: `url(${check_Image(data.right_background_image)})` }}>
              <h6 className={`text-[12px] font-medium text-center primary_color`}>{data.title}</h6>
              <h6 className={`text-center text-[17px] font-bold`}>{data.title}</h6>
              {data.data && data.data.length != 0 &&

                <div className="flex items-center flex-wrap gap-[40px_40px] md:gap-[10px] lg:p-[30px] md:pt-[10px]">
                  {data.data.map((res, i) => {
                    return (
                      <Link href={res.route ? res.route : '#'} key={i} className="hover:bg-[#fff] transition-colors cursor-pointer border-[#F7B8B8] border-[1px] rounded-[5px] p-[13px] md:p-[0_8px] md:min-h-[55px] flex items-center justify-between flex-[0_0_calc(48%_-_10px)] md:flex-[0_0_calc(50%_-_10px)]">
                        <div className="flex items-center gap-[8px] md:gap-[4px]">
                          <Image style={{ objectFit: 'contain' }} className='md:h-[30px] md:w-[30px] h-[35px] w-[35px]' height={45} width={45} alt='vantage' src={check_Image(res.image)} />
                          <h6 className={`font-medium lg:text-[14px] md:text-[12px]`}>{res.item_title}</h6>
                        </div>

                        <Image className='h-[10px] object-contain' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>

                      </Link>
                    )
                  })}
                </div>
              }
            </div>
          </div>
        )}

        {/* {data.section_name == "Category Products With Horizontal Background" && <HorizontalSlider data={data}/>} */}


        {data.section_name == "Category Products With Horizontal Background" && (
          <CategoryPrScroll data={data} i={i} isMobile={isMobile} />
        )}

        {data.section_name == "Category Product" && (
          <CategoryPr data={data} i={i} isMobile={isMobile} />
        )}

        {data.section_name == "Two row layout left side image and list image" &&
          <div className="lg:my-[60px]">
            <OfferZone data={data} isMobile={isMobile} />
          </div>
        }

        {data.section_name == "Products list" &&
          <div className=" main-width gap-[15px] !bg-no-repeat ">
            <div className={`py-[30px] md:p-[20px_10px] md:w-full ${data.left_image ? "lg:flex-[0_0_calc(75%_-_15px)]" : " lg:flex-[0_0_calc(100%)]"} `}>
              {/* <ViewAll data={data} viewAll={false} headerCss={'text-[#fff]'} /> */}
              <ProductBox
                productList={data.data}
                rowCount={"flex-[0_0_calc(25%_-_10px)]"}
                scroll_button={true}
                scroll_id={data.section_name + i}
              //  leftHorizontalImage={data.left_image}
              />
            </div>
          </div>}

        {data.section_name == "Two Column Layout with background down products" && (
          <div className="w-full lg:my-[50px] your-element" style={{ background: `url(${check_Image(data.background)})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
            <div className=" main-width gap-[15px] md:min-h-[800px] your-element !bg-no-repeat ">
              <Autumn data={data} />
              <div className={`py-[30px] md:min-h-[340px] your-element md:p-[20px_10px] md:w-full ${data.left_image ? "lg:flex-[0_0_calc(75%_-_15px)]" : " lg:flex-[0_0_calc(100%)]"} `}>
                {/* <ViewAll data={data} viewAll={false} headerCss={'text-[#fff]'} /> */}
                <ProductBox
                  productList={data.data}
                  rowCount={"flex-[0_0_calc(25%_-_10px)]"}
                  scroll_button={true}
                  scroll_id={data.section_name + i}
                  remove_bg={true}
                //  leftHorizontalImage={data.left_image}
                />
              </div>
            </div>
          </div>
        )}

        {data.section_name == "Grid Images with border" && (
          <div className=" main-width gap-[15px]">
            {data.top_image && <div className="flex items-center justify-center md:px-[15px] lg:mt-[50px] relative">
              <Image src={check_Image(data.top_image)} width={600} height={300} alt={data.title} />

            </div>}

            <div className={`${data.top_image ? "lg:mt-[30px]" : "lg:mt-[50px]"} lg:pb-[30px] md:p-[15px_20px]`}>

              <h1 className="text-center uppercase lg:text-[34px] font-normal text-[#340C0C] md:text-[20px]">{data.title}</h1>
              <p className="text-center uppercase text-[18px] md:text-[16px] font-light text-[#684140]">{data.sub_title}</p>
            </div>

            <GridItem data={data} />
          </div>
        )}

        {data && data.length != 0 && data.section_name &&
          (data.section_name == "Testimonials Style 1" ||
            data.section_name == "Testimonials Style 2" ||
            data.section_name == "Testimonials Style 3" ||
            data.section_name == "Testimonials Style 4" ||
            data.section_name == "Testimonials Style 5" ||
            data.section_name == "Testimonials Style 6" ||
            data.section_name == "Testimonials Style 7") && (
            <div className="main-width md:bg-[#fff] md:p-[10px]">
              <Testimonial data={data} />
            </div>
          )}

        {data && data.length != 0 &&
          data.section_name && data.section_name == "Header Section" && (
            <div className=" bg-cover bg-no-repeat w-[100%] lg:py-[50px] md:p-[10px]" style={{ backgroundImage: `url('${check_Image(data.bg_image)}')`, }}>
              <div className="main-width lg:grid grid-cols-custom w-[100%] gap-[20px]">
                <div className="lg:mt-[52px]">
                  <h1 className="md:text-[20px] lg:text-[35px] font-bold primary_color mb-[15px]">{data.title} </h1>
                  <p className="text-[16px] text-[#212121] font-normal mb-[10px]"> {data.subtitle}</p>
                  <ul className="mb-[15px]">
                    {data && data.list1 && data.list1.length != 0 &&
                      data.list1.map((item, i) => {
                        return (
                          <li
                            key={i}
                            className="flex items-center justify-start list-none text-[16px] text-[#212121] font-normal pl-[10px] gap-[10px]"
                          >
                            <Image
                              src={check_Image(item.list_icon)}
                              width={10}
                              height={10}
                              alt="list_icon"
                              className="w-[10px] h-[10px]"
                            />
                            {item.listpoint}
                          </li>
                        );
                      })}
                  </ul>

                  <div className=" flex items-center">
                    <Link
                      href={
                        JSON.parse(data.btn).btn_redirect_url
                      }
                    >
                      <button className="primary_bg min-h-[48px] min-w-[140px] rounded-[5px] capitalize text-white font-semibold">
                        {JSON.parse(data.btn).btn_text}
                      </button>
                    </Link>

                    <Link
                      href={
                        JSON.parse(data.sub_btn)
                          .btn_redirect_url
                      }
                    >
                      <button className="ml-[10px]  bg-white rounded-[5px] primary_color p-[5px]">
                        {JSON.parse(data.sub_btn).btn_text}
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="w-[100%]">
                  <Image
                    src={check_Image(data.right_image)}
                    width={300}
                    height={300}
                    className="w-[100%]"
                    alt="right_image"
                  />
                </div>
              </div>
            </div>
          )}

        {data && data.length != 0 &&
          data.section_name && (data.section_name == "Left Content Right Image" || data.section_name == "Right Content Left Image" || data.section_name == "Left Image Right Side List Style One" || data.section_name == "Left Side List Style Two and Right Image" || data.section_name == "Center title with content and center Image" || data.section_name == "Left Content Right Image with Subtitle") && (
            <div className="main-width ">
              <SellerContent isMobile={isMobile} data={data} />
            </div>
          )}

        {data && data.length != 0 &&
          data.section_name && (data.section_name == "Full Bg with overlay Text" || data.section_name == "Full Bg with overlay Text Right Image") && (
            <SellerContent isMobile={isMobile} data={data} />
          )}

        {data && data.length != 0 &&
          data.section_name && data.section_name == "Card List with icon and title" && (
            <div className="main-width ">
              <div className="mb-[30px]">
                <h1 className="text-center md:text-[20px] text-[30px] primary_color font-semibold">
                  {data.title}
                </h1>
                <p className="text-center text-[16px] font-normal lg:my-[10px]">
                  {data.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-[5px]  lg:gap-[12px] px-[10px] ">
                {data &&
                  data.cardsectionmain &&
                  data.cardsectionmain.length != 0 &&
                  data.cardsectionmain.map((item, i) => {
                    return (
                      <div
                        key={i}
                        className=" flex flex-col p-[20px] items-center justify-center md:flex-[0_0_calc(50%_-_5px)] lg:flex-[0_0_calc(33.33%_-_12px)]  shadow-sm group rounded-md hover:bg-[#54b41f]"
                      >
                        <Image
                          src={check_Image(item.icon1)}
                          width={30}
                          height={30}
                          alt="icon1"
                          className="w-[60px] h-[60px] mb-[10px]"
                        />
                        <h1 className="line-clamp-3 text-[16px] text-[#212121] font-normal text-center group-hover:text-white">
                          {item.content}
                        </h1>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

        {data && data.length != 0 && data.section_name && data.section_name == "CTA" && (
          <div className="main-width ">
            <div className="primary_bg md:px-[15px] md:py-[20px] lg:py-[40px] flex md:flex-col md:gap-[5px] items-center md:justify-center lg:justify-evenly rounded-md ">
              <h1 className="md:text-[24px] lg:text-[35px] text-white font-bold ">
                {data.title}
              </h1>
              <button className=" min-h-[48px] min-w-[140px] rounded-[5px] capitalize bg-white primary_color font-semibold">
                {JSON.parse(data.btn).btn_text}
              </button>
            </div>
          </div>
        )}

        {data && data.section_name && data.section_name == "CTA Baner" && (
          <div className="main-width ">
            <div className="primary_bg md:px-[15px] md:py-[20px] lg:py-[40px] flex md:flex-col md:gap-[5px] items-center md:justify-center">
              {/* <h1 className="md:text-[24px] lg:text-[35px] text-white font-bold ">
                {data.title}
              </h1> */}
              <ImageLoader src={data.image} width={500} height={260} title={data.section_name} className="h-[260px] w-full object-cover your-element" style={"w-full h-full object-cover your-element"} />
              {/* <button className=" min-h-[48px] min-w-[140px] rounded-[5px] capitalize bg-white primary_color font-semibold">
                {JSON.parse(data.btn).btn_text}
              </button> */}
            </div>
          </div>
        )}

        {data && data.length != 0 && data.section_name &&
          (data.section_name == "Our Team 1" ||
            data.section_name == "Our Team 2" ||
            data.section_name == "Our Team 3" ||
            data.section_name == "Our Team 4" ||
            data.section_name == "Our Team 5" ||
            data.section_name == "Our Team 6" ||
            data.section_name == "Our Team 7" ||
            data.section_name == "Our Team 8") && (
            <div className="main-width ">
              <OurTeam data={data} isMobile={isMobile} />
            </div>
          )}

        {data && data.length != 0 && data.section_name && (data.section_name == "4 Column Card Image with link" || data.section_name == "Card Image with link" || data.section_name == "Left Image Right Card List Style Four") && (
          <div className="main-width">
            <CardList data={data} isMobile={isMobile} />
          </div>
        )}

        {data && data.length != 0 && data.section_name &&
          (data.section_name == "FAQ Style 1" ||
            data.section_name == "FAQ Style 2" ||
            data.section_name == "FAQ Style 3" ||
            data.section_name == "FAQ Style 4" ||
            data.section_name == "FAQ Style 5") && (
            <div
              className={`main-width flex ${data.section_name == "FAQ Style 1"
                ? "md:flex-col lg:flex-row-reverse"
                : data.section_name == "FAQ Style 2"
                  ? "md:flex-col lg:flex-row"
                  : data.section_name == "FAQ Style 3"
                    ? "flex-col gap-[10px] lg:px-[40px]"
                    : data.section_name == "FAQ Style 4"
                      ? "md:flex-col lg:flex-row"
                      : data.section_name == "FAQ Style 5"
                        ? "flex flex-col main-width lg:px-[40px]"
                        : ""
                } md:px-[10px]`}
            >
              <Faq data={data} isMobile={isMobile} />
            </div>
          )}

        {data &&
          data.length != 0 &&
          data.section_name &&
          (data.section_name == "Counters 1" ||
            data.section_name == "Counters 2" ||
            data.section_name == "Counters 3" ||
            data.section_name == "Counters 4" ||
            data.section_name == "Counters 5" ||
            data.section_name == "Counters 6") && (
            <Counters data={data} />
          )}

        {data &&
          data.length != 0 &&
          data.section_name &&
          (data.section_name == "Clients Style 1" ||
            data.section_name == "Clients Style 2") && (
            <Clients data={data} />
          )}

        {data &&
          data.length != 0 &&
          data.section_name &&
          (data.section_name == "Features Style 1" ||
            data.section_name == "Features Style 2" || data.section_name == "Features Style 3" || data.section_name == "Features Style 4" || data.section_name == "Features Style 5" || data.section_name == "Features Style 6") && (
            <Features data={data} />
          )}
        {data &&
          data.length != 0 &&
          data.section_name &&
          (data.section_name == "Grid with offset icons" || data.section_name == "Centered 2x2 grid" || data.section_name == "4x2 grid on brand" || data.section_name == "Simple three column" || data.section_name == "With feature grid list" || data.section_name == "Offset 2x2 grid") && (<GridList data={data} />)}

        {data &&
          data.length != 0 &&
          data.section_name && (data.section_name == "List Style 1" || data.section_name == "List Style 2" || data.section_name == "List Style 3" || data.section_name == "List Style 4" || data.section_name == "List Style 5" || data.section_name == "List Style 6") && <ListStyle data={data} />}

        {/* </div> */}

      </div>
    </>
  )


}
