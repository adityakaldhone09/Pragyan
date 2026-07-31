# Admin Roadmap Builder - Complete Documentation

## Overview

The Roadmap Builder (`admin-roadmap-builder-optimized.tsx`) is a comprehensive admin interface for managing career learning roadmaps with a nested hierarchy:

```
Career
  ├── Module
  │   ├── Week
  │   │   ├── Day
  │   │   │   ├── Topic
  │   │   │   │   └── Resource
```

## Features

### 1. **Career Management**
- ✅ Create new careers
- ✅ Edit career details (title, description)
- ✅ Delete careers
- ✅ Publish/Unpublish careers
- ✅ View career status (Draft/Published)
- ✅ Search and filter careers

### 2. **Module Management**
- ✅ Add modules to careers
- ✅ Edit module details
- ✅ Delete modules
- ✅ View module count and hierarchy

### 3. **Week Management**
- ✅ Add weeks to modules
- ✅ Specify week number
- ✅ Edit week details
- ✅ Delete weeks
- ✅ Collapsible UI for easy navigation

### 4. **Day Management**
- ✅ Add days to weeks
- ✅ Specify day number
- ✅ Set estimated hours
- ✅ Edit day details
- ✅ Delete days

### 5. **Topic Management**
- ✅ Add topics to days
- ✅ Define learning objectives
- ✅ Edit topic details
- ✅ Delete topics
- ✅ Set difficulty level

### 6. **Resource Management**
- ✅ Add learning resources (links) to topics
- ✅ Specify provider (Udemy, Coursera, etc.)
- ✅ Edit resource details
- ✅ Delete resources
- ✅ Direct links to external resources

## UI Layout

```
┌─────────────────────────────────────────────────┐
│           Roadmap Builder                       │
├──────────────────┬──────────────────────────────┤
│   Sidebar        │    Main Detail Panel         │
│  (Careers)       │   (Selected Career Info)     │
│                  │                              │
│ ┌──────────────┐ │  Career Title                │
│ │ Career 1     │ │  Status: Draft/Published     │
│ │ Career 2     │ │                              │
│ │ Career 3     │ │  MODULES (Expandable)        │
│ │              │ │  ├─ Module 1                 │
│ │ [+ New]      │ │  │  ├─ Week 1                │
│ │ [Refresh]    │ │  │  │  ├─ Day 1              │
│ │ [Search]     │ │  │  │  │  ├─ Topic 1         │
│ └──────────────┘ │  │  │  │  │  │  └─ Resource  │
│                  │  │  │  │  │  │     [Edit] [X] │
└──────────────────┴──────────────────────────────┘
```

## How to Use

### Creating a New Career

1. Click **+ New Career** in the sidebar
2. Fill in:
   - **Title**: Career name (e.g., "Web Development")
   - **Description**: Brief overview
3. Click **Save**

### Adding Modules

1. Select a career from the sidebar
2. Click **+ Add Module** in the detail panel
3. Enter module name and description
4. Click **Save**

### Adding Weeks

1. Click the expand arrow on a module
2. Click **+ Add Week**
3. Enter:
   - **Week Number**: (1, 2, 3, etc.)
   - **Title**: (e.g., "HTML Fundamentals")
   - **Description**: Optional
4. Click **Save**

### Adding Days

1. Expand the desired week
2. Click **+ Add Day**
3. Enter:
   - **Day Number**: (1-7)
   - **Title**: (e.g., "Introduction to HTML")
   - **Estimated Hours**: (e.g., 8)
   - **Description**: Optional
4. Click **Save**

### Adding Topics

1. Expand the desired day
2. Click **+ Add Topic**
3. Enter:
   - **Title**: Topic name
   - **Description**: What will be covered
   - **Objective**: Learning goal
4. Click **Save**

### Adding Resources

1. Expand the desired topic (shows resources underneath)
2. Click **+ Add Resource**
3. Enter:
   - **Title**: Resource name (auto-filled from URL if empty)
   - **URL**: Direct link to resource
   - **Provider**: Source (Udemy, YouTube, etc.)
4. Click **Save**

## Component Architecture

### Main Component: `AdminRoadmapBuilder()`

- Manages global state (selected career, search, modal)
- Handles all mutations (create, update, delete)
- Displays sidebar and detail panel

### Sub-Components (Hierarchical)

1. **ModulePanel**: Displays module with collapsible weeks
2. **WeekPanel**: Displays week with collapsible days
3. **DayPanel**: Displays day with collapsible topics
4. **TopicPanel**: Displays topic with collapsible resources
5. **ResourceRow**: Individual resource link display

### Utility Components

- **ModalDialog**: Reusable form modal
- **Toast**: Success/error notification
- **Collapsible**: Expandable/collapsible sections

## State Management

### React Query

- **Query**: `listAdminCareers` - Fetches all careers with nested hierarchy
- **Mutations**: Create, Update, Delete for each level
- **Auto-invalidation**: Updates refresh after mutations

### Local State

```typescript
const [selectedId, setSelectedId] = useState('');      // Selected career
const [search, setSearch] = useState('');              // Search query
const [modal, setModal] = useState<ModalState>(...)    // Modal form data
const [modalErr, setModalErr] = useState('');          // Modal validation errors
const [toast, setToast] = useState(...);               // Notifications
```

## API Integration

All operations use `careerRoadmapService`:

```typescript
// Career
createCareer(input)
updateCareer(id, input)
deleteCareer(id)
publishCareer(id, published)

// Module
createModule(input)
updateModule(id, input)
deleteModule(id)

// Week
createWeek(input)
updateWeek(id, input)
deleteWeek(id)

// Day
createDay(input)
updateDay(id, input)
deleteDay(id)

// Topic
createTopic(input)
updateTopic(id, input)
deleteTopic(id)

// Resource
addResource(input)
updateResource(id, input)
deleteResource(id)
```

## Error Handling

- **Modal Errors**: Displayed in modal dialog
- **Toast Notifications**: Success/error messages auto-dismiss
- **Graceful Degradation**: Failed deletes show user-friendly errors
- **Type Safety**: Full TypeScript support with proper error types

## UI/UX Features

### Responsive Design
- Sidebar and main panel layout
- Collapsible sections for deep nesting
- Horizontal scrolling for long content

### User Feedback
- Loading states (spinners on buttons)
- Error messages with context
- Success toasts
- Disabled states for locked operations (legacy roadmaps)

### Accessibility
- Semantic HTML structure
- Proper button labeling
- Keyboard navigation support
- Readable color contrast

## Performance Optimizations

1. **React.memo** on expensive components
2. **useMemo** for filtered lists
3. **Lazy evaluation** of nested data
4. **Efficient re-renders** through proper state organization

## Testing

Run tests:
```bash
npm run test -- admin-roadmap-builder-optimized.test.tsx
```

Test coverage:
- ✅ Rendering
- ✅ Career loading and filtering
- ✅ Modal interactions
- ✅ CRUD operations
- ✅ Error handling

## Limitations & Notes

1. **Legacy Roadmaps**: Cannot edit/delete roadmaps from `legacy-roadmap` source
2. **Deep Nesting**: UI remains responsive even with deeply nested structures
3. **Bulk Operations**: Not yet supported (future enhancement)
4. **Drag & Drop Reordering**: Available via separate reorder endpoints

## Future Enhancements

- [ ] Bulk import/export (CSV, JSON)
- [ ] Drag-and-drop reordering
- [ ] Resource preview/validation
- [ ] Duplicate roadmap feature
- [ ] Version history
- [ ] Collaborative editing
- [ ] Analytics dashboard

## Related Files

- `/services/careerRoadmapService.ts` - API client
- `/types/api.ts` - TypeScript interfaces
- `/components/ui/` - Button, Input, Textarea components

## Support

For issues or questions about the Roadmap Builder, refer to:
- Backend API: `/api/admin/careers`
- Frontend Service: `careerRoadmapService`
- Tests: `__tests__/admin-roadmap-builder-optimized.test.tsx`
