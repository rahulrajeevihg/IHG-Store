import { useState, useEffect, useMemo, useRef, useCallback, Fragment, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { seo_Image, getCurrentUrl, typesense_search_items, get_all_masters } from '@/libs/api';
import dynamic from 'next/dynamic';
const ProductBox = dynamic(() => import('@/components/Product/ProductBox'))
const Filters = dynamic(() => import('@/components/Product/filters/Filters'))
const NoProductFound = dynamic(() => import('@/components/Common/NoProductFound'))
const MobileHeader = dynamic(() => import('@/components/Headers/mobileHeader/MobileHeader'))
const MobileCategoryFilter = dynamic(() => import('@/components/Product/filters/MobileCategoryFilter'))
const ProductDetail = dynamic(() => import('@/components/Detail/ProductDetail'))
import { useRouter } from 'next/router'
import Image from 'next/image';
import Rodal from 'rodal';
// import 'rodal/lib/rodal.css';
import { setBoxView } from '@/redux/slice/websiteSettings'
import { resetSetFilters, setLoad } from '@/redux/slice/ProductListFilters'
import { resetFilters, resetSwitch, setAllFilter, setBrand } from "@/redux/slice/filtersList";
import { setFilter } from '@/redux/slice/homeFilter';
import Head from 'next/head'
import { Switch } from '@headlessui/react';
import clsx from 'clsx'
import useTabView from '@/libs/hooks/useTabView';
import { resetFilter } from '@/redux/slice/homeFilter';
import { setProductDetail } from '@/redux/slice/productDetail';
// import ProductDetail from '@/components/Detail/ProductDetail';

const initialState = {
  q: "*",
  page_no: 1,
  item_code: "",
  item_description: "",
  sort_by: 'stock:desc',
  hot_product: false,
  show_promotion: false,
  in_stock: false,
  brand: [],
  price_range: { min: 0, max: 100000 },
  stock_range: { min: 0, max: 100000 },
  product_type: [],
  has_variants: false,
  custom_in_bundle_item: false,
  category_list: [],
  item_group: [],
  beam_angle: [],
  lumen_output: [],
  mounting: [],
  ip_rate: [],
  lamp_type: [],
  power: [],
  input: [],
  dimension: '',
  material: [],
  body_finish: [],
  warranty_: [],
  output_voltage: [],
  output_current: [],
  color_temp_: [],
  search_type : ''
}


function List({ category, brand, search }) {
  const router = useRouter();

  const [foundValue, setFoundValue] = useState(0);

  // useEffect(() => {
  //   setResults(initialData)
  //   setFoundValue(found)
  // }, [router])

  // console.log("foundValue", foundValue)

  const [mastersData, setMastersData] = useState([]);
  const tabView = useTabView();

  useEffect(() => {
    const getMasterData = async () => {
      const mastersRes = await get_all_masters();
      // console.log('master', mastersRes)
      if (mastersRes.message) {
        setMastersData(mastersRes.message)
      }
    }

    getMasterData()

    return (() => {
      if (localStorage['sort_by']) {
        filters = { ...filters, sort_by: localStorage['sort_by'] }
        setFilters({ ...filters });
        const obj = { sort_by: localStorage['sort_by'] }
        // dispatch(setAllFilter({ ...obj }))
        // setTimeout(() => {
        //   localStorage.removeItem('sort_by')
        // }, 400);
      }
    })
  }, [])

  // console.log('maste', mastersData)



  let [productList, setProductList] = useState([]);

  let [loader, setLoader] = useState(true);
  let [pageLoading, setPageLoading] = useState(true);

  const webSettings = useSelector((state) => state.webSettings.websiteSettings)
  const productBoxView = useSelector((state) => state.webSettings.productBoxView)
  let productFilters = useSelector((state) => state.ProductListFilters.filtersValue)
  const productFilter = useSelector((state) => state.FiltersList.filtersValue)
  let loadData = useSelector((state) => state.ProductListFilters.filtersValue.loadData)
  const homeFilter = useSelector((state) => state.HomeFilter.filtersValue)
  const dispatch = useDispatch();
  let [top, setTop] = useState(true)
  let cardref = useRef(null);

  // console.log('homeFilter', homeFilter)

  const initialValue = productFilter;


  let [filters, setFilters] = useState({
    ...initialValue,
    price_range: { min: 0, max: 100000 },
    stock_range: { min: 0, max: 100000 }
  });


  const filtersData = useSelector((state) => state.FiltersList)
  // console.log('filterdata', filtersData)

  let [loadSpinner, setLoadSpinner] = useState(false);
  let [no_product, setNoProduct] = useState(true);

  let rating = 0


  useEffect(() => {
    // const store = createStore(resetSetFilters, initialState);
    if (typeof window != 'undefined') {
      // dispatch(resetSetFilters());
      setLoader(true);
      setPageLoading(false);
      no_product = false
      setNoProduct(no_product);
      hide()
      // getProductList();
    }

  }, [router])

  useEffect(() => {
    router.events.on("routeChangeStart", exitingFunction);
    return () => {
      router.events.off("routeChangeStart", exitingFunction);
    };
  }, [router.events]);

  const exitingFunction = () => {
    dispatch(resetSetFilters());
  };


  useEffect(() => {
    // no_product = false
    // setNoProduct(no_product)
    if (productFilters && productFilters.page_no) {
      if (productFilters.page_no * 16 == productList?.length) {
        no_product = false
      } else {
        no_product = true
      }
    }

    if (typeof window != 'undefined') {

      const handleScroll = () => {
        const cardElement = cardref.current;
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY;
        const cardPosition = cardElement?.getBoundingClientRect().top;

        if (cardPosition - windowHeight < 2000 && top) {
          // Your logic here when the card is near the viewport
          // Example: dispatch an action or call a function
          // console.log(no_product, 'no_product');
          if (!no_product) {
            no_product = true
            // setNoProduct(no_product)
            // setTimeout(() => {
            let updatedPageNo = productFilters.page_no + 1;
            let obj = { ...productFilters, page_no: updatedPageNo };
            setPageLoading(true);
            // dispatch(setFilters(obj));

            // dispatch(setLoad(loadData ? false : true))
            // }, 800)
          }
        }
      };

      // Attach the scroll event listener
      window.addEventListener('scroll', handleScroll);

      // Cleanup: Remove the scroll event listener when the component unmounts
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [no_product, productList]);



  // useEffect(() => {
  //   const handleResize = () => {
  //     const mobileWidth = 768; // Adjust this value to define your mobile width threshold
  //     if (window.innerWidth <= mobileWidth) {
  //       // console.log(window.innerWidth,"window.innerWidth evenet triggered")
  //       // dispatch(setBoxView('List View'));
  //     } else {
  //       // dispatch(setBoxView('Grid View'));
  //     }
  //   };

  //   handleResize(); // Initial check on component mount

  //   window.addEventListener('resize', handleResize); // Event listener for window resize

  //   return () => {
  //     window.removeEventListener('resize', handleResize); // Clean up the event listener
  //   };
  // }, []);


  useMemo(() => {
    if (typeof window !== 'undefined') {
      if (loadData) {
        // console.log("loaddata")
        // getProductList()
        dispatch(setLoad(false))
      }

    }
  }, [loadData])


  function ProductFilter(value) {
    no_product = false
    setNoProduct(no_product)
    // no_product = true
    let obj = { page_no: 1 }
    let data = { ...value, ...obj }
    top = false
    setTop(top)
    window.scrollTo(0, 0);
    setLoader(true);
    setLoadSpinner(true)
    dispatch(setFilters(data));
    setTimeout(() => {
      top = true
      setTop(top)
    }, [200])

    // if (value) {
    //   let key = Object.keys(value)[0];
    //   if (key.length != 0) {
    //     if (key == 'brands') {
    //       brands = value[key];
    //       // setBrand((prevBrand) => brands);
    //       setBrands(brands)
    //     } else if (key == 'attribute') {
    //       attributes = value[key];
    //       setAttribute(attributes)
    //     } else if (key == 'sort') {
    //       sort = value[key];
    //       setSort(sort)
    //     } else if (key == 'minPrice') {
    //       min_price = value[key];
    //       let key_1 = Object.keys(value)[1];
    //       max_price = value[key_1];
    //     }else if (key == 'rating') {
    //       rating = value[key];
    //     }


    //     page_no = 1;
    //     // setPageNo(page_no)
    //     // no_product = false;
    //     setLoader(true);
    //     getProductList()
    //   }
    // }


  }


  const [theme_settings, setTheme_settings] = useState()


  useMemo(() => {

    if (webSettings && webSettings.app_settings) {
      let settings = webSettings.app_settings;
      setTheme_settings(settings);

      let route = router.asPath.split('/')[1]
      let value = webSettings.all_categories.find(res => { return res.route == route })
      if (value) {
        setCurrentRoute(value);
      }
    }

  }, [webSettings, router])


  const [isOpenCat, setIsOpenCat] = useState(false)

  function closeModal() {
    setIsOpenCat(false)
  }

  function titleClick() {
    setIsOpenCat(true)
  }

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceBetween, setPriceBetween] = useState({ min: 0.0, max: 100 })
  const [pageNo, setpageNo] = useState(1)
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // const { category, brand } = router.query;
  // console.log(category, brand)


  const label_classname = "text-[14px] md:text-[13px] font-semibold"

  const buildFilterQuery = () => {
    const filterParams = [];
    const { price_range, stock_range, ...rest } = filters;

    // if (rest.item_code) filterParams.push(`item_code:${rest.item_code}*`);
    // if (rest.item_description) filterParams.push(`item_description:${rest.item_description}*`);
    // if (rest.product_type) filterParams.push(`product_type:${rest.product_type}`);
    if (rest.dimension) filterParams.push(`dimension:${rest.dimension}`);
    if (rest.hot_product) filterParams.push(`hot_product:=${rest.hot_product ? 1 : 0}`);
    if (rest.show_promotion) filterParams.push(`offer_rate:>0`);
    if (rest.in_stock) filterParams.push(`stock:>0`);
    if (rest.has_variants) filterParams.push(`has_variants:=${rest.has_variants ? 1 : 0}`);
    if (rest.custom_in_bundle_item) filterParams.push(`is_bundle_item:=${rest.custom_in_bundle_item ? 1 : 0}`);
    // if (rest.sort_by) filterParams.push(`sort_by:=${rest.sort_by}`);

    [
      "brand", "color_temp_", "item_group", "beam_angle", "lumen_output", "mounting", "ip_rate", "lamp_type",
      "power", "input", "material", "body_finish", "warranty_",
      "output_voltage", "output_current", "category_list", "product_type"
    ].forEach(key => {
      if (rest[key]?.length) {
        const values = rest[key].map(v => `"${v}"`).join(",")
        filterParams.push(`${key}:=[${values}]`);
      }
    });
    

    // console.log(checkInitialValue(price_range?.min,initialState.price_range.min),"price - min")
    // console.log(checkInitialValue(price_range?.max,initialState.price_range.max),"price - max")

    if (checkInitialValue(price_range?.min, initialState.price_range.min) || checkInitialValue(price_range?.max, initialState.price_range.max)) {
      filterParams.push(`rate:>=${price_range.min} && rate:<=${price_range.max}`);
    }

    if(router.query['search'] && productFilter.search_type != 'All'){
       filterParams.push(`item_code:=${router.query['search']}`)
    }

    // console.log(checkInitialValue(stock_range?.min,initialState.stock_range.min),"stock - min")
    // console.log(checkInitialValue(stock_range?.max,initialState.stock_range.max),"stock - max")

    if (checkInitialValue(stock_range?.min, initialState.stock_range.min) || checkInitialValue(stock_range?.max, initialState.stock_range.max)) {
      filterParams.push(`stock:>=${stock_range.min} && stock:<=${parseFloat(stock_range.max)}`);
    }

    // if (price_range?.min > 0 && price_range?.max) {
    //   filterParams.push(`rate:>${price_range.min} && rate:<${price_range.max}`);
    // }

    // if (stock_range?.min > 0 && stock_range?.max) {
    //   filterParams.push(`stock:>${stock_range.min} && stock:<${parseFloat(stock_range.max)}`);
    // }

    // console.log("params", filterParams);
    return filterParams.length > 0 ? filterParams.join(" && ") : "";
  };

  const checkInitialValue = (present, past) => {
    return present != past
  }


  const [removeAllFilter, setRemoveAllFilter] = useState(false);
  const removeFilter = () => {
    // console.log('filter')
    // setClearAllFilters(true);

    setpageNo(1)
    // dispatch(resetFilters())
    // if (category) {
    //   setFilters((prevFilters) => ({
    //     ...initialValue,
    //     item_group: prevFilters.item_group,
    //     price_range: { min: 0, max: 100000 },
    //     stock_range: { min: 0, max: 100000 },
    //   }));
    // }
    // else if (brand) {
    //   setFilters((prevFilters) => ({
    //     ...initialValue,
    //     brand: prevFilters.brand,
    //     price_range: { min: 0, max: 100000 },
    //     stock_range: { min: 0, max: 100000 },
    //   }));
    // }
    // setFilters((prevFilters) => ({
    //   ...initialState,
    //   price_range: { min: 0, max: 100000 },
    //   stock_range: { min: 0, max: 100000 },
    // }));
    // setRemoveAllFilter((prev) => !prev);

    dispatch(resetFilters())
    dispatch(resetFilter())
    // dispatch(setFilter({ ...filters }));

    // console.log("checkRange",filters)
    // router.replace(`/list?category=`)
    setTimeout(() => {
      router.replace("/list", undefined, { shallow: true })
    }, 400);
  }

  const fetchResults = async (reset = false, initialPageNo) => {
    setError(null);
    // console.log("queryfilter", filters)
    const perPage = window.innerWidth >= 1400 ? "15" : "12";
    const queryParams = new URLSearchParams({
      q: filters.q !== '*' && productFilter.search_type == 'All' ? filters.q : filters.item_description ? `${filters.item_description}*` : '*',
      query_by: filters.q ? 'item_name,item_code,item_description' : filters.item_description ? 'item_description,item_code,item_name' : '',
      page: initialPageNo ? 1 : pageNo,
      per_page: 15,
      exhaustive_search: productFilter.search_type =='All' ? 'true' : "false",
      // query_by_weights: "4,2",
      // query_by_weights: "1,2,3",
      filter_by: buildFilterQuery(),
      // ...buildFilterQuery() && { filter_by: buildFilterQuery() },
      sort_by: localStorage['sort_by'] ? localStorage['sort_by'] : filters.sort_by
    });

    if (initialPageNo) {
      setpageNo(1)
      setResults([])
    }

    setLoader(false)
    try {
      setLoading(true);
      const data = await typesense_search_items(queryParams);
      if (data.hits.length === 0) {
        if (pageNo > 1) {
          setHasMore(false);
        } else {
          setResults([]);
          setHasMore(false);
        }
      } else {
        setHasMore(true);
        setResults((prevResults) =>
          reset ? data.hits : [...prevResults, ...data.hits]
        );
      }

      setFoundValue(data.found);

    } catch (err) {
      setError(err.message || "An error occurred while fetching data.");
      setHasMore(false)
      setFoundValue(0)
      // setResults([])
    } finally {
      setLoading(false);
    }
  };

  // const [filterUpdated, setFilterUpdated] = useState(false);
  // const [clearAllFilters, setClearAllFilters] = useState(false);

  // useEffect(() => {
  //   if (clearAllFilters) {
  //     setClearAllFilters(false);
  //     return;
  //   }

  //   if (homeFilter) {
  //     console.log("hoooooo", homeFilter);

  //     const validFilters = Object.keys(homeFilter).reduce((acc, key) => {
  //       if ((homeFilter[key] !== undefined && homeFilter[key] !== null && homeFilter[key] !== '')) {
  //         acc[key] = homeFilter[key];
  //       }
  //       return acc;
  //     }, {});

  //     if (Object.keys(validFilters).length > 0) {
  //       setFilters((prevFilters) => ({
  //         ...prevFilters,
  //         ...validFilters
  //       }));
  //       setFilterUpdated(true);

  //     }

  //     console.log("hoooo", validFilters);
  //   }
  //   console.log("proct", homeFilter)
  //   // if (!(homeFilter?.brand?.length > 0) && !(homeFilter?.item_group?.length > 0)) {
  //   //   fetchResults(false, true)
  //   // }
  // }, [homeFilter]);

  // useEffect(() => {
  //   if (filterUpdated) {
  //     console.log("filterUpdated", filterUpdated)
  //     fetchResults(false, true);
  //     setFilterUpdated(false);

  //     window.scrollTo({
  //       top: 0,
  //       behavior: "smooth",
  //     });
  //   }
  // }, [filterUpdated])


  // console.log("filllll", filters)

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  const [pageLoad, setPageLoad] = useState(false)

  const lastResultRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        // console.log(entries[0],"entries")
        if (entries[0].isIntersecting && hasMore) {
          setpageNo((prevPage) => prevPage + 1);
          setPageLoad((prev) => !prev);
        }
      });

      if (node) observer.current.observe(node);
    },
    [hasMore]
  );


  const [initialLoad, setInitialLoad] = useState(true);

  // Pagination
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }

    fetchResults();

  }, [pageLoad]);

  // Btn Filter
  const handleFilterClick = () => {
    setResults([]);

    // if(filters.item_group.length === 0 || filters.brand.length === 0){
    //   router.replace("/list", undefined, { shallow: true })
    //   return 
    // }

    // setpageNo(1)
    fetchResults(true, true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // onChnage filters
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    localStorage.setItem('sort_by', filters.sort_by);
    // dispatch(setAllFilter({ ...filters }))

    // dispatch(setFilter({ ...filters }));
    fetchResults(true, true);
  }, [filters.hot_product, filters.sort_by, filters.has_variants, filters.in_stock, filters.show_promotion, filters.custom_in_bundle_item]);

  // Initial
  useEffect(() => {

    // console.log('Query Params:', category);
    if (router.query) {
      // if (router.query['category']) {
      //   category = router.query['category']
      //   search = ""
      // } else if (router.query['brand']) {
      //   brand = router.query['brand']
      //   search = ""
      // } else if(router.query['search']){
      //   search = router.query['search'] ? router.query['search'] : ""
      // }

      filters = {
        ...productFilter,
        price_range: productFilter.price_range,
        stock_range: productFilter.stock_range,
        item_group: router.query['category'] ? (Array.isArray(router.query['category']) ? router.query['category'] : router.query['category'].split(",")) : productFilter.item_group.length > 0 ? productFilter.item_group : [],
        brand: router.query['brand'] ? (Array.isArray(router.query['brand']) ? router.query['brand'] : router.query['brand'].split(",")) : productFilter.brand.length > 0 ? productFilter.brand : [],
        q: router.query['search'] ? router.query['search'] : "*",
        sort_by : router.query['search'] ? '' : "stock:desc",
        // item_code: router.query['search'] && productFilter.search_type != 'All' && router.query['search']
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setFilters({ ...filters })
      fetchResults(true, true)
    }



  }, [router.query]);

  // useMemo(() => {
  //   if (homeFilter && homeFilter.sort_by) {
  //     filters = {...filters, sort_by: homeFilter.sort_by}
  //     setFilters({ ...filters })

  //     fetchResults(true, true)
  //   }
  // }, [homeFilter])



  // useEffect(()=>{
  //   if(filters.item_group.length === 0){
  //     router.push('/')
  //   }
  // },[category, brand])

  useEffect(() => {
    setTimeout(() => {
      // console.log("sor", filters)
     }, 800);
    dispatch(setAllFilter({ ...filters }))
   
    // console.log("price", productFilter)
    // console.log("checkFill", productFilter)

    setTimeout(() => {
      // console.log("sorP", productFilter)
     }, 1200);

  }, [filters])

  // useEffect(()=>{
  //   dispatch(setFilter({ ...filters }));
  // },[filters.sort_by, filters.hot_product, filters.brand, filters.item_group])

  let sortByOptions = [
    { text: 'Relevance', value: '' },
    { text: 'Stock high to low', value: 'stock:desc' },
    { text: 'Stock low to high', value: 'stock:asc' },
    { text: 'Created Date', value: 'creation_on:desc' },
    { text: 'Price low to high', value: 'rate:asc' },
    { text: 'Price high to low', value: 'rate:desc' },
    { text: 'Mostly Sold', value: 'sold_last_30_days:desc' },
    { text: 'Least Sold', value: 'sold_last_30_days:asc' },
    { text: 'Discount high to low', value: 'discount_percentage:desc' },
    // { text: 'Discount low to high', value: 'discount_percentage:asc' },
  ]

  const handleSortBy = (e, type = "") => {
    // console.log('targetvalue', e)
    let sortByValue = ""
    if (type == "select") {
      sortByValue = e.target.value;
    } else {
      sortByValue = e
    }

    // if (localStorage['sort_by']) {
    //   localStorage.removeItem('sort_by')
    // }

    setFilters((prevFilters) => ({
      ...prevFilters,
      sort_by: sortByValue
    }));
    // console.log('sort', filters)
    // setResults([])
    // setpageNo(1)
    // fetchResults()
  }

  const [openFilter, setOpenFilter] = useState(false);

  const changeValue = (type, value) => {
    setFilters(prev => {
      const obj = {}
      obj[type] = value
      return { ...prev, ...obj }
    })
  }

  const checkOpenFilter = () => {
    if (tabView && openFilter) {
      return true
    }

    if (loader && !tabView) {
      return false
    }

    if (!loader && tabView) {
      return false
    }

    return true
  }


  const [visible, setVisible] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const navigateDetail = (item) => {
    dispatch(setProductDetail(item.document));
    setCurrentProduct(item.document)
    document.body.style.overflow = "hidden"
    setVisible(true)
  }

  // console.log("visible", visible)
  const hide = (status) => {
    setVisible(false)
    document.body.style.overflow = "unset"
    setCurrentProduct(null)
  }

  // console.log('tabView', (tabView && openFilter) || !tabView, openFilter, tabView)
  return (

    <>

      {/* <Head>
        <title>{filterInfo?.meta_info?.meta_title}</title>
        <meta name="description" content={filterInfo?.meta_info?.meta_description} />
        <meta property="og:type" content={'List'} />
        <meta property="og:title" content={filterInfo?.meta_info?.meta_title} />
        <meta key="og_description" property="og:description" content={filterInfo?.meta_info?.meta_description} />
        <meta property="og:image" content={seo_Image(filterInfo?.meta_info?.meta_image)}></meta>
        <meta property="og:url" content={getCurrentUrl(router.asPath)}></meta>
        <meta name="twitter:image" content={seo_Image(filterInfo?.meta_info?.meta_image)}></meta>
      </Head> */}
      

      {visible && <ProductDetail visible={visible} product={currentProduct} hide={hide} />}

      {loadSpinner && <Backdrop />}
      {isOpenCat && <div className='filtersPopup'>
        <Rodal visible={isOpenCat} enterAnimation='slideDown' animation='' onClose={closeModal}>
          <MobileCategoryFilter closeModal={closeModal} handleSortBy={handleSortBy} />
        </Rodal>
      </div>
      }

      {<MobileHeader titleClick={titleClick} titleDropDown={true} back_btn={true} search={true} theme_settings={theme_settings} />}

      <div className='md:hidden tab:hidden main-width pt-3 flex items-center justify-end gap-4'>

        <div className='px-8 gap-4 flex overflow-x-auto scrollbarHide w-[58%]'>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Upcoming Products"} type={'hot_product'} checked={filters.hot_product} label2={"Show Upcoming products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Show Promotion"} type={'show_promotion'} checked={filters.show_promotion} label2={"Show promotion products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"In Stock"} type={'in_stock'} checked={filters.in_stock} label2={"Show Instock products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Has Variants"} type={'has_variants'} checked={filters.has_variants} label2={"Show Variants products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Bundle Item"} type={'custom_in_bundle_item'} checked={filters.custom_in_bundle_item} label2={"Show Bundle Item products only"} changeValue={changeValue} />
          </div>
        </div>
        <div onClick={() => { dispatch(setBoxView(productBoxView == 'Grid View' ? 'List View' : 'Grid View')); }} className=' flex items-center gap-[7px] cursor-pointer border border-[1px] border-[#ddd] rounded-[5px] p-[5px_10px] min-w-[72px] h-[32px]'>
          <Image className='size-[18px] object-contain' height={25} width={25} alt='logo' src={productBoxView == 'Grid View' ? '/filters/list.svg' : '/filters/grid.svg'}></Image>
          <span className={`text-[14px] font-normal line-clamp-1`}>{productBoxView == 'Grid View' ? 'List' : 'Grid'}</span>
        </div>

        <div className=''>
          {typeof window !== "undefined" && <select value={localStorage['sort_by'] ? localStorage['sort_by'] : filters.sort_by} onChange={(e) => handleSortBy(e, "select")} className={` outline-none border-[1px] p-2 rounded-md border-gray-300 text-[13px] h-[32px]`} placeholder="Select options">
            {
              sortByOptions.map((item, i) => (
                <option value={item.value}>{item.text}</option>
              ))
            }
          </select>}
        </div>
      </div>

      <div className={`md:mb-[60px] lg:flex tab:flex tab:flex-col lg:py-5 lg:gap-[17px] md:gap-[10px] transition-all duration-300 ease-in `}>
        {

          <div id='filter-sec' className={`md:hidden ${checkOpenFilter() ? 'opacity-100 fade-in' : 'opacity-0'}  ${(tabView && openFilter) ? 'tab:w-[35%] tab:z-0' : ''} border-r border-r-[#0000001F] fixed lg:w-[20%] transition-all duration-300 ease-in mr-[10px] lg:top-[112px] tab:top-[220px] overflow-auto scrollbarHide h-[calc(100vh_-_125px)] bg-[#fff] z-[0]  `}>
            {<Filters mastersData={mastersData || []} ProductFilter={ProductFilter} priceBetween={priceBetween} setPriceBetween={setPriceBetween} filters={filters} setFilters={setFilters} fetchResults={handleFilterClick} clearFilter={removeFilter} foundValue={foundValue} />}
          </div>

        }

        <div className="lg:hidden tab:hidden sticky top-[50px] bg-[#f1f5f9] z-[99] ">
          {<MobileFilters mastersData={mastersData || []} filtersList={filters} handleSortBy={handleSortBy} filters={filters} setFilters={setFilters} productBoxView={productBoxView} ProductFilter={ProductFilter} fetchResults={handleFilterClick} clearFilter={removeFilter} foundValue={foundValue} />}
        </div>

        <div className='md:hidden tab:block lg:hidden sticky top-[110px] bg-[#f1f5f9] z-[10] w-full '>
          {<TabFilters mastersData={mastersData || []} filtersList={filters} handleSortBy={handleSortBy} setOpenFilter={setOpenFilter} filters={filters} setFilters={setFilters} productBoxView={productBoxView} openFilter={openFilter} changeValue={changeValue} />}
        </div>

        <div className={` ${(tabView && openFilter) ? 'tab:ml-[35%] tab:w-[65%] flex-[0_0_auto]' : 'tab:w-full tab:ml-0'} lg:w-[80%] lg:ml-[20%] md:w-full main-width transition-all duration-300 ease-in scale-in`}>
          <>
            {loader ?
              <Skeleton />
              :
              <div className='min-h-screen '>
                {((results.length != 0 && Array.isArray(results))) && <ProductBox openDetail={navigateDetail} pagination={lastResultRef} tabView={tabView} productList={results} openFilter={openFilter} rowCount={'lg:flex-[0_0_calc(25%_-_8px)] 2xl:flex-[0_0_calc(20%_-_8px)]'} productBoxView={productBoxView} />}
                {!loader && theme_settings && !loading && results.length === 0 && <NoProductFound cssClass={'flex-col lg:h-[calc(100vh_-_265px)] md:h-[calc(100vh_-_200px)]'} api_empty_icon={theme_settings.nofound_img} heading={'No Products Found!'} />}
              </div>
            }
            {/* <div className="" ref={lastResultRef}></div> */}

            {loading &&
              <div id="wave" className="loader">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            }
          </>
        </div>
      </div>


      {/* <div class={`md:mb-[60px] lg:flex tab:flex tab:flex-col lg:py-5 lg:gap-[17px] md:gap-[10px] transition-all duration-300 ease-in`}>
        {
          ((tabView && openFilter) || !tabView) && (
            <div id='filter-sec' className={`md:hidden ${(tabView && openFilter) && 'tab:w-[35%] tab:z-0'} border-r border-r-[1px] border-r-[#0000001F] fixed  lg:w-[20%]  transition-all duration-300 ease-in  mr-[10px] lg:top-[124px] tab:top-[186px] overflow-auto scrollbarHide h-[calc(100vh_-_125px)] bg-[#fff] z-[98]`}>
              {<Filters mastersData={mastersData || []} filtersList={filtersList} ProductFilter={ProductFilter} priceBetween={priceBetween} setPriceBetween={setPriceBetween} filters={filters} setFilters={setFilters} fetchResults={handleFilterClick} clearFilter={removeFilter} foundValue={foundValue} />}
            </div>
          )
        }

        <div className="lg:hidden tab:hidden sticky top-[50px] bg-[#f1f5f9] z-[99]">
          {<MobileFilters mastersData={mastersData || []} filtersList={filters} handleSortBy={handleSortBy} filters={filters} setFilters={setFilters} productBoxView={productBoxView} ProductFilter={ProductFilter} fetchResults={handleFilterClick} clearFilter={removeFilter} foundValue={foundValue} />}
        </div>

        <div className='md:hidden tab:block lg:hidden sticky top-[120px] bg-[#f1f5f9] z-[10] w-full'>
          {<TabFilters mastersData={mastersData || []} filtersList={filters} handleSortBy={handleSortBy} setOpenFilter={setOpenFilter} filters={filters} setFilters={setFilters} productBoxView={productBoxView} openFilter={openFilter} />}
        </div>

        <div className={`${(tabView && openFilter) ? 'tab:ml-[35%] tab:w-[65%] flex-[0_0_auto]' : 'tab:w-full tab:ml-0'} lg:w-[80%] lg:ml-[20%]  md:w-full main-width transition-all duration-300 ease-in`}>
          <>
            {loader ?
              <Skeleton />
              :
              <div className='min-h-screen'>
                {((results.length != 0 && Array.isArray(results))) ? <ProductBox tabView={tabView} productList={results} openFilter={openFilter} rowCount={'lg:flex-[0_0_calc(25%_-_8px)] 2xl:flex-[0_0_calc(20%_-_8px)]'} productBoxView={productBoxView} /> :
                  <>{theme_settings && !loading && <NoProductFound cssClass={'flex-col lg:h-[calc(100vh_-_265px)] md:h-[calc(100vh_-_200px)]'} api_empty_icon={theme_settings.nofound_img} heading={'No Products Found!'} />}</>
                }
              </div>
            }
           
            <div className="" ref={lastResultRef}></div>

            {loading &&
              <div id="wave">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            }

          </>
        </div>

      </div> */}

    </>
  )

}

export default memo(List)

const MobileFilters = ({ filtersList, ProductFilter, productBoxView, clearFilter, setFilters, handleSortBy, mastersData, filters, fetchResults, foundValue }) => {

  const [isOpen, setIsOpen] = useState(false)
  const [isOpenSort, setIsOpenSort] = useState(false)
  const dispatch = useDispatch();

  function closeModal() {
    setIsOpen(false);
    setIsOpenSort(false);
  }

  return (
    <>
      {isOpen && <div className='filtersPopup'>
        <Rodal visible={isOpen} enterAnimation='slideDown' animation='' onClose={closeModal}>
          <Filters mastersData={mastersData || []} filters={filters} setFilters={setFilters} filtersList={filtersList} ProductFilter={ProductFilter} closeModal={closeModal} clearFilter={clearFilter} fetchResults={fetchResults} foundValue={foundValue} />
        </Rodal>
      </div>
      }

      {isOpenSort && <div className='sortByPopup'>
        <Rodal visible={isOpenSort} enterAnimation='slideDown' animation='' onClose={closeModal}>
          <SortByFilter setFilters={setFilters} handleSortBy={handleSortBy} closeModal={closeModal} filters={filters} />
        </Rodal>
      </div>
      }

      <div className='flex items-center h-[45px] border-b-[1px] border-b-slate-100 bg-[#fff]'>
        <div onClick={() => { dispatch(setBoxView(productBoxView == 'Grid View' ? 'List View' : 'Grid View')); }} className='h-full flex items-center justify-center flex-[0_0_33.333%] gap-[7px]'>
          <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={productBoxView == 'Grid View' ? '/filters/list.svg' : '/filters/grid.svg'}></Image>
          <span className={`text-[14px] font-normal line-clamp-1`}>{productBoxView == 'Grid View' ? 'List' : 'Grid'}</span>
        </div>
        <div onClick={() => { setIsOpenSort(true) }} className='h-full flex items-center justify-center flex-[0_0_33.333%] border-r-[1px] border-r-slate-100  border-l-[1px] border-l-slate-100 gap-[7px]'>
          <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={'/filters/sort-by.svg'}></Image>
          <span className={`text-[14px] font-normal line-clamp-1`}>Sort By</span>
        </div>
        <div onClick={() => { setIsOpen(true) }} className='h-full flex items-center justify-center flex-[0_0_33.333%] gap-[7px]'>
          <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={'/filters/filter.svg'}></Image>
          <span className={`text-[14px] font-normal line-clamp-1`}>Filters</span>
        </div>
      </div>
    </>
  )
}



const TabFilters = ({ productBoxView, setFilters, handleSortBy, filters, setOpenFilter, openFilter, label_classname, changeValue }) => {

  const [isOpen, setIsOpen] = useState(false)
  const [isOpenSort, setIsOpenSort] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef(null)
  const dispatch = useDispatch();

  function closeModal() {
    setIsOpen(false);
    setIsOpenSort(false);
  }


  // const label_classname = "text-[18px] md:text-[13px] font-semibold"

  return (
    <>
      {isOpenSort && <div className='sortByPopup'>
        <Rodal visible={isOpenSort} enterAnimation='slideDown' animation='' onClose={closeModal}>
          <SortByFilter setFilters={setFilters} handleSortBy={handleSortBy} closeModal={closeModal} filters={filters} />
        </Rodal>
      </div>
      }

      <div className='bg-[#fff]'>
        <div className='flex items-center justify-between h-[45px] px-5 border-b-[1px] border-b-slate-100 bg-[#fff]'>

          <div className=''>
            <div className='flex items-center gap-5 justify-between'>
              <div className='flex items-center gap-1'>
                <Image src={'/filters/tabFilter.svg'} width={20} height={20} />
                <h5 className={`${label_classname}`}>Filters</h5>
              </div>
              <Switch checked={openFilter} onChange={(e) => setOpenFilter(e)} as={Fragment}>
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
          </div>

          <div>
            {/* <div className={`flex-[0_0_calc(45%_-_0px)]`}>
            <div  className={`'w-full'} relative flex justify-end`}>
              <div className="p-[5px_10px_5px_20px] h-[35px] flex items-center w-[69.5%]  border_color rounded-[30px]">
                <input value={searchValue} id='search' spellCheck="false" onKeyDown={handleKeyDown} ref={searchRef} onChange={(eve) => { getSearchTxt(eve) }} onFocus={() => { setActiveSearch(true) }} onBlur={() => { setActiveSearch(true) }} className='w-[95%] text-[14px]' placeholder='Search Products' />
                <Image onClick={() => { searchValue == '' ? null : navigateToSearch('/search/' + searchValue) }} style={{ objectFit: 'contain' }} className='h-[18px] w-[15px] cursor-pointer' height={25} width={25} alt='vantage' src={'/search.svg'}></Image>
              </div>
              {(activeSearch && searchProducts && searchProducts.length > 0) && <div className='w-[69.5%] p-[10px] max-h-[350px] min-h-[150px] overflow-auto scrollbarHide absolute top-[43px] bg-[#fff] z-99 rounded-[8px] shadow-[0_0_5px_#ddd]'>
                <SearchProduct router={router} loader={loader} all_categories={all_categories} searchValue={searchValue} get_search_products={get_search_products} searchProducts={searchProducts} theme_settings={theme_settings} navigateToSearch={navigateToSearch} /> </div>}
            </div>
          </div> */}
          </div>
          <div className='flex items-center'>
            <div onClick={() => { dispatch(setBoxView(productBoxView == 'Grid View' ? 'List View' : 'Grid View')); }} className='h-full flex items-center justify-center gap-[7px] mr-5'>
              <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={productBoxView == 'Grid View' ? '/filters/list.svg' : '/filters/grid.svg'}></Image>
              <span className={`text-[16px] font-normal`}>{productBoxView == 'Grid View' ? 'List' : 'Grid'}</span>
            </div>
            <div onClick={() => { setIsOpenSort(true) }} className='h-full flex items-center justify-center border-r-slate-100  border-l-[1px] border-l-slate-100 gap-[7px]'>
              <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={'/filters/sort-by.svg'}></Image>
              <span className={`text-[14px] font-normal`}>Sort By</span>
            </div>
            {/* <div onClick={() => { setIsOpen(true) }} className='h-full flex items-center justify-center flex-[0_0_33.333%] gap-[7px]'>
    <Image className='h-[20px] object-contain' height={25} width={25} alt='logo' src={'/filters/filter.svg'}></Image>
    <span className={`text-[14px] font-normal line-clamp-1`}>Filters</span>
  </div> */}
          </div>
        </div>
        <div className='border-b border-b-slate-100 px-5 py-3 gap-4 flex overflow-x-auto scrollbarHide'>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Upcoming Products"} type={'hot_product'} checked={filters.hot_product} label2={"Show Upcoming products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Show Promotion"} type={'show_promotion'} checked={filters.show_promotion} label2={"Show promotion products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"In Stock"} type={'in_stock'} checked={filters.in_stock} label2={"Show Instock products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Has Variants"} type={'has_variants'} checked={filters.has_variants} label2={"Show Variants products only"} changeValue={changeValue} />
          </div>
          <div className='flex-[0_0_auto]'>
            <SwitchComponent label_classname={label_classname} label1={"Bundle Item"} type={'custom_in_bundle_item'} checked={filters.custom_in_bundle_item} label2={"Show Bundle Item products only"} changeValue={changeValue} />
          </div>
        </div>

      </div>
    </>
  )
}

const SortByFilter = ({ ProductFilter, closeModal, setFilters, handleSortBy, filters }) => {

  let sorting = [
    { text: 'Relevance', value: '' },
    { text: 'Stock high to low', value: 'stock:desc' },
    { text: 'Stock low to high', value: 'stock:asc' },
    { text: 'Created Date', value: 'creation_on:desc' },
    { text: 'Price low to high', value: 'rate:asc' },
    { text: 'Price high to low', value: 'rate:desc' },
    { text: 'Mostly Sold', value: 'sold_last_30_days:desc' },
    { text: 'Least Sold', value: 'sold_last_30_days:asc' },
    { text: 'Discount high to low', value: 'discount_percentage:desc' },
    // { text: 'Discount low to high', value: 'discount_percentage:asc' },
  ]

  const handleSortOption = (value) => {
    handleSortBy(value, "")
    closeModal()
    // console.log(value);

  }


  return (
    <>
      <h5 className='text-[15px] font-semibold p-[10px]'>Sort By</h5>

      {sorting.map((res, index) => {
        return (
          <h6 onClick={() => { handleSortOption(res.value) }} className={`text-[15px] font-medium z-[99999999999] p-[10px] ${(localStorage['sort_by'] ? localStorage['sort_by'] : filters.sort_by) === res.value && 'bg-gray-100'}`}>{res.text}</h6>
        )
      })}
    </>
  )
}

const Skeleton = ({ }) => {
  return (
    <>
      <div className={`flex items-center animate-pulse lg:gap-[10px] flex-wrap`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((res, index) => {
          return (
            <div className='flex-[0_0_calc(33.3333%_-_8px)] md:flex-[0_0_calc(50%_-_0px)] h-[358px] border-[1px] border-slate-200 rounded-[5px]'>
              <div className='bg-slate-200 h-[200px] md:h-[140px] mb-[10px] md:m-[10px]'></div>
              <div className='p-[8px]'>
                <div className='bg-slate-200 h-[18px] mb-[5px] w-[80%] rounded-[5px]'></div>
                <div className='bg-slate-200 h-[25px] mb-[5px] w-[100%] rounded-[5px]'></div>
                <div className='bg-slate-200 h-[25px] mb-[5px] w-[60%] rounded-[5px]'></div>
                <div className='bg-slate-200 h-[30px] mb-[5px] w-[75%] rounded-[5px]'></div>
              </div>
              <div className='p-[0_8px_8px_8px] flex items-center justify-between'>
                <div className='bg-slate-200 h-[25px] w-[35%] rounded-[5px]'></div>
                <div className='bg-slate-200 h-[25px] text-end w-[35%] rounded-[5px]'></div>
              </div>
            </div>
          )
        })
        }
      </div>
    </>
  )
}

const Backdrop = () => {
  return (
    <div className='backdrop'>
      <div className="h-[100%] flex flex-col gap-[10px] items-center  justify-center">
        <div class="animate-spin rounded-full h-[40px] w-[40px] border-l-2 border-t-2 border-black"></div>
        <span className='text-[15px]'>Loading...</span>
      </div>
    </div>
  )
}



const SwitchComponent = ({ label1, label2, label_classname, checked, changeValue, type, filters }) => {
  const label2_class = 'text-[#7C7C7C] text-[12px]'
  return (
    <div className=''>
      <div className='flex items-center gap-3 justify-between'>
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

      {/* <p className={`${label2_class}`}>{label2}</p> */}
    </div>
  )
}


export async function getServerSideProps(req) {

  const { category = "", brand = "", search = "" } = await req.query;

  return {
    props: { category, brand, search }
  }
}

// export async function getServerSideProps(req) {

//   const { category, brand } = req.query;

//   // let productRoute = ''
//   // let value = params.list

//   // value.map((r, i) => {
//   //   productRoute = productRoute + r + ((value.length != (i + 1)) ? '/' : '')
//   // })

//   // let filterInfo = ''
//   // let currentId = ''

//   // let data = { "route": productRoute }
//   // let res = await get_category_filters(data);
//   // if (res && res.message) {
//   //   filterInfo = res.message
//   //   if (res.message.category_list && res.message.category_list.current_category && res.message.category_list.current_category.category_name) {
//   //     currentId = res.message.category_list.current_category
//   //   }
//   // }

//   // Fetch data from API

//   // const filters = {
//   //   item_group: category ? (Array.isArray(category) ? category : category.split(",")) : [],
//   //   brand: brand ? (Array.isArray(brand) ? brand : brand.split(",")) : [],
//   // };

//   // const buildFilterQuery = () => {
//   //   const filterParams = [];

//   //   if (filters.item_group.length) {
//   //     const values = filters.item_group.map(v => `"${v}"`).join(",");
//   //     filterParams.push(`item_group:=[${values}]`);
//   //   }

//   //   if (filters.brand.length) {
//   //     const values = filters.brand.map(v => `"${v}"`).join(",");
//   //     filterParams.push(`brand:=[${values}]`);
//   //   }

//   //   return filterParams.length > 0 ? filterParams.join(" && ") : "";
//   // };

//   // const queryParams = new URLSearchParams({
//   //   q: '*',
//   //   query_by: "item_name,item_description,brand",
//   //   page: "1",
//   //   per_page: "15",
//   //   query_by_weights: "1,2,3",
//   //   filter_by: buildFilterQuery(),
//   // });

//   // const data = await typesense_search_items(queryParams);
//   // const initialData = data.hits || [];
//   // const found = data.found || 0


//   return {
//     // props: { productRoute, filterInfo, currentId, params, mastersData }
//     // props: { initialData, found }
//   }

// }

// export async function getServerSideProps({ params }) {
//   let productRoute = ''
//   let value = params.list

//   value.map((r, i) => {
//     productRoute = productRoute + r + ((value.length != (i + 1)) ? '/' : '')
//   })

//   let datas = {
//     "route": productRoute,
//     "page_no": 1,
//     "page_size": 12,
//   }

//   let res = await get_category_products(datas);
//   let list = res.message

//   return {
//     props: { productRoute, list }
//   }

// }