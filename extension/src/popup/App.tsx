import { useState, useEffect, useCallback } from 'react';
import type { QueuedTrade, ExtensionSettings, AuthState } from '../shared/types';

interface ExtensionStatus {
  authenticated: boolean;
  projectConfigured: boolean;
  backendUrl: string;
  debugMode: boolean;
}

function sendMessage(action: string, payload?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, payload }, resolve);
  });
}

type Tab = 'queue' | 'status' | 'login';

export default function PopupApp() {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);
  const [queue, setQueue] = useState<QueuedTrade[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [statusRes, queueRes] = await Promise.all([
      sendMessage('GET_STATUS'),
      sendMessage('GET_QUEUE'),
    ]);
    if (statusRes.success) setStatus(statusRes.data as ExtensionStatus);
    if (queueRes.success) setQueue(queueRes.data as QueuedTrade[]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const result = await sendMessage('AUTH_LOGIN', { email, password });
    setLoginLoading(false);
    if (result.success) {
      setEmail('');
      setPassword('');
      await refresh();
      setActiveTab('status');
    } else {
      setLoginError(result.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await sendMessage('AUTH_LOGOUT');
    await refresh();
  };

  const handleRetry = async () => {
    await sendMessage('RETRY_QUEUE');
    await refresh();
  };

  const handleClearQueue = async () => {
    await sendMessage('CLEAR_QUEUE');
    await refresh();
  };

  return (
    <div style={{ padding: '16px', color: '#e1e4e8', background: '#0f1117', minHeight: '500px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Project Minore
        </h1>
        <span style={{ fontSize: '12px', color: status?.authenticated ? '#22c55e' : '#ef4444', background: status?.authenticated ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
          {status?.authenticated ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #1f2937' }}>
        {(['status', 'queue', 'login'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab ? '#1f2937' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#6366f1' : '#6b7280',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            {tab === 'status' ? 'Status' : tab === 'queue' ? `Queue (${queue.length})` : 'Account'}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <div>
          <div style={{ background: '#1a1d27', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', margin: '0 0 8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extension Status</h3>
            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <div>Auth: <span style={{ color: status?.authenticated ? '#22c55e' : '#ef4444' }}>{status?.authenticated ? 'Authenticated' : 'Not authenticated'}</span></div>
              <div>Project: <span style={{ color: status?.projectConfigured ? '#22c55e' : '#f59e0b' }}>{status?.projectConfigured ? 'Configured' : 'Not configured'}</span></div>
              <div>Queue: <span style={{ color: '#6366f1' }}>{queue.length} pending</span></div>
            </div>
          </div>

          {!status?.authenticated && (
            <div style={{ background: '#1a1d27', borderRadius: '8px', padding: '12px', marginBottom: '12px', borderLeft: '3px solid #f59e0b' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#f59e0b' }}>
                Please log in and configure your project in the Account tab.
              </p>
            </div>
          )}

          <div style={{ background: '#1a1d27', borderRadius: '8px', padding: '12px' }}>
            <h3 style={{ fontSize: '13px', margin: '0 0 8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions</h3>
            <button onClick={handleRetry} style={{ width: '100%', padding: '8px', background: '#6366f1', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px', marginBottom: '8px' }}>
              Retry Failed Uploads
            </button>
            <button onClick={() => chrome.runtime.openOptionsPage()} style={{ width: '100%', padding: '8px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
              Open Settings
            </button>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280', fontSize: '14px' }}>
              <p style={{ margin: 0 }}>No trades in queue</p>
              <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Completed trades from FXReplay will appear here</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{queue.length} items</span>
                <button onClick={handleClearQueue} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear All
                </button>
              </div>
              {queue.map((item) => (
                <div key={item.id} style={{ background: '#1a1d27', borderRadius: '6px', padding: '10px', marginBottom: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{item.trade.pair}</strong>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: item.status === 'pending' ? 'rgba(99,102,241,0.2)' : item.status === 'uploading' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                      color: item.status === 'pending' ? '#6366f1' : item.status === 'uploading' ? '#f59e0b' : '#ef4444',
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ color: '#9ca3af' }}>{item.trade.direction} | P&L: {item.trade.pnl ?? '?'}</div>
                  {item.error && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{item.error}</div>}
                  <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>Retries: {item.retryCount}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {activeTab === 'login' && (
        <div>
          {status?.authenticated ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✓</div>
              <p style={{ color: '#22c55e', fontWeight: 600, margin: '0 0 16px' }}>Authenticated</p>
              <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Log Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', background: '#1a1d27', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', background: '#1a1d27', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              {loginError && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px' }}>
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                style={{ width: '100%', padding: '10px', background: loginLoading ? '#4b5563' : '#6366f1', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: loginLoading ? 'default' : 'pointer', fontSize: '13px' }}
              >
                {loginLoading ? 'Logging in...' : 'Log In'}
              </button>
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
                Configure your backend URL in Settings
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
