import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import useTabView from '@/libs/hooks/useTabView';
import { useDispatch } from 'react-redux';
import { setFilter } from '@/redux/slice/homeFilter';
// import { check_Image } from '@/libs/api';

export default function Navbar({ all_categories, categoryData }) {

  const router = useRouter();
  // const [isDropdownVisible, setDropdownVisible] = useState(false);
  const dispatch = useDispatch()
  let [dropdown, setDropdown] = useState(-1);
  const [dropdown1, setDropdown1] = useState(-1);
  const [showMegamenu, setShowMegamenu] = useState(false);

  let mega_menu = 0;

  // const handleMouseEnter = () => {
  //   setDropdownVisible(true);
  // };

  // const handleMouseLeave = () => {
  //   setDropdownVisible(false);
  // };


  let hoverTimeout;
  let allMenuHoverTimeout;

  const enbleAllMenuSection = (type) => {

    if (type == 'Enter') {
      allMenuHoverTimeout = setTimeout(() => {
        setAllMenu(1)
      }, 800)
    }

  };

  const enbleDropdown = (type, i) => {

    if (dropdown == -1) {
      hoverTimeout = setTimeout(() => {
        getDropDownValues(type, i);
      }, 800);
    } else {
      getDropDownValues(type, i);
    }

  };



  function getDropDownValues(type, i) {
    setDropdown1(-1)
    setDropdown2(-1)
    if (type == 'enter') {
      setDropdown(i)
    } else {
      setDropdown(-1)
    }
  }

  function leaveFormnav() {
    clearTimeout(hoverTimeout);
    clearTimeout(allMenuHoverTimeout);
    setAllMenu(-1)
    setTimeout(() => {
      setAllMenu(-1)
    }, 500)
    setDropdown(-1)
    document.body.classList.remove('active_visible')
  }

  const enbleDropdown1 = (type, i) => {
    if (type == 'enter') {
      setDropdown1(i)
    } else {
      setDropdown1(-1)
    }
  };

  const [dropdown2, setDropdown2] = useState(-1);


  const enbleDropdown2 = (type, i) => {

    if (type == 'enter') {
      setDropdown2(i)
    } else {
      setDropdown2(-1)
    }
  };

  const [moreMenu, setMoreMenu] = useState(-1)
  const [allMenu, setAllMenu] = useState(-1)

  const navigateToDetail = (submenu) => {
    if (submenu.route) {
      setDropdown(-1)
      setDropdown1(-1)
      setMoreMenu(-1)
      setAllMenu(-1)
      router.push('/' + submenu.route)
    }
  };

  const navigateToDetail1 = (submenu) => {
    if (submenu.route) {
      setDropdown(-1)
      setDropdown1(-1)
      setMoreMenu(-1)
      setAllMenu(-1)
      // router.push('/' + submenu.route)
    }
  };



  const enbleDropdownMore = (type) => {
    if (type == 'enter') {
      setMoreMenu(1)
    } else {
      setMoreMenu(-1)
    }
  };


  const tabView = useTabView(); // Use the custom hook

  const changeCategory = (item) => {
    // !router.asPath.includes('list') ? router.replace(`/list?category=${item}`) : null
    router.replace(`/list?category=${item}`, undefined,  { shallow: true });
    dispatch(setFilter({ item_group: [item] }));
    enbleDropdownMore('leave')
    setDropdown(1)
    leaveFormnav()
    // dispatch(setFilter([item]))
    // dispatch(setBrand([]))
  }

  return (
    <>

      {(all_categories && all_categories.length != 0) &&

        // onMouseEnter={() => { setShowMegamenu(true) }} onMouseLeave={() => { setShowMegamenu(false), leaveFormnav() }}
        <div className={`relative flex main-width !m-[0_auto] items-center justify-start`}>
          {/* <div className='flex items-center gap-[5px]'> */}
          {/* <div>
              <Image src={'/Navbar/premium-1.svg'} height={20} width={20} alt='premium' />
            </div>
            <p className='text-[#340C0C] text-[14px] uppercase'>Subscribe To Premium</p> */}
          {/* </div> */}

          <div className={`flex items-center justify-center gap-[8px]`} >
            {/* <div className={`flex items-center justify-center gap-[8px]`} onMouseEnter={handleMouseEnter} > */}


            {mega_menu == 1 &&
              // onMouseLeave={() => enbleAllMenuSection('')} onMouseEnter={() => { enbleAllMenuSection('Enter') }}
              <div className={`relative cursor-pointer pb-[2px]  hoverMenuSec ${allMenu == 1 ? 'active_parent' : ''}`}>
                <span className='flex item-center uppercase mb-[0] gap-[5px] pb-[6px]'>
                  <h6 className={`border-b-[3px] uppercase border-b-[#fff] text-left font-medium navigation_c lg:text-[15px] tracking-wide `}>All Categories</h6>
                </span>
              </div>
            }



            {/* {all_categories.slice(0, 5).map((item, index) => { */}
            {categoryData.slice(0, tabView ? 6 : 10).map((item, index) => {
              return (
                // onMouseLeave={() => enbleDropdown('leave', index)} 
                // (dropdown == index) || 
                <div key={index} >


                  {/* href={'/' + item.route} */}
                  {/* onMouseEnter={() => { enbleDropdown('enter', index), setAllMenu(-1) }} */}
                  {/* p-[0_15px_6px_15px] */}
                  <div onClick={() => { leaveFormnav(), navigateToDetail1(item) }} className={`flex items-center gap-[5px] relative  first:p-[0_15px_0px_0px] p-[0_15px_0px_15px] text-[#976563]  `}>
                    {/* <Image style={{ objectFit: 'contain' }} className='h-[30px] w-[30px]' height={35}  width={35} alt='vantage' src={check_Image(item.mobile_image)} /> */}
                    <div onClick={() => changeCategory(item)} className={`hoverMenuSec relative cursor-pointer ${(allMenu != 1 && router.asPath.split('/')[1] == item) ? 'active_parent' : ''} `}>
                      <h6  className={`font-medium text-[#000000B2] uppercase text-left ${router?.query?.category === item ? 'font-semibold' : ''} navigation_c uppercase lg:text-[13px] tracking-[.25px] `} key={item}>{item}</h6>
                      {/* <h6 onClick={() => router.push('/list?category=' + item)} className={`font-medium text-[#000000B2] uppercase text-left navigation_c uppercase lg:text-[13px] tracking-[.25px] `} key={item}>{item}</h6> */}
                    </div>




                    {mega_menu == 0 && dropdown == index && (item.child && item.child.length != 0) &&

                      <div className="w-[241px] z-99 dropdown  top-[32px] shadow-[0_0_5px_#ddd] absolute bg-[#fff]">
                        {item.child.map((submenu, sub1) => (
                          <>

                            <span key={sub1} onClick={() => { navigateToDetail(submenu) }} onMouseEnter={() => enbleDropdown1('enter', sub1)} className={`${dropdown1 == sub1 ? 'hoverNav_1' : ''} transition-colors ease-in duration-200 delay-50 p-[7px_8px] rounded-[5px] flex items-center cursor-pointer hoverNav relative justify-between`} >
                              <h6 className='text-left text-[14px] uppercase text-[#000] p-[5px_10px] transition-colors ease-in duration-200 delay-50'>{submenu.category_name}</h6>
                              {/* <Image style={{ objectFit: 'contain' }} className='h-[11px] w-[13px]' height={25}  width={25} alt='vantage' src={dropdown1 == sub1 ? '/Arrow/arrowWhite.svg' : '/Arrow/arrowBlack.svg'}></Image> */}
                            </span>

                            {dropdown1 == sub1 && (submenu.child && submenu.child.length != 0) &&
                              <div className={`${index < 6 ? 'left-[241px]' : 'right-[241px]'} w-[240px] z-99 max-h-[320px] overflow-auto scrollbarHide dropdown  top-[0px]  shadow-[0_0_5px_#ddd] absolute bg-[#fff]`}>
                                {submenu.child.map((sub, sub2) => (

                                  <span key={sub2} onClick={() => { navigateToDetail(sub) }} onMouseEnter={() => enbleDropdown2('enter', sub2)} onMouseLeave={() => enbleDropdown2('leave', sub2)} className={`${dropdown2 == sub2 ? 'hoverNav_1' : ''} p-[7px_8px] rounded-[5px] transition-colors ease-in duration-200 delay-50 flex items-center cursor-pointer hoverNav relative justify-between`}>
                                    <h6 className='text-left text-[14px] text-[#000] uppercase p-[5px_10px] transition-colors ease-in duration-200 delay-50'>{sub.category_name}</h6>
                                    {/* <Image style={{ objectFit: 'contain' }} className='h-[11px] w-[13px]' height={25}  width={25} alt='vantage' src={dropdown2 == sub2 ? '/Arrow/arrowWhite.svg' : '/Arrow/arrowBlack.svg'}></Image> */}
                                  </span>
                                ))}
                              </div>
                            }
                          </>
                        ))}
                      </div>
                    }
                  </div>
                </div>
              )
            })}



            {/* {mega_menu == 0 && all_categories.length > 7 &&
              <div className={`relative pb-[2px] cursor-pointer hoverMenuSec ${moreMenu == 1 ? 'active_parent' : ''}`} onMouseEnter={() => { enbleDropdownMore('enter'), setDropdown(-1) }} onMouseLeave={() => enbleDropdownMore('leave')}>
                <span className='flex item-center mb-[0] gap-[5px] pb-[4px]'>
                  <a className={`text-left font-medium navigation_c lg:text-[15px] tracking-wide`}>More</a>
                </span>
                {moreMenu == 1 && (all_categories && all_categories.length != 0) &&
                  <div className="w-[241px] dropdown top-[32px] right-[0] shadow-[0_0_5px_#ddd] absolute bg-[#fff] z-99">
                    {all_categories.slice(8, all_categories.length).map((submenu, sub1) => (
                      <>
                        <span href={submenu.route} onClick={() => { navigateToDetail(submenu) }} className={`hoverMore transition-colors ease-in duration-200 delay-50 p-[7px_8px] rounded-[5px] flex items-center cursor-pointer hoverNav relative justify-between`} key={sub1}>
                          <h6 className='text-left text-[14px] text-[#000] p-[5px_10px] transition-colors ease-in duration-200 delay-50'>{submenu.category_name}</h6>
                        </span>
                      </>
                    ))}
                  </div>
                }
              </div>
            } */}



            {categoryData.length > 10 &&
              <div className={`relative  cursor-pointer hoverMenuSec ${moreMenu == 1 ? 'active_parent' : ''}`} onClick={()=> { enbleDropdownMore('enter'), setDropdown(-1) }} onMouseEnter={() => { enbleDropdownMore('enter'), setDropdown(-1) }} onMouseLeave={() => enbleDropdownMore('leave')}>
                <span className='flex item-center mb-[0] gap-[5px] '>
                  <a className={`text-left font-normal navigation_c lg:text-[13px] tracking-wide uppercase`}>More</a>
                </span>
                {moreMenu == 1 && (categoryData && categoryData.length != 0) &&
                  <div className="w-[241px] dropdown top-[25px] overflow-y-auto min-h-[100px] max-h-[400px] select_scrollbar right-[0] shadow-[0_0_5px_#ddd] absolute bg-[#fff] z-[2000]">
                    {categoryData.slice(tabView ? 6 : 10, categoryData.length).map((submenu, sub1) => (
                      <>
                        <div onClick={() => changeCategory(submenu)} className={`hoverMore cursor-pointer transition-colors ease-in duration-200 delay-50 p-[2px_8px] rounded-[5px] flex items-center hoverNav relative justify-between`} key={sub1}>
                          <h6 className={`text-left text-[#000000B2] text-[13px] ${router?.query?.category === submenu ? 'font-semibold' : ''} uppercase p-[5px_10px] transition-colors ease-in duration-200 delay-50`}>{submenu}</h6>
                        </div>
                        {/* <Link href={('/list?category=' + submenu)}  className={`hoverMore transition-colors ease-in duration-200 delay-50 p-[7px_8px] rounded-[5px] flex items-center cursor-pointer hoverNav relative justify-between`} key={sub1}>
                          <h6 className='text-left text-[14px] uppercase text-[#000] p-[5px_10px] transition-colors ease-in duration-200 delay-50'>{submenu}</h6>
                        </Link> */}
                      </>
                    ))}
                  </div>
                }
              </div>
            }

          </div>


          {(allMenu == 1 || dropdown >= 0) && showMegamenu && mega_menu == 1 && <MegaMenu leaveFormnav={leaveFormnav} all_categories={all_categories} category={all_categories[allMenu == 1 ? (dropdown == -1 ? 0 : dropdown) : dropdown].child} setDropdown={setDropdown} setDropdown1={setDropdown1} setMoreMenu={setMoreMenu} setAllMenu={setAllMenu} allMenu={allMenu} dropdown={dropdown} />}
        </div>
      }
    </>
  )
}

const MegaMenu = ({ category, leaveFormnav, all_categories, setDropdown, setDropdown1, setMoreMenu, setAllMenu, allMenu, dropdown }) => {

  const router = useRouter();
  let [megaMenu, setMegaMenu] = useState()

  function setDropdownValue() {
    // leaveFormnav()
    // setDropdown(-1)
  }

  const navigateToDetail = (submenu) => {
    if (submenu.route) {
      setDropdown(-1)
      setDropdown1(-1)
      setMoreMenu(-1)
      setAllMenu(-1)
      router.push('/' + submenu.route)
    }
  };

  const navigateToDetail1 = (submenu) => {
    if (submenu.route) {
      setDropdown(-1)
      setDropdown1(-1)
      setMoreMenu(-1)
      setAllMenu(-1)
    }
  };


  useEffect(() => {
    document.body.classList.add('active_visible');
    let obj = {}
    if (category.length != 0) {
      category.map((res) => {
        let index = Number(res.mega_menu_column)
        obj['menu' + index] = obj['menu' + index] ? obj['menu' + index] : []
        obj['menu' + index].push(res)
      })
    }
    setMegaMenu(obj)
    // fadeIn()
  }, [category])


  function fadeIn() {
    setTimeout(() => {
      const element = document.getElementById('fadInId');
      element ? element.classList.add('show') : null
    }, 400);
  }

  return (
    // flex flex-wrap fade-in
    <div id={'fadInId'} onMouseLeave={setDropdownValue} className={`${allMenu == 1 ? '' : 'overflow-auto scrollbarHide h-[calc(100vh_-_200px)]'} flex absolute z-[99] bg-[#f5f5f5] w-full shadow-[0_0_5px_#ddd] top-[38px]`}>
      {allMenu == 1 && <div className='w-[260px] overflow-auto scrollbarHide h-[calc(100vh_-_200px)]'>
        {
          all_categories.map((item, index) => {
            return (
              <Link href={'/' + item.route} onClick={() => navigateToDetail1(item)} key={index} onMouseEnter={() => { setDropdown(index) }} className={`block text-[14px] cursor-pointer p-[8px] ${dropdown == index ? 'bg-[#fff]' : ''}`}>{item.category_name}</Link>
            )
          })
        }
      </div>
      }
      <div className={`${allMenu == 1 ? 'overflow-auto scrollbarHide h-[calc(100vh_-_200px)]' : ''} grid-container w-full`}>
        {megaMenu && Object.keys(megaMenu).length != 0 &&
          Object.keys(megaMenu).map((res, index_) => {
            return (
              <div key={index_} className='odd:bg-[#fff] grid-item p-[8px] '>
                {megaMenu[res].map((submenu, sub1) => {
                  return (
                    <div className='pb-[8px]'>

                      <Link onClick={() => navigateToDetail1(submenu)} href={'/' + submenu.route} className='block text-[14px] font-medium pb-[5px] cursor-pointer'>{submenu.category_name}</Link>
                      <div className='p-[0px_0px_0px_5px]'>
                        {submenu.child.map((submenu_1, sub2) => (
                          <Link onClick={() => navigateToDetail1(submenu_1)} href={'/' + submenu_1.route} className='block text-[13px] cursor-pointer hoverMegaMenu transition-colors ease-in duration-200 delay-50'>{submenu_1.category_name}</Link>
                        ))}
                      </div>

                      {/* <h5 onClick={()=>navigateToDetail(submenu)} className='text-[14px] font-medium pb-[5px] cursor-pointer'>{submenu.category_name}</h5>
              <div className='p-[0px_0px_0px_5px]'>
                  {submenu.child.map((submenu_1, sub2) => (
                      <h5 onClick={()=>navigateToDetail(submenu_1)} className='text-[13px] cursor-pointer hoverMegaMenu transition-colors ease-in duration-200 delay-50'>{submenu_1.category_name}</h5>
                  ))}
              </div> */}
                    </div>
                  )
                })}
              </div>
            )
          })
        }
        {/* {category && category.length != 0 && category.map((submenu, sub1) => {
        return(
        <div className='grid-item p-[5px] '>
          <h5 onClick={()=>navigateToDetail(submenu)} className='text-[14px] font-medium pb-[5px] cursor-pointer'>{submenu.category_name}</h5>
          <div className='p-[0px_0px_0px_5px]'>
              {submenu.child.map((submenu_1, sub2) => (
                  <h5 onClick={()=>navigateToDetail(submenu_1)} className='text-[13px] cursor-pointer hoverMegaMenu transition-colors ease-in duration-200 delay-50'>{submenu_1.category_name}</h5>
              ))}
          </div>
        </div>
      )})}   */}
        {/* {category && category.length != 0 && category.map((submenu, sub1) => {
        return(
        <div className='grid-item p-[5px] '>
          <h5 onClick={()=>navigateToDetail(submenu)} className='text-[14px] font-medium pb-[5px] cursor-pointer'>{submenu.category_name}</h5>
          <div className='p-[0px_0px_0px_5px]'>
              {submenu.child.map((submenu_1, sub2) => (
                  <h5 onClick={()=>navigateToDetail(submenu_1)} className='text-[13px] cursor-pointer hoverMegaMenu transition-colors ease-in duration-200 delay-50'>{submenu_1.category_name}</h5>
              ))}
          </div>
        </div>
      )})} */}
      </div>
    </div>
  )
}