
import { check_Image } from '@/libs/api';
import Image from 'next/image';
import { useRouter } from 'next/router';
const GridItem = ({ data }) => {
   // console.log(data)
   const router = useRouter()
   return (
      <div className=" grid-containertwo gap-[10px] gridimage relative w-[90%] mx-auto border p-[20px] border-[#8A6352] ">
         <div className='absolute z-40'>
            <Image src={check_Image(data.tag)} width={100} height={400} alt='tag'  className='md:!w-[80px]'/>
         </div>
         <div className='absolute right-0 bottom-0 rotate-180 z-40'>
            <Image src={check_Image(data.tag)} width={100} height={400} alt='tags' className='md:!w-[80px]'/>
         </div>
         <div className=' z-0  grid-item1 flex items-center justify-center relative group overflow-hidden '>
            <div className='cursor-pointer' onClick={()=> data.link1 ? router.push(data.link1) : null} >
               <Image src={check_Image(data.img1)} width={300} height={300} alt="image1" className='w-[100%] object-contain transition-[transform_0.5s_ease] group-hover:transform group-hover:rotate-0 group-hover:scale-[1.2] ' />
               <div className='absolute opacity-0 transition-[opacity_0.5s_ease] group-hover:opacity-[1]   flex items-center justify-center left-0 top-0 bottom-0 right-0 h-[100%] w-[100%]  bg-[rgba(0,_0,_0,_0.2)] mix-blend-overlay'>
                  <Image src={"/insta.svg"} width={50} height={50} alt='instaicon' className='md:w-[30px] md:h-[30px]'/>
               </div>
            </div>
         </div>

         <div className='  grid-item3 flex items-center justify-center relative group overflow-hidden'>
            <div className='cursor-pointer' onClick={()=> data.link2 ? router.push(data.link2) : null}>
               <Image src={check_Image(data.img2)} width={300} height={300} alt="image2" className='w-[100%] object-contain transition-[transform_0.5s_ease] group-hover:transform group-hover:rotate-0 group-hover:scale-[1.2]' />
               <div className='absolute opacity-0 transition-[opacity_0.5s_ease] group-hover:opacity-[1] mix-blend-overlay  flex flex-col items-center justify-center left-0 top-0 bottom-0 right-0 h-[100%] w-[100%]  bg-[rgba(0,_0,_0,_0.2)] '>
                  <Image src={"/insta.svg"} width={50} height={50} alt='instaicon' className='md:w-[30px] md:h-[30px]' />
                  <p className='absolute top-0 right-0 flex items-end justify-center w-[100%] h-[100%] uppercase text-white font-semibold md:text-[14px] lg:text-[20px] tracking-[5px] pb-[10px]'>Shop</p>
               </div>
            </div>
         </div>

         <div className='img3 grid-item2 flex items-center justify-center relative group overflow-hidden'>
            <div className='cursor-pointer' onClick={()=> data.link3 ? router.push(data.link3) : null}>
               <Image src={check_Image(data.img3)} width={300} height={300} alt="image3" className='w-[100%] object-contain transition-[transform_0.5s_ease] group-hover:transform group-hover:rotate-0 group-hover:scale-[1.2]' />
               <div className='absolute opacity-0 transition-[opacity_0.5s_ease] group-hover:opacity-[1] mix-blend-overlay  flex flex-col items-center justify-center left-0 top-0 bottom-0 right-0 h-[100%] w-[100%]  bg-[rgba(0,_0,_0,0.1)] '>
                  <Image src={"/insta.svg"} width={50} height={50} alt='instaicon' className='md:w-[30px] md:h-[30px]' />
                  <p className='absolute top-0 right-0 flex items-end justify-center w-[100%] h-[100%] uppercase text-white mix-blend-overlay font-semibold md:text-[14px] lg:text-[20px] tracking-[5px] pb-[10px]'>Shop</p>
               </div>
            </div>
         </div>

         <div className='img4 grid-item4 flex items-center justify-center relative group overflow-hidden'>
            <div className='cursor-pointer' onClick={()=> data.link4 ? router.push(data.link4) : null}>
               <Image src={check_Image(data.img4)} width={300} height={300} alt="image4" className='w-[100%] object-contain transition-[transform_0.5s_ease] group-hover:transform group-hover:rotate-0 group-hover:scale-[1.2]' />
               <div className='absolute opacity-0 transition-[opacity_0.5s_ease] group-hover:opacity-[1] mix-blend-overlay  flex flex-col items-center justify-center left-0 top-0 bottom-0 right-0 h-[100%] w-[100%]  bg-[rgba(0,_0,_0,_0.2)] '>
                  <Image src={"/insta.svg"} width={50} height={50} alt='instaicon' className='md:w-[30px] md:h-[30px]' />
                  <p className='absolute top-0 right-0 flex items-end justify-center w-[100%] h-[100%] uppercase text-white font-semibold md:text-[14px] lg:text-[20px] tracking-[5px] pb-[10px]'>Shop</p>
               </div>
            </div>
         </div>

         <div className='img5 grid-item5 flex items-center justify-center relative group overflow-hidden'>
            <div className='cursor-pointer' onClick={()=> data.link5 ? router.push(data.link5) : null}>
               <Image src={check_Image(data.img5)} width={300} height={300} alt="image5" className='w-[100%] object-contain transition-[transform_0.5s_ease] group-hover:transform group-hover:rotate-0 group-hover:scale-[1.2]' />
               <div className='absolute opacity-0 transition-[opacity_0.5s_ease] group-hover:opacity-[1]   flex items-center justify-center left-0 top-0 bottom-0 right-0 h-[100%] w-[100%]  bg-[rgba(0,_0,_0,_0.2)] mix-blend-overlay'>
                  <Image src={"/insta.svg"} width={50} height={50} alt='instaicon' className='md:w-[30px] md:h-[30px]' />
               </div>
            </div>
         </div>
      </div>
   )
}
export default GridItem