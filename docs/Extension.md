# Chrome Extension

## Architecture

The extension uses Manifest V3 with four main components:

### Content Script (`src/content/`)
- Injects into `https://*.fxreplay.com/*` at `document_idle`
- Uses `MutationObserver` to detect DOM changes (trade lists loading)
- Extracts trade data via configurable CSS selectors (`src/shared/constants.ts`)
- Shows a floating "Save to Minore" button when completed trades are detected
- On click, opens a **Quick Notes modal** (strategy, emotion, confidence, mistake, free notes)
- Captures viewport screenshot via `chrome.tabs.captureVisibleTab`
- Sends complete payload (trade data + notes + screenshots) to background

### Background Service Worker (`src/background/`)
- Message router for all extension actions (13 actions)
- JWT authentication with login, logout, and token refresh
- API client with retry logic (exponential backoff, 401 refresh)
- Offline queue with periodic retry alarm (every 1 minute)
- Max 5 retries per trade, 200 max queue size

### Popup UI (`src/popup/`)
- 3-tab React app: Status, Queue, Account/Login
- Shows connection status, pending queue count, retry buttons

### Options Page (`src/options/`)
- Settings form: backend URL, project ID, auto-capture, auto-save, retry config
- Connection tester, log viewer, debug mode toggle

## Data Flow

```
FXReplay Page
    │ MutationObserver detects completed trade
    ▼
Content Script extracts trade data
    │ Shows floating "Save to Minore" button
    ▼
User clicks → Quick Notes modal → Confirm
    │ Captures viewport screenshot
    ▼
chrome.runtime.sendMessage({ action: 'SAVE_TRADE', payload })
    ▼
Background SW → Queue → API Client → POST /api/v1/projects/{id}/trades
    │ On failure → retry with alarm
    ▼
Trade saved in Minore database
```

## API Mapping

Extension fields are mapped to the backend API snake_case format:

| Extension (camelCase) | Backend (snake_case) |
|----------------------|---------------------|
| `entryPrice` | `entry_price` |
| `exitPrice` | `exit_price` |
| `stopLoss` | `stop_loss` |
| `takeProfit` | `take_profit` |
| `positionSize` | `position_size` |
| `pnl` | `pnl` |
| `rr` | `rr` |
| `emotion` | `emotion` |
| `notes` | `notes` (strategy, mistake, confidence embedded) |
| screenshots | `before_image` / `after_image` (Base64) |

## Build

```bash
cd extension
npm install
npm run build
# Output: dist/ (popup.html, options.html, background/index.js, content/index.js, manifest.json)
```
