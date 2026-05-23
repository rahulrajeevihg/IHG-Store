import { configureStore } from '@reduxjs/toolkit';
import resettableReducer from '@redux/rootReducer'

const store = configureStore({
  reducer: resettableReducer,
  // ... other store configurations
});

// Expose store globally for debugging (remove in production)
if (typeof window !== 'undefined') {
  window.__reduxStore = store;
}

export default store;