export async function hashImport(t: Record<string, unknown>): Promise<string> {
  const payload = [t.external_id, t.symbol, t.open_time, t.close_time, t.profit, t.volume].map((v) => String(v ?? '')).join('|');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
