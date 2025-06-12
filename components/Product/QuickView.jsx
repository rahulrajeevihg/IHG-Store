import { useEffect, useState } from 'react'
import Image from 'next/image';
import { check_Image, delete_cart_items, insert_cart_items, get_cart_items, currencyFormatter1 } from '@/libs/api';
import CardButton from '@/components/Product/CardButton';
import Modals from '@/components/Detail/Modals'
import { useSelector, useDispatch } from 'react-redux';
import { setCartItems } from '@/redux/slice/cartSettings'
import Accordions from '@/components/Common/Accordions'
import Variants from '@/components/Product/Variants'
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';

export default function QuickView({ item, webSettings, closeQuickModal }) {

    const [accordionData, setAccordionData] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    // const webSettings = useSelector((state) => state.webSettings.websiteSettings);

    const dispatch = useDispatch()

    useEffect(() => {
        let datas = [];
        // resp.message['return_description'] ? datas.unshift({ title: 'Return Policy', content: resp.message['return_description'] }) : null;
        item['full_description'] ? datas.unshift({ title: 'Product Detail', content: item['full_description'] }) : null;
        setAccordionData(datas)
    }, [])


    async function addRemovewish(item) {
        if (item.wish_count == 1) {
            let param = { name: item.wish_id }
            const resp = await delete_cart_items(param);
            if (resp.message.status == 'success') {
                get_cart_item()
            }
        } else {
            insert_cart(item)
        }
    }

    async function insert_cart(value) {
        let param = {
            "item_code": value.name,
            "qty": 1,
            "qty_type": "",
            "cart_type": "Wishlist",
            "customer": localStorage['customerRefId'],
            "attribute": value.attribute ? value.attribute : '',
            "attribute_id": value.attribute_ids ? value.attribute_ids : '',
            "business": value.business ? value.business : ''
        }

        const resp = await insert_cart_items(param);
        // setTimeout(()=>{setLoader(-1)},500)
        if (resp.message && resp.message.marketplace_items) {
            get_cart_item()
        } else if (resp.message && resp.message.status == 'Failed') {
            //   setAlertMsg({message:resp.message.message});
        }
    }

    async function get_cart_item() {
        let res = await get_cart_items();
        if (res && res.message && res.message.status && res.message.status == "success") {
            dispatch(setCartItems(res.message));
        }
    }


    function sanitizeHtml(htmlValue) {
        const stringWithHtmlTags = htmlValue;
        const withoutTags = stringWithHtmlTags.replace(/<\/?[^>]+(>|$)/g, "");
        return withoutTags;
    }

    function variantOpen() {
        setIsOpen(true)
    }

    const closeModal = () => {
        setIsOpen(false)
    }

    return (
        <>
            {(isOpen && item) && <div className='varinatspopup'>
                <Rodal visible={isOpen} enterAnimation='lg:slideRight md:slideSown' animation='' onClose={closeModal}>
                    <Variants item={item} />
                </Rodal>
            </div>
            }

            <div className="flex flex-col gap-[10px] h-full overflow-auto scrollbarHide">
                <div className="flex-[0_0_calc(40%_-_7px)]">
                    {(item.discount_percentage != 0) && <h6 className='absolute left-[18px] top-[18px] additional_bg text-[#fff] p-[2px_8px] rounded-[10px] text-[12px]'>{item.discount_percentage}<span className='px-[0px] text-[#fff] text-[12px]'>% Off</span> </h6>}
                    <div className='flex cursor-pointer items-center justify-center lg:h-[240px] md:h-[140px] pb-[10px]'><Image className='lg:h-[220px] md:h-[135px] object-contain' height={200} width={200} alt='logo' src={check_Image(item.product_image)}></Image></div>
                </div>
                <div className="flex-[0_0_calc(60%_-_7px)]">
                    <h6 className='text-[12px] font-semibold primary_color capitalize'>{item.centre}</h6>
                    <h3 className='text-[17px] cursor-pointer font-semibold line-clamp-2 capitalize'>{item.item}</h3>
                    {(webSettings && webSettings.currency) && <div className='flex items-center gap-[8px]'>
                        <h3 className={`text-[15px] font-semibold openSens`}>{currencyFormatter1(item.price, webSettings.currency)}</h3>
                        {item.old_price ? <h3 className={`text-[14px] openSens gray_color line-through`}>{currencyFormatter1(item.old_price, webSettings.currency)}</h3> : <></>}
                    </div>}
                    {item.short_description && <span className='gray_color text-[12px] pb-[5px] line-clamp-3' dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.short_description) }} ></span>}

                    {item.default_variant &&
                        <div onClick={() => { variantOpen() }} className='min-h-[28px] flex items-center gap-[3px] justify-between light_bg rounded-[5px] p-[5px] mb-[5px] lg:max-w-[208px] md:max-w-[155px] w-max cursor-pointer'>
                            <h4 className='line-clamp-1 text-[12px]'>{item.default_variant.variant_text} </h4>
                            <Image className='h-[10px] object-contain' height={14} width={14} alt='logo' src={'/Arrow/downArrowBlack.svg'}></Image>
                        </div>
                    }
                    <div className='flex m-[10px_0] gap-[15px] items-center pb-[8px]'>
                        <div><CardButton item={item} text_btn={true} quickView={true} variantOpen={variantOpen} is_big={true} /></div>
                        {(webSettings && webSettings.app_settings) ? <div onClick={() => addRemovewish(item)} className='h-[36px] w-[60px] light_bg rounded-[5px] grid place-content-center'><Image className='cursor-pointer object-contain h-[25px] w-[30px]' src={check_Image(item['wish_count'] == 1 ? webSettings.app_settings.list_wishlist_filled : webSettings.app_settings.list_wishlist)} height={100} width={200} alt='wish' /></div> : <></>}

                        {/* <div onClick={() => addRemovewish(item)} className='h-[36px] w-[60px] light_bg rounded-[5px] grid place-content-center'><Image className='cursor-pointer object-contain h-[25px] w-[30px]' src={item['wish_count'] == 1 ? '/detail/wishlist-fill.svg' : '/detail/wishlist-line.svg'} height={100} width={200} alt='wish' /></div> */}
                        <Modals />
                    </div>

                    {(accordionData && accordionData.length != 0) && <>
                        <Accordions items={accordionData} product={item} />
                    </>}

                </div>
            </div>
        </>
    )
}