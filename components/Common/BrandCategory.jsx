
import { setBrand, setFilter } from "@/redux/slice/filtersList"
import Link from "next/link"
import { useDispatch } from "react-redux"

const BrandCategory = ({ masterValue, title, keys, sliceKey }) => {
  const dispatch = useDispatch()
  const changeCategory = (item, keys) => {
    // router.push("/list")
    // router.push("/" + item.redirect_url)
    const val = item
    if (keys === "item_group") {
      dispatch(setFilter([val]))
      dispatch(setBrand([]))
    } else {
      dispatch(setFilter([]))
      dispatch(setBrand([val]))
    }
    // console.log(val, "val")

  }
  return (
    <>
      <div className="main-width md:px-[10px]">
        <h1 className={`text-[#000000B2] text-[22px] md:text-[18px] font-semibold`}>{title}</h1>

        <div className='grid-cols-6 md:grid-cols-3 grid gap-[10px] py-5 overflow-hidden'>
          {masterValue[keys].slice(0, sliceKey ? sliceKey : masterValue[keys].length).map(res => (
            <Link onClick={() => changeCategory(res, keys)} href={`/list?${keys === "item_group" ? 'category=' + res : 'brand=' + res}`} key={res}>
              {/* <Link href={`/list?${keys === "item_group" ? "category" : "brand"}=${res}`} key={res}> */}
              <h6 className="text-[#00000080] text-[14px] md:text-[13px] font-medium">{res}</h6>
            </Link>
          ))}

        </div>

      </div>
    </>
  )
}

export default BrandCategory