# Project Minore Frontend

A React 18 + TypeScript + Vite SPA for research project management, claim extraction, conflict detection, and hypothesis generation.

## Technology Stack

- **Framework**: React 18 + React Router v6
- **Language**: TypeScript 5
- **Build Tool**: Vite 5
- **HTTP Client**: Axios with Bearer token auth
- **State Management**: TanStack Query (React Query)
- **Form Handling**: react-hook-form + zod validation
- **Styling**: Tailwind CSS + custom theme provider
- **Graph Visualization**: Reactflow + Dagre (auto-layout)
- **UI Components**: Lucide React icons, custom components
- **Notifications**: react-hot-toast

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn/pnpm
- Backend API running (Project Minore backend on `http://localhost:8000` by default)

## Installation

```bash
cd frontend
npm install
```

## Environment Configuration

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

**Environment Variables:**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Backend API base URL (v1 endpoints) | `http://localhost:8000/api/v1` | `https://api.example.com/api/v1` |
| `VITE_API_PROXY` | Optional: API proxy for requests | `http://localhost:8000` | `https://api.example.com` |

### Development

```bash
npm run dev
```

Starts Vite dev server on `http://localhost:5173` with HMR.

### Build (Production)

```bash
npm run build
```

- Runs TypeScript type-check (`tsc --noEmit`)
- Bundles with Vite for production
- Output: `./dist/`

### Preview Built Dist

```bash
npm run preview
```

Serves the production build locally on `http://localhost:5173` for testing.

### Lint / Type Check

```bash
npm run lint
```

Runs TypeScript compiler in check-only mode (no emit).

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Top-level routes
│   ├── index.css             # Global styles
│   ├── api/                  # API service layer
│   │   ├── types.ts          # TS interfaces for API responses
│   │   ├── index.ts          # Service exports
│   │   └── *.ts              # Per-resource API clients (projects, claims, etc.)
│   ├── services/
│   │   └── api.ts            # Axios instance with interceptors
│   ├── auth/
│   │   ├── AuthContext.tsx   # User/token state
│   │   └── tokenStorage.ts   # localStorage token management
│   ├── hooks/                # Custom React hooks (useProjects, useClaims, etc.)
│   ├── pages/                # Page components (routing)
│   ├── components/           # Reusable UI components
│   │   └── ui/               # Base UI (Button, Card, Spinner, etc.)
│   ├── context/              # Context providers (ProjectContext)
│   ├── layouts/              # Layout wrappers (MainLayout)
│   ├── lib/                  # Utilities (queryClient config, utils)
│   ├── routes/               # Route definitions (AppRoutes, ProtectedRoute)
│   ├── theme/                # Theme provider
│   └── types/                # TypeScript types
├── dist/                     # Production build output
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
└── package.json              # Dependencies & scripts
```

## Core Features

- **Authentication**: Token-based (localStorage). 401 responses trigger auto-redirect to login.
- **Project Management**: Create/select projects; switch context via sidebar dropdown.
- **Data Extraction**: Upload sources (text/PDF/DOCX); extract claims and concepts.
- **Conflict Detection**: Identify conflicting claims automatically.
- **Graph Visualization**: Interactive Reactflow graph showing relationships (dagre auto-layout).
- **Search**: Full-text search across knowledge graph.
- **Dashboard**: Summary statistics and recent activity.
- **Responsive UI**: Mobile-friendly with Tailwind CSS.

## API Integration

The frontend communicates with the Project Minore backend REST API:

**Base URL**: `VITE_API_URL` (default: `http://localhost:8000/api/v1`)

**Key Endpoints**:
- `GET /projects` — List all projects
- `POST /projects` — Create project
- `GET /projects/{projectId}/sources` — List sources
- `POST /projects/{projectId}/sources` — Upload source
- `GET /projects/{projectId}/claims` — List claims
- `POST /projects/{projectId}/claims/{claimId}/extract-concepts` — Extract concepts
- `GET /projects/{projectId}/claims/{claimId}/graph` — Get relationship graph

All requests include `Authorization: Bearer <token>` header (if token exists).

401 responses clear the token and redirect to login.

## Authentication Flow

1. User enters credentials on `/login` page.
2. (Currently placeholder: accepts any non-empty email/password).
3. Token is stored in `localStorage` under key `minore_access_token`.
4. Axios interceptor attaches token to all requests as `Authorization: Bearer <token>`.
5. On 401, token is cleared and user redirected to `/login`.

**Future**: Connect login to real auth backend endpoint.

## Deployment

### Docker

A `Dockerfile` is included for containerized deployment:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t project-minore-frontend:latest .
docker run -p 80:5173 -e VITE_API_URL=http://backend:8000/api/v1 project-minore-frontend:latest
```

### Static Hosting (Netlify, Vercel, AWS S3, etc.)

1. Run `npm run build` to generate `dist/`.
2. Deploy the `dist/` folder to your static host.
3. Configure the host to serve `index.html` for all routes (SPA routing).
4. Set environment variable `VITE_API_URL` pointing to your backend.

Example (Netlify):
- Build command: `npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL=https://api.minore.example.com/api/v1`

### Production Environment Variables

For production, ensure:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

(No trailing slash; the API client appends paths.)

## Build Artifacts

- `dist/index.html` — SPA entry point
- `dist/assets/*.js` — Bundled JavaScript (code-split chunks)
- `dist/assets/*.css` — Bundled CSS
- Total gzipped: ~140 KB (main bundle)

## Performance

- **Main bundle**: ~424 KB (139 KB gzipped)
- **GraphExplorer module**: ~200 KB (66 KB gzipped) — lazy-loaded per route
- **CSS**: ~21 KB (4.5 KB gzipped)
- **Lighthouse**: Target A+ performance (lazy loading, code splitting, Tailwind purging)

## Troubleshooting

**Issue**: Build fails with TypeScript errors.
- Run `npm run lint` to see all type errors.
- Check that all dependencies are installed: `npm ci`

**Issue**: 401 Unauthorized on API calls.
- Verify backend is running and accessible at `VITE_API_URL`.
- Check login flow — token must be in `localStorage['minore_access_token']`.
- Open browser DevTools → Network tab to inspect request headers.

**Issue**: Blank page after deployment.
- Ensure `dist/index.html` is served for all routes (SPA routing).
- Check browser console for errors.
- Verify `VITE_API_URL` environment variable is set correctly.

**Issue**: CORS errors.
- Confirm backend has CORS enabled for your frontend origin.
- Check backend `CORS_ORIGINS` config.

## Contributing

- Preserve existing architecture (React Router shell, TanStack Query, Tailwind).
- All new pages must use `useParams()` to extract `projectId` from URL.
- All API calls must go through the service layer (`src/api/*.ts`).
- Use existing UI components (`src/components/ui/`).
- Maintain TypeScript strict mode.

## License

See root `LICENSE` file.
