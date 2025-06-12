import React from 'react'
import Image from 'next/image';
import { check_Image } from '@/libs/api';
export default function CategoryList({ data, title, imgClass, isMobile }) {
    {
        return (
            <>
                <div className='flex items-center overflow-auto m-[10px] mb-[0px] gap-[10px]'>
                    {data.map((res, index) => {
                        return (
                            <>
                                <div key={index} className='w-[30%]'>
                                    <div className='w-[90px] items-center h-[90px] flex p-[12px] py-[0px] rounded-[50%] bg-[#F0F4EA] my-[0px] mx-auto border_color'>
                                        <Image alt={''} src={check_Image(isMobile ? res.category_image : null)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} />
                                    </div>
                                    <p className='text-[13px] mt-[0px] text-center text-[#063435]'>{res.category_name}</p>
                                </div>
                            </>
                        )
                    })}
                </div>
            </>
        )

    }
}
