import { check_Image } from '@/libs/api'
import Image from 'next/image'

const InfiniteSlide = ({ data }) => {
    return (
        <>
            <div className='marquee gap-[20px] md:gap-[15px]'>
                {data.map(res => {
                    return (
                        <div className='flex marquee-item items-center gap-[10px]' key={res.title}>
                            <div>
                                <Image src={check_Image(res.icon)} height={40} width={40} alt='' />
                            </div>
                            <h6 className=''>{res.title}</h6>
                        </div>
                    )

                })}

                {data.map(res => {
                    return (
                        <div className='flex marquee-item items-center gap-[10px]' key={res.title}>
                            <div>
                                <Image src={check_Image(res.icon)} height={40} width={40} alt='' />
                            </div>
                            <h6 className=''>{res.title}</h6>
                        </div>
                    )

                })}

                {data.map(res => {
                    return (
                        <div className='flex marquee-item items-center gap-[10px]' key={res.title}>
                            <div>
                                <Image src={check_Image(res.icon)} height={40} width={40} alt='' />
                            </div>
                            <h6 className=''>{res.title}</h6>
                        </div>
                    )

                })}


            </div>
        </>
    )
}

export default InfiniteSlide
