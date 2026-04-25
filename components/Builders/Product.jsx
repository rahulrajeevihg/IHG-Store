import { check_Image } from "@/libs/api"
import Image from "next/image"
import { useRouter } from "next/router"

export default function Product({ data }) {

    const router = useRouter()
    const formatter = new Intl.NumberFormat('en-US', {
        style: "currency",
        currency: "INR"
    })

    return (
        <>
            {(data.section_name == "Category Products 1 - 3 List" && data.data.length > 0) && (
                <div className="bg-white">
                    <div className="mt-[10px] py-[10px]">
                        <div className="flex justify-between items-center px-2">
                            <div className="flex gap-3">
                                <Image src={check_Image(data.title_image)} width={40} height={40} className="object-contain" />
                                <div>
                                    <h3 className="text-[16px] text-[#090808] font-semibold">{data.title}</h3>
                                    <p className="text-[14px] text-[#181b29] font-normal">{data.subtitle}</p>
                                </div>
                            </div>
                            {/* <button onClick={() => router.push('/pr/' + data.route)} className="primary_btn px-[10px] py-[4px] text-white text-[10px] rounded-[4px]">View All</button> */}
                            <button onClick={() => router.push('/pr/' + data.route)} className='flex items-center gap-[8px] border rounded-full px-3 lg:px-4 py-1 lg:py-2 cursor-pointer'>
                                <h6 className='text-[12px] lg:text-[16px] font-bold text-[#000]'>See More</h6>
                                <Image style={{ objectFit: 'contain' }} className='h-[17px] w-[17px]' height={25} width={25} alt='vantage' src={'/Arrow/roundArrow.png'}></Image>
                            </button>
                        </div>
                    </div>
                    <div className=" border grid grid-cols-2 ">
                        {(data && data.data && data.data.length != 0) &&
                            data.data.map((item, i) => {
                                return (
                                    <div className={`${i == 0 ? 'row-span-2 border-r  ' : i == 1 ? " border-b    " : "pb-3"}  flex flex-col justify-center items-center`}>
                                        <div className={`${i == 0 ? 'flex items-center ' : "h-[90px] flex items-center justify-center"} `}>
                                            <Image onClick={() => router.push('/pr/' + item.route)} src={item.product_image} width={30} height={30} className={`${i == 0 ? 'h-[80px] w-full object-contain ' : " w-[100px] h-[50px] object-contain"} `} />
                                        </div>
                                        <h6 className="line-clamp-2 w-[140px] text-[14px] text-center " onClick={() => router.push('/pr/' + item.route)}>{item.item}</h6>
                                        <p className="font-sans text-[14px] text-[#ed1c24] font-bold ">{formatter.format(item.price)}</p>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>)}

            {
                data.section_name == "Category Listing Mobile" && (
                    <div style={{ backgroundColor: `${data.background_color}` }} className={`px-2  pb-2 my-1`}>
                        <div className=" flex justify-between items-center py-2">
                            <h1 className="text-white text-[16px] font-medium">{data.title}</h1>
                            <div>
                                <span onClick={() => router.push('/pr/' + data.route)} className=" px-[10px] py-[4px] bg-white text-[11px] rounded-[4px]">{data.view_all_text}</span>
                            </div>
                        </div>
                        <div className="  bg-white grid grid-cols-2">
                            {(data && data.data && data.data.length != 0) &&
                                data.data.map((list, i) => {
                                    return (
                                        <div className="border flex flex-col items-center justify-center py-[10px]  ">
                                            <div className="w-[160px] h-[160px]">
                                                <Image onClick={() => router.push('/pr/' + list.route)} src={check_Image(list.image)} width={100} height={100} className="w-full h-full object-contain" />
                                            </div>
                                            <h6 onClick={() => router.push('/pr/' + list.route)} className="text-[11px] text-center line-clamp-2 w-[150px]">{list.item}</h6>
                                        </div>

                                    )
                                })}

                        </div>
                    </div>
                )
            }

        </>
    )
}