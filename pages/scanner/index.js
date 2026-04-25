import React, { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { typesense_search_items } from '@/libs/api';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import NoProductFound from '@/components/Common/NoProductFound';
import MobileHeader from '@/components/Headers/mobileHeader/MobileHeader';
import { Scanner } from "@yudiel/react-qr-scanner";
import ProductDetail from '@/components/Detail/ProductDetail';
import { useDispatch } from 'react-redux';
import { setProductDetail } from '@/redux/slice/productDetail';

function QrScanner() {
  const router = useRouter()
  const [qrCodeNumber, setQrNumber] = useState('');
  const dispatch = useDispatch();

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (qrCodeNumber && qrCodeNumber.length !== 0) {
      getScannedProducts(qrCodeNumber)
    }
  }, [qrCodeNumber])

  const getScannedProducts = async (barcode) => {
    // console.log(barcode, "barcode")

    const queryParams = new URLSearchParams({
      q: "*",
      // query_by: "item_name,item_description,brand",
      // page: "1",
      // per_page: "1",
      // query_by_weights: "1,2,3",
      filter_by: `barcode:=${barcode}`,
    });

    const data = await typesense_search_items(queryParams);
    // console.log(data, "data")
    if (data && data.hits && data.hits.length > 0 && data.hits[0] && data.hits[0].document) {
      navigateDetail(data.hits[0].document);
      // router.push(`/pr/${data.hits[0].document.item_code}`)
    } else {
      toast.error('Something went wrong!')
      setErrorMsg("No product found!");
    }
  }

  const [detailVisible, setDetailVisible] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const navigateDetail = (item) => {
    dispatch(setProductDetail(item));
    setCurrentProduct(item)
    document.body.style.overflow = "hidden"
    setDetailVisible(true)
  }

  const DetailHide = (status) => {
    setDetailVisible(false)
    document.body.style.overflow = "unset"
    setCurrentProduct(null)
  }

  return (
    <>
      {detailVisible && <ProductDetail visible={detailVisible} product={currentProduct} hide={DetailHide} />}

      {<MobileHeader titleDropDown={true} back_btn={true} search={true} />}

      <div className="flex flex-col items-center md:items-center min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

        <div className="w-full max-w-md bg-white shadow-md rounded-lg p-4">
          {
            errorMsg === '' ? (
              <Scanner
                onScan={(result) => { setQrNumber(result[0].rawValue) }}
                //   onDecode={(result) => setScannedData(result)}
                //   onError={(error) => console.error("QR Scanner Error:", error)}
                className="w-full"
              />
            ) : (
              <NoProductFound cssClass={'flex-col lg:h-[calc(100vh_-_265px)] md:h-[calc(100vh_-_200px)]'} heading={'No Products Found!'} />
            )
          }
        </div>
      </div>
    </>
  );
}

export default QrScanner;







{/* <div className='bg-gray-200 min-h-screen flex justify-center items-center'>
      <div className="w-full h-full">
        {
          errorMsg === '' ? (
            <div ref={videoRef} className="w-full h-[400px] bg-white relative video_scanner">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-36 rounded-lg">
                {scanning && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-scan" />
                )}
              </div>
            </div>
          ) : (
            <NoProductFound cssClass={'flex-col lg:h-[calc(100vh_-_265px)] md:h-[calc(100vh_-_200px)]'} heading={'No Products Found!'} />
          )
        }


      </div>
    </div> */}