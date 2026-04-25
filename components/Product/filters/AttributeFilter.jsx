import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

export default function AttributeFilter({attribute_list, ProductFilter}) {
 
  let [selectedBrands,setSelectedBrands] = useState([]);
  let [sample,setSample] = useState(-1);
  let [selectedAttributes,setAttribute] = useState([]);

  let productFilters = useSelector((state) => state.ProductListFilters.filtersValue)


   // const { handleUpdata } = useContext(ProductList)

  // const updateMe=(data)=>{
  //     handleUpdata(data)
  // }

  useEffect(()=>{
    attribute_list = attribute_list.filter(res=>{return res.options.length != 0})
  },[attribute_list])

//   const selectBrands = (brand) =>{
//     selectedBrands = [];
//     brand.isActive =! brand.isActive;
//     let activeBrands = attribute_list.filter(res=>{return res.isActive})
//       if(activeBrands.length != 0){
//         activeBrands.map(r=>{
//             selectedBrands = selectedBrands + r.unique_name + ','
//             setSelectedBrands(selectedBrands)
//         })
//       }else{
//         setSelectedBrands('') 
//       }
//       ProductFilter(selectedBrands)
//   }


const selectBrands = (attr,option) =>{

    option.isActive =! option.isActive;

    // let data = JSON.stringify(selectedBrands);
    // selectedBrands = JSON.parse(data);

    selectedBrands = []

    let data_1 = JSON.stringify(productFilters.selectedAttributes);
    selectedAttributes = JSON.parse(data_1);

    if(option.isActive){
      let obj = {...option,...{attr:attr,'filterType':'Attribute'}}
      selectedAttributes.push(obj)
    }else{
      selectedAttributes = selectedAttributes.filter(r=>{return r.unique_name != option.unique_name})
    } 

    let attributeFilters = selectedAttributes.filter(r=>{return r.filterType == 'Attribute'})

    if(attributeFilters.length != 0){

      attributeFilters.map((res,i)=>{
          let findFilter =  selectedBrands.find(r=>{return r.attribute == res.attr})
          if(findFilter){
            selectedBrands.map(r=>{
              if(r.attribute == res.attr){
                  r.value = r.value + res.unique_name + ','
                }
              })
            }else{
              selectedBrands.push({"attribute": res.attr, "value": res.unique_name +','})
            }

            if(i == (attributeFilters.length - 1) ){
              ProductFilter({'attribute':selectedBrands,'selectedAttributes':selectedAttributes})
            }
      })
       
    }else{
      ProductFilter({'attribute':selectedBrands,'selectedAttributes':selectedAttributes})
    }

    setAttribute(selectedAttributes)
    setSample(sample + 1);

}



  return (
    <>

      {attribute_list.map((attr,i)=>{
        return(
            <div key={i} className='border-[1px] border-slate-100 rounded-[5px] my-[10px]'>
                <h5 className='text-[14px] font-semibold line-clamp-1 capitalize light_bg p-[10px]'>{attr.attribute}</h5>
                <div className='p-[10px] max-h-[220px] overflow-auto scrollbarHide'>
                  {attr.options.map((option,index)=>{
                  return(
                      <div onClick={()=>selectBrands(attr.attribute_unique_name ? attr.attribute_unique_name : attr.attribute,option)} key={index} className='checkbox flex items-center gap-[6px] min-h-[30px] cursor-pointer'>
                          <input type="checkbox" checked={option.isActive} className="w-[16px] h-[16px] rounded-[5px] cursor-pointer"></input>
                          <span className='text-[14px] font-normal capitalize'>{option.option_value}</span>
                          {/* + ' (' + option.item_count + ')'  */}
                      </div>     
                  )})}
                </div>  
            </div>
        )
       })}
    </>
  )
}
