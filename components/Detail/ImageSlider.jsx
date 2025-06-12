import Carousel from "react-multi-carousel";
import Image from 'next/image';
// import { check_Image } from '@/libs/common';
import { useRouter } from 'next/router';
import { check_Image } from '@/libs/api'

export default function ImageSlider({ data, height, width, perView }) {
    const router = useRouter();
    const responsive = {
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: perView ? perView : 3,
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
    // const [isMobile, setIsMobile] = useState()
    // useEffect(() => {
    //     // console.log('data',data);
    //     checkIsMobile();
    //     window.addEventListener('resize', checkIsMobile)
    //     return () => {
    //         window.removeEventListener('resize', checkIsMobile);
    //     };
    // }, [])

    // const checkIsMobile = async () => {
    //     let isMobile = await checkMobile();
    //     setIsMobile(isMobile);
    // }

    const videoLink = (link, type) => {
        let url = '';
        if(type == 'Youtube'){
          url ='https://www.youtube.com/embed/' + link 
        }else if(type == 'Vimeo'){
          url = 'https://player.vimeo.com/video/' + link
        }else{
          url = check_Image(link)
        }

        return url
    }


    return (
        <>
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
                slidesToSlide={perView ? perView : 1}
                swipeable
            >

                {(data && data.length != 0) && data.map((res, index) => {
                    return (
                        // <div key={index} className={``} >
                        //     <Image src={check_Image(res.detail_image)} className={`${height} ${width} object-contain`} height={150} width={300} alt={"image"} />
                        // </div>
                        <>
                            {(res.video_type && (res.video_type == 'Youtube' || res.video_type == 'Vimeo' || res.video_type == 'Other')) ? 
                                <div>
                                  <LoadVideo type={'Detail'} res={res} cssClass={`${height} ${width} object-contain`} index={index} videoLink={videoLink}/> 
                                </div>
                            :
                                <a href={check_Image(res.detail_image)}>
                                 <Image className={`${height} ${width} object-contain`} src={check_Image(res.detail_image || res.image)} height={200} width={300} alt={'image'} />
                                </a>
                            }
                        </>
                    )
                })}
            </Carousel >

        </>
    )
}

const LoadVideo = ({res, videoLink, index , cssClass, type}) =>{
    return(
     <>
     {(res.video_type == 'Youtube' ) ? 
        <iframe className={`${cssClass ? cssClass: ''}`}
        src={videoLink(res.video_link,res.video_type) }
        id={index}
        frameBorder="2"
        loading="lazy"
        ></iframe>
     :
       <>
        {res.video_type == 'Other' ?
         <video controls className={`${cssClass ? cssClass: ''}`}>
            <source src={videoLink(res.video_link,res.video_type)} type="video/mp4" />
         </video>
         :
         <iframe className={`${cssClass ? cssClass: ''}`}
         src={videoLink(res.video_link,res.video_type)}
         id={index}
         frameBorder="2"
         loading="lazy"
         ></iframe>
        }
       </>
 
     }
    </>
    )
 }