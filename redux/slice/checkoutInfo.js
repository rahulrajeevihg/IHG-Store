import { createSlice } from '@reduxjs/toolkit'

export const checkoutInfo = createSlice({
  name: 'checkoutInfo',
  initialState: {
    checkoutDetail:{},
    total:{
      total:0,
      tax:0,
      discount_tax:0,
      coupon_tax:0,
      walletAmount:0,
      shippingAmount:0,
      discountTotalAmount:0,
      discount_name:'',
      discount_amount:0,
      couponName:'',
      coupon_amount:0,
      totalAmount:0,
      payableAmount:0,
      activeWallet:false,
    }
  },

  reducers: {
    setCheckoutInfo:(state,action) => {
      state.customerDetail = action.payload
    },

    setTotal:(state,action) => {
      let value = action.payload
      if (value) {
         let key = Object.keys(value);
   
         if (key.length != 0) {
           key.map(res=>{
            if (res == 'total') {
              state.total.total = value[res];
            }else if (res == 'tax') {
              state.total.tax = value[res];
            }else if (res == 'discount_tax') {
              state.total.discount_tax = value[res];
            }else if (res == 'coupon_tax') {
              state.total.coupon_tax = value[res];
            }else if (res == 'walletAmount') {
              state.total.walletAmount = value[res];
            }else if (res == 'shippingAmount') {
              state.total.shippingAmount = value[res];
            }else if (res == 'discount_amount') {
              state.total.discount_amount = value[res];
            }else if (res == 'discount_name') {
              state.total.discount_name = value[res];
            }else if (res == 'coupon_amount') {
              state.total.coupon_amount = value[res];
            }else if (res == 'couponName') {
              state.total.couponName = value[res];
            }else if (res == 'wallet') {
              state.total.activeWallet = value[res];
            }     
           })

          //  console.log('state.total',  state.total)
           let walletAmt = state.total.walletAmount
           let tax = state.total.coupon_amount > 0 ? state.total.coupon_tax : state.total.tax 
          //  state.total.tax = state.total.tax + state.total.discount_tax + state.total.coupon_tax

           if(state.total.activeWallet){
              walletAmt = 0
           }

           state.total.discountTotalAmount = (state.total.discount_amount + state.total.coupon_amount)
           state.total.payableAmount = (state.total.total + tax + state.total.shippingAmount) - state.total.discountTotalAmount 
           state.total.totalAmount = (state.total.total + tax + state.total.shippingAmount) - state.total.discountTotalAmount 


            if(walletAmt > 0 && walletAmt >=  state.total.payableAmount){
              state.total.payableAmount = state.total.payableAmount
            }else{
              state.total.payableAmount = state.total.payableAmount - walletAmt
            }


         }
      }
    },
    
  },
})

// Action creators are generated for each case reducer function
export const { setCheckoutInfo, setTotal } = checkoutInfo.actions

export default checkoutInfo.reducer