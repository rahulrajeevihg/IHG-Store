import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
    check_Image,
    seo_Image,
    getCurrentUrl,
    delete_cart_items,
    insert_cart_items,
    get_cart_items,
    checkMobile,
    typesense_search_items,
    get_product_details,
} from "@/libs/api";
import Image from "next/image";
import dynamic from "next/dynamic";
const ProductBox = dynamic(() => import("@/components/Product/ProductBox"));
const ImageSlider = dynamic(() => import("@/components/Detail/ImageSlider"));
const MobileHeader = dynamic(() =>
    import("@/components/Headers/mobileHeader/MobileHeader")
);
const RelatedCategory = dynamic(() =>
    import("@/components/Builders/RelatedCategory")
);
const Select = dynamic(() => import("react-select"));
const RootLayout = dynamic(() => import("@/layouts/RootLayout"));
// import CardButton from '@/components/Product/CardButton';
// import ProductBox from '@/components/Product/ProductBox'
// import Accordions from '@/components/Common/Accordions'
// import Modals from '@/components/Detail/Modals'
// import ImageSlider from '@/components/Detail/ImageSlider'
// import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader'
// import RelatedCategory from '@/components/Builders/RelatedCategory'
// import Select from 'react-select';
// import RootLayout from '@/layouts/RootLayout'
import { useSelector, useDispatch } from "react-redux";
import { setCartItems } from "@/redux/slice/cartSettings";
import Head from "next/head";
import { toast } from "react-toastify";
import ViewAll from "@/components/Common/ViewAll";
import Tabs from "@/components/Common/Tabs";

const Detail = () => {
    // const Detail = ({ productDetail, detail }) => {
    const router = useRouter();
    const [details, setDetails] = useState({});
    const [productDetail, setProductDetail] = useState()

    useEffect(() => {
        // let breadcrumb = [{ name: "Home", route: "/" }];

        // if (
        //     productDetail &&
        //     productDetail.item_categories &&
        //     productDetail.item_categories.category_name
        // ) {
        //     breadcrumb.push({
        //         name: productDetail.item_categories.category_name,
        //         route: productDetail.item_categories.route,
        //     });
        // }

        // breadcrumb.push({ name: productDetail.item });
        // productDetail["breadcrumb"] = breadcrumb;
        const detail = localStorage['product_detail']
        if (detail && JSON.parse(detail) && (JSON.parse(detail).item_code) === getPrRoute()) {
            // console.log("deta", JSON.parse(detail))
            setProductDetail({ ...JSON.parse(detail) })
            // console.log('deta', JSON.parse(detail))
        } else {
            getProductDetail()
        }
        getDetail();

        loadLightGallery();

        // return (()=> {
        //     if(detail && JSON.parse(detail)){
        //         localStorage.removeItem('product_detail')
        //     }
        // })

    }, [router.query]);

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

    const getPrRoute = () => {
        let productRoute = ""
        if (router.query && router.query.detail) {
            let detail = router.query.detail
            detail.map((r, i) => {
                productRoute = productRoute + r + ((detail.length != (i + 1)) ? '/' : '')
            })
        }
        return productRoute
    }

    const getProductDetail = async () => {
        const queryParams = new URLSearchParams({
            q: "*",
            // query_by: "item_name,item_description,brand",
            // page: "1",
            // per_page: "1",
            // query_by_weights: "1,2,3",
            filter_by: `item_code:${getPrRoute()}`,
        });

        const data = await typesense_search_items(queryParams);

        let productDetail = data.hits && data.hits.length > 0 ? data.hits[0].document : {};
        if (productDetail) {
            setProductDetail(productDetail)
        }
    }

    const [relatedProductData, setRelatedData] = useState([])

    const getDetail = async () => {
        const resp = await get_product_details(getPrRoute());
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
                must_use: "Must Use",
                add_on: "Add On",
                category_list: "category_list"
            };
        
            const keysToFetch = Object.values(relatedKeys);
        
            keysToFetch.forEach((key) => {
                const values = details.related_products[key] || [];
                const filterQuery = values.map((code) => `item_code:="${code}"`).join(" || ");
                relatedSections[key] = { query: filterQuery, data: [] };
            });
        
            // console.log("Initial relatedSections:", relatedSections);
        
            const fetchData = async () => {
                for (const key in relatedSections) {
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
        
                // console.log("Final relatedSections:", relatedSections);
                setRelatedData(relatedSections);
            };
        
            fetchData();
        } else {
            setRelatedData({});
        }
        








        // console.log(relatedProductData, 'rela')
        // console.log('relatedSections', relatedProductData)
        // const resp = await get_product_details(router.query.detail);
        // const details = await resp.message || []
    };


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



    return (
        <RootLayout>
            <Head>
                <title>{productDetail?.meta_title}</title>
                <meta name="description" content={productDetail?.meta_description} />
                <meta property="og:type" content={"Blog"} />
                <meta property="og:title" content={productDetail?.meta_title} />
                <meta
                    key="og_description"
                    property="og:description"
                    content={productDetail?.meta_description}
                />
                <meta
                    property="og:image"
                    content={seo_Image(productDetail?.meta_image)}
                ></meta>
                <meta property="og:url" content={getCurrentUrl(router.asPath)}></meta>
                <meta
                    name="twitter:image"
                    content={seo_Image(productDetail?.meta_image)}
                ></meta>
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

            <div className="fade-in min-h-screen">
                {productDetail && (
                    <DetailPage
                        productDetail={productDetail}
                        toast={toast}
                        details={details}
                        relatedProductData={relatedProductData}
                    />
                )}
            </div>
        </RootLayout>
    );
};

// export default function Detail({metaData, productDetail}) {

const DetailPage = ({ productDetail, toast, details, relatedProductData }) => {
    let [data, setData] = useState();
    let [additionalInfo, setAdditionalInfo] = useState({});
    let [sample, setSample] = useState(1);
    const [imageIndex, setIndexImage] = useState(-1);
    const [varActive, setVarActive] = useState(0);
    const [loader, setLoader] = useState(true);
    const [variantStockMsg, setVariantStockMsg] = useState();
    let [wishList, setWishlist] = useState();
    const [accordionData, setAccordionData] = useState([]);
    const cartItems = useSelector((state) => state.cartSettings.cartItems);
    const cartValue = useSelector((state) => state.cartSettings.cartValue);
    const webSettings = useSelector((state) => state.webSettings.websiteSettings);
    const wishlistItems = useSelector(
        (state) => state.cartSettings.wishlistItems
    );
    const dispatch = useDispatch();
    const router = useRouter();
    let cardref = useRef();
    let [apiCall, setApicall] = useState(true);
    let [pageLoading, setPageLoading] = useState(false);

    // console.log("product", productDetail)
    useEffect(() => {
        if (typeof window != "undefined") {
            setApicall(true);
            setLoader(true);
            setData({ ...productDetail });
            setLoader(false);
            get_product_details();
        }
    }, [router.query, productDetail]);

    useEffect(() => {
        const handleScroll = () => {
            const cardTop = cardref.current.offsetTop;
            const scrollPosition = window.scrollY + window.innerHeight;

            if (scrollPosition > cardTop && apiCall && data) {
                setPageLoading(true);
                apiCall = false;
                setApicall(apiCall);
                // console.log('API called!');
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };



    }, [apiCall, data, details,]);


    const [relatedData, setRelatedData] = useState([])
    useEffect(() => {
        // console.log("rel", relatedProductData)
        setRelatedData(relatedProductData)
    }, [relatedProductData])

    //   console.log(data,'data')
    // console.log("dedata", relatedData);

    const productQty = (data) => {
        if (data) {
            if (cartItems && cartItems.length != 0) {
                for (let i = 0; i < cartItems.length; i++) {
                    if (
                        data["has_variants"] == 1 &&
                        data["attribute_id"] == cartItems[i]["attribute_ids"] &&
                        data["business"] == cartItems[i]["business"]
                    ) {
                        data["attribute_id"] = cartItems[i]["attribute_ids"];
                        data["attribute"] = cartItems[i]["attribute"];
                        // data['price'] = cartItems[i]['price']
                        // data['old_price'] = cartItems[i]['old_price']
                        data["quantity"] = cartItems[i]["quantity"];
                        data["count"] = cartItems[i]["quantity"];
                        data["cart_id"] = cartItems[i]["cart_id"];
                        data["business"] = cartItems[i]["business"];
                        // setData(data)
                        break;
                    } else if (
                        data["has_variants"] == 0 &&
                        data["name"] == cartItems[i]["product"] &&
                        data["business"] == cartItems[i]["business"]
                    ) {
                        // data['price'] = cartItems[i]['price']
                        // data['old_price'] = cartItems[i]['old_price']
                        data["quantity"] = cartItems[i]["quantity"];
                        data["count"] = cartItems[i]["quantity"];
                        data["cart_id"] = cartItems[i]["cart_id"];
                        data["business"] = cartItems[i]["business"];
                        // setData(data)
                        break;
                    } else {
                        data["quantity"] = 0;
                        data["count"] = 0;
                        // setData(data)
                    }
                }
            } else {
                data["quantity"] = 0;
                data["count"] = 0;
            }
        }
    };


    useMemo(() => {
        if (webSettings) {
            let datas = [
                { title: "Ratings & Reviews", content: productDetail["reviews"] },
            ];
            if (
                webSettings &&
                webSettings.enable_question_and_answers &&
                webSettings.enable_question_and_answers == 1
            ) {
                datas.unshift({
                    title: "Questions",
                    content: productDetail["question_answers"],
                });
            }
            productDetail["return_description"]
                ? datas.unshift({
                    title: "Return Policy",
                    content: productDetail["return_description"],
                })
                : null;
            productDetail["full_description"]
                ? datas.unshift({
                    title: "Product Detail",
                    content: productDetail["full_description"],
                })
                : null;
            productDetail["highlights"] && productDetail["highlights"].length != 0
                ? datas.unshift({
                    title: "Highlights",
                    content: productDetail["highlights"],
                })
                : null;
            productDetail["product_specification"] &&
                productDetail["product_specification"].length != 0
                ? datas.unshift({
                    title: "Product Specification",
                    content: productDetail["product_specification"],
                })
                : null;
            productDetail["description"]
                ? datas.unshift({
                    title: "Description",
                    content: productDetail["description"],
                })
                : null;
            setAccordionData(datas);
        }
    }, [webSettings]);

    const get_product_details = async () => {
        if (productDetail.status && productDetail.status == "Failed") {
            router.push("/404");
        } else {
            // let productDetail = resp.message
            if (productDetail) {
                if (
                    productDetail.vendor_price_list &&
                    productDetail.vendor_price_list.length != 0 &&
                    productDetail.vendor_price_list[0]
                ) {
                    if (productDetail.has_variants == 1) {
                        if (productDetail.vendor_price_list[0].default_variant) {
                            let val = productDetail.vendor_price_list[0].variants.findIndex(
                                (res) => {
                                    return (
                                        res.attribute_id ==
                                        productDetail.vendor_price_list[0].default_variant
                                            .attribute_id
                                    );
                                }
                            );
                            setVarActive(val);
                            productDetail["price"] =
                                productDetail.vendor_price_list[0].variants[val].product_price;
                            productDetail["old_price"] =
                                productDetail.vendor_price_list[0].variants[val].old_price;
                            productDetail["discount_percentage"] =
                                productDetail.vendor_price_list[0].variants[
                                    val
                                ].discount_percentage;
                            productDetail["attribute"] =
                                productDetail.vendor_price_list[0].variants[val].variant_text;
                            productDetail["attribute_id"] =
                                productDetail.vendor_price_list[0].variants[val].attribute_id;
                            productDetail["business"] =
                                productDetail.vendor_price_list[0].business;
                            productDetail["stock"] =
                                productDetail.vendor_price_list[0].variants[val].stock;
                            productDetail["count"] = 0;
                        }

                        // console.log(productDetail,'productDetail')

                        if (
                            productDetail.product_video &&
                            productDetail.product_video.length != 0
                        ) {
                            productDetail.images = [
                                ...productDetail.images,
                                ...productDetail.product_video,
                            ];
                        }

                        productDetail.mainImages = productDetail.images;
                        productDetail["count"] = 0;
                        productDetail["business"] =
                            productDetail.vendor_price_list[0].business;
                        checkVariantInfo(productDetail);
                    } else {
                        productDetail["count"] = 0;
                        productDetail["price"] =
                            productDetail.vendor_price_list[0].product_price;
                        productDetail["old_price"] =
                            productDetail.vendor_price_list[0].old_price;
                        productDetail["discount_percentage"] =
                            productDetail.vendor_price_list[0].discount_percentage;
                        productDetail["business"] =
                            productDetail.vendor_price_list[0].business;
                        productDetail["stock"] = productDetail.vendor_price_list[0].stock;
                        productQty(productDetail);
                    }
                } else {
                    productQty(productDetail);
                }
                // data = productDetail
                data = { ...productDetail, ...additionalInfo };
                setData(data);
                // setData((data)=> data = data)
                // setDataSample(data)
                // productQty(data)
                // let obj = resp.message['full_description'] ? { title: 'Product Detail', content: resp.message['full_description'] };

                setTimeout(() => {
                    setIndexImage(imageIndex + 1);
                }, 200);
            }

            setLoader(false);
            // loadLightGallery();
        }
    };

    useMemo(() => {
        if (cartValue && cartValue.name) {
            get_product_details();
        }
    }, [cartValue]);

    const changeMainImage = (index, value) => {
        value.images.map((res, i) => {
            if (index == i) {
                value.selected_image = res.detail_image;
                res.is_primary = 1;
            } else {
                res.is_primary = 0;
            }
        });
        setIndexImage(imageIndex + 1);
    };

    const changeVariants = (res, index) => {
        data["price"] = res.product_price;
        data["old_price"] = res.old_price;
        data["discount_percentage"] = res.discount_percentage;
        data["stock"] = res.stock;
        data["attribute"] = res.variant_text;
        data["attribute_id"] = res.attribute_id;
        // setData(data)
        productQty(data);
        setVarActive(index);
    };

    const changeVendor = (res, index) => {
        // console.log(res)
        for (let i = 0; i < data.vendor_price_list.length; i++) {
            if (i == index) {
                let temp = data.vendor_price_list[0];
                data.vendor_price_list[0] = data.vendor_price_list[index];
                data.vendor_price_list[index] = temp;
                if (
                    data.vendor_price_list[0].variants &&
                    data.vendor_price_list[0].variants.length != 0 &&
                    data.has_variants == 1
                ) {
                    let val = data.vendor_price_list[0].variants.findIndex((res) => {
                        return (
                            res.attribute_id ==
                            data.vendor_price_list[0].default_variant.attribute_id
                        );
                    });
                    data["business"] = data.vendor_price_list[0].business;
                    setVarActive(val);
                    changeVariants(data.vendor_price_list[0].variants[val], val);
                } else {
                    data["business"] = data.vendor_price_list[0].business;
                    changeVariants(data.vendor_price_list[0], 0);
                }
            }
        }

        // setData(data)
        setIndexImage(imageIndex + 1);
    };

    async function addRemovewish(item) {
        if (item.wish_count == 1) {
            let param = {
                name: item.wish_id,
                customer_id: localStorage["customerRefId"],
            };
            const resp = await delete_cart_items(param);
            if (resp.message.status == "success") {
                get_cart_item();
            }
        } else {
            insert_cart(item);
        }
    }

    async function insert_cart(value) {
        let param = {
            item_code: value.name,
            qty: 1,
            qty_type: "",
            cart_type: "Wishlist",
            customer: localStorage["customerRefId"],
            attribute: value.attribute ? value.attribute : "",
            attribute_id: value.attribute_id ? value.attribute_id : "",
            business: value.business ? value.business : "",
        };

        const resp = await insert_cart_items(param);

        // setTimeout(()=>{setLoader(-1)},500)
        if (resp.message && resp.message.marketplace_items) {
            if (localStorage["customerRefId"] != "undefined") {
                localStorage["customerRefId"] = resp.message.customer;
            }
            get_cart_item();
        } else if (resp.message && resp.message.status == "Failed") {
            toast.error(resp.message.message);
            //   setAlertMsg({message:resp.message.message});
        }
    }

    async function get_cart_item() {
        let res = await get_cart_items();
        if (
            res &&
            res.message &&
            res.message.status &&
            res.message.status == "success"
        ) {
            dispatch(setCartItems(res.message));
        }
    }

    useMemo(() => {
        if (data) {
            checkWishlist(data);
        }
    }, [wishlistItems, data]);

    function checkWishlist(data) {
        // if (data && wishlistItems && wishlistItems.length != 0) {
        //     let value = wishlistItems.find(r => { return (r.product == data.name && r.is_free_item != 1) })
        //     wishList = {}
        //     wishList['name'] = data.name
        //     wishList['business'] = data.business
        //     if (value) {
        //         wishList['wish_count'] = value.quantity;
        //         wishList['wish_id'] = value.name;
        //     } else {
        //         wishList['wish_count'] = 0;
        //         wishList['wish_id'] = '';
        //     }
        //     setWishlist(wishList);
        //     setSample(sample + 1)
        // }else{
        //     wishList = {}
        //     wishList['name'] = data.name
        //     wishList['business'] = data.business
        //     wishList['wish_count'] = 0;
        //     wishList['wish_id'] = '';
        //     setWishlist(wishList);
        //     setSample(sample + 1)
        // }

        let wishList;
        if (data && wishlistItems && wishlistItems.length != 0) {
            let value;
            for (let i = 0; i < wishlistItems.length; i++) {
                if (data.has_variants == 1) {
                    if (data.attribute_id == wishlistItems[i].attribute_ids) {
                        value = wishlistItems[i];
                    }
                } else {
                    if (data.name == wishlistItems[i]["product"]) {
                        value = wishlistItems[i];
                    }
                }
            }
            // let value = wishlistItems.find(r => { return (((data.has_variants == 1 && data.attribute_id == r.attribute_id) r.product == data.name) && r.is_free_item != 1) })
            wishList = {};
            wishList["name"] = data.name;
            wishList["business"] = data.business;
            if (value) {
                wishList["wish_count"] = value.quantity;
                wishList["wish_id"] = value.name;
                wishList["attribute_id"] = value.attribute_ids;
                wishList["attribute"] = value.attribute_description;
            } else {
                wishList["wish_count"] = 0;
                wishList["wish_id"] = "";
                wishList["attribute_id"] = data.attribute_id;
                wishList["attribute"] = data.attribute;
            }
            setWishlist(wishList);
            setSample(sample + 1);
        } else {
            wishList = {};
            wishList["name"] = data.name;
            wishList["business"] = data.business;
            wishList["wish_count"] = 0;
            wishList["wish_id"] = "";
            wishList["attribute_id"] = data.attribute_id;
            wishList["attribute"] = data.attribute;
            setWishlist(wishList);
            setSample(sample + 1);
        }
    }

    const [isMobile, setIsMobile] = useState();
    useEffect(() => {
        checkIsMobile();
        window.addEventListener("resize", checkIsMobile);
        return () => {
            window.removeEventListener("resize", checkIsMobile);
        };
    }, []);

    const checkIsMobile = async () => {
        let isMobile = await checkMobile();
        setIsMobile(isMobile);
    };

    function checkVariantInfo(productDetail) {
        let ids = "";
        let selected_attribute = "";
        productDetail["product_attributes"].map((res) => {
            res.options.map((data) => {
                if (data.is_pre_selected == 1) {
                    ids += data.name + "\n";
                    selected_attribute +=
                        ' <div class="attribute"><span class="attr-title">' +
                        res.attribute +
                        "</span> : <span>" +
                        data.option_value +
                        "</span> </div>";
                }
            });
        });

        productDetail["attribute"] =
            '<div class="cart-attributes">' + selected_attribute + "</div>";
        productDetail["attribute_id"] = ids;

        checkWishlist(productDetail);
        // setData(data);
        // console.log('data',productDetail)
        productQty(productDetail);
    }

    const videoLink = (link, type) => {
        let url = "";
        if (type == "Youtube") {
            url = "https://www.youtube.com/embed/" + link;
        } else if (type == "Vimeo") {
            url = "https://player.vimeo.com/video/" + link;
        } else {
            url = check_Image(link);
        }

        return url;
    };

    const setDataAValue = (value) => {
        setData(value);
        setSample(sample + 1);
    };

    // const checkData = {
    //     "Bought Together": { data: [] },
    //     "Must Use": { data: [] },
    //     "Add On": { data: [{ id: 3, name: "Product C" }] },
    //     "category_list": { data: [{ id: 3, name: "Product C" }] }
    // };

    // const hasBoughtTogether = checkData["Bought Together"]?.data?.length > 0;
    // const hasMustUse = checkData["Must Use"]?.data?.length > 0;
    // const hasAddOn = checkData["Add On"]?.data?.length > 0;
    // const hasCategoryList = checkData["category_list"]?.data?.length > 0;

    // console.log("hasBoughtTogether:", hasBoughtTogether);
    // console.log("hasMustUse:", hasMustUse);
    // console.log("hasAddOn:", hasAddOn);
    // console.log("hasCategoryList:", hasCategoryList);

    // const filteredData = Object.entries(checkData).filter(([key, value]) => {
    //     if (!value.data.length) return false; 
    //     if (key === "category_list" && (hasBoughtTogether || hasMustUse || hasAddOn)) return false;
    //     return true;
    // });

    // console.log("Filtered Data:", filteredData);



    // console.log('pr', data)

    return (
        <>
            <div ref={cardref} className="main-width fade-in lg:w-[90%] max-w-[1300px]">
                {loader ? (
                    <Skeleton />
                ) : (
                    <>
                        {data && Object.keys(data).length != 0 && (
                            <>
                                {
                                    <MobileHeader
                                        back_btn={true}
                                        title={data.item}
                                        empty_div={false}
                                        search={true}
                                        share={false}
                                    />
                                }

                                {/* {(data && data.breadcrumb &&  data.breadcrumb.length != 0) ? <div className={`md:hidden flex items-center container p-[10px_0_0_0] gap-[7px]`}>
        { data.breadcrumb.map((res, index) => {
         return (
            <div className='flex items-center gap-[7px]' key={index}>
                <h6 onClick={() => { (((index + 1) != data.breadcrumb.length) && res.route) ? router.push('/' + res.route) : null }} className=" cursor-pointer capitalize text-[14px] hover:text-[red]" >{res.name}</h6>
                {data.breadcrumb.length == (index + 1) ? <></> : <div className='flex items-center justify-center'><Image height={7} priority width={7} alt='search' src={'/forwardIcon.svg'} className="opacity-50"></Image></div>}
            </div>
         )
        })}
       </div> : <></>} */}

                                <div
                                    className="md:hidden pt-3 flex items-center gap-[5px] w-fit cursor-pointer"
                                    onClick={() => router.push('/list')}
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
                                    className={`lg:flex lg:m-[15px_0] gap-[10px] justify-between `}
                                >
                                    <div className="flex lg:flex-[0_0_calc(50%_-_10px)] fade-in lg:sticky lg:top-[150px] lg:h-[450px] border p-3">
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
                                                    {/* {console.log("Images", data.images)} */}
                                                    {data.images && data.images.length != 0 ? (
                                                        data.images.map((res, index) => {
                                                            return (
                                                                <>
                                                                    {res.video_type &&
                                                                        (res.video_type == "Youtube" ||
                                                                            res.video_type == "Vimeo" ||
                                                                            res.video_type == "Other") ? (
                                                                        <a key={index}>
                                                                            <LoadVideo
                                                                                type={"Detail"}
                                                                                res={res}
                                                                                cssClass={"w-full h-[400px]"}
                                                                                index={index}
                                                                                videoLink={videoLink}
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <a
                                                                            key={index}
                                                                            href={check_Image(
                                                                                res.detail_image
                                                                                    ? res.detail_image
                                                                                    : res.image
                                                                            )}
                                                                        >
                                                                            {/* <span className={`${res.is_primary == 0 ? 'hidden' : ''}`}><ImageLoader height={200} width={300} style={`w-full h-[400px] object-contain `} src={res.detail_image} title={data.item ? data.item : 's'}  ></ImageLoader></span> */}
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
                                        {/* {(data.discount_percentage != 0 && !isMobile) && <h6 className='absolute md:hidden right-[8px] top-[8px] additional_bg text-[#fff] p-[2px_8px] rounded-[10px] text-[12px]'>{data.discount_percentage}<span className='px-[0px] text-[#fff] text-[12px]'>% Off</span> </h6>} */}
                                        {false && (
                                            <div className="md:hidden absolute top-4 right-[-3px] flex">
                                                <Image
                                                    src="/vector.png"
                                                    height={37}
                                                    width={20}
                                                    alt="vector"
                                                />
                                                <p className=" text-white text-lg py-1 pr-2 bg-[#44C46F]">
                                                    Best Seller
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-[0_0_calc(50%_-_10px)] lg:px-[20px] md:p-[20px_10px_10px] md:rounded-[20px_20px_0_0]">
                                        {!isMobile ? (
                                            <>
                                                {/* <h6 className='text-[12px] font-semibold primary_color capitalize'>{data.centre}</h6> */}
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
                                                        {/* {data.centre && <h6 className='text-[14px] font-semibold primary_color capitalize'>{data.centre}</h6>} */}
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
                                                        {/* {data.stock && <p>{data.stock}</p>} */}
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
                                                {/* <Accordions items={accordionData} product={data} setData={(val)=>{setDataAValue(val)}} /> */}
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


                                {relatedData && Object.keys(relatedData).length > 0 && (() => {
                                    const hasBoughtTogether = relatedData["Bought Together"]?.data?.length > 0;
                                    const hasMustUse = relatedData["Must Use"]?.data?.length > 0;
                                    const hasAddOn = relatedData["Add On"]?.data?.length > 0;
                                    const hasCategoryList = relatedData["category_list"]?.data?.length > 0;

                                    const filteredData = Object.entries(relatedData).filter(([key, value]) => {
                                        if (!value.data.length) return false;
                                        if (key === "category_list" && (hasBoughtTogether || hasMustUse || hasAddOn)) return false;
                                        return true;
                                    });

                                    if (filteredData.length === 0) return null;

                                    return (
                                        <>
                                            {filteredData.map(([key, value]) => (
                                                <div key={key} className="m-[15px_0] md:px-[10px]">
                                                    {(key === "Bought Together" || key === "category_list") ? (
                                                        <h2 className="text-[16px] lg:text-[18px] mb-[10px] font-semibold text-[#000]">
                                                            Related Products
                                                        </h2>
                                                    ) : (
                                                        <h2 className="text-[16px] lg:text-[18px] mb-[10px] font-semibold text-[#000]">
                                                            {key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                                        </h2>
                                                    )}

                                                    <ProductBox
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
                                                    productList={data.cross_selling_products}
                                                    rowCount={"flex-[0_0_calc(20%_-_8px)]"}
                                                    scroll_button={true}
                                                    scroll_id="cross_selling_products"
                                                />
                                            </div>
                                        </>
                                    )}

                                {/* {(data.related_categories && data.related_categories.length != 0) && 
            <>
                <div className='m-[15px_0]'>
                    <h3 className='text-[15px] font-[500] mb-[8px]'>Related Category</h3>
                    <RelatedCategory productList={data.related_categories} rowCount={'flex-[0_0_calc(20%_-_8px)]'} scroll_button={true} scroll_id='cross_selling_products'/>
                </div>
            </>
        } */}

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

                                <div className="hidden h-[60px] bg-[#fff] flex items-center justify-between sticky bottom-0 z-[99] p-[10px] shadow-[0_0_5px_#ddd]">
                                    {cartItems && cartItems.length > 0 ? (
                                        <div
                                            onClick={() => {
                                                router.push("/tabs/yourcart");
                                            }}
                                            className="flex items-center gap-[5px]"
                                        >
                                            <Image
                                                className="h-[35px] w-[35px] object-contain"
                                                height={60}
                                                width={60}
                                                alt="logo"
                                                src={"/cart.svg"}
                                            ></Image>
                                            <h6 className="primary_color text-[14px] font-medium">
                                                {cartItems.length} Items
                                            </h6>
                                        </div>
                                    ) : (
                                        <div></div>
                                    )}

                                    {/* <div><CardButton item={data} index={varActive} text_btn={true} is_big={true} /></div> */}
                                    {/* <button onClick={()=>{router.push('/tabs/yourcart')}} className='primary_btn p-[8px_12px]'>View Cart</button> */}
                                </div>

                                {/* {pageLoading && 
        <div id="wave">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        </div>
     } */}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Now Easier To Choose */}

            {/* <ChooseCategory customCss={'lg:w-[90%] max-w-[1300px]'} /> */}

            {/* Shop By Brands */}

            {/* <Brands customCss={'lg:w-[90%] max-w-[1300px]'} /> */}
        </>
    );
};

const Attributes = ({ data, styles, checkVariantInfo, setData }) => {
    // const [option,setOption] = useState('')
    // let [defaultSelectedOption, setDefaultSelectedOption] = useState(null);

    useEffect(() => {
        // console.log('data',data.product_attributes);
        if (data.product_attributes && data.product_attributes.length != 0) {
            data.product_attributes = data.product_attributes.filter((res) => {
                return res.options && res.options.length != 0;
            });
            let dropdown = data.product_attributes.find((res) => {
                return res.control_type == "Dropdown List";
            });
            if (dropdown) {
                //   dropdown.options[1].is_pre_selected = 1
                let option = dropdown.options.find((res) => {
                    return res.is_pre_selected == 1;
                });
                //   if(option){
                //     setDefaultSelectedOption(option)
                //   }
            }
        }
    }, []);

    const setAttribute = (array, obj, index) => {
        obj.is_pre_selected = 1;
        array.map((r, i) => {
            if (i != index) {
                r.is_pre_selected = 0;
            }
        });
        setData(data);
        // setOption(obj.option_value)
        checkVariantInfo(data);
    };

    const handleChange = (selectedOption, array) => {
        // console.log(selectedOption.value)
        array.map((r, j) => {
            if (r.name == selectedOption.value) {
                setAttribute(array, r, j);
            }
        });
    };

    return (
        <>
            {data.product_attributes.length != 0 &&
                data.product_attributes.map((attr, index) => {
                    return (
                        <div className="your-element" key={index}>
                            {attr.options && attr.options.length > 0 && (
                                <h5 className="text-[14px] font-medium mb-[5px]">
                                    {attr.attribute}
                                </h5>
                            )}
                            <div className="flex items-center flex-wrap gap-[7px] mb-[7px]">
                                {/* {attr.options.map((opt,j)=>{
                     return(
                      <> */}

                                {attr.control_type == "Radio Button List" &&
                                    attr.options &&
                                    attr.options.length > 0 &&
                                    attr.options.map((opt, j) => {
                                        return (
                                            <div
                                                key={j}
                                                onClick={() => setAttribute(attr.options, opt, j)}
                                                className={`border-[1px] border-slate-100 p-[5px_8px] cursor-pointer flex items-center gap-[5px] rounded-[5px]`}
                                            >
                                                <input
                                                    className={styles.input_radio}
                                                    checked={opt.is_pre_selected == 1}
                                                    type="radio"
                                                />
                                                <h5 className="text-[12px] font-medium capitalize">
                                                    {opt.option_value}
                                                </h5>
                                            </div>
                                        );
                                    })}

                                {attr.control_type == "Color Boxes" &&
                                    attr.options &&
                                    attr.options.length > 0 &&
                                    attr.options.map((opt, j) => {
                                        return (
                                            <div
                                                key={j}
                                                onClick={() => setAttribute(attr.options, opt, j)}
                                                className={`${opt.is_pre_selected == 1
                                                    ? "border-[#000]"
                                                    : "border-slate-100 "
                                                    } ${opt.attribute_color ? " w-[30px]" : " w-max"
                                                    } h-[30px] border-[1px] cursor-pointer flex items-center justify-center gap-[5px] rounded-[5px]`}
                                            >
                                                {opt.attribute_color ? (
                                                    <div
                                                        style={{ background: opt.attribute_color }}
                                                        className={`h-[20px] w-[20px] rounded-[5px]`}
                                                    ></div>
                                                ) : (
                                                    <h5 className="text-[12px] font-medium capitalize p-[0px_8px]">
                                                        {opt.option_value}
                                                    </h5>
                                                )}
                                            </div>
                                        );
                                    })}

                                {attr.control_type == "Checkbox List" &&
                                    attr.options &&
                                    attr.options.length > 0 &&
                                    attr.options.map((opt, j) => {
                                        return (
                                            <div
                                                key={j}
                                                onClick={() => setAttribute(attr.options, opt, j)}
                                                className="checkbox flex items-center gap-[6px] min-h-[30px] cursor-pointer mr-[5px]"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={opt.is_pre_selected == 1}
                                                    className="w-[16px] h-[16px] rounded-[5px] cursor-pointer"
                                                ></input>
                                                <span className="text-[12px] font-medium capitalize">
                                                    {opt.option_value}
                                                </span>
                                            </div>
                                        );
                                    })}

                                {attr.control_type == "Dropdown List" && (
                                    <Select
                                        className={`${styles.custom_input3} w-max`}
                                        placeholder={"Select " + attr.attribute}
                                        //  options={attr.options}
                                        //  defaultValue={
                                        //     defaultSelectedOption && defaultSelectedOption['name']
                                        //     ? { value: defaultSelectedOption['name'], label: defaultSelectedOption['option_value'] }
                                        //     : null
                                        //  }
                                        onChange={(e) => handleChange(e, attr.options)}
                                        options={attr.options.map((item) => ({
                                            value: item.name,
                                            label: item.option_value,
                                        }))}
                                    />
                                )}

                                {/* </> 
                    
                     )
                    })} */}
                            </div>
                        </div>
                    );
                })}
        </>
    );
};

const LoadVideo = ({ res, videoLink, index, cssClass, type }) => {
    return (
        <>
            {res.video_type == "Youtube" ? (
                <iframe
                    className={`${type && type == "Detail" && res.is_primary == 0 ? "hidden" : ""
                        } ${cssClass ? cssClass : ""}`}
                    src={
                        videoLink(
                            res.youtube_video_id ? res.youtube_video_id : res.video_link,
                            res.video_type
                        ) + (res.is_primary == 1 ? "?autoplay=1&mute=1" : "")
                    }
                    id={index}
                    // width={res.width}
                    // height={res.height}
                    frameBorder="2"
                    loading="lazy"
                // allowfullscreen="allowfullscreen"
                ></iframe>
            ) : (
                <>
                    {res.video_type == "Other" ? (
                        <video
                            controls
                            className={`${type && type == "Detail" && res.is_primary == 0 ? "hidden" : ""
                                }  ${cssClass ? cssClass : ""}`}
                        >
                            <source
                                src={videoLink(
                                    res.youtube_video_id ? res.youtube_video_id : res.video_link,
                                    res.video_type
                                )}
                                type="video/mp4"
                            />
                        </video>
                    ) : (
                        <iframe
                            className={`${type && type == "Detail" && res.is_primary == 0 ? "hidden" : ""
                                } ${cssClass ? cssClass : ""}`}
                            src={
                                videoLink(
                                    res.youtube_video_id ? res.youtube_video_id : res.video_link,
                                    res.video_type
                                ) + (res.is_primary == 1 ? "?autoplay=1&muted=1" : "")
                            }
                            id={index}
                            // width={res.width}
                            // height={res.height}
                            frameBorder="2"
                            loading="lazy"
                        // allowfullscreen="allowfullscreen"
                        ></iframe>
                    )}
                </>
            )}
        </>
    );
};

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

// const CACHE_DURATION = 60 * 5; // 5 minutes

// export async function getServerSideProps(context) {

//   let { detail } = context.params;
//   //   const { dynamicParam } = context.params;
//   if(detail && detail.includes('?')){
//     let data = detail.split('?')
//     detail = data[0]
//   }

//   const cacheKey = `yourCacheKey-${detail}`;

//   const cachedData = await getFromCache(cacheKey);

//   if (cachedData) {
//     return {
//       props: { productDetail: cachedData },
//     };
//   }

//   let data = {route: detail,centre: ""}

//   const resp = await get_product_detail(data);

//   let productDetail = resp.message;

//   if(resp.message.images && resp.message.images.length != 0){
//       productDetail.meta_image = resp.message.images[0].detail_image
//   }

//   await setToCache(cacheKey, productDetail, CACHE_DURATION);

//   return {
//     props: { productDetail },
//   };
// }

// export async function getServerSideProps({ req, params }) {
//     let { detail } = params;
//     let productRoute = ""
//     detail.map((r, i) => {
//         productRoute = productRoute + r + ((detail.length != (i + 1)) ? '/' : '')
//     })
//     // const apikey = req.cookies.api_key;
//     // const apisecret = req.cookies.api_secret;
//     // const token = (apikey && apisecret) ? `token ${apikey}:${apisecret}` : "token 0c7f0496a397762:199919c53cd169d"

//     // const queryParams = new URLSearchParams({
//     //     q: "*",
//     //     // query_by: "item_name,item_description,brand",
//     //     // page: "1",
//     //     // per_page: "1",
//     //     // query_by_weights: "1,2,3",
//     //     filter_by: `item_code:${productRoute}`,
//     // });

//     // const data = await typesense_search_items(queryParams);

//     // let productDetail =
//     //     data.hits && data.hits.length > 0 ? data.hits[0].document : {};
//     // if (
//     //     data.hits &&
//     //     data.hits.length > 0 &&
//     //     data.hits[0].document &&
//     //     data.hits[0].document.website_image_url
//     // ) {
//     //     productDetail.meta_image = data.hits[0].document.website_image_url;
//     // }

//     // let relatedProduct = data.related_products || [];

//     return {
//         props: { productRoute },
//         // props: { productDetail, detail, relatedProduct, productRoute },
//     };
// }

export default Detail;

// Detail.getInitialProps = async (context) => {
//     const { detail } = context.query;
//     // const { params } = context;
//     // const { detail } = params;

//     let data = {
//             // route: router.query.detail,
//             route: detail,
//             centre: ""
//     }

//     const resp = await get_product_detail(data);

//     let productDetail = resp.message;
//     let metaData = {};

//     metaData.meta_title = resp.message.meta_title
//     metaData.meta_description = resp.message.meta_description
//     metaData.meta_image = resp.message.image
//     return {
//       props: { metaData, productDetail ,},
//     };
// }

// export async function getStaticPaths() {
//     // Call an API or fetch data to retrieve dynamic paths
//     const paths = [
//       { params: { detail: 'johnsons-baby-milk-lotion-200-g' } },
//       { params: { detail: 'fevicol-all-fix-20-ml' } },
//       // Add more dynamic paths as needed
//     ];

//     return {
//       paths,
//       fallback: true, // Change to 'true' if you want to enable fallback behavior
//     };
//   }

// export const getStaticProps = async (context) => {
//     const { detail } = context.params; // Assuming the dynamic route parameter is named 'detail'

//     // const { params } = context;
//     // const { detail } = params;

//     let data = {route: detail,centre: ""}

//     const resp = await get_product_detail(data);
//     let productDetail = resp.message
//     return {
//       props: { productDetail } ,revalidate: 1
//     }
// }
