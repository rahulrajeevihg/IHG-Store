import { useState } from 'react'
import { insert_cart_items, get_cart_items, update_cartitem, delete_cart_items } from '@/libs/api';
import { useDispatch } from 'react-redux';
import { setCartItems } from '@/redux/slice/cartSettings'
import { toast } from 'react-toastify';


export default function CardButton({ item, index, variantOpen, text_btn, quickView, is_big, list }) {
  // console.log(item,"cardbutton")

  const [loader, setLoader] = useState(-1);
  const dispatch = useDispatch();


  function addCart(value, index, type) {
    
    // console.log(value,'value')
    // console.log(text_btn,'text_btn')
    // console.log(quickView,'quickView')
    if ((value.has_variants == 1 && !text_btn) || (value.has_variants == 1 && quickView)) {
      variantOpen(value)
      // setVariantItems(value);
    } else if (value.has_variants == 1 && text_btn) {
      let is_required = value.product_attributes.filter(res => { return res.is_required == 'Yes' })
      if (is_required.length == 0) {
        addTOCart(index, value, type)
      } else {

        let is_pre_selected = 0
        is_required.map((res, i) => {
          let find = res.options.find(r => { return r.is_pre_selected == 1 })
          if (find && (i == is_pre_selected)) {
            is_pre_selected++;
          }
          // res.options.map(r=>{
          //   r.is_pre_selected == 1 ? is_pre_selected++ : 0
          // })
        })
        if (is_pre_selected == is_required.length) {
          addTOCart(index, value, type)
        } else {
          toast.error('Please select the ' + is_required[is_pre_selected].attribute);
        }

      }
    } else {
      addTOCart(index, value, type)
    }
  }

  function addTOCart(index, value, type) {
   
    setLoader(index)
    if (value['count'] == 0) {
      insert_cart(value, 'buy_now')
    } else {
      updateCart(value, type)
    }
  }

  const updateCart = async (dataValue, type) => {
    if (type == 'dec' && (dataValue['count'] == 1 || (dataValue.minimum_order_qty && dataValue.minimum_order_qty == dataValue['count']))) {
      let param = { name: dataValue.cart_id, customer_id: localStorage['customerRefId'] }
      const resp = await delete_cart_items(param);
      setTimeout(() => { setLoader(-1) }, 500)
      if (resp.message.status == 'success') {
        setTimeout(() => { setLoader(-1) }, 500)
        get_cart_item()
      }
    } else if (dataValue['count'] > 0) {
      update_cart(dataValue, type);
    }else{
      update_cart(dataValue, type);
    }

  }

  async function update_cart(dataValue, type) {
    // console.log('dataValue',dataValue);

    let param = {
      name: dataValue.cart_id,
      qty: type == 'inc' ? (dataValue['count'] + 1) : (dataValue['count'] - 1),
      "business": dataValue.business ? dataValue.business : '',
      qty_type: ""
    }

    const resp = await update_cartitem(param);
    setTimeout(() => { setLoader(-1) }, 500)
    if (resp.message.status == 'success') {
      get_cart_item()
      UpdateSuccessToast(dataValue)
    } else {
      let msg = (resp.message && resp.message.message) ? resp.message.message : 'Something went wrong try again later'
      toast.error(msg);
    }
  }

  function UpdateSuccessToast(value) {
    let item = value.item || value.product_name
    toast.success(item + ' updated successfully')
  }

  function successToast(value) {
    let item = value.item || value.product_name
    toast.success(item + ' added successfully')
  }

  async function insert_cart(value, type) {
    value.variant_text = value.attribute ? value.attribute : value.variant_text
    let param = {
      "item_code": value.name,
      "qty": value.minimum_order_qty ? value.minimum_order_qty : 1,
      "qty_type": "",
      "cart_type": "Shopping Cart",
      "customer": localStorage['customerRefId'],
      // "attribute": value.attribute ? value.attribute : '',
      "attribute": value.variant_text ? value.variant_text : '',
      "attribute_id": value.attribute_id ? value.attribute_id : '',
      "business": value.business ? value.business : ''
    }

    const resp = await insert_cart_items(param);
    setTimeout(() => { setLoader(-1) }, 500)
    if (resp.message && resp.message.marketplace_items) {
      localStorage['customerRefId'] = resp.message.customer
      get_cart_item()
      successToast(value)
    } else{
      let msg = (resp.message && resp.message.message) ? resp.message.message : 'Something went wrong try again later'
      toast.error(msg);
    }
  }

  async function get_cart_item() {
    let res = await get_cart_items();
    if (res && res.message && res.message.status && res.message.status == "success") {
      dispatch(setCartItems(res.message));
    }
  }


  return (
    <>

      {/* <ToastContainer /> */}
      {(text_btn && (item.count == 0 || !item.count)) ? <div className=''>
        <button onClick={() => { loader == index ? null : (item.disable_add_to_cart_button == 1 ? null : addCart(item, index, 'inc')) }} className={`${item.disable_add_to_cart_button == 1 ? 'opacity-[0.8]' : ''} border-1 rounded-[5px]  primary_bg text-white text-[15px] font-semibold px-[8px] h-[40px] w-[150px]`}>Add to Cart</button>
      </div> : <div className={`flex float-right items-center ${list ? 'mb-[5px]' : ''} `}>
        {item.count >= 1 &&
          <button onClick={() => { loader == index ? null : addCart(item, index, 'dec') }} className={`border-1 rounded-[5px] light_bg primary_color text-[16px]  flex items-center justify-center ${is_big ? 'h-[40px] w-[40px]' : 'h-[28px] w-[28px]'}`}> - </button>}
        {/* {item.count >= 1 && <p className="mx-4 text-[14px]">{item.count}</p>} */}
        <div className={`${item.count >= 1 ? '' : 'hidden'} ease-in duration-300 flex items-center justify-center min-w-[15px] mx-2`}>
          {loader == index ?
            <div className={`ease-in duration-300 animate-spin rounded-full h-[15px] w-[15px] border-l-2 border-t-2 border-[#000]`}></div>
            :
            <span className="ease-in duration-300 text-[12px]">{item.count}</span>
          }
        </div>
        <button onClick={() => { loader == index ? null : (item.disable_add_to_cart_button == 1 ? null : addCart(item, index, 'inc')) }} className={`${item.disable_add_to_cart_button == 1 ? 'opacity-[0.8]' : ''} border-1 rounded-[5px] primary_bg text-[#fff] text-[16px]  flex items-center justify-center ${is_big ? 'h-[36px] w-[36px]' : 'h-[28px] w-[28px]'}`}> +</button>
      </div>}
    </>
  )
}