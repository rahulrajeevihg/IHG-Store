import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router'
import { check_Image, get_brands_list } from '@/libs/api';
import Image from 'next/image';
import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader';
import IsMobile from '@/libs/hooks/resize';
import { useDispatch } from 'react-redux'
import { setFilter } from '@/redux/slice/homeFilter'

export default function index() {

  const router = useRouter();
  const isMobile = IsMobile()
  const [details, setDetails] = useState([])
  useEffect(() => {
    // console.log(details, "details")
    getBrandList()
  }, [])

  const dispatch = useDispatch()

  const changeBrand = (item) => {
    router.push('/list?brand='+item)
    // console.log("log", item)
    dispatch(setFilter({ brand: [item] }));
  }

  const getBrandList = async () => {
    const apikey = localStorage['api_key'];
    const apisecret = localStorage['api_secret'];
    const token = (apikey && apisecret) ? `token ${apikey}:${apisecret}` : null;
    const params = {
      page_no: page,
      page_size: 48
    }
    const data = await get_brands_list(token, params);
    if (data.message && data.message.length > 0) {
      setDetails(page == 1 ? data.message : [...details, ...data.message])
      setNoProducts(false)
    } else {
      page == 1 ? setDetails([]) : null;
      setNoProducts(true)
    }
  }



  // Pagination
  const observer = useRef();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [noProducts, setNoProducts] = useState(false)
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1); // trigger loading of new posts by chaging page no
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading]
  );

  useEffect(() => {
    if (page > 1 && !noProducts) {
      // console.log(page,"page")


      setLoading(true);

      // const data = {
      //   page_no: page,
      //   page_length: 10
      // }

      const loadData = async () => {
        await getBrandList();

        setLoading(false);
      };

      loadData();
    }
  }, [page]);

  return (
    <>
      {isMobile && <MobileHeader back_btn={true} title={'Brands'} empty_div={false} search={true} share={false} />}
      <div className='py-10 md:py-3 md:px-[10px] main-width lg:max-w-[1350px] min-h-screen fade-in'>
        <div className='py-[10px]'>
          <h6 className={`text-[16px] lg:text-[24px] font-semibold line-clamp-1`}>Brands </h6>
        </div>

        <div className='grid grid-cols-3 lg:grid-cols-6 gap-3 fade-in'>
          {details && details.length > 0 &&
            details.map((item, i) => (
              <div key={i} ref={details.length === i + 5 ? lastPostElementRef : null} className='fade-in border border-[#E9E9E9] rounded-xl cursor-pointer relative min-h-[100px]' onClick={() => changeBrand(item.name)}>
                <div className='py-4 px-5'>
                  {item.image && <Image src={check_Image(item.image)} alt={item.name} width={100} height={50} className='w-full h-[50px] object-contain' />}
                  {!item.image && <h1 className='text-center min-h-[50px] flex justify-center items-center text-[20px] md:text-[15px] font-medium'>{item.name}</h1>}
                  {/* <Image src={check_Image(item.image)} alt={item.name} width={100} height={50} className='w-full h-[50px] object-contain' /> */}
                </div>

                <div className='bg-[#F0F0F0] py-1 px-3 absolute bottom-0 w-full rounded-[0_0_10px_10px]'>
                  <p className='text-[#565656] text-xs lg:text-sm'>{item.item_count} + {"Products"}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )

}



// export async function getServerSideProps({ req }) {
//   const apikey = req.cookies.api_key;
//   const apisecret = req.cookies.api_secret;
//   const token = (apikey && apisecret) ? `token ${apikey}:${apisecret}` : null

//   const data = await get_brands_list(token);
//   const details = await data.message || []

//   return {
//     props: { details },
//   }
// }
