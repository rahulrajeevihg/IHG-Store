import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { loadLMSState, markTourCompleted } from '@/redux/slice/lmsSlice';

const LMSDashboard  = dynamic(() => import('./LMSDashboard'),  { ssr: false });
const ScenarioBrief = dynamic(() => import('./ScenarioBrief'), { ssr: false });
const TaskPanel     = dynamic(() => import('./TaskPanel'),     { ssr: false });
const Quiz          = dynamic(() => import('./Quiz'),          { ssr: false });

const STORAGE_KEY = 'ihg_lms_v2'; // bumped from v1 — old format is incompatible
const TOUR_STORAGE_KEY = 'ihg_v1'; // set by TourProvider when the user finishes the tour

export default function LMSProvider({ children }) {
  const dispatch = useDispatch();
  const { scenarios, overallStatus, dashboardOpen, tourCompleted } = useSelector((state) => state.lms);
  const tourReduxCompleted = useSelector((state) => state.tour?.completed);

  // Load persisted LMS state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        dispatch(loadLMSState(JSON.parse(saved)));
      } catch (e) {
        console.error('[LMS] Failed to parse saved state:', e);
      }
    }
    // Tour completion is owned by TourProvider via its own localStorage key.
    // Mirror it into the LMS slice so the dashboard can gate on it.
    if (localStorage.getItem(TOUR_STORAGE_KEY)) {
      dispatch(markTourCompleted());
    }
  }, [dispatch]);

  // Watch Redux tour.completed and mirror once it flips true (the user just
  // finished the tour in this session).
  useEffect(() => {
    if (tourReduxCompleted && !tourCompleted) {
      dispatch(markTourCompleted());
    }
  }, [tourReduxCompleted, tourCompleted, dispatch]);

  // Persist on changes (debounced)
  useEffect(() => {
    if (typeof window === 'undefined' || !Array.isArray(scenarios)) return;
    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scenarios,
        overallStatus,
        tourCompleted,
      }));
    }, 400);
    return () => clearTimeout(t);
  }, [scenarios, overallStatus, tourCompleted]);

  return (
    <>
      {dashboardOpen && <LMSDashboard />}
      <ScenarioBrief />
      <TaskPanel />
      <Quiz />
      {children}
    </>
  );
}
