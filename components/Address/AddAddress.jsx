import React, { useEffect, useState, useMemo } from 'react'
import styles from '@/styles/checkout.module.scss';
import { get_customer_info, delete_address } from '@/libs/api';
import AddressModal from '@/components/Address/AddressModal';
import Image from 'next/image'
import { useDispatch, useSelector, Provider } from 'react-redux'
// import customerInfoReducer from 'redux/reducers/customerInfoReducer'
// import customerInfoAction from 'redux/actions/customerInfoAction';
import AlertUi from '@/components/Common/AlertUi';
import { setDetail } from '@/redux/slice/customerInfo'
import { deleteAddress } from '@/redux/slice/customerInfo'
import Address from '@/components/Address/Address';

export default function AddAddress({closeModal, selectAddressFn}) {

  // const customer = useSelector(s => s.customer);
  const customerDetail = useSelector((state)=> state.customerInfo.customerDetail)

  const [customerInfo, setCustomerInfo] = useState([]);
  const [editAddress, setEditAddress] = useState(undefined);
  const [visible, setVisible] = useState(false);
  const [addNew, setAddNew] = useState(false);
  const [skeleton, setSkeleton] = useState(true);
  const [addressDelete, setDeleteAddress] = useState(false);
  const [alertMsg, setAlertMsg] = useState({});

  const dispatch = useDispatch();

  useEffect(() => {
    const close = (e) => {
      if(e.keyCode === 27){
       setVisible(visible)
      }
    }
    window.addEventListener('keydown', close)
  return () => window.removeEventListener('keydown', close)
},[])


  useEffect(() => {
    // customer_info();
  }, [])

  useMemo(() => {
    // console.log('qweqrqrqr',customerDetail)
    if(customerDetail && customerDetail.name){
      let value = JSON.stringify(customerDetail)
      value = JSON.parse(value)
      setCustomerInfo(value)
      setSkeleton(false);
    }
  }, [customerDetail])

  // async function customer_info() {
  //   let data = { guest_id: '', user: localStorage['customerRefId'] };
  //   const resp = await get_customer_info(data);
  //   if (resp && resp.message && resp.message[0]) {
  //     let data = resp.message[0];
  //     setCustomerInfo(data);
  //     setSkeleton(false);
  //   }else{
  //     setSkeleton(false);
  //   }
  // }

  const selectAddress = async (array, index) => {
    selectAddressFn ? selectAddressFn(array, index) : null
    array.map((res, i) => {
      if (i == index) {
        res.is_default = 1;
      } else {
        res.is_default = 0
      }
    })
    // setCustomerInfo(
    //   { ...customerInfo, address: array }
    // )

    dispatch(setDetail(customerInfo))
    closeModal ? closeModal() : null

  }

  function edit_address(res, type, index) {
    if (type == 'New') {
      setEditAddress(undefined);
      show();
    } else if (type == 'Edit') {
      setEditAddress(res);
      show();
    } else if (type == 'Delete') {
      setAlertMsg({ message: 'Do you want to delete your address ?', res: res, index: index });
      setDeleteAddress(true);
      // deleteAddress(res, index);
      // const filterAddress=customerInfo.filter((item,id)=>{return(item.id != index)
      // setCustomerInfo([...customerInfo,filterAddress])

    }

  }

  async function deleteAddress1(delete_obj, index) {
    let data = { "id": delete_obj.name, "customer": localStorage['customerRefId'] }
    const resp = await delete_address(data);
    if (resp && resp.message && resp.message == 'Success') {
      
      dispatch(deleteAddress(delete_obj.name))
      
      setAlertMsg({});
      customerInfo.address.splice(index, 1);
      // setCustomerInfo(
      //   { ...customerInfo, address: customerInfo.address }
      // )
    }
  }

  function show() {
    setVisible(true);
    

  }
  if(visible){
    document.body.classList.add('active_visible')
  }else{
    document.body.classList.remove('active_visible')
  }


  function show() {
    setVisible(true);
  }

  function hide(obj) {
    setVisible(false);
    // console.log(obj);
    // if (obj) {

    //   if (customerInfo.address && customerInfo.address.length != 0 && obj.name) {
    //     let addressIndex = customerInfo.address.findIndex((res) => { return res.name == obj.name });
    //     if (addressIndex >= 0) {
    //       customerInfo.address[addressIndex] = obj;
    //     } else {
    //       customerInfo.address.push(obj);
    //     }
    //   } else {
    //     customerInfo.address.push(obj);
    //   }

    //   setCustomerInfo(
    //     { ...customerInfo, address: customerInfo.address }
    //   )

    // }
  }


  function address_closeModal(value) {
    setDeleteAddress(false);
    if (value == 'Yes') {
      deleteAddress1(alertMsg.res, alertMsg.index);
    }

  }

  return (

    <>
        {addressDelete &&
          <AlertUi isOpen={addressDelete} closeModal={(value) => address_closeModal(value)} headerMsg={'Alert'} button_1={'No'} button_2={'Yes'} alertMsg={alertMsg} />
        }
      <h6 className='lg:hidden text-[16px] pt-[10px] px-[10px] font-semibold'>Select Billing Address</h6>

      {skeleton ? <Skeleton /> :
      <>
       <div className='md:h-[calc(100vh_-_175px)] md:overflow-auto md:scrollbar-hide lg:flex lg:flex-wrap lg:gap-[10px] lg:p-[10px]'>
         
          {customerInfo && customerInfo.address && customerInfo.address.length != 0 && 
           <>
           {customerInfo.address.map((res, index) => (
            <div key={index} className={`${styles.address_sec} ${res.is_default == 1 ? 'lg:border-solid lg:border-[1px] lg:border-[#e21b22]' : 'border-slate-100 lg:border-[1px] lg:border-solid '} flex lg:flex-[0_0_calc(50%_-_5px)]  lg:rounded-[5px] md:border-b md:border-slate-100 cursor-pointer overflow-auto p-[10px_20px] gap-[5px] hover:lg:border-solid hover:lg:border-[1px] hover:lg:border-[#e21b22]`}>
              <div onClick={() => { selectAddress(customerInfo.address, index); } } className={`flex items-baseline lg:w-[85%] md:w-[80%] justify-between cursor-pointer gap-[8px]`}>
                <input className={`${styles.input_radio} lg:hidden `} checked={res.is_default} type="radio" />
                <div className='w-full flex flex-col flex-wrap'>
                  <span className='flex justify-between items-center'>
                    <h6 className='m-0 text-[15px]  capitalize font-semibold'>{res.first_name + ' ' + res.last_name}</h6>
                  </span>
                  <p className='m-0 text-[14px] text-medium'>{res.address} <br></br> {res?.city}, {res?.state}, {res?.country} - {res?.zipcode}</p>
                </div>
              </div>

              <div className='flex w-[calc(15%_-_10px)] md:flex md:w-[calc(20%_-_10px)] ml-[10px] justify-end'>
                <div onClick={() => { edit_address(res, 'Edit', index); } } className='cursor-pointer mr-[10px]'>
                  <Image className='h-[16px] w-[16px]' src="/Address/edit.svg" height={17} width={17} layout="fixed" alt="Edit" />
                </div>
                <div onClick={() => { edit_address(res, 'Delete', index); } } className='cursor-pointer'>
                  <Image className='w-[16px]' src="/Address/delete.svg" height={20} width={18} layout="fixed" alt="Ddelete" />
                </div>

              </div>
            </div>
          ))}
          <div onClick={() =>edit_address(undefined, 'New', '')} onMouseEnter={() => setAddNew(true)} onMouseLeave={() => setAddNew(false)} className={`${styles.address_sec} ${addNew ? 'addressActive' : ''} min-h-[85px] md:hidden border-slate-100 border-solid border-[1px] flex items-center lg:flex-[0_0_calc(50%_-_5px)] lg:rounded-[5px] cursor-pointer p-[10px_20px] gap-[15px]`}>
            <Image className='w-[20px]' src={addNew ? "/Address/plus-red.svg" : "/Address/plus.svg"} height={20} width={18} layout="fixed" alt="Delete" />
            <h6 className='text-[15px] hover:text-[#e21b22]'>Add new address</h6>
          </div>
          </>
         }
         {customerInfo && customerInfo.address && customerInfo.address.length == 0 && 
           <div className='mt-[15px]'>
            <Address hide={(obj) => hide(obj)} />
           </div>  
         }
           
       </div>
       {customerInfo && customerInfo.address && customerInfo.address.length != 0 && <div className="lg:hidden flex my-[15px] justify-center items-center">
            <button className={`primary_btn text-[14px] h-[40px] md:w-[90%] lg:[50%] lg:p-[0_20px]`} onClick={() => edit_address(undefined, 'New', '')}>Add New Address</button>
       </div>
       }
      </>
}

      {visible &&
        <AddressModal edit_address={editAddress} visible={visible} hide={(obj) => hide(obj)} />
      }
    </>
  )
}

const Skeleton = () => {
  return (
    <>
        <div class="p-[20px] md:h-[calc(100vh_-_150px)] md:overflow-auto md:scrollbar-hide lg:flex lg:flex-wrap lg:gap-[10px] lg:p-[10px]animate-pulse">
          {[1,2,3,4,5].map((res,index)=>(
                <div key={index} className={`${styles.address_sec} h-[85px] md:mb-[10px] bg-slate-100 border-slate-100 lg:border-[1px] lg:border-solid flex lg:flex-[0_0_calc(50%_-_5px)]  lg:rounded-[5px] md:border-b md:border-slate-100 cursor-pointer overflow-auto p-[10px_20px] gap-[5px]`}></div>
          ))}
        </div>
    </>
)}