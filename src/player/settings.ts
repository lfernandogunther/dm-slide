// The player's own settings, in chrome.storage.local. Never message content.

export interface Settings {
  nextAfterReact: boolean;
  afterReactDir: 'newer' | 'older'; // where reacting moves, and so where the player opens
  quoteReply: boolean;
  onlyNotReacted: boolean;
  volume: number; // 0–1, the level sound comes back at
  seenKeys: boolean; // the key card was shown once
  openInInstagram: boolean; // an item that can't play here opens in Instagram's view by itself
  barSpot: { x: number; y: number } | null; // the bar's centre and top over Instagram's view, in px; null is top centre
}

const DEFAULTS: Settings = { nextAfterReact: true, afterReactDir: 'newer', quoteReply: true, onlyNotReacted: false, volume: 1, seenKeys: false, openInInstagram: true, barSpot: null };

// Absent when the script runs outside the extension (injected by hand for a check).
const storage = () => (typeof chrome === 'undefined' ? undefined : chrome.storage?.local);

export async function loadSettings(): Promise<Settings> {
  try {
    return { ...DEFAULTS, ...((await storage()?.get(DEFAULTS)) as Partial<Settings> | undefined) };
  } catch {
    return DEFAULTS;
  }
}

export function saveSettings(changes: Partial<Settings>): void {
  void storage()?.set(changes).catch(() => undefined);
}
