# SmartServe Project Structure

This document outlines the organized structure of the SmartServe micro-volunteering platform.

## Frontend Structure (`src/`)

### Components (`src/components/`)
Reusable UI components organized by functionality:

- **`AuthForm.tsx`** - User authentication (login/register)
- **`Dashboard.tsx`** - Main user dashboard for task management
- **`VolunteerDashboard.tsx`** - Volunteer dashboard for accepting tasks
- **`RoleModal.tsx`** - Modal for selecting user role
- **`LocationMap.tsx`** - Interactive map component for location selection
- **`LocationPicker.tsx`** - Location input with current location detection
- **`AddressDisplay.tsx`** - Display location information with map links

### Pages (`src/pages/`)
Top-level page components:

- **`Home.tsx`** - Landing page with navigation and content sections

### Utils (`src/utils/`)
Utility functions and helpers:

- **`api.ts`** - API calls and HTTP requests
- **`locationUtils.ts`** - Location-related utilities (geocoding, formatting)

### Styles (`src/`)
- **`index.css`** - Global styles and Tailwind CSS imports
- **`main.tsx`** - React entry point
- **`App.tsx`** - Main application component

## Backend Structure (`server/src/`)

### Models (`server/src/models/`)
Mongoose schemas and database models:

- **`User.ts`** - User model with authentication and profile data
- **`Task.ts`** - Task model with location, volunteers, and metadata

### Controllers (`server/src/controllers/`)
Business logic separated from routes:

- **`taskController.ts`** - Task creation, retrieval, acceptance, deletion
- **`userController.ts`** - User profile management

### Routes (`server/src/routes/`)
Express route handlers:

- **`auth.ts`** - Authentication endpoints (login/register)
- **`tasks.ts`** - Task management endpoints
- **`user.ts`** - User profile endpoints

### Utils (`server/src/utils/`)
Backend utility functions:

- **`locationUtils.ts`** - Location validation, formatting, distance calculations

## Key Benefits of This Structure

### 1. **Separation of Concerns**
- UI components are separate from business logic
- Map/location functionality is modularized
- API calls are centralized

### 2. **Reusability**
- Location components can be used across different parts of the app
- Utility functions are shared between components
- Controllers can be reused by different routes

### 3. **Maintainability**
- Easy to find and modify specific functionality
- Clear organization makes debugging easier
- Consistent patterns across the codebase

### 4. **Scalability**
- New features can be added without affecting existing code
- Components can be easily extended or replaced
- Backend logic is organized for easy expansion

## Location/Map Features

The location and map functionality has been completely modularized:

### Frontend Components
- **`LocationMap.tsx`** - Handles map rendering and interaction
- **`LocationPicker.tsx`** - Manages location input and current location detection
- **`AddressDisplay.tsx`** - Displays location information consistently

### Utilities
- **`locationUtils.ts`** (Frontend) - Geocoding, formatting, map URLs
- **`locationUtils.ts` (Backend)** - Validation, distance calculations

### Benefits
- Consistent location handling across the app
- Easy to update map functionality in one place
- Reusable components for future features
- Proper error handling and validation

## Development Guidelines

1. **New Components**: Place in `src/components/` with descriptive names
2. **New Pages**: Place in `src/pages/` for top-level views
3. **New Utils**: Place in `src/utils/` for shared functionality
4. **New Models**: Place in `server/src/models/` for database schemas
5. **New Controllers**: Place in `server/src/controllers/` for business logic
6. **New Routes**: Place in `server/src/routes/` for API endpoints

This structure ensures the codebase remains organized, maintainable, and scalable as the project grows. 