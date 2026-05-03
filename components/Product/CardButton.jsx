import { useState } from 'react'
import { insert_cart_items, get_cart_items, update_cartitem, delete_cart_items } from '@/libs/api';
import { useDispatch } from 'react-redux';
import { setCartItems } from '@/redux/slice/cartSettings'
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';

const AddToCartModal = dynamic(() => import('./AddToCartModal'), { ssr: false });

export default function CardButton({ item, index, variantOpen, text_btn, quickView, is_big, list }) {

  const [loader, setLoader] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();

  const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getCurrentCount = (value) => {
    return toNumber(value?.count ?? value?.quantity ?? 0, 0);
  };

  const getCartRowId = (value) => {
    return value?.cart_id || value?.name || "";
  };

  function addCart(value, index, type) {
    if ((value.has_variants == 1 && !text_btn) || (value.has_variants == 1 && quickView)) {
      variantOpen(value)
    } else if (value.has_variants == 1 && text_btn) {
      let is_required = value.product_attributes.filter(res => { return res.is_required == 'Yes' })
      if (is_required.length == 0) {
        openModalOrAdd(index, value, type)
      } else {
        let is_pre_selected = 0
        is_required.map((res, i) => {
          let find = res.options.find(r => { return r.is_pre_selected == 1 })
          if (find && (i == is_pre_selected)) {
            is_pre_selected++;
          }
        })
        if (is_pre_selected == is_required.length) {
          openModalOrAdd(index, value, type)
        } else {
          toast.error('Please select the ' + is_required[is_pre_selected].attribute);
        }
      }
    } else {
      openModalOrAdd(index, value, type)
    }
  }

  // For initial add (count == 0), open modal; for +/- on existing item, go direct
  function openModalOrAdd(index, value, type) {
    const currentCount = getCurrentCount(value);
    if (currentCount <= 0 && type === 'inc') {
      setModalOpen(true);
    } else {
      addTOCart(index, value, type);
    }
  }

  function addTOCart(index, value, type) {
    setLoader(index)
    const currentCount = getCurrentCount(value);
    if (currentCount <= 0) {
      insert_cart(value, 1)
    } else {
      updateCart(value, type, currentCount)
    }
  }

  const updateCart = async (dataValue, type, incomingCount) => {
    const currentCount = Number.isFinite(incomingCount) ? incomingCount : getCurrentCount(dataValue);
    const cartRowId = getCartRowId(dataValue);
    const minimumQty = toNumber(dataValue?.minimum_order_qty, 0);

    if (!cartRowId) {
      setModalOpen(true);
      return;
    }

    if (type == 'dec' && (currentCount <= 1 || (minimumQty > 0 && minimumQty == currentCount))) {
      let param = { cart_id: cartRowId, customer_id: localStorage['customerRefId'] }
      const resp = await delete_cart_items(param);
      setTimeout(() => { setLoader(-1) }, 500)
      if (resp && resp.message && resp.message.status == 'success') {
        get_cart_item()
      }
    } else if (currentCount > 0) {
      update_cart(dataValue, type, currentCount);
    } else {
      setModalOpen(true);
    }
  }

  async function update_cart(dataValue, type, incomingCount) {
    const currentCount = Number.isFinite(incomingCount) ? incomingCount : getCurrentCount(dataValue);
    const cartRowId = getCartRowId(dataValue);
    if (!cartRowId) {
      setModalOpen(true);
      return;
    }

    let param = {
      item_code: dataValue.item_code,
      qty: type == 'inc' ? (currentCount + 1) : (currentCount - 1),
      "business": dataValue.business ? dataValue.business : '',
      qty_type: ""
    }

    const resp = await update_cartitem(param);
    setTimeout(() => { setLoader(-1) }, 500)

    if (resp && resp.message && resp.message.status === 'success') {
      get_cart_item()
      UpdateSuccessToast(dataValue)
    } else {
      let msg = (resp && resp.message && resp.message.message) ? resp.message.message : 'Something went wrong, please try again later';
      toast.error(msg);
    }
  }

  function UpdateSuccessToast(value) {
    let name = value.item_name || value.item_code || value.product_name || value.item
    toast.success(name + ' updated successfully')
  }

  function successToast(value) {
    let name = value.item_name || value.item_code || value.product_name || value.item
    toast.success(name + ' added successfully')
  }

  async function insert_cart(value, qty) {
    value.variant_text = value.attribute ? value.attribute : value.variant_text
    let param = {
      "item_code": value.item_code || value.name,
      "qty": qty || (value.minimum_order_qty ? value.minimum_order_qty : 1),
      "qty_type": "",
      "cart_type": "Shopping Cart",
      "customer": localStorage['customerRefId'],
      "attribute": value.variant_text ? value.variant_text : '',
      "attribute_id": value.attribute_id ? value.attribute_id : '',
      "business": value.business ? value.business : ''
    }

    const resp = await insert_cart_items(param);
    setTimeout(() => { setLoader(-1) }, 500)
    if (resp && resp.message && (resp.message.status === 'success' || resp.message.marketplace_items)) {
      if (resp.message.customer) localStorage['customerRefId'] = resp.message.customer;
      get_cart_item()
      successToast(value)
    } else {
      let msg = (resp && resp.message && resp.message.message) ? resp.message.message : 'Something went wrong try again later'
      toast.error(msg);
    }
  }

  async function get_cart_item() {
    let res = await get_cart_items();
    if (res && res.message && res.message.status && res.message.status == "success") {
      dispatch(setCartItems(res.message));
    }
  }

  const handleModalAdd = (product, qty) => {
    setLoader(index);
    insert_cart(product, qty);
  };

  return (
    <>
      {modalOpen && (
        <AddToCartModal
          item={item}
          onClose={() => setModalOpen(false)}
          onAdd={handleModalAdd}
        />
      )}

      {(text_btn && (item.count == 0 || !item.count)) ? (
        <div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              if (loader === index || item.disable_add_to_cart_button == 1) return;
              setModalOpen(true);
            }}
            className={`${item.disable_add_to_cart_button == 1 ? 'opacity-[0.8]' : ''} border-1 rounded-[5px] primary_bg text-white text-[15px] font-semibold px-[8px] h-[40px] w-[150px] flex items-center justify-center gap-2`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Add to Cart
          </button>
        </div>
      ) : (
        <div className={`flex float-right items-center ${list ? 'mb-[5px]' : ''}`}>
          {item.count >= 1 &&
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                loader == index ? null : addCart(item, index, 'dec')
              }}
              className={`border-1 rounded-[5px] light_bg primary_color text-[16px] flex items-center justify-center ${is_big ? 'h-[40px] w-[40px]' : 'h-[28px] w-[28px]'}`}
            >
              -
            </button>}
          <div className={`${item.count >= 1 ? '' : 'hidden'} ease-in duration-300 flex items-center justify-center min-w-[15px] mx-2`}>
            {loader == index ?
              <div className="ease-in duration-300 animate-spin rounded-full h-[15px] w-[15px] border-l-2 border-t-2 border-[#000]"></div>
              :
              <span className="ease-in duration-300 text-[12px]">{item.count}</span>
            }
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              loader == index ? null : (item.disable_add_to_cart_button == 1 ? null : addCart(item, index, 'inc'))
            }}
            className={`${item.disable_add_to_cart_button == 1 ? 'opacity-[0.8]' : ''} border-1 rounded-[5px] primary_bg text-[#fff] text-[16px] flex items-center justify-center ${is_big ? 'h-[36px] w-[36px]' : 'h-[28px] w-[28px]'}`}
          >
            +
          </button>
        </div>
      )}
    </>
  )
}
