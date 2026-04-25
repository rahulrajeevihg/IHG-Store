import Image from 'next/image';
import Link from 'next/link'
import { check_Image } from '@/libs/api';

export default function TopBar({top_menu}) {
    
  return (
    <div className='flex item-center  primary_bg h-[30px] px-[10px]'>
      {/* main-width */}
      <div className='headerWidth_r !m-[0_auto] flex item-center gap-[10px]'>
        
        <div className='flex-[calc(50%_-_7px)] flex items-center justify-center gap-[10px]'>
          {(top_menu && top_menu.left_items && top_menu.left_items.length != 0)&&
            top_menu.left_items.map((res,index)=>{
              return(
                <>
                {/* {res.redirect_url && <Link href={res.redirect_url}    className={`flex items-center cursor-pointer text-[#fff] gap-[2px]`} key={index}> */}
                  {res.icon && <Image style={{ objectFit: 'contain' }} className='h-[18px] w-[15px]' height={25}  width={25} alt='vantage' src={check_Image(res.icon)}></Image>}
                  {res.menu_label && <h6 className='text-left text-[12px] mb-[0px] text-[#fff] font-medium'>{res.menu_label}</h6>}
                  {/* </Link>
                } */}
                </>
              )
            })
          } 
        </div>

        <div className='flex-[calc(50%_-_7px)] flex items-center gap-[10px] justify-end'>
        {top_menu && top_menu.right_items && top_menu.right_items.length != 0 &&
            top_menu.right_items.map((res,index)=>{
              return(
                  <>
                    {res.redirect_url && <Link href={res.redirect_url}    className={`flex items-center cursor-pointer text-[#fff] gap-[2px]`} key={index}>
                      {res.icon && <Image style={{ objectFit: 'contain' }} className='h-[18px] w-[15px]' height={25}  width={25} alt='vantage' src={check_Image(res.icon)}></Image>}
                      {res.menu_label && <h6 className='text-left text-[12px] mb-[0px] text-[#fff] font-medium'>{res.menu_label}</h6>}
                      </Link>
                    }
                  </>
                )
            })
          } 
        </div>

      </div>

    </div>
  )
}
