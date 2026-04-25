import { useState, useMemo } from 'react'
import TopBar from './webheader/TopBar'
// import MainHeader from './webheader/MainHeader'
// import Navbar from './webheader/Navbar'
import { useDispatch } from 'react-redux';
import { setWebSetting } from '@/redux/slice/websiteSettings'
import dynamic from 'next/dynamic';
const MainHeader = dynamic(() => import('./webheader/MainHeader'))
const Navbar = dynamic(() => import('./webheader/Navbar'))
import Link from 'next/link'

export default function WebHeader({ website_settings,categoryData, navigateDetail }) {
  //  console.log(website_settings)
  let [websiteSettings, set_website_settings] = useState();
  let [staticMenu, setStaticMenu] = useState([]);
  const dispatch = useDispatch();

  useMemo(() => {

    if (website_settings) {
      websiteSettings = website_settings
      set_website_settings(websiteSettings)
      dispatch(setWebSetting(websiteSettings));
      if (websiteSettings.default_header && websiteSettings.default_header.items && websiteSettings.default_header.items.length != 0) {
        let menu = websiteSettings.default_header.items.find(r => { return r.section_type == 'Menu' && r.section_name == 'Header Menu' })
        if (menu) {
          staticMenu = menu.menus
          setStaticMenu(staticMenu)
        }
      }
    }

  }, [website_settings])



  return (
    <>

      {websiteSettings ?
        <div className='md:hidden border-b-[1px] border-b-slate-100 sticky top-0 bg-[#fff] z-[99]'>
          {(websiteSettings.default_header && websiteSettings.default_header.enable_top_menu && websiteSettings.default_header.enable_top_menu == 1 && (websiteSettings.default_header.top_menu)) ? <TopBar top_menu={websiteSettings.default_header.top_menu} /> : <></>}


          {/* headerWidth_l */}
          <div className="flex gap-[0px]  p-[15px_0_0px_0]">
            {/* <div className='h-[95px] w-[100px]'>
             {(websiteSettings.app_settings && websiteSettings.app_settings.website_logo) ? <Image onClick={()=>{router.push('/')}} className='cursor-pointer h-[90px] object-contain' height={60}  width={100} alt='logo' src={check_Image(websiteSettings.app_settings.website_logo)}></Image> : <></>}
            </div> */}
            {/* flex-[1] */}
            <div className='w-full'>
              {/* !mb-[15px] */}
              <div className="flex border-b-[1px] border-b-slate-100 pb-[15px] ">
                <div className="main-width !m-[0_auto]">
                {/* {console.log(websiteSettings,"websiteSettings")} */}
                  {/* {(staticMenu && staticMenu.length != 0) ? <StaticMenuSec staticMenu={staticMenu} /> : <div></div> } */}
              {websiteSettings.default_header && <MainHeader header_template={websiteSettings.default_header} theme_settings={websiteSettings.app_settings} all_categories={websiteSettings.all_categories} website_settings={website_settings} categoryData={categoryData} navigateDetail={navigateDetail} />}
                </div>
              </div>
              {/* headerWidth_r p-[10px_0_5px_0] bg-[#00000008] lg:min-h-[46px] */}
              <div className=" p-0 flex items-center bg-[#00000008] lg:min-h-[35px]">
                {/* {websiteSettings.all_categories && <Navbar all_categories={websiteSettings.all_categories} />} */}
                {websiteSettings.default_header && <Navbar all_categories={websiteSettings.all_categories} categoryData={categoryData} />}
              </div>
            </div>
          </div>

        </div>
        :
        <Skeleton />
      }
      
    </>
  )

}

const StaticMenuSec = ({ staticMenu }) => {

  return (
    <div className="flex items-end gap-[8px] w-[40%]">
      {staticMenu.slice(0, 5).map((res, i) => {
        return (
          <Link href={res.redirect_url ? res.redirect_url : '#'} key={i} className="first:p-[0_15px_0_0] p-[0_15px] text-[14px] font-medium staticMenuHover">{res.menu_label}</Link>
        )
      })}
    </div>
  )
}


const Skeleton = ({ }) => {
  return (
    <>
      <div className={`animate-pulse min-h-[183px] lg:gap-[10px] flex-wrap h-[128px] md:hidden border-b-[1px] border-b-slate-100 sticky top-0 bg-[#fff] z-[99]`}>

        <div className='flex items-center main-width'>
          <div className='bg-slate-200 h-[25px] mb-[5px] w-[100%] rounded-[5px]'></div>
        </div>

        <div className='flex items-center main-width py-[20px]'>
          <div className='flex-[0_0_calc(25%_-_0px)]'>
            <div className='bg-slate-200 h-[45px] mb-[5px] w-[250px] rounded-[5px]'></div>
          </div>
          <div className='flex-[0_0_calc(50%_-_0px)]'>
            <div className='bg-slate-200 h-[45px] mb-[5px] w-[607px] rounded-[5px]'></div>
          </div>
          <div className='flex-[0_0_calc(25%_-_0px)] flex justify-end'>
            <div className='bg-slate-200 h-[45px] mb-[5px] w-[250px] rounded-[5px]'></div>
          </div>
        </div>

        <div className='flex items-center main-width !mt-[20px]'>
          <div className='bg-slate-200 h-[25px] mb-[5px] w-[100%] rounded-[5px]'></div>
        </div>
      </div>
    </>
  )
}