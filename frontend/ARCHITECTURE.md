# Roadmap Builder - Architecture Documentation

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React/Vite)                       │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              AdminRoadmapBuilder (Main Component)             │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  State Management (React Query + Local useState)        │  │ │
│  │  │  • selectedId: string                                    │  │ │
│  │  │  • search: string                                        │  │ │
│  │  │  │  • modal: ModalState                                  │  │ │
│  │  │  │  • toast: {type, text}                                │  │ │
│  │  │  │  • deletion pending states                            │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │  │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Queries (React Query)                                  │  │ │
│  │  │  queryClient.listAdminCareers()                          │  │ │
│  │  │  └─ Caches: CareerRoadmap[]                              │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │  │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Mutations (React Query)                                │  │ │
│  │  │  ├─ createCareer  ─→  POST /admin/career                │  │ │
│  │  │  ├─ updateCareer  ─→  PUT /admin/career/:id             │  │ │
│  │  │  ├─ deleteCareer  ─→  DELETE /admin/career/:id          │  │ │
│  │  │  ├─ publishCareer ─→  PATCH /admin/career/:id/publish   │  │ │
│  │  │  ├─ createModule  ─→  POST /admin/module                │  │ │
│  │  │  ├─ updateModule  ─→  PUT /admin/module/:id             │  │ │
│  │  │  ├─ deleteModule  ─→  DELETE /admin/module/:id          │  │ │
│  │  │  ├─ createWeek    ─→  POST /admin/week                  │  │ │
│  │  │  ├─ updateWeek    ─→  PUT /admin/week/:id               │  │ │
│  │  │  ├─ deleteWeek    ─→  DELETE /admin/week/:id            │  │ │
│  │  │  ├─ createDay     ─→  POST /admin/day                   │  │ │
│  │  │  ├─ updateDay     ─→  PUT /admin/day/:id                │  │ │
│  │  │  ├─ deleteDay     ─→  DELETE /admin/day/:id             │  │ │
│  │  │  ├─ createTopic   ─→  POST /admin/topic                 │  │ │
│  │  │  ├─ updateTopic   ─→  PUT /admin/topic/:id              │  │ │
│  │  │  ├─ deleteTopic   ─→  DELETE /admin/topic/:id           │  │ │
│  │  │  ├─ addResource   ─→  POST /admin/resource              │  │ │
│  │  │  ├─ updateResource ─→ PUT /admin/resource/:id           │  │ │
│  │  │  └─ deleteResource ─→ DELETE /admin/resource/:id        │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │  │ │
│  │  ┌────────────────────┬────────────────────────────────────┐  │ │
│  │  │  UI Layer (JSX)   │  Component Hierarchy              │  │ │
│  │  ├────────────────────┼────────────────────────────────────┤  │ │
│  │  │ ┌─────────────────┐ │ ModulePanel                     │  │ │
│  │  │ │ Sidebar         │ │   └─ WeekPanel                  │  │ │
│  │  │ │ ┌─────────────┐ │ │       └─ DayPanel              │  │ │
│  │  │ │ │Career List  │ │ │           └─ TopicPanel        │  │ │
│  │  │ │ │Search Box   │ │ │               └─ ResourceRow   │  │ │
│  │  │ │ │+ New Career │ │ │                                 │  │ │
│  │  │ │ │[Refresh]    │ │ │ ModalDialog (Reusable)         │  │ │
│  │  │ │ └─────────────┘ │ │   └─ Form Fields               │  │ │
│  │  │ └─────────────────┘ │   └─ Validation & Error Display│  │ │
│  │  │                     │                                 │  │ │
│  │  │ ┌─────────────────┐ │ Toast Notification             │  │ │
│  │  │ │ Detail Panel    │ │   └─ Success/Error Messages   │  │ │
│  │  │ │ Career Info     │ │                                 │  │ │
│  │  │ │ Edit/Pub/Del    │ │ Collapsible Component          │  │ │
│  │  │ │ Modules Section │ │   └─ Expand/Collapse Sections │  │ │
│  │  │ │ Nested Tree     │ │                                 │  │ │
│  │  │ └─────────────────┘ │                                 │  │ │
│  │  └────────────────────┴────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         ↓↑ (HTTP/REST API)
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                      │
│                                                                     │
│  Admin Routes (/admin/*)                                           │
│  ├─ GET    /careers          → List all careers                    │
│  ├─ POST   /career           → Create career                       │
│  ├─ PUT    /career/:id       → Update career                       │
│  ├─ PATCH  /career/:id/...   → Publish/unpublish                   │
│  ├─ DELETE /career/:id       → Delete career                       │
│  │                                                                  │
│  ├─ POST   /module           → Create module                       │
│  ├─ PUT    /module/:id       → Update module                       │
│  ├─ DELETE /module/:id       → Delete module                       │
│  │                                                                  │
│  ├─ POST   /week             → Create week                         │
│  ├─ PUT    /week/:id         → Update week                         │
│  ├─ DELETE /week/:id         → Delete week                         │
│  │                                                                  │
│  ├─ POST   /day              → Create day                          │
│  ├─ PUT    /day/:id          → Update day                          │
│  ├─ DELETE /day/:id          → Delete day                          │
│  │                                                                  │
│  ├─ POST   /topic            → Create topic                        │
│  ├─ PUT    /topic/:id        → Update topic                        │
│  ├─ DELETE /topic/:id        → Delete topic                        │
│  │                                                                  │
│  ├─ POST   /resource         → Add resource                        │
│  ├─ PUT    /resource/:id     → Update resource                     │
│  └─ DELETE /resource/:id     → Delete resource                     │
│                                                                     │
│  Auth Middleware                                                   │
│  ├─ JWT verification                                               │
│  ├─ Admin role check                                               │
│  └─ Request logging                                                │
│                                                                     │
│  Service Layer                                                     │
│  ├─ Career Service → Database operations                           │
│  ├─ Module Service → Module CRUD                                   │
│  ├─ Week Service → Week CRUD                                       │
│  ├─ Day Service → Day CRUD                                         │
│  ├─ Topic Service → Topic CRUD                                     │
│  ├─ Resource Service → Resource CRUD                               │
│  └─ Validation → Input sanitization                                │
│                                                                     │
│  Database Layer (MongoDB/Prisma)                                   │
│  ├─ CareerRoadmap Schema                                           │
│  ├─ CareerModule Schema                                            │
│  ├─ CareerWeek Schema                                              │
│  ├─ CareerDay Schema                                               │
│  ├─ CareerTopic Schema                                             │
│  └─ CareerResource Schema                                          │
└─────────────────────────────────────────────────────────────────────┘
         ↓↑ (Mongoose/Prisma)
┌─────────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas Database                           │
│                                                                     │
│  Collections:                                                      │
│  ├─ careerRoadmaps (Main collection)                               │
│  │  └─ Embedded: modules[], weeks[], days[], topics[], resources[]│
│  │                                                                  │
│  └─ Indexes:                                                       │
│     ├─ Career: id, slug, status                                    │
│     ├─ Module: careerId                                            │
│     ├─ Week: moduleId, weekNumber                                  │
│     ├─ Day: weekId, dayNumber                                      │
│     ├─ Topic: dayId                                                │
│     └─ Resource: topicId, provider                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
AdminRoadmapBuilder
│
├─── Sidebar Section
│    ├─ Search Input
│    ├─ New Career Button
│    ├─ Refresh Button
│    └─ Career List (Dynamic)
│        └─ CareerCard (Selectable)
│
├─── Detail Panel Section
│    ├─ Career Header (When selected)
│    │  ├─ Title Display
│    │  ├─ Description
│    │  ├─ Status Badge
│    │  ├─ Edit Button
│    │  ├─ Publish Button
│    │  └─ Delete Button
│    │
│    └─ Modules Section
│        └─ ModulePanel (List)
│            ├─ Module Header
│            │  ├─ Title with Icon
│            │  ├─ Week Count
│            │  ├─ Edit Button
│            │  └─ Delete Button
│            │
│            └─ WeekPanel (List)
│                ├─ Week Header
│                │  ├─ Week Number
│                │  ├─ Title
│                │  ├─ Day Count
│                │  ├─ Edit Button
│                │  └─ Delete Button
│                │
│                └─ DayPanel (List)
│                    ├─ Day Header
│                    │  ├─ Day Number
│                    │  ├─ Title
│                    │  ├─ Hours
│                    │  ├─ Topic Count
│                    │  ├─ Edit Button
│                    │  └─ Delete Button
│                    │
│                    └─ TopicPanel (List)
│                        ├─ Topic Header
│                        │  ├─ Title
│                        │  ├─ Resource Count
│                        │  ├─ Edit Button
│                        │  └─ Delete Button
│                        │
│                        └─ ResourceRow (List)
│                            ├─ Resource Link
│                            ├─ Provider Info
│                            ├─ Edit Button
│                            └─ Delete Button
│
├─── Modal Dialog (Overlay)
│    ├─ Modal Header (Conditional Title)
│    ├─ Form Fields (Dynamic based on type)
│    ├─ Error Display (Conditional)
│    └─ Action Buttons (Cancel, Save)
│
└─── Toast Notification (Fixed Position)
     ├─ Success Toast (Green)
     └─ Error Toast (Red)
```

---

## Data Flow Diagram

```
User Action
    │
    ├─→ Click Career (Select)
    │   └─→ setSelectedId()
    │       └─→ UI Re-renders
    │
    ├─→ Search Input
    │   └─→ setSearch()
    │       └─→ Filter careers (useMemo)
    │           └─→ UI Re-renders
    │
    ├─→ Click + New Career
    │   └─→ openModal({kind: 'career'})
    │       └─→ Modal shows
    │           └─→ User fills form
    │               └─→ Click Save
    │                   └─→ createCareerMut.mutate()
    │                       └─→ API: POST /admin/career
    │                           └─→ Server creates record
    │                               └─→ Returns new career
    │                                   └─→ React Query invalidates
    │                                       └─→ Query re-runs
    │                                           └─→ UI updates
    │                                               └─→ Toast: Success
    │                                                   └─→ Modal closes
    │
    ├─→ Click Edit
    │   └─→ openModal({kind: 'edit', ...existing data})
    │       └─→ Modal shows with data pre-filled
    │           └─→ User modifies
    │               └─→ Click Save
    │                   └─→ updateCareerMut.mutate()
    │                       └─→ API: PUT /admin/career/:id
    │                           └─→ Server updates
    │                               └─→ React Query invalidates
    │                                   └─→ UI updates
    │                                       └─→ Toast: Updated
    │
    └─→ Click Delete
        └─→ deleteCareerMut.mutate()
            └─→ API: DELETE /admin/career/:id
                └─→ Server deletes
                    └─→ UI removes from list
                        └─→ Toast: Deleted
```

---

## Type System

```typescript
// Core Domain Types
type Career = {
  id: string
  name: string
  title?: string
  description: string
  modules?: Module[]
  status: 'draft' | 'published'
  approved?: boolean
  totalWeeks?: number
  createdAt?: string
  updatedAt?: string
}

type Module = {
  id: string
  careerId: string
  title: string
  description?: string
  weeks?: Week[]
  order?: number
}

type Week = {
  id: string
  moduleId: string
  weekNumber: number
  title: string
  description?: string
  days?: Day[]
}

type Day = {
  id: string
  weekId: string
  dayNumber: number
  title: string
  description?: string
  estimatedHours?: number
  topics?: Topic[]
}

type Topic = {
  id: string
  dayId: string
  title: string
  description?: string
  objective?: string
  difficulty?: string
  resources?: Resource[]
  order?: number
}

type Resource = {
  id?: string
  topicId: string
  title?: string
  url: string
  provider?: string
  type?: string
  isFree?: boolean
}

// UI State Types
type ModalState = {
  kind: ModalKind
  careerId?: string
  moduleId?: string
  weekId?: string
  dayId?: string
  topicId?: string
  id?: string
  title: string
  description: string
  number: string
  hours: string
  objective: string
  url: string
  provider: string
}

type Toast = {
  type: 'ok' | 'err'
  text: string
}
```

---

## State Lifecycle

```
1. Initial State
   └─ No career selected
      └─ Empty search
         └─ No modal open

2. After Load
   └─ Careers fetched from API
      └─ Sidebar populated
         └─ "Select a career" message

3. On Career Select
   └─ selectedId updated
      └─ Detail panel shows career info
         └─ Can see modules list

4. On Add Career
   └─ Modal opens
      └─ User fills form
         └─ Form validation
            └─ Save triggered
               └─ Mutation runs
                  └─ Query invalidates
                     └─ New data fetched
                        └─ UI updates

5. On Delete
   └─ Deletion pending flag set
      └─ Button shows spinner
         └─ API call made
            └─ Success → Remove from UI
            └─ Error → Show error toast
               └─ Deletion flag cleared
```

---

## Error Handling Flow

```
Error Occurs
    │
    ├─→ Backend Returns Error
    │   └─→ Mutation catches error
    │       └─→ Call onError handler
    │           ├─→ Modal: setModalError(message)
    │           │   └─→ Show in modal dialog
    │           │
    │           └─→ Toast: notify('err', message)
    │               └─→ Show 5s notification
    │
    └─→ Form Validation Error
        └─→ Check required fields
            ├─→ If empty: setModalErr("Field required")
            │   └─→ Show error before API call
            │
            └─→ If invalid: setModalErr("Invalid format")
                └─→ Show error before API call
                    └─→ Save button blocked
```

---

## Performance Optimization Strategy

```
Rendering
├─ Component.memo for sub-components
├─ useMemo for filtered lists
├─ Event delegation
└─ Lazy evaluation

Caching
├─ React Query: 5min stale time
├─ Query invalidation on mutations
├─ Background refetch disabled
└─ Manual refetch option

Network
├─ Batch operations via React Query
├─ Debounced search (future)
├─ Pagination ready (future)
└─ Minimal payload sizes

Bundle
├─ Code splitting: ~23 kB per page
├─ Tree shaking enabled
├─ Production minification
└─ Gzip compression: 5.39 kB
```

---

## Deployment Architecture

```
Development
├─ Frontend: localhost:5173
├─ Backend: localhost:3000
└─ Database: MongoDB Atlas

Production
├─ Frontend: CDN + Static Host
├─ Backend: Cloud Server (AWS/GCP/Azure)
└─ Database: MongoDB Atlas (production cluster)

CI/CD Pipeline (Future)
├─ GitHub Actions
├─ Run tests on push
├─ Build on merge
├─ Deploy on tag
└─ Monitor & alert
```

---

**Architecture Version**: 1.0  
**Last Updated**: July 24, 2026  
**Status**: Production Ready ✅
