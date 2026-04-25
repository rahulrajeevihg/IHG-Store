import Image from "next/image"
import { check_Image } from '@/libs/api';
import Carousel from "react-multi-carousel";

const HorizontalSlider = ({ data }) => {

    const responsive = {
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items:  3,
            paritialVisibilityGutter: 60
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 3,
            paritialVisibilityGutter: 50
        },
        mobile: {
            breakpoint: { max: 464, min: 300 },
            items: 1,
            paritialVisibilityGutter: 60
        }
    }


    return (
        <>
            <div className="main-width md:bg-[#fff] md:p-[10px]">
                <div>
                    <h1>{data.title}</h1>
                    <p>{data.sub_title}</p>
                </div>
                <div className="flex">
                    <div className="flex-[0_0_calc(30%)]">
                        <Image src={check_Image(data.left_image)} width={300} height={300} alt={data.title} />
                    </div>
                    <div className="hor">
                        <Carousel
                            // ssr
                            // partialVisbile
                            // deviceType={deviceType}
                            autoPlay={true}
                            arrows={false}
                            autoPlaySpeed={2000}
                            // containerClass="container-with-dots"
                            // dotListClass="dots"
                            infinite
                            // pauseOnHover
                            responsive={responsive}
                            // shouldResetAutoplay
                            // showDots={(!isMobile || !none) ? true : false}
                            // renderDotsOutside={!isMobile ? false : true}
                            // sliderClass=""
                            slidesToSlide={1}
                            swipeable
                        > 
                        {data.data && data.data.length != 0 && data.data.map((item,i)=>{
                            return(
                                <div>
                                    <Image src={check_Image(item.image)} width={100} height={100} alt={item.item_title}/>
                                </div>
                            )
                        })}
                        
                        </Carousel>
                    </div>
                </div>
            </div>
        </>
    )
}

export default HorizontalSlider