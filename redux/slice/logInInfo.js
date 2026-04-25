import { createSlice } from '@reduxjs/toolkit'

export const logInInfo = createSlice({
  name: 'logInInfo',
  initialState: {
    customerInfo:{},
  },

  reducers: {
    setCustomerInfo:(state,action) => {
        state.customerInfo = action.payload ? action.payload : {}
    },
  },
})

// Action creators are generated for each case reducer function
export const { setCustomerInfo } = logInInfo.actions

export default logInInfo.reducer