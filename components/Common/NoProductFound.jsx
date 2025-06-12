import { useRouter } from 'next/router'
import Image from 'next/image'
import { check_Image } from '@/libs/api';

export default function NoProductFound({api_empty_icon, height, width, cssClass, empty_icon, heading, sub_heading, button, btnName, route}) {

   const router = useRouter();

   return (
    <>
    {/* <div className='flex items-center justify-center flex-col'> */}
     <div className={`${cssClass ? cssClass : ''} flex items-center justify-center main-width p-[25px_0_0_0] gap-[3px]`}>
      
       <div className='flex items-center justify-center h-[150px]'>
        {/* <Image className="h-[145px]" height={height ? height : 100} priority width={width ? width : 100} alt='search' src={api_empty_icon ? check_Image(api_empty_icon) : empty_icon} ></Image> */}
        <Image className="h-[145px]" height={height ? height : 100} width={width ? width : 100} alt='search' src={'/Pack.svg'} ></Image>
       </div>
       
       {heading && <p className={'text-[15px] font-semibold'}>{heading}</p>}
       {sub_heading && <p className={'text-[13px] font-medium gray_color'}>{sub_heading}</p>}

       {button && <button onClick={()=>{router.push(route)}} className='primary_btn h-[35px] p-[0_15px] text-[14px]'>{btnName}</button>}

     </div>
    {/* </div> */}

    </>
   )
}