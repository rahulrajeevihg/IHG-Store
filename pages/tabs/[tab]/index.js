import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router'
import { get_all_masters } from '@/libs/api';

const MobileCategoryFilter = dynamic(()=> import('@/components/Product/filters/MobileCategoryFilter'))
const MobileHeader = dynamic(()=> import('@/components/Headers/mobileHeader/MobileHeader'))
const CartView = dynamic(() => import('@/components/Product/CartView'))

export default function index() {

  const router = useRouter();
  let [routeName, setRouteName] = useState('')
  let [title, setTitle] = useState('')

  const webSettings = useSelector((state) => state.webSettings.websiteSettings)

  useEffect(() => {
    const tab = router.query.tab;
    setRouteName(tab);

    if (tab == 'category') {
      setTitle('Categories')
    } else if (tab == 'yourcart') {
      setTitle('My Cart')
    } else if (tab == 'wishlist') {
      setTitle('Wishlist')
    } else if (tab == 'my-orders') {
      setTitle('My Orders')
    } else {
      setTitle(tab);
    }

  }, [router.query.tab])

  const [categoryData, setCategoryData] = useState([])
  
  useEffect(() => {
    const getValue = async () => {
      const mastersRes = await get_all_masters(router);
      if (mastersRes && mastersRes.message) {
        setCategoryData(mastersRes.message.item_group)
      }
    }

    getValue();
  }, [])

  const [theme_settings, setTheme_settings] = useState()

  useMemo(() => {
    if (webSettings && webSettings.app_settings) {
      let settings = webSettings.app_settings;
      setTheme_settings(settings);
    }
  }, [webSettings])

  return (
    <div className={`main-width lg:py-[25px] mb-[20px] fade-in`}>
      {(theme_settings && routeName) && <MobileHeader back_btn={true} title={title} search={routeName === 'category'} theme_settings={theme_settings}/>}
      
      {routeName == 'category' && <MobileCategoryFilter data={categoryData} />}
      {routeName == 'yourcart' && <CartView />}
      
      {(routeName == 'wishlist' || routeName == 'my-orders') && (
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold text-gray-500">Coming Soon</h2>
          <p className="text-gray-400">This feature is being updated.</p>
        </div>
      )}
    </div>
  )
}

