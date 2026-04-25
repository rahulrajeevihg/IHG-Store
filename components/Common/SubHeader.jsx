import { check_Image } from "@/libs/api";
import Image from "next/image";
import Link from 'next/link'

export default function SubHeader({data,title,imageBanner,page_id}){
    return(
        // background:`url('${data?check_Image((data && data.sub_header_bg_img)?data.sub_header_bg_img:data.bt1_bg): imageBanner ? imageBanner:'/contact-usbanner.webp'}')
     <div className="w-[100%] relative h-[180px] object-cover mb-[20px]" style={{background:imageBanner ? `url('${imageBanner}')` : (data && data.sub_header_bg_img || data.bt1_bg) ? `url(${check_Image(data.sub_header_bg_img || data.bt1_bg)})` : (data && data.sub_header_bg_color ? data.sub_header_bg_color : '#f1f1f1')}}>
        <div className={`flex flex-col gap-1 justify-center items-center h-full`}>
        <h1 className={`text-[${(data && data.text_color) ? data.text_color : '#fff'}] text-[32px] uppercase font-bold text-center`}>{(data && data.sub_header_title)?data.sub_header_title : (data && data.breadcrumb_title) ? data.breadcrumb_title:title ? title :page_id?page_id:"Contact Us"}</h1>
        <div className={`text-[${(data && data.text_color) ? data.text_color : '#fff'}] cursor-pointer text-center flex justify-center items-center gap-2`}>
            <Link href={'/'} className={`text-[${(data && data.text_color) ? data.text_color : '#fff'}]`}>{(data && data.home) ? data.home : "Home "} </Link>
            
            {(data && data.icon) ?
             <span> <Image src={check_Image(data.icon)} width={20} height={20}  className="font-bold  w-[10px] h-[10px]"/></span> 
             : 
             <span className={`text-[${(data && data.text_color) ? data.text_color : '#fff'}] pl-[6px] text-[15px]`}>{' >'}</span>
            }
             
            <span className={`text-[${(data && data.text_color) ? data.text_color : '#fff'}]`}>{(data && data.sub_header_title) ? data.sub_header_title:(data && data.breadcrumb_title)?data.breadcrumb_title:title? title:page_id?page_id:"Contact us"}</span>
            </div>
        </div>
      </div>
    )
}