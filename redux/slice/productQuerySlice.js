import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Global chat drawer
  drawerOpen: false,
  activeQueryId: null,
  // Seed product context when starting a brand new query from a product surface
  pendingProduct: null,
  raiseModalOpen: false,
  // Badge state (kept in sync by QueryLauncher polling)
  unreadTotal: 0,
  openCount: null,
  isAdmin: false,
  // Bumped whenever a thread changes so lists can refetch
  refreshToken: 0,
};

const productQuerySlice = createSlice({
  name: 'productQuery',
  initialState,
  reducers: {
    openQueryChat: (state, action) => {
      state.activeQueryId = action.payload || null;
      state.drawerOpen = Boolean(action.payload);
    },
    closeQueryChat: (state) => {
      state.drawerOpen = false;
      state.activeQueryId = null;
    },
    openRaiseQuery: (state, action) => {
      state.pendingProduct = action.payload || null;
      state.raiseModalOpen = true;
    },
    closeRaiseQuery: (state) => {
      state.raiseModalOpen = false;
      state.pendingProduct = null;
    },
    setQueryBadge: (state, action) => {
      const { unreadTotal, openCount, isAdmin } = action.payload || {};
      if (unreadTotal !== undefined) state.unreadTotal = unreadTotal;
      if (openCount !== undefined) state.openCount = openCount;
      if (isAdmin !== undefined) state.isAdmin = isAdmin;
    },
    bumpQueryRefresh: (state) => {
      state.refreshToken += 1;
    },
  },
});

export const {
  openQueryChat,
  closeQueryChat,
  openRaiseQuery,
  closeRaiseQuery,
  setQueryBadge,
  bumpQueryRefresh,
} = productQuerySlice.actions;

export default productQuerySlice.reducer;
