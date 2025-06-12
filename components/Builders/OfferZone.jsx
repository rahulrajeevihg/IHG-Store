import Image from "next/image"
import { useRouter } from "next/router";
// import ImageLoader from "../ImageLoader";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"), { ssr: false });

const OfferZone = ({ data, isMobile }) => {
    // console.log(data,'OfferZone')
    const router = useRouter()
    return (
        <>
            <div className="flex relative">
                {!isMobile && <div className="flex-[0_0_calc(30%)] md:flex-[0_0_calc(40%_-_0px)] relative group group1 overflow-hidden">
                    <ImageLoader src={data.left_image} width={500} height={350} title={data.left_title} className="h-[380px] w-[325px] object-cover your-element" style={"w-full h-full transition-[transform_0.5s_ease] your-element group-hover:transform group-hover:rotate-0 group-hover:cursor-zoom-in group-hover:scale-[1.2]"} />
                    {/* <Image src={check_Image(data.left_image)} width={100} height={100} className="w-[100%] transition-[transform_0.5s_ease] your-element group-hover:transform group-hover:rotate-0 group-hover:cursor-zoom-in group-hover:scale-[1.2]" /> */}
                    <div className="absolute transition-[opacity_0.3s_ease] opacity-0 group-hover:opacity-[1] top-0 left-0 right-0 bottom-0 bg-[#0000001c] w-[100%] h-[100%]"></div>
                    <div className="absolute transition-[top_0.3s_ease] !duration-700 opacity-0 group-hover:opacity-[1] group-hover:top-0  flex flex-col gap-[20px]  items-center pb-[30px]  justify-end  top-[100%] left-0 w-[100%] h-[100%]">
                        <h1 className="text-white transition-[opacity_0.3s_ease] group-hover:opacity-1 text-[32px] font-semibold md:text-[20px] md:text-center tracking-[2px]">{data.left_title}</h1>
                        <h1 className="text-white transition-[opacity_0.3s_ease] group-hover:opacity-1 text-[14px] w-[80%] mx-auto font-normal tracking-[2px]">{data.left_content}</h1>
                        <div onClick={() => data.url ? router.push(data.url) : null} className="h-[40px] cursor-pointer w-[40px] rounded-[50%] rotate-180  flex items-center justify-center arrow-circle" >
                            <Image src={"/Arrow.svg"} width={15} height={15} alt="arrow" />
                        </div>
                    </div>
                </div>}
                <div className={`flex-[0_0_calc(70%)] md:flex-[0_0_calc(100%_-_0px)] gap-[20px] flex items-center lg:justify-center lg:px-[30px] overflow-auto scrollbarHide`} style={{ backgroundColor: `${data.right_bg}` }}>
                    {data.list && data.list.length != 0 && data.list.map((item, i) => {
                        return (
                            <div key={item.title + i} className="flex-[0_0_calc(33.33%_-_20px)] md:flex-[0_0_calc(80%_-_0px)] relative group group1 overflow-hidden">
                                {/* <div className="  lg:absolute bottom-0 left-0 group-hover:bottom-[50%] transition-[all_0.5s_linear] group-hover:left-[50%] group-hover:-translate-x-[50%] group-hover:-translate-y-[50%]">
                                    <Image src={"/Line.svg"} width={500} height={500} alt="line"/>
                                    <div class="arrow">
                                        <div class="line"></div>
                                        <div class="point"></div>
                                    </div>
                                </div> */}
                                <ImageLoader src={item.image} width={500} height={350} title={item.title} className="h-[380px] w-[325px] object-cover your-element" style={"w-[100%] h-[350px] object-cover your-element"} />

                                {/* <Image src={check_Image(item.image)} width={100} height={100} alt={item.title} className="w-[100%] h-[350px] object-cover your-element" /> */}
                                <div className="lg:absolute flex flex-col gap-[20px]  items-center pb-[30px] justify-end bg-[#0000001c] top-0 bottom-0  right-0 w-[100%] h-[100%]">
                                    <h1 className="text-white md:text-center text-[20px] font-semibold tracking-[2px]">{item.title}</h1>
                                    <div className="flex text-white gap-2 cursor-pointer" onClick={() => item.url ? router.push(item.url) : null}>
                                        <h1 className="text-white">{item.span_title}</h1>
                                        <Image src={"/Arrow.svg"} width={12} height={12} alt="arrow" className=" rotate-180 " />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

export default OfferZone