import React from 'react'
import Image from 'next/image';
import { check_Image } from '@/libs/api';
import ImageLoader from '@/components/ImageLoader'

export default function Banner({ data, css, imgClass }) {
    return (
        <>
            <div className={`${data.section_name == "Banner 1 Column" ? '' : 'main-width' } ${data.section_name == "Banner 2 Column" ? '' : 'items-center'} flex lg:justify-center  gap-[10px] scrollbarHide md:overflow-scroll md:px-[10px]`}>
                <div onClick={() => data.banner1_route ? banner1_route : null} className={ css}>
                    <Image alt={''} src={check_Image(data.banner1)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} ${data.section_name == "Banner 2 Column" ? 'h-[400px] md:h-[165px] object-cover' : ''} w-full `} />
                    {/* <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner1} title={data.item ? data.item : 's'} /> */}
                </div>
                {
                    (data.banner2 && <div onClick={() => data.banner2_route ? banner2_route : null} className={css}>
                        {/* <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner2} title={data.item ? data.item : 's'} /> */}
                        <Image alt={''} src={check_Image(data.banner2)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} ${data.section_name == "Banner 2 Column" ? 'h-[400px] md:h-[165px] object-cover' : ''} w-full `} />
                    </div>)
                }
                {
                    (data.banner3 && <div onClick={() => data.banner3_route ? banner3_route : null} className={css}>
                        {/* <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner3} title={data.item ? data.item : 's'} /> */}
                        <Image alt={''} src={check_Image(data.banner3)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} />
                    </div>)
                }
                {
                    (data.banner4 && <div onClick={() => data.banner4_route ? banner4_route : null} className={css}>
                        {/* <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner4} title={data.item ? data.item : 's'} /> */}
                        <Image alt={''} src={check_Image(data.banner4)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} />
                    </div>)
                }
                {
                    (data.banner5 && <div onClick={() => data.banner5_route ? banner5_route : null} className={css}>
                        {/* <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner5} title={data.item ? data.item : 's'} /> */}
                        <Image alt={''} src={check_Image(data.banner5)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} />
                    </div>)
                }
                {
                    (data.banner6 && <div onClick={() => data.banner6_route ? banner6_route : null} className={css}>
                        <ImageLoader style={`${imgClass ? imgClass : ''} w-full`} src={data.banner6} title={data.item ? data.item : 's'} />
                        {/* <Image alt={''} src={check_Image(data.banner6)} quality={100} height={300} width={1500} className={`${imgClass ? imgClass : ''} w-full `} /> */}
                    </div>)
                }
            </div>
        </>
    )
}
