import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router'

export default function CurrentProductFilter({category_list,isMobile}) {

  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  let  [current_category,setCurrent_category] = useState()
  let  [current_category_mobile,setCurrent_category_mobile] = useState()
  const router = useRouter();
  let [child,setChild] = useState({child_1:true})

  let [subCategory,setSubCategory] = useState([])
  let [routerLink,setRouterLink] = useState([])

  useMemo(()=>{

    if(webSettings && webSettings.all_categories && (category_list && category_list.current_category && category_list.current_category.route)){
      let route = category_list.current_category.route.split('/')[0]
      let value = webSettings.all_categories.find(res=>{return res.route == route})

      if(value && value.child && value.child.length != 0){
        let obj = {'route':value.route,category_name:'All'}
        let newChild = [obj, ...value.child];

        setCurrent_category_mobile(newChild)
        setCurrent_category(value);

         let route_1 = category_list.current_category.route.split('/')
         let value_1 = value.child.find(res=>{return res.route == (route_1[0] + '/' + route_1[1])})
          if(value_1 && value_1.child && value_1.child.length != 0){
           let obj = {'route':value_1.route,category_name:'All' }
           let newChild = [obj, ...value_1.child];
           setSubCategory(newChild)
          }else{
           setSubCategory([])
          }
        
      }else{
        setCurrent_category_mobile([])
        setCurrent_category(value);
      }

      let route_1 = category_list.current_category.route.split('/')
      setRouterLink(route_1) 

      setTimeout(() => {
        let scrollDiv =  route_1.length == 1 ? ('/' + route_1[0]) : ('/' + route_1[0] + '/' + route_1[1])
        const element1 = document.getElementById(scrollDiv + 'scroll');
        element1 ? element1.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }) : null
        const element = document.getElementById(router.asPath + 'scroll_1');
        element ? element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" }) : null
      }, 800);

    }

  },[webSettings,category_list])

  

  function navigate(child1){
    child1.route ? router.push('/' + child1.route) : null

    if(child1.category_name != 'All'){
      if(child1 && child1.child && child1.child.length != 0){
        let obj = {'route':child1.route,category_name:'All'};
        let newChild = [obj, ...child1.child];
        setSubCategory(newChild)
       }else{
       setSubCategory([])
       }
    }

  }

  return (
    <>
    {(current_category && !isMobile) && 
      <div className='md:hidden border-[1px] border-slate-100 rounded-[5px]'>
         <h6 onClick={()=>{setChild({...child, child_1: !child.child_1})}} className="cursor-pointer flex items-center gap-[5px] light_bg p-[6px_8px] min-h-[48px]">
          <span className={`text-[14px] font-semibold line-clamp-1`}>Category</span>
        </h6>
        <h6 onClick={()=>{setChild({...child, child_1: !child.child_1})}} className="cursor-pointer flex items-center gap-[5px] p-[6px_8px] min-h-[48px]">
          <Image className='h-[10px] object-contain' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
          <span className={`text-[14px] font-semibold line-clamp-1`}>{current_category.category_name}</span>
        </h6>
        {(child && child.child_1) && current_category && current_category.child.length != 0 &&
            <div className='max-h-[300px] overflow-auto scrollbarHide'>

            {current_category.child.map((child1,index1)=>{
              return(
                <>
             
                  <h6  key={index1} className="flex items-center gap-[5px] pl-[13px] min-h-[38px]">
                   <Image onClick={()=>{setChild({...child,activeChild: (child.activeChild && child.activeChild == (index1 + 1)) ? -1 : (index1 + 1)})}} className='cursor-pointer h-[10px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                   <span onClick={()=>{child1.route ? router.push(child1.route) : null}} className={`${(router.asPath == ('/' + child1.route)) ? 'primary_color' : ''} cursor-pointer text-[13px] font-medium line-clamp-1`}>{child1.category_name}</span>
                  </h6>   
                
                  {(child && child.activeChild == (index1 + 1)) && child1.child.length != 0 &&
                    child1.child.map((child2,index2)=>{
                    return(
                      <h6 onClick={()=>{child2.route ? router.push(child2.route) : null}} key={index2} className="flex items-center gap-[5px] pl-[20px] min-h-[38px]">
                       <Image className='cursor-pointer h-[8px] object-contain opacity-60' height={14} width={14} alt='logo' src={'/Arrow/arrowBlack.svg'}></Image>
                       <span  className={`cursor-pointer text-[12px] font-medium line-clamp-1 ${(router.asPath == ('/' + child2.route)) ? 'primary_color' : ''} `}>{child2.category_name}</span>
                      </h6>   
                    ) 
                  })}

                </>
              ) 
            })}

           </div> 
        }
      </div>
    }

    {(current_category_mobile && isMobile) && 
      <div className='lg:hidden border-[1px] border-slate-100 rounded-[5px]'>
        {current_category_mobile.length != 0 &&
          <>
           <div className='flex items-center gap-[10px] w-full overflow-auto scrollbarHide p-[5px_10px]'>
            {current_category_mobile.map((child1,index1)=>{
              return(
                <>
                 {/* router.asPath  == ('/' + child1.route) */}
                  <h6 id={'/' + child1.route + 'scroll'} onClick={()=>{navigate(child1)}} key={index1} className="flex items-center gap-[5px] w-max min-h-[38px]">
                    <span  className={`${(('/' + routerLink[0] + '/' + routerLink[1]) == ('/' + child1.route) || (routerLink.length == 1 && (('/' + routerLink[0]) == ('/' + child1.route)))) ? 'primary_color border_primary rounded-[5px]' : 'border-slate-100'} border-[1px] p-[4px_8px] cursor-pointer text-[13px] font-medium w-max`}>{child1.category_name}</span>
                  </h6>   
                </>
              ) 
             })}
           </div> 

          {(subCategory && subCategory.length != 0) &&
            <div className='border-t-slate-200 border-t-[1px] flex items-center gap-[10px] w-full overflow-auto scrollbarHide p-[10px_10px_5px_10px]'>
              {subCategory.map((sub,index2)=>{
                return(
                <>
                  <h6 id={'/' + sub.route + 'scroll_1'}  onClick={()=>{sub.route ? router.push('/' + sub.route) : null}} key={index2} className="flex items-center w-max gap-[5px]">
                    <span className={`${(router.asPath == ('/' + sub.route)) ? 'primary_color border-b-[#000]' : 'border-b-slate-100'} border-b-[2px] w-max cursor-pointer text-[13px] font-medium`}>{sub.category_name}</span>
                  </h6>   
                </>
                )
              })}
           </div>
          }

          </>
        }
      </div>
    }
    </>
  )
}
