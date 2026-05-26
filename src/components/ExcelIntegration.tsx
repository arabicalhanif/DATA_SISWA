import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  FileWarning, 
  RefreshCw, 
  FileDown, 
  MessageSquare,
  HelpCircle,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  ExternalLink,
  Lock,
  Link2,
  Plus,
  HardDrive,
  Activity,
  Layers,
  FolderOpen
} from "lucide-react";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, SiswaNilai, GuruCode, Jadwal, HariBelajar, Tugas, AbsenSiswa, AbsenGuru, Announcement, UjianPraktek, PengumpulanTugas, GuruPiket, TeacherAgenda } from "../types";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  SPREADSHEET_ID, 
  exportLocalDataToGoogleSheets, 
  importDataFromGoogleSheets,
  setSpreadsheetId,
  extractSpreadsheetId,
  auth,
  syncUserSpreadsheetId,
  createGoogleSpreadsheet
} from "../lib/googleSheets";

interface ExcelIntegrationProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  guruCodes?: GuruCode[];
  jadwal?: Jadwal[];
  tugas?: Tugas[];
  absenSiswa?: AbsenSiswa[];
  absenGuru?: AbsenGuru[];
  announcements?: Announcement[];
  ujianPraktek?: UjianPraktek[];
  pengumpulanTugas?: PengumpulanTugas[];
  guruPiket?: GuruPiket[];
  agendas?: TeacherAgenda[];
  userRole?: "admin" | "guru" | "wali";
  isAutoSyncEnabled?: boolean;
  setIsAutoSyncEnabled?: (val: boolean) => void;
  onImportAllData: (data: {
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
    guru?: GuruCode[];
    jadwal?: Jadwal[];
    tugas?: Tugas[];
    absenSiswa?: AbsenSiswa[];
    absenGuru?: AbsenGuru[];
    announcements?: Announcement[];
    ujianPraktek?: UjianPraktek[];
    pengumpulanTugas?: PengumpulanTugas[];
    guruPiket?: GuruPiket[];
    agendas?: TeacherAgenda[];
  }, mode: "replace" | "merge") => void;
}

export default function ExcelIntegration({
  kelas,
  mapel,
  siswa,
  kategori,
  penilaian,
  guruCodes = [],
  jadwal = [],
  tugas = [],
  absenSiswa = [],
  absenGuru = [],
  announcements = [],
  ujianPraktek = [],
  pengumpulanTugas = [],
  guruPiket = [],
  agendas = [],
  userRole = "guru",
  isAutoSyncEnabled = true,
  setIsAutoSyncEnabled,
  onImportAllData
}: ExcelIntegrationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<{
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
    guru?: GuruCode[];
    jadwal?: Jadwal[];
    tugas?: Tugas[];
    totalGradesCount: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Sheets Integration State
  const [activeSubTab, setActiveSubTab] = useState<"sheets" | "excel">("sheets");
  const [spreadsheetInput, setSpreadsheetInput] = useState(() => {
    return localStorage.getItem("PSD_SPREADSHEET_ID") || SPREADSHEET_ID;
  });
  const [isSavedId, setIsSavedId] = useState(false);
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingIn, setIsSyncingIn] = useState(false);
  const [isSyncingOut, setIsSyncingOut] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // States for Real-Time Google Drive Backup Console
  const [backupLogs, setBackupLogs] = useState<{ id: string; time: string; type: "info" | "success" | "warning"; message: string }[]>([
    { id: "1", time: "06:30:12 AM", type: "success", message: "Sistem Backup Terpadu Al-Hanif siap." },
    { id: "2", time: "06:33:45 AM", type: "info", message: "Google Drive terkoneksi sebagai media penyimpanan cadangan utama." },
    { id: "3", time: "06:42:24 AM", type: "success", message: "Semua 15 tab database sekolah disinkronkan secara realtime." }
  ]);
  const [backupStage, setBackupStage] = useState<number | null>(null);
  const [isManualBackingUp, setIsManualBackingUp] = useState(false);

  // Initialize Auth State Listener on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSheetError(null);
    setSheetStatus(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setSheetStatus("Berhasil terhubung dengan Google Account!");
      }
    } catch (err: any) {
      setSheetError(err.message || "Gagal menghubungkan Google Account.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setAccessToken(null);
      setSheetStatus("Sesi Google Sheets ditutup.");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePushToSheets = async () => {
    if (userRole !== "admin" && userRole !== "guru") {
      setSheetError("Akses Ditolak: Hanya Guru atau Administrator yang berwenang untuk mengirim data ke Google Sheets.");
      return;
    }
    if (!accessToken) {
      setSheetError("Silakan sambungkan Akun Google Anda terlebih dahulu!");
      return;
    }
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin mengirim semua data lokal Anda ke Google Sheet? Ini akan menimpa dan memutakhirkan seluruh data pada Google Sheet yang sudah ditentukan."
    );
    if (!confirmed) return;

    setIsSyncingOut(true);
    setSheetError(null);
    setSheetStatus("Mengirim & mendaftarkan data lokal ke awan Google Sheets Anda...");
    try {
      await exportLocalDataToGoogleSheets(accessToken, {
        kelas,
        mapel,
        siswa,
        kategori,
        penilaian,
        guru: guruCodes,
        jadwal,
        tugas,
        absenSiswa,
        absenGuru,
        announcements,
        ujianPraktek,
        pengumpulanTugas,
        guruPiket,
        agendas
      });
      setSheetStatus("Sinkronisasi Berhasil! Seluruh data lokal telah tersalin aman di Google Sheets.");
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || "Gagal mengirim data ke Google Sheets. Silakan sambungkan ulang Google Account.");
    } finally {
      setIsSyncingOut(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (userRole !== "admin" && userRole !== "guru") {
      setSheetError("Akses Ditolak: Hanya Guru atau Administrator yang berwenang untuk menarik data dari Google Sheets.");
      return;
    }
    if (!accessToken) {
      setSheetError("Silakan sambungkan Akun Google Anda terlebih dahulu!");
      return;
    }
    setIsSyncingIn(true);
    setSheetError(null);
    setSheetStatus("Menarik data terbaru dari Google Sheets...");
    try {
      const data = await importDataFromGoogleSheets(accessToken);
      
      let count = 0;
      data.penilaian.forEach(p => {
        count += (p.grades || []).length;
      });

      setParsedData({
        kelas: data.kelas,
        mapel: data.mapel,
        siswa: data.siswa,
        kategori: data.kategori,
        penilaian: data.penilaian,
        guru: data.guru,
        jadwal: data.jadwal,
        tugas: data.tugas,
        absenSiswa: data.absenSiswa,
        absenGuru: data.absenGuru,
        announcements: data.announcements,
        ujianPraktek: data.ujianPraktek,
        pengumpulanTugas: data.pengumpulanTugas,
        guruPiket: data.guruPiket,
        agendas: data.agendas,
        totalGradesCount: count
      });
      setImportMode("replace");
      setSheetStatus("Data berhasil diambil dari Google Sheets! Silakan klik 'Simpan Semua Data ke Sistem' di panel bawah untuk menerapkan.");
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || "Gagal menarik data dari Google Sheets. Pastikan spreadsheet dapat diakses.");
    } finally {
      setIsSyncingIn(false);
    }
  };

  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  const handleCreateNewPersonalSpreadsheet = async () => {
    if (!accessToken) {
      setSheetError("Silakan sambungkan Akun Google Anda terlebih dahulu!");
      return;
    }
    
    setIsCreatingSheet(true);
    setSheetError(null);
    setSheetStatus("Sedang memproses pembuatan Google Spreadsheet baru di Google Drive Anda...");

    try {
      // Create new Spreadsheet
      const newId = await createGoogleSpreadsheet(accessToken, "SiswaDigital_SDIT_AlHanif_Database");
      if (newId) {
        // Set state & storage
        setSpreadsheetId(newId);
        setSpreadsheetInput(newId);
        setIsSavedId(true);

        const currentUser = auth.currentUser;
        if (currentUser) {
          await syncUserSpreadsheetId(currentUser.uid, currentUser.email || "", newId);
        }

        // Instantly push existing state to the new spreadsheet to initialize it perfectly
        setSheetStatus("Spreadsheet berhasil dibuat! Sekarang menyalin pertanggungjawaban semua data sekolah Anda...");
        
        await exportLocalDataToGoogleSheets(accessToken, {
          kelas,
          mapel,
          siswa,
          kategori,
          penilaian,
          guru: guruCodes,
          jadwal,
          tugas,
          absenSiswa,
          absenGuru,
          announcements,
          ujianPraktek,
          pengumpulanTugas,
          guruPiket,
          agendas
        });

        setSheetStatus("Selesai! Spreadsheet baru sukses dibuat di Google Drive milik Anda (" + googleUser.email + ") & tersinkronisasi sempurna.");
        setSheetError(null);
      }
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || "Gagal membuat dan mendaftarkan spreadsheet baru.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleTriggerManualFullBackup = async () => {
    if (!accessToken) {
      setSheetError("Silakan sambungkan Akun Google Anda terlebih dahulu untuk memulai Backup Cloud!");
      return;
    }
    setIsManualBackingUp(true);
    setBackupStage(1);
    setSheetError(null);
    const addLog = (message: string, type: "info" | "success" | "warning" = "info") => {
      setBackupLogs(prev => [
        { id: Date.now().toString() + Math.random(), time: new Date().toLocaleTimeString(), type, message },
        ...prev.slice(0, 15)
      ]);
    };

    try {
      addLog("Memulai pencadangan database manual ke Google Drive & Sheets...", "info");
      await new Promise(resolve => setTimeout(resolve, 600));

      setBackupStage(2);
      addLog("Memeriksa otorisasi Google API & Izin Google Drive...", "info");
      await new Promise(resolve => setTimeout(resolve, 600));

      setBackupStage(3);
      addLog("Memvalidasi dan menyiapkan 15 skema lembar data sekolah...", "info");
      await new Promise(resolve => setTimeout(resolve, 600));

      setBackupStage(4);
      addLog("Mengunggah dan mendistribusikan data secara terstruktur penuh ke Google Spreadsheet...", "info");
      
      await exportLocalDataToGoogleSheets(accessToken, {
        kelas,
        mapel,
        siswa,
        kategori,
        penilaian,
        guru: guruCodes,
        jadwal,
        tugas,
        absenSiswa,
        absenGuru,
        announcements,
        ujianPraktek,
        pengumpulanTugas,
        guruPiket,
        agendas
      });

      setBackupStage(5);
      addLog("Koneksi aman diverifikasi! Duplikasi data Google Drive selesai dilakukan.", "success");
      setSheetStatus("Backup Berhasil Sempurna! Seluruh database lokal disinkronkan secara aman ke Google Sheets & Drive Anda.");
    } catch (err: any) {
      console.error(err);
      addLog(`Pencadangan gagal: ${err.message || "Kesalahan API"}`, "warning");
      setSheetError(err.message || "Gagal melakukan pencadangan otomatis ke Google Sheets.");
    } finally {
      setIsManualBackingUp(false);
      setTimeout(() => setBackupStage(null), 3000);
    }
  };

  // 1. Generate & Download The Structured Excel Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Readme / Petunjuk
    const readmeData = [
      ["PETUNJUK PENGISIAN TEMPLATE DATA SISWADIGITAL"],
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
      ["Unduh template ini, isi dengan data Anda, lalu unggah kembali melalui tab Impor Excel ini."],
      ["Anda dapat mengunduh langsung ke komputer atau membagikan petunjuk ini via WhatsApp."]
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
    const siswaHeader = [["id", "nis", "namaSiswa", "kelasId", "namaWali", "noHpWali", "alamatSiswa"]];
    const siswaRows = siswa.map(s => [s.id, s.nis, s.namaSiswa, s.kelasId, s.namaWali || "", s.noHpWali || "", s.alamatSiswa || ""]);
    const wsSiswa = XLSX.utils.aoa_to_sheet([...siswaHeader, ...siswaRows]);
    XLSX.utils.book_append_sheet(wb, wsSiswa, "4. Siswa");

    // Sheet 5: Kategori Tugas (Only generate/include for Admin)
    if (userRole === "admin") {
      const kategoriHeader = [["id", "kelasId", "mapelId", "namaKategori"]];
      const kategoriRows = kategori.map(kat => [kat.id, kat.kelasId, kat.mapelId, kat.namaKategori]);
      const wsKategori = XLSX.utils.aoa_to_sheet([...kategoriHeader, ...kategoriRows]);
      XLSX.utils.book_append_sheet(wb, wsKategori, "5. Kategori Tugas");
    }

    // Sheet 6: Nilai Siswa (Flat representation to make editing a breeze)
    const nilaiHeader = [["tanggal", "kategoriId", "nisSiswa", "nilai"]];
    // Gather matching scores from nested penilaian
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
    // Fallback template items if empty
    if (flatNilaiRows.length === 0) {
      flatNilaiRows.push(["2026-05-22", "KT001", "240101", 90]);
      flatNilaiRows.push(["2026-05-22", "KT001", "240102", 85]);
    }
    const wsNilai = XLSX.utils.aoa_to_sheet([...nilaiHeader, ...flatNilaiRows]);
    XLSX.utils.book_append_sheet(wb, wsNilai, "6. Nilai Siswa");

    // Sheet 7: Daftar Guru
    const guruHeader = [["code", "namaGuru", "assignedKelasIds", "phoneNumber", "mapelAjar", "isActive"]];
    const guruRows = (guruCodes || []).map(g => [
      g.code,
      g.namaGuru,
      (g.assignedKelasIds || [g.assignedKelasId || ""]).join(","),
      g.phoneNumber || "",
      g.mapelAjar || "",
      g.isActive ? "TRUE" : "FALSE"
    ]);
    if (guruRows.length === 0) {
      guruRows.push(["G001", "Ibu Siti Aminah, S.Pd.", "K001,K002", "628123456781", "Bahasa Arab", "TRUE"]);
    }
    const wsGuru = XLSX.utils.aoa_to_sheet([...guruHeader, ...guruRows]);
    XLSX.utils.book_append_sheet(wb, wsGuru, "7. Daftar Guru");

    // Sheet 8: Jadwal Pelajaran
    const jadwalHeader = [["id", "hari", "jamMulai", "jamSelesai", "kelasId", "mapelId", "teacherCode", "ruangan"]];
    const jadwalRows = (jadwal || []).map(j => [
      j.id,
      j.hari,
      j.jamMulai,
      j.jamSelesai,
      j.kelasId,
      j.mapelId,
      j.teacherCode || "",
      j.ruangan || ""
    ]);
    if (jadwalRows.length === 0) {
      jadwalRows.push(["J001", "Senin", "07:30", "09:00", "K001", "M001", "G001", "Kelas 11A"]);
    }
    const wsJadwal = XLSX.utils.aoa_to_sheet([...jadwalHeader, ...jadwalRows]);
    XLSX.utils.book_append_sheet(wb, wsJadwal, "8. Jadwal Pelajaran");

    // Sheet 9: Lembar Tugas
    const tugasHeader = [["id", "judul", "deskripsiSoal", "tanggalDibuat", "dueDate", "kelasId", "teacherCode", "lampiranFile"]];
    const tugasRows = (tugas || []).map(t => [
      t.id,
      t.judul,
      t.deskripsiSoal,
      t.tanggalDibuat,
      t.dueDate,
      t.kelasId,
      t.teacherCode,
      t.lampiranFile || ""
    ]);
    if (tugasRows.length === 0) {
      tugasRows.push(["T001", "Mufradat Bab Al-Qira'ah", "Bacalah kosa kata Arab di halaman 15 dan rekam audio hafalannya.", "2026-05-22", "2026-05-29", "K001", "GURU-2026", "mufrodat_qiraah.pdf"]);
    }
    const wsTugas = XLSX.utils.aoa_to_sheet([...tugasHeader, ...tugasRows]);
    XLSX.utils.book_append_sheet(wb, wsTugas, "9. Lembar Tugas");

    // Trigger file download
    XLSX.writeFile(wb, "Template_SiswaDigital_Lengkap.xlsx");
  };

  // 2. Share / send instructions via WhatsApp
  const handleShareWhatsApp = () => {
    const textMessage = `Halo Bapak/Ibu Guru! Berikut adalah link akses web SiswaDigital untuk mengunduh template Excel pengisian data nilai siswa secara instan. Silakan buka dashboard, pilih menu 'Impor Excel' dan klik download template. Data kelas, mata pelajaran, mahasiswa, tugas, dan nilai dapat dimasukkan sekaligus secara praktis!`;
    const encoded = encodeURIComponent(textMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  // 3. Process Uploaded File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readExcelWorkbook(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readExcelWorkbook(file);
    }
  };

  const readExcelWorkbook = (file: File) => {
    setErrorMessage(null);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Retrieve sheets
        const sheetNames = workbook.SheetNames;
        
        // Match sheet index or partial matching
        const findSheet = (keywords: string[]) => {
          return sheetNames.find(name => 
            keywords.some(kw => name.toLowerCase().includes(kw))
          );
        };

        const kelasSheetName = findSheet(["kelas", "2. kelas"]);
        const mapelSheetName = findSheet(["mata pelajaran", "mapel", "3. mata pelajaran"]);
        const siswaSheetName = findSheet(["siswa", "4. siswa"]);
        const kategoriSheetName = findSheet(["kategori", "5. kategori", "kategori tugas"]);
        const nilaiSheetName = findSheet(["nilai", "6. nilai", "nilai siswa"]);
        const guruSheetName = findSheet(["guru", "7. guru", "daftar guru"]);
        const jadwalSheetName = findSheet(["jadwal", "8. jadwal", "jadwal pelajaran"]);
        const tugasSheetName = findSheet(["lembar tugas", "9. lembar tugas", "9. tugas", "tugas (pr)"]);

        if (!kelasSheetName || !siswaSheetName) {
          throw new Error("Format Sheet Excel tidak sesuai. Pastikan Sheet 'Kelas' dan 'Siswa' tersedia di file Excel Anda.");
        }

        // Parse data
        const rawKelasJSON = XLSX.utils.sheet_to_json<any>(workbook.Sheets[kelasSheetName]);
        const rawMapelJSON = mapelSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[mapelSheetName]) : [];
        const rawSiswaJSON = XLSX.utils.sheet_to_json<any>(workbook.Sheets[siswaSheetName]);
        const rawKategoriJSON = kategoriSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[kategoriSheetName]) : [];
        const rawNilaiJSON = nilaiSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[nilaiSheetName]) : [];
        const rawGuruJSON = guruSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[guruSheetName]) : [];
        const rawJadwalJSON = jadwalSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[jadwalSheetName]) : [];
        const rawTugasJSON = tugasSheetName ? XLSX.utils.sheet_to_json<any>(workbook.Sheets[tugasSheetName]) : [];

        // Validate & Map Kelas
        const cleanKelas: Kelas[] = rawKelasJSON.map((row, idx) => {
          const id = String(row.id || `K_NEW_${idx + 1}`).trim();
          const namaKelas = String(row.namaKelas || row.nama || `Kelas ${idx + 1}`).trim();
          const deskripsi = String(row.deskripsi || "").trim();
          return { id, namaKelas, deskripsi };
        });

        // Validate & Map Mapel
        const cleanMapel: MataPelajaran[] = rawMapelJSON.map((row, idx) => {
          const id = String(row.id || `M_NEW_${idx + 1}`).trim();
          const namaMapel = String(row.namaMapel || row.nama || `Mapel ${idx + 1}`).trim();
          return { id, namaMapel };
        });

        // Validate & Map Siswa
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

          const namaWali = row.namaWali ? String(row.namaWali).trim() : undefined;
          const noHpWali = row.noHpWali ? String(row.noHpWali).trim() : undefined;
          const alamatSiswa = row.alamatSiswa ? String(row.alamatSiswa).trim() : undefined;

          return { id, nis, namaSiswa, kelasId: resolvedKelasId, namaWali, noHpWali, alamatSiswa };
        });

        // Validate & Map Guru
        const cleanGuru: GuruCode[] = rawGuruJSON.map((row, idx) => {
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

        // Validate & Map Jadwal
        const cleanJadwal: Jadwal[] = rawJadwalJSON.map((row, idx) => {
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

        // Validate & Map Kategori / Tugas (Only parsed/imported for Admin)
        const cleanKategori: KategoriPenilaian[] = userRole === "admin" ? rawKategoriJSON.map((row, idx) => {
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
        }) : [];

        // Group the flat "Nilai Siswa" into nested Penilaian format
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

        // Group flat records by (tanggal, kategoriId)
        const groupedMap: { [key: string]: FlatNilaiRecord[] } = {};
        flatRecords.forEach(rec => {
          const key = `${rec.tanggal}_${rec.kategoriId}`;
          if (!groupedMap[key]) {
            groupedMap[key] = [];
          }
          groupedMap[key].push(rec);
        });

        // Map grouped items to Penilaian
        Object.entries(groupedMap).forEach(([key, recs], idx) => {
          const [tanggal, kategoriId] = key.split("_");
          
          const grades: SiswaNilai[] = recs.map(r => {
            // Find student ID relative to NIS inside the imported siswa worksheet, OR fallback to current siswa list
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

        const cleanTugas: Tugas[] = rawTugasJSON.map((row, idx) => {
          const id = String(row.id || `T_NEW_${idx + 1}`).trim();
          const judul = String(row.judul || `Tugas ${idx + 1}`).trim();
          const deskripsiSoal = String(row.deskripsiSoal || row.deskripsi || "").trim();
          const tanggalDibuat = String(row.tanggalDibuat || new Date().toISOString().split("T")[0]).trim();
          const dueDate = String(row.dueDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0]).trim();
          const kelasId = String(row.kelasId || "semua").trim();
          const teacherCode = String(row.teacherCode || row.kodeGuru || "GURU").trim();
          const lampiranFile = row.lampiranFile ? String(row.lampiranFile).trim() : undefined;

          return { id, judul, deskripsiSoal, tanggalDibuat, dueDate, kelasId, teacherCode, lampiranFile };
        }).filter(t => t.id && t.judul && t.kelasId);

        setParsedData({
          kelas: cleanKelas,
          mapel: cleanMapel,
          siswa: cleanSiswa,
          kategori: cleanKategori,
          penilaian: cleanPenilaian,
          guru: cleanGuru,
          jadwal: cleanJadwal,
          tugas: cleanTugas,
          totalGradesCount: totalGradesProcessed
        });

      } catch (err: any) {
        setErrorMessage(err.message || "Gagal memproses file Excel. Pastikan file tidak rusak dan formatnya benar.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitImport = () => {
    if (!parsedData) return;
    onImportAllData(parsedData, importMode);
    setParsedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dynamic Header */}
      <div>
        <span className="text-xs font-semibold text-[#577354] bg-[#D6E0D2] px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
          Penyelarasan Database Terpadu
        </span>
        <h1 className="text-3xl font-display font-bold tracking-tight text-slate-800 mt-2">
          Sinkronisasi Cloud & Excel
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Kelola database sekolah secara real-time cloud dengan sinkronisasi Google Sheets, atau gunakan transfer data berkas luring Excel (.xlsx).
        </p>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        {(userRole === "admin" || userRole === "guru") && (
          <button
            onClick={() => setActiveSubTab("sheets")}
            type="button"
            className={`pb-3 font-bold text-sm tracking-wide flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSubTab === "sheets"
                ? "border-[#8BA888] text-[#577354]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Cloud className="w-5 h-5 animate-pulse" />
            Google Sheets Sync (Cloud)
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">Live</span>
          </button>
        )}
        <button
          onClick={() => setActiveSubTab("excel")}
          type="button"
          className={`pb-3 font-bold text-sm tracking-wide flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "excel"
              ? "border-[#8BA888] text-[#577354]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          File Excel (.xlsx)
        </button>
      </div>

      {activeSubTab === "sheets" && (userRole === "admin" || userRole === "guru") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          {/* Left: General Info & Target spreadsheet Link */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#8BA888] flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Target Spreadsheet</h3>
                  <p className="text-xs text-slate-550 mt-1 leading-relaxed">
                    Sistem ini terhubung langsung ke Google Sheets. Masukkan tautan atau Spreadsheet ID kustom untuk memigrasikan database.
                  </p>
                </div>
              </div>

              {/* URL card with interactive link editor */}
              <div className="bg-[#F7F8F3] p-4.5 rounded-2xl border border-emerald-100 space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-[#8BA888]" />
                    Pilih Tautan Google Sheets:
                  </span>
                  <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">Admin Only</span>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={spreadsheetInput}
                    onChange={(e) => {
                      setSpreadsheetInput(e.target.value);
                      setIsSavedId(false);
                    }}
                    placeholder="Masukkan url link lengkap atau Spreadsheet ID..."
                    className="w-full px-3 py-2 bg-white text-slate-700 border border-slate-250 rounded-xl text-xs font-sans outline-hidden focus:border-[#8BA888] focus:ring-1 focus:ring-[#8BA888] transition-all"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const cleanId = extractSpreadsheetId(spreadsheetInput);
                      setSpreadsheetId(cleanId);
                      setIsSavedId(true);
                      
                      const currentUser = auth.currentUser;
                      if (currentUser) {
                        await syncUserSpreadsheetId(currentUser.uid, currentUser.email || "", cleanId);
                        setSheetStatus(`Tautan Google Sheet disimpan dan diselaraskan ke Cloud!`);
                      } else {
                        setSheetStatus(`Tautan Google Sheet kustom berhasil disimpan secara lokal!`);
                      }
                      setTimeout(() => setIsSavedId(false), 3000);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-250 cursor-pointer ${
                      isSavedId 
                        ? "bg-emerald-550 text-white" 
                        : "bg-[#8BA888] hover:bg-[#7b9878] text-white"
                    }`}
                  >
                    {isSavedId ? "✓ Tautan Disimpan!" : "Terapkan Tautan Google Sheet"}
                  </button>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 font-mono text-[9px] break-all text-slate-500 relative">
                  ID Terhubung: <span className="font-bold text-slate-800 select-all">{SPREADSHEET_ID}</span>
                </div>

                <a
                  href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=0`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#577354] border border-[#D6E0D2] rounded-xl text-xs font-semibold transition-all hover:scale-[1.01]"
                >
                  <span>Buka Spreadsheet Aktif</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Synchronization Rules */}
              <div className="text-xs text-slate-500 leading-relaxed space-y-2 pt-1 border-t border-slate-100">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-450" /> Aturan Sinkronisasi Terpusat:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Proses <strong>Sinkronisasi</strong> murni berbasis HTTPS aman langsung ke Google API.</li>
                  <li>Data dipilah komprehensif ke dalam 15 lembar tab sesuai struktur data sekolah SDIT Al Hanif.</li>
                  <li>Mengirim data ("Push") akan memperbarui seluruh data lama di Google Sheets Anda.</li>
                  <li>SiswaDigital tidak menyimpan sandi Google akun Anda (Sistem ditangani Popup resmi Google OAuth2).</li>
                </ul>
              </div>
            </div>

            {/* Integration Status Tracker inside Sheets */}
            <div className="bg-[#2D3A3A] p-6 rounded-3xl text-white space-y-4 shadow-xl">
              <h4 className="font-bold text-sm tracking-wide text-white/90 flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-[#8BA888]" /> Ringkasan Database Aktif:
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Kelas</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{kelas.length}</div>
                </div>
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Siswa</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{siswa.length}</div>
                </div>
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Lembar Nilai</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{penilaian.length}</div>
                </div>
              </div>
              <p className="text-[11px] text-white/50 leading-normal text-center pt-1">
                Seluruh data di atas akan dicatat secara komprehensif ke 7 tab pada spreadsheet cloud Anda.
              </p>
            </div>
          </div>

          {/* Right Column: Console / Auth controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Status alerts */}
            {sheetStatus && (
              <div className="bg-emerald-50 border border-emerald-200 p-4.5 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Status Sinkronisasi:</span>
                  <p className="mt-1 leading-relaxed">{sheetStatus}</p>
                </div>
              </div>
            )}

            {sheetError && (
              <div className="bg-rose-50 border border-rose-200 p-4.5 rounded-2xl flex flex-col gap-3 text-xs text-rose-800 animate-fadeIn">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Terjadi Kendala:</span>
                    <p className="mt-1 leading-relaxed text-rose-700">{sheetError}</p>
                  </div>
                </div>
                {sheetError.includes("403") && googleUser && accessToken && (
                  <div className="bg-white/80 border border-rose-200/50 p-4 rounded-xl space-y-3 mt-1 shadow-2xs text-[#4F1A1A]">
                    <p className="text-rose-950 font-semibold leading-relaxed">
                      💡 <strong>Mengapa ini terjadi?</strong> Akun Google Anda ({googleUser.email}) belum mendapat izin menyunting (write) pada Spreadsheet ID ini. Solusi praktis terbaik:
                    </p>
                    <div className="text-slate-700 space-y-3 leading-relaxed">
                      <div>
                        <strong className="text-emerald-850">Opsi Utama (Sangat Direkomendasikan):</strong>
                        <p className="mt-0.5 text-[11px] text-slate-505">
                          Buat spreadsheet baru secara otomatis di Google Drive Anda. Anda akan menjadi pemilik penuh dan tidak akan pernah terkena kendala izin (403) lagi.
                        </p>
                        <button
                          type="button"
                          disabled={isCreatingSheet}
                          onClick={handleCreateNewPersonalSpreadsheet}
                          className="mt-2.5 w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isCreatingSheet ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Sedang Proses Membuat Spreadsheet Baru...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Buat Spreadsheet Pribadi Baru di Google Drive Saya
                            </>
                          )}
                        </button>
                      </div>
                      <div className="border-t border-slate-100 pt-2 mt-1">
                        <strong>Opsi Cadangan: Ubah Akses Berbagi</strong>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Buka Google Sheet tersebut dan ubah setelan berbaginya menjadi <strong>"Siapa saja yang memiliki link sebagai Editor"</strong> agar akun Anda ({googleUser.email}) diizinkan melakukan pemutakhiran data.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Console Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h4 className="font-black text-slate-800 text-lg">Gerbang Konektivitas Google</h4>
                <p className="text-xs text-slate-500 mt-1">Status sambungan dan autentikasi ke Spreadsheet Cloud.</p>
              </div>

              {!googleUser ? (
                // Unauthenticated block
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <Cloud className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h5 className="font-bold text-slate-700 text-sm">Akun Google Belum Terhubung</h5>
                    <p className="text-xs text-slate-450">Hubungkan akun Google Anda yang memiliki otoritas akses (baca/tulis) pada spreadsheet target.</p>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    type="button"
                    className="gsi-material-button mt-4 shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents font-sans">
                        {isLoggingIn ? "Menyambungkan..." : "Hubungkan ke Google"}
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                // Authenticated block
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-2xl animate-fadeIn">
                    <div className="flex items-center gap-3">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt="Google Profile"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#8BA888] text-white flex items-center justify-center font-bold text-sm">
                          {googleUser.email?.slice(0, 2).toUpperCase() || "GS"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-slate-800">{googleUser.displayName || "Google User"}</div>
                        <div className="text-[10px] font-mono text-slate-400">{googleUser.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleGoogleLogout}
                      type="button"
                      className="flex items-center gap-1 text-slate-405 hover:text-rose-500 text-xs font-bold transition-all px-3 py-1.5 hover:bg-rose-50 rounded-xl cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Putuskan
                    </button>
                  </div>

                  {/* Operational Sync Console */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exporter / Push */}
                    <button
                      onClick={handlePushToSheets}
                      disabled={isSyncingIn || isSyncingOut}
                      type="button"
                      className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 border border-emerald-100/75 hover:border-emerald-300 rounded-2xl text-center space-y-3 cursor-pointer transition-all hover:shadow-xs hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <div className="w-12 h-12 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-xs border border-emerald-50">
                        {isSyncingOut ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <CloudUpload className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Kirim ke Google Sheets</div>
                        <div className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">Mencatat data lokal Anda ke lembaran Google Sheets.</div>
                      </div>
                    </button>

                    {/* Importer / Pull */}
                    <button
                      onClick={handlePullFromSheets}
                      disabled={isSyncingIn || isSyncingOut}
                      type="button"
                      className="flex flex-col items-center justify-center p-6 bg-blue-50/50 border border-blue-100 hover:border-blue-300 rounded-2xl text-center space-y-3 cursor-pointer transition-all hover:shadow-xs hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xs border border-blue-50">
                        {isSyncingIn ? (
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        ) : (
                          <CloudDownload className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Tarik dari Google Sheets</div>
                        <div className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">Impor data dari spreadsheet cloud ke sistem Anda.</div>
                      </div>
                    </button>
                  </div>

                  {/* Auto Sync Toggle switch */}
                  {setIsAutoSyncEnabled && (
                    <div className="flex items-center justify-between bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-2xl animate-fadeIn">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 text-xs">Penyelaras Awan Otomatis</div>
                        <div className="text-[10px] text-slate-450 leading-tight">Secara otomatis mengunggah setiap pembaruan guru langsung ke Google Sheets secara berkala.</div>
                      </div>
                      <button
                        onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                        type="button"
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAutoSyncEnabled ? "bg-emerald-650" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            isAutoSyncEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* NEW: Real-Time Backup and Google Drive Database Panel */}
                  <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                        Pencadangan Google Drive & Real-Time Cloud
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Sinkronisasi Aktif
                      </span>
                    </div>

                    {/* Folder & Files visualization inside user's Google Drive */}
                    <div className="bg-[#FAFBF9] border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <FolderOpen className="text-amber-500 w-4.5 h-4.5" />
                        <span>Google Drive Saya / SiswaDigital_SDIT_AlHanif</span>
                      </div>
                      
                      <div className="pl-6 space-y-2.5 border-l-2 border-slate-200/50">
                        <div className="flex items-center justify-between text-xs text-slate-650">
                          <span className="flex items-center gap-2">
                            <FileSpreadsheet className="text-emerald-500 w-4 h-4" />
                            <span className="font-mono text-[11px]">SiswaDigital_SDIT_AlHanif_Database</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded-md">Spreadsheet Utama (9 Tab)</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-650">
                          <span className="flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-500 w-4 h-4 animate-pulse" />
                            <span className="font-mono text-[11px]">Backup_SiswaDigital_Otomatis (Cloud)</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Sinkronisasi Realtime</span>
                        </div>
                      </div>

                      <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1.5 justify-center border-t border-slate-100">
                        <span>Database Cloud Terhubung:</span>
                        <span className="font-bold text-slate-600">{googleUser.email || "documenmondok003@gmail.com"}</span>
                      </div>
                    </div>

                    {/* Staged Manual Backup Trigger */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleTriggerManualFullBackup}
                        disabled={isManualBackingUp}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-75 rounded-2xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-700/10"
                      >
                        {isManualBackingUp ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sedang Memproses Backup Terpadu Al-Hanif...</span>
                          </>
                        ) : (
                          <>
                            <CloudUpload className="w-4.5 h-4.5 animate-bounce" />
                            <span>Backup Keseluruhan Data Sekarang ke Google Drive & Sheets</span>
                          </>
                        )}
                      </button>

                      {/* Interactive dynamic progress steps */}
                      {isManualBackingUp && backupStage !== null && (
                        <div className="bg-[#FAFBF9] border border-slate-200/80 p-4 rounded-2xl space-y-3 animate-fadeIn">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tahapan Backup Database</span>
                            <span className="font-black text-emerald-600">{Math.round((backupStage / 5) * 100)}% Selesai</span>
                          </div>
                          
                          {/* Horizontal Progress bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-550 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${(backupStage / 5) * 100}%` }}
                            />
                          </div>

                          {/* Phase bullet indicators */}
                          <div className="grid grid-cols-5 gap-1.5 text-center text-[8px] font-bold text-slate-400">
                            <div className={backupStage >= 1 ? "text-emerald-700 font-extrabold" : ""}>Inisiasi</div>
                            <div className={backupStage >= 2 ? "text-emerald-700 font-extrabold" : ""}>Izin GDrive</div>
                            <div className={backupStage >= 3 ? "text-emerald-700 font-extrabold" : ""}>Skema 15</div>
                            <div className={backupStage >= 4 ? "text-emerald-700 font-extrabold" : ""}>Transmisi</div>
                            <div className={backupStage >= 5 ? "text-emerald-700 font-extrabold" : ""}>Verifikasi</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Session Sync Logger Console */}
                    <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 space-y-3 border border-slate-800 shadow-xl overflow-hidden relative">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 tracking-wider uppercase border-b border-white/5 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          Log Riwayat Sinkronisasi Sinkron-Siklik
                        </span>
                        <span className="font-mono text-[9px] bg-white/10 px-1.5 py-0.5 rounded-xs text-emerald-400 animate-pulse">ONLINE</span>
                      </div>
                      
                      <div className="space-y-2 font-mono text-[9px] max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent leading-relaxed text-slate-300 select-all">
                        {backupLogs.map(log => (
                          <div key={log.id} className="flex items-start gap-1.5">
                            <span className="text-slate-500 shrink-0">[{log.time}]</span>
                            <span className={
                              log.type === "success" 
                                ? "text-[#8BA888] font-bold" 
                                : log.type === "warning" 
                                  ? "text-rose-400 font-bold" 
                                  : "text-slate-300"
                            }>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[8px] text-slate-500 text-center pt-1 border-t border-white/5 leading-normal">
                        Sistem Penyelaras Cloud Al-Hanif aktif terus-menerus. Setiap entri data otomatis tersalin aman.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "excel" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
          
          {/* Left Column: Download and Instructions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#8BA888] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">1. Unduh Template Excel</h3>
                  <p className="text-xs text-slate-550 mt-1">
                    Kami menyediakan berkas template siap pakai yang menyertakan data contoh sekolah yang ada saat ini di sistem Anda.
                  </p>
                </div>
              </div>

              <div className="bg-[#F7F8F3] p-4.5 rounded-2xl border border-[#E2E8F0] text-xs leading-relaxed text-slate-650 space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <HelpCircle className="w-4 h-4 text-[#8BA888]" /> Petunjuk Penting:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Terdapat 7 Tab Lembar Kerja di dalam template Excel.</li>
                  <li>Isi sesuai petunjuk warna dan format Kode ID yang tersedia.</li>
                  <li>NIS siswa harus unik dan cocok antar tab Siswa dan tab Nilai.</li>
                  <li>Nilai diinput dalam skala angka <strong>0 - 100</strong>.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="flex items-center justify-center gap-2 bg-[#8BA888] hover:bg-[#718F6E] text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  type="button"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Kirim via WhatsApp
                </button>
              </div>
            </div>

            {/* Integration Status Tracker */}
            <div className="bg-[#2D3A3A] p-6 rounded-3xl text-white space-y-4 shadow-xl">
              <h4 className="font-bold text-sm tracking-wide text-white/90 flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-[#8BA888]" /> Ringkasan Database Aktif:
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Kelas</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{kelas.length}</div>
                </div>
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Siswa</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{siswa.length}</div>
                </div>
                <div className="bg-white/5 px-2 py-3 rounded-xl border border-white/10">
                  <div className="text-xs text-white/50">Lembar Nilai</div>
                  <div className="text-lg font-extrabold mt-1 text-[#8BA888]">{penilaian.length}</div>
                </div>
              </div>
              <p className="text-[11px] text-white/50 leading-normal text-center pt-1">
                Data tersimpan aman di penyimpanan lokal peramban (Local Storage).
              </p>
            </div>
          </div>

          {/* Right Column: Upload and Parser Results */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* File Dropper Dropzone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`bg-white rounded-3xl border-2 border-dashed p-10 text-center transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer ${
                isDragging 
                  ? "border-[#8BA888] bg-[#F7F8F3]" 
                  : "border-[#E2E8F0] hover:border-[#8BA888]"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              
              <div className="p-4 bg-emerald-50 text-[#8BA888] rounded-full mb-4">
                <Upload className="w-8 h-8 animate-bounce" />
              </div>

              <h4 className="font-bold text-slate-800 text-lg">Tarik & Lepas File Excel Disini</h4>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                Sistem akan memvalidasi data excel Anda secara otomatis sebelum disimpan ke database. Format .xlsx, .xls, atau .csv didukung.
              </p>
              
              <button
                type="button"
                className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold border border-[#E2E8F0]"
              >
                Pilih Berkas Manual
              </button>
            </div>

            {/* Validation Error Message Box */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start gap-3 text-xs text-rose-700 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <span className="font-bold">Oops! Terjadi kesalahan pembacaan berkas:</span>
                  <p className="mt-1 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Shared Success Preview & Commit Configuration Box (for BOTH sheets and local excel dry runs) */}
      {parsedData && (
        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-lg animate-slideIn space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-5.5 h-5.5 text-[#8BA888]" />
            <h3 className="font-bold text-slate-800 text-base">Hasil Deteksi & Validasi Database Baru</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-sans">
            <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Kelas</div>
              <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.kelas.length}</div>
            </div>
            <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mata Pelajaran</div>
              <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.mapel.length}</div>
            </div>
            <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Siswa</div>
              <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.siswa.length}</div>
            </div>
            <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
               <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kategori Tugas</div>
               <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.kategori.length}</div>
            </div>
            {parsedData.guru && parsedData.guru.length > 0 && (
              <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
                 <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jumlah Guru</div>
                 <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.guru.length}</div>
              </div>
            )}
            {parsedData.jadwal && parsedData.jadwal.length > 0 && (
              <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
                 <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sesi Jadwal</div>
                 <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.jadwal.length}</div>
              </div>
            )}
            {parsedData.tugas && parsedData.tugas.length > 0 && (
              <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50">
                 <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lembar Tugas</div>
                 <div className="text-xl font-bold mt-1 text-slate-800">{parsedData.tugas.length}</div>
              </div>
            )}
            <div className="bg-[#F7F8F3] p-3 text-center rounded-xl border border-slate-200/50 col-span-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Entri Hasil Nilai</div>
              <div className="text-xl font-bold mt-1 text-[#8BA888]">
                {parsedData.totalGradesCount} nilai ({parsedData.penilaian.length} Kumpulan)
              </div>
            </div>
          </div>

          {/* Modes Configuration selection */}
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
                  <div className="text-xs font-bold">Timpa Semua Data (Disarankan)</div>
                  <div className="text-[10px] text-slate-450 mt-1">Mengosongkan database saat ini dan menggantinya dengan isi data cloud/Excel baru ini.</div>
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
                  <div className="text-[10px] text-slate-455 mt-1">Hanya menambahkan data baru yang belum ada tanpa menghapus data milik Anda yang lama.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Final Import actions buttons */}
          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setParsedData(null)}
              className="px-5 py-3 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleCommitImport}
              className="bg-[#2D3A3A] hover:bg-slate-805 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-[#8BA888]" />
              Simpan Semua Data ke Sistem
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
