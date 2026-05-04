import { createSlice } from '@reduxjs/toolkit'

export const cartSettings = createSlice({
  name: 'cartSettings',
  initialState: {
    cartItems:[],
    wishlistItems:[],
    cartCount:0,
    wishlistCount:0,
    cartValue:{},
    you_may_like:[],
    selectedOpportunity: null,  // { name, customer, customer_name, title }
    itemNotes: {},              // { [item_code]: string }
  },

  reducers: {

    setCartItems:(state,action) => {
      // Store totals from top-level response (backend returns total/grand_total alongside cart)
      state.cartValue = {
        ...(action.payload.cart ? action.payload.cart : {}),
        total: action.payload.total || 0,
        grand_total: action.payload.grand_total || 0,
      }
      state.you_may_like = action.payload.you_may_like ? action.payload.you_may_like : []

      if(action.payload.cart && action.payload.cart.marketplace_items){
        state.cartItems = action.payload.cart.marketplace_items
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

    // Optimistic local qty update — prevents UI flicker while API call is in flight
    updateItemQty:(state, action) => {
      const { item_code, qty } = action.payload;
      const item = state.cartItems.find(i => i.item_code === item_code);
      if (item) {
        item.count = qty;
        item.quantity = qty;
      }
    },

    // Optimistic local removal
    removeItem:(state, action) => {
      const { item_code } = action.payload;
      state.cartItems = state.cartItems.filter(i => i.item_code !== item_code);
      state.cartCount = state.cartItems.length;
      delete state.itemNotes[item_code];
    },

    resetCart:(state) => {
      state.cartItems = []
      state.wishlistItems = []
      state.cartCount = 0
      state.wishlistCount = 0
      state.cartValue = {}
      state.selectedOpportunity = null
      state.itemNotes = {}
    },

    setSelectedOpportunity:(state, action) => {
      state.selectedOpportunity = action.payload;
    },

    clearSelectedOpportunity:(state) => {
      state.selectedOpportunity = null;
    },

    setItemNote:(state, action) => {
      const { item_code, note } = action.payload;
      if (note) {
        state.itemNotes[item_code] = note;
      } else {
        delete state.itemNotes[item_code];
      }
    },

    clearItemNotes:(state) => {
      state.itemNotes = {};
    },
  },
})

export const {
  setCartItems,
  resetCart,
  updateItemQty,
  removeItem,
  setSelectedOpportunity,
  clearSelectedOpportunity,
  setItemNote,
  clearItemNotes,
} = cartSettings.actions

export default cartSettings.reducer
