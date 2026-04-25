import { configureStore } from '@reduxjs/toolkit';
import resettableReducer from '@redux/rootReducer'

const store = configureStore({
  reducer: resettableReducer,
  // ... other store configurations
});

export default store;