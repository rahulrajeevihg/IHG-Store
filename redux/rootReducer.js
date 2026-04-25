import { combineReducers } from '@reduxjs/toolkit';
import websiteSettings from './slice/websiteSettings'
import cartSettings from './slice/cartSettings'
import alertAction from './slice/alertAction'
import logInInfo from './slice/logInInfo'
import customerInfo from './slice/customerInfo'
import checkoutInfo from './slice/checkoutInfo'
import ProductListFilters from './slice/ProductListFilters'
import { resetStore } from '/redux/rootAction'
import FiltersList from './slice/filtersList';
import HomeFilter from './slice/homeFilter';
import ProductDetails from './slice/productDetail';

const rootReducer = combineReducers({
    webSettings: websiteSettings,
    cartSettings: cartSettings,
    alertAction:alertAction,
    logInInfo:logInInfo,
    customerInfo:customerInfo,
    checkoutInfo:checkoutInfo,
    ProductListFilters:ProductListFilters,
    FiltersList: FiltersList,
    HomeFilter: HomeFilter,
    ProductDetails: ProductDetails
});

const resettableReducer = (state, action) => {
  // console.log('action',action)
  if (action.type === resetStore.toString()) {
    state = undefined;
  }
  return rootReducer(state, action);
};

export default resettableReducer;