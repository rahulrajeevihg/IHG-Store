import React from 'react'
import ViewAll from './ViewAll'
import Image from 'next/image'
import { check_Image } from '@/libs/api'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { setFilter } from '@/redux/slice/homeFilter'


const Brands = ({ customCss = "", data }) => {
    const router = useRouter()

    // console.log("brand", data);

    const dispatch = useDispatch()

    const brandsData = [
        {
            "logo": "/Home/brands/image (5).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (6).png",
            "no_of_product": 200,
            "cate": "Category"
        },
        {
            "logo": "/Home/brands/image (7).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (8).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (9).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (10).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (11).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (12).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (13).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (14).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (15).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (16).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (17).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (18).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (19).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (20).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (21).png",
            "no_of_product": 200,
            "cate": "Product"
        },
        {
            "logo": "/Home/brands/image (22).png",
            "no_of_product": 200,
            "cate": "Product"
        },
    ]

    const changeBrand = (item) => {
        router.push('/list?brand='+item)
        // console.log("log", item)
        // dispatch(setFilter({ brand: [item] }));
    }

    return (
        <div className={`main-width lg:max-w-[1350px] lg:py-10 md:p-[10px] ${customCss}`}>
            <div className=''>
                <ViewAll data={{ title: "Shop By Brands" }} viewAll={true} navigationLink={'/brands'} />

                <div className='py-3 '>
                    <div className='grid grid-cols-3 tab:grid-cols-4 lg:grid-cols-6 gap-3'>
                        {
                            data.map((item, i) => (
                                <div key={i} className='border border-[#E9E9E9] rounded-xl cursor-pointer relative min-h-[100px]' onClick={() => changeBrand(item.name)}>
                                    <div className='py-4 px-5'>
                                       {item.image && <Image src={check_Image(item.image)} alt={item.name} width={100} height={50} className='w-full h-[50px] object-contain' /> }
                                       {!item.image && <h1 className='text-center min-h-[50px] flex justify-center items-center text-[20px] md:text-[13px] font-medium'>{item.name}</h1>}
                                    </div>

                                    <div className='bg-[#F0F0F0] py-1 px-3 absolute bottom-0 w-full rounded-[0_0_10px_10px]'>
                                        <p className='text-[#565656] text-xs lg:text-sm'>{item.item_count} + {"Products"}</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Brands