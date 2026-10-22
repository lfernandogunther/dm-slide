// The player's own settings, in chrome.storage.local. Never message content.

export interface Settings {
  nextAfterReact: boolean;
  quoteReply: boolean;
  onlyNotReacted: boolean;
}

const DEFAULTS: Settings = { nextAfterReact: true, quoteReply: true, onlyNotReacted: false };

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
