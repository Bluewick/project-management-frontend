# Traceboard — Precision Issue Tracking Frontend

A high-density, real-time project management and issue tracking web application built with **React 19**, **Vite 8**, **Tailwind CSS v4**, **@dnd-kit**, and **Socket.IO**. Engineered around the **Lumina Clarity** design system for crisp visual hierarchy, effortless data density, and responsive multi-user collaboration.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?logo=vercel&logoColor=white)](https://project-management-frontend-pearl.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Oxlint](https://img.shields.io/badge/Linter-Oxlint-F59E0B)](https://oxc.rs/)

**Live Application:** https://project-management-frontend-pearl.vercel.app/

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Application Routes](#application-routes)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Core Engineering Highlights](#core-engineering-highlights)
  - [Single-Flight JWT Refresh Queue](#single-flight-jwt-refresh-queue)
  - [Real-Time Synchronization (Socket.IO)](#real-time-synchronization-socketio)
  - [S3 Presigned Attachments with Fallback](#s3-presigned-attachments-with-fallback)
  - [Kanban Drag-and-Drop Positioning](#kanban-drag-and-drop-positioning)
- [Backend API Integration](#backend-api-integration)
- [Design System — Lumina Clarity](#design-system--lumina-clarity)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Deployment](#deployment)

---

## Key Features

### Authentication & Onboarding
- **Email & Password Auth:** Sign in and sign up flows with inline field validation, real-time full-name sanitization, live password strength meter, password visibility toggles, and Caps Lock warnings.
- **Session Persistence & Bootstrap:** Automatic session hydration via `GET /api/users/me` on mount with a dedicated bootstrap loader and graceful expiry handling.
- **Seamless Invitation Flow:** Shareable `/invites/:token` links and a "Join with Token" modal. Unauthenticated users clicking an invite link have their token preserved across Login/Register and are automatically joined upon completion.
- **Account Settings:** Update full name and avatar URL with live preview, and change passwords (automatically revoking other sessions on the backend).

### Workspace & Projects Hub
- **KPI Overview:** Live stat cards tracking active/archived workspaces, projects with Lead/Admin access, cumulative tracked issues, and real-time backend API health (`GET /api/health`).
- **Project Lifecycle:** Create new projects with auto-uppercased `key_prefix` previews (e.g., `CORE-1`), filter between Active and Archived workspaces, paginate results, archive/unarchive projects, or permanently delete via typed confirmation.
- **Global Command Palette (`⌘K` / `Ctrl+K`):** Keyboard-navigable quick switcher to jump between projects, switch workspace views, and run debounced issue search inside the active project.

### Issue Tracking & Views
- **5-Column Kanban Board:** `Backlog`, `To Do`, `In Progress`, `In Review`, and `Done` columns displaying issue counts, story-point totals, labels, priority signals, due dates (with overdue highlighting), and assignee avatars.
- **High-Density Issues Table:** Server-side paginated and sortable table with quick filters and responsive formatting.
- **Multi-Facet Server-Side Filtering:** Filter by `status`, `priority` (`low`, `medium`, `high`, `critical`), `type` (`bug`, `feature`, `task`), `severity` (`minor`, `major`, `critical`, `blocker`), `assignee_id` (including `me` and `unassigned`), `reporter_id`, `label_ids` (`any` / `all` match modes), due date windows (`due_before`, `due_after`, `overdue`), and debounced full-text search (`q`).
- **Custom Project Labels:** Create, edit, color-code (6-digit hex presets + custom hex), attach, and detach categorical labels per project.

### Issue Detail & Collaboration
- **Full Issue Workspace:** Accessible via human-readable issue keys (`/projects/:projectId/issues/CORE-1`) with inline-editable title, description, conditional bug reproduction steps, and a dedicated properties panel.
- **Threaded Comments & `@mentions`:** Paginated top-level comments with expandable reply threads, edit tracking (`is_edited` badge), and an interactive `@` mention autocomplete popover that serializes `@[Full Name](user_id)` payloads while rendering styled mention chips.
- **File Attachments:** Drag-and-drop or file-picker uploads supporting images, videos, PDFs, JSON, and plain text with upload progress bars, in-app previews, and deletion controls.
- **Audit Activity Feed:** Chronological (`asc`/`desc`) paginated audit log showing status changes, reassignments, comment activity, and metadata diffs with actor avatars and relative timestamps.
- **Team & Member Administration:** View project rosters, generate role-scoped invitation links/tokens, cancel pending invitations, update member roles, remove members, or leave a project.

---

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **UI Framework** | React `19.3` + React Compiler | Component architecture with automatic memoization via `babel-plugin-react-compiler` |
| **Build Tool** | Vite `8.3` + `@rolldown/plugin-babel` | Fast HMR dev server and optimized production bundling |
| **Styling** | Tailwind CSS `v4.3` (`@tailwindcss/vite`) | Utility-first styling backed by Lumina Clarity CSS variables (`tokens.css`) |
| **Routing** | React Router `v7.18` | Nested workspace layouts, route guards, and `React.lazy` route-level code splitting |
| **HTTP Client** | Axios `1.21` | Centralized API client, response unwrapping, and single-flight JWT refresh queue |
| **Real-Time** | Socket.IO Client `4.8` | Live project and issue room subscriptions with token-rotation re-authentication |
| **Drag & Drop** | `@dnd-kit/core`, `sortable`, `utilities` | Accessible keyboard & pointer Kanban card movement across and within columns |
| **Icons** | `lucide-react` `1.75` | Crisp, consistent SVG iconography |
| **Linting** | `oxlint` `1.90` | Fast Rust-based linting with `react` and `oxc` plugins |

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20.x` (recommended LTS)
- **npm** `>= 10.x`
- A running instance of the **Traceboard Backend API** (default local URL: `http://localhost:5213`, with `CLIENT_ORIGIN` allowing `http://localhost:5173`).

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Bluewick/project-management-frontend.git
cd project-management-frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file in the project root (see Environment Variables below)

# 4. Start the development server
npm run dev
```

The app will start on `http://localhost:5173` by default.

### Environment Variables

Create a `.env` file in the repository root:

```env
# Base URL of the Traceboard backend API (HTTP + Socket.IO)
# Defaults to http://localhost:5213 if omitted
VITE_API_URL=http://localhost:5213
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | No | `http://localhost:5213` | Base origin for REST API requests (`/api/*`) and Socket.IO connections |

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR on `http://localhost:5173` |
| `npm run build` | Builds the optimized production bundle into `dist/` |
| `npm run preview` | Serves the production `dist/` build locally for verification |
| `npm run lint` | Runs `oxlint` across the codebase using `.oxlintrc.json` |

---

## Project Structure

```text
project-management-frontend/
├── index.html                        # Entry HTML, Inter font loading, document metadata
├── vite.config.js                    # Vite 8 + Tailwind CSS v4 + React Compiler config
├── vercel.json                       # SPA fallback rewrites for Vercel deployment
├── .oxlintrc.json                    # Oxlint rules (react/rules-of-hooks, fast-refresh)
├── public/                           # Static icons and favicons
└── src/
    ├── main.jsx                      # React root mount
    ├── App.jsx                       # ErrorBoundary -> BrowserRouter -> Toast -> Auth -> AppRoutes
    ├── index.css                     # Tailwind CSS v4 entry & base styles
    ├── styles/
    │   └── tokens.css                # Lumina Clarity @theme tokens, elevation, and animations
    ├── routes/
    │   ├── AppRoutes.jsx             # Lazy-loaded route registry
    │   ├── ProtectedRoute.jsx        # Authenticated route guard (preserves return location)
    │   └── GuestRoute.jsx            # Redirects authenticated users away from /login & /register
    ├── context/
    │   ├── contexts.js               # Context instances
    │   ├── AuthContext.jsx           # User state, silent session bootstrap, token/socket lifecycle
    │   ├── ProjectContext.jsx        # Active project metadata, members, labels, RBAC flags
    │   └── ToastContext.jsx          # Global auto-dismissing toast notification queue
    ├── hooks/
    │   ├── useAuth.js                # AuthContext consumer
    │   ├── useProject.js             # ProjectContext consumer
    │   ├── useToast.js               # ToastContext consumer
    │   ├── useDebounce.js            # Debounced value hook for search & filters
    │   ├── useKeyboardShortcut.js    # Global modifier key listener (Cmd/Ctrl + K)
    │   └── useSocket.js              # useProjectSocket & useIssueSocket room subscriptions
    ├── services/
    │   ├── api.js                    # Axios client, tokenStorage, ApiClientError, single-flight refresh
    │   ├── socket.js                 # Socket.IO singleton, auth injection, reconnect helpers
    │   ├── auth.service.js           # /api/auth/*
    │   ├── user.service.js           # /api/users/me*
    │   ├── health.service.js         # /api/health
    │   ├── project.service.js        # /api/projects/*
    │   ├── member.service.js         # /api/projects/:id/members & invites
    │   ├── label.service.js          # /api/projects/:id/labels
    │   ├── issue.service.js          # /api/projects/:id/issues & issue-label links
    │   ├── comment.service.js        # /api/projects/:id/issues/:issueId/comments
    │   ├── activity.service.js       # /api/projects/:id/issues/:issueId/activity
    │   └── attachment.service.js     # Presigned S3 upload, confirm, direct fallback, delete
    ├── pages/
    │   ├── auth/                     # LoginPage, RegisterPage, AcceptInvitePage
    │   ├── dashboard/                # DashboardPage (Projects Hub)
    │   ├── project/                  # BoardPage, IssuesListPage, IssueDetailPage, TeamPage, ProjectSettingsPage
    │   ├── settings/                 # ProfileSettingsPage
    │   └── NotFoundPage.jsx          # 404 fallback view
    ├── components/
    │   ├── common/                   # Avatar, Badge, Button, Card, ConfirmDialog, DataTable, Input,
    │   │                             # LabelChip, Modal, PasswordStrengthMeter, Popover,
    │   │                             # PriorityIndicator, SegmentedControl, Select, StatCard,
    │   │                             # StatusPill, Textarea, ToggleSwitch
    │   ├── feedback/                 # EmptyState, ErrorBanner, ErrorBoundary,
    │   │                             # SessionBootstrapLoader, Skeleton, Spinner, ToastContainer
    │   ├── layout/                   # AppShell, AuthLayout, CommandPalette, Sidebar, TopBar, UserProfileCard
    │   ├── projects/                 # CreateProjectModal, InviteMemberModal, LabelManagerModal, ProjectWorkspaceRoute
    │   ├── issues/                   # ActivityFeed, CreateIssueModal, IssueCard, IssueFiltersBar, IssuePropertiesPanel
    │   ├── comments/                 # CommentSection, MentionInput
    │   └── attachments/              # AttachmentPanel
    └── utils/
        ├── constants.js              # Enums, RBAC matrix, status/priority/type metadata, MIME limits
        ├── formatters.js             # Relative dates, file sizes, initials, @mention parsing
        ├── issueQuery.js             # Issue filter serialization & query helpers
        └── validators.js             # Client-side validation mirroring backend constraints
```

---

## Application Routes

All workspace routes are code-split using `React.lazy` and wrapped in a `<Suspense>` skeleton fallback (`src/routes/AppRoutes.jsx`).

| Path | Guard | Page Component | Description |
| :--- | :--- | :--- | :--- |
| `/login` | `GuestRoute` | `LoginPage` | User sign-in with email & password |
| `/register` | `GuestRoute` | `RegisterPage` | Account creation with strength meter & auto-login |
| `/invites/:token` | Public / Auth-aware | `AcceptInvitePage` | Accept project invitation token (resumes after login/signup) |
| `/` | `ProtectedRoute` | Redirect → `/projects` | Default authenticated landing route |
| `/projects` | `ProtectedRoute` | `DashboardPage` | Projects Hub, KPI cards, archive toggle, and invite join |
| `/projects/:projectId` | `ProtectedRoute` | Redirect → `board` | Project workspace root (`ProjectWorkspaceRoute` resets state per `projectId`) |
| `/projects/:projectId/board` | `ProtectedRoute` | `BoardPage` | 5-column drag-and-drop Kanban board |
| `/projects/:projectId/issues` | `ProtectedRoute` | `IssuesListPage` | Filterable, sortable, paginated issue table |
| `/projects/:projectId/issues/:issueKey` | `ProtectedRoute` | `IssueDetailPage` | Issue editor, properties panel, attachments, comments, and activity |
| `/projects/:projectId/team` | `ProtectedRoute` | `TeamPage` | Member roster, role management, and pending invitations |
| `/projects/:projectId/settings` | `ProtectedRoute` | `ProjectSettingsPage` | Project metadata, key prefix, archive toggle, and danger zone delete |
| `/settings/profile` | `ProtectedRoute` | `ProfileSettingsPage` | Profile details and password change |
| `*` | Public | `NotFoundPage` | Clean 404 fallback page |

---

## Role-Based Access Control (RBAC)

`ProjectContext` derives permissions from `project.my_role` using `ROLE_PERMISSIONS` (`src/utils/constants.js`). When a project is archived (`is_archived: true`), write actions on issues, labels, and comments are automatically locked in the UI.

| Capability | `admin` | `manager` | `developer` | `viewer` |
| :--- | :---: | :---: | :---: | :---: |
| View board, issues, comments, attachments & activity | Yes | Yes | Yes | Yes |
| Post comments & edit/delete own comments | Yes | Yes | Yes | Yes |
| Create, edit, move & delete issues | Yes | Yes | Yes | No |
| Upload & delete attachments | Yes | Yes | Yes | No |
| Create & edit project labels | Yes | Yes | Yes | No |
| Delete project labels | Yes | Yes | No | No |
| Manage team members & invitations | Yes | No | No | No |
| Update, archive & delete project | Yes | No | No | No |

---

## Core Engineering Highlights

### Single-Flight JWT Refresh Queue
Implemented in `src/services/api.js`:
- All protected requests attach `Authorization: Bearer <access_token>` from `tokenStorage`.
- When multiple concurrent requests fail with `401 Unauthorized`, `refreshAccessTokenSingleFlight()` shares a single in-flight `POST /api/auth/refresh` promise rather than firing duplicate refresh calls—preventing backend `TOKEN_REUSE_DETECTED` session revocation.
- On successful rotation, `traceboard:tokens-refreshed` is dispatched so the Socket.IO client seamlessly re-authenticates; on refresh failure, tokens are cleared and `traceboard:auth-expired` resets session state and redirects to `/login`.

### Real-Time Synchronization (Socket.IO)
Implemented in `src/services/socket.js` and `src/hooks/useSocket.js`:
- Authenticates via `auth: { token }` over WebSocket (with polling fallback) and automatically reconnects when JWT tokens rotate.
- **Project Room (`useProjectSocket`)**: Emits `project:join` / `project:leave` and listens for:
  - `issue:created`, `issue:updated`, `issue:moved`, `issue:deleted`
- **Issue Room (`useIssueSocket`)**: Emits `issue:join` / `issue:leave` and listens for:
  - `issue:updated`, `issue:moved`, `issue:deleted`
  - `comment:added`, `comment:updated`, `comment:deleted`
  - `attachment:added`, `attachment:deleted`

### S3 Presigned Attachments with Fallback
Implemented in `src/services/attachment.service.js` and `src/components/attachments/AttachmentPanel.jsx`:
1. **Client Validation:** Enforces allowed MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`, `text/plain`, `application/json`, `application/pdf`) and size limits (**25 MB** presigned / **10 MB** direct).
2. **Primary Direct-to-S3 Flow:**
   - `POST .../attachments/presign` → retrieves `upload_url` & pending attachment record.
   - `PUT <upload_url>` directly to object storage (without `Authorization` header, with `Content-Type` and upload progress tracking).
   - `POST .../attachments/:attachmentId/confirm` → finalizes the attachment record.
3. **Server-Proxied Fallback:** If direct S3 `PUT` fails (e.g., CORS or restricted network) and the file is ≤ 10 MB, falls back to `POST .../attachments/upload` (`multipart/form-data`, `file` field).

### Kanban Drag-and-Drop Positioning
- Built with `@dnd-kit/core` and `@dnd-kit/sortable`.
- Moving a card within or across columns optimistically updates board state, calculates neighboring `prev_position` and `next_position` fractional bounds, and dispatches `PATCH /api/projects/:projectId/issues/:issueId/move`.
- Any API error automatically rolls back the board state and displays an error toast.

---

## Backend API Integration

All service modules live in `src/services/` and expect standard backend response envelopes (`{ success: true, message, data, meta? }` and `{ success: false, error: { code, message, details } }`):

| Service Module | Endpoint Group | Operations |
| :--- | :--- | :--- |
| `auth.service.js` | `/api/auth/*` | Register, login, refresh token rotation, logout |
| `user.service.js` | `/api/users/me*` | Fetch profile, update profile, change password |
| `health.service.js` | `/api/health` | Backend liveness / status indicator |
| `project.service.js` | `/api/projects/*` | List (paginated/archived), get, create, update, delete |
| `member.service.js` | `/api/projects/:id/{members,invites}` | List members, update role, remove/leave, create/list/cancel/accept invites |
| `label.service.js` | `/api/projects/:id/labels/*` | List, create, update, delete project labels |
| `issue.service.js` | `/api/projects/:id/issues/*` | Filtered list, get by key/ID, create, update, move, delete, attach/detach labels |
| `comment.service.js` | `.../issues/:issueId/comments/*` | List top-level/replies, create, update, delete |
| `activity.service.js` | `.../issues/:issueId/activity` | Paginated issue audit trail |
| `attachment.service.js` | `.../issues/:issueId/attachments/*` | List, presign, direct S3 PUT, confirm, multipart upload, delete |

---

## Design System — Lumina Clarity

Defined in `src/styles/tokens.css` using Tailwind CSS v4 `@theme` tokens:

- **Typography:** `Inter` (`400`, `500`, `600`, `700`) with calibrated type scales (`headline-xl` through `caption-xs`) and uppercase tracked `label-sm` section headers.
- **Surfaces & Elevation:** Cool slate canvas (`#F8FAFC`), pure white Level 1 cards (`#FFFFFF` with `1px` `#E2E8F0` borders and ambient shadows), diffused Level 2 floating popovers, and Level 3 backdrop-blurred modals.
- **Semantic Palette:**
  - Primary Cobalt (`#2563EB`, hover `#1D4ED8`, container `#EFF6FF`)
  - Success Mint (`#10B981` / `#ECFDF5`)
  - Warning Amber (`#F59E0B` / `#FFFBEB`)
  - Error Crimson (`#EF4444` / `#FEF2F2`)
- **Feedback Standards:** Shimmer skeleton loaders (`CardSkeleton`, `DetailSkeleton`) instead of raw `"Loading..."` strings, non-intrusive toast notifications, and a top-level React `ErrorBoundary`.

---

## Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `⌘ K` / `Ctrl + K` | Anywhere (authenticated) | Toggle Global Command Palette |
| `↑` / `↓` + `Enter` | Command Palette & `@mention` popover | Navigate and select results |
| `Esc` | Modals, Command Palette, Popovers | Close active overlay |

---

## Deployment

**Live Production URL:** https://project-management-frontend-pearl.vercel.app/

This repository is deployed on **Vercel** (and compatible with any static SPA host such as Netlify or Cloudflare Pages).

- `vercel.json` rewrites all routes (`/(.*)`) to `/index.html` so deep links (such as `/projects/:projectId/issues/CORE-1` and `/invites/:token`) resolve cleanly on browser refresh.
- Set `VITE_API_URL` in your hosting provider's environment variables to point to your deployed Traceboard backend URL, and ensure the backend's CORS `CLIENT_ORIGIN` allows your frontend domain.

```bash
# Build for production
npm run build

# Locally preview the production bundle
npm run preview
```
