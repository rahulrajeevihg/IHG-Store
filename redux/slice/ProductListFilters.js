import { createSlice } from '@reduxjs/toolkit'

export const ProductListFilters = createSlice({
  name: 'ProductListFilters',
  initialState: {
    filtersValue: {
      page_no: 1,
      sort: '',
      min_price: undefined,
      max_price: undefined,
      // brands: undefined,
      attributes: undefined,
      rating: undefined,
      no_product: true,
      scrollProduct: false,
      selectedAttributes: [],
      loadData: false,
      code: '',
      description: '',
    },
    clearAttributeFilters: {}
  },

  reducers: {

    setFilters: (state, action) => {
      let value = action.payload
      if (value) {
        let key = Object.keys(value);
        state.filtersValue.loadData = state.filtersValue.loadData ? false : true
        if (key.length != 0) {
          state.filtersValue.scrollProduct = true,
            key.map(res => {
              if (res == 'page_no') {
                state.filtersValue.page_no = value[res];
              } else if (res == 'sort') {
                state.filtersValue.sort = value[res];
              } else if (res == 'minPrice') {
                state.filtersValue.min_price = value[res];
              } else if (res == 'maxPrice') {
                state.filtersValue.max_price = value[res];
              } else if (res == 'brands') {
                state.filtersValue.brands = value[res];
              } else if (res == 'attribute') {
                state.filtersValue.attributes = value[res];
              } else if (res == 'rating') {
                state.filtersValue.rating = value[res];
              } else if (res == 'no_product') {
                state.filtersValue.no_product = value[res];
              } else if (res == 'selectedAttributes') {
                state.filtersValue.selectedAttributes = value[res];
              } else if (res == 'code') {
                state.filtersValue.code = value[res];
              } else if (res == 'description') {
                state.filtersValue.description = value[res];
              }
            })
        }
      }
    },



    setLoad: (state, action) => {
      state.filtersValue.loadData = action.payload
    },

    clearFilters: (state, action) => {
      state.clearAttributeFilters = action.payload
    },

    resetSetFilters: (state, action) => {
      state.filtersValue.page_no = 1
      state.filtersValue.sort = ''
      state.filtersValue.min_price = undefined
      state.filtersValue.max_price = undefined
      state.filtersValue.brands = undefined
      state.filtersValue.attributes = undefined
      state.filtersValue.rating = undefined
      state.filtersValue.no_product = true
      state.filtersValue.scrollProduct = false
      state.filtersValue.selectedAttributes = []
      state.filtersValue.loadData = false;
      state.filtersValue.code = ''
      state.filtersValue.description = ''
    }

  },
})

// Action creators are generated for each case reducer function
export const { setFilters, resetSetFilters, clearFilters, setLoad } = ProductListFilters.actions

export default ProductListFilters.reducer





