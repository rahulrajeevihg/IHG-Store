import React, { useEffect, useState, useMemo } from 'react'
import styles from '@/styles/checkout.module.scss';
import { useForm, Controller } from "react-hook-form";
import { get_country_list, get_country_states, insert_address, update_address } from '@/libs/api';
import Select from 'react-select';
import { useSelector, useDispatch } from 'react-redux';
import { setAddress, updateAddress, setDetail } from '@/redux/slice/customerInfo'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Address({ hide, edit_address, modal }) {

  const { handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      first_name: ((edit_address && edit_address.first_name) ? edit_address.first_name : ''),
      last_name: ((edit_address && edit_address.last_name) ? edit_address.last_name : ''),
      state: ((edit_address && edit_address.state) ? edit_address.state : ''),
      city: ((edit_address && edit_address.city) ? edit_address.city : ''),
      country: ((edit_address && edit_address.country) ? edit_address.country : ''),
      // custom_company_name:((edit_address && edit_address.custom_company_name) ? edit_address.custom_company_name : ''),
      // custom_gst_no:((edit_address && edit_address.custom_gst_no) ? edit_address.custom_gst_no : ''), 
      phone: ((edit_address && edit_address.phone) ? edit_address.phone : ''),
      pincode: ((edit_address && edit_address.zipcode) ? edit_address.zipcode : ''),
      address: ((edit_address && edit_address.address) ? edit_address.address : ''),
      is_default: ((edit_address && edit_address.is_default) ? edit_address.is_default : '')
    }
  });

  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  const customerDetail = useSelector((state) => state.customerInfo.customerDetail)

  const [customerInfo, setCustomerInfo] = useState([]);
  let [countryList, setCounty] = useState([]);
  let [stateList, setState] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [index, setIndex] = useState(0)
  const dispatch = useDispatch();

  useEffect(() => {
    get_country();
    if (edit_address && edit_address.is_default == 1) {
      setIndex(1)
    }
  }, [])

  useMemo(() => {
    if (customerDetail && customerDetail.name) {
      let value = JSON.stringify(customerDetail)
      value = JSON.parse(value)
      setCustomerInfo(value)
    }
  }, [customerDetail])

  async function get_country() {
    const resp = await get_country_list();
    if (resp && resp.message && resp.message.length != 0) {
      countryList = resp.message;
      setCounty(resp.message);
      get_state(resp.message[0].value);
    }
  }

  async function get_state(selectedCountry) {
    const resp = await get_country_states(selectedCountry);
    if (resp && resp.message && resp.message.length != 0) {
      stateList = resp.message
      setState(resp.message);
      if (edit_address && edit_address.country != '') {
        let formData = {}
        formData.country = countryList.find((res) => { return res.label == edit_address.country })
        formData.state = stateList.find((res) => { return res.label == edit_address.state })
        setValue('country', formData.country);
        setValue('state', formData.state);
        setSelectedValues(formData);
      }
    }
  }

  const onSubmit = (data) => {
   
    data.zipcode = data.pincode;
    data.addr1 = data.address;
    data.is_default = false;
    data.country = data.country.value;
    data.state = data.state.value;
    data.customer = localStorage['customerRefId']
    data.is_default = index
    // hide(data);
    if (edit_address && edit_address.name) {
      data.name = edit_address.name;
      data.parent = localStorage['customerRefId']
      address_update(data)
    } else {
      address_insert(data);
    }
  };

  async function address_insert(data) {
    const resp = await insert_address(data);
    if (resp && resp.message && resp.message.name) {
      dispatch(setAddress(resp.message));
      hide(resp.message);
      reset();
      toast.success('Address added successfully');
      // customerInfo.address.push(resp.message);
      // setCustomerInfo(customerInfo);
    } else {
      toast.error(resp.message.message);
    }
  }

  async function address_update(data) {
    const resp = await update_address(data);
    if (resp && resp.message && resp.message.name ) {
      // console.log(resp.message);
      reset();
      hide(resp.message);
      UpdateAddressValues(resp.message)
      toast.success('Address updated successfully');
      // dispatch(updateAddress(resp.message));

      // customerInfo.address.push(resp.message);
      // setCustomerInfo(customerInfo);
    } else {
      toast.error(resp.message.message);
    }
  }

  function UpdateAddressValues(value) {
    let name = value.name
    let is_default = value.is_default

    customerInfo.address.map((r, i) => {
      if (r.name == name) {
        customerInfo.address[i] = value
      }

      if (is_default == 1 && r.name != name) {
        r.is_default = 0
      }

    })

    // console.log('customerInfo.address',customerInfo.address)
  //  console.log(customerInfo,"customerinf")
    dispatch(setDetail(customerInfo))

    // state.customerDetail.address = address 
  }

  const setFormsValue = (selectedOption, field) => {
    // console.log(selectedOption,field);
    field.name = selectedOption.value;
    field.value = selectedOption.value;
  }

  const validatePhoneNumber = (value) => {
    if (!value) {
      return 'Phone is required';
    }

    const minPhoneLength = webSettings.phone_vaidation.min_phone_length;
    const maxPhoneLength = webSettings.phone_vaidation.max_phone_length;

    if (value.length < minPhoneLength || value.length > maxPhoneLength) {
      return `Phone number must be ${minPhoneLength} digits`;
    }

    // if (value.length !== webSettings.phone_vaidation.min_phone_length) {
    //   return 'Phone number must be 10 digits';
    // }

    return true; // Validation passed
  };

  const validateZipCode = (value) => {
    if (!value) {
      return 'Zip code is required';
    }

    const zipCodeLength = webSettings.picode_vaidation.min_pincode_length;

    const isValidZipCode = new RegExp(`^\\d{${zipCodeLength}}$`).test(value);
    if (!isValidZipCode) {
      return `Zip code must be a ${zipCodeLength}-digit number`;
    }


    // const isValidZipCode = /^\d{6}$/.test(value);
    // if (!isValidZipCode) {
    //   return 'Zip code must be a 6-digit number';
    // }

    return true; // Validation passed
  };

  const handleClick = () => {
    handleSubmit(onSubmit)();
  };

  function isDefault() {
    // console.log(edit_address)
    // edit_address.is_default = edit_address.is_default == 1 ? 0 : 1
    let value = index == 1 ? 0 : 1
    setIndex(value);
  }

 
    const numberInputOnWheelPreventChange = (e) => {
      e.preventDefault();
      e.target.blur()
      e.stopPropagation()
        setTimeout(() => {
          e.target.focus()
      }, 0)
  }

  const handleKeyDown=(event)=>{
    if (event.keyCode === 38 || event.keyCode === 40) {
      event.preventDefault();
      event.stopPropagation(); 
    }

  }

  return (
    <div className={`${modal ? ' h-full' : null} flex flex-col w-full`}>
      {modal && <h6 className='header border-b-[1px] border-slate-200 h-[45px] flex items-center text-[16px] font-semibold p-[10px] mb-[10px]'>{edit_address ? 'Edit Address' : 'Add Address'}</h6>}
      <form className={`${modal ? 'px-[20px]' : null} overflow-auto scrollbarHide h-full`} onSubmit={handleSubmit(onSubmit)}>
        <div className={`box_ flex gap-[10px]`}>
          <div className={`${styles.flex_2} `}>
            <Controller name="first_name" control={control} rules={{ required: 'First Name is required' }} render={({ field }) => (<input className={`${styles.custom_input} w-full`} type="text" placeholder="First name" id="first_name" {...field} />)} />
            {errors.first_name && <p className={`${styles.danger}`}>{errors.first_name.message}</p>}
          </div>
          <div className={`${styles.flex_2} `}>
            <Controller name="last_name" control={control} rules={{ required: 'Last Name is required' }} render={({ field }) => (<input className={`${styles.custom_input} w-full`} type="text" placeholder="Last name" id="last_name" {...field} />)} />
            {errors.last_name && <p className={`${styles.danger}`}>{errors.last_name.message}</p>}
          </div>
        </div>


        <Controller name="address" control={control} rules={{ required: 'Address is required' }} render={({ field }) => (<input className={`${styles.custom_input} w-full`} type="text" placeholder="Address" id="address" {...field} />)} />
        {errors.address && <p className={`${styles.danger}`}>{errors.address.message}</p>}


        <Controller name="city" control={control} rules={{ required: 'City is required' }} render={({ field }) => (<input className={`${styles.custom_input} w-full`} type="text" placeholder="City" id="city" {...field} />)} />
        {errors.city && <p className={`${styles.danger}`}>{errors.city.message}</p>}


        {/* <div className={`box_ flex gap-[10px] flex-wrap md:gap-y-[0px]`}> */}
        {/* ${styles.flex_2}  */}
        <div className={`md:flex-[0_0_calc(50%_-_5px)] `}>
          <Controller
            name="state"
            control={control}
            rules={{ required: 'State is required' }}
            render={({ field }) => (
              <Select
                className={`${styles.custom_input1} w-full`}
                placeholder="State"
                {...field}
                defaultValue={
                  selectedValues && selectedValues['state']
                    ? { value: selectedValues['state'], label: selectedValues['state'] }
                    : null
                }
                options={stateList}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: 'none',
                    height: '43px',
                  }),
                  // Other styles overrides
                }}
              />
            )}
          />
          {errors.state && <p className={`${styles.danger}`}>{errors.state.message}</p>}
        </div>


        <div className={`md:flex-[0_0_calc(50%_-_5px)]`}>
          <Controller name="pincode" control={control} rules={{ validate: validateZipCode }} render={({ field }) => (<input className={`${styles.custom_input} w-full`} type="number" placeholder="Zip code" id="pincode" {...field}  onWheel={numberInputOnWheelPreventChange} onKeyDown={handleKeyDown}/>)} />
          {errors.pincode && <p className={`${styles.danger}`}>{errors.pincode.message}</p>}
        </div>

        {/* </div> */}

        <Controller
          name="country"
          control={control}
          rules={{ required: 'Country is required' }}
          render={({ field }) => (
            <Select
              className={`${styles.custom_input1} w-full`}
              placeholder="Country"
              {...field}
              defaultValue={
                selectedValues && selectedValues['country']
                  ? { value: selectedValues['country'], label: selectedValues['country'] }
                  : null
              }
              options={countryList}
              styles={{
                control: (provided) => ({
                  ...provided,
                  border: 'none',
                  height: '43px',
                }),
                // Other styles overrides
              }}
            />
          )}
        />
        {errors.country && <p className={`${styles.danger}`}>{errors.country.message}</p>}

        <Controller name="phone"    control={control} rules={{ validate: validatePhoneNumber }} render={({ field }) => (<input className={`${styles.custom_input} ${styles.input1} w-full`} type="number" placeholder="Phone" id="phone no_input"  {...field} onWheel={numberInputOnWheelPreventChange} onKeyDown={handleKeyDown}/>)} />
        {errors.phone && <p className={`${styles.danger}`}>{errors.phone.message}</p>}

        <Controller name="checkbox" control={control} render={({ field }) => (
          <div onClick={() => { isDefault() }} className='checkbox flex items-center gap-[6px] min-h-[30px] cursor-pointer'>
            <input type="checkbox" checked={index == 1 ? true : false} className="w-[16px] h-[16px] rounded-[5px] cursor-pointer"></input>
            <span className='text-[12px] font-normal capitalize'>Set As Default</span>
          </div>
        )} />


      </form>

      <div class="flex m-[15px] justify-center items-center">
        <button onClick={() => { handleClick() }} className={`primary_btn text-[14px] h-[40px] w-[50%]`} type="submit" >{(edit_address && edit_address.name) ? 'Update' : 'Save'}</button>
      </div>

    </div>
  )
}
