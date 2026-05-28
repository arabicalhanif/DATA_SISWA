export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  db: string;
}

/**
 * Checks if MySQL configuration exists in localStorage
 */
export function isMySQLConfigured(): boolean {
  const host = localStorage.getItem("PSD_MYSQL_HOST");
  const user = localStorage.getItem("PSD_MYSQL_USER");
  const pass = localStorage.getItem("PSD_MYSQL_PASS");
  const db = localStorage.getItem("PSD_MYSQL_DB");
  return !!(host && user && pass && db);
}

/**
 * Retrieves the current MySQL configuration from localStorage
 */
export function getMySQLConfig(): MySQLConfig {
  return {
    host: localStorage.getItem("PSD_MYSQL_HOST") || "srv1762.hstgr.io",
    port: Number(localStorage.getItem("PSD_MYSQL_PORT")) || 3306,
    user: localStorage.getItem("PSD_MYSQL_USER") || "u826075477_datasdit",
    pass: localStorage.getItem("PSD_MYSQL_PASS") || "",
    db: localStorage.getItem("PSD_MYSQL_DB") || "u826075477_dataku"
  };
}

/**
 * Writes connection credentials to localStorage
 */
export function saveLocalMySQLCredentials(config: MySQLConfig) {
  localStorage.setItem("PSD_MYSQL_HOST", config.host.trim());
  localStorage.setItem("PSD_MYSQL_PORT", String(config.port || 3306));
  localStorage.setItem("PSD_MYSQL_USER", config.user.trim());
  localStorage.setItem("PSD_MYSQL_PASS", config.pass);
  localStorage.setItem("PSD_MYSQL_DB", config.db.trim());
}

/**
 * Clears connection credentials from localStorage
 */
export function clearLocalMySQLCredentials() {
  localStorage.removeItem("PSD_MYSQL_HOST");
  localStorage.removeItem("PSD_MYSQL_PORT");
  localStorage.removeItem("PSD_MYSQL_USER");
  localStorage.removeItem("PSD_MYSQL_PASS");
  localStorage.removeItem("PSD_MYSQL_DB");
}

/**
 * Connect and test connection via Express server backend
 */
export async function testMySQLConnection(config: MySQLConfig): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch("/api/mysql/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("Gagal melakukan pengetesan koneksi MySQL:", error);
    return {
      success: false,
      message: error.message || "Gagal menghubungi server proxy Node.js"
    };
  }
}

/**
 * Sync all school academic state into Hostinger MySQL server
 */
export async function syncAcademicDataToMySQL(userId: string, payload: any): Promise<void> {
  if (!isMySQLConfigured()) {
    throw new Error("Kredensial database MySQL Hostinger belum lengkap.");
  }
  
  const config = getMySQLConfig();
  
  const response = await fetch("/api/mysql/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config,
      userId,
      payload
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Sinkronisasi gagal dengan kode ${response.status}`);
  }
}

/**
 * Load school academic state from Hostinger MySQL server database
 */
export async function fetchAcademicDataFromMySQL(userId: string): Promise<any | null> {
  if (!isMySQLConfigured()) {
    throw new Error("Kredensial database MySQL Hostinger belum lengkap.");
  }
  
  const config = getMySQLConfig();
  
  const response = await fetch("/api/mysql/fetch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      config,
      userId
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal mengambil data dengan kode ${response.status}`);
  }
  
  const result = await response.json();
  return result.payload || null;
}
