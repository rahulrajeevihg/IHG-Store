import Image from "next/image"
import { check_Image } from '@/libs/api';
import Link from "next/link";
import dynamic from "next/dynamic";
const ImageLoader = dynamic(() => import("../ImageLoader"))
// import ImageLoader from "../ImageLoader";


const Autumn = ({ data }) => {
    // console.log(data, 'Autumn')
    return (
        <div className="flex md:flex-col rounded-b-[45px] overflow-hidden" style={{ backgroundColor: `${data.banner_color}` }}>
            <div className="flex-[0_0_calc(50%)] flex py-[50px] md:py-[20px] md:flex-col items-center justify-center">
                <div className="lg:flex-[0_0_calc(50%)]">
                    <div className="w-full flex items-center justify-center mb-[10px]">
                        <Image className="your-element" src={check_Image(data.logo)} width={120} height={120} alt="glamhourlogo" />
                    </div>
                    <Image src={check_Image(data.extra_logo)} className="mix-blend-multiply your-element" width={200} height={200} alt="leaflogo" />
                </div>
                <div className="lg:flex-[0_0_calc(50%)] md:p-[15px] md:text-center">
                    <h1 className="text-[32px] md:text-[20px] uppercase font-medium text-[#340C0C] leading-[25px] tracking-[9px]">{data.title}</h1>
                    <p className="text-[14px] text-[#948484] leading-[20px] md:my-[15px] font-light my-[30px]">{data.content}</p>

                    {data.buttons && JSON.parse(data.buttons) && <Link href={JSON.parse(data.buttons).btn_redirect_url ? JSON.parse(data.buttons).btn_redirect_url : '#'}>
                        <p className="border font-medium border-[#340C0C] uppercase text-[#340C0C] tracking-[2px] bg-white rounded-[5px] h-[40px] md:m-[0_auto] md:w-[50%] flex items-center justify-center  p-[10px_20px] w-[55%] text-center leading-[12px]">{JSON.parse(data.buttons).btn_text}</p>
                    </Link>}
                </div>
            </div>
            <div className="lg:flex-[0_0_calc(50%)] relative autmn md:hidden">
                <ImageLoader src={check_Image(data.right_image)}  title="glamhourlogo" style="w-full h-full your-element  md:m-[0_auto]" />
                {/* <Image src={check_Image(data.right_image)} width={50} height={50} alt="glamhourlogo" className="w-[100%] lg:absolute bottom-0 right-0" /> */}
            </div>
        </div>
    )
}

export default Autumn