import ViewAll from './ViewAll'
import Image from 'next/image'

const ChooseCategory = ({ customCss }) => {

    const chooseData = [
        {
            "logo": "/Home/choose/1.png",
            "title": "Popular Product",
            "cate": "Product",
            "stock": 341,
            "bg": "#BF5AE0"
        },
        {
            "logo": "/Home/choose/2.png",
            "title": "Most Wanted",
            "cate": "Product",
            "stock": 341,
            "bg": "#06BEB6"
        },
        {
            "logo": "/Home/choose/3.png",
            "title": "Bestseller",
            "cate": "Product",
            "stock": 341,
            "bg": "#FE8C00"
        },
        {
            "logo": "/Home/choose/4.png",
            "title": "Best Shop 2022",
            "cate": "Product",
            "stock": 341,
            "bg": "#F857A6"
        },
    ]




    return (
        <>
            <div className={`bg-[#F0F0F0] py-12 md:px-[10px] `}>
                <div className={`main-width  pb-[10px] ${customCss}`}>
                    <ViewAll data={{ title: "Now easier to choose" }} viewAll={true} />

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {
                            chooseData.map((res, i) => (
                                <div className={`rounded-md py-4 px-5`} style={{ background: res.bg }}>
                                    <div className="flex gap-3 lg:gap-5 items-center">
                                        <Image src={res.logo} width={16} height={24} className="w-7 lg:w-10 h-7 lg:h-10" />
                                        <p className="text-white font-bold text-base lg:text-lg">{res.title}</p>
                                    </div>

                                    <div className="mt-4 lg:mt-8 flex justify-between">
                                        <p className="text-white font-medium">{res.cate}</p>
                                        <p className="text-white font-medium text-sm">{res.stock} Stock</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

export default ChooseCategory