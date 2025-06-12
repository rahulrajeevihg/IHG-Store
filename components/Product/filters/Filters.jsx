import { useState, useMemo, Fragment, useEffect } from 'react'
import dynamic from 'next/dynamic'
const CurrentProductFilter = dynamic(() => import('@/components/Product/filters/CurrentProductFilter'))
const BrandsFilter = dynamic(() => import('@/components/Product/filters/BrandsFilter'))
const AttributeFilter = dynamic(() => import('@/components/Product/filters/AttributeFilter'))
// import CurrentProductFilter from '@/components/Product/filters/CurrentProductFilter'
// import BrandsFilter from '@/components/Product/filters/BrandsFilter'
// import AttributeFilter from '@/components/Product/filters/AttributeFilter'
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { Switch } from '@headlessui/react'
import clsx from 'clsx'
import RangeSlider from './RangeSlider'
import { typesense_search_items } from '@/libs/api'
import MultiSelectBox from './MultiSelect'
import { useRouter } from 'next/router'
import Select from 'react-select';

export default function Filters({ mastersData, filtersList, ProductFilter, closeModal, clearFilter, filters, setFilters, priceBetween, setPriceBetween, fetchResults, foundValue }) {
  const input_classname = "border bordert-[1px] border-[#0000000D] p-[5px_10px] text-[14px] rounded-[5px] mt-[5px] w-full"
  const label_classname = "text-[14px] md:text-[13px] font-semibold"
  const [switchValues, setSwitchValues] = useState({
    upcoming: false,
    promotion: false,
    stock: false,
  })

  const [priceRange, setPriceRange] = useState({ min: 0, max: 350 })
  const [stockRange, setStockRange] = useState({ min: 0, max: 350 })

  const router = useRouter()

  useEffect(() => {
    // console.log('fd', filters)

  }, [filters, router.query])

  // const changeValue = (type, value) => {
  //   setSwitchValues(prev => {
  //     const obj = {}
  //     obj[type] = value
  //     return { ...prev, ...obj }
  //   })
  // }


  const changeValue = (type, value) => {
    setFilters(prev => {
      const obj = {}
      obj[type] = value
      return { ...prev, ...obj }
    })
  }

  const filterSubmit = () => {
    // console.log(filtersList, "filtersList")
  }

  const handleChange = async (e, type) => {
    let obj = {}
    obj[type] = e.target.value
    ProductFilter({ ...obj })

    const value = await typesense_search_items(e.target.value, "name,description")
    // console.log(value, "value")
  }


  // let debounceTimer;
  // const debounceSearch = (inputText) => {
  //   clearTimeout(debounceTimer);
  //   debounceTimer = setTimeout(() => {
  //     getSearchValues(inputText)
  //     // console.log('Perform search for:', inputText);
  //   }, 300); // Adjust the debounce delay (in milliseconds) 
  // };
  const options = ["LTECH", "Option 2", "Option 3", "Option 4"];
  let sortByOptions = [
    { text: 'Relevance', value: '' },
    { text: 'Created Date', value: 'creation:desc' },
    { text: 'Price low to high', value: 'rate:asc' },
    { text: 'Price high to low', value: 'rate:desc' },
    { text: 'Stock low to high', value: 'stock:asc' },
    { text: 'Stock high to low', value: 'stock:desc' },
    { text: 'Mostly Sold', value: 'sold_last_30_days:desc' },
    { text: 'Least Sold', value: 'sold_last_30_days:asc' },
  ]

  const productTypeOptions = [
    "Listed",
    "Unlisted",
    "Obsolete"
  ]

  const multiSelectOptions = [
    { type: "brand", label: "Brands", options: mastersData.brand || [] },
    { type: "category_list", label: "Category List", options: mastersData.category_list || [] },
    { type: "product_type", label: "Product Type", options: productTypeOptions || [] },
    { type: "item_group", label: "Item Group", options: mastersData.item_group || [] },
    { type: "ip_rate", label: "IP Rate", options: mastersData.ip_rate || [] },
    { type: "power", label: "Power", options: mastersData.power || [] },
    { type: "color_temp_", label: "Color Temp", options: mastersData.color_temp_ || [] },
    { type: "body_finish", label: "Body Finish", options: mastersData.body_finish || [] },
    { type: "input", label: "Input", options: mastersData.input || [] },
    { type: "mounting", label: "Mounting", options: mastersData.mounting || [] },
    { type: "output_current", label: "Output Current", options: mastersData.output_current || [] },
    { type: "output_voltage", label: "Output Voltage", options: mastersData.output_voltage || [] },
    { type: "lamp_type", label: "Lamp Type", options: mastersData.lamp_type || [] },
    { type: "lumen_output", label: "Lumen Output", options: mastersData.lumen_output || [] },
    { type: "beam_angle", label: "Beam Angle", options: mastersData.beam_angle },
    { type: "material", label: "Material", options: mastersData.material || [] },
    { type: "warranty_", label: "Warranty", options: mastersData.warranty_ || [] },
    // { type: "product_type", label: "Product Type", options: options },
    // { type: "has_variants", label: "Has Variants", options: mastersData.has_variants || [] },
    // { type: "custom_in_bundle_item", label: "Custom In Bundle Item", options: mastersData.custom_in_bundle_item || [] },
  ];
  const handleSelectionChange = (type, selectedArray) => {
    // console.log("Selected Options:", selectedArray);

    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: selectedArray,
    }));
    // console.log("filters", filters)
  };

  return (
    <>
      {/* bg-[#F0F0F0] */}
      <div className='border-b p-[7px_14px] md:my-[5px] md:hidden sticky top-0 bg-white z-[9]'>
        <h4 className={`text-[16px] font-semibold md:text-[14px] text-center transition-opacity duration-[0.5s] ease-in-out `}>Total  {foundValue}  Products</h4>
      </div>
      <div className='md:hidden  px-[20px] tab:pb-[40px]'>


        {/* <div className='pt-[15px] md:p-t-[10px]'> */}
        {/* <label htmlFor="code" className={`${label_classname}`}>Search By Code</label> */}
        {/* <input name='code' onInput={(e) => handleChange(e, 'code')} className={`${input_classname}`} type='text' placeholder='Search by code' /> */}
        {/* <input name='code' onChange={(e) => setFilters({ ...filters, item_code: e.target.value })} className={`${input_classname}`} type='text' placeholder='Search by code' /> */}
        {/* </div> */}

        <div className='pt-4 md:py-2'>
          <label htmlFor="code" className={`${label_classname}`}>Search By Description</label>
          <input name='code' value={filters.item_description} onChange={(e) => setFilters({ ...filters, item_description: e.target.value })} className={`${input_classname}`} type='text' placeholder='Search by description' />
        </div>


        {/* <div>
          <SwitchCom label_classname={label_classname} label1={"Upcoming Products"} type={'upcoming'} checked={filters.upcoming_products} label2={"Show Upcoming products only"} changeValue={changeValue} />
          <SwitchCom label_classname={label_classname} label1={"Show Promotion"} type={'promotion'} checked={switchValues.promotion} label2={"Show promotion products only"} changeValue={changeValue} />
          <SwitchCom label_classname={label_classname} label1={"InStock"} type={'stock'} checked={switchValues.stock} label2={"Show Instock products only"} changeValue={changeValue} />
        </div> */}

        {/* <div>
          <SwitchComponent label_classname={label_classname} label1={"Upcoming Products"} type={'hot_product'} checked={filters.hot_product} label2={"Show Upcoming products only"} changeValue={changeValue} />
          <SwitchComponent label_classname={label_classname} label1={"Show Promotion"} type={'show_promotion'} checked={filters.show_promotion} label2={"Show promotion products only"} changeValue={changeValue} />
          <SwitchComponent label_classname={label_classname} label1={"In Stock"} type={'in_stock'} checked={filters.in_stock} label2={"Show Instock products only"} changeValue={changeValue} />
          <SwitchComponent label_classname={label_classname} label1={"Has Variants"} type={'has_variants'} checked={filters.has_variants} label2={"Show Variants products only"} changeValue={changeValue} />
          <SwitchComponent label_classname={label_classname} label1={"Bundle Item"} type={'custom_in_bundle_item'} checked={filters.custom_in_bundle_item} label2={"Show Bundle Item products only"} changeValue={changeValue} />
        </div> */}

        {/* <div className='py-4 flex flex-col gap-2'>
          <label htmlFor="" className={`${label_classname}`}>Sort by</label>
          <select value={filters.sort_by} onChange={(e)=> setFilters({...filters, sort_by: e.target.value})} className={` outline-none border-2 p-2 rounded-md border-gray-300`} placeholder="Select options" defaultValue={"Select Options"}>
            {
              sortByOptions.map((item, i) => (
                <option value={item.value}>{item.text}</option>
              ))
            }
          </select>
        </div> */}

        {/* <div className='py-4 md:py-2'>
          <RangeSlider MIN={0} MAX={350} ranges={priceRange} setRanges={setPriceRange} label={'Price'} label_classname={label_classname} />
        </div> */}
        <div className='py-4 md:py-2'>
          <RangeSlider MIN={0} MAX={100000} ranges={filters.price_range} setRanges={(ranges) => { console.log(ranges);
            setFilters({ ...filters, price_range: { ...ranges } });
          }
          } label={'Price'} label_classname={label_classname} />
        </div>

        <div className='py-4 md:py-2'>
          <RangeSlider MIN={0} MAX={100000} ranges={filters.stock_range}
            setRanges={(ranges) =>
              setFilters({ ...filters, stock_range: ranges })
            } label={'Stock'} label_classname={label_classname} />
        </div>

        {/* <div className='py-4 md:py-2'>
          <RangeSlider MIN={0} MAX={350} ranges={stockRange} setRanges={setStockRange} label={'Stock'} label_classname={label_classname} />
        </div> */}

        {/* <CurrentProductFilter category_list={filtersList.category_list} /> */}
        {/* {(filtersList.brand_list && filtersList.brand_list.length != 0) && <BrandsFilter brand_list={filtersList.brand_list} ProductFilter={ProductFilter} />} */}

        {/* <div className='my-3 flex flex-col'>
          <label htmlFor="" className={`${label_classname}`}>Product Type</label>
          <select value={filters.product_type} onChange={(e) => setFilters((prev) => ({ ...prev, product_type: e.target.value }))} className={` outline-none border-[1px] p-2 py-3 rounded-md border-gray-300`} placeholder="Select options" defaultValue={"Select Options"}>
            {
              productTypeOptions.map((item, i) => (
                <option value={item.value} key={i}>{item.label}</option>
              ))
            }
          </select>
        </div> */}
        <div className=''>
          {multiSelectOptions.map(({ type, label, options }) => (
            <MultiSelectBox
              key={type}
              options={options}
              type={type}
              label={label}
              onSelectionChange={handleSelectionChange}
              label_classname={label_classname}
              filters={filters}
              clearFilter={clearFilter}
            />
          ))}
        </div>

        <div className='pt-1 md:py-2 lg:mb-20 tab:mb-40'>
          <label htmlFor="dimension" className={`${label_classname}`}>Dimension</label>
          <input name='dimension' value={filters.dimension} onChange={(e) => setFilters({ ...filters, dimension: e.target.value })} className={`${input_classname}`} type='text' placeholder='Search by dimension' />
        </div>

        {/* {(filtersList.attribute_list && filtersList.attribute_list.length != 0) && <AttributeFilter attribute_list={filtersList.attribute_list} ProductFilter={ProductFilter} />} */}
        {/* <RatingFilter ProductFilter={ProductFilter} /> */}
        {/* <PriceFilter ProductFilter={ProductFilter} /> */}

        {/* position: fixed;
    bottom: 0;
    width: auto;
    background: #fff;
    z-index: 99;
    width: 20%;
} */}
      </div >
      <div className={`fixed bottom-0 md:hidden tab:w-[35%] lg:w-[20%]  p-[12px_10px] bg-[#fff] z-[99]`} style={{ boxShadow: '-1px 0px 1px 2px #eeeeee' }}>
        <div className='w-full flex items-center gap-[10px] justify-between'>
          <button className='w-[50%] text-[#000] bg-[#ddd] rounded-[5px] h-[35px] px-[10px]' onClick={() => clearFilter()}>Clear All</button>
          <button className='w-[50%] primary_bg text-white rounded-[5px] h-[35px] px-[10px]' onClick={() => fetchResults()}>Filter</button>
        </div>
      </div>

      <div className='lg:hidden flex flex-col h-full'>
        <h5 className='text-[15px] font-semibold p-[10px_10px_0_10px]'>Filters</h5>


        <div className='h-full overflow-auto scrollbarHide p-[10px]'>

          {/* <div >
            <label htmlFor="code" className={`${label_classname}`}>Search By Code</label>
            <input name='code' className={`${input_classname}`} type='text' placeholder='Search by code' />
          </div> */}

          <div className='py-4 md:py-2'>
            <label htmlFor="code" className={`${label_classname}`}>Search By Description</label>
            <input name='code' value={filters.item_description} onChange={(e) => setFilters({ ...filters, item_description: e.target.value })} className={`${input_classname}`} type='text' placeholder='Search by description' />
          </div>


          <div>
            <SwitchComponent label_classname={label_classname} label1={"Upcoming Products"} type={'hot_product'} checked={filters.hot_product} label2={"Show Upcoming products only"} changeValue={changeValue} />
            <SwitchComponent label_classname={label_classname} label1={"Show Promotion"} type={'show_promotion'} checked={filters.show_promotion} label2={"Show promotion products only"} changeValue={changeValue} />
            <SwitchComponent label_classname={label_classname} label1={"In Stock"} type={'in_stock'} checked={filters.in_stock} label2={"Show Instock products only"} changeValue={changeValue} />
            <SwitchComponent label_classname={label_classname} label1={"Has Variants"} type={'has_variants'} checked={filters.has_variants} label2={"Show Variants products only"} changeValue={changeValue} />
            <SwitchComponent label_classname={label_classname} label1={"Bundle Item"} type={'custom_in_bundle_item'} checked={filters.custom_in_bundle_item} label2={"Show Bundle Item products only"} changeValue={changeValue} />
          </div>

          <div className='py-4 md:py-2'>
            <RangeSlider MIN={0} MAX={100000} filters={filters} ranges={filters.price_range} setRanges={(ranges) => {
              setFilters({ ...filters, price_range: { ...ranges } });
            }
            } label={'Price'} label_classname={label_classname} />
          </div>

          <div className='py-4 md:py-2'>
            <RangeSlider MIN={0} MAX={100000} filters={filters} ranges={filters.stock_range}
              setRanges={(ranges) =>
                setFilters({ ...filters, stock_range: ranges })
              } label={'Stock'} label_classname={label_classname} />
          </div>

          {/* <div className='my-3 flex flex-col'>
            <label htmlFor="" className={`${label_classname}`}>Product Type</label>
            <select value={filters.product_type} onChange={(e) => setFilters((prev) => ({ ...prev, product_type: e.target.value }))} className={` outline-none border-[1px] p-2 py-3 rounded-md border-gray-300`} placeholder="Select options" defaultValue={"Select Options"}>
              {
                productTypeOptions.map((item, i) => (
                  <option value={item.value} key={i}>{item.label}</option>
                ))
              }
            </select>
          </div> */}
          <div className=''>
            {multiSelectOptions.map(({ type, label, options }) => (
              <MultiSelectBox
                key={type}
                options={options}
                type={type}
                label={label}
                onSelectionChange={handleSelectionChange}
                label_classname={label_classname}
                filters={filters}
                clearFilter={clearFilter}
              />
            ))}
          </div>

          <div className='md:py-2'>
            <label htmlFor="dimension" className={`${label_classname}`}>Dimension</label>
            <input name='dimension' value={filters.dimension} onChange={(e) => setFilters({ ...filters, dimension: e.target.value })} className={`${input_classname}`} type='text' placeholder='Search by dimension' />
          </div>


          {/* {(filtersList.brand_list && filtersList.brand_list.length != 0) && <BrandsFilter brand_list={filtersList.brand_list} ProductFilter={ProductFilter} />} */}
          {/* {(filtersList.attribute_list && filtersList.attribute_list.length != 0) && <AttributeFilter attribute_list={filtersList.attribute_list} ProductFilter={ProductFilter} />} */}
          {/* <RatingFilter ProductFilter={ProductFilter} />
          <PriceFilter ProductFilter={ProductFilter} /> */}
        </div>

        <div className={'flex gap-[5px] p-[10px] mt-[10px] border-t-[1px] border-t-slate-100 bg-[#fff]'} style={{ boxShadow: '-1px 0px 1px 2px #eeeeee' }}>
          <button className='w-[50%] text-[#000] bg-[#ddd] rounded-[5px] h-[35px] px-[10px]' onClick={() => { clearFilter(), closeModal() }}>Clear All</button>
          <button className='w-[50%] primary_bg text-white rounded-[5px] h-[35px] px-[10px]' onClick={() => { fetchResults(), closeModal() }}>Filter</button>
        </div>

        
      </div>


    </>
  )
}

const RatingFilter = ({ ProductFilter }) => {

  const [ratingCount, setRating] = useState(-1);

  let productFilters = useSelector((state) => state.ProductListFilters.filtersValue)

  useMemo(() => {
    let selectedAttributes = [];
    let data_1 = JSON.stringify(productFilters.selectedAttributes);
    selectedAttributes = JSON.parse(data_1);
    let find = selectedAttributes.find(res => { return res.filterType == 'Rating' })
    find ? setRating(find.value) : setRating(0)
  }, [productFilters])


  function setRatingValues(rating) {

    let selectedAttributes = [];

    setRating(rating)

    let data_1 = JSON.stringify(productFilters.selectedAttributes);
    selectedAttributes = JSON.parse(data_1);

    if (rating > 0) {
      if (selectedAttributes.length == 0) {
        let obj = { option_value: rating + ' Rating', value: rating, 'filterType': 'Rating' }
        selectedAttributes.push(obj)
        ProductFilter({ 'rating': rating, 'selectedAttributes': selectedAttributes })
      } else {
        let find = selectedAttributes.find(res => { return res.filterType == 'Rating' })
        if (find) {
          selectedAttributes.map(res => {
            if (res.filterType == 'Rating') {
              res.option_value = rating + ' Rating'
              res.value = rating
            }
          })

          ProductFilter({ 'rating': rating, 'selectedAttributes': selectedAttributes })

        } else {
          let obj = { option_value: rating + ' Rating', 'filterType': 'Rating' }
          selectedAttributes.push(obj)
          ProductFilter({ 'rating': rating, value: rating, 'selectedAttributes': selectedAttributes })
        }
      }
    } else {
      selectedAttributes = selectedAttributes.filter(res => { return res.filterType != 'Rating' })
      ProductFilter({ 'rating': rating, value: rating, 'selectedAttributes': selectedAttributes })
    }

  }

  return (
    <div className='border-[1px] border-slate-100 rounded-[5px] my-[10px]' >
      <h5 className='text-[14px] font-semibold line-clamp-1 light_bg p-[10px]'>Rating</h5>

      <div className='p-[10px]'>
        {[1, 2, 3, 4, 5, 6].map((res, rating) => {
          return (
            <div onClick={() => { setRatingValues(rating) }} key={rating} className="flex items-center space-x-1 star-icon cursor-pointer py-[2px]">
              <input checked={rating == ratingCount} type="radio"></input>
              {rating == 0 ?
                <p className='text-[15px]'>All</p>
                :
                [1, 2, 3, 4, 5].map((r, index) => {
                  return (
                    <svg className={`${((rating - 1) >= index) ? 'active' : 'inActive'} w-[18px] h-[18px]`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20"><path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" /></svg>
                  )
                })
              }
            </div>
          )
        })}
      </div>

    </div>
  )
}

const PriceFilter = ({ ProductFilter }) => {

  let productFilters = useSelector((state) => state.ProductListFilters.filtersValue)


  useMemo(() => {
    if (typeof window !== 'undefined') {

      if (productFilters) {
        let selectedAttributes = [];

        let data_1 = JSON.stringify(productFilters.selectedAttributes);
        selectedAttributes = JSON.parse(data_1);

        if (selectedAttributes.length != 0) {

          let checkValue = selectedAttributes.find(res => { return (res.filterType && res.filterType == 'Min_price') })
          if (checkValue) {
            document.getElementById('minPrice').value = checkValue.value
          } else {
            document.getElementById('minPrice').value = ''
          }

          let checkValue_1 = selectedAttributes.find(res => { return (res.filterType && res.filterType == 'Max_price') })
          if (checkValue_1) {
            document.getElementById('maxPrice').value = checkValue_1.value
          } else {
            document.getElementById('maxPrice').value = ''
          }

        } else {
          setTimeout(() => {
            if (document.getElementById('minPrice') && document.getElementById('maxPrice')) {
              document.getElementById('minPrice').value = ''
              document.getElementById('maxPrice').value = ''
            }
          }, 500)
        }

      }

    }
  }, [productFilters])

  function priceFilterFn() {

    let min = document.getElementById('minPrice')?.value
    let max = document.getElementById('maxPrice')?.value
    min = min = '' ? 0 : min
    max = max = '' ? 0 : max
    // console.log(min,max);

    if (Number(min) <= Number(max)) {
      checkPrices(min, max)
    } else if (Number(max) == 0) {
      checkPrices(min, max)
    } else {
      toast.error('Min price value cannot be greater than max price value');
    }
  }

  function checkPrices(min, max) {

    let selectedAttributes = [];

    let data_1 = JSON.stringify(productFilters.selectedAttributes);
    selectedAttributes = JSON.parse(data_1);

    let checkValue = selectedAttributes.findIndex(res => { return (res.filterType && res.filterType == 'Min_price') })
    if (checkValue >= 0) {
      if (min > 0) {
        selectedAttributes.map(res => {
          if (res.filterType == 'Min_price') {
            res.option_value = min + ' Min Price'
            res.value = min
          }
        })
      } else {
        selectedAttributes.splice(checkValue, 1)
      }
    } else if (min > 0) {
      let obj = { option_value: min + ' Min Price', value: min, 'filterType': 'Min_price' }
      selectedAttributes.push(obj)
    }

    let checkValue_1 = selectedAttributes.findIndex(res => { return (res.filterType && res.filterType == 'Max_price') })
    if (checkValue_1 >= 0) {
      if (max > 0) {
        selectedAttributes.map(res => {
          if (res.filterType == 'Max_price') {
            res.option_value = max + ' Max Price'
            res.value = max
          }
        })
      } else {
        selectedAttributes.splice(checkValue_1, 1)
      }
    } else if (max > 0) {
      let obj = { option_value: max + ' Max Price', value: max, 'filterType': 'Max_price' }
      selectedAttributes.push(obj)
    }

    ProductFilter({ 'minPrice': min, 'maxPrice': max, 'selectedAttributes': selectedAttributes })

  }

  return (
    <div className='border-[1px] border-slate-100 rounded-[5px]' >
      <h5 className='text-[14px] font-semibold line-clamp-1 light_bg p-[10px]'>Price</h5>
      <div className='flex gap-[8px] p-[10px]'>
        <div className='w-[35%] border-[1px] border-slate-100 rounded-[5px] h-[40px]'> <input id='minPrice' type='number' className='text-[14px] w-full h-[35px] rounded-[5px] px-[10px]' placeholder='Min' /></div>
        <div className='w-[35%] border-[1px] border-slate-100 rounded-[5px] h-[40px]'> <input id='maxPrice' type='number' className='text-[14px] w-full h-[35px] rounded-[5px] px-[10px]' placeholder='Max' /></div>
        <button onClick={() => { priceFilterFn() }} className='w-[30%] primary_bg tex-[14px] text-[#fff] h-[40px] rounded-[5px]'>Go</button>
      </div>
    </div>
  )
}


const SwitchCom = ({ label1, label2, label_classname, checked, changeValue, type }) => {
  const label2_class = 'text-[#7C7C7C] text-[12px]'
  return (
    <div className='py-4'>
      <div className='flex items-center gap-5 justify-between'>
        <h5 className={`${label_classname}`}>{label1}</h5>
        <Switch checked={checked} onChange={(e) => changeValue(type, e)} as={Fragment}>
          {({ checked, disabled }) => (
            <button
              className={clsx(
                'group inline-flex h-6 w-11 items-center rounded-full',
                checked ? 'bg-[#000]' : 'bg-gray-200',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only"></span>
              <span
                className={clsx('size-4 rounded-full bg-white transition', checked ? 'translate-x-6' : 'translate-x-1')}
              />
            </button>
          )}
        </Switch>
      </div>

      <p className={`${label2_class}`}>{label2}</p>
    </div>
  )
}



const SwitchComponent = ({ label1, label2, label_classname, checked, changeValue, type, filters }) => {
  const label2_class = 'text-[#7C7C7C] text-[12px]'
  return (
    <div className='pb-4'>
      <div className='flex items-center gap-5 justify-between'>
        <h5 className={`${label_classname}`}>{label1}</h5>
        <Switch checked={checked} onChange={(e) => changeValue(type, e)} as={Fragment}>
          {({ checked, disabled }) => (
            <button
              className={clsx(
                'group inline-flex h-6 w-11 items-center rounded-full',
                checked ? 'bg-[#000]' : 'bg-gray-200',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only"></span>
              <span
                className={clsx('size-4 rounded-full bg-white transition', checked ? 'translate-x-6' : 'translate-x-1')}
              />
            </button>
          )}
        </Switch>
      </div>

      <p className={`${label2_class}`}>{label2}</p>
    </div>
  )
}