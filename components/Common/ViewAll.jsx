import Image from 'next/image';
// import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { setFilter } from '@/redux/slice/homeFilter';
import { useRouter } from "next/router";

// const CategoryTabs = dynamic(() => import("@/components/Common/CategoryTabs"));

export default function ViewAll({ data, viewAll, categoryTab, categories, filterData, navigationLink }) {

    const dispatch = useDispatch();
    const router = useRouter();
    const navigatePage = (link, data) => {
        console.log("clickN")
        if (data.title === "Top Selling Items") {
            localStorage['sort_by'] = "sold_last_30_days:desc"
            // dispatch(setFilter({ 'sort_by': 'sold_last_30_days:desc' }))
            router.push(link)
        }
        else if (data.title === "Hot Deals") {
            // dispatch(setFilter({ 'hot_product': true }))
            localStorage['sort_by'] = "discount_percentage:desc"
            // dispatch(setFilter({ 'sort_by': 'sold_last_30_days:desc' }))
            router.push(link)
        } else {
            router.push(link)
        }
    }

    return (
        <>
            <div className="flex items-center mb-[10px] justify-between">
                {/* <h6 className={`text-[12px] font-medium text-center primary_color`}>{data.title}</h6> */}
                <h2 className="text-left text-[16px] lg:text-[24px] font-semibold lg:font-bold">{data.title ? data.title : data.section_name}</h2>

                {viewAll &&

                    <div onClick={() => { navigationLink ? navigatePage(navigationLink, data) : '#' }} className='flex items-center gap-[8px] border rounded-full px-3 lg:px-[10px] py-1 lg:py-[5px] cursor-pointer'>
                        <h6 className='text-[12px] lg:text-[15px] font-semibold lg:font-bold text-[#000]'>See More</h6>
                        <Image style={{ objectFit: 'contain' }} className='h-[16px] w-[16px]' height={15} width={15} alt='vantage' src={'/Arrow/roundArrow.png'}></Image>
                    </div>

                    //   <button
                    //     className={`md:text-[14px] md:font-semibold md:px-[10px]
                    //     lg:border lg:rounded-[5px] lg:py-[2px] lg:px-[7px] lg:text-[14px] lg:text-medium
                    //     primary_btn`}
                    //     >View All</button>

                }

                {/* {categoryTab && 
                        <CategoryTabs data={categories} filterData={(data)=> filterData(data)} /> 
                    } */}

            </div>
        </>
    )


}
