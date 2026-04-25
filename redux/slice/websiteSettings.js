import { createSlice } from '@reduxjs/toolkit'

export const websiteSettings = createSlice({
  name: 'websiteSettings',
  initialState: {
    websiteSettings:{},
    productBoxView:'Grid View',
    selectedAddress:[],
    successMsg:'',
    errorMsg:'',
    business:'',
    adddressInfo:''
  },

  reducers: {

    setWebSetting:(state,action) => {
        state.websiteSettings = action.payload
    },

    setBoxView:(state,action) => {
      state.productBoxView = action.payload
    },

    setSuccess:(state,action) => {
      state.successMsg = action.payload
    },

    setError:(state,action) => {
      state.errorMsg = action.payload
    },

    setBusiness:(state,action) => {
      if(typeof(action.payload) == 'string'){
        state.business = action.payload
      }else{
        state.adddressInfo = action.payload
      }
    },

  },
})

// Action creators are generated for each case reducer function
export const { setWebSetting, setBoxView, setSuccess,setError, logOutUser, setBusiness } = websiteSettings.actions

export default websiteSettings.reducer