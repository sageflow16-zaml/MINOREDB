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
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            background: 'var(--toast-bg, #1e293b)',
            color: '#fff',
            border: '1px solid #334155',
          },
        }}
      />
    </ThemeProvider>
  </React.StrictMode>
);
