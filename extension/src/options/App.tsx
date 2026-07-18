import { useState, useEffect, useCallback } from 'react';
import type { ExtensionSettings, LogEntry } from '../shared/types';

function sendMessage(action: string, payload?: Record<string, unknown>): Promise<{ success: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, payload }, resolve);
  });
}

export default function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    backendUrl: 'http://localhost:8000',
    projectId: '',
    autoCapture: true,
    autoSave: false,
    saveOnExit: true,
    enableNotifications: true,
    retryIntervalMinutes: 5,
    maxRetries: 5,
    debugMode: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    sendMessage('GET_SETTINGS').then((res) => {
      if (res.success) setSettings(res.data as ExtensionSettings);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await sendMessage('UPDATE_SETTINGS', settings as unknown as Record<string, unknown>);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestResult('Testing...');
    try {
      const response = await fetch(`${settings.backendUrl}/api/v1/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        setTestResult('Connection successful');
      } else {
        setTestResult(`Server responded with ${response.status}`);
      }
    } catch (err) {
      setTestResult(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const loadLogs = useCallback(async () => {
    try {
      const { logs: stored } = await chrome.storage.local.get('minore_logs');
      if (stored) setLogs((stored as LogEntry[]).slice(-50).reverse());
    } catch { /* ignore */ }
  }, []);

  const clearLogs = async () => {
    await chrome.storage.local.set({ minore_logs: [] });
    setLogs([]);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px', color: '#e1e4e8' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Project Minore — Settings
      </h1>

      <section style={{ background: '#1a1d27', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#e1e4e8' }}>Connection</h2>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Backend URL</label>
          <input
            type="url"
            value={settings.backendUrl}
            onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
            style={{ width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Project ID</label>
          <input
            type="text"
            value={settings.projectId}
            onChange={(e) => setSettings({ ...settings, projectId: e.target.value })}
            placeholder="UUID of your Minore project"
            style={{ width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleTestConnection} style={{ padding: '8px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', cursor: 'pointer', fontSize: '13px' }}>
            Test Connection
          </button>
        </div>
        {testResult && (
          <div style={{ marginTop: '8px', fontSize: '13px', color: testResult.includes('successful') ? '#22c55e' : testResult.includes('Testing') ? '#f59e0b' : '#ef4444' }}>
            {testResult}
          </div>
        )}
      </section>

      <section style={{ background: '#1a1d27', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#e1e4e8' }}>Trade Detection</h2>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.autoCapture} onChange={(e) => setSettings({ ...settings, autoCapture: e.target.checked })} />
          <span style={{ fontSize: '14px' }}>Auto-capture screenshots on trade detection</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.autoSave} onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })} />
          <span style={{ fontSize: '14px' }}>Auto-save detected trades (bypasses queue confirmation)</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.saveOnExit} onChange={(e) => setSettings({ ...settings, saveOnExit: e.target.checked })} />
          <span style={{ fontSize: '14px' }}>Save on trade exit (capture all data when trade closes)</span>
        </label>
      </section>

      <section style={{ background: '#1a1d27', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#e1e4e8' }}>Upload & Retry</h2>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Retry Interval (minutes)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={settings.retryIntervalMinutes}
            onChange={(e) => setSettings({ ...settings, retryIntervalMinutes: parseInt(e.target.value) || 5 })}
            style={{ width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Max Retries</label>
          <input
            type="number"
            min={0}
            max={20}
            value={settings.maxRetries}
            onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) || 5 })}
            style={{ width: '100%', padding: '8px 12px', background: '#0f1117', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.enableNotifications} onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })} />
          <span style={{ fontSize: '14px' }}>Enable notifications on upload completion</span>
        </label>
      </section>

      <section style={{ background: '#1a1d27', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: '#e1e4e8' }}>Developer</h2>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.debugMode} onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })} />
          <span style={{ fontSize: '14px' }}>Debug mode (verbose logging)</span>
        </label>

        <button
          onClick={() => { setShowLogs(!showLogs); if (!showLogs) loadLogs(); }}
          style={{ padding: '8px 16px', background: '#1f2937', border: '1px solid #374151', borderRadius: '6px', color: '#e1e4e8', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}
        >
          {showLogs ? 'Hide Logs' : 'Show Logs'}
        </button>

        {showLogs && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>{logs.length} entries</span>
              <button onClick={clearLogs} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            </div>
            <div style={{ maxHeight: '300px', overflow: 'auto', background: '#0f1117', borderRadius: '4px', padding: '8px', fontSize: '11px', fontFamily: 'monospace' }}>
              {logs.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '16px' }}>No logs</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '4px', color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : log.level === 'info' ? '#6366f1' : '#6b7280' }}>
                    <span style={{ color: '#6b7280' }}>[{new Date(log.timestamp).toLocaleString()}]</span> [{log.level.toUpperCase()}] {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '12px',
          background: saved ? '#22c55e' : '#6366f1',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 600,
          cursor: saving ? 'default' : 'pointer',
          fontSize: '15px',
          transition: 'background 0.2s',
        }}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
