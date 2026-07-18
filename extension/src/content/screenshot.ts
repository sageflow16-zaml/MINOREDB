import { MAX_SCREENSHOT_WIDTH } from '../shared/constants';
import type { CapturedScreenshot } from '../shared/types';

export async function captureViewport(): Promise<CapturedScreenshot> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: 'CAPTURE_SCREENSHOT' },
      (response: { success: boolean; data?: CapturedScreenshot; error?: string }) => {
        if (response?.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Screenshot capture failed'));
        }
      }
    );
  });
}

export async function captureElement(
  selector: string
): Promise<CapturedScreenshot | null> {
  const el = document.querySelector(selector);
  if (!el) return null;

  try {
    const rect = el.getBoundingClientRect();
    const scale = Math.min(1, MAX_SCREENSHOT_WIDTH / rect.width);

    const canvas = document.createElement('canvas');
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const html = el.outerHTML;
    const dataUrl = await renderFallbackScreenshot(el as HTMLElement, canvas, ctx);

    return {
      dataUrl: dataUrl || canvas.toDataURL('image/jpeg', 0.8),
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function renderFallbackScreenshot(
  el: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<string | null> {
  const rect = el.getBoundingClientRect();
  const computed = window.getComputedStyle(el);

  ctx.fillStyle = computed.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#e1e4e8';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`FXReplay Element`, 16, 36);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`${el.tagName.toLowerCase()}.${el.className.split(' ').slice(0, 2).join('.')}`, 16, 60);

  const text = el.textContent?.substring(0, 200).replace(/\s+/g, ' ').trim();
  if (text) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    const wrapText = text.length > 80 ? text.substring(0, 80) + '...' : text;
    ctx.fillText(wrapText, 16, 84);
  }

  ctx.fillStyle = '#374151';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`Size: ${Math.round(rect.width)}x${Math.round(rect.height)}px`, 16, canvas.height - 16);

  return null;
}
