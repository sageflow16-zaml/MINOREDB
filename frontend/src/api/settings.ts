import { supabase } from '../lib/supabase';

export interface UserSettings {
  profile?: { name?: string; email?: string; trading_style?: string; experience?: string };
  workspace?: { default_dashboard?: string; default_date_range?: string; currency?: string; timezone?: string; session_duration?: string };
  notifications?: { email_notifications?: boolean; push_notifications?: boolean; risk_alerts?: boolean; daily_digest?: boolean };
  appearance?: { theme?: string; font_size?: string; density?: string; animations?: string };
}

export const DEFAULT_SETTINGS: UserSettings = {
  profile: { name: '', trading_style: 'Swing Trader', experience: 'Intermediate' },
  workspace: { default_dashboard: 'Dashboard', default_date_range: '1 Month', currency: 'USD ($)', timezone: 'UTC' },
  notifications: { email_notifications: false, push_notifications: true, risk_alerts: true, daily_digest: false },
  appearance: { theme: 'dark', font_size: 'Medium', density: 'Comfortable', animations: 'Enabled' },
};

export const settingsService = {
  get: async (userId: string): Promise<UserSettings> => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    const raw = (data?.settings ?? {}) as Partial<UserSettings>;
    return {
      profile: { ...DEFAULT_SETTINGS.profile, ...(raw.profile ?? {}) },
      workspace: { ...DEFAULT_SETTINGS.workspace, ...(raw.workspace ?? {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(raw.notifications ?? {}) },
      appearance: { ...DEFAULT_SETTINGS.appearance, ...(raw.appearance ?? {}) },
    };
  },

  save: async (userId: string, partial: Partial<UserSettings>): Promise<void> => {
    const current = await settingsService.get(userId);
    const next: UserSettings = {
      profile: { ...current.profile, ...(partial.profile ?? {}) },
      workspace: { ...current.workspace, ...(partial.workspace ?? {}) },
      notifications: { ...current.notifications, ...(partial.notifications ?? {}) },
      appearance: { ...current.appearance, ...(partial.appearance ?? {}) },
    };
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, settings: next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
  },
};
