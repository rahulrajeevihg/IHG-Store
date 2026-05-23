import { createSlice } from '@reduxjs/toolkit';

// Default scenario meta — full definitions (briefs, tasks, checks) live in
// components/LMS/scenarios.js. The slice only stores progress/score state per
// scenario id, keeping definitions and runtime state decoupled.
const DEFAULT_SCENARIO_IDS = [
  'find-product',
  'narrow-with-filters',
  'precise-filter-and-find',
  'build-cart',
  'read-card',
  'ai-assistant',
  'full-workflow',
  'knowledge-quiz',
];

const makeInitialScenarios = () =>
  DEFAULT_SCENARIO_IDS.map((id, index) => ({
    id,
    status: index === 0 ? 'available' : 'locked', // 'locked' | 'available' | 'in_progress' | 'completed' | 'failed'
    taskProgress: {},   // { [taskId]: { completedAt } }
    startedAt: null,
    completedAt: null,
    score: null,        // 0–100, % of tasks completed
    attempts: 0,
  }));

const EVENT_LOG_CAP = 30;

const initialState = {
  scenarios: makeInitialScenarios(),
  activeScenarioId: null,
  briefOpen: false,           // brief modal shown before tasks start
  dashboardOpen: false,
  overallStatus: 'pending',   // 'pending' | 'in_progress' | 'completed'
  // Reps must finish the full product tour (35-step walkthrough of the app)
  // before any assessment scenario unlocks. Persisted so it survives reloads.
  tourCompleted: false,
  // Recent app interactions tracked for scenario task evaluation. Components
  // dispatch `recordLmsEvent({ type, ... })` and check(state) functions read
  // these from state.lms.events. Capped to avoid unbounded growth.
  events: [],
  // Free-text answers the user submitted for tasks with `inputType` (e.g. an
  // item code they pasted). The task's check(state) reads this and verifies
  // against live state. Cleared on scenario lifecycle events.
  inputAnswers: {},
};

const lmsSlice = createSlice({
  name: 'lms',
  initialState,

  reducers: {
    openBrief: (state, action) => {
      const scenarioId = action.payload;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (!scenario || scenario.status === 'locked') return;
      state.activeScenarioId = scenarioId;
      state.briefOpen = true;
    },

    closeBrief: (state) => {
      state.briefOpen = false;
    },

    startScenario: (state, action) => {
      const scenarioId = action.payload;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (!scenario || scenario.status === 'locked') return;

      state.activeScenarioId = scenarioId;
      state.briefOpen = false;
      scenario.status = 'in_progress';
      scenario.startedAt = Date.now();
      scenario.attempts += 1;
      // Reset per-attempt progress so retakes don't carry stale ticks
      scenario.taskProgress = {};
      scenario.completedAt = null;
      scenario.score = null;
      // Wipe prior interaction events so actions taken before the scenario
      // started can't pre-tick tasks — the assessment must measure THIS attempt.
      state.events = [];
      state.inputAnswers = {};

      if (state.overallStatus === 'pending') state.overallStatus = 'in_progress';
    },

    setTaskInput: (state, action) => {
      // payload: { taskId, value }
      if (!state.activeScenarioId) return;
      const { taskId, value } = action.payload || {};
      if (!taskId) return;
      state.inputAnswers[taskId] = typeof value === 'string' ? value : '';
    },

    recordLmsEvent: (state, action) => {
      // Only log when a scenario is actively running — keeps the log small and
      // avoids ticking tasks before the user has begun.
      if (!state.activeScenarioId) return;
      const event = { ...action.payload, at: Date.now() };
      state.events.push(event);
      if (state.events.length > EVENT_LOG_CAP) {
        state.events.splice(0, state.events.length - EVENT_LOG_CAP);
      }
    },

    completeTask: (state, action) => {
      const { scenarioId, taskId } = action.payload;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (!scenario || scenario.status !== 'in_progress') return;
      if (scenario.taskProgress[taskId]) return; // already done — keep first timestamp
      scenario.taskProgress[taskId] = { completedAt: Date.now() };
    },

    finishScenario: (state, action) => {
      // payload: { scenarioId, totalTasks, passThreshold }
      const { scenarioId, totalTasks, passThreshold } = action.payload;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      const completedTaskCount = Object.keys(scenario.taskProgress).length;
      const score = totalTasks > 0
        ? Math.round((completedTaskCount / totalTasks) * 100)
        : 0;

      scenario.score = score;
      scenario.completedAt = Date.now();
      scenario.status = score >= passThreshold ? 'completed' : 'failed';

      // Unlock next scenario if this one passed
      if (scenario.status === 'completed') {
        const index = state.scenarios.findIndex((s) => s.id === scenarioId);
        const next = state.scenarios[index + 1];
        if (next && next.status === 'locked') next.status = 'available';
      }

      state.activeScenarioId = null;
      state.events = [];
      state.inputAnswers = {};

      // Mark overall complete when every scenario is completed (passed)
      const allPassed = state.scenarios.every((s) => s.status === 'completed');
      if (allPassed) state.overallStatus = 'completed';
    },

    submitQuizScenario: (state, action) => {
      // For quiz-only scenarios. payload: { scenarioId, score, passThreshold }
      const { scenarioId, score, passThreshold } = action.payload;
      const scenario = state.scenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      scenario.score = score;
      scenario.completedAt = Date.now();
      scenario.status = score >= passThreshold ? 'completed' : 'failed';

      if (scenario.status === 'completed') {
        const index = state.scenarios.findIndex((s) => s.id === scenarioId);
        const next = state.scenarios[index + 1];
        if (next && next.status === 'locked') next.status = 'available';
      }

      state.activeScenarioId = null;
      state.events = [];
      state.inputAnswers = {};
      const allPassed = state.scenarios.every((s) => s.status === 'completed');
      if (allPassed) state.overallStatus = 'completed';
    },

    abortScenario: (state) => {
      // User closed the panel mid-scenario without completing
      const scenario = state.scenarios.find((s) => s.id === state.activeScenarioId);
      if (scenario && scenario.status === 'in_progress') {
        // Revert to 'available' so they can retry from the dashboard
        scenario.status = 'available';
        scenario.taskProgress = {};
        scenario.startedAt = null;
      }
      state.activeScenarioId = null;
      state.briefOpen = false;
      state.events = [];
      state.inputAnswers = {};
    },

    toggleDashboard: (state) => {
      state.dashboardOpen = !state.dashboardOpen;
    },

    markTourCompleted: (state) => {
      state.tourCompleted = true;
    },

    loadLMSState: (state, action) => {
      const saved = action.payload;
      if (!saved || !Array.isArray(saved.scenarios)) return;

      // Merge saved progress onto current default scenario list so a new
      // scenario added later doesn't get dropped by old saved state.
      const savedById = Object.fromEntries(saved.scenarios.map((s) => [s.id, s]));
      state.scenarios = makeInitialScenarios().map((def, index) => {
        const persisted = savedById[def.id];
        if (!persisted) return def;
        // First scenario must always start at least 'available'
        const status = persisted.status || (index === 0 ? 'available' : 'locked');
        return { ...def, ...persisted, status };
      });
      state.overallStatus = saved.overallStatus || 'pending';
      state.tourCompleted = !!saved.tourCompleted;
    },

    resetLMS: () => initialState,
  },
});

export const {
  openBrief,
  closeBrief,
  startScenario,
  completeTask,
  finishScenario,
  submitQuizScenario,
  abortScenario,
  toggleDashboard,
  markTourCompleted,
  loadLMSState,
  resetLMS,
  recordLmsEvent,
  setTaskInput,
} = lmsSlice.actions;

export default lmsSlice.reducer;
