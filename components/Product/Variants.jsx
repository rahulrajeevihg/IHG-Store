import { useEffect } from 'react'
import Image from 'next/image';
import { check_Image, currencyFormatter1 } from '@/libs/api';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
const CardButton = dynamic(() => import('@/components/Product/CardButton'))
// import CardButton from '@/components/Product/CardButton'

export default function Variants({ item }) {

  const webSettings = useSelector((state) => state.webSettings.websiteSettings);

  useEffect(() => {
    // console.log(item,'item')
    if (item.variants) {
      item.variants.map(res => {
        res.item = item.item;
        res.name = item.name
        res.minimum_order_qty = item.minimum_order_qty
        res.disable_add_to_cart_button = item.disable_add_to_cart_button;
      })
    }
  }, [])

  return (
    <div className={`flex flex-col h-full w-full`}>
      <div className={``}>
        <div className={`flex items-center p-[8px] border-b-[1px] border-b-slate-100 relative`}>
          <div className='flex items-center justify-center border-[1px] border-slate-100 p-[5px] h-[90px] w-[95px] rounded-[5px]'><Image className='h-[95px] w-[95px] object-contain' height={100} width={100} alt='logo' src={check_Image(item.product_image)}></Image></div>
          <h3 className=' w-full p-[10px] text-[14px] py-[5px] font-semibold line-clamp-1'>{item.item}</h3>
        </div>

        <h3 className='text-[14px] m-[10px_10px_0_10px] font-semibold line-clamp-1'>Choose an option</h3>

      </div>

      <div className='overflow-auto h-full customScrollBar m-[10px]'>
        {item.variants.map((res, index) => {
          return (
            <div className='flex items-center gap-[10px] justify-between p-[10px] border-[1px] border-slate-100 rounded-[5px] mb-[10px] last:mb-0'>
              <div>
                <h3 className='text-[14px] py-[5px] font-semibold line-clamp-1'>{res.variant_text}</h3>
                {(webSettings && webSettings.currency) && <div className='flex items-center gap-[8px]'>
                  <h3 className={`text-[13px] font-semibold openSens`}>{currencyFormatter1(res.price, webSettings.currency)}</h3>
                  {res.old_price ? <h3 className={`text-[12px] gray_color line-through openSens`}>{currencyFormatter1(res.old_price, webSettings.currency)}</h3> : <></>}
                </div>}
              </div>

              <CardButton item={res} index={index} />

            </div>
          )
        })}
      </div>
    </div>
  )
}