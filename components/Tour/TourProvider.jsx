import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import {
  startTour,
  setStepIndex,
  completeTour,
  skipTour,
  stopTour,
  setTourFlag,
} from '@/redux/slice/tourSlice';
import { STANDARD_TOUR_STEPS } from './tourSteps';
import TooltipContent from './TooltipContent';

const Joyride = dynamic(() => import('react-joyride').then(mod => ({ default: mod.Joyride })), {
  ssr: false,
});

export default function TourProvider({ children, salesMode = false }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const observerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const prevIsRunningRef = useRef(false);

  const isRunning = useSelector((state) => state.tour?.isRunning || false);
  const stepIndex = useSelector((state) => state.tour?.stepIndex || 0);
  const tourId = useSelector((state) => state.tour?.tourId || 'ihg_v1');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force Joyride to fully remount each time the tour starts. This prevents
  // react-floater's internal portal from going stale across runs.
  useEffect(() => {
    const tourJustStarted = isRunning && !prevIsRunningRef.current;
    if (tourJustStarted) {
      setTourKey((k) => k + 1);
    }
    prevIsRunningRef.current = isRunning;
  }, [isRunning]);

  const getActiveSteps = useCallback(() => {
    let steps = [...STANDARD_TOUR_STEPS];

    if (!salesMode) {
      steps = steps.filter((s) => !s.data?.salesModeOnly);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      steps = steps.filter(
        (s) =>
          s.target !== '[data-tour="filter-panel"]' &&
          s.target !== '[data-tour="density-toggle"]'
      );
    }

    return steps;
  }, [salesMode]);

  const activeSteps = getActiveSteps();

  // Auto-start tour on first visit to /list — only for users who have NOT started LMS training
  useEffect(() => {
    if (router.pathname === '/list' && !isRunning && typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem(tourId);

      // Skip auto-start if the user has begun any LMS scenario — that's their
      // structured training; we don't want a competing general tour on top.
      let lmsStarted = false;
      try {
        const lmsSaved = localStorage.getItem('ihg_lms_v2');
        if (lmsSaved) {
          const parsed = JSON.parse(lmsSaved);
          lmsStarted =
            parsed.overallStatus !== 'pending' ||
            (Array.isArray(parsed.scenarios) &&
              parsed.scenarios.some(
                (s) => s.status === 'in_progress' || s.status === 'completed' || s.status === 'failed'
              ));
        }
      } catch (_) { /* ignore parse errors */ }

      if (!tourCompleted && !lmsStarted && router.isReady) {
        const timer = setTimeout(() => {
          dispatch(startTour());
          dispatch(setStepIndex(0));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [router.pathname, router.isReady, isRunning, tourId, dispatch]);

  // Stop tour when leaving /list
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (!url.startsWith('/list')) {
        dispatch(stopTour());
      }
    };

    router.events?.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router, dispatch]);

  // Wait for a DOM element to appear, then call onFound
  const waitForTourElement = useCallback((selector, onFound, timeoutMs = 8000) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const existing = document.querySelector(selector);
    if (existing) {
      onFound();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        observerRef.current = null;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        onFound();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    observerRef.current = observer;

    timeoutRef.current = setTimeout(() => {
      observer.disconnect();
      observerRef.current = null;
      // Auto-advance if element never appears
      onFound();
    }, timeoutMs);
  }, []);

  // Handle special step actions (open quick view, sales modal, force hover)
  useEffect(() => {
    const currentStep = activeSteps[stepIndex];
    if (!currentStep || !currentStep.data) return;

    const { triggerAction, forceHover } = currentStep.data;

    if (forceHover) {
      const card = document.querySelector('[data-tour="product-card"]');
      if (card) {
        card.setAttribute('data-tour-force-hover', 'true');
      }
      return () => {
        const c = document.querySelector('[data-tour="product-card"]');
        if (c) c.removeAttribute('data-tour-force-hover');
      };
    }

    if (triggerAction === 'openProductDetail') {
      dispatch(setTourFlag({ key: 'requestOpenProductDetail', value: true }));
    } else if (triggerAction === 'openSalesAddToCartModal') {
      dispatch(setTourFlag({ key: 'requestOpenSalesAddToCartModal', value: true }));
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [stepIndex, activeSteps, dispatch]);

  // Auto-advance when waitForSelector element appears
  useEffect(() => {
    const currentStep = activeSteps[stepIndex];
    if (!currentStep || !currentStep.data?.waitForSelector) return;

    const { waitForSelector } = currentStep.data;
    waitForTourElement(waitForSelector, () => {
      dispatch(setStepIndex(stepIndex + 1));
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [stepIndex, activeSteps, dispatch, waitForTourElement]);

  // react-joyride v3 uses onEvent(data, controls) instead of v2's callback(data).
  // controls is unused here — we drive the tour via Redux + the controlled
  // stepIndex prop. Constants (STATUS / EVENTS / ACTIONS) are unchanged.
  // eslint-disable-next-line no-unused-vars
  const handleJoyrideEvent = useCallback(
    (data, _controls) => {
      const { action, index, status, type } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED || type === EVENTS.TOUR_END) {
        dispatch(completeTour());
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            tourId,
            JSON.stringify({ completed: true, completedAt: new Date().toISOString(), version: 'v1' })
          );
        }
        return;
      }

      if (action === ACTIONS.SKIP) {
        dispatch(skipTour());
        if (typeof window !== 'undefined') {
          localStorage.setItem(tourId, 'skipped');
        }
        return;
      }

      // Skip to next step when target element is not found in DOM
      if (type === EVENTS.TARGET_NOT_FOUND) {
        dispatch(setStepIndex(index + 1));
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        if (action === ACTIONS.NEXT || action === ACTIONS.CLOSE) {
          dispatch(setStepIndex(index + 1));
        } else if (action === ACTIONS.PREV) {
          dispatch(setStepIndex(index - 1));
        }
      }
    },
    [dispatch, tourId]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      {mounted && (
        <Joyride
          key={tourKey}
          run={isRunning}
          steps={activeSteps}
          stepIndex={stepIndex}
          continuous={true}
          onEvent={handleJoyrideEvent}
          tooltipComponent={TooltipContent}
          scrollToFirstStep={true}
          options={{
            zIndex: 100000,
            primaryColor: '#3b82f6',
            overlayColor: 'rgba(0, 0, 0, 0.72)',
            arrowColor: '#0f172a',
            spotlightPadding: 8,
            scrollOffset: 80,
            showProgress: true,
            overlayClickAction: false, // v3 replacement for v2's disableOverlayClose
          }}
          locale={{
            back: 'Back',
            close: 'Close',
            last: 'Finish',
            next: 'Next',
            skip: 'Skip Tour',
          }}
        />
      )}
      {children}
    </>
  );
}
