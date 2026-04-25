import React from 'react'
import Rodal from 'rodal';
// include styles
// import 'rodal/lib/rodal.css';
import Address from './Address';

export default function AddressModal({hide,visible,edit_address}) {
  return (
    <div className='address-popup'>
      <Rodal visible={visible} animation='slideUp' onClose={()=>{hide(undefined)}}>
         <Address modal={true} edit_address={edit_address} hide={(obj)=>{ hide(obj)}}  />      
     </Rodal>
    </div>
  )
}
