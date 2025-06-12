import Image from 'next/image';
import { check_Image } from '@/libs/api';
export default function HomePageBuilder({ data, imgClass, isMobile, bgImg }) {
    const divStyle = {
        backgroundImage: `url(${check_Image(bgImg)})`
    };
    return (
        <>
        {(data.section_name == "App Download" && !isMobile) &&
            <div style={divStyle}>
                <div className='inline-table main-width columns-2'>
                    <div className='text-center table-cell align-middle'>
                        <h2 className='font-bold mb-[10px] text-[22px]'>{data.title}</h2>
                        <p className='pl-[40px] text-[45px] font-semibold'>{data.description}</p>
                        <div className='flex justify-center'>
                            <Image alt={''} src={check_Image(data.bt1_bg)} height={300} width={1500} className={`h-[70px] w-[220px] pr-[10px] cursor-pointer`} />
                            {data.btn2_bg &&
                                <Image alt={''} src={check_Image(data.btn2_bg)} height={300} width={1500} className={`h-[70px] w-[220px] cursor-pointer`} />}
                        </div>
                    </div>
                    <div>
                        <Image alt={''} src={check_Image(data.right_image)} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} />
                    </div>

                </div>
            </div>
        }

        </>
    )
}