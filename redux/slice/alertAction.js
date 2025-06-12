import { createSlice } from '@reduxjs/toolkit'

export const alertAction = createSlice({
  name: 'cartSettings',
  initialState: {
    isOpen : false
  },

  reducers: {
    setCartItems:(state) => {
        state.isOpen =! state.isOpen
    },
  },
})

// Action creators are generated for each case reducer function
export const { alertReducer } = alertAction.actions

export default alertAction.reducer