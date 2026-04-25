import { useEffect } from 'react'
import { useDispatch } from 'react-redux';
import { setDetail } from '@/redux/slice/customerInfo'
import { get_customer_info } from '@/libs/api';

export default function RootLayout({ children }) {

  const dispatch = useDispatch();
  useEffect(() => {
    if (typeof window != 'undefined' && localStorage && localStorage['CustomerName']) {
      customer_info()
    }

  }, [])



  async function customer_info() {
    let data = { guest_id: '', user: localStorage['customerRefId'] };
    const resp = await get_customer_info(data);
    if (resp && resp.message && resp.message[0]) {
      let data = resp.message[0];
      dispatch(setDetail(data));
    }
  }

  return (
    <>
      <main id='main' className='md:min-h-screen your-element md:w-full fade-in'>{children}</main>
    </>
  )
}
