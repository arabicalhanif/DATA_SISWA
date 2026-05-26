export interface WALog {
  id: string;
  timestamp: string;
  senderName: string;
  senderCode: string;
  recipientType: "INDIVIDUAL" | "BULK" | "GROUP" | "ANNOUNCEMENT_SHARE";
  recipientName: string; // e.g. name of wali/student, name of WhatsApp group, or bulk target
  message: string;
}

export function logWhatsAppSent(
  senderName: string,
  senderCode: string,
  recipientType: "INDIVIDUAL" | "BULK" | "GROUP" | "ANNOUNCEMENT_SHARE",
  recipientName: string,
  message: string
) {
  try {
    const saved = localStorage.getItem("siswadigital_wa_sent_logs") || "[]";
    let logs: WALog[] = [];
    try {
      logs = JSON.parse(saved);
      if (!Array.isArray(logs)) logs = [];
    } catch {
      logs = [];
    }
    
    const newLog: WALog = {
      id: "LOG-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      senderName: senderName || "Pendidik Al Hanif",
      senderCode: senderCode || "GURU",
      recipientType,
      recipientName,
      message
    };
    
    logs.unshift(newLog);
    
    // Keep a maximum of 500 audit logs to prevent localStorage size overflow
    if (logs.length > 500) {
      logs = logs.slice(0, 500);
    }
    
    localStorage.setItem("siswadigital_wa_sent_logs", JSON.stringify(logs));
    window.dispatchEvent(new Event("siswadigital_wa_logs_updated"));
  } catch (err) {
    console.error("Error logging WhatsApp audit trail:", err);
  }
}
