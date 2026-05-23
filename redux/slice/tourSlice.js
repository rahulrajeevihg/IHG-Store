import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isRunning: false,
  stepIndex: 0,
  completed: false,
  skipped: false,
  tourId: 'ihg_v1',
  isReady: false,
  waitingForElement: null,
  requestOpenQuickView: false,
  requestOpenProductDetail: false,
  requestOpenGuidedAssistant: false,
  requestCloseAiSearchDialog: false,
};

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    startTour: (state) => {
      state.isRunning = true;
      state.stepIndex = 0;
      state.completed = false;
      state.skipped = false;
    },
    stopTour: (state) => {
      state.isRunning = false;
    },
    setStepIndex: (state, action) => {
      state.stepIndex = action.payload;
    },
    completeTour: (state) => {
      state.completed = true;
      state.isRunning = false;
    },
    skipTour: (state) => {
      state.skipped = true;
      state.isRunning = false;
    },
    setTourReady: (state, action) => {
      state.isReady = action.payload;
    },
    setWaitingForElement: (state, action) => {
      state.waitingForElement = action.payload;
    },
    setTourFlag: (state, action) => {
      const { key, value } = action.payload;
      if (key in state) {
        state[key] = value;
      }
    },
    resetTour: (state) => {
      state.isRunning = false;
      state.stepIndex = 0;
      state.completed = false;
      state.skipped = false;
      state.waitingForElement = null;
    },
  },
});

export const {
  startTour,
  stopTour,
  setStepIndex,
  completeTour,
  skipTour,
  setTourReady,
  setWaitingForElement,
  setTourFlag,
  resetTour,
} = tourSlice.actions;

export const restartTour = () => (dispatch) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ihg_v1');
  }
  dispatch(startTour());
};

export default tourSlice.reducer;
