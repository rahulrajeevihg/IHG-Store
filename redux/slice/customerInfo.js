import { createSlice } from '@reduxjs/toolkit'

export const customerInfo = createSlice({
  name: 'customerInfo',
  initialState: {
    customerDetail: {},
    address: []
  },

  reducers: {

    setDetail: (state, action) => {
      state.customerDetail = action.payload
    },

    setAddress: (state, action) => {

      let name = action.payload.name
      let is_default = action.payload.is_default
      let address = [];

      address = state?.customerDetail?.address ? state.customerDetail.address : []
      address = [...address, ...[action.payload]]

      address.map(r => {
        if (is_default == 1) {
          r.is_default = (r.name == name) ? 1 : 0
        }
      })

      state.customerDetail.address = address;

    },

    updateAddress: (state, action) => {
      state.customerDetail.address = action.payload

      // let name =  action.payload.name
      // let is_default =  action.payload.is_default
      // let address = state.customerDetail.address

      // address.map((r,i)=>{  
      //   if(r.name == name){
      //    r = action.payload
      //   }

      //   if(is_default == 1){
      //     r.is_default = (r.name == name) ? 1 : 0
      //     console.log(i,'-', r.is_default)

      //   }

      // })

      // state.customerDetail.address = address 

      // console.log('state.customerDetail.address', address)
      // state.customerDetail.address = state.customerDetail.address ? state.customerDetail.address : []
      // state.customerDetail.address = [...state.customerDetail.address,...action.payload]
    },

    deleteAddress: (state, action) => {
      let index = state.customerDetail.address.findIndex(res => { return res.name == action.payload })
      if (index >= 0) {
        state.customerDetail.address.splice(index, 1)
      }
    },

    customerInfoAction: (state, action) => {
      state.address = action.payload
    },

    resetCust: (state, action) => {
      state.address = [];
      state.customerDetail = {}
    }

  },
})

// Action creators are generated for each case reducer function
export const { setDetail, setAddress, updateAddress, deleteAddress, customerInfoAction,resetCust } = customerInfo.actions

export default customerInfo.reducer