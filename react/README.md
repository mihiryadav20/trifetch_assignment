# TriFetch - Cardiac Events Dashboard

A modern web application for visualizing and managing cardiac event data, featuring interactive ECG plots, patient management, and comprehensive event analysis.

## 🚀 Overview

TriFetch is a full-featured cardiac events monitoring dashboard that allows healthcare professionals to:
- View and analyze ECG (electrocardiogram) data across multiple patients
- Browse cardiac events with detailed filtering and sorting capabilities
- Visualize dual-lead ECG waveforms with interactive plots
- Track prediction confidence and ground truth comparisons
- Manage patient episodes and event classifications

## 🏗️ Tech Stack

### Core Framework
- **React 19.2.0** - Modern UI library with latest features
- **TypeScript 5.9.3** - Type-safe development
- **Vite 7.2.2** - Lightning-fast build tool and dev server

### Routing & State
- **React Router DOM 7.9.6** - Client-side routing with nested routes

### UI Components & Styling
- **TailwindCSS 4.1.17** - Utility-first CSS framework
- **@tailwindcss/vite 4.1.17** - Vite integration for Tailwind
- **Radix UI** - Accessible component primitives:
  - `@radix-ui/react-checkbox` - Checkbox components
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-slot` - Composition utilities
- **shadcn/ui** - Custom UI components built on Radix UI
- **Lucide React 0.554.0** - Modern icon library
- **class-variance-authority 0.7.1** - CVA for component variants
- **clsx 2.1.1** - Conditional className utility
- **tailwind-merge 3.4.0** - Merge Tailwind classes intelligently

### Data Visualization
- **Plotly.js 3.3.0** - Interactive charting library
- **react-plotly.js 2.6.0** - React wrapper for Plotly
- **plotly.js-dist-min 3.3.0** - Minified Plotly distribution

### Data Tables
- **@tanstack/react-table 8.21.3** - Powerful table component with:
  - Sorting
  - Filtering
  - Pagination
  - Column visibility
  - Row selection

### Development Tools
- **ESLint 9.39.1** - Code linting
- **TypeScript ESLint 8.46.3** - TypeScript-specific linting
- **babel-plugin-react-compiler 1.0.0** - React Compiler optimization
- **@vitejs/plugin-react 5.1.0** - React plugin for Vite with Fast Refresh

## 📁 Project Structure

```
react/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── table.tsx
│   │   │   └── theme-provider.tsx
│   │   ├── ECGPlot.tsx           # Interactive ECG visualization
│   │   ├── EpisodesDataTable.tsx # Data table for cardiac episodes
│   │   └── PatientList.tsx       # Patient listing component
│   ├── pages/              # Route-level page components
│   │   ├── Home.tsx        # Dashboard home page
│   │   ├── PatientDetails.tsx  # Patient-specific episodes
│   │   └── EventDetails.tsx    # Individual event ECG view
│   ├── lib/                # Utility functions
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles with Tailwind
│   └── App.css             # Component-specific styles
├── public/                 # Static public assets
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tsconfig.app.json       # App-specific TypeScript config
├── tsconfig.node.json      # Node-specific TypeScript config
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🎯 Key Features

### 1. **Dashboard (Home Page)**
- Comprehensive data table displaying all cardiac events
- Advanced filtering by patient ID, event type, and status
- Multi-column sorting capabilities
- Pagination with customizable page sizes
- Column visibility controls
- Direct navigation to patient and event details

### 2. **ECG Visualization**
- Interactive dual-lead (Lead I & Lead II) ECG plots
- Zoomable and pannable waveform displays
- Event window highlighting with toggle controls
- Normalized and offset lead display for clarity
- Real-time confidence scoring
- Ground truth vs. predicted classification comparison
- Rejection status indicators

### 3. **Patient Management**
- Patient-specific episode listings
- Episode count tracking
- Event classification display
- Quick navigation to individual ECG plots
- Status indicators (Valid/Rejected)

### 4. **Event Details**
- Full ECG waveform visualization
- Metadata display (patient ID, event ID, timestamps)
- Prediction confidence metrics
- Classification information
- Breadcrumb navigation

### 5. **Theme Support**
- Dark mode by default
- Theme persistence via localStorage
- Consistent theming across all components

## 🔌 API Integration

The application connects to a backend API (default: `http://127.0.0.1:8000`) with the following endpoints:

- `GET /patients` - List all patients
- `GET /patient/:patientId/episodes` - Get episodes for a specific patient
- `GET /event/:eventId` - Get detailed event data including ECG waveforms

## 🛠️ Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts the Vite dev server with Hot Module Replacement (HMR) at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Compiles TypeScript and builds optimized production bundle to `dist/`

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality

### Preview Production Build
```bash
npm run preview
```
Locally preview the production build

## 🎨 Component Architecture

### UI Components (shadcn/ui)
All UI components follow the shadcn/ui pattern:
- Built on Radix UI primitives for accessibility
- Styled with TailwindCSS
- Fully customizable and composable
- Type-safe with TypeScript

### Data Flow
1. **Pages** fetch data from API endpoints
2. **Components** receive data via props
3. **UI Components** handle user interactions
4. **React Router** manages navigation state

### State Management
- Local component state with `useState`
- Side effects with `useEffect`
- Memoization with `useMemo` for performance
- URL parameters for routing state

## 🔧 Configuration

### Path Aliases
The project uses `@/` as an alias for the `src/` directory:
```typescript
import { Button } from "@/components/ui/button"
```

### Vite Configuration
- React plugin with Fast Refresh
- TailwindCSS Vite plugin
- Path resolution for `@/` alias

### TypeScript Configuration
- Strict type checking enabled
- Path mapping for imports
- Separate configs for app and node environments

## 📦 Key Dependencies Explained

- **React Compiler**: Optimizes React components automatically for better performance
- **TanStack Table**: Provides headless table logic with full control over UI
- **Plotly.js**: Industry-standard library for scientific and medical data visualization
- **Radix UI**: Ensures accessibility compliance (ARIA, keyboard navigation)
- **Lucide React**: Tree-shakeable icon library with consistent design

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Ensure backend API is running at `http://127.0.0.1:8000`
4. Start development server: `npm run dev`
5. Open browser to `http://localhost:5173`

## 📝 Notes

- The application expects a backend API to be running for data fetching
- ECG data is displayed with normalized amplitudes for consistent visualization
- All timestamps are converted from sample indices (50 Hz sampling rate)
- Theme preference is persisted in browser localStorage
