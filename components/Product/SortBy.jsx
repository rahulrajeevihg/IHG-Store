import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'
import Image from 'next/image';

export default function Example({ProductFilter, sort_by}) {

    let sortings = [
        { text: 'Relevance', role: '' },
        { text: 'Name: A-Z', role: 'name_asc' },
        { text: 'Name: Z-A', role: 'name_desc' },
        { text: 'Price: Low-High', role: 'price_asc' },
        { text: 'Price: High-Low', role: 'price_desc' }
    ] 

    const [soryBy,setSortBy] = useState('Relevance')

    useEffect(()=>{

      if(sort_by){
        let value = sortings.find(res=>{return res.role == sort_by})
        value ? setSortBy(value.text) : null
      }else if(sort_by == ""){
        setSortBy('Relevance')
      }

    },[sort_by])
    
  return (
    <div className="">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center rounded-md gap-[5px] bg-[#fff] p-[8px_10px] text-sm font-medium text-slate-500 hover:shadow-[0_0_5px_#f1f1f1] focus:outline-none border-[1px] border-slate-200 rounded-[5px] w-max">
            {soryBy}
            <Image className='h-[10px] object-contain mt-[4px]' height={14} width={14} alt='logo' src={'/Arrow/downArrowBlack.svg'}></Image>
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="z-99 absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 ">
              {sortings.map((res,index)=>{
                return(
                <Menu.Item key={index}>
                    {({ active }) => (
                    <button onClick={()=>{setSortBy(res.text),ProductFilter({'sort':res.role})}} className={`group flex w-full items-center rounded-md px-2 py-2 text-sm 
                        ${active ? 'bg-slate-100 text-black' : 'text-gray-900'} hover:bg-slate-200`}>
                        {res.text}
                    </button>
                    )}
                </Menu.Item>
                );
              })}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

