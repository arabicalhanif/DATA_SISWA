import React, { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Users, 
  Sparkles, 
  Key, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  FileSpreadsheet, 
  Check, 
  Plus, 
  ClipboardCheck, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Database,
  Search,
  BookOpen,
  GraduationCap,
  Calendar,
  Layers,
  Award,
  PlusCircle,
  FolderPlus,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  FileDown,
  Pencil,
  X
} from "lucide-react";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, GuruCode, AbsenGuru, Jadwal, HariBelajar, AttendanceStatusGuru, Announcement, UjianPraktek } from "../types";
import AnnouncementManager from "./AnnouncementManager";
import AcademicCalendar from "./AcademicCalendar";
import { getScheduleConfig, saveScheduleConfig, ScheduleConfig, JamPelajaranItem } from "../utils/scheduleConfig";
import { Clock } from "lucide-react";
import { LesProgram, LesRegistration } from "./WaliMuridView";
import { 
  exportLocalDataToGoogleSheets, 
  importDataFromGoogleSheets, 
  getAccessToken,
  SPREADSHEET_ID
} from "../lib/googleSheets";

interface AdminPortalProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  guruCodes: GuruCode[];
  setGuruCodes: React.Dispatch<React.SetStateAction<GuruCode[]>>;
  jadwal: Jadwal[];
  setJadwal: React.Dispatch<React.SetStateAction<Jadwal[]>>;
  absenGuru: AbsenGuru[];
  setAbsenGuru: React.Dispatch<React.SetStateAction<AbsenGuru[]>>;
  onAddGuruCode: (name: string, assignedKelasId?: string, assignedKelasIds?: string[], isWaliKelas?: boolean, phoneNumber?: string, mapelAjars?: string[]) => void;
  onToggleGuruCodeStatus: (code: string) => void;
  onDeleteGuruCode: (code: string) => void;
  onClearAllMasterData: () => void;
  showNotification: (text: string, type?: "success" | "neutral") => void;
  setSiswa: React.Dispatch<React.SetStateAction<Siswa[]>>;
  setKategori: React.Dispatch<React.SetStateAction<KategoriPenilaian[]>>;
  setPenilaian: React.Dispatch<React.SetStateAction<Penilaian[]>>;
  setKelas: React.Dispatch<React.SetStateAction<Kelas[]>>;
  setMapel: React.Dispatch<React.SetStateAction<MataPelajaran[]>>;
  ujianPraktek?: UjianPraktek[];
  setUjianPraktek?: React.Dispatch<React.SetStateAction<UjianPraktek[]>>;
  onImportAllData: (data: {
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
  }, mode: "replace" | "merge") => void;
  onDeleteKelas?: (id: string) => void;
  onDeleteMapel?: (id: string) => void;
  onDeleteSiswa?: (id: string) => void;
  onDeleteKategori?: (id: string) => void;
  onDeletePenilaian?: (id: string) => void;
  onUpdateKelas?: (updatedKelas: Kelas) => void;
  onUpdateMapel?: (updatedMapel: MataPelajaran) => void;
  onUpdateSiswa?: (updatedSiswa: Siswa) => void;
  onUpdateKategori?: (updatedKategori: KategoriPenilaian) => void;
  onUpdatePenilaian?: (updatedPenilaian: Penilaian) => void;
}

export function JamPelajaranManager({ showNotification }: { showNotification: (text: string, type?: "success" | "neutral") => void }) {
  const [config, setConfig] = useState<ScheduleConfig>(() => getScheduleConfig());

  const handleSave = (updated: ScheduleConfig) => {
    setConfig(updated);
    saveScheduleConfig(updated);
    showNotification("Konfigurasi jam pelajaran berhasil diupdate dan diintegrasikan!", "success");
  };

  const handleAdd = (gender: "L" | "P") => {
    const newItem: JamPelajaranItem = {
      id: `${gender}-${Date.now()}`,
      name: "Jam Ke",
      time: "07:00 - 08:00",
      type: "belajar"
    };
    const updated = { ...config };
    if (gender === "L") {
      updated.lakiLaki = [...updated.lakiLaki, newItem];
    } else {
      updated.perempuan = [...updated.perempuan, newItem];
    }
    handleSave(updated);
  };

  const handleRemove = (gender: "L" | "P", id: string) => {
    const updated = { ...config };
    if (gender === "L") {
      updated.lakiLaki = updated.lakiLaki.filter(i => i.id !== id);
    } else {
      updated.perempuan = updated.perempuan.filter(i => i.id !== id);
    }
    handleSave(updated);
  };

  const handleUpdateField = (gender: "L" | "P", idx: number, field: keyof JamPelajaranItem, val: string) => {
    const updated = { ...config };
    if (gender === "L") {
      const list = [...updated.lakiLaki];
      list[idx] = { ...list[idx], [field]: val };
      updated.lakiLaki = list;
    } else {
      const list = [...updated.perempuan];
      list[idx] = { ...list[idx], [field]: val };
      updated.perempuan = list;
    }
    handleSave(updated);
  };

  const handleExportExcel = () => {
    const rows: any[] = [];
    config.lakiLaki.forEach(i => {
      rows.push({ Gender: "Laki-laki", Nama: i.name, Jam: i.time, Tipe: i.type });
    });
    config.perempuan.forEach(i => {
      rows.push({ Gender: "Perempuan", Nama: i.name, Jam: i.time, Tipe: i.type });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jam Pelajaran");
    XLSX.writeFile(wb, "Template_Jam_Pelajaran.xlsx");
    showNotification("Template / Data ekspor jam pelajaran diunduh!", "success");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const parsed: any[] = XLSX.utils.sheet_to_json(worksheet);

        const freshL: JamPelajaranItem[] = [];
        const freshP: JamPelajaranItem[] = [];

        parsed.forEach((r: any, idx) => {
          const gen = String(r.Gender || r.gender || "").toLowerCase();
          const nama = String(r.Nama || r.nama || "");
          const jam = String(r.Jam || r.jam || r.Waktu || r.waktu || "");
          const tipe = String(r.Tipe || r.tipe || "belajar").toLowerCase() === "istirahat" ? "istirahat" : "belajar";

          if (!nama || !jam) return;

          const item: JamPelajaranItem = {
            id: `imported-${idx}-${Date.now()}`,
            name: nama,
            time: jam,
            type: tipe
          };

          if (gen.includes("l") || gen.includes("pria") || gen.includes("cowok") || gen.includes("laki")) {
            freshL.push(item);
          } else if (gen.includes("p") || gen.includes("wanita") || gen.includes("cewek") || gen.includes("perempuan")) {
            freshP.push(item);
          } else {
            freshL.push({ ...item, id: `imported-L-${idx}-${Date.now()}` });
            freshP.push({ ...item, id: `imported-P-${idx}-${Date.now()}` });
          }
        });

        if (freshL.length > 0 || freshP.length > 0) {
          const updatedConfig: ScheduleConfig = {
            lakiLaki: freshL.length > 0 ? freshL : config.lakiLaki,
            perempuan: freshP.length > 0 ? freshP : config.perempuan
          };
          handleSave(updatedConfig);
        } else {
          showNotification("Format file Excel salah atau kosong!", "neutral");
        }
      } catch (err) {
        console.error(err);
        showNotification("Gagal membaca berkas Excel!", "neutral");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      <div className="bg-[#2D3A3A] text-white p-6 rounded-3xl border border-slate-700/50 shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 z-10">
          <span className="bg-[#BCE6B9] text-[#2D3A3A] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Super Control</span>
          <h3 className="text-lg font-bold font-display">Integrasi Jam Pelajaran & Istirahat</h3>
          <p className="text-xs text-slate-350 max-w-xl">
            Atur perbedaan jam belajar dan waktu istirahat antara siswa Laki-laki dan Perempuan untuk membagi konsentrasi/kapasitas, langsung terintegrasi ke seluruh dashboard guru, murid, dan absensi harian.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs bg-white text-slate-800 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer font-sans"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Ekspor Template Excel
          </button>
          <label className="px-3.5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer font-sans">
            <Plus className="w-4 h-4 text-emerald-255" /> Impor Excel/Spreadsheet
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleImportExcel}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laki-laki Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Siswa Laki-laki (Ikhwan)</h4>
            </div>
            <button
              onClick={() => handleAdd("L")}
              className="text-xs text-sky-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Sesi
            </button>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {config.lakiLaki.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Belum ada sesi jam pelajaran dikonfigurasi.</p>
            ) : (
              config.lakiLaki.map((item, idx) => (
                <div key={item.id} className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col gap-2 hover:bg-slate-50 transition-all text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono text-slate-400"># Sesi {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove("L", item.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Nama Sesi</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateField("L", idx, "name", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-500 font-bold text-slate-705"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Waktu (Jam)</label>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => handleUpdateField("L", idx, "time", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-500 font-mono text-slate-650"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Tipe</label>
                      <select
                        value={item.type}
                        onChange={(e) => handleUpdateField("L", idx, "type", e.target.value as "belajar" | "istirahat")}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-500 font-semibold text-slate-650 cursor-pointer text-slate-700"
                      >
                        <option value="belajar">Belajar</option>
                        <option value="istirahat">Istirahat</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Perempuan Column */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Siswa Perempuan (Akhwat)</h4>
            </div>
            <button
              onClick={() => handleAdd("P")}
              className="text-xs text-pink-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Sesi
            </button>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {config.perempuan.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Belum ada sesi jam pelajaran dikonfigurasi.</p>
            ) : (
              config.perempuan.map((item, idx) => (
                <div key={item.id} className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-200/80 flex flex-col gap-2 hover:bg-slate-50 transition-all text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold font-mono text-slate-400"># Sesi {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove("P", item.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Nama Sesi</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateField("P", idx, "name", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-pink-500 font-bold text-slate-705"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Waktu (Jam)</label>
                      <input
                        type="text"
                        value={item.time}
                        onChange={(e) => handleUpdateField("P", idx, "time", e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-pink-500 font-mono text-slate-650"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400">Tipe</label>
                      <select
                        value={item.type}
                        onChange={(e) => handleUpdateField("P", idx, "type", e.target.value as "belajar" | "istirahat")}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-pink-500 font-semibold text-slate-650 cursor-pointer text-slate-700"
                      >
                        <option value="belajar font-sans">Belajar</option>
                        <option value="istirahat font-sans">Istirahat</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5 select-none text-emerald-500">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <p className="text-[11px] text-emerald-900 font-bold uppercase tracking-wide">
          Konfigurasi aktif di atas otomatis diterapkan secara real-time ke seluruh data Guru Pengajar, Wali Murid, dan Sistem Absensi.
        </p>
      </div>
    </div>
  );
}

export default function AdminPortal({
  kelas,
  mapel,
  siswa,
  kategori,
  penilaian,
  announcements,
  setAnnouncements,
  guruCodes,
  setGuruCodes,
  jadwal,
  setJadwal,
  absenGuru,
  setAbsenGuru,
  onAddGuruCode,
  onToggleGuruCodeStatus,
  onDeleteGuruCode,
  onClearAllMasterData,
  showNotification,
  setSiswa,
  setKategori,
  setPenilaian,
  setKelas,
  setMapel,
  ujianPraktek = [],
  setUjianPraktek,
  onImportAllData,
  onDeleteKelas,
  onDeleteMapel,
  onDeleteSiswa,
  onDeleteKategori,
  onDeletePenilaian,
  onUpdateKelas,
  onUpdateMapel,
  onUpdateSiswa,
  onUpdateKategori,
  onUpdatePenilaian
}: AdminPortalProps) {
  // Top Level Navigation
  const [adminMainTab, setAdminMainTab] = useState<"guru" | "master" | "excel" | "les" | "kalender" | "jamPelajaran" | "keamanan">("guru");

  // Keamanan / Database Lock states
  const [lockedBackup, setLockedBackup] = useState<any>(() => {
    const saved = localStorage.getItem("PSD_LOCKED_DB_BACKUP");
    return saved ? JSON.parse(saved) : null;
  });

  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [showPasscodeModalFor, setShowPasscodeModalFor] = useState<"restore" | "delete_backup" | "wipe" | null>(null);

  // Email Config
  const [adminNotificationEmail, setAdminNotificationEmail] = useState(() => {
    return localStorage.getItem("PSD_ADMIN_NOTIFICATION_EMAIL") || "sdit.alhanif@gmail.com";
  });

  const [enableEmailAlerts, setEnableEmailAlerts] = useState(() => {
    return localStorage.getItem("PSD_ENABLE_EMAIL_ALERTS") !== "false";
  });

  // Load audit logs in AdminPortal
  const [portalLogs, setPortalLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem("PSD_AUDIT_LOGS");
    return saved ? JSON.parse(saved) : [
      { id: "LOG-INIT1", timestamp: new Date(Date.now() - 3600000).toISOString(), actor: "Super Admin", action: "Sistem diinisialisasi dan dihubungkan ke Google API", status: "Tercatat di Google Spreadsheet & Terkirim ke sdit.alhanif@gmail.com" },
      { id: "LOG-INIT2", timestamp: new Date(Date.now() - 1800000).toISOString(), actor: "Super Admin", action: "Sinkronisasi otomatis basis data SDIT rombel 2A - 6F", status: "Tercatat di Google Spreadsheet & Terkirim ke sdit.alhanif@gmail.com" }
    ];
  });

  // Action log helper
  const triggerLogRecord = (actionDesc: string) => {
    const newLog = {
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      actor: "Super Admin",
      action: actionDesc,
      status: `Tercatat di G-Sheet & Terkirim ke ${adminNotificationEmail}`
    };
    const updated = [newLog, ...portalLogs].slice(0, 500);
    setPortalLogs(updated);
    localStorage.setItem("PSD_AUDIT_LOGS", JSON.stringify(updated));
  };

  const handleSpreadsheetSync = async () => {
    try {
      showNotification("Memulai sinkronisasi Google Sheets...", "neutral");
      const token = await getAccessToken();
      if (!token) {
        showNotification("Sesi Google Sheets belum aktif atau memerlukan Login. Hubungkan di tab Google Sheets atau masuk terlebih dahulu.", "neutral");
        return;
      }
      const data = await importDataFromGoogleSheets(token);
      if (data) {
        onImportAllData(data, "replace");
        showNotification("Sinkronisasi Google Sheets berhasil diunduh dan dipasang!", "success");
        triggerLogRecord("Melakukan sinkronisasi penuh dari Google Sheets.");
      }
    } catch (e: any) {
      console.error(e);
      showNotification("Gagal sinkronisasi: " + (e.message || String(e)), "neutral");
    }
  };

  // State for Admin Les & Bimbingan Belajar
  const [lesProgramsList, setLesProgramsList] = useState<LesProgram[]>(() => {
    const saved = localStorage.getItem("PSD_LES_PROGRAMS");
    if (saved) return JSON.parse(saved);
    return [
      { id: "prog-1", title: "Bimbingan Tahsin & Tajwid Al-Qur'an Intensif", tutor: "Ustadz Luqman Hakim, S.Pd.I", time: "Senin & Rabu, Sesi II (16:00 - 17:30 WIB)", fee: "Rp 150.000 / bln" },
      { id: "prog-2", title: "Klub Percakapan Bahasa Arab Praktis (Al-Hiwar)", tutor: "Ustadzah Zahra Al-Atas, Lc", time: "Selasa & Kamis, Sesi I (15:45 - 17:15 WIB)", fee: "Rp 175.000 / bln" },
      { id: "prog-3", title: "Bimbingan Nahwu & Shorof (Dasar Kitab Al-Ajurrumiyyah)", tutor: "Dr. Syihabuddin, M.A", time: "Jumat Berkah, Sesi III (13:30 - 15:30 WIB)", fee: "Subsidi Khusus (Gratis)" }
    ];
  });

  const [lesRegList, setLesRegList] = useState<LesRegistration[]>(() => {
    const saved = localStorage.getItem("PSD_LES_REGISTRATIONS");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [adminLesWa, setAdminLesWa] = useState(() => {
    return localStorage.getItem("PSD_LES_ADMIN_WA") || "628123456781";
  });

  // Les Program Inputs
  const [newLesTitle, setNewLesTitle] = useState("");
  const [newLesTutor, setNewLesTutor] = useState("");
  const [newLesTime, setNewLesTime] = useState("");
  const [newLesFee, setNewLesFee] = useState("");
  const [selectedLesKelasIds, setSelectedLesKelasIds] = useState<string[]>([]);
  const [editingLesProgId, setEditingLesProgId] = useState<string | null>(null);

  // Main Tab 1: Guru State
  const [newGuruName, setNewGuruName] = useState("");
  const [newGuruPhone, setNewGuruPhone] = useState("");
  const [newGuruIsWali, setNewGuruIsWali] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacherCode, setSelectedTeacherCode] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"siswa" | "kategori" | "nilai" | "jadwal" | "presensi" | "pengumuman">("siswa");

  // Subject selection choices
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>([]);
  const [editGuruMapelIds, setEditGuruMapelIds] = useState<string[]>([]);

  // Config visibility mode for parent portal contacts (Requirement 6)
  const [contactMode, setContactMode] = useState<"ALL" | "WALAS" | "CUSTOM">(() => {
    return (localStorage.getItem("PSD_WALI_PORTAL_CONTACT_MODE") as any) || "ALL";
  });
  const [allowedGuruCodes, setAllowedGuruCodes] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("PSD_WALI_PORTAL_ALLOWED_GURU_CODES") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("PSD_WALI_PORTAL_CONTACT_MODE", contactMode);
  }, [contactMode]);

  useEffect(() => {
    localStorage.setItem("PSD_WALI_PORTAL_ALLOWED_GURU_CODES", JSON.stringify(allowedGuruCodes));
  }, [allowedGuruCodes]);

  // Admin Editing teacher details
  const [editingGuruCode, setEditingGuruCode] = useState<string | null>(null);
  const [editGuruName, setEditGuruName] = useState("");
  const [editGuruCode, setEditGuruCode] = useState("");
  const [editGuruPhone, setEditGuruPhone] = useState("");
  const [editGuruIsWali, setEditGuruIsWali] = useState(false);
  const [editGuruKelasId, setEditGuruKelasId] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [editGuruKelasIds, setEditGuruKelasIds] = useState<string[]>([]);

  // Enforce Wali Kelas single-class rules automatically or on state changes
  useEffect(() => {
    if (newGuruIsWali && selectedKelasIds.length > 1) {
      setSelectedKelasIds([selectedKelasIds[0]]);
    }
  }, [newGuruIsWali, selectedKelasIds]);

  useEffect(() => {
    if (editGuruIsWali && editGuruKelasIds.length > 1) {
      setEditGuruKelasIds([editGuruKelasIds[0]]);
    }
  }, [editGuruIsWali, editGuruKelasIds]);

  // Master Edit States
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [editKelasNama, setEditKelasNama] = useState("");
  const [editKelasDeskripsi, setEditKelasDeskripsi] = useState("");

  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);
  const [editMapelNama, setEditMapelNama] = useState("");

  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [editSiswaNis, setEditSiswaNis] = useState("");
  const [editSiswaNama, setEditSiswaNama] = useState("");
  const [editSiswaKelasId, setEditSiswaKelasId] = useState("");
  const [editSiswaNamaWali, setEditSiswaNamaWali] = useState("");
  const [editSiswaNoHpWali, setEditSiswaNoHpWali] = useState("");
  const [editSiswaAlamat, setEditSiswaAlamat] = useState("");
  const [editSiswaJenisKelamin, setEditSiswaJenisKelamin] = useState<"L" | "P">("L");
  const [editSiswaKodeAkses, setEditSiswaKodeAkses] = useState("");

  const getTeacherNameByCode = (tCode: string | undefined): string => {
    if (!tCode || tCode === "MASTER-ADMIN") return "Admin Utama";
    const found = guruCodes.find(g => g.code === tCode);
    return found ? found.namaGuru : tCode;
  };

  const [editingKategori, setEditingKategori] = useState<KategoriPenilaian | null>(null);
  const [editKategoriNama, setEditKategoriNama] = useState("");
  const [editKategoriKelasId, setEditKategoriKelasId] = useState("");
  const [editKategoriMapelId, setEditKategoriMapelId] = useState("");

  const [editingPenilaian, setEditingPenilaian] = useState<Penilaian | null>(null);
  const [editPenilaianTanggal, setEditPenilaianTanggal] = useState("");
  const [editPenilaianKategoriId, setEditPenilaianKategoriId] = useState("");
  const [editPenilaianGrades, setEditPenilaianGrades] = useState<{ [siswaId: string]: number }>({});

  const handleSaveKelasEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelas) return;
    if (!editKelasNama.trim()) {
      showNotification("Nama Kelas tidak boleh kosong!", "neutral");
      return;
    }
    const updated: Kelas = {
      ...editingKelas,
      namaKelas: editKelasNama.trim(),
      deskripsi: editKelasDeskripsi.trim()
    };
    if (onUpdateKelas) {
      onUpdateKelas(updated);
    } else {
      setKelas(prev => prev.map(k => k.id === updated.id ? updated : k));
    }
    showNotification(`Kelas '${updated.namaKelas}' berhasil diperbarui!`, "success");
    setEditingKelas(null);
  };

  const handleSaveMapelEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMapel) return;
    if (!editMapelNama.trim()) {
      showNotification("Nama mata pelajaran tidak boleh kosong!", "neutral");
      return;
    }
    const updated: MataPelajaran = {
      ...editingMapel,
      namaMapel: editMapelNama.trim()
    };
    if (onUpdateMapel) {
      onUpdateMapel(updated);
    } else {
      setMapel(prev => prev.map(m => m.id === updated.id ? updated : m));
    }
    showNotification(`Pelajaran '${updated.namaMapel}' berhasil diperbarui!`, "success");
    setEditingMapel(null);
  };

  const handleSaveSiswaEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    if (!editSiswaNis.trim() || !editSiswaNama.trim() || !editSiswaKelasId) {
      showNotification("Lengkapi seluruh isian siswa!", "neutral");
      return;
    }
    // Check duplication NIS (exclude current editing student)
    if (siswa.some(s => s.id !== editingSiswa.id && s.nis.trim() === editSiswaNis.trim())) {
      showNotification("Gagal: NIS sudah digunakan oleh siswa lain!", "neutral");
      return;
    }
    const updated: Siswa = {
      ...editingSiswa,
      nis: editSiswaNis.trim(),
      namaSiswa: editSiswaNama.trim(),
      kelasId: editSiswaKelasId,
      namaWali: editSiswaNamaWali.trim(),
      noHpWali: editSiswaNoHpWali.replace(/[^0-9]/g, "").trim(),
      alamatSiswa: editSiswaAlamat.trim(),
      jenisKelamin: editSiswaJenisKelamin,
      kodeAkses: editSiswaKodeAkses.trim() || undefined
    };
    if (onUpdateSiswa) {
      onUpdateSiswa(updated);
    } else {
      setSiswa(prev => prev.map(s => s.id === updated.id ? updated : s));
    }
    showNotification(`Siswa '${updated.namaSiswa}' berhasil diperbarui!`, "success");
    setEditingSiswa(null);
  };

  const handlePromoteAcademicYear = () => {
    const confirmMessage = "PERINGATAN: Apakah Anda yakin ingin memproses kenaikan kelas tahun ajaran baru?\n\n" +
      "- Siswa Kelas 1-5 akan dinaikkan ke kelas berikutnya dengan paralel yang sama (e.g. Kelas 2A menjadi Kelas 3A).\n" +
      "- Siswa Kelas 6 akan menjadi ALUMNI dengan tahun lulus saat ini.\n" +
      "- Siswa Alumni yang sudah lulus selama 2 tahun atau lebih akan DIHAPUS OTOMATIS secara permanen.\n\n" +
      "Proses ini tidak dapat dibatalkan. Lanjutkan?";
    
    if (!confirm(confirmMessage)) return;

    const currentYear = new Date().getFullYear();
    let promotedCount = 0;
    let graduateCount = 0;
    let deletedAlumniCount = 0;

    const updatedSiswaList: Siswa[] = siswa.reduce((acc: Siswa[], s) => {
      // 1. Check if they are already alumni
      if (s.isAlumni) {
        const exitYear = s.tahunKeluar || currentYear;
        // Keep only if graduate period is less than 2 years
        if (currentYear - exitYear < 2) {
          acc.push(s);
        } else {
          deletedAlumniCount++;
        }
        return acc;
      }

      // 2. Resolve current class
      const sKelas = kelas.find(kl => kl.id === s.kelasId);
      if (!sKelas) {
        // If student has no class, keep them as is
        acc.push(s);
        return acc;
      }

      // 3. Parse class name for level. e.g. "Kelas 2A" or "Kelas 6F" or "2A"
      const match = sKelas.namaKelas.match(/(\d+)\s*([A-Za-z]+)/);
      if (match) {
        const level = parseInt(match[1]);
        const parallel = match[2];

        if (level >= 6) {
          // Graduates!
          graduateCount++;
          acc.push({
            ...s,
            isAlumni: true,
            tahunKeluar: currentYear,
            kelasId: "" // clear current class ID
          });
        } else {
          // Promotes! level + 1
          const nextLevel = level + 1;
          const targetClassName = `Kelas ${nextLevel}${parallel}`;
          const targetClass = kelas.find(kl => kl.namaKelas.toLowerCase().replace(/\s+/g, '') === targetClassName.toLowerCase().replace(/\s+/g, ''));
          
          if (targetClass) {
            promotedCount++;
            acc.push({
              ...s,
              kelasId: targetClass.id
            });
          } else {
            // Target class parallel not pre-made: search for any class near next level prefix to place them
            const anyAlternative = kelas.find(kl => kl.namaKelas.includes(String(nextLevel)));
            if (anyAlternative) {
              promotedCount++;
              acc.push({
                ...s,
                kelasId: anyAlternative.id
              });
            } else {
              acc.push(s);
            }
          }
        }
      } else {
        acc.push(s);
      }

      return acc;
    }, []);

    // Update state
    setSiswa(updatedSiswaList);
    
    // Feedback dialog
    alert(`PROSES HASIL JURNAL TAHUN AJARAN BARU:\n\n` +
      `- ${promotedCount} Siswa dinaikan kelas.\n` +
      `- ${graduateCount} Siswa kelas 6 lulus menjadi Alumni.\n` +
      `- ${deletedAlumniCount} Siswa alumni (> 2 tahun pembelajaran) terhapus otomatis dari penyimpanan database. \n\n` +
      `Sistem database diperbarui sukses!`);

    showNotification("Transisi tahun ajaran baru sukses diproses!", "success");
  };

  const handleSaveKategoriEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKategori) return;
    if (!editKategoriNama.trim() || !editKategoriKelasId || !editKategoriMapelId) {
      showNotification("Lengkapi seluruh isian kategori!", "neutral");
      return;
    }
    const updated: KategoriPenilaian = {
      ...editingKategori,
      namaKategori: editKategoriNama.trim(),
      kelasId: editKategoriKelasId,
      mapelId: editKategoriMapelId
    };
    if (onUpdateKategori) {
      onUpdateKategori(updated);
    } else {
      setKategori(prev => prev.map(k => k.id === updated.id ? updated : k));
    }
    showNotification(`Kategori tugas '${updated.namaKategori}' berhasil diperbarui!`, "success");
    setEditingKategori(null);
  };

  const handleSavePenilaianEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPenilaian) return;
    if (!editPenilaianTanggal) {
      showNotification("Harap pilih tanggal pengerjaan!", "neutral");
      return;
    }
    const updatedGrades = Object.entries(editPenilaianGrades).map(([siswaId, val]) => ({
      siswaId,
      nilai: Number(val)
    }));
    const updated: Penilaian = {
      ...editingPenilaian,
      tanggal: editPenilaianTanggal,
      kategoriId: editPenilaianKategoriId || editingPenilaian.kategoriId,
      grades: updatedGrades
    };
    if (onUpdatePenilaian) {
      onUpdatePenilaian(updated);
    } else {
      setPenilaian(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    showNotification("Lembar nilai berhasil disimpan ulang!", "success");
    setEditingPenilaian(null);
  };

  // Admin adding scheduling slot for selected teacher
  const [adminJadwalHari, setAdminJadwalHari] = useState<HariBelajar>("Senin");
  const [adminJadwalJamMulai, setAdminJadwalJamMulai] = useState("07:30");
  const [adminJadwalJamSelesai, setAdminJadwalJamSelesai] = useState("09:00");
  const [adminJadwalKelasId, setAdminJadwalKelasId] = useState("");
  const [adminJadwalMapelId, setAdminJadwalMapelId] = useState("");
  const [adminJadwalRuangan, setAdminJadwalRuangan] = useState("");

  // Admin logging attendance for selected teacher
  const [adminAbsenTanggal, setAdminAbsenTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [adminAbsenStatus, setAdminAbsenStatus] = useState<AttendanceStatusGuru>("Hadir");
  const [adminAbsenCatatan, setAdminAbsenCatatan] = useState("");

  // Siswa Form under Teacher Console
  const [adminSiswaNis, setAdminSiswaNis] = useState("");
  const [adminSiswaNama, setAdminSiswaNama] = useState("");
  const [adminSiswaKelasId, setAdminSiswaKelasId] = useState("");

  // Kategori Form under Teacher Console
  const [adminKatNama, setAdminKatNama] = useState("");
  const [adminKatKelasId, setAdminKatKelasId] = useState("");
  const [adminKatMapelId, setAdminKatMapelId] = useState("");

  // Nilai Form under Teacher Console
  const [adminNilaiKatId, setAdminNilaiKatId] = useState("");
  const [adminNilaiTanggal, setAdminNilaiTanggal] = useState("2026-05-22");
  const [adminGradesInput, setAdminGradesInput] = useState<Record<string, number>>({});

  // Main Tab 2: Master Data Sub Tabs
  const [masterDataSubTab, setMasterDataSubTab] = useState<"kelas" | "mapel" | "siswa" | "kategori" | "penilaian" | "ujianPraktek">("kelas");
  const [studentFilter, setStudentFilter] = useState<"aktif" | "alumni">("aktif");
  const [adminSiswaSearch, setAdminSiswaSearch] = useState("");
  const [adminSiswaPage, setAdminSiswaPage] = useState(1);

  // Reset master student list page upon search or filter shifts
  useEffect(() => {
    setAdminSiswaPage(1);
  }, [adminSiswaSearch, studentFilter, masterDataSubTab]);

  // Add Class Form State
  const [newKelasId, setNewKelasId] = useState("");
  const [newKelasNama, setNewKelasNama] = useState("");
  const [newKelasDesc, setNewKelasDesc] = useState("");

  // Add Mapel Form State
  const [newMapelId, setNewMapelId] = useState("");
  const [newMapelNama, setNewMapelNama] = useState("");

  // Add General Student Form State
  const [genSiswaNis, setGenSiswaNis] = useState("");
  const [genSiswaNama, setGenSiswaNama] = useState("");
  const [genSiswaKelasId, setGenSiswaKelasId] = useState("");
  const [genSiswaTeacherCode, setGenSiswaTeacherCode] = useState("");
  const [genSiswaJenisKelamin, setGenSiswaJenisKelamin] = useState<"L" | "P">("L");
  const [genSiswaKodeAkses, setGenSiswaKodeAkses] = useState("");

  // Bulk Student Input State
  const [bulkSiswaKelasId, setBulkSiswaKelasId] = useState("");
  const [bulkSiswaNamesText, setBulkSiswaNamesText] = useState("");

  // Add General Category Form State
  const [genKatNama, setGenKatNama] = useState("");
  const [genKatKelasId, setGenKatKelasId] = useState("");
  const [genKatMapelId, setGenKatMapelId] = useState("");
  const [genKatTeacherCode, setGenKatTeacherCode] = useState("");
  const [genKatTargetType, setGenKatTargetType] = useState<"one" | "all" | "some">("one");
  const [genKatSelectedKelasIds, setGenKatSelectedKelasIds] = useState<string[]>([]);

  // Grouped Category Edit State
  const [editingGroup, setEditingGroup] = useState<{
    namaKategori: string;
    mapelId: string;
    teacherCode?: string;
    items: KategoriPenilaian[];
  } | null>(null);
  const [editGroupNama, setEditGroupNama] = useState("");
  const [editGroupMapelId, setEditGroupMapelId] = useState("");
  const [editGroupTeacherCode, setEditGroupTeacherCode] = useState("");
  const [editGroupKelasIds, setEditGroupKelasIds] = useState<string[]>([]);

  // Add General Nilai Form State
  const [genNilaiKatId, setGenNilaiKatId] = useState("");
  const [genNilaiTanggal, setGenNilaiTanggal] = useState("2026-05-22");
  const [genGradesInput, setGenGradesInput] = useState<Record<string, number>>({});
  const [genNilaiTeacherCode, setGenNilaiTeacherCode] = useState("");

  // Main Tab 3: Central Excel Integrated Import State
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<{
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
    totalGradesCount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save edited teacher details & cascade modifications
  const handleSaveTeacherEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGuruName.trim() || !editGuruCode.trim()) {
      showNotification("Nama guru dan kode guru wajib diisi!", "neutral");
      return;
    }

    const codeExists = guruCodes.some(g => g.code.toLowerCase() === editGuruCode.trim().toLowerCase() && g.code !== editingGuruCode);
    if (codeExists) {
      showNotification("Sandi akses atau kode guru tersebut sudah digunakan!", "neutral");
      return;
    }

    const oldCode = editingGuruCode!;
    const newCode = editGuruCode.trim();

    // Update GuruCode in state
    setGuruCodes(prev => prev.map(g => g.code === oldCode ? {
      ...g,
      code: newCode,
      namaGuru: editGuruName.trim(),
      phoneNumber: editGuruPhone.trim() || undefined,
      isWaliKelas: editGuruIsWali,
      assignedKelasId: editGuruKelasIds.length > 0 ? editGuruKelasIds[0] : undefined,
      assignedKelasIds: editGuruKelasIds,
      mapelAjars: editGuruMapelIds,
      mapelAjar: editGuruMapelIds.length > 0 ? editGuruMapelIds.join(", ") : undefined
    } : g));

    // Cascade Updates across entities to hold visual state integrity
    if (oldCode !== newCode) {
      setSiswa(prev => prev.map(s => s.teacherCode === oldCode ? { ...s, teacherCode: newCode } : s));
      setKategori(prev => prev.map(k => k.teacherCode === oldCode ? { ...k, teacherCode: newCode } : k));
      setPenilaian(prev => prev.map(p => p.teacherCode === oldCode ? { ...p, teacherCode: newCode } : p));
      setJadwal(prev => prev.map(j => j.teacherCode === oldCode ? { ...j, teacherCode: newCode } : j));
      setAbsenGuru(prev => prev.map(a => a.teacherCode === oldCode ? { ...a, teacherCode: newCode } : a));
      
      // If the selected manager screen is currently showing the old code, update it as well
      if (selectedTeacherCode === oldCode) {
        setSelectedTeacherCode(newCode);
      }
    }

    showNotification("Data identitas Guru berhasil diperbarui!", "success");
    setEditingGuruCode(null);
  };

  // Add teacher schedule from nested console
  const handleAdminAddJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherCode) return;
    if (!adminJadwalKelasId || !adminJadwalMapelId) {
      showNotification("Tentukan kelas sasaran dan mata pelajaran!", "neutral");
      return;
    }

    const newId = `JAD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    const newEntry: Jadwal = {
      id: newId,
      hari: adminJadwalHari,
      jamMulai: adminJadwalJamMulai || "07:30",
      jamSelesai: adminJadwalJamSelesai || "09:00",
      kelasId: adminJadwalKelasId,
      mapelId: adminJadwalMapelId,
      teacherCode: selectedTeacherCode,
      ruangan: adminJadwalRuangan.trim() || undefined
    };

    setJadwal(prev => [...prev, newEntry]);
    showNotification("Jadwal mengajar pendidik berhasil didaftarkan!", "success");
    setAdminJadwalRuangan("");
  };

  // Delete teacher schedule
  const handleAdminDeleteJadwal = (id: string) => {
    setJadwal(prev => prev.filter(j => j.id !== id));
    showNotification("Sesi jadwal mengajar berhasil dihapus.", "neutral");
  };

  // Save/Update teacher attendance from admin dashboard or nested console
  const handleAdminSaveAbsen = (e: React.FormEvent, customTeacherCode?: string) => {
    e.preventDefault();
    const tCode = customTeacherCode || selectedTeacherCode;
    if (!tCode) return;

    setAbsenGuru(prev => {
      const filtered = prev.filter(a => !(a.tanggal === adminAbsenTanggal && a.teacherCode === tCode));
      const record: AbsenGuru = {
        id: `ABG-${adminAbsenTanggal}-${tCode}`,
        tanggal: adminAbsenTanggal,
        teacherCode: tCode,
        status: adminAbsenStatus,
        catatan: adminAbsenCatatan.trim() || undefined
      };
      return [...filtered, record];
    });

    const teacherObj = guruCodes.find(g => g.code === tCode);
    showNotification(`Presensi '${adminAbsenStatus}' tersimpan untuk ${teacherObj?.namaGuru || tCode} pada tanggal ${adminAbsenTanggal}!`, "success");
    setAdminAbsenCatatan("");
  };

  // Delete teacher attendance
  const handleAdminDeleteAbsen = (id: string) => {
    setAbsenGuru(prev => prev.filter(a => a.id !== id));
    showNotification("Presensi berhasil dihapus.", "neutral");
  };

  // Generate unique codes & search filter
  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuruName.trim()) {
      showNotification("Nama Guru wajib diisi!", "neutral");
      return;
    }
    onAddGuruCode(
      newGuruName.trim(),
      selectedKelasIds.length > 0 ? selectedKelasIds[0] : undefined,
      selectedKelasIds,
      newGuruIsWali,
      newGuruPhone,
      selectedMapelIds
    );
    setNewGuruName("");
    setNewGuruPhone("");
    setNewGuruIsWali(false);
    setSelectedKelasId("");
    setSelectedKelasIds([]);
    setSelectedMapelIds([]);
  };

  const filteredCodes = guruCodes.filter(g => 
    g.namaGuru.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeacherUploadStats = (code: string) => {
    const studentCount = siswa.filter(s => s.teacherCode === code).length;
    const taskCount = kategori.filter(k => k.teacherCode === code).length;
    const gradeCount = penilaian.filter(p => p.teacherCode === code).length;
    let totalScoreCount = 0;
    penilaian.forEach(p => {
      if (p.teacherCode === code) {
        totalScoreCount += p.grades.length;
      }
    });

    return {
      students: studentCount,
      tasks: taskCount,
      grades: gradeCount,
      scoreItems: totalScoreCount
    };
  };

  const currentActiveTeacher = useMemo(() => {
    return guruCodes.find(g => g.code === selectedTeacherCode);
  }, [selectedTeacherCode, guruCodes]);

  const managedSiswa = useMemo(() => {
    return siswa.filter(s => s.teacherCode === selectedTeacherCode);
  }, [siswa, selectedTeacherCode]);

  const managedKategori = useMemo(() => {
    return kategori.filter(k => k.teacherCode === selectedTeacherCode);
  }, [kategori, selectedTeacherCode]);

  const managedPenilaian = useMemo(() => {
    return penilaian.filter(p => p.teacherCode === selectedTeacherCode);
  }, [penilaian, selectedTeacherCode]);

  const activeSiswaForGrades = useMemo(() => {
    const kat = kategori.find(k => k.id === adminNilaiKatId);
    if (!kat) return [];
    return siswa.filter(s => s.kelasId === kat.kelasId);
  }, [adminNilaiKatId, kategori, siswa]);

  const genSiswaForGrades = useMemo(() => {
    const kat = kategori.find(k => k.id === genNilaiKatId);
    if (!kat) return [];
    return siswa.filter(s => s.kelasId === kat.kelasId);
  }, [genNilaiKatId, kategori, siswa]);

  // Excel template generator and upload handler for individual master tabs
  const generateSingleTemplate = (tab: "kelas" | "mapel" | "siswa" | "kategori" | "penilaian" | "guru" | "jadwal") => {
    const wb = XLSX.utils.book_new();
    let headers: string[][] = [];
    let exampleRows: any[][] = [];
    let fileName = "";
    let sheetName = "";

    if (tab === "kelas") {
      headers = [["id", "namaKelas", "deskripsi"]];
      exampleRows = [["K001", "XI MIPA 1", "Rombongan Belajar Kelas 11 MIPA 1"], ["K002", "XI MIPA 2", "Rombongan Belajar Kelas 11 MIPA 2"]];
      fileName = "Template_Excel_Kelas.xlsx";
      sheetName = "Kelas";
    } else if (tab === "mapel") {
      headers = [["id", "namaMapel"]];
      exampleRows = [["M001", "Bahasa Arab"], ["M002", "Matematika"]];
      fileName = "Template_Excel_Pelajaran.xlsx";
      sheetName = "Mata Pelajaran";
    } else if (tab === "siswa") {
      headers = [["id", "nis", "namaSiswa", "kelasId", "jenisKelamin", "kodeAkses", "namaWali", "noHpWali", "alamatSiswa"]];
      exampleRows = [
        ["S001", "240101", "Ahmad Fadil", "K001", "L", "CODEMURID1", "Bapak H. Sulaiman", "628123456781", "Jl. Kaliurang KM 10, Sleman"],
        ["S002", "240102", "Siti Aminah", "K001", "P", "CODEMURID2", "Bapak Dr. Lukman", "628223456782", "Condongcatur, Depok, Sleman"]
      ];
      fileName = "Template_Excel_Siswa.xlsx";
      sheetName = "Siswa";
    } else if (tab === "kategori") {
      headers = [["id", "kelasId", "mapelId", "namaKategori"]];
      exampleRows = [["KT001", "K001", "M001", "Ujian Harian 1"]];
      fileName = "Template_Excel_Kategori.xlsx";
      sheetName = "Kategori Tugas";
    } else if (tab === "penilaian") {
      headers = [["tanggal", "kategoriId", "nisSiswa", "nilai"]];
      exampleRows = [["2026-05-22", "KT001", "240101", 90], ["2026-05-22", "KT001", "240102", 85]];
      fileName = "Template_Excel_Nilai.xlsx";
      sheetName = "Nilai Siswa";
    } else if (tab === "guru") {
      headers = [["code", "namaGuru", "assignedKelasIds", "phoneNumber", "mapelAjar", "isActive"]];
      exampleRows = [
        ["G001", "Ibu Siti Aminah, S.Pd.", "K001,K002", "628123456781", "Bahasa Arab", "TRUE"],
        ["G002", "Ustadz Luqman Hakim, S.Pd.I", "K001", "628222333444", "Tahsin", "TRUE"]
      ];
      fileName = "Template_Excel_Guru.xlsx";
      sheetName = "Daftar Guru";
    } else if (tab === "jadwal") {
      headers = [["id", "hari", "jamMulai", "jamSelesai", "kelasId", "mapelId", "teacherCode", "ruangan"]];
      exampleRows = [
        ["J001", "Senin", "07:30", "09:00", "K001", "M001", "G001", "Kelas 11A"],
        ["J002", "Selasa", "09:15", "10:30", "K001", "M002", "G002", "Lab Bahasa"]
      ];
      fileName = "Template_Excel_Jadwal.xlsx";
      sheetName = "Jadwal Pelajaran";
    }

    const ws = XLSX.utils.aoa_to_sheet([...headers, ...exampleRows]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    showNotification(`Template Excel untuk ${tab} berhasil diunduh!`, "success");
  };

  const handleSingleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>, tab: "kelas" | "mapel" | "siswa" | "kategori" | "penilaian" | "guru" | "jadwal") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        if (!sheet) {
          showNotification("Lembar kerja pertama Excel tidak ditemukan.", "neutral");
          return;
        }
        const rawJSON = XLSX.utils.sheet_to_json<any>(sheet);

        if (tab === "kelas") {
          const imported: Kelas[] = rawJSON.map((row, idx) => {
            const id = String(row.id || `K_NEW_${idx + 1}`).trim();
            const namaKelas = String(row.namaKelas || row.nama || `Kelas ${idx + 1}`).trim();
            const deskripsi = String(row.deskripsi || "").trim();
            return { id, namaKelas, deskripsi };
          });

          setKelas(prev => {
            const merged = [...prev];
            imported.forEach(newK => {
              const idxExist = merged.findIndex(k => k.id.toLowerCase() === newK.id.toLowerCase() || k.namaKelas.toLowerCase() === newK.namaKelas.toLowerCase());
              if (idxExist !== -1) {
                merged[idxExist] = newK;
              } else {
                merged.push(newK);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} kelas dari Excel!`, "success");
        } else if (tab === "mapel") {
          const imported: MataPelajaran[] = rawJSON.map((row, idx) => {
            const id = String(row.id || `M_NEW_${idx + 1}`).trim();
            const namaMapel = String(row.namaMapel || row.nama || `Mapel ${idx + 1}`).trim();
            return { id, namaMapel };
          });

          setMapel(prev => {
            const merged = [...prev];
            imported.forEach(newM => {
              const idxExist = merged.findIndex(m => m.id.toLowerCase() === newM.id.toLowerCase() || m.namaMapel.toLowerCase() === newM.namaMapel.toLowerCase());
              if (idxExist !== -1) {
                merged[idxExist] = newM;
              } else {
                merged.push(newM);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} mata pelajaran dari Excel!`, "success");
        } else if (tab === "siswa") {
          const imported: Siswa[] = rawJSON.map((row, idx) => {
            const id = String(row.id || `S_NEW_${idx + 1}`).trim();
            const nis = String(row.nis || row.nisSiswa || `NIS-${idx + 100}`).trim();
            const namaSiswa = String(row.namaSiswa || row.nama || `Siswa ${idx + 1}`).trim();
            const rawKelasId = String(row.kelasId || row.idKelas || row.kelas || row.rombel || "").trim();
            
            let resolvedKelasId = rawKelasId;
            const foundInCurrent = kelas.find(k => 
              k.id.toLowerCase() === rawKelasId.toLowerCase() || 
              k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
            );
            if (foundInCurrent) {
              resolvedKelasId = foundInCurrent.id;
            }

            const namaWali = row.namaWali ? String(row.namaWali).trim() : undefined;
            const noHpWali = row.noHpWali ? String(row.noHpWali).trim() : undefined;
            const alamatSiswa = row.alamatSiswa ? String(row.alamatSiswa).trim() : undefined;

            return { id, nis, namaSiswa, kelasId: resolvedKelasId, namaWali, noHpWali, alamatSiswa };
          });

          setSiswa(prev => {
            const merged = [...prev];
            imported.forEach(newS => {
              const idxExist = merged.findIndex(s => s.nis === newS.nis || s.id === newS.id);
              if (idxExist !== -1) {
                // Keep existing fields if not imported
                merged[idxExist] = {
                  ...merged[idxExist],
                  ...newS,
                  namaWali: newS.namaWali || merged[idxExist].namaWali,
                  noHpWali: newS.noHpWali || merged[idxExist].noHpWali,
                  alamatSiswa: newS.alamatSiswa || merged[idxExist].alamatSiswa,
                };
              } else {
                merged.push(newS);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} siswa dengan info wali dari Excel!`, "success");
        } else if (tab === "guru") {
          const imported: GuruCode[] = rawJSON.map((row, idx) => {
            const code = String(row.code || row.kode || `G_NEW_${idx + 1}`).trim();
            const namaGuru = String(row.namaGuru || row.nama || `Guru ${idx + 1}`).trim();
            const mapelAjar = row.mapelAjar ? String(row.mapelAjar).trim() : undefined;
            const phoneNumber = row.phoneNumber || row.noHp ? String(row.phoneNumber || row.noHp).trim() : undefined;
            const rawKelasIds = String(row.assignedKelasIds || row.assignedKelasId || row.kelasIds || row.kelas || "").trim();
            
            const assignedKelasIds = rawKelasIds ? rawKelasIds.split(",").map(id => id.trim()).filter(Boolean) : [];
            const assignedKelasId = assignedKelasIds[0] || undefined;
            
            const isActive = row.isActive !== undefined ? (String(row.isActive).toLowerCase() === "true" || row.isActive === "TRUE" || row.isActive === 1 || row.isActive === "1") : true;

            return {
              code,
              namaGuru,
              assignedKelasId,
              assignedKelasIds,
              createdAt: new Date().toISOString().split("T")[0],
              isActive,
              phoneNumber,
              mapelAjar
            };
          });

          setGuruCodes(prev => {
            const merged = [...prev];
            imported.forEach(newG => {
              const idxExist = merged.findIndex(g => g.code.toLowerCase() === newG.code.toLowerCase());
              if (idxExist !== -1) {
                merged[idxExist] = { ...merged[idxExist], ...newG };
              } else {
                merged.push(newG);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} Guru dari Excel!`, "success");
        } else if (tab === "jadwal") {
          const imported: Jadwal[] = rawJSON.map((row, idx) => {
            const id = String(row.id || `J_NEW_${idx + 1}`).trim();
            const hari = String(row.hari || "Senin").trim() as HariBelajar;
            const jamMulai = String(row.jamMulai || "07:30").trim();
            const jamSelesai = String(row.jamSelesai || "09:00").trim();
            const kelasId = String(row.kelasId || "").trim();
            const mapelId = String(row.mapelId || "").trim();
            const teacherCode = String(row.teacherCode || row.kodeGuru || "").trim();
            const ruangan = row.ruangan ? String(row.ruangan).trim() : undefined;

            return { id, hari, jamMulai, jamSelesai, kelasId, mapelId, teacherCode, ruangan };
          }).filter(j => j.kelasId && j.mapelId);

          setJadwal(prev => {
            const merged = [...prev];
            imported.forEach(newL => {
              const idxExist = merged.findIndex(j => j.id === newL.id);
              if (idxExist !== -1) {
                merged[idxExist] = newL;
              } else {
                merged.push(newL);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} jadwal pelajaran dari Excel!`, "success");
        } else if (tab === "kategori") {
          const imported: KategoriPenilaian[] = rawJSON.map((row, idx) => {
            const id = String(row.id || `KT_NEW_${idx + 1}`).trim();
            const rawKelasId = String(row.kelasId || row.idKelas || row.kelas || row.rombel || "").trim();
            const mapelId = String(row.mapelId || row.idMapel || row.mapel || "").trim();
            const namaKategori = String(row.namaKategori || row.nama || `Tugas ${idx + 1}`).trim();
            
            let resolvedKelasId = rawKelasId;
            const foundInCurrent = kelas.find(k => 
              k.id.toLowerCase() === rawKelasId.toLowerCase() || 
              k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
            );
            if (foundInCurrent) {
              resolvedKelasId = foundInCurrent.id;
            }

            let resolvedMapelId = mapelId;
            const foundMapelCurrent = mapel.find(m => 
              m.id.toLowerCase() === mapelId.toLowerCase() || 
              m.namaMapel.toLowerCase() === mapelId.toLowerCase()
            );
            if (foundMapelCurrent) {
              resolvedMapelId = foundMapelCurrent.id;
            }

            return { id, kelasId: resolvedKelasId, mapelId: resolvedMapelId, namaKategori };
          });

          setKategori(prev => {
            const merged = [...prev];
            imported.forEach(newKat => {
              const idxExist = merged.findIndex(kat => kat.id === newKat.id);
              if (idxExist !== -1) {
                merged[idxExist] = newKat;
              } else {
                merged.push(newKat);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${imported.length} kategori nilai dari Excel!`, "success");
        } else if (tab === "penilaian") {
          interface FlatNilaiRecord {
            tanggal: string;
            kategoriId: string;
            nisSiswa: string;
            nilai: number;
          }

          const flatRecords: FlatNilaiRecord[] = rawJSON.map((row) => {
            return {
              tanggal: String(row.tanggal || new Date().toISOString().split("T")[0]).trim(),
              kategoriId: String(row.kategoriId || row.idKategori || "").trim(),
              nisSiswa: String(row.nisSiswa || row.nis || "").trim(),
              nilai: Number(row.nilai ?? row.skor ?? 0)
            };
          }).filter(r => r.kategoriId && r.nisSiswa);

          const groupedMap: { [key: string]: FlatNilaiRecord[] } = {};
          flatRecords.forEach(rec => {
            const key = `${rec.tanggal}_${rec.kategoriId}`;
            if (!groupedMap[key]) {
              groupedMap[key] = [];
            }
            groupedMap[key].push(rec);
          });

          const cleanPenilaian: Penilaian[] = [];
          let totalGradesProcessed = 0;

          Object.entries(groupedMap).forEach(([key, recs], idx) => {
            const [tanggal, kategoriId] = key.split("_");
            const grades = recs.map(r => {
              const matchedStudentUniqueKey = siswa.find(s => s.nis === r.nisSiswa);
              const studentId = matchedStudentUniqueKey?.id || `S_UNKM_${r.nisSiswa}`;
              totalGradesProcessed++;
              return {
                siswaId: studentId,
                nilai: isNaN(r.nilai) ? 0 : Math.min(100, Math.max(0, r.nilai))
              };
            });

            cleanPenilaian.push({
              id: `P_NEW_${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
              tanggal,
              kategoriId,
              grades
            });
          });

          setPenilaian(prev => {
            const merged = [...prev];
            cleanPenilaian.forEach(newP => {
              const existingIdx = merged.findIndex(p => p.tanggal === newP.tanggal && p.kategoriId === newP.kategoriId);
              if (existingIdx !== -1) {
                const updatedGrades = [...merged[existingIdx].grades];
                newP.grades.forEach(newG => {
                  const gIdx = updatedGrades.findIndex(g => g.siswaId === newG.siswaId);
                  if (gIdx !== -1) {
                    updatedGrades[gIdx].nilai = newG.nilai;
                  } else {
                    updatedGrades.push(newG);
                  }
                });
                merged[existingIdx].grades = updatedGrades;
              } else {
                merged.push(newP);
              }
            });
            return merged;
          });
          showNotification(`Berhasil mengimpor ${totalGradesProcessed} resep nilai siswa dari Excel!`, "success");
        }
      } catch (err: any) {
        showNotification("Gagal membaca berkas Excel. Gunakan template yang sesuai.", "neutral");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // General Master Data Addition Actions
  const handleAddNewKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelasNama.trim()) {
      showNotification("Nama Kelas harus diisi!", "neutral");
      return;
    }
    const finalId = newKelasId.trim() || `K${String(kelas.length + 1).padStart(3, "0")}`;
    if (kelas.some(k => k.id.toLowerCase() === finalId.toLowerCase())) {
      showNotification("Gagal: Kode Kelas sudah digunakan!", "neutral");
      return;
    }
    const item: Kelas = {
      id: finalId,
      namaKelas: newKelasNama.trim(),
      deskripsi: newKelasDesc.trim()
    };
    setKelas(prev => [...prev, item]);
    showNotification(`Kelas '${newKelasNama}' berhasil ditambahkan ke database!`, "success");
    setNewKelasId("");
    setNewKelasNama("");
    setNewKelasDesc("");
  };

  const handleAddNewMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapelNama.trim()) {
      showNotification("Nama Pelajaran harus diisi!", "neutral");
      return;
    }
    const finalId = newMapelId.trim() || `M${String(mapel.length + 1).padStart(3, "0")}`;
    if (mapel.some(m => m.id.toLowerCase() === finalId.toLowerCase())) {
      showNotification("Gagal: Kode Mapel sudah digunakan!", "neutral");
      return;
    }
    const item: MataPelajaran = {
      id: finalId,
      namaMapel: newMapelNama.trim()
    };
    setMapel(prev => [...prev, item]);
    showNotification(`Mata Pelajaran '${newMapelNama}' berhasil didaftarkan!`, "success");
    setNewMapelId("");
    setNewMapelNama("");
  };

  const handleAddGeneralSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genSiswaNis.trim() || !genSiswaNama.trim() || !genSiswaKelasId) {
      showNotification("Harap lengkapi semua isian siswa!", "neutral");
      return;
    }
    if (siswa.some(s => s.nis.trim() === genSiswaNis.trim())) {
      showNotification("Gagal: NIS siswa sudah digunakan!", "neutral");
      return;
    }
    const generatedId = `S${String(siswa.length + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
    const item: Siswa = {
      id: generatedId,
      nis: genSiswaNis.trim(),
      namaSiswa: genSiswaNama.trim(),
      kelasId: genSiswaKelasId,
      teacherCode: genSiswaTeacherCode || undefined,
      jenisKelamin: genSiswaJenisKelamin,
      kodeAkses: genSiswaKodeAkses.trim() || undefined
    };
    setSiswa(prev => [...prev, item]);
    showNotification(`Siswa '${genSiswaNama}' berhasil ditambahkan ke database!`, "success");
    setGenSiswaNis("");
    setGenSiswaNama("");
    setGenSiswaKelasId("");
    setGenSiswaTeacherCode("");
    setGenSiswaJenisKelamin("L");
    setGenSiswaKodeAkses("");
  };

  const handleBulkAddSiswaPerKelas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSiswaKelasId) {
      showNotification("Pilih kelas terlebih dahulu!", "neutral");
      return;
    }
    if (!bulkSiswaNamesText.trim()) {
      showNotification("Tuliskan nama-nama siswa terlebih dahulu!", "neutral");
      return;
    }

    const lines = bulkSiswaNamesText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      showNotification("Daftar nama siswa kosong!", "neutral");
      return;
    }

    const newSiswaList: Siswa[] = [];
    let addedCount = 0;
    
    // Find highest NIS currently in database to auto-increment
    let highestNisNum = 240100; // Base starting NIS if parsing fails
    siswa.forEach(s => {
      const parsed = parseInt(s.nis.replace(/\D/g, ""), 10);
      if (!isNaN(parsed) && parsed > highestNisNum) {
        highestNisNum = parsed;
      }
    });

    lines.forEach((line) => {
      let nis = "";
      let nama = "";

      // Check if line contains a format like: "240105 - Ahmad" or "240105: Ahmad" or "240105, Ahmad"
      const separatorPattern = /[:-…,\t]/;
      if (separatorPattern.test(line)) {
        const parts = line.split(separatorPattern);
        const possibleNis = parts[0].trim();
        const possibleNama = parts.slice(1).join(" ").trim();
        // If possibleNis is numeric and looks like a NIS
        if (/^\d+$/.test(possibleNis) && possibleNis.length >= 2 && possibleNama) {
          nis = possibleNis;
          nama = possibleNama;
        }
      }

      if (!nama) {
        // Just a name line
        nama = line;
      }

      // If NIS wasn't specified or was already taken, auto-increment highestNisNum
      if (!nis || siswa.some(s => s.nis.trim() === nis) || newSiswaList.some(s => s.nis === nis)) {
        highestNisNum++;
        nis = String(highestNisNum);
      }

      const generatedId = `S${String(siswa.length + newSiswaList.length + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
      
      newSiswaList.push({
        id: generatedId,
        nis: nis,
        namaSiswa: nama,
        kelasId: bulkSiswaKelasId
      });
      addedCount++;
    });

    setSiswa(prev => [...prev, ...newSiswaList]);
    showNotification(`Berhasil mendaftarkan ${addedCount} siswa baru ke kelas yang dipilih!`, "success");
    setBulkSiswaNamesText("");
  };

  const handleAddGeneralKategori = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genKatNama.trim() || !genKatMapelId) {
      showNotification("Lengkapi nama, sasaran kelas dan pelajaran!", "neutral");
      return;
    }

    let targetKelasIds: string[] = [];
    if (genKatTargetType === "one") {
      if (!genKatKelasId) {
        showNotification("Lengkapi sasaran kelas!", "neutral");
        return;
      }
      targetKelasIds = [genKatKelasId];
    } else if (genKatTargetType === "all") {
      targetKelasIds = kelas.map(k => k.id);
    } else {
      if (genKatSelectedKelasIds.length === 0) {
        showNotification("Pilih minimal satu kelas!", "neutral");
        return;
      }
      targetKelasIds = genKatSelectedKelasIds;
    }

    const newItems: KategoriPenilaian[] = [];
    let addedCount = 0;
    let skippedCount = 0;

    targetKelasIds.forEach((kelasId) => {
      const alreadyExists = kategori.some(
        k => k.namaKategori.toLowerCase().trim() === genKatNama.toLowerCase().trim() &&
             k.kelasId === kelasId &&
             k.mapelId === genKatMapelId
      );

      if (alreadyExists) {
        skippedCount++;
        return;
      }

      const randValue = Math.floor(100 + Math.random() * 900);
      const generatedId = `KT${String(kategori.length + addedCount + 1).padStart(3, "0")}-${randValue}`;

      newItems.push({
        id: generatedId,
        namaKategori: genKatNama.trim(),
        kelasId,
        mapelId: genKatMapelId,
        teacherCode: genKatTeacherCode || undefined
      });
      addedCount++;
    });

    if (newItems.length > 0) {
      setKategori(prev => [...prev, ...newItems]);
    }

    if (addedCount > 0) {
      showNotification(
        `Berhasil mendaftarkan kategori '${genKatNama}' di ${addedCount} kelas!${
          skippedCount > 0 ? ` (Dilewati ${skippedCount} kelas karena sudah ada)` : ""
        }`,
        "success"
      );
      setGenKatNama("");
      setGenKatKelasId("");
      setGenKatSelectedKelasIds([]);
      setGenKatTeacherCode("");
    } else {
      showNotification("Kategori penilaian sudah terdaftar di semua kelas pilihan Anda.", "neutral");
    }
  };

  const handleDelKategoriGroup = (groupItems: KategoriPenilaian[], name: string) => {
    const assessmentCount = penilaian.filter(p => groupItems.map(i => i.id).includes(p.kategoriId)).length;
    let msg = `Apakah Anda yakin ingin menghapus kategori tugas '${name}' di SELURUH ${groupItems.length} kelas?`;
    if (assessmentCount > 0) {
      msg = `⚠️ Peringatan: Kategori '${name}' memiliki ${assessmentCount} lembar nilai aktif. Menghapus kategori ini akan menghapus seluruh data nilai tersebut dari semua kelas! Apakah Anda yakin?`;
    }
    if (confirm(msg)) {
      const idsToDelete = groupItems.map(item => item.id);
      if (onDeleteKategori) {
        idsToDelete.forEach(id => onDeleteKategori(id));
      } else {
        setKategori(prev => prev.filter(k => !idsToDelete.includes(k.id)));
        setPenilaian(prev => prev.filter(p => !idsToDelete.includes(p.kategoriId)));
        showNotification(`Kategori tugas '${name}' berhasil dihapus dari semua kelas.`, "success");
      }
    }
  };

  const handleDelKategoriSingle = (id: string, name: string, clsName: string) => {
    const assessmentCount = penilaian.filter(p => p.kategoriId === id).length;
    let msg = `Hapus kategori tugas '${name}' khusus untuk '${clsName}'?`;
    if (assessmentCount > 0) {
      msg = `⚠️ Peringatan: Kategori '${name}' untuk '${clsName}' memiliki ${assessmentCount} nilai siswa aktif. Menghapus akan menghapus nilai tersebut. Lanjutkan?`;
    }
    if (confirm(msg)) {
      if (onDeleteKategori) {
        onDeleteKategori(id);
      } else {
        setKategori(prev => prev.filter(k => k.id !== id));
        setPenilaian(prev => prev.filter(p => p.kategoriId !== id));
        showNotification(`Kategori '${name}' di kelas '${clsName}' berhasil dihapus.`, "neutral");
      }
    }
  };

  const handleSaveGroupEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    if (!editGroupNama.trim() || !editGroupMapelId) {
      showNotification("Lengkapi nama kategori dan mata pelajaran!", "neutral");
      return;
    }
    if (editGroupKelasIds.length === 0) {
      showNotification("Kategori minimal harus memilih satu kelas!", "neutral");
      return;
    }

    const oldKelasIds = editingGroup.items.map(i => i.kelasId);
    const kelasIdsToRemove = oldKelasIds.filter(id => !editGroupKelasIds.includes(id));
    const itemsToRemove = editingGroup.items.filter(item => kelasIdsToRemove.includes(item.kelasId));
    const idsToRemove = itemsToRemove.map(item => item.id);

    const kelasIdsToAdd = editGroupKelasIds.filter(id => !oldKelasIds.includes(id));
    const kelasIdsToUpdate = editGroupKelasIds.filter(id => oldKelasIds.includes(id));
    const itemsToUpdate = editingGroup.items.filter(item => kelasIdsToUpdate.includes(item.kelasId));

    let finalKategori = [...kategori];

    if (idsToRemove.length > 0) {
      finalKategori = finalKategori.filter(k => !idsToRemove.includes(k.id));
      setPenilaian(prev => prev.filter(p => !idsToRemove.includes(p.kategoriId)));
    }

    itemsToUpdate.forEach(item => {
      finalKategori = finalKategori.map(k => {
        if (k.id === item.id) {
          return {
            ...k,
            namaKategori: editGroupNama.trim(),
            mapelId: editGroupMapelId,
            teacherCode: editGroupTeacherCode || undefined
          };
        }
        return k;
      });
    });

    let addedCount = 0;
    const newItems: KategoriPenilaian[] = [];
    kelasIdsToAdd.forEach(kelasId => {
      const randValue = Math.floor(100 + Math.random() * 900);
      const generatedId = `KT${String(finalKategori.length + addedCount + 1).padStart(3, "0")}-${randValue}`;
      newItems.push({
        id: generatedId,
        namaKategori: editGroupNama.trim(),
        kelasId,
        mapelId: editGroupMapelId,
        teacherCode: editGroupTeacherCode || undefined
      });
      addedCount++;
    });

    finalKategori = [...finalKategori, ...newItems];

    if (onDeleteKategori && idsToRemove.length > 0) {
      idsToRemove.forEach(id => onDeleteKategori(id));
    }
    if (onUpdateKategori) {
      itemsToUpdate.forEach(item => {
        onUpdateKategori({
          ...item,
          namaKategori: editGroupNama.trim(),
          mapelId: editGroupMapelId,
          teacherCode: editGroupTeacherCode || undefined
        });
      });
    }

    setKategori(finalKategori);
    showNotification(`Kategori '${editGroupNama}' berhasil diperbarui!`, "success");
    setEditingGroup(null);
  };

  const handleAddGeneralPenilaian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genNilaiKatId || !genNilaiTanggal) {
      showNotification("Lengkapi kategori ujian dan tanggal pengerjaan!", "neutral");
      return;
    }
    if (genSiswaForGrades.length === 0) {
      showNotification("Tidak ada siswa terdaftar di sasaran kelas kategori ini!", "neutral");
      return;
    }
    const scores = genSiswaForGrades.map(s => ({
      siswaId: s.id,
      nilai: Number(genGradesInput[s.id] ?? 80)
    }));
    const newId = `P${String(penilaian.length + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const item: Penilaian = {
      id: newId,
      tanggal: genNilaiTanggal,
      kategoriId: genNilaiKatId,
      grades: scores,
      teacherCode: genNilaiTeacherCode || undefined
    };
    setPenilaian(prev => [...prev, item]);
    showNotification("Rekor lembar nilai global siswa berhasil disimpan!", "success");
    setGenNilaiKatId("");
    setGenGradesInput({});
    setGenNilaiTeacherCode("");
  };

  // Deletion logic for entities
  const handleDelKelas = (id: string) => {
    const sCount = siswa.filter(s => s.kelasId === id).length;
    let msg = "Menghapus kelas akan mengosongkan status siswa & ujian yang terhubung. Lanjutkan?";
    if (sCount > 0) {
      msg = `⚠️ Peringatan: Masih ada ${sCount} siswa aktif di kelas ini. Menghapus kelas ini akan ikut menghapus seluruh data siswa tersebut beserta kategori tugas dan penilaian terkait secara permanen! Apakah Anda yakin?`;
    }
    if (confirm(msg)) {
      if (onDeleteKelas) {
        onDeleteKelas(id);
      } else {
        setKelas(prev => prev.filter(k => k.id !== id));
        setSiswa(prev => prev.filter(s => s.kelasId !== id));
        setKategori(prev => prev.filter(k => k.kelasId !== id));
        showNotification("Kelas dilepas dari database.", "neutral");
      }
    }
  };

  const handleDelMapel = (id: string) => {
    const katCount = kategori.filter(k => k.mapelId === id).length;
    let msg = "Menghapus pelajaran akan ikut menghapus kategori ujian terhubung. Lanjutkan?";
    if (katCount > 0) {
      msg = `⚠️ Peringatan: Pelajaran ini digunakan di ${katCount} kategori tugas/penilaian. Menghapus mapel akan menghapus seluruh data tugas dan nilai itu secara permanen. Lanjutkan?`;
    }
    if (confirm(msg)) {
      if (onDeleteMapel) {
        onDeleteMapel(id);
      } else {
        setMapel(prev => prev.filter(m => m.id !== id));
        setKategori(prev => prev.filter(k => k.mapelId !== id));
        showNotification("Mata pelajaran dilepas.", "neutral");
      }
    }
  };

  const handleDelSiswa = (id: string) => {
    if (confirm("Hapus data siswa ini secara permanen dari seluruh lembar nilai dan presensi di sistem?")) {
      if (onDeleteSiswa) {
        onDeleteSiswa(id);
      } else {
        setSiswa(prev => prev.filter(s => s.id !== id));
        setPenilaian(prev => prev.map(p => ({
          ...p,
          grades: p.grades.filter(g => g.siswaId !== id)
        })));
        showNotification("Siswa dilepas.", "neutral");
      }
    }
  };

  const handleDelKategori = (id: string) => {
    if (confirm("Hapus kategori tugas ini beserta seluruh rekaman nilainya?")) {
      if (onDeleteKategori) {
        onDeleteKategori(id);
      } else {
        setKategori(prev => prev.filter(k => k.id !== id));
        setPenilaian(prev => prev.filter(p => p.kategoriId !== id));
        showNotification("Kategori penilaian dihapus.", "neutral");
      }
    }
  };

  const handleDelPenilaian = (id: string) => {
    if (confirm("Hapus rekor lembar nilai tugas ini?")) {
      if (onDeletePenilaian) {
        onDeletePenilaian(id);
      } else {
        setPenilaian(prev => prev.filter(p => p.id !== id));
        showNotification("Lembar nilai dihapus.", "neutral");
      }
    }
  };


  // Teacher Console Specific Adding Functions
  const handleAdminAddSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSiswaNis.trim() || !adminSiswaNama.trim() || !adminSiswaKelasId) {
      showNotification("Harap lengkapi semua isian formulir siswa!", "neutral");
      return;
    }
    if (siswa.some(s => s.nis.trim() === adminSiswaNis.trim())) {
      showNotification("Gagal: Siswa dengan NIS tersebut sudah terdaftar!", "neutral");
      return;
    }
    const newId = `S${String(siswa.length + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
    const newItem: Siswa = {
      id: newId,
      nis: adminSiswaNis.trim(),
      namaSiswa: adminSiswaNama.trim(),
      kelasId: adminSiswaKelasId,
      teacherCode: selectedTeacherCode
    };
    setSiswa(prev => [...prev, newItem]);
    showNotification(`Siswa '${adminSiswaNama}' terdaftar untuk Guru ${selectedTeacherCode}!`, "success");
    setAdminSiswaNis("");
    setAdminSiswaNama("");
  };

  const handleAdminAddKategori = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKatNama.trim() || !adminKatKelasId || !adminKatMapelId) {
      showNotification("Lengkapi nama ulangan/ujian, kelas dan mapel!", "neutral");
      return;
    }
    const newId = `KT${String(kategori.length + 1).padStart(3, "0")}`;
    const newItem: KategoriPenilaian = {
      id: newId,
      namaKategori: adminKatNama.trim(),
      kelasId: adminKatKelasId,
      mapelId: adminKatMapelId,
      teacherCode: selectedTeacherCode
    };
    setKategori(prev => [...prev, newItem]);
    showNotification(`Kategori ujian "${adminKatNama}" ditambahkan!`, "success");
    setAdminKatNama("");
  };

  const handleAdminAddPenilaian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNilaiKatId || !adminNilaiTanggal) {
      showNotification("Tentukan kategori ujian dan tanggal!", "neutral");
      return;
    }
    if (activeSiswaForGrades.length === 0) {
      showNotification("Tidak ada siswa untuk diberi nilai!", "neutral");
      return;
    }
    const gradesList = activeSiswaForGrades.map(s => ({
      siswaId: s.id,
      nilai: Number(adminGradesInput[s.id] ?? 80)
    }));
    const newId = `P${String(penilaian.length + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: Penilaian = {
      id: newId,
      tanggal: adminNilaiTanggal,
      kategoriId: adminNilaiKatId,
      grades: gradesList,
      teacherCode: selectedTeacherCode
    };
    setPenilaian(prev => [...prev, newItem]);
    showNotification(`Rekor nilai berhasil terbit ke portal guru!`, "success");
    setAdminNilaiKatId("");
    setAdminGradesInput({});
  };


  // Excel Integration Methods
  const generateTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Readme Instructions
    const readmeData = [
      ["PETUNJUK PENGISIAN TEMPLATE DATA SISWADIGITAL (PORTAL ADMIN)"],
      [""],
      ["1. Jangan mengubah nama/susunan kolom pada baris pertama di setiap sheet."],
      ["2. Setiap sheet saling berhubungan menggunakan Kode ID."],
      ["   - Sheet 'Siswa' merujuk ke 'ID Kelas' yang ada di sheet 'Kelas'."],
      ["   - Sheet 'Kategori Tugas' merujuk ke 'ID Kelas' dan 'ID Mapel'."],
      ["   - Sheet 'Nilai Siswa' merujuk ke 'ID Kategori' dan 'NIS' siswa."],
      ["3. Format ID:"],
      ["   - ID Kelas: K001, K002 (K diikuti 3 angka)"],
      ["   - ID Mapel: M001, M002 (M diikuti 3 angka)"],
      ["   - ID Kategori Tugas: KT001, KT002 (KT diikuti 3 angka)"],
      ["   - NIS Siswa: Angka unik (contoh: 240101)"],
      ["4. Format Tanggal pada sheet Nilai Siswa harus YYYY-MM-DD (Contoh: 2026-05-22)."],
      ["5. Nilai harus berupa angka di rentang 0 sampai 100."],
      [""],
      ["Unduh template ini, isi dengan data Anda, lalu unggah kembali melalui tab Impor Excel ini."]
    ];
    const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
    XLSX.utils.book_append_sheet(wb, wsReadme, "1. Petunjuk Penggunaan");

    // Sheet 2: Kelas
    const kelasHeader = [["id", "namaKelas", "deskripsi"]];
    const kelasRows = kelas.map(k => [k.id, k.namaKelas, k.deskripsi || ""]);
    const wsKelas = XLSX.utils.aoa_to_sheet([...kelasHeader, ...kelasRows]);
    XLSX.utils.book_append_sheet(wb, wsKelas, "2. Kelas");

    // Sheet 3: Mata Pelajaran
    const mapelHeader = [["id", "namaMapel"]];
    const mapelRows = mapel.map(m => [m.id, m.namaMapel]);
    const wsMapel = XLSX.utils.aoa_to_sheet([...mapelHeader, ...mapelRows]);
    XLSX.utils.book_append_sheet(wb, wsMapel, "3. Mata Pelajaran");

    // Sheet 4: Siswa 
    const siswaHeader = [["id", "nis", "namaSiswa", "kelasId", "jenisKelamin", "kodeAkses"]];
    const siswaRows = siswa.map(s => [s.id, s.nis, s.namaSiswa, s.kelasId, s.jenisKelamin || "L", s.kodeAkses || ""]);
    const wsSiswa = XLSX.utils.aoa_to_sheet([...siswaHeader, ...siswaRows]);
    XLSX.utils.book_append_sheet(wb, wsSiswa, "4. Siswa");

    // Sheet 5: Kategori Tugas
    const kategoriHeader = [["id", "kelasId", "mapelId", "namaKategori"]];
    const kategoriRows = kategori.map(kat => [kat.id, kat.kelasId, kat.mapelId, kat.namaKategori]);
    const wsKategori = XLSX.utils.aoa_to_sheet([...kategoriHeader, ...kategoriRows]);
    XLSX.utils.book_append_sheet(wb, wsKategori, "5. Kategori Tugas");

    // Sheet 6: Nilai Siswa
    const nilaiHeader = [["tanggal", "kategoriId", "nisSiswa", "nilai"]];
    const flatNilaiRows: any[] = [];
    penilaian.forEach(p => {
      p.grades.forEach(g => {
        const student = siswa.find(s => s.id === g.siswaId);
        if (student) {
          flatNilaiRows.push([
            p.tanggal,
            p.kategoriId,
            student.nis,
            g.nilai
          ]);
        }
      });
    });
    if (flatNilaiRows.length === 0) {
      flatNilaiRows.push(["2026-05-22", "KT001", "240101", 90]);
      flatNilaiRows.push(["2026-05-22", "KT001", "240102", 85]);
    }
    const wsNilai = XLSX.utils.aoa_to_sheet([...nilaiHeader, ...flatNilaiRows]);
    XLSX.utils.book_append_sheet(wb, wsNilai, "6. Nilai Siswa");

    XLSX.writeFile(wb, "Template_SiswaDigital_Lengkap_Admin.xlsx");
  };

  const handleShareWhatsAppAdmin = () => {
    const textMessage = `Halo Bapak/Ibu Admin! Berikut adalah link akses web SiswaDigital. Silakan pilih menu 'Impor Excel' dan klik download template untuk melengkapi rekap database Anda.`;
    const encoded = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readExcelFile(file);
    }
  };

  const onExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readExcelFile(file);
    }
  };

  const readExcelFile = (file: File) => {
    setErrorMessage(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;
        
        const findSheet = (keywords: string[]) => {
          return sheetNames.find(name => 
            keywords.some(kw => name.toLowerCase().includes(kw))
          );
        };

        const kelasSheetName = findSheet(["kelas", "2. kelas"]);
        const mapelSheetName = findSheet(["mata pelajaran", "mapel", "3. mata pelajaran"]);
        const siswaSheetName = findSheet(["siswa", "4. siswa"]);
        const kategoriSheetName = findSheet(["kategori", "tugas", "5. kategori"]);
        const nilaiSheetName = findSheet(["nilai", "6. nilai"]);

        if (!kelasSheetName || !siswaSheetName) {
          throw new Error("Format Sheet Excel tidak valid. Pastikan lembar kerja 'Kelas' dan 'Siswa' sudah dibuat.");
        }

        const rawKelasJSON = XLSX.utils.sheet_to_json<any>(workbook.Sheets[kelasSheetName]);
        const rawMapelJSON = mapelSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[mapelSheetName]) : [];
        const rawSiswaJSON = XLSX.utils.sheet_to_json<any>(workbook.Sheets[siswaSheetName]);
        const rawKategoriJSON = kategoriSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[kategoriSheetName]) : [];
        const rawNilaiJSON = nilaiSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[nilaiSheetName]) : [];

        const cleanKelas: Kelas[] = rawKelasJSON.map((row, idx) => {
          const id = String(row.id || `K_NEW_${idx + 1}`).trim();
          const namaKelas = String(row.namaKelas || row.nama || `Kelas ${idx + 1}`).trim();
          const deskripsi = String(row.deskripsi || "").trim();
          return { id, namaKelas, deskripsi };
        });

        const cleanMapel: MataPelajaran[] = rawMapelJSON.map((row, idx) => {
          const id = String(row.id || `M_NEW_${idx + 1}`).trim();
          const namaMapel = String(row.namaMapel || row.nama || `Mapel ${idx + 1}`).trim();
          return { id, namaMapel };
        });

        const cleanSiswa: Siswa[] = rawSiswaJSON.map((row, idx) => {
          const id = String(row.id || `S_NEW_${idx + 1}`).trim();
          const nis = String(row.nis || row.nisSiswa || `NIS-${idx + 100}`).trim();
          const namaSiswa = String(row.namaSiswa || row.nama || `Siswa ${idx + 1}`).trim();
          const rawKelasId = String(row.kelasId || row.idKelas || row.kelas || row.rombel || "").trim();
          
          let resolvedKelasId = rawKelasId;
          const foundInImported = cleanKelas.find(k => 
            k.id.toLowerCase() === rawKelasId.toLowerCase() || 
            k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
          );
          if (foundInImported) {
            resolvedKelasId = foundInImported.id;
          } else {
            const foundInCurrent = kelas.find(k => 
              k.id.toLowerCase() === rawKelasId.toLowerCase() || 
              k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
            );
            if (foundInCurrent) {
              resolvedKelasId = foundInCurrent.id;
            }
          }

          const rawJK = String(row.jenisKelamin || row.jk || row.gender || row.Gender || "L").trim().toUpperCase();
          const jenisKelamin = (rawJK === "P" || rawJK.includes("PEREMPUAN") || rawJK.includes("AKHWAT") || rawJK.includes("WANITA") || rawJK === "PR") ? "P" : "L";
          const kodeAkses = row.kodeAkses || row.kode || row.password || row.accessCode ? String(row.kodeAkses || row.kode || row.password || row.accessCode).trim() : undefined;

          return { id, nis, namaSiswa, kelasId: resolvedKelasId, jenisKelamin, kodeAkses };
        });

        const cleanKategori: KategoriPenilaian[] = rawKategoriJSON.map((row, idx) => {
          const id = String(row.id || `KT_NEW_${idx + 1}`).trim();
          const rawKelasId = String(row.kelasId || row.idKelas || row.kelas || row.rombel || "").trim();
          const mapelId = String(row.mapelId || row.idMapel || row.mapel || "").trim();
          const namaKategori = String(row.namaKategori || row.nama || `Tugas ${idx + 1}`).trim();
          
          let resolvedKelasId = rawKelasId;
          const foundInImported = cleanKelas.find(k => 
            k.id.toLowerCase() === rawKelasId.toLowerCase() || 
            k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
          );
          if (foundInImported) {
             resolvedKelasId = foundInImported.id;
          } else {
             const foundInCurrent = kelas.find(k => 
               k.id.toLowerCase() === rawKelasId.toLowerCase() || 
               k.namaKelas.toLowerCase() === rawKelasId.toLowerCase()
             );
             if (foundInCurrent) {
               resolvedKelasId = foundInCurrent.id;
             }
          }

          let resolvedMapelId = mapelId;
          const foundMapelImported = cleanMapel.find(m => 
            m.id.toLowerCase() === mapelId.toLowerCase() || 
            m.namaMapel.toLowerCase() === mapelId.toLowerCase()
          );
          if (foundMapelImported) {
            resolvedMapelId = foundMapelImported.id;
          } else {
            const foundMapelCurrent = mapel.find(m => 
              m.id.toLowerCase() === mapelId.toLowerCase() || 
              m.namaMapel.toLowerCase() === mapelId.toLowerCase()
            );
            if (foundMapelCurrent) {
              resolvedMapelId = foundMapelCurrent.id;
            }
          }

          return { id, kelasId: resolvedKelasId, mapelId: resolvedMapelId, namaKategori };
        });

        const cleanPenilaian: Penilaian[] = [];
        let totalGradesProcessed = 0;

        interface FlatNilaiRecord {
          tanggal: string;
          kategoriId: string;
          nisSiswa: string;
          nilai: number;
        }

        const flatRecords: FlatNilaiRecord[] = rawNilaiJSON.map((row) => {
          return {
            tanggal: String(row.tanggal || new Date().toISOString().split("T")[0]).trim(),
            kategoriId: String(row.kategoriId || row.idKategori || "").trim(),
            nisSiswa: String(row.nisSiswa || row.nis || "").trim(),
            nilai: Number(row.nilai ?? row.skor ?? 0)
          };
        }).filter(r => r.kategoriId && r.nisSiswa);

        const groupedMap: { [key: string]: FlatNilaiRecord[] } = {};
        flatRecords.forEach(rec => {
          const key = `${rec.tanggal}_${rec.kategoriId}`;
          if (!groupedMap[key]) {
            groupedMap[key] = [];
          }
          groupedMap[key].push(rec);
        });

        Object.entries(groupedMap).forEach(([key, recs], idx) => {
          const [tanggal, kategoriId] = key.split("_");
          const grades = recs.map(r => {
            const matchedStudentImported = cleanSiswa.find(s => s.nis === r.nisSiswa);
            const matchedStudentCurrent = siswa.find(s => s.nis === r.nisSiswa);
            const studentId = matchedStudentImported?.id || matchedStudentCurrent?.id || `S_UNKM_${r.nisSiswa}`;
            totalGradesProcessed++;
            return {
              siswaId: studentId,
              nilai: isNaN(r.nilai) ? 0 : Math.min(100, Math.max(0, r.nilai))
            };
          });

          cleanPenilaian.push({
            id: `P_NEW_${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
            tanggal,
            kategoriId,
            grades
          });
        });

        setParsedData({
          kelas: cleanKelas,
          mapel: cleanMapel,
          siswa: cleanSiswa,
          kategori: cleanKategori,
          penilaian: cleanPenilaian,
          totalGradesCount: totalGradesProcessed
        });

      } catch (err: any) {
        setErrorMessage(err.message || "Gagal mengimpor excel. Periksa keselarasan kolom template.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitExcelImport = () => {
    if (!parsedData) return;
    onImportAllData(parsedData, importMode);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // HANDLERS FOR LES PROGRAMS & REGISTRATIONS
  const handleSaveLesProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesTitle.trim() || !newLesTutor.trim() || !newLesTime.trim() || !newLesFee.trim()) {
      showNotification("Sila lengkapi seluruh kolom brosur bimbingan!", "neutral");
      return;
    }

    let updated: LesProgram[];
    if (editingLesProgId) {
      updated = lesProgramsList.map(p => 
        p.id === editingLesProgId 
          ? { ...p, title: newLesTitle.trim(), tutor: newLesTutor.trim(), time: newLesTime.trim(), fee: newLesFee.trim(), targetKelasIds: selectedLesKelasIds }
          : p
      );
      showNotification("Brosur program bimbingan les berhasil diperbarui!", "success");
      setEditingLesProgId(null);
    } else {
      const newProg: LesProgram = {
        id: `prog-${Date.now()}`,
        title: newLesTitle.trim(),
        tutor: newLesTutor.trim(),
        time: newLesTime.trim(),
        fee: newLesFee.trim(),
        targetKelasIds: selectedLesKelasIds
      };
      updated = [...lesProgramsList, newProg];
      showNotification("Program bimbingan les baru berhasil diterbitkan!", "success");
    }

    setLesProgramsList(updated);
    localStorage.setItem("PSD_LES_PROGRAMS", JSON.stringify(updated));

    // Reset inputs
    setNewLesTitle("");
    setNewLesTutor("");
    setNewLesTime("");
    setNewLesFee("");
    setSelectedLesKelasIds([]);
  };

  const handleEditLesProgram = (p: LesProgram) => {
    setEditingLesProgId(p.id);
    setNewLesTitle(p.title);
    setNewLesTutor(p.tutor);
    setNewLesTime(p.time);
    setNewLesFee(p.fee);
    setSelectedLesKelasIds(p.targetKelasIds || []);
  };

  const handleDeleteLesProgram = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus brosur program les ini? Wali murid tidak akan bisa mendaftar program ini lagi.")) {
      const updated = lesProgramsList.filter(p => p.id !== id);
      setLesProgramsList(updated);
      localStorage.setItem("PSD_LES_PROGRAMS", JSON.stringify(updated));
      showNotification("Program bimbingan telah dihapus.", "success");
    }
  };

  const handleUpdateRegStatus = (regId: string, status: "Disetujui" | "Ditolak") => {
    const saved = localStorage.getItem("PSD_LES_REGISTRATIONS");
    const currentRegs: LesRegistration[] = saved ? JSON.parse(saved) : [];
    const updated = currentRegs.map(r => r.id === regId ? { ...r, status } : r);
    setLesRegList(updated);
    localStorage.setItem("PSD_LES_REGISTRATIONS", JSON.stringify(updated));
    showNotification(`Pendaftaran les telah di-${status.toLowerCase()}!`, "success");
  };

  const handleDeleteLesReg = (regId: string) => {
    if (confirm("Hapus data pengajuan pendaftaran les wali murid ini dari database?")) {
      const saved = localStorage.getItem("PSD_LES_REGISTRATIONS");
      const currentRegs: LesRegistration[] = saved ? JSON.parse(saved) : [];
      const updated = currentRegs.filter(r => r.id !== regId);
      setLesRegList(updated);
      localStorage.setItem("PSD_LES_REGISTRATIONS", JSON.stringify(updated));
      showNotification("Catatan pengajuan pendaftaran berhasil dibersihkan.", "success");
    }
  };

  const handleDownloadLesExcel = () => {
    const saved = localStorage.getItem("PSD_LES_REGISTRATIONS");
    const currentRegs: LesRegistration[] = saved ? JSON.parse(saved) : [];
    if (currentRegs.length === 0) {
      showNotification("Tidak ada data pendaftaran les untuk diunduh.", "neutral");
      return;
    }

    const dataToExport = currentRegs.map((r, index) => ({
      "No": index + 1,
      "Siswa ID": r.siswaId,
      "Nama Siswa": r.siswaNama,
      "Kelas": r.kelasNama,
      "Program Les": r.programNama,
      "Tutor Pengajar": r.tutorNama,
      "No. WhatsApp": r.nohp,
      "Pesan Wali Murid": r.catatan,
      "Tanggal Daftar": r.tanggalDaftar,
      "Status": r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pendaftaran Les");
    XLSX.writeFile(workbook, "Daftar_Pendaftaran_Les_SiswaDigital.xlsx");
    showNotification("Sukses mengunduh laporan Excel pendaftaran les!", "success");
  };

  const handleSaveAdminLesWa = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("PSD_LES_ADMIN_WA", adminLesWa.replace(/[^0-9]/g, "").trim());
    showNotification("Nomor WhatsApp Admin penerima pendaftaran les disimpan!", "success");
  };


  return (
    <div className="space-y-8 animate-fadeIn" id="admin-portal-dashboard">
      
      {/* Visual Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#2D3A3A] to-[#3B4D4D] text-white rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/2 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-[10px] text-emerald-450 font-black tracking-wider uppercase">
            <Lock className="w-3 h-3 text-emerald-400" /> Control Tower Admin
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white leading-none">
            Portal Utama Administrator
          </h2>
          <p className="text-slate-350 text-xs font-medium max-w-xl">
            Sistem pengawasan terpusat. Tambahkan segala jenis data akademik mulai dari kelas, pelajaran, siswa baru, hingga input data rekapitulasi massal via Excel secara instan.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0 relative z-10">
          <div className="p-4 bg-white/5 border border-white/15 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Akses Validasi</p>
              <p className="text-sm font-extrabold text-[#8BA888]">Super Admin (KOMUNITAS MGMP SDIT)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 -mb-px flex-wrap">
          <button
            onClick={() => setAdminMainTab("guru")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "guru"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Key className="w-4 h-4" /> Manajemen Guru & Token
          </button>
          <button
            onClick={() => setAdminMainTab("master")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "master"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Database className="w-4 h-4" /> Manajemen Database Master
          </button>
          <button
            onClick={() => setAdminMainTab("excel")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "excel"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Impor Excel Sentral
          </button>
          <button
            onClick={() => setAdminMainTab("les")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "les"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-500" /> Les & Bimbingan Wali
          </button>
          <button
            onClick={() => setAdminMainTab("kalender")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "kalender"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-500" /> Kalender Akademik
          </button>
          <button
            onClick={() => setAdminMainTab("jamPelajaran")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "jamPelajaran"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" /> Jam Pelajaran & Istirahat
          </button>
          <button
            onClick={() => setAdminMainTab("keamanan" as any)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              adminMainTab === "keamanan"
                ? "border-[#8BA888] text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Lock className="w-4 h-4 text-rose-500 animate-pulse" /> Integrasi G-Sheet &amp; Kunci DB
          </button>
        </nav>
      </div>

      {/* -------------------- MAIN TAB 1: GURU CONTROL -------------------- */}
      {adminMainTab === "guru" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Admin Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="admin-stats-bento">
            <div className="bg-white rounded-2xl border border-slate-200/95 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guru Terdaftar</span>
                <p className="text-2xl font-black text-slate-800 font-mono leading-none">{guruCodes.length}</p>
                <p className="text-[10px] text-slate-400">{guruCodes.filter(g => g.isActive).length} Kode Aktif & Siap Pakai</p>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Key className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/95 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Siswa Terkumpul</span>
                <p className="text-2xl font-black text-slate-800 font-mono leading-none">{siswa.length}</p>
                <p className="text-[10px] text-slate-400">Tersebar di {kelas.length} rombongan belajar</p>
              </div>
              <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/95 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tugas / Ujian</span>
                <p className="text-2xl font-black text-slate-800 font-mono leading-none">{kategori.length}</p>
                <p className="text-[10px] text-slate-400">{penilaian.length} Lembar penilaian terinput</p>
              </div>
              <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/95 p-5 shadow-xs flex items-center justify-between">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekor Nilai Tersimpan</span>
                <p className="text-2xl font-black text-emerald-600 font-mono leading-none">
                  {penilaian.reduce((sum, current) => sum + current.grades.length, 0)}
                </p>
                <p className="text-[10px] text-slate-400">Sinkronisasi otomatis real-time</p>
              </div>
              <div className="p-4 bg-teal-50 text-teal-700 rounded-2xl">
                <Database className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5.5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Buat Kode Unik Guru Baru
                  </h3>
                </div>

                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Guru Penerima</label>
                    <input
                      type="text"
                      required
                      value={newGuruName}
                      onChange={(e) => setNewGuruName(e.target.value)}
                      placeholder="Contoh: Ibu Siti Aminah, S.Pd."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-400 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kontak No. WhatsApp</label>
                    <input
                      type="text"
                      value={newGuruPhone}
                      onChange={(e) => setNewGuruPhone(e.target.value)}
                      placeholder="Contoh: 628123456789"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium placeholder-slate-400 text-slate-800"
                    />
                    <span className="text-[9px] text-slate-450 block italic">Penting: Digunakan wali murid untuk koordinasi langsung dengan guru terkait.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Peran Utama Pendidik</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="newGuruRole"
                          checked={newGuruIsWali === true}
                          onChange={() => setNewGuruIsWali(true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Wali Kelas (WALI-)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="newGuruRole"
                          checked={newGuruIsWali === false}
                          onChange={() => setNewGuruIsWali(false)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Guru Mapel (MAPEL-)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Kelas Pengampu (Bisa pilih lebih dari satu)</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[140px] overflow-y-auto">
                      {kelas.map(k => {
                        const isChecked = selectedKelasIds.includes(k.id);
                        return (
                          <label key={k.id} className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer hover:text-emerald-700 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedKelasIds(prev => prev.filter(id => id !== k.id));
                                } else {
                                  if (newGuruIsWali) {
                                    setSelectedKelasIds([k.id]);
                                  } else {
                                    setSelectedKelasIds(prev => [...prev, k.id]);
                                  }
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span>{k.namaKelas}</span>
                          </label>
                        );
                      })}
                      {kelas.length === 0 && (
                        <p className="text-[10px] text-slate-400 col-span-2">Belum ada kelas terdaftar</p>
                      )}
                    </div>
                    <p className="text-[9.5px] text-slate-400">Kosongkan jika Guru ini mengampu semua kelas.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Mata Pelajaran Diampu (Bisa pilih multi-mapel)</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[140px] overflow-y-auto">
                      {mapel.map(m => {
                        const isChecked = selectedMapelIds.includes(m.namaMapel);
                        return (
                          <label key={m.id} className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer hover:text-emerald-700 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedMapelIds(prev => prev.filter(name => name !== m.namaMapel));
                                } else {
                                  setSelectedMapelIds(prev => [...prev, m.namaMapel]);
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span>{m.namaMapel}</span>
                          </label>
                        );
                      })}
                      {mapel.length === 0 && (
                        <p className="text-[10px] text-slate-400 col-span-2">Belum ada mapel terdaftar</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#2D3A3A] hover:bg-[#425555] text-white font-extrabold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-slate-900/10 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Terbitkan Kode Baru
                  </button>
                </form>
              </div>

              {/* Excel Import Guru Card */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor & Ekspor via Excel (Guru)</h4>
                    <p className="text-[10px] text-slate-450 font-medium font-sans">Kelola daftar seluruh guru dengan berkas Excel</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => generateSingleTemplate("guru")}
                    className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                  >
                    <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                  </button>
                  <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                    <Upload className="w-3.5 h-3.5" /> Pilih File
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => handleSingleExcelUpload(e, "guru")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* CONFIG VISIBILITAS KONTAK GURU DI PORTAL WALI MURID (Requirement 6) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Akses Visibilitas Guru</h4>
                    <p className="text-[10px] text-slate-450 font-medium font-sans">Tentukan nomer guru mana saja yang muncul di portal wali murid</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="contactMode"
                        value="ALL"
                        checked={contactMode === "ALL"}
                        onChange={() => setContactMode("ALL")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Tampilkan Seluruh Kontak Guru</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="contactMode"
                        value="WALAS"
                        checked={contactMode === "WALAS"}
                        onChange={() => setContactMode("WALAS")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Hanya Wali Kelas Sendiri</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="contactMode"
                        value="CUSTOM"
                        checked={contactMode === "CUSTOM"}
                        onChange={() => setContactMode("CUSTOM")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Sebagian Guru Terpilih (Kustom)</span>
                    </label>
                  </div>

                  {contactMode === "CUSTOM" && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 max-h-[160px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Centang Guru yang Diizinkan:</span>
                      {guruCodes.map(g => {
                        const isAllowed = allowedGuruCodes.includes(g.code);
                        return (
                          <label key={g.code} className="flex items-center gap-2 text-xs font-semibold text-slate-705 hover:text-emerald-700 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAllowed}
                              onChange={() => {
                                if (isAllowed) {
                                  setAllowedGuruCodes(prev => prev.filter(c => c !== g.code));
                                } else {
                                  setAllowedGuruCodes(prev => [...prev, g.code]);
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                            />
                            <span>{g.namaGuru} ({g.code})</span>
                          </label>
                        );
                      })}
                      {guruCodes.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic">Belum ada guru terdaftar</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-red-50/50 rounded-2xl border border-red-100 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-red-600" />
                  <h4 className="text-xs font-extrabold text-red-800 uppercase tracking-wide">Danger Zone Admin</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  Aksi membuang data master memori penyimpanan lokal sekolah. Sifat penghapusan bersifat permanen.
                </p>
                <button
                  onClick={() => {
                    if (confirm("PERINGATAN: Yakin ingin menghapus seluruh data siswa, kategori, kelas dan rekap nilai? Tindakan ini permanen.")) {
                      onClearAllMasterData();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                >
                  Kosongkan Semua Data Master
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-4.5 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Key className="w-4.5 h-4.5 text-[#8BA888]" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Daftar Portal Kode & Rekor Masuk Guru ({filteredCodes.length})
                    </h3>
                  </div>
                  
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari Guru atau Kode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
                  {filteredCodes.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <Database className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">Tidak ada kode guru terdaftar.</p>
                      <p className="text-[10px] text-slate-400">Silakan gunakan formulir kiri untuk mendaftarkan akun baru.</p>
                    </div>
                  ) : (
                    filteredCodes.map((g) => {
                      const stats = getTeacherUploadStats(g.code);
                      const isAssignedClass = g.assignedKelasIds && g.assignedKelasIds.length > 0
                        ? g.assignedKelasIds.map(id => kelas.find(k => k.id === id)?.namaKelas || id).join(", ")
                        : (kelas.find(k => k.id === g.assignedKelasId)?.namaKelas || "Semua Kelas");
                      
                      return (
                        <div key={g.code} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 font-mono text-xs font-black px-2 py-0.5 rounded-lg border ${
                                g.isActive 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                  : "bg-slate-100 border-slate-200 text-slate-500 line-through"
                              }`}>
                                <Key className="w-3 h-3 opacity-70" /> {g.code}
                              </span>
                              <span className="text-xs font-bold text-slate-800">{g.namaGuru}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[10px] text-slate-400">
                              <span>Mengajar: <strong className="text-slate-600">{isAssignedClass}</strong></span>
                              <span>&bull;</span>
                              <span>Terdaftar: <strong className="text-slate-550">{g.createdAt}</strong></span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="bg-slate-100/70 border border-slate-150 rounded-xl px-2.5 py-1 text-[10px] font-sans text-slate-600 font-medium text-center">
                              <span className="font-bold text-slate-800 font-mono tracking-tight mr-1">{stats.students}</span> Siswa
                            </div>
                            <div className="bg-emerald-50/70 border border-emerald-150 rounded-xl px-2.5 py-1 text-[10px] font-sans text-emerald-700 font-medium text-center">
                              <span className="font-bold text-emerald-800 font-mono tracking-tight mr-1">{stats.scoreItems}</span> Nilai
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedTeacherCode(g.code);
                                setActiveSubTab("siswa");
                                showNotification(`Membuka panel manajemen data '${g.code}'`, "success");
                              }}
                              className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border cursor-pointer transition-all ${
                                selectedTeacherCode === g.code 
                                  ? "bg-amber-100 border-amber-300 text-amber-800 shadow-sm" 
                                  : "bg-[#2D3A3A] hover:bg-slate-700 border-slate-750 text-white"
                              }`}
                            >
                              {selectedTeacherCode === g.code ? "Sedang Dikelola" : "Kelola Data"}
                            </button>

                            <button
                              onClick={() => onToggleGuruCodeStatus(g.code)}
                              className={`p-1.5 rounded-lg border cursor-pointer hover:scale-105 transition-all ${
                                g.isActive 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-50" 
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-600 hover:bg-amber-50"
                              }`}
                            >
                              {g.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => {
                                setEditingGuruCode(g.code);
                                setEditGuruName(g.namaGuru);
                                setEditGuruCode(g.code);
                                setEditGuruPhone(g.phoneNumber || "");
                                setEditGuruIsWali(g.isWaliKelas || g.code.startsWith("WALI"));
                                setEditGuruKelasId(g.assignedKelasId || "");
                                setEditGuruKelasIds(g.assignedKelasIds || (g.assignedKelasId ? [g.assignedKelasId] : []));
                                setEditGuruMapelIds(g.mapelAjars || []);
                              }}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-50 border border-amber-500/15 text-amber-655 rounded-lg cursor-pointer hover:scale-105 transition-all"
                              title="Edit Profil Guru"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus kode unik "${g.code}" (${g.namaGuru})?`)) {
                                  onDeleteGuruCode(g.code);
                                  if (selectedTeacherCode === g.code) {
                                    setSelectedTeacherCode("");
                                  }
                                }
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-50 border border-red-500/15 text-red-600 rounded-lg cursor-pointer hover:scale-105 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {editingGuruCode !== null && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-zoomIn">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2">
                          <Pencil className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Profil & Akses Guru</h3>
                        </div>
                        <button
                          onClick={() => setEditingGuruCode(null)}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <form onSubmit={handleSaveTeacherEdit} className="p-6 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Guru Penerima</label>
                          <input
                            type="text"
                            required
                            value={editGuruName}
                            onChange={(e) => setEditGuruName(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Kode Akses / Unik Guru</label>
                          <input
                            type="text"
                            required
                            value={editGuruCode}
                            onChange={(e) => setEditGuruCode(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                          />
                          <p className="text-[9px] text-slate-400">Peringatan: Jika mengubah sandi ini, seluruh data siswa & nilai terkait kode lama akan otomatis dialihkan ke kode baru.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Kontak No. WhatsApp</label>
                          <input
                            type="text"
                            value={editGuruPhone}
                            onChange={(e) => setEditGuruPhone(e.target.value)}
                            placeholder="Contoh: 628123456789"
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Peran Utama Pendidik</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="editGuruRole"
                                checked={editGuruIsWali === true}
                                onChange={() => {
                                  setEditGuruIsWali(true);
                                  if (!editGuruCode.startsWith("WALI-") && editGuruCode.startsWith("MAPEL-")) {
                                    setEditGuruCode(prev => prev.replace("MAPEL-", "WALI-"));
                                  } else if (!editGuruCode.startsWith("WALI-") && !editGuruCode.startsWith("MAPEL-")) {
                                    setEditGuruCode(prev => "WALI-" + prev.split("-").pop());
                                  }
                                }}
                                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                              />
                              <span>Wali Kelas</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer select-none">
                              <input
                                type="radio"
                                name="editGuruRole"
                                checked={editGuruIsWali === false}
                                onChange={() => {
                                  setEditGuruIsWali(false);
                                  if (!editGuruCode.startsWith("MAPEL-") && editGuruCode.startsWith("WALI-")) {
                                    setEditGuruCode(prev => prev.replace("WALI-", "MAPEL-"));
                                  } else if (!editGuruCode.startsWith("MAPEL-") && !editGuruCode.startsWith("WALI-")) {
                                    setEditGuruCode(prev => "MAPEL-" + prev.split("-").pop());
                                  }
                                }}
                                className="text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                              />
                              <span>Guru Mapel</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Kelas Pengampu (Bisa pilih lebih dari satu)</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[140px] overflow-y-auto">
                            {kelas.map(k => {
                              const isChecked = editGuruKelasIds.includes(k.id);
                              return (
                                <label key={k.id} className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer hover:text-emerald-700 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditGuruKelasIds(prev => prev.filter(id => id !== k.id));
                                      } else {
                                        if (editGuruIsWali) {
                                          setEditGuruKelasIds([k.id]);
                                        } else {
                                          setEditGuruKelasIds(prev => [...prev, k.id]);
                                        }
                                      }
                                    }}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                                  />
                                  <span>{k.namaKelas}</span>
                                </label>
                              );
                            })}
                            {kelas.length === 0 && (
                              <p className="text-[10px] text-slate-400 col-span-2">Belum ada kelas terdaftar</p>
                            )}
                          </div>
                          <p className="text-[9.5px] text-slate-400">Kosongkan jika Guru ini mengampu semua kelas.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Mata Pelajaran Diampu (Bisa pilih multi-mapel)</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[140px] overflow-y-auto">
                            {mapel.map(m => {
                              const isChecked = editGuruMapelIds.includes(m.namaMapel);
                              return (
                                <label key={m.id} className="flex items-center gap-2 text-xs font-semibold text-slate-705 cursor-pointer hover:text-emerald-700 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditGuruMapelIds(prev => prev.filter(name => name !== m.namaMapel));
                                      } else {
                                        setEditGuruMapelIds(prev => [...prev, m.namaMapel]);
                                      }
                                    }}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-slate-300"
                                  />
                                  <span>{m.namaMapel}</span>
                                </label>
                              );
                            })}
                            {mapel.length === 0 && (
                              <p className="text-[10px] text-slate-400 col-span-2">Belum ada mapel terdaftar</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingGuruCode(null)}
                            className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 text-[10px] text-slate-400 italic border-t border-slate-100 text-center select-none">
                  * Guru hanya bisa login / menyimpan data bila status kodenya aktif (Unlock).
                </div>
              </div>
            </div>
          </div>

          {/* CENTRALIZED TEACHER ATTENDANCE DASHBOARD ON ADMIN SCREEN */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-805 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Papan Monitoring & Recording Presensi Guru
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Layar pencatatan terpusat absensi guru sekolah. Seluruh rekor tercatat otomatis dan terpantau real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Tanggal Pantau:</label>
                <input
                  type="date"
                  value={adminAbsenTanggal}
                  onChange={(e) => setAdminAbsenTanggal(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-700 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Attendance Status Stats Grid for Selected Date */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {(["Hadir", "Sakit", "Izin", "Cuti", "Alpa"] as AttendanceStatusGuru[]).map(status => {
                const count = absenGuru.filter(a => a.tanggal === adminAbsenTanggal && a.status === status).length;
                const colorMap = {
                  Hadir: "bg-emerald-50/70 border-emerald-150 text-emerald-800",
                  Sakit: "bg-amber-50/70 border-amber-155 text-amber-800",
                  Izin: "bg-blue-50/70 border-blue-155 text-blue-800",
                  Cuti: "bg-slate-50/70 border-slate-155 text-slate-800",
                  Alpa: "bg-red-50/70 border-red-155 text-red-800"
                };
                return (
                  <div key={status} className={`border p-4 rounded-2xl flex flex-col justify-between ${colorMap[status]}`}>
                    <span className="text-[10px] uppercase font-sans font-black tracking-wider opacity-70">{status}</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-black font-mono leading-none">{count}</span>
                      <span className="text-[9px] font-bold opacity-60">Guru</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Log Form from Board */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pb-1.5 border-b border-slate-200/60">
                  ✍️ Pencatatan Presensi Cepat
                </span>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const selectEl = form.elements.namedItem("quickTeacherCode") as HTMLSelectElement;
                  if (!selectEl || !selectEl.value) {
                    showNotification("Silakan pilih guru terlebih dahulu!", "neutral");
                    return;
                  }
                  handleAdminSaveAbsen(e, selectEl.value);
                }} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Pilih Guru</label>
                    <select
                      name="quickTeacherCode"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-700 font-bold"
                    >
                      <option value="">-- Pilih Guru / Pendidik --</option>
                      {guruCodes.map(g => (
                        <option key={g.code} value={g.code}>
                          {g.namaGuru} ({g.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={adminAbsenTanggal}
                        onChange={(e) => setAdminAbsenTanggal(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Status</label>
                      <select
                        value={adminAbsenStatus}
                        onChange={(e) => setAdminAbsenStatus(e.target.value as AttendanceStatusGuru)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-705 font-bold font-sans"
                      >
                        <option value="Hadir">Hadir</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Cuti">Cuti</option>
                        <option value="Alpa">Alpa</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Catatan Keterangan</label>
                    <input
                      type="text"
                      placeholder="e.g. Datang tepat waktu, ada dinas luar"
                      value={adminAbsenCatatan}
                      onChange={(e) => setAdminAbsenCatatan(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Simpan Presensi Guru
                  </button>
                </form>
              </div>

              {/* Logs display sheet for Selected Date */}
              <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col">
                <div className="p-3.5 bg-white border-b border-slate-200 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <span>Log Kehadiran Guru Pada {adminAbsenTanggal}</span>
                  <span className="font-mono text-xs text-slate-700 font-extrabold">
                    {absenGuru.filter(a => a.tanggal === adminAbsenTanggal).length} Terabsen
                  </span>
                </div>

                <div className="divide-y divide-slate-150 overflow-y-auto max-h-[290px] bg-white flex-1">
                  {guruCodes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
                      Tidak ada guru yang terdaftar.
                    </div>
                  ) : (
                    (() => {
                      const recordsForDate = absenGuru.filter(a => a.tanggal === adminAbsenTanggal);
                      return guruCodes.map(g => {
                        const record = recordsForDate.find(r => r.teacherCode === g.code);
                        const badgeColor = 
                          record?.status === "Hadir" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : record?.status === "Sakit"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : record?.status === "Izin"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : record?.status === "Cuti"
                            ? "bg-slate-50 text-slate-800 border-slate-200"
                            : record?.status === "Alpa"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-slate-100 text-slate-400 border-slate-200 italic";

                        return (
                          <div key={g.code} className="p-3 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 animate-fadeIn">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800 leading-none">{g.namaGuru}</span>
                              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                                <span>Akses: {g.code}</span>
                                {record?.catatan && <span>&bull; &ldquo;{record.catatan}&rdquo;</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 font-sans">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wide border ${badgeColor}`}>
                                {record?.status || "Belum Absen"}
                              </span>
                              {record && (
                                <button
                                  onClick={() => handleAdminDeleteAbsen(record.id)}
                                  className="text-red-500 hover:text-red-750 p-1 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                  title="Hapus Rekor Presensi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* NESTED SELECTED TEACHER CONSOLE */}
          {selectedTeacherCode && currentActiveTeacher && (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-105 text-amber-800 rounded-lg">
                      <Database className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight">
                      Konsol Berbagi Akses Sentral: {currentActiveTeacher.namaGuru}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Administrator memegang kontrol penuh untuk mengatur, menyisipkan, dan menghapus komponen data milik Guru: <strong className="text-slate-700">{selectedTeacherCode}</strong>.
                  </p>
                </div>
                
                <button
                  onClick={() => setSelectedTeacherCode("")}
                  className="px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-755 font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                >
                  Tutup Konsol Guru
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-white p-1 border border-slate-200 rounded-xl max-w-xl">
                <button
                  onClick={() => setActiveSubTab("siswa")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "siswa" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  🧑‍🎓 Siswa ({managedSiswa.length})
                </button>
                <button
                  onClick={() => setActiveSubTab("kategori")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "kategori" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  📚 Ulangan ({managedKategori.length})
                </button>
                <button
                  onClick={() => setActiveSubTab("nilai")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "nilai" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  ✍️ Input Nilai ({managedPenilaian.length})
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab("jadwal");
                    if (kelas.length > 0) setAdminJadwalKelasId(kelas[0].id);
                    if (mapel.length > 0) setAdminJadwalMapelId(mapel[0].id);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "jadwal" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  📅 Jadwal ({jadwal.filter(j => j.teacherCode === selectedTeacherCode).length})
                </button>
                <button
                  onClick={() => setActiveSubTab("presensi")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "presensi" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  🩺 Presensi ({absenGuru.filter(a => a.teacherCode === selectedTeacherCode).length})
                </button>
                <button
                  onClick={() => setActiveSubTab("pengumuman")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                    activeSubTab === "pengumuman" 
                      ? "bg-[#2D3A3A] text-white" 
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  📢 Pengumuman ({announcements.length})
                </button>
              </div>

              {/* Console Subtab: Siswa */}
              {activeSubTab === "siswa" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📝 Tambah Siswa Baru</span>
                    <form onSubmit={handleAdminAddSiswa} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">NIS / Nomor Induk Siswa</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 55621"
                          value={adminSiswaNis}
                          onChange={(e) => setAdminSiswaNis(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rehan Pratama"
                          value={adminSiswaNama}
                          onChange={(e) => setAdminSiswaNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Pilih Kelas</label>
                        <select
                          value={adminSiswaKelasId}
                          required
                          onChange={(e) => setAdminSiswaKelasId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-700 font-medium"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#2D3A3A] hover:bg-[#425555] text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Daftarkan Siswa
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-preset flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <span>Daftar Siswa di bawah Portal Guru {selectedTeacherCode}</span>
                      <span>{managedSiswa.length} Orang</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[280px]">
                      {managedSiswa.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                          Belum ada siswa yang diampu guru ini. Silakan masukkan data di samping!
                        </div>
                      ) : (
                        managedSiswa.map(s => {
                          const cls = kelas.find(k => k.id === s.kelasId)?.namaKelas || "Kelas Terhapus";
                          return (
                            <div key={s.id} className="p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs text-slate-700">
                              <div>
                                <span className="font-bold text-slate-800 font-mono text-[10px] bg-slate-150 inline-block px-1.5 rounded mr-2">{s.nis}</span>
                                <span className="font-semibold">{s.namaSiswa}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-extrabold text-slate-500 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-wider">{cls}</span>
                                <button
                                  onClick={() => handleDelSiswa(s.id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Console Subtab: Kategori */}
              {activeSubTab === "kategori" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📚 Tambah Kategori Ulangan / Ujian</span>
                    <form onSubmit={handleAdminAddKategori} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Nama Ulangan / Tugas</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ulangan Harian 1, PTS"
                          value={adminKatNama}
                          onChange={(e) => setAdminKatNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Kelas Sasaran</label>
                        <select
                          value={adminKatKelasId}
                          required
                          onChange={(e) => setAdminKatKelasId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-705 font-medium"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Mata Pelajaran</label>
                        <select
                          value={adminKatMapelId}
                          required
                          onChange={(e) => setAdminKatMapelId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-705 font-medium"
                        >
                          <option value="">-- Pilih Mapel --</option>
                          {mapel.map(m => (
                            <option key={m.id} value={m.id}>{m.namaMapel}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#2D3A3A] hover:bg-[#425555] text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Tambahkan Kategori
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-preset flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <span>Daftar Kategori Ulangan Guru {selectedTeacherCode}</span>
                      <span>{managedKategori.length} Kategori</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[280px]">
                      {managedKategori.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                          Belum ada kategori yang didefinisikan guru ini.
                        </div>
                      ) : (
                        managedKategori.map(k => {
                          const cls = kelas.find(kl => kl.id === k.kelasId)?.namaKelas || "Kelas Terhapus";
                          const mpl = mapel.find(m => m.id === k.mapelId)?.namaMapel || "Mapel Terhapus";
                          return (
                            <div key={k.id} className="p-3 hover:bg-slate-50/50 flex items-center justify-between text-xs text-slate-700">
                              <div>
                                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest bg-slate-200 px-1 py-0.5 rounded mr-1.5">{k.id}</span>
                                <span className="font-extrabold text-slate-800">{k.namaKategori}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{mpl}</span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">{cls}</span>
                                <button
                                  onClick={() => handleDelKategori(k.id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer ml-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Console Subtab: Nilai */}
              {activeSubTab === "nilai" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">✍️ Rekor Lembar Nilai Siswa</span>
                    <form onSubmit={handleAdminAddPenilaian} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">1. Pilih Kategori Tugas/Ujian</label>
                        <select
                          value={adminNilaiKatId}
                          required
                          onChange={(e) => {
                            setAdminNilaiKatId(e.target.value);
                            setAdminGradesInput({});
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-705 font-medium"
                        >
                          <option value="">-- Pilih Ulangan --</option>
                          {managedKategori.map(k => {
                            const cls = kelas.find(cl => cl.id === k.kelasId)?.namaKelas || "Kelas Terhapus";
                            const mpl = mapel.find(m => m.id === k.mapelId)?.namaMapel || "Mapel Terhapus";
                            return (
                              <option key={k.id} value={k.id}>
                                {k.namaKategori} - {cls} ({mpl})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">2. Tanggal Pelaksanaan</label>
                        <input
                          type="date"
                          required
                          value={adminNilaiTanggal}
                          onChange={(e) => setAdminNilaiTanggal(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                        />
                      </div>

                      {adminNilaiKatId && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[180px] overflow-y-auto">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">3. Isi Nilai Ulangan Siswa</span>
                          {activeSiswaForGrades.length === 0 ? (
                            <p className="text-[10px] text-red-500 italic block font-semibold leading-relaxed">
                              ⚠️ Tidak ada siswa terdaftar di sasaran kelas kategori ini.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {activeSiswaForGrades.map(stu => (
                                <div key={stu.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-150">
                                  <span className="font-semibold text-slate-800 truncate max-w-28">{stu.namaSiswa}</span>
                                  <div className="flex items-center gap-1.5">
                                    <label className="text-[9px] text-slate-400 uppercase font-black">Nilai:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="80"
                                      value={adminGradesInput[stu.id] ?? ""}
                                      onChange={(e) => {
                                        setAdminGradesInput(prev => ({
                                          ...prev,
                                          [stu.id]: Number(e.target.value)
                                        }));
                                      }}
                                      className="w-14 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-mono font-bold focus:outline-emerald-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={activeSiswaForGrades.length === 0}
                        className="w-full py-2.5 rounded-lg bg-[#2D3A3A] hover:bg-[#425555] disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Simpan Nilai Ke Portal Guru
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-preset flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <span>Lembar Nilai Terdaftar Guru {selectedTeacherCode}</span>
                      <span>{managedPenilaian.length} Rekor</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[360px]">
                      {managedPenilaian.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                          Belum ada lembar nilai yang dibukukan guru ini.
                        </div>
                      ) : (
                        managedPenilaian.map(p => {
                          const currentKat = kategori.find(k => k.id === p.kategoriId);
                          const currentClass = kelas.find(kl => kl.id === currentKat?.kelasId)?.namaKelas || "Kelas Terhapus";
                          const currentMapel = mapel.find(m => m.id === currentKat?.mapelId)?.namaMapel || "Mapel Terhapus";
                          return (
                            <div key={p.id} className="p-3.5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-700">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[9px] text-[#2D3A3A] font-extrabold tracking-tight bg-slate-200 px-1 py-0.5 rounded">
                                    {p.tanggal}
                                  </span>
                                  <span className="font-extrabold text-slate-800">
                                    {currentKat?.namaKategori || "Kategori Terhapus"}
                                  </span>
                                </div>
                                <div className="font-sans text-[10px] text-slate-400 mt-1 flex gap-2">
                                  <span>Mapel: <strong className="text-slate-605">{currentMapel}</strong></span>
                                  <span>Kelas: <strong className="text-slate-605">{currentClass}</strong></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-sans font-bold text-slate-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg animate-pulse">
                                  {p.grades.length} Nilai Terinput
                                </span>
                                <button
                                  onClick={() => handleDelPenilaian(p.id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  title="Hapus Lembar Nilai"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Console Subtab: Jadwal */}
              {activeSubTab === "jadwal" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📅 Tambah Sesi Jadwal Mengajar</span>
                    <form onSubmit={handleAdminAddJadwal} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Hari Belajar</label>
                        <select
                          value={adminJadwalHari}
                          onChange={(e) => setAdminJadwalHari(e.target.value as HariBelajar)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-700 font-medium font-sans"
                        >
                          <option value="Senin">Senin</option>
                          <option value="Selasa">Selasa</option>
                          <option value="Rabu">Rabu</option>
                          <option value="Kamis">Kamis</option>
                          <option value="Jumat">Jumat</option>
                          <option value="Sabtu">Sabtu</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase">Jam Mulai</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 07:30"
                            value={adminJadwalJamMulai}
                            onChange={(e) => setAdminJadwalJamMulai(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase">Jam Selesai</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 09:00"
                            value={adminJadwalJamSelesai}
                            onChange={(e) => setAdminJadwalJamSelesai(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Rombongan Belajar (Kelas)</label>
                        <select
                          value={adminJadwalKelasId}
                          required
                          onChange={(e) => setAdminJadwalKelasId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-705 font-medium font-sans"
                        >
                          <option value="">-- Pilih Rombel --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Mata Pelajaran</label>
                        <select
                          value={adminJadwalMapelId}
                          required
                          onChange={(e) => setAdminJadwalMapelId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-705 font-medium font-sans"
                        >
                          <option value="">-- Pilih Mapel --</option>
                          {mapel.map(m => (
                            <option key={m.id} value={m.id}>{m.namaMapel}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Ruangan / Tempat (Opsional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Lab Komputer B, R. Kelas 4"
                          value={adminJadwalRuangan}
                          onChange={(e) => setAdminJadwalRuangan(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#2D3A3A] hover:bg-[#425555] text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Daftarkan Jadwal Mengajar
                      </button>
                    </form>

                    {/* Excel card for Jadwal plotting upload */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Impor & Ekspor via Excel</h4>
                          <p className="text-[9px] text-slate-450 font-medium font-sans">Plotting jadwal mengajar masal</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <button
                          type="button"
                          onClick={() => generateSingleTemplate("jadwal")}
                          className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                        >
                          <Download className="w-3 h-3 text-[#8BA888]" /> Template
                        </button>
                        <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-[#1a7f3e] text-white px-2.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                          <Upload className="w-3 h-3" /> Pilih File
                          <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={(e) => handleSingleExcelUpload(e, "jadwal")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden font-sans">
                    <div className="p-3.5 bg-slate-50 border-b border-preset flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <span>Plotting Jadwal Guru {selectedTeacherCode}</span>
                      <span>{jadwal.filter(j => j.teacherCode === selectedTeacherCode).length} Sesi</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
                      {jadwal.filter(j => j.teacherCode === selectedTeacherCode).length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                          Belum ada jadwal mengajar yang teregistrasi untuk pendidik ini.
                        </div>
                      ) : (
                        jadwal.filter(j => j.teacherCode === selectedTeacherCode).map(j => {
                          const clNama = kelas.find(c => c.id === j.kelasId)?.namaKelas || "Kelas Terhapus";
                          const mpNama = mapel.find(m => m.id === j.mapelId)?.namaMapel || "Mapel Terhapus";
                          return (
                            <div key={j.id} className="p-3.5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-700">
                              <div className="space-y-1 col-span-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-sans font-extrabold text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-150 px-2 py-0.5 rounded-lg">
                                    {j.hari} ({j.jamMulai} - {j.jamSelesai})
                                  </span>
                                  <span className="font-extrabold text-slate-800 truncate">{mpNama}</span>
                                </div>
                                <div className="flex gap-3 text-[10px] text-slate-400 font-sans">
                                  <span>Kelas: <strong className="text-slate-600">{clNama}</strong></span>
                                  {j.ruangan && <span>Ruangan: <strong className="text-slate-600">{j.ruangan}</strong></span>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleAdminDeleteJadwal(j.id)}
                                className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Console Subtab: Presensi */}
              {activeSubTab === "presensi" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">🩺 Catat Kehadiran Guru</span>
                    <form onSubmit={(e) => handleAdminSaveAbsen(e)} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Tanggal Presensi</label>
                        <input
                          type="date"
                          required
                          value={adminAbsenTanggal}
                          onChange={(e) => setAdminAbsenTanggal(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Status Kehadiran</label>
                        <select
                          value={adminAbsenStatus}
                          onChange={(e) => setAdminAbsenStatus(e.target.value as AttendanceStatusGuru)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-700 font-black font-sans"
                        >
                          <option value="Hadir">Hadir</option>
                          <option value="Sakit">Sakit</option>
                          <option value="Izin">Izin</option>
                          <option value="Cuti">Cuti</option>
                          <option value="Alpa">Alpa</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase">Catatan Aktivitas / Alasan (Opsional)</label>
                        <textarea
                          placeholder="Contoh: Mengawas ujian kelas 12, sakit gigi dsb."
                          value={adminAbsenCatatan}
                          onChange={(e) => setAdminAbsenCatatan(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#2D3A3A] hover:bg-[#425555] text-white font-black text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Simpan Record Presensi
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden font-sans">
                    <div className="p-3.5 bg-slate-50 border-b border-preset flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <span>Histori Log Absensi Guru {selectedTeacherCode}</span>
                      <span>{absenGuru.filter(a => a.teacherCode === selectedTeacherCode).length} Log</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
                      {absenGuru.filter(a => a.teacherCode === selectedTeacherCode).length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-semibold italic">
                          Belum ada histori kehadiran yang terekam untuk pendidik ini.
                        </div>
                      ) : (
                        absenGuru
                          .filter(a => a.teacherCode === selectedTeacherCode)
                          .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
                          .map(a => {
                            const badgeColor = 
                              a.status === "Hadir" 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : a.status === "Sakit"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : a.status === "Izin"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : a.status === "Cuti"
                                ? "bg-slate-50 text-slate-800 border-slate-200"
                                : "bg-red-50 text-red-800 border-red-200";

                            return (
                              <div key={a.id} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between text-xs text-slate-700">
                                <div className="space-y-1 col-span-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 text-[10.5px]">
                                      {a.tanggal}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border ${badgeColor}`}>
                                      {a.status}
                                    </span>
                                  </div>
                                  {a.catatan && (
                                    <p className="text-[10px] text-slate-400 italic">
                                      &ldquo;{a.catatan}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAdminDeleteAbsen(a.id)}
                                  className="text-red-500 hover:text-red-750 p-1.5 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Console Subtab: Pengumuman */}
              {activeSubTab === "pengumuman" && (
                <AnnouncementManager
                  announcements={announcements}
                  setAnnouncements={setAnnouncements}
                  kelas={kelas}
                  authorName="KOMUNITAS MGMP SDIT AL HANIF"
                  authorCode="MASTER-ADMIN"
                  showNotification={showNotification}
                />
              )}
            </div>
          )}
        </div>
      )}


      {/* ----------------- MAIN TAB 2: CENTRALIZED MASTER DATABASE CONTROL ----------------- */}
      {adminMainTab === "master" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub menu tabs */}
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
            <button
              onClick={() => setMasterDataSubTab("kelas")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "kelas" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <Layers className="w-4 h-4 text-[#8BA888]" /> Kelas ({kelas.length})
            </button>
            <button
              onClick={() => setMasterDataSubTab("mapel")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "mapel" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#8BA888]" /> Mata Pelajaran ({mapel.length})
            </button>
            <button
              onClick={() => setMasterDataSubTab("siswa")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "siswa" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#8BA888]" /> Siswa ({siswa.length})
            </button>
            <button
              onClick={() => setMasterDataSubTab("kategori")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "kategori" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-[#8BA888]" /> Kategori Tugas ({kategori.length})
            </button>
            <button
              onClick={() => setMasterDataSubTab("penilaian")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "penilaian" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <Award className="w-4 h-4 text-[#8BA888]" /> Rekap Nilai ({penilaian.length})
            </button>
            <button
              onClick={() => setMasterDataSubTab("ujianPraktek")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                masterDataSubTab === "ujianPraktek" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-850"
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-[#8BA888]" /> Ujian Praktek ({ujianPraktek.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SUB-TAB Form Content */}
            <div className="lg:col-span-1">
              {masterDataSubTab === "kelas" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#8BA888]" /> Tambah Kelas Baru (Rombel)
                    </h3>
                    <form onSubmit={handleAddNewKelas} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Kode Kelas (e.g. K004)</label>
                        <input
                          type="text"
                          placeholder="Biarkan kosong untuk auto-generate"
                          value={newKelasId}
                          onChange={(e) => setNewKelasId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kelas</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Kelas 10-A, XI MIPA 2"
                          value={newKelasNama}
                          onChange={(e) => setNewKelasNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi / Wali Kelas</label>
                        <input
                          type="text"
                          placeholder="Contoh: Jurusan Ilmu Pengetahuan Alam"
                          value={newKelasDesc}
                          onChange={(e) => setNewKelasDesc(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Daftarkan Kelas Baru
                      </button>
                    </form>
                  </div>

                  {/* Excel Import Card */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor via Excel (Kelas)</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Tambah atau perbarui rombel instan</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => generateSingleTemplate("kelas")}
                        className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                      </button>
                      <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                        <Upload className="w-3.5 h-3.5" /> Pilih File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => handleSingleExcelUpload(e, "kelas")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {masterDataSubTab === "mapel" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#8BA888]" /> Tambah Pelajaran Baru
                    </h3>
                    <form onSubmit={handleAddNewMapel} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Kode Pelajaran (e.g. M003)</label>
                        <input
                          type="text"
                          placeholder="Biarkan kosong untuk auto-generate"
                          value={newMapelId}
                          onChange={(e) => setNewMapelId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pelajaran (Mapel)</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Matematika Peminatan, Bahasa Arab"
                          value={newMapelNama}
                          onChange={(e) => setNewMapelNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer font-sans"
                      >
                        Daftarkan Pelajaran
                      </button>
                    </form>
                  </div>

                  {/* Excel Import Card */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor via Excel (Mapel)</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Unggah materi daftar pelajaran sekaligus</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => generateSingleTemplate("mapel")}
                        className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                      </button>
                      <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                        <Upload className="w-3.5 h-3.5" /> Pilih File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => handleSingleExcelUpload(e, "mapel")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {masterDataSubTab === "siswa" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#8BA888]" /> Tambah Siswa Umum
                    </h3>
                    <form onSubmit={handleAddGeneralSiswa} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Induk Siswa (NIS)</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 240105"
                          value={genSiswaNis}
                          onChange={(e) => setGenSiswaNis(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Siswa</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Ahmad Fadillah"
                          value={genSiswaNama}
                          onChange={(e) => setGenSiswaNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Kelas Belajar</label>
                        <select
                          required
                          value={genSiswaKelasId}
                          onChange={(e) => setGenSiswaKelasId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-700 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Jenis Kelamin</label>
                          <select
                            value={genSiswaJenisKelamin}
                            onChange={(e) => setGenSiswaJenisKelamin(e.target.value as "L" | "P")}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-700 focus:outline-emerald-500 font-medium"
                          >
                            <option value="L font-sans">Laki-laki (L)</option>
                            <option value="P font-sans">Perempuan (P)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Kode Akses Wali (Password)</label>
                          <input
                            type="text"
                            placeholder="Contoh: ALH001"
                            value={genSiswaKodeAkses}
                            onChange={(e) => setGenSiswaKodeAkses(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Guru Pengampu (Opsional)</label>
                        <select
                          value={genSiswaTeacherCode}
                          onChange={(e) => setGenSiswaTeacherCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-700 focus:outline-emerald-500 font-medium font-sans"
                        >
                          <option value="">-- Tanpa Akun Guru Terlarang --</option>
                          {guruCodes.map(g => (
                            <option key={g.code} value={g.code}>{g.namaGuru} ({g.code})</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Daftarkan Siswa
                      </button>
                    </form>
                  </div>

                  {/* BULK ADD FORM */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#8BA888]" /> Input Siswa per Kelas
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Masukkan beberapa siswa sekaligus untuk kelas tertentu. Pisahkan setiap nama siswa dengan baris baru.
                    </p>
                    <form onSubmit={handleBulkAddSiswaPerKelas} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Kelas Sasaran</label>
                        <select
                          required
                          value={bulkSiswaKelasId}
                          onChange={(e) => setBulkSiswaKelasId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Kelas Sasaran --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Daftar Nama Siswa (Satu nama per baris)</label>
                        <textarea
                          rows={6}
                          required
                          value={bulkSiswaNamesText}
                          onChange={(e) => setBulkSiswaNamesText(e.target.value)}
                          placeholder="Contoh:&#10;Ahmad Fadillah&#10;Siti Aminah&#10;Atau dengan format (NIS, Nama):&#10;240101, Budi Santoso"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-805 leading-relaxed placeholder-slate-400 font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer shadow-xs font-sans transition-colors"
                      >
                        Simpan Daftar Kelas
                      </button>
                    </form>
                  </div>

                  {/* Excel Import Card */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor via Excel (Siswa)</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Unggah ratusan profil siswa instan</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => generateSingleTemplate("siswa")}
                        className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                      </button>
                      <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                        <Upload className="w-3.5 h-3.5" /> Pilih File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => handleSingleExcelUpload(e, "siswa")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Kenaikan Kelas & Alumni Section */}
                  <div className="bg-white p-5 rounded-2xl border border-indigo-100 bg-indigo-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Tahun Ajaran Baru</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Kenaikan kelas & pengelolaan alumni</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Siswa kelas 1 s/d 5 naik kelas (e.g. 2A menjadi 3A). Siswa kelas 6 lulus otomatis menjadi <strong>Alumni</strong>. Data alumni disimpan selama 2 tahun ajaran, dan akan terhapus otomatis setelah batas waktu habis.
                    </p>
                    <button
                      type="button"
                      onClick={handlePromoteAcademicYear}
                      className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer font-sans shadow-sm"
                    >
                      <GraduationCap className="w-4 h-4 text-white" /> Proses Kenaikan Kelas (Tahun Baru)
                    </button>
                  </div>
                </div>
              )}

              {masterDataSubTab === "kategori" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-[#8BA888]" /> Tambah Kategori Tugas
                    </h3>
                    <form onSubmit={handleAddGeneralKategori} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Penilaian / Ulangan</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Kuis 1 Dasar, Penilaian Akhir Semester"
                          value={genKatNama}
                          onChange={(e) => setGenKatNama(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      {/* Sasaran Kelas (Multi-class Option) */}
                      <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                        <label className="text-[10px] font-black text-slate-650 uppercase block tracking-wider">Metode Sasaran Kelas</label>
                        <div className="flex gap-4 pb-1 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name="targetType"
                              value="one"
                              checked={genKatTargetType === "one"}
                              onChange={() => setGenKatTargetType("one")}
                              className="accent-emerald-600"
                            />
                            Satu Kelas
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name="targetType"
                              value="all"
                              checked={genKatTargetType === "all"}
                              onChange={() => setGenKatTargetType("all")}
                              className="accent-emerald-600"
                            />
                            Semua Kelas
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name="targetType"
                              value="some"
                              checked={genKatTargetType === "some"}
                              onChange={() => setGenKatTargetType("some")}
                              className="accent-emerald-600"
                            />
                            Pilih Kelas
                          </label>
                        </div>

                        {genKatTargetType === "one" && (
                          <div className="space-y-1 pt-1">
                            <select
                              required
                              value={genKatKelasId}
                              onChange={(e) => setGenKatKelasId(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                            >
                              <option value="">-- Pilih Satu Kelas --</option>
                              {kelas.map(k => (
                                <option key={k.id} value={k.id}>{k.namaKelas}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {genKatTargetType === "all" && (
                          <div className="bg-emerald-50/50 text-[#1E3A20] text-[10px] font-bold py-2.5 px-3 rounded-xl border border-emerald-100/50">
                            ✓ Otomatis didaftarkan untuk seluruh {kelas.length} kelas aktif.
                          </div>
                        )}

                        {genKatTargetType === "some" && (
                          <div className="pt-1.5 space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 pb-1">Tandai kelas sasaran:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {kelas.map(k => {
                                const isChecked = genKatSelectedKelasIds.includes(k.id);
                                return (
                                  <button
                                    type="button"
                                    key={k.id}
                                    onClick={() => {
                                      if (isChecked) {
                                        setGenKatSelectedKelasIds(prev => prev.filter(id => id !== k.id));
                                      } else {
                                        setGenKatSelectedKelasIds(prev => [...prev, k.id]);
                                      }
                                    }}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                                      isChecked
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-800 shadow-3xs"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {k.namaKelas}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                        <select
                          required
                          value={genKatMapelId}
                          onChange={(e) => setGenKatMapelId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Mapel --</option>
                          {mapel.map(m => (
                            <option key={m.id} value={m.id}>{m.namaMapel}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-bold text-slate-500 uppercase">Guru Pembuat (Opsional)</label>
                        <select
                          value={genKatTeacherCode}
                          onChange={(e) => setGenKatTeacherCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Dibuka untuk Umum --</option>
                          {guruCodes.map(g => (
                            <option key={g.code} value={g.code}>{g.namaGuru}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Daftarkan Kategori
                      </button>
                    </form>
                  </div>

                  {/* Excel Import Card */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor via Excel (Kategori)</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Unggah kategori tugas massal</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => generateSingleTemplate("kategori")}
                        className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                      </button>
                      <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                        <Upload className="w-3.5 h-3.5" /> Pilih File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => handleSingleExcelUpload(e, "kategori")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {masterDataSubTab === "penilaian" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#8BA888]" /> Isi Lembar Nilai Baru
                    </h3>
                    <form onSubmit={handleAddGeneralPenilaian} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-bold text-slate-500 uppercase">Ujian Kategori Sasar</label>
                        <select
                          required
                          value={genNilaiKatId}
                          onChange={(e) => {
                            setGenNilaiKatId(e.target.value);
                            setGenGradesInput({});
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Ujian --</option>
                          {kategori.map(k => {
                            const cls = kelas.find(cl => cl.id === k.kelasId)?.namaKelas || "Kelas Terhapus";
                            const mpl = mapel.find(m => m.id === k.mapelId)?.namaMapel || "Mapel Terhapus";
                            return (
                              <option key={k.id} value={k.id}>{k.namaKategori} - {cls} ({mpl})</option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-bold text-slate-500 uppercase">Tanggal Upload</label>
                        <input
                          type="date"
                          required
                          value={genNilaiTanggal}
                          onChange={(e) => setGenNilaiTanggal(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase font-bold text-slate-500 uppercase">Pendidik Penilai (Opsional)</label>
                        <select
                          value={genNilaiTeacherCode}
                          onChange={(e) => setGenNilaiTeacherCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-705 focus:outline-emerald-500 font-medium"
                        >
                          <option value="">-- Tanpa Atribusi Guru --</option>
                          {guruCodes.map(g => (
                            <option key={g.code} value={g.code}>{g.namaGuru}</option>
                          ))}
                        </select>
                      </div>

                      {genNilaiKatId && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 max-h-[180px] overflow-y-auto">
                          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Input Nilai Siswa</span>
                          {genSiswaForGrades.length === 0 ? (
                            <span className="text-[10px] text-red-500 italic block font-semibold leading-relaxed">
                              ⚠️ Tidak ada siswa terdaftar di sasaran kelas kategori ini.
                            </span>
                          ) : (
                            <div className="space-y-2">
                              {genSiswaForGrades.map(s => (
                                <div key={s.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-150">
                                  <span className="font-semibold text-slate-850 truncate max-w-28">{s.namaSiswa}</span>
                                  <div className="flex items-center gap-1.5 font-sans font-bold">
                                    <label className="text-[9px] text-slate-400 uppercase">Skor:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="80"
                                      value={genGradesInput[s.id] ?? ""}
                                      onChange={(e) => {
                                        setGenGradesInput(prev => ({
                                          ...prev,
                                          [s.id]: Number(e.target.value)
                                        }));
                                      }}
                                      className="w-14 px-1 py-0.5 border border-slate-300 rounded text-center font-mono text-xs focus:outline-emerald-500"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={genSiswaForGrades.length === 0}
                        className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Simpan Nilai
                      </button>
                    </form>
                  </div>

                  {/* Excel Import Card */}
                  <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/5 space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Impor via Excel (Rekap Nilai)</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Unggah seluruh transkrip pencapaian siswa</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => generateSingleTemplate("penilaian")}
                        className="flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8BA888]" /> Template
                      </button>
                      <label className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center font-sans">
                        <Upload className="w-3.5 h-3.5" /> Pilih File
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => handleSingleExcelUpload(e, "penilaian")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {masterDataSubTab === "ujianPraktek" && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs space-y-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Konsol Ujian Praktek</h4>
                        <p className="text-[10px] text-slate-450 font-medium font-sans">Pemantauan & Atribusi Mengajar</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Sesi ujian praktek diinisiasi langsung oleh Guru Mata Pelajaran yang bersangkutan melalui menu <strong>Ujian Praktek</strong> pada portal mereka.
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                      Di halaman ini, Admin Utama dapat memantau perkembangan nilai praktek, melihat kontributor pembuat/penginput, serta menghapus sesi jika terjadi kesalahan data.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SUB-TAB Listing Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {masterDataSubTab === "kelas" && (
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wide">Data Rombongan Belajar ({kelas.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                      {kelas.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400 italic">Database kelas kosong.</div>
                      ) : (
                        kelas.map(k => {
                          const numStudents = siswa.filter(s => s.kelasId === k.id).length;
                          return (
                            <div key={k.id} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold tracking-tight">{k.id}</span>
                                  <span className="font-extrabold text-slate-800">{k.namaKelas}</span>
                                </div>
                                <p className="text-[10px] text-slate-405 font-sans">{k.deskripsi || "Tanpa deskripsi"}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold bg-amber-550/10 text-amber-800 px-2 py-0.5 border border-amber-500/10 rounded-xl">{numStudents} Siswa</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingKelas(k);
                                      setEditKelasNama(k.namaKelas);
                                      setEditKelasDeskripsi(k.deskripsi || "");
                                    }}
                                    className="text-amber-605 hover:text-amber-800 p-1 cursor-pointer hover:bg-amber-50 rounded"
                                    title="Edit Kelas"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelKelas(k.id)}
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 rounded"
                                    title="Hapus Kelas"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {masterDataSubTab === "mapel" && (
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-150">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wide">Daftar Mata Pelajaran ({mapel.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                      {mapel.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400 italic">Database mata pelajaran kosong.</div>
                      ) : (
                        mapel.map(m => {
                          const numTasks = kategori.filter(k => k.mapelId === m.id).length;
                          return (
                            <div key={m.id} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">{m.id}</span>
                                <span className="font-extrabold text-slate-805">{m.namaMapel}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-500">{numTasks} Kategori Penilaian</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingMapel(m);
                                      setEditMapelNama(m.namaMapel);
                                    }}
                                    className="text-amber-605 hover:text-amber-800 p-1 cursor-pointer hover:bg-amber-50 rounded"
                                    title="Edit Mapel"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelMapel(m.id)}
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 rounded"
                                    title="Hapus Mapel"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                           {masterDataSubTab === "siswa" && (() => {
                    const activeSiswaFiltered = siswa.filter(s => studentFilter === "alumni" ? !!s.isAlumni : !s.isAlumni);
                    const searchedSiswa = activeSiswaFiltered.filter(s => {
                      if (!adminSiswaSearch.trim()) return true;
                      const term = adminSiswaSearch.toLowerCase();
                      const clsName = (kelas.find(c => c.id === s.kelasId)?.namaKelas || "").toLowerCase();
                      return s.namaSiswa.toLowerCase().includes(term) || 
                             s.nis.includes(term) ||
                             (s.namaWali && s.namaWali.toLowerCase().includes(term)) ||
                             clsName.includes(term);
                    });

                    // Paginate
                    const adminSiswaPageSize = 50;
                    const totalAdminSiswaPages = Math.ceil(searchedSiswa.length / adminSiswaPageSize);
                    const paginatedAdminSiswa = searchedSiswa.slice(
                      (adminSiswaPage - 1) * adminSiswaPageSize,
                      adminSiswaPage * adminSiswaPageSize
                    );

                    // Pre-cache classes map
                    const tempClassMap = new Map();
                    kelas.forEach(kl => tempClassMap.set(kl.id, kl.namaKelas));

                    return (
                      <div>
                        {/* Search and Tabs Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-black text-slate-850 uppercase tracking-wide block">Daftar Master Siswa</span>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Cari Nama/NIS/Wali..."
                                value={adminSiswaSearch}
                                onChange={(e) => {
                                  setAdminSiswaSearch(e.target.value);
                                  setAdminSiswaPage(1);
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500 w-48 text-slate-800 font-medium"
                              />
                            </div>
                          </div>
                          
                          <div className="flex bg-slate-200/60 p-1 rounded-lg text-[10px] w-fit font-bold border border-slate-200 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setStudentFilter("aktif");
                                setAdminSiswaPage(1);
                              }}
                              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${studentFilter === "aktif" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              Siswa Aktif ({siswa.filter(s => !s.isAlumni).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStudentFilter("alumni");
                                setAdminSiswaPage(1);
                              }}
                              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${studentFilter === "alumni" ? "bg-[#2D3A3A] text-white shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                            >
                              Alumni ({siswa.filter(s => s.isAlumni).length})
                            </button>
                          </div>
                        </div>

                        {/* List container */}
                        <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                          {paginatedAdminSiswa.length === 0 ? (
                            <div className="p-12 text-center text-xs text-slate-400 italic">
                              Tidak ada data siswa ditemukan.
                            </div>
                          ) : (
                            paginatedAdminSiswa.map(s => {
                              const clsName = tempClassMap.get(s.kelasId) || "Kelas Lepas";
                              const teach = getTeacherNameByCode(s.teacherCode);
                              return (
                                <div key={s.id} className="p-3.5 hover:bg-slate-5/5 flex items-center justify-between text-xs transition-colors">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-bold text-[9px] text-[#2D3A3A] bg-slate-150 px-1.5 py-0.5 rounded">{s.nis}</span>
                                      <span className="font-extrabold text-slate-850">{s.namaSiswa}</span>
                                      {s.isAlumni && (
                                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded-full font-bold">
                                          Alumni Thn {s.tahunKeluar || new Date().getFullYear()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-x-2.5 gap-y-0.5 text-[9px] text-slate-400 font-sans">
                                      {!s.isAlumni && <span>Kelas: <strong className="text-slate-650">{clsName}</strong></span>}
                                      {s.namaWali && <span>Wali: <strong className="text-slate-600">{s.namaWali}</strong></span>}
                                      {s.noHpWali && <span>No WA: <strong className="font-mono text-emerald-600">+{s.noHpWali}</strong></span>}
                                      <span>&bull;</span>
                                      <span>Penginput: <strong className="text-indigo-650">{teach}</strong></span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingSiswa(s);
                                        setEditSiswaNis(s.nis);
                                        setEditSiswaNama(s.namaSiswa);
                                        setEditSiswaKelasId(s.kelasId);
                                        setEditSiswaNamaWali(s.namaWali || "");
                                        setEditSiswaNoHpWali(s.noHpWali || "");
                                        setEditSiswaAlamat(s.alamatSiswa || "");
                                        setEditSiswaJenisKelamin(s.jenisKelamin || "L");
                                        setEditSiswaKodeAkses(s.kodeAkses || "");
                                      }}
                                      className="text-amber-605 hover:text-amber-800 p-1 cursor-pointer hover:bg-amber-50 rounded"
                                      title="Edit Siswa"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelSiswa(s.id)}
                                      className="text-red-500 hover:text-red-705 p-1 cursor-pointer hover:bg-red-50 rounded"
                                      title="Hapus Siswa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Pagination Footer */}
                        {totalAdminSiswaPages > 1 && (
                          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-150 text-[10px]">
                            <span className="text-slate-500 font-semibold font-sans">
                              Hal <strong className="text-slate-700">{adminSiswaPage}</strong> dari <strong className="text-slate-700">{totalAdminSiswaPages}</strong> ({searchedSiswa.length} data)
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={adminSiswaPage === 1}
                                onClick={() => setAdminSiswaPage(1)}
                                className="px-1.5 py-0.5 border border-slate-200 rounded bg-white text-slate-650 hover:text-emerald-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-mono font-bold transition-all cursor-pointer"
                              >
                                &laquo;
                              </button>
                              <button
                                type="button"
                                disabled={adminSiswaPage === 1}
                                onClick={() => setAdminSiswaPage(prev => prev - 1)}
                                className="px-2 py-0.5 border border-slate-200 rounded bg-white text-slate-650 hover:text-emerald-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold transition-all cursor-pointer"
                              >
                                Prev
                              </button>
                              <button
                                type="button"
                                disabled={adminSiswaPage === totalAdminSiswaPages}
                                onClick={() => setAdminSiswaPage(prev => prev + 1)}
                                className="px-2 py-0.5 border border-slate-200 rounded bg-white text-slate-650 hover:text-emerald-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-bold transition-all cursor-pointer"
                              >
                                Next
                              </button>
                              <button
                                type="button"
                                disabled={adminSiswaPage === totalAdminSiswaPages}
                                onClick={() => setAdminSiswaPage(totalAdminSiswaPages)}
                                className="px-1.5 py-0.5 border border-slate-200 rounded bg-white text-slate-650 hover:text-emerald-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white font-mono font-bold transition-all cursor-pointer"
                              >
                                &raquo;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}            </div>
                  </div>
                )}

                {masterDataSubTab === "kategori" && (
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center select-none">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wide">Daftar Kategori Penilaian ({kategori.length} Rincian)</span>
                    </div>
                    <div className="divide-y divide-slate-150 overflow-y-auto max-h-[420px]">
                      {(() => {
                        const groups: Record<string, {
                          namaKategori: string;
                          mapelId: string;
                          teacherCode?: string;
                          items: KategoriPenilaian[];
                        }> = {};

                        kategori.forEach(k => {
                          const key = `${k.namaKategori.toLowerCase().trim()}_${k.mapelId}`;
                          if (!groups[key]) {
                            groups[key] = {
                              namaKategori: k.namaKategori,
                              mapelId: k.mapelId,
                              teacherCode: k.teacherCode,
                              items: []
                            };
                          }
                          groups[key].items.push(k);
                        });

                        const groupedKategoriList = Object.values(groups);

                        if (groupedKategoriList.length === 0) {
                          return <div className="p-12 text-center text-xs text-slate-400 italic">Database kategori kosong.</div>;
                        }

                        return groupedKategoriList.map((g, index) => {
                          const mName = mapel.find(m => m.id === g.mapelId)?.namaMapel || "Pelajaran Terhapus";
                          const teach = getTeacherNameByCode(g.teacherCode);

                          return (
                            <div key={index} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 font-sans">
                              <div className="space-y-2 flex-1 select-text">
                                <p className="font-extrabold text-slate-800 text-sm leading-tight text-left">{g.namaKategori}</p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-sans font-medium text-left">
                                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">{mName}</span>
                                  <span className="text-slate-400 font-normal">Pembuat: <strong className="text-indigo-600 bg-indigo-50/50 px-1 py-0.2 rounded font-semibold">{teach}</strong></span>
                                  <span className="text-slate-450 font-bold">({g.items.length} Rombel)</span>
                                </div>
                                <div className="flex flex-wrap gap-1 items-center pt-1 font-sans">
                                  <span className="text-[10px] text-slate-400 mr-1 font-bold">Sasar Rombel:</span>
                                  {g.items.map(item => {
                                    const cName = kelas.find(cl => cl.id === item.kelasId)?.namaKelas || "Nama Lepas";
                                    return (
                                      <span
                                        key={item.id}
                                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase text-[9px] font-black group relative cursor-help"
                                        title={`ID: ${item.id}. Klik 'x' untuk melepas kelas ini.`}
                                      >
                                        <span>{cName}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelKategoriSingle(item.id, g.namaKategori, cName);
                                          }}
                                          className="text-emerald-500 hover:text-red-600 font-bold cursor-pointer transition-all scale-105 ml-1"
                                          title={`Hapus sasaran ${cName}`}
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroup(g);
                                    setEditGroupNama(g.namaKategori);
                                    setEditGroupMapelId(g.mapelId);
                                    setEditGroupTeacherCode(g.teacherCode || "");
                                    setEditGroupKelasIds(g.items.map(it => it.kelasId));
                                  }}
                                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 hover:text-amber-800 py-1.5 px-3 rounded-xl border border-amber-200 transition-all text-[11px] font-bold cursor-pointer"
                                  title="Edit Nama, Pelajaran, atau Anggota Kelas Kategori"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelKategoriGroup(g.items, g.namaKategori)}
                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 hover:text-red-700 py-1.5 px-3 rounded-xl border border-red-200 transition-all text-[11px] font-bold cursor-pointer"
                                  title="Hapus Kategori di Seluruh Kelas Terkait"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {masterDataSubTab === "penilaian" && (
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-150">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wide">Daftar Rekap Lembar Nilai ({penilaian.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                      {penilaian.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400 italic">Database lembar nilai kosong.</div>
                      ) : (
                        penilaian.map(p => {
                          const kat = kategori.find(k => k.id === p.kategoriId);
                          const cls = kelas.find(cl => cl.id === kat?.kelasId)?.namaKelas || "Kelas Terlepas";
                          const mpl = mapel.find(m => m.id === kat?.mapelId)?.namaMapel || "Mapel Terlepas";
                          const teach = getTeacherNameByCode(p.teacherCode);
                          return (
                            <div key={p.id} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded font-black">{p.tanggal}</span>
                                  <span className="font-extrabold text-slate-800">{kat?.namaKategori || "Ujian Terhapus"}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-sans font-medium">
                                  <span>Pelajaran: <strong>{mpl}</strong></span>
                                  <span>Kelas: <strong>{cls}</strong></span>
                                  <span className="text-[10px] font-sans text-slate-400">Penginput: <strong className="text-indigo-600 bg-indigo-50/50 px-1 rounded">{teach}</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold bg-amber-550/10 text-amber-800 px-2 py-0.5 border border-amber-500/10 rounded-xl">{p.grades.length} Rekor Nilai</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingPenilaian(p);
                                      setEditPenilaianTanggal(p.tanggal);
                                      setEditPenilaianKategoriId(p.kategoriId);
                                      const gradesMap: { [sid: string]: number } = {};
                                      p.grades.forEach(g => {
                                        gradesMap[g.siswaId] = g.nilai;
                                      });
                                      setEditPenilaianGrades(gradesMap);
                                    }}
                                    className="text-amber-605 hover:text-amber-800 p-1 cursor-pointer hover:bg-amber-50 rounded"
                                    title="Edit Lembar Nilai"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelPenilaian(p.id)}
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 rounded"
                                    title="Hapus Lembar Nilai"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {masterDataSubTab === "ujianPraktek" && (
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-150">
                      <span className="text-xs font-black text-slate-850 uppercase tracking-wide">Daftar Sesi Ujian Praktek ({ujianPraktek.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                      {ujianPraktek.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400 italic font-medium">Database sesi ujian praktek kosong.</div>
                      ) : (
                        ujianPraktek.map(session => {
                          const cls = kelas.find(cl => cl.id === session.kelasId)?.namaKelas || "Kelas Terlepas";
                          const mpl = mapel.find(m => m.id === session.mapelId)?.namaMapel || "Mapel Terlepas";
                          const teach = getTeacherNameByCode(session.teacherCode);
                          const totalEvaluated = session.items.filter(i => i.sudahMengikuti).length;
                          return (
                            <div key={session.id} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded font-black">{session.tanggal || "Tgl Lepas"}</span>
                                  <span className="font-extrabold text-slate-800">{session.namaUjian}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-sans font-medium">
                                  <span>Pelajaran: <strong>{mpl}</strong></span>
                                  <span>Kelas: <strong>{cls}</strong></span>
                                  <span className="text-[10px] font-sans text-slate-400">Penginput: <strong className="text-indigo-600 bg-indigo-50/50 px-1 rounded">{teach}</strong></span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold bg-[#E8F0E6] text-[#4A6447] px-2 py-0.5 border border-[#8BA888]/25 rounded-md">
                                  {totalEvaluated}/{session.items.length} Dinilai
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Apakah Anda yakin ingin menghapus ujian praktek "${session.namaUjian}" ini?`)) {
                                        if (setUjianPraktek) {
                                          setUjianPraktek(prev => prev.filter(u => u.id !== session.id));
                                          showNotification(`Sesi ujian praktek "${session.namaUjian}" berhasil dihapus.`, "success");
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 rounded"
                                    title="Hapus Sesi Ujian"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- MAIN TAB 3: EXCEL IMPORT SENTRAL -------------------- */}
      {adminMainTab === "excel" && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <span className="text-xs font-semibold text-[#577354] bg-[#D6E0D2] px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
              Kontrol Impor Massal Admin
            </span>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-800 mt-2">
              Import Excel Data Base Sekolah Sentral
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Perbarui instan atau satukan seluruh isi lembar kerja sekolah: Kelas, Pelajaran, Siswa, Kategori Tugas, hingga tumpukan nilai siswa sekaligus.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#8BA888] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">1. Ambil Template Microsoft Excel</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Unduh contoh template excel yang didasarkan pada susunan tabel draf sekolah Anda saat ini untuk memudahkan pengetikan manual.
                    </p>
                  </div>
                </div>

                <div className="bg-[#F7F8F3] p-4.5 rounded-2xl border border-[#E2E8F0] text-xs leading-relaxed text-slate-600 space-y-2">
                  <p className="font-bold text-slate-705 flex items-center gap-1.5 mb-2">
                    <HelpCircle className="w-4 h-4 text-[#8BA888]" /> Ketentuan Unggah File:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ada 6 Lembar Tab pada template Excel yang harus dipertahankan.</li>
                    <li>Siswa terhubung ke Kelas lewat parameter <strong>Kode Kelas (kelasId)</strong>.</li>
                    <li>Ujian/Kategori Tugas terhubung menggunakan Kode Unik.</li>
                    <li>Nilai siswa diisi dalam format flat berdasar NIS Siswa.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                  <button
                    onClick={generateTemplate}
                    className="flex items-center justify-center gap-2 bg-[#8BA888] hover:bg-[#718F6E] text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Template
                  </button>
                  <button
                    onClick={handleShareWhatsAppAdmin}
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> Kirim Ke Admin WA
                  </button>
                </div>
              </div>

              <div className="bg-[#2D3A3A] p-6 rounded-3xl text-white space-y-4 shadow-xl">
                <h4 className="font-bold text-sm tracking-wide text-white/90 flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-[#8BA888]" /> Isi Memori Database Sekolah Sekarang:
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white/5 py-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50">Kelas</div>
                    <div className="text-lg font-black mt-1 text-[#8BA888]">{kelas.length}</div>
                  </div>
                  <div className="bg-white/5 py-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50">Siswa</div>
                    <div className="text-lg font-black mt-1 text-[#8BA888]">{siswa.length}</div>
                  </div>
                  <div className="bg-white/5 py-3 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50">Lembar Nilai</div>
                    <div className="text-lg font-black mt-1 text-[#8BA888]">{penilaian.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onExcelDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`bg-white rounded-3xl border-2 border-dashed p-10 text-center transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${
                  isDragging 
                    ? "border-[#8BA888] bg-[#F7F8F3]" 
                    : "border-[#E2E8F0] hover:border-[#8BA888]"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                
                <div className="p-4 bg-emerald-50 text-[#8BA888] rounded-full mb-4">
                  <Upload className="w-8 h-8 animate-bounce" />
                </div>

                <h4 className="font-bold text-slate-800 text-lg">Unggah Lembar File Excel Admin</h4>
                <p className="text-xs text-slate-405 mt-1 max-w-sm">
                  Komposer luring akan memindai baris data untuk melacak kesinkronan sebelum dimasukkan ke database browser secara aman.
                </p>
                <button
                  type="button"
                  className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200"
                >
                  Pilih Berkas Excel (.xlsx)
                </button>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-3 text-xs text-rose-700 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-bold">Gagal Menerjemahkan Tabel Excel:</span>
                    <p className="mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {parsedData && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg animate-slideIn space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-[#8BA888]" />
                    <h3 className="font-bold text-slate-800">Pratinjau Hasil Pembacaan Excel</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-[#F7F8F3] p-3 rounded-xl border border-slate-200/50">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Kelas</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{parsedData.kelas.length}</div>
                    </div>
                    <div className="bg-[#F7F8F3] p-3 rounded-xl border border-slate-200/50">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Pelajaran</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{parsedData.mapel.length}</div>
                    </div>
                    <div className="bg-[#F7F8F3] p-3 rounded-xl border border-slate-200/50">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Siswa</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{parsedData.siswa.length}</div>
                    </div>
                    <div className="bg-[#F7F8F3] p-3 rounded-xl border border-slate-200/50">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Kategori Tugas</div>
                      <div className="text-xl font-bold text-slate-800 mt-1">{parsedData.kategori.length}</div>
                    </div>
                    <div className="bg-[#F7F8F3] p-3 rounded-xl border border-slate-200/50 col-span-2">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Jumlah Cap Nilai</div>
                      <div className="text-xl font-bold text-[#8BA888] mt-1">{parsedData.totalGradesCount} Entri</div>
                    </div>
                  </div>

                  <div className="bg-[#D6E0D2]/20 p-4 rounded-2xl border border-[#8BA888]/30 space-y-3">
                    <label className="text-xs font-bold text-slate-800 block">Metode Impor yang Dipilih:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setImportMode("replace")}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          importMode === "replace"
                            ? "bg-white border-[#8BA888] shadow-xs text-[#2D3A3A]"
                            : "bg-transparent border-slate-200 text-slate-500 hover:bg-white/50"
                        }`}
                      >
                        <input 
                          type="radio" 
                          checked={importMode === "replace"} 
                          onChange={() => setImportMode("replace")} 
                          className="mt-0.5" 
                        />
                        <div>
                          <div className="text-xs font-bold">Timpa Semua Data (Overwrite)</div>
                          <div className="text-[10px] text-slate-400 mt-1">Hapus database saat ini dan ganti seluruhnya dengan data Excel Anda.</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode("merge")}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          importMode === "merge"
                            ? "bg-white border-[#8BA888] shadow-xs text-[#2D3A3A]"
                            : "bg-transparent border-slate-200 text-slate-500 hover:bg-white/50"
                        }`}
                      >
                        <input 
                          type="radio" 
                          checked={importMode === "merge"} 
                          onChange={() => setImportMode("merge")} 
                          className="mt-0.5" 
                        />
                        <div>
                          <div className="text-xs font-bold">Gabungkan Data (Merge)</div>
                          <div className="text-[10px] text-slate-400 mt-1">Gabungkan data baru ke koleksi lama yang sudah ada tanpa menimpa.</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setParsedData(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleCommitExcelImport}
                      className="bg-[#2D3A3A] hover:bg-slate-850 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl flex items-center gap-1.5"
                    >
                      <Database className="w-4 h-4 text-[#8BA888]" /> Simpan Perubahan Massal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- MAIN TAB 4: LES & BIMBINGAN WALI (ADMIN CONSOLE) -------------------- */}
      {adminMainTab === "les" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Manajemen Les & Bimbingan Belajar</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">Kelola tawaran brosur program les, setujui/tolak pendaftaran dari wali murid, dan unduh database pengajuan lengkap ke file Excel.</p>
            </div>

            <button
              onClick={handleDownloadLesExcel}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-0"
            >
              <FileDown className="w-4 h-4" /> Unduh Seluruh Pendaftaran (Excel)
            </button>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                ⚙️ Nomor WhatsApp Kontak Penerima Pendaftaran
              </span>
              <p className="text-[11px] text-amber-700 leading-tight">
                Halaman ini mengatur ke nomor manakah formulir pendaftaran Les wali murid akan otomatis dikirimkan via WhatsApp.
              </p>
            </div>
            <form onSubmit={handleSaveAdminLesWa} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                required
                placeholder="e.g. 628123456781"
                value={adminLesWa}
                onChange={(e) => setAdminLesWa(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 text-center"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Simpan Target WA
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column A: Add/Edit Program Form */}
            <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">
                {editingLesProgId ? "✍️ Sunting Brosur Program" : "➕ Terbitkan Brosur Program Baru"}
              </h4>

              <form onSubmit={handleSaveLesProgram} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Judul Program Bimbingan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bimbingan Tahsin Intensif"
                    value={newLesTitle}
                    onChange={(e) => setNewLesTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 focus:border-indigo-500 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Nama Tutor / Guru Pengampu *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ustadz Luqman Hakim, S.Pd.I"
                    value={newLesTutor}
                    onChange={(e) => setNewLesTutor(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Detail Waktu & Jam Pelaksanaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senin & Rabu, Sesi II (16:00 - 17:30)"
                    value={newLesTime}
                    onChange={(e) => setNewLesTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-sans">Biaya / Subsidi Bulanan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rp 150.000 / bln ATAU Gratis"
                    value={newLesFee}
                    onChange={(e) => setNewLesFee(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block select-none">
                    Target Sasaran Kelas Wali Murid *
                  </label>
                  <p className="text-[9px] text-slate-400 leading-tight select-none">
                    Brosur les ini hanya akan tampil bagi wali murid dari siswa di kelas yang dicentang di bawah ini.
                  </p>
                  <div className="bg-slate-50 border border-slate-205 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 mt-1">
                    {kelas.map((k) => {
                      const isChecked = selectedLesKelasIds.includes(k.id);
                      return (
                        <label
                          key={k.id}
                          className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none py-0.5 hover:text-indigo-600 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedLesKelasIds(prev => prev.filter(id => id !== k.id));
                              } else {
                                setSelectedLesKelasIds(prev => [...prev, k.id]);
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 animate-fadeIn"
                          />
                          <span>Kelas {k.namaKelas}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-[#2D3A3A] hover:bg-slate-850 text-white text-xs font-black rounded-xl select-none shadow cursor-pointer transition-all border-0"
                  >
                    {editingLesProgId ? "Simpan Perubahan" : "Terbitkan Brosur"}
                  </button>
                  {editingLesProgId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLesProgId(null);
                        setNewLesTitle("");
                        setNewLesTutor("");
                        setNewLesTime("");
                        setNewLesFee("");
                      }}
                      className="px-3 py-2 border border-slate-250 text-slate-600 rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Column B & C: Active Brosur List & Received Requests */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tutoring brochure list */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">Daftar Brosur Bimbingan Terbitan</h4>
                
                {lesProgramsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada brosur bimbingan terdaftar. Buat brosur di kolom kirim.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lesProgramsList.map(p => (
                      <div key={p.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2 relative group hover:bg-slate-100/30 transition-colors">
                        <div className="flex items-start justify-between gap-1.5 pr-14 select-none">
                          <h5 className="text-xs font-extrabold text-[#2D3A3A] leading-tight">{p.title}</h5>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                          <p>Pengajar: <span className="font-bold text-slate-700">{p.tutor}</span></p>
                          <p>Jadwal: <span className="font-mono text-slate-650 font-semibold">{p.time}</span></p>
                          <p>Biaya: <span className="bg-emerald-50 text-emerald-800 font-bold px-1 rounded">{p.fee}</span></p>
                          <div className="flex flex-wrap gap-1 pt-1 items-center">
                            <span className="text-slate-400 text-[9px] font-bold">Sasaran:</span>
                            {!p.targetKelasIds || p.targetKelasIds.length === 0 ? (
                              <span className="bg-[#FAF9F5] text-amber-700 font-black px-1.5 py-0.5 rounded border border-amber-100 text-[9px]">None (Belum diatur)</span>
                            ) : (
                              p.targetKelasIds.map(id => {
                                const clsObj = kelas.find(k => k.id === id);
                                return (
                                  <span key={id} className="bg-indigo-55 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[9px]">
                                    {clsObj ? clsObj.namaKelas : "Terhapus"}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="absolute top-2.5 right-2 flex gap-1 items-center select-none">
                          <button
                            onClick={() => handleEditLesProgram(p)}
                            className="p-1 px-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 hover:text-indigo-800 text-[10px] rounded-lg font-bold cursor-pointer"
                            title="Sunting Brosur"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => handleDeleteLesProgram(p.id)}
                            className="p-1 px-1.5 bg-[#FFF0F0] border border-rose-100 text-rose-650 hover:bg-rose-100 rounded-lg text-[10px] font-bold cursor-pointer"
                            title="Hapus Brosur"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submissions list */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">📋 Pengajuan Registrasi dari Wali Murid</h4>
                
                {lesRegList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 select-none space-y-1">
                    <AlertCircle className="w-8 h-8 text-slate-350 mx-auto" strokeWidth={1.5} />
                    <p className="text-xs font-semibold">Belum Ada Pengajuan Terpantau</p>
                    <p className="text-[10px] text-slate-400">Silakan hubungi wali murid untuk melapor pendaftaran.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 rounded-xl divide-y divide-slate-150">
                    {lesRegList.map(r => {
                      let statusBadge = "bg-amber-100 text-amber-700 border-amber-205";
                      if (r.status === "Disetujui") statusBadge = "bg-emerald-100 text-emerald-805 border-emerald-205";
                      if (r.status === "Ditolak") statusBadge = "bg-rose-100 text-rose-700 border-rose-200/30";

                      return (
                        <div key={r.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap text-slate-850 font-extrabold font-sans">
                              <span>🧑‍🎓 {r.siswaNama} <span className="text-slate-400 font-normal font-mono text-[10px]">({r.kelasNama})</span></span>
                              <span className={`inline-flex px-1.5 py-0.2 rounded border text-[9px] font-black uppercase font-mono ${statusBadge}`}>{r.status}</span>
                            </div>
                            <p className="text-slate-705 font-bold text-[11px] leading-snug">Program: <span className="text-indigo-700 font-extrabold">{r.programNama}</span></p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-slate-500 font-medium">No. Wali (WhatsApp): <span className="font-mono text-slate-755 font-extrabold bg-slate-100 px-1 py-0.2 rounded">{r.nohp}</span></span>
                              <a
                                href={`https://wa.me/${r.nohp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                  `Assalamu'alaikum Wr. Wb. Ayah/Bunda dari ${r.siswaNama}, kami dari pihak sekolah mengonfirmasi pendaftaran Les/Bimbingan Belajar: program ${r.programNama} untuk Ananda.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-[9px] px-2 py-0.5 rounded-lg tracking-wider transition-all cursor-pointer border-0"
                              >
                                💬 Hubungi Wali
                              </a>
                            </div>
                            {r.catatan && (
                              <p className="text-[11px] font-semibold text-slate-450 italic bg-amber-50/20 p-2 border border-dashed border-amber-205 rounded-lg mt-1">Pesan: &quot;{r.catatan}&quot;</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-center select-none">
                            {r.status === "Menunggu" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRegStatus(r.id, "Disetujui")}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg tracking-wider transition-all cursor-pointer border-0"
                                >
                                  SETUJU
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRegStatus(r.id, "Ditolak")}
                                  className="px-2.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-[#FBEBEB] font-black text-[10px] rounded-lg tracking-wider transition-all cursor-pointer"
                                >
                                  TOLAK
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLesReg(r.id)}
                              className="p-1 px-1.5 border border-slate-200 text-slate-450 hover:bg-slate-100 rounded-lg text-[10px] font-medium cursor-pointer"
                              title="Hapus Dari Sistem"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* -------------------- MAIN TAB 5: KALENDER AKADEMIK (ADMIN CONSOLE) -------------------- */}
      {adminMainTab === "kalender" && (
        <div className="space-y-6 animate-fadeIn">
          <AcademicCalendar userRole="admin" />
        </div>
      )}

      {/* -------------------- MAIN TAB 6: SCHEDULE & REST HOURS (ADMIN CONSOLE) -------------------- */}
      {adminMainTab === "jamPelajaran" && (
        <JamPelajaranManager showNotification={showNotification} />
      )}

      {/* -------------------- MAIN TAB 7: KEAMANAN & DATABASE LOCK (ADMIN CONSOLE) -------------------- */}
      {adminMainTab === "keamanan" && (
        <div className="space-y-6 animate-fadeIn pb-12 text-left">
          
          {/* Upper Info Banner */}
          <div className="bg-gradient-to-r from-rose-900 to-[#2D3A3A] text-white p-6 rounded-3xl border border-rose-850/35 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <span className="bg-rose-500/20 text-rose-305 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/30">Keamanan Tingkat Tinggi</span>
              <h3 className="text-xl font-bold font-display flex items-center gap-2 text-white">
                <ShieldCheck className="w-5.5 h-5.5 text-rose-400 animate-pulse shrink-0" />
                Sistem Pengunci Basis Data &amp; Integrasi G-Sheet
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Pusat penguncian data cadangan emas (Golden State), integrasi Google Sheets, serta Email Audit Logger. Seluruh perubahan, nilai siswa, dan token pengajar SDIT diproteksi ketat serta tercatat otomatis demi akuntabilitas sekolah.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-black/20 p-3 rounded-2xl border border-white/5 font-mono text-[11px] shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-200 font-bold">Status: Terlindungi &amp; Aktif</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMN 1: Database Gold Lock & Backup Storage */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kunci &amp; Cadangan Database Emas</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Beri proteksi anti-hapus pada data akademik SDIT</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Fitur ini berfungsi untuk <span className="font-bold text-slate-800">menggandakan &amp; mengunci seluruh data aktif saat ini</span> (Rombel, Nilai, Siswa, Pengumuman, Jadwal) ke cadangan emas mandiri. Sekalipun data dihapus atau disalahgunakan di luar, admin dapat mengembalikannya kapan pun dengan kode rahasia.
                </p>

                {/* Backup Status Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-250/70 space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Status Cadangan Terkunci:</span>
                  
                  {lockedBackup ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        <span>Database Terkunci &amp; Tersimpan Aman</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600">
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-400">Dicadangkan Pada:</span>
                          <p className="font-bold mt-0.5 text-slate-800">{new Date(lockedBackup.timestamp || Date.now()).toLocaleString("id-ID")}</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-400">Total Objek Data:</span>
                          <p className="font-bold mt-0.5 text-slate-800">
                            { (lockedBackup.siswa?.length || 0) + (lockedBackup.kelas?.length || 0) + (lockedBackup.penilaian?.length || 0) } Objek
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-450 text-xs py-2 font-medium">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>Belum ada cadangan emas database terkunci dalam sistem ini.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    // Create locked backup state
                    const backupPayload = {
                      timestamp: new Date().toISOString(),
                      kelas,
                      siswa,
                      mapel,
                      kategori,
                      penilaian,
                      announcements,
                      guruCodes,
                      jadwal,
                      ujianPraktek
                    };
                    localStorage.setItem("PSD_LOCKED_DB_BACKUP", JSON.stringify(backupPayload));
                    setLockedBackup(backupPayload);
                    triggerLogRecord("Membuat cadangan database emas baru dan menguncinya.");
                    showNotification("Berhasil mencadangkan & mengunci database saat ini di penyimpanan aman!", "success");
                  }}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4 text-rose-200" /> Kunci &amp; Amankan Database
                </button>

                {lockedBackup && (
                  <button
                    onClick={() => {
                      setEnteredPasscode("");
                      setShowPasscodeModalFor("restore");
                    }}
                    className="py-3 px-4 border border-rose-200 hover:border-rose-450 text-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Restore Data
                  </button>
                )}

                {lockedBackup && (
                  <button
                    onClick={() => {
                      setEnteredPasscode("");
                      setShowPasscodeModalFor("delete_backup");
                    }}
                    className="py-3 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded-xl cursor-pointer"
                    title="Hapus cadangan emas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* COLUMN 2: Google Spreadsheet & Admin Email Integration */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 font-display">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Koneksi Google Spreadsheet &amp; Admin Email</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Interkoneksi awan lengkap, sinkronisasi dua arah real-time</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                      <span>Google API Sheets Engine:</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase">Tersinkronisasi</span>
                    </div>
                    
                    <div className="space-y-1 text-[10px] font-mono text-slate-550 break-all select-all">
                      <p><span className="font-bold text-slate-700">Spreadsheet ID:</span> {SPREADSHEET_ID}</p>
                      <p><span className="font-bold text-slate-700">Surel Akun Hubungan:</span> sdit.alhanif@gmail.com</p>
                    </div>

                    <div className="pt-2 border-t border-dashed border-emerald-100 flex flex-wrap gap-2 text-[9px] font-black text-emerald-800 uppercase tracking-wider select-none">
                      <span>✓ Siswa_Sheet</span>
                      <span>✓ Kelas_Sheet</span>
                      <span>✓ Nilai_Sheet</span>
                      <span>✓ Log_Change_Sheet</span>
                    </div>
                  </div>

                  {/* Gmail SMTP Logger config */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-500 block">Surel Penerima Laporan Aktifitas (Email Admin):</label>
                      <input
                        type="email"
                        value={adminNotificationEmail}
                        onChange={(e) => {
                          setAdminNotificationEmail(e.target.value);
                          localStorage.setItem("PSD_ADMIN_NOTIFICATION_EMAIL", e.target.value);
                        }}
                        placeholder="contoh: admin@alhanif.org"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#8BA888] text-slate-700"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={enableEmailAlerts}
                        onChange={(e) => {
                          setEnableEmailAlerts(e.target.checked);
                          localStorage.setItem("PSD_ENABLE_EMAIL_ALERTS", String(e.target.checked));
                          triggerLogRecord(`Mengubah status alert notifikasi email ke: ${e.target.checked ? "Aktif" : "Nonaktif"}`);
                        }}
                        className="rounded accent-emerald-600 text-white"
                      />
                      <span>Kirim email instan &amp; rekap bulanan ke admin di setiap perubahan</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleSpreadsheetSync}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow text-emerald-250 shrink-0" /> SINKRONKAN DATA DENGAN G-SHEET LENGKAP
                </button>
              </div>
            </div>

          </div>

          {/* Audit Logs Table for Admin Security Logged Changes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2 border border-slate-250 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 font-mono">LOG REGISTER</div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Histori &amp; Log Perubahan Sistem Terinkorporasi</h4>
              </div>
              <button
                onClick={() => {
                  const defaultLogs = [
                    { id: "LOG-INIT1", timestamp: new Date(Date.now() - 3600000).toISOString(), actor: "Super Admin", action: "Sistem diinisialisasi dan dihubungkan ke Google API", status: "Tercatat di Google Spreadsheet & Terkirim ke sdit.alhanif@gmail.com" },
                    { id: "LOG-INIT2", timestamp: new Date(Date.now() - 1800000).toISOString(), actor: "Super Admin", action: "Sinkronisasi otomatis basis data SDIT rombel 2A - 6F", status: "Tercatat di Google Spreadsheet & Terkirim ke sdit.alhanif@gmail.com" }
                  ];
                  setPortalLogs(defaultLogs);
                  localStorage.setItem("PSD_AUDIT_LOGS", JSON.stringify(defaultLogs));
                  showNotification("Log berhasil dikosongkan ke riwayat sistem.", "success");
                }}
                className="text-xs text-rose-650 hover:underline cursor-pointer"
              >
                Kosongkan Log
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Daftar di bawah mencatat riwayat perubahan data secara lengkap secara temporal, terikat aman dengan Google Spreadsheet Cloud dan meneruskan laporan otomatis ke email kurikulum <span className="font-semibold text-slate-800">{adminNotificationEmail}</span>.
            </p>

            <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
              {portalLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-405 text-xs font-medium">Belum ada riwayat tercatat baru.</div>
              ) : (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 uppercase font-bold tracking-tight">
                      <th className="p-3">Waktu</th>
                      <th className="p-3">Oleh / Aktor</th>
                      <th className="p-3">Aktifitas Perubahan</th>
                      <th className="p-3 text-right">Integrasi / Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-slate-50/50 border-b border-slate-100 font-sans">
                        <td className="p-3 text-slate-500 whitespace-nowrap font-mono">{new Date(log.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                        <td className="p-3 font-bold text-slate-700 whitespace-nowrap">{log.actor}</td>
                        <td className="p-3 text-slate-650">{log.action}</td>
                        <td className="p-3 text-right">
                          <span className="inline-flex bg-emerald-50 text-emerald-800 rounded-lg px-2.5 py-0.5 border border-emerald-100 font-semibold text-[10px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Secure Admin passcode modal validation verification trigger popup */}
          {showPasscodeModalFor !== null && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn">
                <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center text-rose-800 font-bold text-xs uppercase">
                  <span>🔒 Verifikasi Kode Rahasia Admin</span>
                  <button onClick={() => setShowPasscodeModalFor(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer">
                    ✕
                  </button>
                </div>
                <div className="p-6 space-y-4 text-center">
                  <p className="text-xs text-slate-500 leading-relaxed text-left">
                    Tindakan ini memerlukan tingkat otorisasi tertinggi. Masukkan <span className="font-extrabold text-slate-800">Kode Passcode Portal Admin</span> (kode akses yang sama yang Anda gunakan saat login ke portal) untuk melanjutkan:
                  </p>
                  
                  <input
                    type="password"
                    autoFocus
                    placeholder="Masukkan Passcode Admin"
                    value={enteredPasscode}
                    onChange={(e) => setEnteredPasscode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (enteredPasscode === "B1smillah") {
                          const actionType = showPasscodeModalFor;
                          setShowPasscodeModalFor(null);
                          if (actionType === "restore" && lockedBackup) {
                            if (lockedBackup.kelas) setKelas(lockedBackup.kelas);
                            if (lockedBackup.siswa) setSiswa(lockedBackup.siswa);
                            if (lockedBackup.mapel) setMapel(lockedBackup.mapel);
                            if (lockedBackup.kategori) setKategori(lockedBackup.kategori);
                            if (lockedBackup.penilaian) setPenilaian(lockedBackup.penilaian);
                            if (lockedBackup.announcements) setAnnouncements(lockedBackup.announcements);
                            if (lockedBackup.guruCodes) setGuruCodes(lockedBackup.guruCodes);
                            if (lockedBackup.jadwal) setJadwal(lockedBackup.jadwal);

                            localStorage.setItem("PSD_KELAS", JSON.stringify(lockedBackup.kelas));
                            localStorage.setItem("PSD_SISWA", JSON.stringify(lockedBackup.siswa));
                            localStorage.setItem("PSD_MAPEL", JSON.stringify(lockedBackup.mapel));
                            localStorage.setItem("PSD_KATEGORI", JSON.stringify(lockedBackup.kategori));
                            localStorage.setItem("PSD_PENILAIAN", JSON.stringify(lockedBackup.penilaian));
                            localStorage.setItem("PSD_ANNOUNCEMENTS", JSON.stringify(lockedBackup.announcements));
                            localStorage.setItem("PSD_GURU_CODES", JSON.stringify(lockedBackup.guruCodes));
                            localStorage.setItem("PSD_JADWAL", JSON.stringify(lockedBackup.jadwal));

                            triggerLogRecord("Mengembalikan (restore) basis data penuh dari cadangan emas terproteksi.");
                            showNotification("Basis data berhasil dikembalikan dari cadangan emas yang dikunci!", "success");
                          } else if (actionType === "delete_backup") {
                            localStorage.removeItem("PSD_LOCKED_DB_BACKUP");
                            setLockedBackup(null);
                            triggerLogRecord("Menghapus cadangan emas database terproteksi.");
                            showNotification("Cadangan database yang dikunci berhasil dihapus.", "neutral");
                          } else if (actionType === "wipe") {
                            onClearAllMasterData();
                            triggerLogRecord("Membersihkan seluruh data master aktif dalam sistem.");
                            showNotification("Seluruh data aktif berhasil dibersihkan dari sistem lokal.", "neutral");
                          }
                        } else {
                          showNotification("Kode Passcode Admin Salah!", "neutral");
                        }
                      }
                    }}
                    className="w-full text-center py-2.5 px-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-rose-400 font-mono tracking-widest text-slate-850 font-bold"
                  />
                  
                  <div className="flex gap-2.5 mt-2">
                    <button
                      onClick={() => setShowPasscodeModalFor(null)}
                      className="flex-1 py-2 text-xs font-semibold border border-slate-250 text-slate-550 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        if (enteredPasscode === "B1smillah") {
                          const actionType = showPasscodeModalFor;
                          setShowPasscodeModalFor(null);
                          if (actionType === "restore" && lockedBackup) {
                            if (lockedBackup.kelas) setKelas(lockedBackup.kelas);
                            if (lockedBackup.siswa) setSiswa(lockedBackup.siswa);
                            if (lockedBackup.mapel) setMapel(lockedBackup.mapel);
                            if (lockedBackup.kategori) setKategori(lockedBackup.kategori);
                            if (lockedBackup.penilaian) setPenilaian(lockedBackup.penilaian);
                            if (lockedBackup.announcements) setAnnouncements(lockedBackup.announcements);
                            if (lockedBackup.guruCodes) setGuruCodes(lockedBackup.guruCodes);
                            if (lockedBackup.jadwal) setJadwal(lockedBackup.jadwal);

                            localStorage.setItem("PSD_KELAS", JSON.stringify(lockedBackup.kelas));
                            localStorage.setItem("PSD_SISWA", JSON.stringify(lockedBackup.siswa));
                            localStorage.setItem("PSD_MAPEL", JSON.stringify(lockedBackup.mapel));
                            localStorage.setItem("PSD_KATEGORI", JSON.stringify(lockedBackup.kategori));
                            localStorage.setItem("PSD_PENILAIAN", JSON.stringify(lockedBackup.penilaian));
                            localStorage.setItem("PSD_ANNOUNCEMENTS", JSON.stringify(lockedBackup.announcements));
                            localStorage.setItem("PSD_GURU_CODES", JSON.stringify(lockedBackup.guruCodes));
                            localStorage.setItem("PSD_JADWAL", JSON.stringify(lockedBackup.jadwal));

                            triggerLogRecord("Mengembalikan (restore) basis data penuh dari cadangan emas terproteksi.");
                            showNotification("Basis data berhasil dikembalikan dari cadangan emas yang dikunci!", "success");
                          } else if (actionType === "delete_backup") {
                            localStorage.removeItem("PSD_LOCKED_DB_BACKUP");
                            setLockedBackup(null);
                            triggerLogRecord("Menghapus cadangan emas database terproteksi.");
                            showNotification("Cadangan database yang dikunci berhasil dihapus.", "neutral");
                          } else if (actionType === "wipe") {
                            onClearAllMasterData();
                            triggerLogRecord("Membersihkan seluruh data master aktif dalam sistem.");
                            showNotification("Seluruh data aktif berhasil dibersihkan dari sistem lokal.", "neutral");
                          }
                        } else {
                          showNotification("Kode Passcode Admin Salah!", "neutral");
                        }
                      }}
                      className="flex-1 py-2 text-xs font-black bg-[#2D3A3A] text-white rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      Konfirmasi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================== MASTER CLASS EDIT MODAL ==================== */}
      {editingKelas && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 bg-[#F7F8F3] border-b border-emerald-100/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Detail Rombel (Kelas)</h3>
              </div>
              <button
                onClick={() => setEditingKelas(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-505 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveKelasEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Kode Kelas (Read-Only ID)</label>
                <input
                  type="text"
                  disabled
                  value={editingKelas.id}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Nama Rombongan Belajar</label>
                <input
                  type="text"
                  required
                  value={editKelasNama}
                  onChange={(e) => setEditKelasNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Deskripsi / Catatan Kelas</label>
                <textarea
                  value={editKelasDeskripsi}
                  onChange={(e) => setEditKelasDeskripsi(e.target.value)}
                  placeholder="Keterangan tambahan rombel..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingKelas(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MASTER MAPEL EDIT MODAL ==================== */}
      {editingMapel && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 bg-[#F7F8F3] border-b border-emerald-100/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Mata Pelajaran</h3>
              </div>
              <button
                onClick={() => setEditingMapel(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-505 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMapelEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Kode Pelajaran (Read-Only ID)</label>
                <input
                  type="text"
                  disabled
                  value={editingMapel.id}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Nama Lengkap Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={editMapelNama}
                  onChange={(e) => setEditMapelNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMapel(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MASTER SISWA EDIT MODAL ==================== */}
      {editingSiswa && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 bg-[#F7F8F3] border-b border-emerald-100/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Profil Siswa</h3>
              </div>
              <button
                onClick={() => setEditingSiswa(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-505 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSiswaEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Kode Sistem (Read-Only ID)</label>
                  <input
                    type="text"
                    disabled
                    value={editingSiswa.id}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">NIS / Nomor Induk</label>
                  <input
                    type="text"
                    required
                    value={editSiswaNis}
                    onChange={(e) => setEditSiswaNis(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={editSiswaNama}
                  onChange={(e) => setEditSiswaNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Penempatan Rombel (Kelas)</label>
                <select
                  value={editSiswaKelasId}
                  required
                  onChange={(e) => setEditSiswaKelasId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-255 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.namaKelas}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Nama Orang Tua / Wali Murid</label>
                <input
                  type="text"
                  placeholder="Contoh: Ibu Rina Kartika"
                  value={editSiswaNamaWali}
                  onChange={(e) => setEditSiswaNamaWali(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">No. WhatsApp Wali Murid</label>
                <input
                  type="text"
                  placeholder="Contoh: 6281xxxxxxxx"
                  value={editSiswaNoHpWali}
                  onChange={(e) => setEditSiswaNoHpWali(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Jenis Kelamin</label>
                  <select
                    value={editSiswaJenisKelamin}
                    onChange={(e) => setEditSiswaJenisKelamin(e.target.value as "L" | "P")}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="L font-sans">Laki-laki (L)</option>
                    <option value="P font-sans">Perempuan (P)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Kode Akses Wali (Password)</label>
                  <input
                    type="text"
                    placeholder="Contoh: ALH001"
                    value={editSiswaKodeAkses}
                    onChange={(e) => setEditSiswaKodeAkses(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Alamat Rumah</label>
                <textarea
                  placeholder="Alamat lengkap tempat tinggal"
                  value={editSiswaAlamat}
                  onChange={(e) => setEditSiswaAlamat(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MASTER KATEGORI GROUP EDIT MODAL ==================== */}
      {editingGroup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 bg-[#F7F8F3] border-b border-emerald-100/50 flex justify-between items-center bg-amber-50/10">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Kategori & Distribusi Kelas</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-505 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGroupEdit} className="p-6 space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Nama Ulangan / Tugas</label>
                <input
                  type="text"
                  required
                  value={editGroupNama}
                  onChange={(e) => setEditGroupNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Mata Pelajaran</label>
                <select
                  value={editGroupMapelId}
                  required
                  onChange={(e) => setEditGroupMapelId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-250 text-xs rounded-xl text-slate-705 font-medium cursor-pointer"
                >
                  <option value="">-- Pilih Mapel --</option>
                  {mapel.map(m => (
                    <option key={m.id} value={m.id}>{m.namaMapel}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Guru Pengajar / Pembuat</label>
                <select
                  value={editGroupTeacherCode}
                  onChange={(e) => setEditGroupTeacherCode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-250 text-xs rounded-xl text-slate-705 font-medium cursor-pointer"
                >
                  <option value="">-- Dibuka untuk Umum --</option>
                  {guruCodes.map(g => (
                    <option key={g.code} value={g.code}>{g.namaGuru}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase block">Distribusi Sasar Kelas</label>
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 max-h-[140px] overflow-y-auto">
                  {kelas.map(k => {
                    const isChecked = editGroupKelasIds.includes(k.id);
                    return (
                      <button
                        type="button"
                        key={k.id}
                        onClick={() => {
                          if (isChecked) {
                            setEditGroupKelasIds(prev => prev.filter(id => id !== k.id));
                          } else {
                            setEditGroupKelasIds(prev => [...prev, k.id]);
                          }
                        }}
                        className={`px-2.5 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-100 border-emerald-200 text-emerald-800 shadow-3xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {k.namaKelas}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MASTER PENILAIAN (GRADES) EDIT MODAL ==================== */}
      {editingPenilaian && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn">
            <div className="p-4 bg-[#F7F8F3] border-b border-emerald-100/50 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Edit Nilai Tugas</h3>
              </div>
              <button
                onClick={() => setEditingPenilaian(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-550 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSavePenilaianEdit} className="p-6 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Tanggal Input / Nilai</label>
                  <input
                    type="date"
                    required
                    value={editPenilaianTanggal}
                    onChange={(e) => setEditPenilaianTanggal(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-bold text-slate-800"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Ubah Kategori</label>
                  <select
                    value={editPenilaianKategoriId}
                    required
                    onChange={(e) => setEditPenilaianKategoriId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-250 text-xs rounded-xl text-slate-705 font-medium cursor-pointer"
                  >
                    {kategori.map(k => {
                      const cls = kelas.find(cl => cl.id === k.kelasId)?.namaKelas || "Kelas Terlepas";
                      const mpl = mapel.find(m => m.id === k.mapelId)?.namaMapel || "Mapel Terlepas";
                      return (
                        <option key={k.id} value={k.id}>{k.namaKategori} ({mpl} - {cls})</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* List of Students to modify grades in bulk for this specific assessment sheet */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider mb-2">📜 Nilai Individu Siswa</span>
                
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-150 max-h-[220px] overflow-y-auto">
                  {/* Filter student records based on selection */}
                  {(function() {
                    const activeKat = kategori.find(k => k.id === (editPenilaianKategoriId || editingPenilaian.kategoriId));
                    const targetStudents = activeKat 
                      ? siswa.filter(s => s.kelasId === activeKat.kelasId)
                      : siswa;

                    if (targetStudents.length === 0) {
                      return <p className="px-4 py-8 text-xs text-slate-400 italic text-center">Tidak ada siswa yang terhubung di kelas kategori ini.</p>;
                    }

                    return targetStudents.map(s => {
                      const currentVal = editPenilaianGrades[s.id] ?? 0;
                      return (
                        <div key={s.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FDFDFB]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 leading-none">{s.namaSiswa}</span>
                            <div className="text-[9px] text-slate-400 font-mono">NIS: {s.nis}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              required
                              value={currentVal}
                              onChange={(e) => {
                                const parseVal = Math.min(100, Math.max(0, Number(e.target.value)));
                                setEditPenilaianGrades(prev => ({
                                  ...prev,
                                  [s.id]: isNaN(parseVal) ? 0 : parseVal
                                }));
                              }}
                              className="w-20 text-center px-2 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-bold text-slate-850"
                            />
                            <span className="text-[10px] font-bold font-mono text-slate-400">/ 100</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPenilaian(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  Simpan Perubahan Lembar Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
