import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily retrieves or initializes the Supabase client.
 * Supports environment variables or localStorage overrides.
 */
export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = (import.meta as any).env.VITE_SUPABASE_URL || 
              (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || 
              localStorage.getItem("PSD_SUPABASE_URL");
  const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 
                  (import.meta as any).env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                  localStorage.getItem("PSD_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey);
    return supabaseInstance;
  } catch (err) {
    console.error("Gagal menginisialisasi Supabase client:", err);
    return null;
  }
}

/**
 * Checks if Supabase credentials are provided
 */
export function isSupabaseConfigured(): boolean {
  const url = (import.meta as any).env.VITE_SUPABASE_URL || 
              (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || 
              localStorage.getItem("PSD_SUPABASE_URL");
  const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 
                  (import.meta as any).env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                  localStorage.getItem("PSD_SUPABASE_ANON_KEY");
  return !!(url && anonKey);
}

/**
 * Retrieves the currently active Supabase URL configuration
 */
export function getSupabaseUrl(): string {
  return (import.meta as any).env.VITE_SUPABASE_URL || 
         (import.meta as any).env.NEXT_PUBLIC_SUPABASE_URL || 
         localStorage.getItem("PSD_SUPABASE_URL") || "";
}

/**
 * Retrieves the currently active Supabase Anon Key configuration
 */
export function getSupabaseAnonKey(): string {
  return (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 
         (import.meta as any).env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
         localStorage.getItem("PSD_SUPABASE_ANON_KEY") || "";
}

/**
 * Saves connection credentials manually to localStorage
 */
export function saveLocalSupabaseCredentials(url: string, anonKey: string) {
  if (url) localStorage.setItem("PSD_SUPABASE_URL", url.trim());
  else localStorage.removeItem("PSD_SUPABASE_URL");
  
  if (anonKey) localStorage.setItem("PSD_SUPABASE_ANON_KEY", anonKey.trim());
  else localStorage.removeItem("PSD_SUPABASE_ANON_KEY");
  
  supabaseInstance = null; // reset to force re-instantiation
}

/**
 * Clears connection credentials from localStorage
 */
export function clearLocalSupabaseCredentials() {
  localStorage.removeItem("PSD_SUPABASE_URL");
  localStorage.removeItem("PSD_SUPABASE_ANON_KEY");
  supabaseInstance = null;
}

/**
 * Saves all school academic state into Supabase academic_data table
 */
export async function syncAcademicDataToSupabase(userId: string, payload: any): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase tidak terkonfigurasi.");
  }

  const { error } = await supabase
    .from('academic_data')
    .upsert({
      user_id: userId,
      updated_at: new Date().toISOString(),
      payload: payload
    }, { onConflict: 'user_id' });

  if (error) {
    console.error("Gagal sinkronisasi data sekolahan ke Supabase:", error);
    throw new Error(error.message);
  }
}

/**
 * Loads school academic state from Supabase academic_data table
 */
export async function fetchAcademicDataFromSupabase(userId: string): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase tidak terkonfigurasi. Sila hubungkan akun Supabase terlebih dahulu.");
  }

  const { data, error } = await supabase
    .from('academic_data')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle(); // maybeSingle returns null instead of PGRST116 error if not found

  if (error) {
    console.error("Gagal mengunduh data sekolah dari Supabase:", error);
    throw new Error(error.message);
  }

  return data?.payload || null;
}

/**
 * Saves the user's Spreadsheet ID config to user_configs table in Supabase
 */
export async function syncUserSpreadsheetIdToSupabase(userId: string, email: string, sheetId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase
    .from('user_configs')
    .upsert({
      user_id: userId,
      email: email,
      spreadsheet_id: sheetId,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error("Gagal menyinkronkan Spreadsheet ID ke Supabase:", error);
  }
}

/**
 * Fetches the user's Spreadsheet ID config from user_configs table in Supabase
 */
export async function fetchUserSpreadsheetIdFromSupabase(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_configs')
    .select('spreadsheet_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return null;
  }
  return data?.spreadsheet_id || null;
}
