import Image from 'next/image';
import { check_Image } from '@/libs/api';
import Link from 'next/link'

export default function CategoryList({ data, title, imgClass, isMobile }) {
    
        return (
            <>
                <div className='flex items-center overflow-auto scrollbarHide gap-[10px]'>
                    {data.slice(0,4).map((res, index) => {
                        return (
                            <>
                             <Link href={res.route ? res.route : '#'} className='cursor pointer categoryHover lg:flex-[0_0_calc(25%_-_8px)] md:flex-[0_0_calc(70%_-_10px)] relative'>
                                <Image alt={''} src={check_Image(res.category_image)} quality={100} height={300} width={300} className={`${imgClass ? imgClass : ''} w-full `} />
                                <p className='w-full absolute bottom-[15px] text-[18px] font-medium text-[#fff] text-center'>{res.category_name}</p>
                             </Link>
                            </>
                        )
                    })}
                </div>
            </>
        )

    
}
