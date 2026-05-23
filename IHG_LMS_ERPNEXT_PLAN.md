# IHG LMS — ERPNext Backend Implementation Plan
**App:** IHG Search (Custom ERPNext App)
**Purpose:** Track training progress, time-on-app, and generate management insights for all IHG catalog users.

---

## 1. Overview

The frontend LMS currently stores all progress in `localStorage` only — meaning it is device-specific, clears on browser reset, and gives management zero visibility. This plan moves all LMS state to ERPNext so that:

- Managers know **who completed**, **who started**, and **who has not started** training
- Admins can see **time spent** per session and per module
- HR/managers get an **automated certification report**
- Users can resume training on any device
- Automatic reminders can be sent to users who have not completed training

---

## 2. ERPNext DocTypes Required

### 2.1 `IHG LMS Enrollment`
One record per user. Tracks their overall training status.

| Field | Type | Description |
|-------|------|-------------|
| `name` | Link (auto) | Auto-generated ID |
| `user` | Link → User | ERPNext user (employee) |
| `employee` | Link → Employee | Linked employee record |
| `enrollment_date` | Datetime | When they first opened the LMS |
| `status` | Select | `Not Started` / `In Progress` / `Completed` |
| `overall_score` | Float | Final assessment score (%) |
| `certified_on` | Datetime | When the final assessment was passed |
| `certificate_id` | Data | Unique certificate reference (e.g. IHG-2026-00142) |
| `last_seen` | Datetime | Last time user interacted with the LMS |
| `total_time_spent_minutes` | Float | Cumulative time across all sessions |
| `completion_reminder_sent` | Check | Whether a reminder has been sent |
| `reminder_sent_on` | Datetime | When the reminder was sent |

---

### 2.2 `IHG LMS Module Progress`
One record per user per module. Tracks each module's state.

| Field | Type | Description |
|-------|------|-------------|
| `name` | Link (auto) | Auto ID |
| `enrollment` | Link → IHG LMS Enrollment | Parent enrollment |
| `user` | Link → User | Denormalised for fast queries |
| `module_id` | Data | Module key: `nav`, `search`, `layout`, `cards`, `filters`, `detail`, `final` |
| `module_title` | Data | Human-readable title |
| `status` | Select | `Locked` / `Available` / `In Progress` / `Completed` |
| `started_on` | Datetime | When user first started this module |
| `completed_on` | Datetime | When user passed quiz / completed exercise |
| `quiz_score` | Float | Score % (for quiz modules) |
| `attempts` | Int | Number of quiz attempts |
| `time_spent_minutes` | Float | Time spent on this module |
| `exercise_completed` | Check | Whether the exercise was done |

---

### 2.3 `IHG LMS Session Log`
Append-only log of every session. Used for time-on-app analytics.

| Field | Type | Description |
|-------|------|-------------|
| `name` | Link (auto) | Auto ID |
| `user` | Link → User | Who |
| `enrollment` | Link → IHG LMS Enrollment | Their enrollment |
| `session_start` | Datetime | When session began |
| `session_end` | Datetime | When session ended (or heartbeat last seen) |
| `duration_minutes` | Float | Computed: session_end - session_start |
| `page_path` | Data | URL path during session |
| `modules_touched` | Small Text | Comma-separated module IDs visited this session |
| `device_type` | Select | `Desktop` / `Mobile` / `Tablet` |
| `browser` | Data | User agent parsed browser name |

---

### 2.4 `IHG LMS Quiz Attempt`
Stores each quiz attempt with full answer detail for review.

| Field | Type | Description |
|-------|------|-------------|
| `name` | Link (auto) | Auto ID |
| `user` | Link → User | Who |
| `module_id` | Data | Which module |
| `attempt_number` | Int | 1st, 2nd, 3rd attempt |
| `score` | Float | Score % |
| `passed` | Check | Whether 70%+ |
| `attempted_on` | Datetime | Timestamp |
| `answers_json` | Long Text | JSON: `[{question_id, selected_index, correct_index, correct: bool}]` |
| `time_taken_seconds` | Int | How long they spent on this quiz |

---

## 3. API Endpoints (Whitelisted Python Methods)

All endpoints go in the `ihg_search` custom app under `api/lms.py`.

### 3.1 `POST /api/method/ihg_search.api.lms.sync_progress`
Called by the frontend when LMS state changes. Syncs module progress + session time.

**Request payload:**
```json
{
  "modules": [
    { "id": "nav", "status": "completed", "score": 85, "attempts": 1, "time_spent_minutes": 2.5 },
    { "id": "search", "status": "completed", "score": null, "attempts": 0, "time_spent_minutes": 3.1 }
  ],
  "overall_status": "in_progress",
  "overall_score": null,
  "session_duration_minutes": 12.4,
  "page_path": "/list"
}
```

**Response:**
```json
{ "status": "ok", "certificate_id": null }
```

**Backend logic:**
1. Get or create `IHG LMS Enrollment` for the current user
2. Upsert each `IHG LMS Module Progress` record
3. If `overall_status === "completed"` and no `certified_on`, generate a `certificate_id` and set `certified_on`
4. Append an `IHG LMS Session Log` entry
5. Return certificate ID if newly issued

---

### 3.2 `GET /api/method/ihg_search.api.lms.get_progress`
Called on page load to restore progress from server (replaces localStorage fallback).

**Response:**
```json
{
  "modules": [ ... ],
  "overall_status": "in_progress",
  "overall_score": null,
  "certificate_id": null
}
```

---

### 3.3 `POST /api/method/ihg_search.api.lms.log_session_heartbeat`
Called every 60 seconds from the frontend while the user is active. Keeps `last_seen` and session duration accurate.

**Request payload:**
```json
{ "session_id": "abc123", "active_module": "filters" }
```

---

### 3.4 `POST /api/method/ihg_search.api.lms.submit_quiz_attempt`
Logs a full quiz attempt with answers.

**Request payload:**
```json
{
  "module_id": "nav",
  "score": 66.7,
  "passed": false,
  "answers": [
    { "question_id": "nav_q1", "selected_index": 0, "correct_index": 1, "correct": false }
  ],
  "time_taken_seconds": 94
}
```

---

### 3.5 `GET /api/method/ihg_search.api.lms.get_team_report`
**Roles required:** `LMS Manager` or `System Manager`

Returns summary data for the management dashboard.

**Response:**
```json
{
  "summary": {
    "total_users": 42,
    "not_started": 11,
    "in_progress": 18,
    "completed": 13,
    "avg_completion_time_minutes": 24.5,
    "avg_final_score": 81.3
  },
  "users": [
    {
      "user": "rahul@ihgind.com",
      "full_name": "Rahul",
      "status": "Completed",
      "overall_score": 87.5,
      "certified_on": "2026-05-15 10:22:00",
      "total_time_minutes": 28,
      "last_seen": "2026-05-15 10:45:00"
    }
  ]
}
```

---

### 3.6 `GET /api/method/ihg_search.api.lms.get_module_analytics`
**Roles required:** `LMS Manager`

Returns per-module pass rates, average scores, and average attempts.

**Response:**
```json
{
  "modules": [
    {
      "module_id": "nav",
      "module_title": "App Navigation",
      "total_started": 38,
      "total_completed": 35,
      "avg_score": 84.2,
      "avg_attempts": 1.3,
      "avg_time_minutes": 2.8
    }
  ]
}
```

---

## 4. Frontend Integration Changes

### 4.1 Replace localStorage with API calls in `LMSProvider.jsx`

```js
// On mount: load from API first, fall back to localStorage
const loadProgress = async () => {
  try {
    const res = await fetch('/api/method/ihg_search.api.lms.get_progress');
    const data = await res.json();
    dispatch(loadLMSState(data.message));
  } catch {
    // Fallback to localStorage for offline/slow connections
    const saved = localStorage.getItem('ihg_lms_v1');
    if (saved) dispatch(loadLMSState(JSON.parse(saved)));
  }
};
```

### 4.2 Sync on every state change (debounced)

```js
// Debounced sync — fires 2 seconds after last change
useEffect(() => {
  const t = setTimeout(() => {
    fetch('/api/method/ihg_search.api.lms.sync_progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': getCsrfToken() },
      body: JSON.stringify({ modules, overall_status: overallStatus, overall_score: overallScore }),
    });
    // Also keep localStorage as offline cache
    localStorage.setItem('ihg_lms_v1', JSON.stringify({ modules, overallStatus, overallScore }));
  }, 2000);
  return () => clearTimeout(t);
}, [modules, overallStatus, overallScore]);
```

### 4.3 Session heartbeat

```js
// Ping every 60 seconds while user is on the page
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/method/ihg_search.api.lms.log_session_heartbeat', {
      method: 'POST',
      body: JSON.stringify({ active_module: activeModuleId }),
    });
  }, 60_000);
  return () => clearInterval(interval);
}, [activeModuleId]);
```

---

## 5. ERPNext Management Dashboard

Build a Report page inside ERPNext (`ihg_search/report/ihg_lms_report`) with the following views:

### View 1: Team Overview
| Column | Data |
|--------|------|
| Employee Name | Full name |
| Status | Not Started / In Progress / Completed |
| Modules Done | e.g. 4 / 7 |
| Last Active | Relative time (e.g. "3 days ago") |
| Final Score | % or — |
| Certificate | Link or — |
| Time Spent | Minutes |

**Filters:** Department, Manager, Status, Date Range

### View 2: Module Difficulty Analysis
Shows which modules have the highest retake rates and lowest average scores — useful to identify where training content needs to be improved.

### View 3: Time-on-App Heatmap
Shows day/time heat map of when users are most active on the platform. Helps schedule training sessions.

### View 4: User Detail Drill-Down
Click any user to see their full journey: every module, every quiz attempt (with answers), session times.

---

## 6. Automated Notifications (ERPNext Scheduled Jobs)

### 6.1 Training Reminder
- **Trigger:** User enrolled > 3 days ago, status still `Not Started`
- **Action:** Send email via ERPNext Email Alert
- **Template:** "Hi {name}, your IHG platform training is waiting. It takes less than 25 minutes. [Start Training →]"

### 6.2 Completion Nudge
- **Trigger:** Status `In Progress`, last_seen > 5 days ago
- **Action:** Email reminder with last completed module shown
- **Template:** "Hi {name}, you are {X} of 7 modules complete. Pick up where you left off. [Continue →]"

### 6.3 Manager Weekly Summary
- **Trigger:** Every Monday 9am
- **Action:** Email to all users with `LMS Manager` role
- **Content:** Count of completions this week, % of team certified, list of users not started > 7 days

### 6.4 Certificate Issued Notification
- **Trigger:** `overall_status` transitions to `Completed`
- **Action:** Email to user with their certificate ID and score
- **CC:** Their direct manager (if HR data linked)

---

## 7. Permissions & Roles

| Role | Access |
|------|--------|
| All users | Can sync their own progress, read own records |
| `LMS Manager` | Read all enrollments, module progress, session logs, reports |
| `System Manager` | Full access including reset, delete, export |

---

## 8. Implementation Priority

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 1 (MVP)** | DocTypes, `sync_progress`, `get_progress`, `submit_quiz_attempt`, frontend integration | ~3 days |
| **Phase 2** | `get_team_report`, `get_module_analytics`, ERPNext List view for managers | ~2 days |
| **Phase 3** | Session heartbeat, time-on-app analytics, full dashboard report | ~2 days |
| **Phase 4** | Automated email notifications, certificate PDF generation, manager drill-down | ~3 days |

**Total estimated effort: ~10 developer days**

---

## 9. Certificate Design (Optional Phase 4)

When a user passes the Final Assessment, generate a PDF certificate containing:
- User full name
- Certificate ID (e.g. `IHG-CERT-2026-00142`)
- Final Assessment score
- Date of completion
- IHG company logo
- QR code linking to ERPNext verification endpoint

Use `frappe.utils.pdf` or WeasyPrint for PDF generation.

---

## 10. Data Retention Policy

- Session logs: retain 12 months rolling
- Quiz attempts: retain indefinitely (for audit trail)
- Enrollment records: retain indefinitely
- Personal data handling: follows existing ERPNext GDPR/data privacy settings
