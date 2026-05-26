import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart2, 
  Users, 
  ClipboardCheck, 
  BookOpen, 
  AlertCircle, 
  Phone, 
  CheckSquare, 
  Search, 
  Filter, 
  Award, 
  Calendar, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  CalendarDays, 
  MessageSquare, 
  Check, 
  X, 
  User,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Share2,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { 
  Kelas, 
  Siswa, 
  KategoriPenilaian, 
  Penilaian, 
  AbsenSiswa, 
  Tugas, 
  PengumpulanTugas, 
  UjianPraktek, 
  GuruCode, 
  MataPelajaran, 
  Jadwal 
} from "../types";
import { logWhatsAppSent, WALog } from "../utils/waLogger";
import * as XLSX from "xlsx";

interface RekapTerpaduProps {
  kelas: Kelas[];
  siswa: Siswa[];
  mapel: MataPelajaran[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  absenSiswa: AbsenSiswa[];
  tugas: Tugas[];
  pengumpulanTugas: PengumpulanTugas[];
  ujianPraktek?: UjianPraktek[];
  guruCodes: GuruCode[];
  jadwal?: Jadwal[];
  activeGuruProfile?: GuruCode | null;
  userRole: "admin" | "guru" | "wali";
  showNotification: (text: string, type?: "success" | "neutral") => void;
}

type TabType = "AKADEMIK" | "KEHADIRAN" | "TUGAS" | "KONTAK" | "LOGS";

export default function RekapTerpadu({
  kelas,
  siswa,
  mapel,
  kategori,
  penilaian,
  absenSiswa,
  tugas,
  pengumpulanTugas,
  ujianPraktek = [],
  guruCodes,
  jadwal = [],
  activeGuruProfile,
  userRole,
  showNotification
}: RekapTerpaduProps) {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabType>("AKADEMIK");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Siswa | null>(null);
  const [alertFilter, setAlertFilter] = useState<"ALL" | "LOW_GRADE" | "LOW_ATTEND">("ALL");
  
  // Local state for WA Sent logs trigger
  const [waLogs, setWaLogs] = useState<WALog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Pagination states to prevent lag with big data
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, alertFilter, searchQuery]);

  // Load WA send logs helper
  const loadWaLogs = () => {
    try {
      const saved = localStorage.getItem("siswadigital_wa_sent_logs") || "[]";
      const parsed = JSON.parse(saved);
      setWaLogs(Array.isArray(parsed) ? parsed : []);
    } catch {
      setWaLogs([]);
    }
  };

  useEffect(() => {
    loadWaLogs();
    
    const handleLogsUpdate = () => {
      loadWaLogs();
    };
    
    window.addEventListener("siswadigital_wa_logs_updated", handleLogsUpdate);
    return () => {
      window.removeEventListener("siswadigital_wa_logs_updated", handleLogsUpdate);
    };
  }, []);

  // Filter classes taught by Guru if role = guru
  const allowedClassIds = useMemo(() => {
    if (userRole === "admin") {
      return kelas.map(k => k.id);
    }
    if (userRole === "guru" && activeGuruProfile) {
      const assignedIds = activeGuruProfile.assignedKelasIds || (activeGuruProfile.assignedKelasId ? [activeGuruProfile.assignedKelasId] : []);
      const scheduledIds = (jadwal || [])
        .filter(j => j.teacherCode === activeGuruProfile.code)
        .map(j => j.kelasId);
      const combined = Array.from(new Set([...assignedIds, ...scheduledIds]));
      return combined;
    }
    return kelas.map(k => k.id);
  }, [kelas, userRole, activeGuruProfile, jadwal]);

  const dropDownKelasOptions = useMemo(() => {
    return kelas.filter(k => allowedClassIds.includes(k.id));
  }, [kelas, allowedClassIds]);

  // Handle class default options assignment
  useEffect(() => {
    if (dropDownKelasOptions.length > 0 && selectedClassId !== "ALL" && !dropDownKelasOptions.some(k => k.id === selectedClassId)) {
      setSelectedClassId("ALL");
    }
  }, [dropDownKelasOptions, selectedClassId]);

  // Core filter logic for student profiles
  const targetStudents = useMemo(() => {
    let list = siswa.filter(s => {
      // Must belong to allowed classes
      if (!allowedClassIds.includes(s.kelasId)) return false;
      
      // Filter by selected individual Class
      if (selectedClassId !== "ALL" && s.kelasId !== selectedClassId) return false;
      
      return true;
    });

    // Handle search text query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.namaSiswa.toLowerCase().includes(q) || s.nis.includes(q));
    }

    return list;
  }, [siswa, allowedClassIds, selectedClassId, searchQuery]);

  // Automatically sync, validate, or dismiss selectedStudent when class filters or student details change
  useEffect(() => {
    if (selectedStudent) {
      const freshStudentInfo = targetStudents.find(s => s.id === selectedStudent.id);
      if (freshStudentInfo) {
        if (JSON.stringify(freshStudentInfo) !== JSON.stringify(selectedStudent)) {
          setSelectedStudent(freshStudentInfo);
        }
      } else {
        setSelectedStudent(null);
      }
    }
  }, [targetStudents, selectedStudent]);

  // Compile detailed profiles of filtered students
  const computedStudentMetrics = useMemo(() => {
    // 1. Group Absensi in O(Ab)
    const absensiMap = new Map<string, typeof absenSiswa>();
    absenSiswa.forEach(a => {
      let arr = absensiMap.get(a.siswaId);
      if (!arr) {
        arr = [];
        absensiMap.set(a.siswaId, arr);
      }
      arr.push(a);
    });

    // 2. Map existing kategoriId to quick check set in O(Kat)
    const kategoriSet = new Set(kategori.map(k => k.id));

    // 3. Prebuild Grades sum and count for each student in O(Pen)
    const gradesSumMap = new Map<string, number>();
    const gradesCountMap = new Map<string, number>();

    penilaian.forEach(p => {
      if (kategoriSet.has(p.kategoriId)) {
        p.grades.forEach(g => {
          const currentSum = gradesSumMap.get(g.siswaId) || 0;
          const currentCount = gradesCountMap.get(g.siswaId) || 0;
          gradesSumMap.set(g.siswaId, currentSum + g.nilai);
          gradesCountMap.set(g.siswaId, currentCount + 1);
        });
      }
    });

    // 4. Group Homework (tugas) by kelasId in O(Tugas)
    const homeworkMap = new Map<string, typeof tugas>();
    tugas.forEach(t => {
      let arr = homeworkMap.get(t.kelasId);
      if (!arr) {
        arr = [];
        homeworkMap.set(t.kelasId, arr);
      }
      arr.push(t);
    });
    const homeworkSemua = homeworkMap.get("semua") || [];

    // 5. Group Submissions (pengumpulanTugas) by student ID in O(Sub)
    const submissionsMap = new Map<string, typeof pengumpulanTugas>();
    pengumpulanTugas.forEach(p => {
      let arr = submissionsMap.get(p.siswaId);
      if (!arr) {
        arr = [];
        submissionsMap.set(p.siswaId, arr);
      }
      arr.push(p);
    });

    return targetStudents.map(student => {
      // 1. Calculate Attendance
      const studentAbsen = absensiMap.get(student.id) || [];
      const totalDays = studentAbsen.length;
      
      let daysHadir = 0;
      let daysSakit = 0;
      let daysIzin = 0;
      let daysAlpa = 0;

      for (let i = 0; i < studentAbsen.length; i++) {
        const stat = studentAbsen[i].status;
        if (stat === "Hadir") daysHadir++;
        else if (stat === "Sakit") daysSakit++;
        else if (stat === "Izin") daysIzin++;
        else if (stat === "Alpa") daysAlpa++;
      }
      const attendancePct = totalDays > 0 ? Math.round((daysHadir / totalDays) * 100) : 100;

      // 2. Compute Grades across academic categorizations
      const gradeSum = gradesSumMap.get(student.id) || 0;
      const gradeCount = gradesCountMap.get(student.id) || 0;
      const academicAvg = gradeCount > 0 ? Math.round((gradeSum / gradeCount) * 10) / 10 : 80;

      // 3. Homework progress
      const classTugas = homeworkMap.get(student.kelasId) || [];
      const tugasLength = classTugas.length + homeworkSemua.length;
      const submittedTugas = submissionsMap.get(student.id) || [];
      const tugasRatio = tugasLength > 0 ? Math.round((submittedTugas.length / tugasLength) * 100) : 100;

      return {
        student,
        attendancePct,
        daysHadir,
        daysSakit,
        daysIzin,
        daysAlpa,
        totalDays,
        academicAvg,
        tugasCount: tugasLength,
        submittedCount: submittedTugas.length,
        tugasRatio,
        isAlertLowGrade: academicAvg < 75,
        isAlertLowAttendance: attendancePct < 80
      };
    });
  }, [targetStudents, absenSiswa, penilaian, kategori, tugas, pengumpulanTugas]);

  // Alert Filtering Trigger
  const finalFilteredMetrics = useMemo(() => {
    let list = computedStudentMetrics;
    if (alertFilter === "LOW_GRADE") {
      list = list.filter(m => m.isAlertLowGrade);
    } else if (alertFilter === "LOW_ATTEND") {
      list = list.filter(m => m.isAlertLowAttendance);
    }
    return list;
  }, [computedStudentMetrics, alertFilter]);

  const paginatedMetrics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return finalFilteredMetrics.slice(startIndex, startIndex + itemsPerPage);
  }, [finalFilteredMetrics, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(finalFilteredMetrics.length / itemsPerPage);

  // Meta stats summary calculation
  const statsOverview = useMemo(() => {
    const sLen = finalFilteredMetrics.length;
    if (sLen === 0) {
      return { count: 0, academicAvg: 0, attendanceAvg: 0, hwRatioAvg: 0, alertCount: 0 };
    }
    let totalGrade = 0;
    let totalAttendance = 0;
    let totalTugasRatio = 0;
    let alertCount = 0;

    finalFilteredMetrics.forEach(m => {
      totalGrade += m.academicAvg;
      totalAttendance += m.attendancePct;
      totalTugasRatio += m.tugasRatio;
      if (m.isAlertLowGrade || m.isAlertLowAttendance) {
        alertCount++;
      }
    });

    return {
      count: sLen,
      academicAvg: Math.round((totalGrade / sLen) * 10) / 10,
      attendanceAvg: Math.round(totalAttendance / sLen),
      hwRatioAvg: Math.round(totalTugasRatio / sLen),
      alertCount
    };
  }, [finalFilteredMetrics]);

  // Export integrated data sheets as clean Excel Workbook
  const handleExportAllToExcel = () => {
    if (finalFilteredMetrics.length === 0) {
      showNotification("Tidak ada data untuk diekspor!", "neutral");
      return;
    }

    const dataToExport = finalFilteredMetrics.map((m, idx) => {
      const kName = kelas.find(k => k.id === m.student.kelasId)?.namaKelas || "-";
      return {
        "No": idx + 1,
        "Nomor Induk Siswa (NIS)": m.student.nis,
        "Nama Lengkap": m.student.namaSiswa,
        "Rombel Kelas": kName,
        "Nama Wali / Orang Tua": m.student.namaWali || "-",
        "No WhatsApp Wali": m.student.noHpWali || "-",
        "Rata-Rata Nilai Akademik": m.academicAvg,
        "Jumlah Absen Direkam": m.totalDays,
        "Hadir (H)": m.daysHadir,
        "Sakit (S)": m.daysSakit,
        "Izin (I)": m.daysIzin,
        "Tanpa Keterangan (A)": m.daysAlpa,
        "Persentase Kehadiran (%)": `${m.attendancePct}%`,
        "Rasio Tugas Terkumpul (%)": `${m.tugasRatio}%`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Rekap Al Hanif");
    XLSX.writeFile(workbook, `Rekapitulasi_SiswaDigital_Integrated_Export.xlsx`);
    showNotification("Rekap data terintegrasi sukses diunduh sebagai Excel!", "success");
  };

  // Log Clear Command (Admin Only)
  const handleClearWaLogs = () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan riwayat log WA dan siaran? Tindakan ini tidak dapat dibatalkan.")) {
      localStorage.removeItem("siswadigital_wa_sent_logs");
      loadWaLogs();
      showNotification("Seluruh rekaman audit log WhatsApp berhasil dibersihkan!", "success");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-left" id="rekap-terpadu-portal-root">
      
      {/* Formal Header strictly for Printout / PDF */}
      <div className="hidden print:block border-b-4 border-slate-800 pb-5 mb-6 text-center">
        <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-900">
          REKAPITULASI PENGAJARAN & DATA INTEGRASI AKADEMIK AL HANIF
        </h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
          {userRole === "admin" ? "SISTEM AUDIT MASTER & REKAPITULASI SEKOLAH" : "LAPORAN REKAPITULASI METRIKS PENGAJARAN PENDIDIK"}
        </p>
        <div className="flex justify-between items-center text-xs text-slate-500 mt-4 border-t border-slate-150 pt-2 font-mono">
          <span>Rombel/Kelas: <strong className="text-slate-800">
            {selectedClassId === "ALL" ? "Semua Rombel DIAJAR" : kelas.find(k => k.id === selectedClassId)?.namaKelas || selectedClassId}
          </strong></span>
          <span>Saringan Performa: <strong className="text-slate-800">
            {alertFilter === "ALL" ? "Semua Siswa" : alertFilter === "LOW_GRADE" ? "Nilai < 75" : "Absensi < 80%"}
          </strong></span>
          <span>Mata Pelajaran: <strong className="text-slate-800">Bahasa Arab & Pendidikan</strong></span>
          <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Visual Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5 no-print">
        <div>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {userRole === "admin" ? "Sistem Audit Master & Rekapitulasi" : "Panel Rekap Pengajaran Pendidik"}
          </span>
          <h2 className="text-2xl font-display font-black text-slate-800 tracking-tight mt-1.5 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-emerald-600" /> 
            {userRole === "admin" ? "Rekap & Statistik Terpadu Sekolah" : `Ustadz/ah Hub: Rekap & Nilai ${activeGuruProfile?.namaGuru || "Pengajar"}`}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Integrasi basis data kehadiran, buku nilai akademik, tugas siswa, kontak wali, dan riwayat audit WhatsApp dalam satu ekosistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transform transition-all cursor-pointer select-none uppercase tracking-wider"
          >
            <Printer className="w-4 h-4" /> Cetak / Unduh PDF
          </button>
          
          <button
            onClick={handleExportAllToExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transform transition-all cursor-pointer select-none uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-4 h-4" /> Unduh Laporan Excel
          </button>
        </div>
      </div>

      {/* Primary Analytical Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2.5xl border border-slate-200/95 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Target Siswa</p>
            <p className="text-xl font-mono font-black text-slate-800 leading-none mt-1">{statsOverview.count}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Siswa terdaftar dalam rombel pilihan</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2.5xl border border-slate-200/95 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Rata-Rata Nilai</p>
            <p className="text-xl font-mono font-black text-slate-800 leading-none mt-1">{statsOverview.academicAvg}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Nilai akademik & ujian terintegrasi</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2.5xl border border-slate-200/95 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Kehadiran Rata-Rata</p>
            <p className="text-xl font-mono font-black text-slate-800 leading-none mt-1">{statsOverview.attendanceAvg}%</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Persentase kehadiran tatap muka</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2.5xl border border-slate-200/95 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-705 rounded-2xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Indikator Perhatian</p>
            <p className="text-xl font-mono font-black text-rose-600 leading-none mt-1">{statsOverview.alertCount} Siswa</p>
            <p className="text-[9px] text-rose-500 font-semibold mt-0.5">Perlu dorongan / bimbingan</p>
          </div>
        </div>
      </div>

      {/* Control filters panel */}
      <div className="bg-[#FAF9F6] p-4.5 rounded-3xl border border-slate-200/70 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <div className="space-y-1 text-xs text-slate-500 font-semibold">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Saring Rombel</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold cursor-pointer text-xs focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">Semua Rombel DIAJAR ({dropDownKelasOptions.length})</option>
              {dropDownKelasOptions.map(k => (
                <option key={k.id} value={k.id}>{k.namaKelas}</option>
              ))}
            </select>
          </div>

          {/* Quick Warning / Attention Filter toggles */}
          <div className="space-y-1 text-xs text-slate-500 font-semibold">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Status Performa</label>
            <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={() => setAlertFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-colors ${
                  alertFilter === "ALL" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-505 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setAlertFilter("LOW_GRADE")}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-1 ${
                  alertFilter === "LOW_GRADE" ? "bg-red-50 text-rose-610 border border-rose-100 shadow-2xs" : "text-slate-505 hover:text-rose-650"
                }`}
              >
                Nilai &lt; 75
              </button>
              <button
                onClick={() => setAlertFilter("LOW_ATTEND")}
                className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide cursor-pointer transition-colors flex items-center gap-1 ${
                  alertFilter === "LOW_ATTEND" ? "bg-amber-50 text-amber-705 border border-amber-100 shadow-2xs" : "text-slate-505 hover:text-amber-705"
                }`}
              >
                Absen &lt; 80%
              </button>
            </div>
          </div>
        </div>

        {/* Global Student Search Query */}
        <div className="w-full md:w-72 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Cari Siswa</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau nomor NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-605"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Main Secondary Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-1.5 no-print">
        <button
          onClick={() => setActiveTab("AKADEMIK")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === "AKADEMIK" 
              ? "border-emerald-600 text-slate-850" 
              : "border-transparent text-slate-405 hover:text-slate-700"
          }`}
        >
          Buku Nilai & Akademik
        </button>
        <button
          onClick={() => setActiveTab("KEHADIRAN")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === "KEHADIRAN" 
              ? "border-emerald-600 text-slate-850" 
              : "border-transparent text-slate-405 hover:text-slate-700"
          }`}
        >
          Presensi & Absensi
        </button>
        <button
          onClick={() => setActiveTab("TUGAS")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === "TUGAS" 
              ? "border-emerald-600 text-slate-850" 
              : "border-transparent text-slate-405 hover:text-slate-700"
          }`}
        >
          Evaluasi Tugas (Capaian)
        </button>
        <button
          onClick={() => setActiveTab("KONTAK")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-colors ${
            activeTab === "KONTAK" 
              ? "border-emerald-600 text-slate-850" 
              : "border-transparent text-slate-405 hover:text-slate-700"
          }`}
        >
          Hubungan Wali Murid
        </button>
        {userRole === "admin" && (
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "LOGS" 
                ? "border-emerald-600 text-slate-850" 
                : "border-transparent text-slate-405 hover:text-slate-700"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-605" /> Audit Log WhatsApp
          </button>
        )}
      </div>

      {/* Render Sub Tabs Panels */}
      {finalFilteredMetrics.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2.5xl border border-slate-150 text-slate-400 text-xs italic space-y-2">
          <p>Tidak ada rekaman data hasil belajar / kriteria saring yang ditargetkan.</p>
          <p className="text-[10px]">Silakan sesuaikan filter rombel, performa, atau kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <>
          {/* TAB 1: BUKU NILAI & AKADEMIK */}
          {activeTab === "AKADEMIK" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold divide-x divide-slate-150">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 w-28">NIS</th>
                    <th className="px-4 py-3">Nama Lengkap Siswa</th>
                    <th className="px-4 py-3 w-24 text-center">Rombel</th>
                    <th className="px-4 py-3 w-36 text-center">Rata Akademik</th>
                    <th className="px-4 py-3 w-40 text-center">Klasifikasi KKM</th>
                    <th className="px-4 py-3 w-28 text-center">Aksi Detil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-750 font-sans">
                  {paginatedMetrics.map((m, idx) => {
                    const isPassed = m.academicAvg >= 75;
                    const rClass = kelas.find(k => k.id === m.student.kelasId);
                    const sequentialIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                    
                    return (
                      <tr key={m.student.id} className="hover:bg-slate-50/40 divide-x divide-slate-150 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono font-medium text-slate-400">{sequentialIdx}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold">{m.student.nis}</td>
                        <td className="px-4 py-2.5">
                          <div>
                            <span className="font-bold text-slate-800 block">{m.student.namaSiswa}</span>
                            {m.student.isAlumni && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-bold uppercase tracking-wide">Alumni</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-600">{rClass?.namaKelas || "-"}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold">
                          <span className={isPassed ? "text-slate-800" : "text-rose-600"}>
                            {m.academicAvg}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-semibold">
                          {isPassed ? (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black">TUNTAS</span>
                          ) : (
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black">BELUM TUNTAS</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => setSelectedStudent(m.student)}
                            className="px-2.5 py-1 hover:bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                          >
                            Rincian <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: KEHADIRAN / PRESENSI */}
          {activeTab === "KEHADIRAN" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold divide-x divide-slate-150">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Lengkap Siswa</th>
                    <th className="px-4 py-3 w-28 text-center bg-emerald-50/50 text-emerald-800 font-black">Hadir (H)</th>
                    <th className="px-4 py-3 w-24 text-center bg-amber-50/50 text-amber-800 font-black">Sakit (S)</th>
                    <th className="px-4 py-3 w-24 text-center bg-sky-50/50 text-sky-800 font-black">Izin (I)</th>
                    <th className="px-4 py-3 w-24 text-center bg-red-50/50 text-rose-800 font-black">Alpa (A)</th>
                    <th className="px-4 py-3 w-36 text-center">Tingkat Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-750">
                  {paginatedMetrics.map((m, idx) => {
                    const lowAttend = m.attendancePct < 80;
                    const sequentialIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={m.student.id} className="hover:bg-slate-50/40 divide-x divide-slate-150 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono font-medium text-slate-400">{sequentialIdx}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-800 block">{m.student.namaSiswa}</span>
                          <span className="text-[9px] text-slate-400 font-semibold font-mono">NIS: {m.student.nis}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-600 bg-emerald-50/20">{m.daysHadir}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-amber-500 bg-amber-50/20">{m.daysSakit}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-sky-500 bg-sky-50/20">{m.daysIzin}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-red-500 bg-red-50/20">{m.daysAlpa}</td>
                        <td className="px-4 py-2.5 text-center font-mono">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold text-xs ${lowAttend ? "text-rose-600" : "text-slate-850"}`}>
                              {m.attendancePct}%
                            </span>
                            {lowAttend && (
                              <span className="text-[8px] bg-rose-100 text-rose-700 px-1 rounded-sm font-black uppercase">PERINGATAN</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: EVALUASI TUGAS (CAPAIAN) */}
          {activeTab === "TUGAS" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold divide-x divide-slate-150">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Nama Lengkap Siswa</th>
                    <th className="px-4 py-3 w-40 text-center">Tugas Terdistribusi</th>
                    <th className="px-4 py-3 w-40 text-center">Tugas Diserahkan</th>
                    <th className="px-4 py-3 w-40 text-center">Persentase Capaian</th>
                    <th className="px-4 py-3 text-center">Progress Penyelesaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-750">
                  {paginatedMetrics.map((m, idx) => {
                    const ratio = m.tugasRatio;
                    let styleTrack = "bg-emerald-600";
                    if (ratio < 50) styleTrack = "bg-yellow-500";
                    if (ratio < 25) styleTrack = "bg-rose-500";
                    const sequentialIdx = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <tr key={m.student.id} className="hover:bg-slate-50/40 divide-x divide-slate-150 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono font-medium text-slate-400">{sequentialIdx}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{m.student.namaSiswa}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-semibold">{m.tugasCount}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-semibold">{m.submittedCount}</td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-705">{ratio}%</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden max-w-[200px] mx-auto">
                              <div className={`${styleTrack} h-full rounded-full`} style={{ width: `${ratio}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: HUBUNGAN WALI MURID */}
          {activeTab === "KONTAK" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold divide-x divide-slate-150">
                    <th className="px-4 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Ananda Siswa</th>
                    <th className="px-4 py-3 w-44">Nama Wali / Orang Tua</th>
                    <th className="px-4 py-3 w-40 font-mono">Nomor WhatsApp</th>
                    <th className="px-4 py-3 w-32 text-center font-mono">Sandypass Orangtua</th>
                    <th className="px-4 py-3 text-center w-36">Kontak Langsung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-750">
                  {paginatedMetrics.map((m, idx) => {
                    const student = m.student;
                    const cleanPhone = student.noHpWali?.replace(/[^0-9]/g, "") || "";
                    const hasPhone = cleanPhone.length > 0;
                    const sequentialIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                    
                    const handleQuickWAContact = () => {
                      if (!hasPhone) {
                        showNotification("Nomor telepon tidak valid!", "neutral");
                        return;
                      }
                      
                      const tStr = `Assalamualaikum Wr. Wb. Bapak/Ibu ${student.namaWali || "Wali Murid"} dari ananda ${student.namaSiswa}. Kami menginfokan laporan berkala rekap sekolah sedia diperiksa.`;
                      const url = `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(tStr)}`;
                      
                      // Audit trail logging
                      logWhatsAppSent(
                        activeGuruProfile?.namaGuru || "Admin Al Hanif",
                        activeGuruProfile?.code || "ADMIN-MASTER",
                        "INDIVIDUAL",
                        `${student.namaWali || "Wali"} (${student.namaSiswa})`,
                        tStr
                      );
                      
                      window.open(url, "_blank");
                    };

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/40 divide-x divide-slate-150 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono font-medium text-slate-400">{sequentialIdx}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{student.namaSiswa}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-600">{student.namaWali || "-"}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                          {hasPhone ? (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                              <Phone className="w-3.5 h-3.5" /> {student.noHpWali}
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold italic">Belum Terisi</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20">{student.kodeAkses || "PND-ALH"}</td>
                        <td className="px-4 py-2.5 text-center">
                          {hasPhone ? (
                            <button
                              onClick={handleQuickWAContact}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250/60 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" /> WhatsApp
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-semibold">Tidak Ada Saluran</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: WA SENT LOGS (Admin Only View) */}
          {activeTab === "LOGS" && userRole === "admin" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    placeholder="Saring log berdasarkan Pengirim, Penerima, ..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="w-full pl-8 py-1.5 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none font-sans"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={handleClearWaLogs}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10.5px] rounded-lg cursor-pointer transition-all border border-rose-200 uppercase tracking-wide shrink-0"
                >
                  Bersihkan Riwayat Log WHATSAPP
                </button>
              </div>

              {(() => {
                let filteredLogs = waLogs;
                if (logSearchQuery.trim()) {
                  const q = logSearchQuery.toLowerCase();
                  filteredLogs = filteredLogs.filter(l => 
                    l.senderName.toLowerCase().includes(q) || 
                    l.recipientName.toLowerCase().includes(q) || 
                    l.message.toLowerCase().includes(q)
                  );
                }

                if (filteredLogs.length === 0) {
                  return (
                    <div className="bg-white p-12 text-center rounded-2.5xl border border-slate-150 text-slate-400 text-xs italic">
                      Tidak ada rekaman pengiriman pesan WhatsApp pengajar dalam riwayat sistem audit saat ini.
                    </div>
                  );
                }

                return (
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold divide-x divide-slate-150">
                          <th className="px-4 py-3 w-12 text-center">Ref</th>
                          <th className="px-4 py-3 w-40">Wak-hari (WIB)</th>
                          <th className="px-4 py-3 w-48">Nama Pengirim (Guru)</th>
                          <th className="px-4 py-3 w-44">Tujuan / Sasaran</th>
                          <th className="px-4 py-3 w-32 text-center">Jenis Saluran</th>
                          <th className="px-4 py-3">Pesan Siaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-750">
                        {filteredLogs.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50/30 divide-x divide-slate-150 align-top transition-colors">
                            <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-400">{l.id.replace("LOG-", "")}</td>
                            <td className="px-4 py-2.5 font-mono text-[10.5px] text-slate-500 font-medium">
                              {new Date(l.timestamp).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-extrabold text-slate-800 block">{l.senderName}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-bold">Kode: {l.senderCode}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-bold text-slate-700 block">{l.recipientName}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block ${
                                l.recipientType === "INDIVIDUAL" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                l.recipientType === "GROUP" ? "bg-indigo-50 text-indigo-800 border border-indigo-100" :
                                l.recipientType === "BULK" ? "bg-amber-50 text-amber-805 border border-amber-100" :
                                "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}>
                                {l.recipientType}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <p className="whitespace-pre-wrap font-sans text-[10.5px] leading-relaxed max-w-sm text-slate-600 line-clamp-3 hover:line-clamp-none transition-all duration-300">
                                {l.message}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pagination Controls bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white p-4.5 rounded-2.5xl border border-slate-200 shadow-2xs no-print font-sans">
              <span className="text-xs text-slate-500 font-semibold">
                Menampilkan <strong className="text-slate-800 font-mono font-black">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-slate-800 font-mono font-black">{Math.min(currentPage * itemsPerPage, finalFilteredMetrics.length)}</strong> dari <strong className="text-slate-800 font-mono font-black">{finalFilteredMetrics.length}</strong> siswa rombel
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1 transition-all select-none cursor-pointer disabled:cursor-not-allowed"
                >
                  &larr; Prev
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  if (totalPages > 6 && pNum !== 1 && pNum !== totalPages && Math.abs(pNum - currentPage) > 1) {
                    if (pNum === 2 || pNum === totalPages - 1) {
                      return <span key={pNum} className="px-1 text-slate-400 text-[10px] font-bold">..</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-7.5 h-7.5 rounded-lg text-xs font-mono font-black transition-all cursor-pointer ${
                        currentPage === pNum 
                          ? "bg-emerald-600 text-white shadow-xs" 
                          : "bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1 transition-all select-none cursor-pointer disabled:cursor-not-allowed"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT DETAILED SCORECARD MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-left" onClick={() => setSelectedStudent(null)}>
          <div 
            className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col p-6 space-y-5 animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                    {selectedStudent.namaSiswa}
                    {selectedStudent.isAlumni && (
                      <span className="text-[9px] bg-red-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Alumni</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">NIS: {selectedStudent.nis} • Kelas: {kelas.find(k => k.id === selectedStudent.kelasId)?.namaKelas || "Kelas"}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)} 
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 hover:text-rose-600 rounded-xl cursor-pointer text-slate-500 text-xs font-bold font-sans transition-all"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Modal Content Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 bg-slate-50 p-4 rounded-2.5xl border border-slate-150">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Presensi Hadir</p>
                <p className="text-lg font-mono font-black text-slate-800 mt-1">
                  {(() => {
                    const myAbs = absenSiswa.filter(a => a.siswaId === selectedStudent.id);
                    const H = myAbs.filter(a => a.status === "Hadir").length;
                    const pct = myAbs.length > 0 ? Math.round((H / myAbs.length) * 100) : 100;
                    return `${pct}% (${H}/${myAbs.length})`;
                  })()}
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Rataan Akademik</p>
                <p className="text-lg font-mono font-black text-emerald-600 mt-1">
                  {(() => {
                    const studentPenilaian = penilaian.filter(p => kategori.some(k => k.id === p.kategoriId));
                    let sum = 0, count = 0;
                    studentPenilaian.forEach(p => {
                      const match = p.grades.find(g => g.siswaId === selectedStudent.id);
                      if (match !== undefined) {
                        sum += match.nilai;
                        count++;
                      }
                    });
                    return count > 0 ? `${Math.round((sum / count) * 10) / 10}` : "80.0";
                  })()}
                </p>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-3xs text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pekerjaan Tugas (PR)</p>
                <p className="text-lg font-mono font-black text-indigo-600 mt-1">
                  {(() => {
                    const classTasks = tugas.filter(t => t.kelasId === selectedStudent.kelasId || t.kelasId === "semua");
                    const userSubmissions = pengumpulanTugas.filter(p => p.siswaId === selectedStudent.id);
                    const taskPct = classTasks.length > 0 ? Math.round((userSubmissions.length / classTasks.length) * 100) : 100;
                    return `${taskPct}% (${userSubmissions.length}/${classTasks.length})`;
                  })()}
                </p>
              </div>
            </div>

            {/* Detailed Academic Scores breakdown per Subject */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-emerald-600" /> Transkrip Lembar Akademik Interaktif
              </h4>
              
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-56 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold font-sans">
                    <tr>
                      <th className="p-2.5">Mata Pelajaran</th>
                      <th className="p-2.5 text-center w-28">Kategori</th>
                      <th className="p-2.5 text-center w-24">Tanggal Rekam</th>
                      <th className="p-2.5 text-center w-20">Nilai</th>
                      <th className="p-2.5 text-center w-24">KKM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {(() => {
                      const renderedRows: React.ReactNode[] = [];
                      penilaian.forEach((p) => {
                        const scoreObj = p.grades.find(g => g.siswaId === selectedStudent.id);
                        if (scoreObj !== undefined) {
                          const catObj = kategori.find(k => k.id === p.kategoriId);
                          const subjectObj = mapel.find(m => m.id === catObj?.mapelId);
                          
                          if (catObj && subjectObj) {
                            renderedRows.push(
                              <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-bold text-slate-800">{subjectObj.namaMapel}</td>
                                <td className="p-2.5 text-center text-slate-600 font-medium">{catObj.namaKategori}</td>
                                <td className="p-2.5 text-center font-mono text-slate-500">{p.tanggal}</td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-800">{scoreObj.nilai}</td>
                                <td className="p-2.5 text-center font-mono text-slate-400">{subjectObj.kkm || 75}</td>
                              </tr>
                            );
                          }
                        }
                      });

                      if (renderedRows.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 italic font-medium">Belum ada entri absensi buku nilai tersimpan untuk ananda.</td>
                          </tr>
                        );
                      }
                      return renderedRows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* WA Communication Quick Action Box inside details modal */}
            <div className="bg-emerald-50/50 p-4 rounded-2.5xl border border-emerald-150 space-y-3.5">
              <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-2">
                <MessageSquare className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">Kirim Catatan Perkembangan ke WhatsApp Ortu</span>
              </div>

              {selectedStudent.noHpWali?.trim() ? (
                <div className="space-y-3">
                  <p className="text-[10.5px] text-emerald-800 font-semibold leading-relaxed">
                    Ketik pesan perkembangan belajar ananda secara custom di bawah. Sistem akan secara otomatis menyalin tulisan ke dalam Clipboard sebelum membuka navigasi tautan WhatsApp Ortu secara aman.
                  </p>
                  
                  {(() => {
                    // Compute dynamic text context values
                    const filterA = absenSiswa.filter(a => a.siswaId === selectedStudent.id);
                    const attH = filterA.filter(a => a.status === "Hadir").length;
                    const attPct = filterA.length > 0 ? Math.round((attH / filterA.length) * 100) : 100;
                    
                    const scoreProgs = penilaian.filter(p => kategori.some(k => k.id === p.kategoriId));
                    let sumSc = 0, countSc = 0;
                    scoreProgs.forEach(p => {
                      const m = p.grades.find(g => g.siswaId === selectedStudent.id);
                      if (m !== undefined) {
                        sumSc += m.nilai;
                        countSc++;
                      }
                    });
                    const resAvg = countSc > 0 ? `${Math.round((sumSc / countSc) * 10) / 10}` : "80.0";

                    return (
                      <div className="space-y-3">
                        <textarea
                          id="modal-wa-message-body"
                          rows={4}
                          defaultValue={`Assalamualaikum Wr. Wb. Ayah/Bunda dari Ananda *${selectedStudent.namaSiswa}*.\n\nBerikut kami lampirkan perkembangan belajar ananda hasil rekapitulasi Sekolah SDIT Al Hanif:\n- Rata-Rata Nilai Akademik: *${resAvg}*\n- Presentasi Absensi Kehadiran: *${attPct}%* (${attH}/${filterA.length})\n\nMari kita terus awasi, motivasi serta doakan agar ananda dipermudah jalannya dalam menuntut ilmu syar'i. Syukron Katsiran.`}
                          className="w-full text-xs p-3 border border-emerald-250 bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const txt = (document.getElementById("modal-wa-message-body") as HTMLTextAreaElement).value;
                            const hppRaw = selectedStudent.noHpWali || "";
                            let clnHp = hppRaw.replace(/[^0-9]/g, "");
                            if (clnHp.startsWith("0")) {
                              clnHp = "62" + clnHp.substring(1);
                            }
                            
                            // Log inside local audit db
                            logWhatsAppSent(
                              activeGuruProfile?.namaGuru || "Admin Master",
                              activeGuruProfile?.code || "ADMIN-MASTER",
                              "INDIVIDUAL",
                              `${selectedStudent.namaWali || "Wali"} (${selectedStudent.namaSiswa})`,
                              txt
                            );
                            
                            navigator.clipboard.writeText(txt);
                            showNotification("Pesan disalin! Mengalihkan ke WhatsApp...", "success");
                            
                            setTimeout(() => {
                              window.open(`https://api.whatsapp.com/send?phone=${clnHp}&text=${encodeURIComponent(txt)}`, "_blank");
                            }, 1000);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase cursor-pointer select-none flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Share2 className="w-4 h-4" /> Hubungi Orangtua Wali (WhatsApp)
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p className="p-3 bg-red-50 text-red-700 border border-red-150 rounded-xl text-xs font-semibold italic text-center">
                  ⚠️ Nomer HP Orang tua belum dimasukan ke database, silakan perbaharui profil siswa terlebih dahulu sebelum menghubungi.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
