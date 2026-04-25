import { check_Image, get_product_details, typesense_search_items } from '@/libs/api';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import Rodal from 'rodal';
import Tabs from '../Common/Tabs';
import MobileHeader from '../Headers/mobileHeader/MobileHeader';
import Image from 'next/image';
import ImageSlider from './ImageSlider';
import ProductBox from '../Product/ProductBox';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setProductDetail } from '@/redux/slice/productDetail';
// import 'rodal/lib/rodal.css';
const ProductDetail = ({ hide, visible, productData }) => {

    const product = useSelector((state) => state.ProductDetails.data)
    const [relatedProductData, setRelatedData] = useState([])
    const [details, setDetails] = useState({});
    const [loader, setLoder] = useState(true);
    let [data, setData] = useState({})
    const [isMobile, setIsMobile] = useState(false)

    const dispatch = useDispatch();

    useEffect(() => {
        if (product && product.item_code) {
            // console.log(data, "data ProductDetail")
            data = product
            setData({ ...data })
            loadLightGallery();
            getDetail();
            setLoder(false)
        }

        if (productData) {
            dispatch(setProductDetail(productData));
        }
    }, [product, productData])

    // console.log('pro', product)
    const loadLightGallery = () => {
        setTimeout(() => {
            const $lightGallery = $("#lightgallery");
            if ($lightGallery && $lightGallery.lightGallery()) {
                $lightGallery.lightGallery();

                return () => {
                    $lightGallery.data("lightGallery").destroy(true);
                };
            }
        }, 1000);
    };

    // const getPrRoute = () => {
    //     let productRoute = ""
    //     if (router.query && router.query.detail) {
    //         let detail = router.query.detail
    //         detail.map((r, i) => {
    //             productRoute = productRoute + r + ((detail.length != (i + 1)) ? '/' : '')
    //         })
    //     }
    //     return productRoute
    // }

    // const ddata = {
    //     "related_products": {
    //         "Bought Together": [
                
    //         ],
    //         "Must Use": [
    //             "DRG-24X07.R.A.2M",
    //             "LP.3535.SP.A.3M",
    //         ],
    //         "Add On": [
    //             "DRG-24X07.R.A.2M",
    //             "LP.3535.SP.A.3M",
    //         ],
    //         "category_list": [
    //             "qe2e",
    //             "Linear Profile - 7575 Kit",
    //             "ZL.1715.S.A.2M",
    //             "DRG-24X07.R.A.2M",
    //             "LP.3535.SP.A.3M",
    //             "ALU-A-2-5050-6M",
    //             "ALU-T-2-2525-6M",
    //             "ALU-S-1.8-48",
    //             "FROS-GLS-10-262-1398",
    //             "FROS-GLS-10-215-1215"
    //         ]
    //     }
    // }

    const getDetail = async () => {
        const resp = await get_product_details(data.item_code);
        const details = (await resp.message) || {};

        if (details && details.stock && details.stock.length > 0) {
            setDetails(details);
        } else {
            setDetails([]);
        }

        if (details.related_products) {
            let relatedSections = {};

            const relatedKeys = {
                bought_together: "Bought Together",
                category_list: "category_list",
                must_use: "Must Use",
                add_on: "Add On",
            };

            const keysToFetch = Object.values(relatedKeys);

            let excludedItemCodes = new Set();
            ["Bought Together", "Must Use", "Add On"].forEach((key) => {
                if (details.related_products[key]) {
                    details.related_products[key].forEach((code) => excludedItemCodes.add(code));
                }
            });

            keysToFetch.forEach((key) => {
                let values = details.related_products[key] || [];

                if (key === "category_list") {
                    values = values.filter((code) => !excludedItemCodes.has(code));
                }

                const filterQuery = values.map((code) => `item_code:="${code}"`).join(" || ");
                relatedSections[key] = { query: filterQuery, data: [] };
            });


            const fetchData = async () => {
                for (const key in relatedSections) {
                    if (!relatedSections[key].query) continue; // Skip empty queries

                    const queryParams = new URLSearchParams({
                        q: "*",
                        query_by: "item_name,item_description,brand",
                        query_by_weights: "1,2,3",
                        filter_by: relatedSections[key].query
                    });

                    const data = await typesense_search_items(queryParams);
                    // console.log(`Data for ${key}:`, data.hits);

                    relatedSections[key].data = data.hits || [];
                }

                setRelatedData(relatedSections);
            };

            fetchData();
        } else {
            setRelatedData({});
        }





    };
    // console.log(relatedProductData, 'rela')


    const filterData = (arr1, arr2) => {
        const arr = []

        for (let i = 0; i < arr1.length; i++) {
            for (let j = 0; j < arr2.length; j++) {
                if (arr1[i] == arr2[j]['document']['item_code']) {
                    arr.push(arr2[j])
                }
            }
        }

        // console.log('arr', arr1, arr2, arr)
        return arr
    }


    useEffect(() => {
        const handleResize = () => {
            const mobileWidth = 768; // Adjust this value to define your mobile width threshold
            if (window.innerWidth <= mobileWidth) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }

        };

        handleResize(); // Initial check on component mount

        window.addEventListener('resize', handleResize); // Event listener for window resize


        return () => {
            window.removeEventListener('resize', handleResize); // Clean up the event listener
        };
    }, []);

    const openDetail = (value) => {
        if (value && value.document) {
            // console.log(value, "value")
            // dispatch(setProductDetail(value.document));
            data = value.document
            setData({ ...data })
            getDetail();
            const ele = document.getElementById("container")
            ele.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" })
        }
    }


    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Escape') {
                // Trigger event for 'Esc' key
                hide(undefined)
            }

            // if (event.key === 'Backspace') {
            //     // Trigger event for 'Backspace' key
            //     console.log('Backspace key pressed');
            // }
        };

        // Attach the event listener
        window.addEventListener('keydown', handleKeyPress);

        // Cleanup the event listener on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, []);

    return (
        <>
            <Head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/lightgallery/1.6.12/css/lightgallery.min.css"
                />
                <script
                    defer
                    src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min.js"
                ></script>
                <script
                    defer
                    src="https://cdn.jsdelivr.net/npm/lightgallery@1.6.12/dist/js/lightgallery.min.js"
                ></script>
            </Head>

            <div className={`product_detail`}>
                <Rodal visible={visible} animation='fade' onClose={() => { hide(undefined) }}>
                    <div className='h-[calc(100vh_-_110px)] md:h-screen overflow-auto md:pb-20'>
                        <div className="">
                            {loader ? (
                                <Skeleton />
                            ) : (
                                <>
                                    {data && Object.keys(data).length != 0 && (
                                        <>


                                            <div id='container' className='main-width fade-in lg:w-[90%] max-w-[1300px]'>
                                                {
                                                    <MobileHeader
                                                        back_btn={true}
                                                        title={data.item}
                                                        detailModal={hide}
                                                        empty_div={false}
                                                        search={true}
                                                        share={false}
                                                    />
                                                }

                                                <div
                                                    className="md:hidden flex items-center gap-[5px] cursor-pointer w-fit pt-3"
                                                    onClick={() => hide('close')}
                                                // style={{ boxShadow: "4px 0px 15px 4px #0000000f" }}
                                                >
                                                    <Image
                                                        className="size-[14px]"
                                                        src={"/rightArrow.svg"}
                                                        height={15}
                                                        width={15}
                                                        alt="back"
                                                    ></Image>
                                                    <h6 className="capitalize text-[14px]">Back to List</h6>
                                                </div>

                                                <div
                                                    className={`lg:flex lg:my-[15px] gap-[10px] justify-between `}
                                                >
                                                    <div className="flex lg:flex-[0_0_calc(50%_-_10px)] fade-in lg:sticky lg:top-0 lg:h-[450px] border p-3">
                                                        <div className="w-full">
                                                            {isMobile ? (
                                                                <>
                                                                    {data.images && data.images.length != 0 ? (
                                                                        <ImageSlider
                                                                            height={"h-[200px]"}
                                                                            width={"w-full"}
                                                                            data={data.images}
                                                                            perView={1}
                                                                        />
                                                                    ) : (
                                                                        <Image
                                                                            className={"w-full fade-in h-[170px] object-contain"}
                                                                            height={200}
                                                                            width={300}
                                                                            alt={data.item}
                                                                            src={check_Image(data.website_image_url)}
                                                                        />
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div id="lightgallery" className={`py-[5px]`}>

                                                                    {data.images && data.images.length != 0 ? (
                                                                        data.images.map((res, index) => {
                                                                            return (
                                                                                <>
                                                                                    {(
                                                                                        <a
                                                                                            key={index}
                                                                                            href={check_Image(
                                                                                                res.detail_image
                                                                                                    ? res.detail_image
                                                                                                    : res.image
                                                                                            )}
                                                                                        >
                                                                                            <span
                                                                                                className={`${res.is_primary == 0 ? "hidden" : ""
                                                                                                    }`}
                                                                                            >
                                                                                                <Image
                                                                                                    className={`w-full h-[401px] object-contain ${res.is_primary == 0 ? "hidden" : ""
                                                                                                        }`}
                                                                                                    src={check_Image(
                                                                                                        res.detail_image || res.image
                                                                                                    )}
                                                                                                    height={200}
                                                                                                    width={300}
                                                                                                    alt={res.title}
                                                                                                    onError={(e) => {
                                                                                                        e.target.onerror = null;
                                                                                                        e.target.src = "/empty-states.png";
                                                                                                    }}
                                                                                                />
                                                                                            </span>
                                                                                        </a>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <a href={check_Image(data.website_image_url)}>
                                                                            <Image
                                                                                className={"h-[400px] mx-auto object-contain"}
                                                                                height={200}
                                                                                width={300}
                                                                                alt={data.item}
                                                                                src={check_Image(data.website_image_url)}
                                                                            />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {(data.offer_rate) ? <h6 className='bg-[#009f58] text-[#fff] p-[3px_13px] absolute top-0 left-0 rounded-br-md  text-[12px]'>{parseInt(((data.rate - data.offer_rate) / data.rate) * 100)}<span className='px-[0px] text-[#fff] text-[12px]'>% (AED {parseFloat(data.rate - data.offer_rate).toFixed(2)}) off</span> </h6> : <></>}

                                                    </div>

                                                    <div className="flex-[0_0_calc(50%_-_10px)] lg:px-[20px] md:p-[20px_10px_10px] md:rounded-[20px_20px_0_0]">
                                                        {!isMobile ? (
                                                            <>
                                                                <span className='text-lg text-[#1F1F1F] pb-[5px]'>{data.item_code}</span>
                                                                <h3 className="text-[20px] md:text-[16px] py-[5px] font-bold capitalize">
                                                                    {data.item_name}
                                                                </h3>

                                                                {data.item_description && (
                                                                    <p
                                                                        className={`text-[14px] gray_color font-[400] py-[5px] `}
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: data.item_description,
                                                                        }}
                                                                    />
                                                                )}

                                                                <div className="flex items-center gap-3">

                                                                    <div
                                                                        className={`py-[5px]`}
                                                                    >
                                                                        <h3 className={`text-[16px] primary_color inline-flex gap-[6px] items-center font-semibold openSens `}>AED {data.offer_rate > 0 ? (<p className='text-green-600 font-semibold text-[16px]'>{parseFloat(data.offer_rate).toFixed(2)} <span className=' line-through font-medium text-gray-700 ml-[2px] text-[16px]'>{parseFloat(data.rate).toFixed(2)}</span></p>) : (<p className='font-semibold text-[16px]'>{parseFloat(data.rate).toFixed(2)}</p>)}</h3>

                                                                    </div>
                                                                </div>

                                                                {data.stock && data.stock > 0 ? (
                                                                    <p className="text-base text-[#1A9A62] lg:text-[16px] md:text-[13px] font-semibold mt-[5px]">
                                                                        IN STOCK ({data.stock} NOS)
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-base lg:text-[16px] md:text-[13px] font-semibold mt-[5px] text-[#d11111]">
                                                                        OUT OF STOCK
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex justify-between gap-5">
                                                                    <div>
                                                                        <span className='text-[#1F1F1F] text-sm pb-[5px]'>{data.item_code}</span>
                                                                        <h3 className="text-[18px] py-[4px] font-semibold line-clamp-2 capitalize">
                                                                            {data.item_name}
                                                                        </h3>
                                                                        {data.stock && data.stock > 0 ? (
                                                                            <p className="text-base text-[#1A9A62] font-semibold py-[4px]">
                                                                                IN STOCK ({data.stock} NOS)
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-base font-semibold text-[#d11111] py-[4px]">
                                                                                OUT OF STOCK
                                                                            </p>
                                                                        )}

                                                                    </div>
                                                                </div>

                                                                <p
                                                                    className={`text-[11px] gray_color font-[400] py-[4px] `}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: data.item_description,
                                                                    }}
                                                                />

                                                                <div className="flex flex-row mt-[4px] items-center justify-between gap-3">
                                                                    {(data.offer_rate) ? <h6 className='bg-[#009f58] text-[#fff] p-[3px_10px] text-[10px]'>{parseInt((data.rate - data.offer_rate) / data.rate * 100)}<span className='px-[0px] text-[#fff] text-[10px]'>% (AED {parseFloat(data.rate - data.offer_rate).toFixed(2)}) off</span> </h6> : <></>}
                                                                    <div
                                                                        className={` font-semibold  openSens`}
                                                                    >
                                                                        <h3 className={` primary_color inline-flex items-center gap-[6px] float-left font-semibold openSens `}>AED {data.offer_rate > 0 ? (<p className='text-green-600 font-semibold'>{parseFloat(data.offer_rate).toFixed(2)} <span className=' line-through font-medium text-gray-700 ml-[2px]'>{parseFloat(data.rate).toFixed(2)}</span></p>) : (<p className='font-semibold text-[14px]'>{parseFloat(data.rate).toFixed(2)}</p>)}</h3>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {data ||
                                                            (details && details.stock && details.stock.length != 0) ? (
                                                            <>
                                                                <Tabs
                                                                    stockDetails={details.stock}
                                                                    productDetails={data}
                                                                />
                                                            </>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </div>
                                                </div>


                                                {relatedProductData && Object.keys(relatedProductData).length > 0 && (() => {
                                                    const hasBoughtTogether = relatedProductData["Bought Together"]?.data?.length > 0;
                                                    const hasMustUse = relatedProductData["Must Use"]?.data?.length > 0;
                                                    const hasAddOn = relatedProductData["Add On"]?.data?.length > 0;
                                                    const hasCategoryList = relatedProductData["category_list"]?.data?.length > 0;

                                                    const filteredData = Object.entries(relatedProductData).filter(([key, value]) => {
                                                        if (!value.data.length) return false; // Skip if no data

                                                        // Always show Add On & Must Use
                                                        if (key === "Add On" || key === "Must Use") return true;

                                                        // Show Bought Together if it exists
                                                        if (key === "Bought Together") return true;

                                                        // Show category_list **only if** Bought Together is NOT present
                                                        if (key === "category_list" && !hasBoughtTogether) return true;

                                                        return false;
                                                    });

                                                    if (filteredData.length === 0) return null;

                                                    return (
                                                        <>
                                                            {filteredData.map(([key, value]) => (
                                                                <div key={key} className="m-[15px_0] md:px-[10px]">
                                                                    <h2 className="text-[16px] lg:text-[18px] mb-[10px] font-semibold text-[#000]">
                                                                        {key === "Bought Together" || key === "category_list" ? "Related Products"
                                                                            : key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                                                    </h2>

                                                                    <ProductBox
                                                                        openDetail={openDetail}
                                                                        productList={value.data}
                                                                        scroll_button={isMobile}
                                                                        rowStyle={true}
                                                                        scroll_id={`related_products_${key}`}
                                                                        rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </>
                                                    );
                                                })()}






                                                {data.recently_viewed_products &&
                                                    data.recently_viewed_products.length != 0 &&
                                                    webSettings &&
                                                    webSettings.enable_recently_viewed_products == 1 && (
                                                        <>
                                                            <div className="m-[15px_0]">
                                                                <h3 className="text-[15px] font-[500] mb-[8px]">
                                                                    Recently viewed Products
                                                                </h3>
                                                                <ProductBox
                                                                    openDetail={openDetail}
                                                                    productList={data.recently_viewed_products}
                                                                    rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                    scroll_button={true}
                                                                    scroll_id="recently_viewed"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                {data.products_purchased_together &&
                                                    data.products_purchased_together.length != 0 && (
                                                        <>
                                                            <div className="m-[15px_0]">
                                                                <h3 className="text-[15px] font-[500] mb-[8px]">
                                                                    Products Purchased Together
                                                                </h3>
                                                                <ProductBox
                                                                    openDetail={openDetail}
                                                                    productList={data.products_purchased_together}
                                                                    rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                    scroll_button={true}
                                                                    scroll_id="you_may_like"
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                {data.you_may_like && data.you_may_like.length != 0 && (
                                                    <>
                                                        <div className="m-[15px_0]">
                                                            <h3 className="text-[15px] font-[500] mb-[8px]">
                                                                You May also like this
                                                            </h3>
                                                            <ProductBox
                                                                openDetail={openDetail}
                                                                productList={data.you_may_like}
                                                                rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                scroll_button={true}
                                                                scroll_id="you_may_like"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {data.cross_selling_products &&
                                                    data.cross_selling_products.length != 0 && (
                                                        <>
                                                            <div className="m-[15px_0]">
                                                                <h3 className="text-[15px] font-[500] mb-[8px]">
                                                                    Cross Selling Products
                                                                </h3>
                                                                <ProductBox
                                                                    openDetail={openDetail}
                                                                    productList={data.cross_selling_products}
                                                                    rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                    scroll_button={true}
                                                                    scroll_id="cross_selling_products"
                                                                />
                                                            </div>
                                                        </>
                                                    )}


                                                {data.best_seller_category &&
                                                    data.best_seller_category.length != 0 && (
                                                        <>
                                                            <div className="m-[15px_0]">
                                                                <h3 className="text-[15px] font-[500] mb-[8px]">
                                                                    Beat Seller Category
                                                                </h3>
                                                                <RelatedCategory
                                                                    productList={data.best_seller_category}
                                                                    rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                                    scroll_button={true}
                                                                    scroll_id="cross_selling_products"
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                            </div>

                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Rodal>
            </div>
        </>
    )
}

export default ProductDetail


const Skeleton = () => {
    return (
        <>
            <div className="container lg:py-0 md:p-[10px] flex lg:gap-[30px] md:flex-col animate-pulse lg:m-[15px_0] ">
                <div className="lg:flex-[0_0_calc(40%_-_10px)] flex">
                    <div className="md:hidden">
                        <div className="h-[90px] w-[90px] bg-slate-300 rounded"></div>
                        <div className="h-[90px] my-[10px] w-[90px] bg-slate-300 rounded"></div>
                        <div className="h-[90px] w-[90px] bg-slate-300 rounded"></div>
                        <div className="h-[90px] mt-[10px] w-[90px] bg-slate-300 rounded"></div>
                    </div>
                    <div className="lg:ml-[10px] md:w-full md:mb-[10px] h-[400px] bg-slate-300 w-[calc(100%_-_10px)] rounded"></div>
                </div>

                <div className="lg:flex-[0_0_calc(60%_-_10px)]">
                    <div className="h-[30px] w-[40%] bg-slate-300 rounded"></div>
                    <div className="h-[30px] w-[75%] my-[15px] bg-slate-300 rounded"></div>
                    <div className="h-[30px] w-[20%] mb-[15px] bg-slate-300 rounded"></div>
                    <div className="h-[30px] w-[50%] mb-[15px] bg-slate-300 rounded"></div>
                    <div className="h-[30px] w-[20%] mb-[15px] bg-slate-300 rounded"></div>

                    <div className="md:hidden flex mb-[15px] gap-[10px]">
                        <div className="h-[40px] w-[150px] bg-slate-300 rounded"></div>
                        <div className="h-[40px] w-[60px] bg-slate-300 rounded"></div>
                        <div className="h-[40px] w-[60px] bg-slate-300 rounded"></div>
                    </div>

                    <div className="h-[30px] mb-[15px] w-[40%] bg-slate-300 rounded"></div>

                    <div className="h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded"></div>
                    <div className="h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded"></div>
                    <div className="h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded"></div>
                    <div className="h-[25px] mb-[15px] w-[80%] bg-slate-300 rounded"></div>
                </div>
            </div>
        </>
    );
};