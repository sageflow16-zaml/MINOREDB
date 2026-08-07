import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { initSentry } from './lib/sentry';
import { SentryErrorBoundary } from './components/SentryErrorBoundary';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProjectProvider } from './context/ProjectContext';
import { App } from './App';
import './index.css';

void initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <SentryErrorBoundary>
                <App />
              </SentryErrorBoundary>
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-card !text-card-foreground !border-border',
          style: {
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>
);
