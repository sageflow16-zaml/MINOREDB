import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProjectProvider } from './context/ProjectContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <App />
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
