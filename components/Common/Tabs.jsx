import Image from "next/image";
import React, { useEffect, useState } from "react";

const Tabs = ({ stockDetails, productDetails }) => {
  const [activeTab, setActiveTab] = useState(0);

  // const productDetails = {
  //   "Barcode": "/barcode.png",
  //   "Product Code": "0026165",
  //   "Brand": "SYLVANIA",
  //   "Group": "LIGHTING",
  //   "Lumen Output": "LIGHTING",
  // };

  // const stockDetails = {
  //   "Lumen Output": "136lm",
  //   "Range": "INDOOR",
  //   "Series": "TOLEDO",
  //   "Stock Uom": "Nos",
  // };

  useEffect(() => {

  }, [stockDetails])

  const tabs = [
    { id: 0, label: "Product Details" },
    { id: 1, label: "Stock Details" },
    { id: 2, label: "QR Code" }
  ];

  const removeBarcode = (data) => {
    if (data && data.split(",") && data.split(",").length > 1) {
      return data.split(",")[0]
    }

    return data
  }


  const renderContent = () => {
    if (activeTab === 0) {
      return (
        <div className="space-y-6">

          <div className="item-desc">
            <p
              className='leading-[30px]'
              dangerouslySetInnerHTML={{
                __html: productDetails.full_description,
              }}
            />
          </div>

          <div className="space-y-2">
            {productDetails.last_sold > 0 && (
              <div className="flex items-center gap-2">
                <Image src="/calendar.svg" width={20} height={20} />
                <p className="text-[15px] md:text-[13px] font-semibold"><span className="text-red-700 font-bold text-[15px] md:text-[13px] mr-2">{productDetails.last_sold}</span>Days Since Last Sold</p>
              </div>
            )}

            {productDetails.last_brought > 0 && (
              <div className="flex items-center gap-2">
                <Image src="/calendar.svg" width={20} height={20} />
                <p className="text-[15px] md:text-[13px] font-semibold"><span className="text-[#009f58] font-bold text-[15px] md:text-[13px] mr-2">{productDetails.last_brought}</span>Days Since Last Buyed</p>
              </div>
            )}
          </div>
          {/* <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Detail</th>
                <th className="border border-gray-300 px-4 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {productDetails.barcode && <tr className="text-gray-700 text-center">
              </tr>}

              <TableDatas index={2} label={"Product Code"} value={productDetails.item_code} />
              <TableDatas index={3} label={"Brand"} value={productDetails.brand} />
              <TableDatas index={4} label={"Group"} value={productDetails.item_group} />
              <TableDatas index={5} label={"Stock Uom"} value={productDetails.stock_uom} />
              <TableDatas index={6} label={"Beam Angle"} value={productDetails.beam_angle} />
              <TableDatas index={7} label={"body finish"} value={productDetails.body_finish} />
              <TableDatas index={8} label={"category list"} value={productDetails.category_list} />
              <TableDatas index={9} label={"color temp"} value={productDetails.color_temp_} />
              <TableDatas index={10} label={"dimension"} value={productDetails.dimension} />
              <TableDatas index={11} label={"input"} value={productDetails.input} />
              <TableDatas index={12} label={"ip rate"} value={productDetails.ip_rate} />
              <TableDatas index={13} label={"lamp type"} value={productDetails.lamp_type} />
              <TableDatas index={14} label={"lumen output"} value={productDetails.lumen_output} />
              <TableDatas index={15} label={"material"} value={productDetails.material} />
              <TableDatas index={16} label={"mounting"} value={productDetails.mounting} />
              <TableDatas index={17} label={"output current"} value={productDetails.output_current} />
              <TableDatas index={18} label={"output voltage"} value={productDetails.output_voltage} />
              <TableDatas index={19} label={"power"} value={productDetails.power} />
              <TableDatas index={20} label={"product type"} value={productDetails.product_type} />
              <TableDatas index={21} label={"warranty"} value={productDetails.warranty_} />

            </tbody>
          </table> */}

        </div>
      );
    } else if (activeTab === 1) {
      return (
        <div className="space-y-2">
          {stockDetails && stockDetails.length > 0 ? <>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">No</th>
                  <th className="border border-gray-300 px-4 py-2">Warehouse</th>
                  <th className="border border-gray-300 px-4 py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockDetails.map((res, index) => (
                  <tr key={res.warehouse} className="text-gray-700 text-center">
                    <td className="border  border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border  border-gray-300 px-4 py-2 text-start md:text-[12px]">{res.warehouse}</td>
                    <td className="border  border-gray-300 px-4 py-2 font-bold md:text-[12px]">{res.actual_qty}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-2"></td>
                  <td className="border  border-gray-300 px-4 py-2 text-start md:text-[13px]">Total</td>
                  <td className="border  border-gray-300 px-4 py-2 font-bold text-center md:text-[13px]">{productDetails.stock}</td>
                </tr>
              </tbody>
            </table>


          </>
            : <>
              <div className="flex items-center justify-center">
                <h5 className="text-[14px] font-semibold">No Stocks available</h5>
              </div>
            </>}
        </div>
      );
    } else if (activeTab === 2) {
      return (
        <div>
          {productDetails.barcode &&
            <tr className="flex justify-center items-center border">
              <Image src={`https://quickchart.io/qr?text=${productDetails.barcode}`} width={30} height={30} className="size-[230px]" />
            </tr>}

          {!productDetails.barcode && (
            <div className="flex justify-center items-center text-[14px] font-semibold">
              <h2>QR Not Available</h2>
            </div>
          )}
        </div>
      )
    }
  };

  return (
    <div className="w-full mt-2">
      <div className="flex gap-4 border-b border-gray-300 tab:overflow-auto scrollbarHide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`py-2 text-[15px] flex-[0_0_auto] lg:text-[16px] font-medium border-b-2 transition-all duration-300 ${activeTab === tab.id
              ? "text-black border-black"
              : "text-[#7C8184] border-transparent"
              }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

const TableDatas = ({ label, value, index }) => {
  return (
    <>
      {/* {value ? <div className="flex justify-between items-center gap-3 py-2 text-gray-700 h-[40px]" >
        <span className="lg:text-[15px] md:text-[14px] font-normal capitalize"> {label} :</span>
        <span className="font-bold lg:text-[15px] md:text-[14px]">{value}</span>
      </div> : <></>} */}

      {value ? <tr className="text-gray-700 text-center">
        {/* <td className="border  border-gray-300 px-4 py-2">{index}</td> */}
        <td className="border  border-gray-300 px-4 py-2 text-start md:text-[13px]">{label}</td>
        <td className="border  border-gray-300 px-4 py-2 font-bold md:text-[12px]">{value}</td>
      </tr> : <></>}
    </>
  )
}

export default Tabs;
