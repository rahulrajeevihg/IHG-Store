import { createSlice } from '@reduxjs/toolkit'

export const cartSettings = createSlice({
  name: 'cartSettings',
  initialState: {
    cartItems:[],
    wishlistItems:[],
    cartCount:0,
    wishlistCount:0,
    cartValue:{},
    you_may_like:[]
  },

  reducers: {

    setCartItems:(state,action) => {
       
        state.cartValue = action.payload.cart ? action.payload.cart : {}
        state.you_may_like = action.payload.you_may_like ? action.payload.you_may_like : []

        // console.log(action.payload,'action.payload')

        if(action.payload.cart && action.payload.cart.marketplace_items){
          state.cartItems = action.payload.cart.marketplace_items
          // console.log(state.cartItems,'state.cartItems')
          if(state.cartItems.length != 0){
            state.cartItems.map(res=>{
              res.cart_id = res.name;
              res.count = res.quantity
            })
          }
          state.cartCount = state.cartItems.length
        }else{
          state.cartItems = []
        }

        if(action.payload.wishlist && action.payload.wishlist.marketplace_items){
          state.wishlistItems = action.payload.wishlist.marketplace_items
          state.wishlistCount = state.wishlistItems.length
        }else{
          state.wishlistItems = []
        }
      
    },

    resetCart:(state,action) => {
      state.cartItems = [],
      state.wishlistItems = [],
      state.cartCount = 0,
      state.wishlistCount = 0,
      state.cartValue = {}
    },
  },
})

// Action creators are generated for each case reducer function
export const { setCartItems, resetCart } = cartSettings.actions

export default cartSettings.reducer