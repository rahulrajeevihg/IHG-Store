import { useState } from 'react'
import { useSelector } from 'react-redux';
import CustomSelect from './CustomSelect';

export default function BrandsFilter({ brand_list, ProductFilter }) {

  let [selectedBrands, setSelectedBrands] = useState('')
  let productFilters = useSelector((state) => state.ProductListFilters.filtersValue)

  const selectBrands = (brand) => {
    let selectedAttributes = [];
    selectedBrands = '';

    let data_1 = JSON.stringify(productFilters.selectedAttributes);
    selectedAttributes = JSON.parse(data_1);

    brand.isActive = !brand.isActive;

    if (brand.isActive) {
      let obj = { ...brand, ...{ option_value: brand.brand_name, 'filterType': 'Brand' } }
      selectedAttributes.push(obj)
    } else {
      selectedAttributes = selectedAttributes.filter(r => { return r.unique_name != brand.unique_name })
    }

    let activeBrands = brand_list.filter(res => { return res.isActive })
    if (activeBrands.length != 0) {
      activeBrands.map(r => {
        selectedBrands = selectedBrands + r.unique_name + ','
        setSelectedBrands(selectedBrands)
        // selectedAttributes.push(r)
      })
    } else {
      setSelectedBrands('')
    }
    ProductFilter({ 'brands': selectedBrands, 'selectedAttributes': selectedAttributes })
  }



  return (
    <>


      <h5 className='text-[14px] font-semibold line-clamp-1 '>Brands ({brand_list.length})</h5>

      <div className='py-[5px]'>
        <CustomSelect options={brand_list} onChnage={selectBrands} type='multi' placeholder={'Select Brand'} value={productFilters.selectedBrands} />
        {/* <select onChange={changeValue}>
          {brand_list.map((brand, index) => {
            return (
              <option key={brand.brand_name} className='flex items-center gap-[6px] min-h-[30px] cursor-pointer'>
                {brand.brand_name}
              </option>
            )
          })
          }
        </select> */}


        {/* {brand_list.map((brand, index) => {
            return (
              <div onClick={() => selectBrands(brand)} key={index} className='flex items-center gap-[6px] min-h-[30px] cursor-pointer'>
                <input type="checkbox" checked={brand.isActive} className="custom-checkbox w-[16px] h-[16px] rounded-[5px] cursor-pointer"></input>
                <span className='text-[14px] font-normal'>{brand.brand_name}</span>
                
              </div>
            )
          })
          } */}
      </div>

    </>
  )
}
