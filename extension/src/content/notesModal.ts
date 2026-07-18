import type { TradeNotes } from '../shared/types';

const MODAL_STYLES = `
  .minore-overlay {
    position: fixed; inset: 0; z-index: 100000;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    animation: minore-fade-in 0.15s ease-out;
  }
  .minore-modal {
    background: #1a1d27; border-radius: 12px;
    width: 400px; max-width: 92vw; max-height: 90vh; overflow-y: auto;
    padding: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    border: 1px solid #2a2d3a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e1e4e8;
  }
  .minore-modal h2 {
    font-size: 16px; font-weight: 600; margin: 0 0 4px; color: #e1e4e8;
  }
  .minore-modal p.sub {
    font-size: 12px; color: #6b7280; margin: 0 0 20px;
  }
  .minore-modal label {
    display: block; font-size: 12px; font-weight: 500; color: #9ca3af;
    margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px;
  }
  .minore-modal input, .minore-modal select, .minore-modal textarea {
    width: 100%; padding: 8px 10px; margin-bottom: 14px;
    background: #0f1117; border: 1px solid #2a2d3a; border-radius: 6px;
    color: #e1e4e8; font-size: 13px; box-sizing: border-box;
    font-family: inherit;
  }
  .minore-modal input:focus, .minore-modal select:focus, .minore-modal textarea:focus {
    outline: none; border-color: #6366f1;
  }
  .minore-modal textarea { resize: vertical; min-height: 60px; }
  .minore-modal .row { display: flex; gap: 12px; }
  .minore-modal .row > * { flex: 1; }
  .minore-modal .actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  .minore-modal .actions button {
    padding: 8px 20px; border: none; border-radius: 6px;
    font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: opacity 0.15s;
  }
  .minore-modal .actions button:hover { opacity: 0.85; }
  .minore-modal .btn-cancel { background: #2a2d3a; color: #9ca3af; }
  .minore-modal .btn-save { background: #6366f1; color: #fff; }
  .minore-modal .btn-save:disabled { opacity: 0.4; cursor: default; }
  @keyframes minore-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const STRATEGIES = [
  '', 'ICT', 'SMC', 'Supply & Demand', 'Order Flow', 'Price Action',
  'Trend Following', 'Breakout', 'Reversal', 'Scalping', 'Swing', 'Other',
];

const EMOTIONS = [
  '', 'Calm', 'Confident', 'Anxious', 'Greedy', 'Fearful',
  'Frustrated', 'Neutral', 'Excited', 'Regretful',
];

export function showNotesModal(
  tradeSummary: string
): Promise<TradeNotes | null> {
  return new Promise((resolve) => {
    const styleEl = document.createElement('style');
    styleEl.textContent = MODAL_STYLES;
    document.head.appendChild(styleEl);

    const overlay = document.createElement('div');
    overlay.className = 'minore-overlay';
    overlay.innerHTML = `
      <div class="minore-modal">
        <h2>Save Trade to Minore</h2>
        <p class="sub">${tradeSummary}</p>

        <div class="row">
          <div>
            <label>Strategy</label>
            <select id="minore-strategy">${STRATEGIES.map((s) => `<option value="${s}">${s || '—'}</option>`).join('')}</select>
          </div>
          <div>
            <label>Emotion</label>
            <select id="minore-emotion">${EMOTIONS.map((e) => `<option value="${e}">${e || '—'}</option>`).join('')}</select>
          </div>
        </div>

        <div class="row">
          <div>
            <label>Confidence (0-10)</label>
            <input id="minore-confidence" type="number" min="0" max="10" step="1" value="5" />
          </div>
          <div>
            <label>Mistake</label>
            <input id="minore-mistake" type="text" placeholder="e.g. FOMO entry" />
          </div>
        </div>

        <label>Notes</label>
        <textarea id="minore-notes" placeholder="Optional notes about this trade..."></textarea>

        <div class="actions">
          <button class="btn-cancel" id="minore-cancel">Cancel</button>
          <button class="btn-save" id="minore-save">Save Trade</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cancel = () => {
      overlay.remove();
      styleEl.remove();
      resolve(null);
    };

    const save = () => {
      const strategy = (document.getElementById('minore-strategy') as HTMLSelectElement).value || undefined;
      const emotion = (document.getElementById('minore-emotion') as HTMLSelectElement).value || undefined;
      const confRaw = (document.getElementById('minore-confidence') as HTMLInputElement).value;
      const confidence = confRaw ? Math.min(10, Math.max(0, parseInt(confRaw, 10) || 5)) : undefined;
      const mistake = (document.getElementById('minore-mistake') as HTMLInputElement).value || undefined;
      const notes = (document.getElementById('minore-notes') as HTMLTextAreaElement).value || undefined;

      overlay.remove();
      styleEl.remove();
      resolve({ strategy, emotion, confidence, mistake, notes });
    };

    document.getElementById('minore-cancel')!.addEventListener('click', cancel);
    document.getElementById('minore-save')!.addEventListener('click', save);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cancel();
    });

    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { cancel(); document.removeEventListener('keydown', esc); }
    });
  });
}
