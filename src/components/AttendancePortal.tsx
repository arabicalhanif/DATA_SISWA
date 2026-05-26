import React, { useState, useMemo } from "react";
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Save, 
  Search, 
  UserCheck, 
  UserX,
  FileSpreadsheet,
  Trash2,
  ListFilter,
  CheckCircle2,
  Printer
} from "lucide-react";
import { 
  Kelas, 
  Siswa, 
  GuruCode, 
  AbsenSiswa, 
  AbsenGuru, 
  AttendanceStatusSiswa, 
  AttendanceStatusGuru,
  Jadwal
} from "../types";
import * as XLSX from "xlsx";

interface AttendancePortalProps {
  kelas: Kelas[];
  siswa: Siswa[];
  guruCodes: GuruCode[];
  currentGuruCode: string | null;
  activeTeacherName?: string;
  absenSiswa: AbsenSiswa[];
  setAbsenSiswa: React.Dispatch<React.SetStateAction<AbsenSiswa[]>>;
  absenGuru: AbsenGuru[];
  setAbsenGuru: React.Dispatch<React.SetStateAction<AbsenGuru[]>>;
  showNotification: (text: string, type?: "success" | "neutral") => void;
  userRole: "admin" | "guru" | "wali";
  jadwal?: Jadwal[];
}

import { getAllCombinedJamOptions } from "../utils/scheduleConfig";

const JAM_PELAJARAN_OPTIONS = getAllCombinedJamOptions();

const BULAN_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

export default function AttendancePortal({
  kelas,
  siswa,
  guruCodes,
  currentGuruCode,
  activeTeacherName,
  absenSiswa,
  setAbsenSiswa,
  absenGuru,
  setAbsenGuru,
  showNotification,
  userRole,
  jadwal = []
}: AttendancePortalProps) {
  // Synchronously update JAM_PELAJARAN_OPTIONS values to get up-to-date schedule entries from Admin
  const currentOptions = getAllCombinedJamOptions();
  JAM_PELAJARAN_OPTIONS.length = 0;
  JAM_PELAJARAN_OPTIONS.push(...currentOptions);

  // Navigation active sub tab inside attendance
  const [subTab, setSubTab] = useState<"siswa" | "guru">("siswa");

  // --- REKAP ABSENSI STATE ---
  const [rekapKelasId, setRekapKelasId] = useState<string>(kelas[0]?.id || "");
  const [rekapMonth, setRekapMonth] = useState<string>("05"); // Default May (UAS period/current timezone month)
  const [rekapYear, setRekapYear] = useState<string>("2026");

  // --- PAST ATTENDANCE KOREKSI STATE ---
  const [pastDate, setPastDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [pastKelasId, setPastKelasId] = useState<string>(kelas[0]?.id || "");
  const [pastJam, setPastJam] = useState<string>(JAM_PELAJARAN_OPTIONS[0]);
  const [pastDraft, setPastDraft] = useState<{ [siswaId: string]: AttendanceStatusSiswa }>({});

  // --- ABSEN SISWA STATE ---
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelas[0]?.id || "");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedJam, setSelectedJam] = useState<string>(JAM_PELAJARAN_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftAttendance, setDraftAttendance] = useState<{ [siswaId: string]: AttendanceStatusSiswa }>({});
  const [draftCatatan, setDraftCatatan] = useState<{ [siswaId: string]: string }>({});

  // --- ABSEN GURU STATE ---
  const [guruAttendanceDate, setGuruAttendanceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedGuruJam, setSelectedGuruJam] = useState<string>("Masuk");
  const [selectedGuruCode, setSelectedGuruCode] = useState<string>(currentGuruCode || guruCodes[0]?.code || "");
  const [selectedGuruStatus, setSelectedGuruStatus] = useState<AttendanceStatusGuru>("Hadir");
  const [guruCatatan, setGuruCatatan] = useState("");

  const dayOfAttendanceDate = useMemo(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dateObj = new Date(attendanceDate);
    return days[isNaN(dateObj.getTime()) ? new Date().getDay() : dateObj.getDay()];
  }, [attendanceDate]);

  const finalKelasOptionsCurrent = useMemo(() => {
    return kelas;
  }, [kelas]);

  const finalKelasOptionsPast = useMemo(() => {
    return kelas;
  }, [kelas]);

  // Robust Synchronized State Reconciliation Hook
  React.useEffect(() => {
    if (kelas.length > 0) {
      if (!selectedKelasId || !kelas.some(k => k.id === selectedKelasId)) {
        setSelectedKelasId(kelas[0]?.id || "");
      }
      if (!pastKelasId || !kelas.some(k => k.id === pastKelasId)) {
        setPastKelasId(kelas[0]?.id || "");
      }
      if (!rekapKelasId || !kelas.some(k => k.id === rekapKelasId)) {
        setRekapKelasId(kelas[0]?.id || "");
      }
    }
  }, [kelas]);

  const hasPreselectedRef = React.useRef(false);
  const lastGuruCode = React.useRef<string | null>(null);
  const lastRole = React.useRef<string | null>(null);

  // Auto-preselect student class & time slot based on teacher schedule of today!
  React.useEffect(() => {
    if (currentGuruCode !== lastGuruCode.current || userRole !== lastRole.current) {
      hasPreselectedRef.current = false;
      lastGuruCode.current = currentGuruCode;
      lastRole.current = userRole;
    }

    if (hasPreselectedRef.current) return;

    if (userRole === "guru" && currentGuruCode) {
      setSelectedGuruCode(currentGuruCode);
      
      if (jadwal && jadwal.length > 0 && kelas.length > 0) {
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const todayIndo = days[new Date().getDay()];
        
        const myTodaySchedules = jadwal.filter(j => j.teacherCode === currentGuruCode && j.hari === todayIndo);
        if (myTodaySchedules.length > 0) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const curTime = `${hh}:${mm}`;
          
          // Find if any is currently active or nearest
          const activeSession = myTodaySchedules.find(j => curTime >= j.jamMulai && curTime <= j.jamSelesai) || myTodaySchedules[0];
          if (activeSession) {
            setSelectedKelasId(activeSession.kelasId);
            hasPreselectedRef.current = true;
            
            const startHour = parseInt(activeSession.jamMulai.split(":")[0]);
            if (startHour <= 8) {
              setSelectedJam(JAM_PELAJARAN_OPTIONS[0]);
            } else if (startHour <= 9) {
              setSelectedJam(JAM_PELAJARAN_OPTIONS[1]);
            } else if (startHour <= 10) {
              setSelectedJam(JAM_PELAJARAN_OPTIONS[2]);
            } else {
              setSelectedJam(JAM_PELAJARAN_OPTIONS[3]);
            }
          }
        }
      }
    }
  }, [userRole, currentGuruCode, jadwal, kelas]);


  const pastStudents = useMemo(() => {
    return siswa.filter(s => s.kelasId === pastKelasId);
  }, [siswa, pastKelasId]);

  const loadedPastAttendance = useMemo(() => {
    return absenSiswa.filter(a => 
      a.tanggal === pastDate && 
      a.kelasId === pastKelasId && 
      (a.jamPelajaran === pastJam || (!a.jamPelajaran && pastJam === JAM_PELAJARAN_OPTIONS[0]))
    );
  }, [absenSiswa, pastDate, pastKelasId, pastJam]);

  const isPastTeacherAbsentForSelected = useMemo(() => {
    const pastDateObj = new Date(pastDate);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const pastDay = days[isNaN(pastDateObj.getTime()) ? new Date().getDay() : pastDateObj.getDay()];
    const pastSlotSchedules = jadwal.filter(j => j.kelasId === pastKelasId && j.hari === pastDay);
    const pastClassTeachers = pastSlotSchedules.map(j => j.teacherCode);
    return pastClassTeachers.some(code => {
      const presence = absenGuru.find(ag => ag.tanggal === pastDate && ag.teacherCode === code);
      return presence && presence.status !== "Hadir";
    });
  }, [jadwal, pastKelasId, pastDate, absenGuru]);

  React.useEffect(() => {
    const draft: { [siswaId: string]: AttendanceStatusSiswa } = {};
    pastStudents.forEach(s => {
      if (isPastTeacherAbsentForSelected) {
        draft[s.id] = "Hadir";
      } else {
        const match = loadedPastAttendance.find(a => a.siswaId === s.id);
        draft[s.id] = match ? match.status : "Hadir";
      }
    });
    setPastDraft(draft);
  }, [pastStudents, loadedPastAttendance, pastDate, pastKelasId, pastJam, isPastTeacherAbsentForSelected]);

  const handleSavePastKoreksi = () => {
    if (!pastKelasId) {
      showNotification("Pilih rombel untuk koreksi.", "neutral");
      return;
    }
    setAbsenSiswa(prev => {
      const filtered = prev.filter(r => !(
        r.tanggal === pastDate && 
        r.kelasId === pastKelasId && 
        (r.jamPelajaran === pastJam || (!r.jamPelajaran && pastJam === JAM_PELAJARAN_OPTIONS[0]))
      ));
      
      const newRecords: AbsenSiswa[] = pastStudents.map(s => ({
        id: `ABS-${pastDate}-${pastKelasId}-${pastJam.replace(/[^a-zA-Z0-9]/g, "")}-${s.id}`,
        tanggal: pastDate,
        kelasId: pastKelasId,
        siswaId: s.id,
        status: isPastTeacherAbsentForSelected ? "Hadir" : (pastDraft[s.id] || "Hadir"),
        jamPelajaran: pastJam,
        catatan: isPastTeacherAbsentForSelected ? "Otomatis Hadir (Guru Berhalangan)" : undefined
      }));
      
      return [...filtered, ...newRecords];
    });
    
    const clsName = kelas.find(k => k.id === pastKelasId)?.namaKelas || "";
    showNotification(`Koreksi absensi terlewat kelas ${clsName} tanggal ${pastDate} berhasil diunggah!`, "success");
  };


  // Get students in selected class
  const classStudents = useMemo(() => {
    return siswa.filter(s => s.kelasId === selectedKelasId);
  }, [siswa, selectedKelasId]);

  // Load existing student attendance for this class, date & lesson hour (or fallback to any hour of the day)
  const loadedAttendance = useMemo(() => {
    const specificRecords = absenSiswa.filter(a => 
      a.tanggal === attendanceDate && 
      a.kelasId === selectedKelasId && 
      (a.jamPelajaran === selectedJam || (!a.jamPelajaran && selectedJam === JAM_PELAJARAN_OPTIONS[0]))
    );
    const map: { [siswaId: string]: AbsenSiswa & { isFallback?: boolean } } = {};
    specificRecords.forEach(r => {
      map[r.siswaId] = { ...r, isFallback: false };
    });

    // Fallback to ANY same-day attendance record for students who do not have a specific match for this jam yet
    classStudents.forEach(s => {
      if (!map[s.id]) {
        const fallback = absenSiswa.find(a => 
          a.siswaId === s.id && 
          a.tanggal === attendanceDate
        );
        if (fallback) {
          map[s.id] = { ...fallback, isFallback: true };
        }
      }
    });

    return map;
  }, [absenSiswa, attendanceDate, selectedKelasId, selectedJam, classStudents]);

  const isTeacherAbsentForSelected = useMemo(() => {
    const slotSchedules = jadwal.filter(j => j.kelasId === selectedKelasId && j.hari === dayOfAttendanceDate);
    const classTeachers = slotSchedules.map(j => j.teacherCode);
    return classTeachers.some(code => {
      const presence = absenGuru.find(ag => ag.tanggal === attendanceDate && ag.teacherCode === code);
      return presence && presence.status !== "Hadir";
    });
  }, [jadwal, selectedKelasId, dayOfAttendanceDate, absenGuru, attendanceDate]);

  // Initialize draft when class/date/existing/hour changes
  React.useEffect(() => {
    const newDraft: { [siswaId: string]: AttendanceStatusSiswa } = {};
    const newCatatan: { [siswaId: string]: string } = {};
    classStudents.forEach(s => {
      if (isTeacherAbsentForSelected) {
        newDraft[s.id] = "Hadir";
        newCatatan[s.id] = loadedAttendance[s.id]?.catatan || "Otomatis Hadir (Guru Berhalangan)";
      } else if (loadedAttendance[s.id]) {
        newDraft[s.id] = loadedAttendance[s.id].status;
        newCatatan[s.id] = loadedAttendance[s.id].catatan || "";
      } else {
        newDraft[s.id] = "Hadir"; // Default status is Hadir
        newCatatan[s.id] = "";
      }
    });
    setDraftAttendance(newDraft);
    setDraftCatatan(newCatatan);
  }, [classStudents, loadedAttendance, isTeacherAbsentForSelected]);

  // Save student attendance draft
  const handleSaveStudentAttendance = () => {
    if (!selectedKelasId) {
      showNotification("Pilih rombel terlebih dahulu.", "neutral");
      return;
    }
    
    setAbsenSiswa(prev => {
      // Filter out existing records for this class, date and lesson hour (jamPelajaran)
      const filtered = prev.filter(r => !(
        r.tanggal === attendanceDate && 
        r.kelasId === selectedKelasId && 
        (r.jamPelajaran === selectedJam || (!r.jamPelajaran && selectedJam === JAM_PELAJARAN_OPTIONS[0]))
      ));
      
      const newSpecificRecords: AbsenSiswa[] = classStudents.map(s => ({
        id: `ABS-${attendanceDate}-${selectedKelasId}-${selectedJam.replace(/[^a-zA-Z0-9]/g, "")}-${s.id}`,
        tanggal: attendanceDate,
        kelasId: selectedKelasId,
        siswaId: s.id,
        status: isTeacherAbsentForSelected ? "Hadir" : (draftAttendance[s.id] || "Hadir"),
        catatan: isTeacherAbsentForSelected ? "Otomatis Hadir (Guru Berhalangan)" : (draftCatatan[s.id]?.trim() || undefined),
        jamPelajaran: selectedJam
      }));

      // In addition to saving the selected jam, automatically propagate to remaining hours today so that
      // other teachers don't need to re-type. Only propagate to other hours that DO NOT already have manual records!
      const otherJams = JAM_PELAJARAN_OPTIONS.filter(opt => opt !== selectedJam);
      const propagatedRecords: AbsenSiswa[] = [];

      classStudents.forEach(s => {
        const studentStatus = isTeacherAbsentForSelected ? "Hadir" : (draftAttendance[s.id] || "Hadir");
        const studentCatatan = isTeacherAbsentForSelected ? "Otomatis Hadir (Guru Berhalangan)" : (draftCatatan[s.id]?.trim() || undefined);

        otherJams.forEach(jamOpt => {
          // Check if there is already a manual record in prev (original state) for this student/date/jamOpt
          const alreadyExists = prev.some(r => 
            r.siswaId === s.id && 
            r.tanggal === attendanceDate && 
            r.kelasId === selectedKelasId && 
            (r.jamPelajaran === jamOpt || (!r.jamPelajaran && jamOpt === JAM_PELAJARAN_OPTIONS[0]))
          );

          if (!alreadyExists) {
            propagatedRecords.push({
              id: `ABS-${attendanceDate}-${selectedKelasId}-${jamOpt.replace(/[^a-zA-Z0-9]/g, "")}-${s.id}`,
              tanggal: attendanceDate,
              kelasId: selectedKelasId,
              siswaId: s.id,
              status: studentStatus,
              catatan: studentCatatan,
              jamPelajaran: jamOpt
            });
          }
        });
      });
      
      return [...filtered, ...newSpecificRecords, ...propagatedRecords];
    });

    const clsName = kelas.find(k => k.id === selectedKelasId)?.namaKelas || "";
    showNotification(`Absensi kelas ${clsName} pada ${attendanceDate} (${selectedJam}) disimpan dan disinkronkan ke semua jam belajar hari ini!`, "success");
  };

  // Bulk mark all as present
  const handleMarkAllPresent = () => {
    const updatedDraft = { ...draftAttendance };
    classStudents.forEach(s => {
      updatedDraft[s.id] = "Hadir";
    });
    setDraftAttendance(updatedDraft);
    showNotification("Semua siswa pada sesi ini berhasil ditandai HADIR.", "success");
  };

  // Export class attendance report to Excel
  const handleExportAttendanceExcel = () => {
    if (classStudents.length === 0) {
      showNotification("Tidak ada siswa untuk diekspor.", "neutral");
      return;
    }

    const currentClass = kelas.find(k => k.id === selectedKelasId);
    const reportData = classStudents.map((s, idx) => {
      const actualRecord = loadedAttendance[s.id];
      const statusStr = actualRecord ? actualRecord.status : (draftAttendance[s.id] || "Belum Absen");
      const noteStr = actualRecord ? (actualRecord.catatan || "-") : (draftCatatan[s.id] || "-");
      return {
        "No": idx + 1,
        "NIS": s.nis,
        "Nama Siswa": s.namaSiswa,
        "Kelas": currentClass?.namaKelas || "-",
        "Tanggal": attendanceDate,
        "Jam Pelajaran": actualRecord?.jamPelajaran || selectedJam,
        "Status Kehadiran": statusStr,
        "Keterangan/Catatan": noteStr
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AbsensiSiswa");
    XLSX.writeFile(wb, `Absensi_Siswa_${currentClass?.namaKelas || "Kelas"}_${attendanceDate}.xlsx`);
    showNotification("Laporan kehadiran berhasil diunduh ke Excel!", "success");
  };

  // Teacher manual check-in attendance action
  const handleSaveGuruAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuruCode) {
      showNotification("Pilih guru pengampu terlebih dahulu.", "neutral");
      return;
    }

    setAbsenGuru(prev => {
      // Filter out existing record if exists on date (Only once per day)
      const filtered = prev.filter(g => !(
        g.tanggal === guruAttendanceDate && 
        g.teacherCode === selectedGuruCode
      ));
      const record: AbsenGuru = {
        id: `ABG-${guruAttendanceDate}-${selectedGuruCode}`,
        tanggal: guruAttendanceDate,
        teacherCode: selectedGuruCode,
        status: selectedGuruStatus,
        catatan: guruCatatan.trim() || undefined,
        jamPelajaran: "Masuk"
      };
      return [...filtered, record];
    });

    const tName = guruCodes.find(g => g.code === selectedGuruCode)?.namaGuru || selectedGuruCode;
    showNotification(`Pencatatan absen masuk harian guru ${tName} berhasil dilakukan!`, "success");
    setGuruCatatan("");
  };

  const handleDeleteGuruAttendance = (id: string) => {
    setAbsenGuru(prev => prev.filter(r => r.id !== id));
    showNotification("Catatan absen guru berhasil dihapus.", "neutral");
  };

  // Calculate monthly stats for the recap tab
  const monthlyRecapData = useMemo(() => {
    const targetStudents = siswa.filter(s => s.kelasId === rekapKelasId);
    
    return targetStudents.map((stud) => {
      // Get all attendance entries for this student belonging to the selected Month and Year
      const entries = absenSiswa.filter(ab => {
        if (ab.siswaId !== stud.id) return false;
        // Check if YYYY-MM match
        const parts = ab.tanggal.split("-"); // [YYYY, MM, DD]
        return parts[0] === rekapYear && parts[1] === rekapMonth;
      });

      const totalSession = entries.length;
      const H = entries.filter(e => e.status === "Hadir").length;
      const S = entries.filter(e => e.status === "Sakit").length;
      const I = entries.filter(e => e.status === "Izin").length;
      const A = entries.filter(e => e.status === "Alpa").length;

      const pct = totalSession > 0 ? Math.round((H / totalSession) * 100) : 100;

      return {
        id: stud.id,
        nis: stud.nis,
        nama: stud.namaSiswa,
        H,
        S,
        I,
        A,
        totalSession,
        pct
      };
    });
  }, [siswa, absenSiswa, rekapKelasId, rekapMonth, rekapYear]);

  // Export Monthly Recap to Excel
  const handleExportMonthlyRecapExcel = () => {
    if (monthlyRecapData.length === 0) {
      showNotification("Tidak ada data rekap untuk diekspor.", "neutral");
      return;
    }

    const currentClass = kelas.find(k => k.id === rekapKelasId);
    const mName = BULAN_OPTIONS.find(b => b.value === rekapMonth)?.label || rekapMonth;
    
    const data = monthlyRecapData.map((row, idx) => ({
      "No": idx + 1,
      "NIS": row.nis,
      "Nama Siswa": row.nama,
      "Hadir (H)": row.H,
      "Sakit (S)": row.S,
      "Izin (I)": row.I,
      "Alpa (A)": row.A,
      "Total Sesi Terekam": row.totalSession,
      "Rasio Kehadiran (%)": `${row.pct}%`
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RekapAbsensi");
    XLSX.writeFile(wb, `Rekap_Absensi_Siswa_${currentClass?.namaKelas || "Kelas"}_${mName}_${rekapYear}.xlsx`);
    showNotification(`Excel rekap bulanan berhasil diunduh.`, "success");
  };

  // Student Attendance Rate statistics (day-specific)
  const attendanceStats = useMemo(() => {
    const records = classStudents.map(s => loadedAttendance[s.id]?.status || "Hadir");
    const total = records.length;
    if (total === 0) return { present: 0, sick: 0, permitted: 0, alpha: 0, presentPct: 0 };

    const present = records.filter(r => r === "Hadir").length;
    const sick = records.filter(r => r === "Sakit").length;
    const permitted = records.filter(r => r === "Izin").length;
    const alpha = records.filter(r => r === "Alpa").length;
    const presentPct = Math.round((present / total) * 100);

    return { present, sick, permitted, alpha, presentPct };
  }, [classStudents, loadedAttendance]);

  // Filter student lists
  const filteredStudents = classStudents.filter(s => 
    s.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nis.includes(searchQuery)
  );

  // New Alert Warnings for unfinished or missing attendance logs
  const teacherHasNotSubmittedToday = useMemo(() => {
    if (userRole !== "guru" || !currentGuruCode) return false;
    // Check if there is an entry in absenGuru for currentGuruCode on the selected attendanceDate
    return !absenGuru.some(g => g.teacherCode === currentGuruCode && g.tanggal === attendanceDate);
  }, [absenGuru, currentGuruCode, userRole, attendanceDate]);

  const studentsWithNoSavedAttendance = useMemo(() => {
    if (classStudents.length === 0) return [];
    return classStudents.filter(s => {
      // Return students who do NOT have a specific record for THIS day and THIS specific lesson jam in the DB
      return !absenSiswa.some(a => 
        a.siswaId === s.id && 
        a.tanggal === attendanceDate && 
        a.kelasId === selectedKelasId && 
        (a.jamPelajaran === selectedJam || (!a.jamPelajaran && selectedJam === JAM_PELAJARAN_OPTIONS[0]))
      );
    });
  }, [classStudents, absenSiswa, attendanceDate, selectedKelasId, selectedJam]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visual Badge Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-slate-800 tracking-tight">Portal Absensi & Kehadiran</h2>
            <p className="text-xs text-slate-500 font-medium">Manajemen kehadiran harian terpadu siswa, pendidik & rekapitulasi bulanan</p>
          </div>
        </div>

        {/* Triple Switch Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center self-start md:self-center border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setSubTab("siswa")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              subTab === "siswa"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Absen Siswa
          </button>
          <button
            onClick={() => setSubTab("guru")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              subTab === "guru"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-850"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Absen Guru
          </button>
        </div>
      </div>

      {/* Dynamic Alerts and Safety Warnings for Incomplete Attendance */}
      <div className="space-y-3">
        {teacherHasNotSubmittedToday && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3 shadow-3xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs font-medium">
              <span className="font-extrabold text-amber-950 block uppercase text-[10px] tracking-wide">⚠️ PERINGATAN REKOR KEHADIRAN GURU</span>
              Ustadz/ah, Anda belum mengisi lembar check-in harian <strong>Absen Guru</strong> untuk tanggal <strong>{attendanceDate}</strong>. 
              Harap segera ke tab <button onClick={() => setSubTab("guru")} className="underline font-bold hover:text-amber-700 cursor-pointer text-emerald-800">Absen Guru</button> untuk melengkapi kehadiran Anda agar terdaftar sebagai pengajar aktif hari ini!
            </div>
          </div>
        )}

        {subTab === "siswa" && classStudents.length > 0 && studentsWithNoSavedAttendance.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl text-rose-900 flex items-start gap-3 shadow-3xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs font-medium">
              <span className="font-extrabold text-rose-950 block uppercase text-[10px] tracking-wide">⚠️ DAFTAR ABSENSI SISWA BELUM REKAM</span>
              Ditemukan sebanyak <strong>{studentsWithNoSavedAttendance.length} siswa</strong> di kelas <strong>{kelas.find(k => k.id === selectedKelasId)?.namaKelas || "ini"}</strong> yang data absensinya belum terekam/disimpan untuk tanggal <strong>{attendanceDate} {selectedJam}</strong>.
              Tekan tombol <strong className="text-rose-950">"Simpan Absensi & Sinkronkan"</strong> di bawah untuk mencegah status alpa/kosong yang tidak disengaja.
            </div>
          </div>
        )}

        {subTab === "siswa" && classStudents.length > 0 && studentsWithNoSavedAttendance.length === 0 && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-150 rounded-2xl text-emerald-900 flex items-center gap-3 shadow-3xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold text-emerald-950">
              ✓ Semua ({classStudents.length}) data kehadiran siswa kelas {kelas.find(k => k.id === selectedKelasId)?.namaKelas || "ini"} untuk {attendanceDate} {selectedJam} telah terekam aman di pangkalan data sekolah!
            </p>
          </div>
        )}
      </div>

      {subTab === "siswa" ? (
        <>
        {/* ======================== ABSEN SISWA BOARD ======================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Attendance List Form Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              
              {/* Header Filters */}
              <div className="p-5 border-b border-slate-150 bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Pilih Rombel / Kelas</label>
                    <select
                      value={selectedKelasId}
                      onChange={(e) => setSelectedKelasId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                    >
                      {finalKelasOptionsCurrent.map(k => (
                        <option key={k.id} value={k.id}>{k.namaKelas}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tanggal Absen</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Jam Pelajaran</label>
                    <select
                      value={selectedJam}
                      onChange={(e) => setSelectedJam(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                    >
                      {JAM_PELAJARAN_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  {/* Search bar inside */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari NIS atau nama siswa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-700 font-medium"
                    />
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      disabled={classStudents.length === 0 || isTeacherAbsentForSelected}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-700 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-150 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hadir Semua
                    </button>
                    <button
                      type="button"
                      onClick={handleExportAttendanceExcel}
                      disabled={classStudents.length === 0}
                      className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-slate-200 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Unduh Laporan
                    </button>
                  </div>
                </div>

                {isTeacherAbsentForSelected && (
                  <div className="p-4 bg-rose-50 border border-rose-205 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 font-medium shadow-3xs animate-fadeIn mt-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <p className="font-extrabold text-rose-900 uppercase text-[9px] tracking-wide">⚠️ USTADZ/AH PENGAJAR BERHALANGAN HADIR HARI INI</p>
                      <p className="text-[10px] text-rose-700 font-semibold leading-relaxed mt-0.5">
                        Berhubung pendidik pengampu kelas ini tercatat berhalangan hadir pada hari ini (Sakit/Izin/Cuti/Alpa), sesuai kebijakan sekolah, seluruh siswa otomatis berstatus <strong>Hadir</strong> (Presensi Daring Mandiri).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Checklist Rows */}
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Tidak ada siswa terdaftar di sasar kelas ini.</p>
                  <p className="text-[10px] text-slate-400">Silakan dafter atau hubungi pimpinan admin.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {filteredStudents.map((s, idx) => {
                    const currentStatus = draftAttendance[s.id] || "Hadir";
                    return (
                      <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded w-6 text-center">{idx + 1}</span>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 block">{s.namaSiswa}</span>
                              {loadedAttendance[s.id]?.isFallback && (
                                <span className="text-[8px] bg-sky-50 border border-sky-150 text-sky-700 px-1 rounded-sm font-bold uppercase tracking-wide flex items-center gap-0.5" title="Otomatis tersinkron dengan jam mengajar lain hari ini">
                                  ⚡ Sinkron Harian
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400 font-mono">NIS: {s.nis}</span>
                          </div>
                        </div>

                        {/* Status Radio Buttons & Catatan */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          
                          {/* Attend Status Toggles */}
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(["Hadir", "Sakit", "Izin", "Alpa"] as AttendanceStatusSiswa[]).map(status => {
                              const isActive = currentStatus === status;
                              let activeColor = "bg-emerald-600 text-white";
                              if (status === "Sakit") activeColor = "bg-amber-500 text-white";
                              if (status === "Izin") activeColor = "bg-blue-500 text-white";
                              if (status === "Alpa") activeColor = "bg-rose-500 text-white";

                              return (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setDraftAttendance(prev => ({ ...prev, [s.id]: status }))}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    isActive ? activeColor : "text-slate-500 hover:text-slate-880"
                                  }`}
                                >
                                  {status}
                                </button>
                              );
                            })}
                          </div>

                          {/* Catatan Input */}
                          <input
                            type="text"
                            placeholder="Keterangan..."
                            value={draftCatatan[s.id] || ""}
                            onChange={(e) => setDraftCatatan(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-full sm:w-28 px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 text-slate-700 font-medium"
                          />

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Save Footer Area */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 font-medium">
                  Pastikan menyimpan perubahan data setelah mengoreksi keabsahan.
                </div>
                <button
                  type="button"
                  onClick={handleSaveStudentAttendance}
                  disabled={classStudents.length === 0}
                  className="flex items-center gap-1.5 bg-[#2D3A3A] hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" /> Simpan Kehadiran
                </button>
              </div>

            </div>
          </div>

          {/* Quick Stats & Date logs Column */}
          <div className="space-y-6">
            
            {/* Realtime Attendance Rate Indicator */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#718F6E] block mb-1">Rasio Sesi Ini</span>
              
              <div className="relative inline-flex items-center justify-center">
                {/* Visual circle percentage */}
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center bg-slate-50">
                  <span className="text-3xl font-display font-black text-slate-800">{attendanceStats.presentPct}%</span>
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Presentase</span>
                </div>
              </div>

              {/* Detailed Counter */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-2xl">
                  <span className="text-lg font-mono font-black text-emerald-700 block">{attendanceStats.present}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Hadir</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded-2xl">
                  <span className="text-lg font-mono font-black text-amber-700 block">{attendanceStats.sick}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Sakit</span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2 rounded-2xl">
                  <span className="text-lg font-mono font-black text-blue-700 block">{attendanceStats.permitted}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Izin</span>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-2 rounded-2xl">
                  <span className="text-lg font-mono font-black text-rose-700 block">{attendanceStats.alpha}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Alpa</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-450 leading-relaxed font-semibold pt-1">
                Mengacu pada data terdaftar rombel <strong className="text-slate-700">{kelas.find(k => k.id === selectedKelasId)?.namaKelas}</strong>
              </div>
            </div>

            {/* Attendance History list */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#8BA888]" /> Histori Absen Tersimpan
              </h4>
              
              {absenSiswa.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic font-semibold pt-1">Belum ada histori absensi tersimpan.</p>
              ) : (
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 text-xs">
                  {/* Find unique Date - Class - Jam keys */}
                  {Array.from(new Set(absenSiswa.map(a => `${a.tanggal}_${a.kelasId}_${a.jamPelajaran || JAM_PELAJARAN_OPTIONS[0]}`)))
                    .sort((a,b) => b.localeCompare(a))
                    .slice(0, 10)
                    .map(key => {
                      const [tgl, kId, jam] = key.split("_");
                      const clsName = kelas.find(k => k.id === kId)?.namaKelas || "Kelas Lain";
                      const count = absenSiswa.filter(a => a.tanggal === tgl && a.kelasId === kId && (a.jamPelajaran || JAM_PELAJARAN_OPTIONS[0]) === jam).length;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setAttendanceDate(tgl);
                            setSelectedKelasId(kId);
                            setSelectedJam(jam);
                            showNotification(`Memuat data absen ${clsName} tanggal ${tgl} jam ${jam}`, "neutral");
                          }}
                          className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 flex items-center justify-between text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-extrabold text-slate-800 block text-xs">{clsName}</span>
                            <span className="text-[9px] text-slate-450 font-semibold block">{jam}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{tgl}</span>
                          </div>
                          <span className="text-[9px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded-lg text-slate-550 font-bold">
                            {count} Siswa
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Laman Edit Absensi Terlewat (Lupa Mengabsen Murid) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mt-6 space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
              <Calendar className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-1.5">
                KOREKSI ABSENSI SWASTA / TERLEWAT GURU (LUPA ABSEN)
              </h3>
              <p className="text-[10px] text-slate-550 font-semibold leading-normal">
                Gunakan panel koreksi cepat di bawah jika Anda terlewat melakukan presensi siswa pada jam mata pelajaran terdahulu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 font-sans text-xs">
              <label className="text-[10px] font-black text-slate-500 uppercase">Pilih Rombel Terlewat</label>
              <select
                value={pastKelasId}
                onChange={(e) => setPastKelasId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700 cursor-pointer"
              >
                {finalKelasOptionsPast.map(k => (
                  <option key={k.id} value={k.id}>{k.namaKelas}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 font-sans text-xs">
              <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal Terlewat</label>
              <input
                type="date"
                value={pastDate}
                onChange={(e) => setPastDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-bold text-slate-700 font-mono"
              />
            </div>

            <div className="space-y-1 font-sans text-xs">
              <label className="text-[10px] font-black text-slate-500 uppercase">Pilih Jam</label>
              <select
                value={pastJam}
                onChange={(e) => setPastJam(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700 cursor-pointer"
              >
                {JAM_PELAJARAN_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick interactive checklist for correcting past attendance */}
          <div>
            {pastStudents.length === 0 ? (
              <p className="p-4 bg-slate-50 text-center text-xs text-slate-400 italic font-semibold rounded-xl">
                Tidak ada data siswa terdaftar pada kelas terpilih.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-extrabold text-slate-650 flex items-center gap-1">
                  <span>Daftar Nama Siswa pada Kelas {kelas.find(k => k.id === pastKelasId)?.namaKelas}:</span>
                </p>

                <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100 bg-slate-50/20">
                  {pastStudents.map((s, sIdx) => {
                    const status = pastDraft[s.id] || "Hadir";
                    return (
                      <div key={s.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-center text-[10px] text-slate-400 font-bold font-mono">{sIdx + 1}</span>
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">{s.namaSiswa}</span>
                            <span className="text-[9px] text-slate-400 font-mono font-semibold">NIS: {s.nis}</span>
                          </div>
                        </div>

                        {/* Button Switcher Group */}
                        <div className="flex gap-1">
                          {(["Hadir", "Sakit", "Izin", "Alpa"] as AttendanceStatusSiswa[]).map(st => {
                            let style = "bg-white text-slate-50 border-slate-200 hover:bg-slate-100";
                            if (status === st) {
                              if (st === "Hadir") style = "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs scale-105";
                              if (st === "Sakit") style = "bg-amber-500 text-white border-amber-500 font-bold shadow-xs scale-105";
                              if (st === "Izin") style = "bg-blue-600 text-white border-blue-600 font-bold shadow-xs scale-105";
                              if (st === "Alpa") style = "bg-rose-600 text-white border-rose-600 font-bold shadow-xs scale-105";
                            }
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  setPastDraft(prev => ({ ...prev, [s.id]: st }));
                                }}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${style}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSavePastKoreksi}
                    className="px-5 py-2.5 bg-slate-850 hover:bg-slate-900 border border-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    Simpan Koreksi Absensi Terlewat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      ) : subTab === "guru" ? (
        // ======================== ABSEN GURU BOARD ========================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Quick Check-in form as Guru */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" /> Presensi Masuk Pendidik
              </h3>
              
              <form onSubmit={handleSaveGuruAttendance} className="space-y-4 font-sans text-xs">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pilih Guru Aktif</label>
                  <select
                    value={selectedGuruCode}
                    onChange={(e) => setSelectedGuruCode(e.target.value)}
                    disabled={userRole === "guru"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {guruCodes.length === 0 ? (
                      <option value="USTADZ-MASTER">Guru Umum (USTADZ-MASTER)</option>
                    ) : (
                      guruCodes.map(g => (
                        <option key={g.code} value={g.code}>
                          {g.namaGuru}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Absen Masuk</label>
                  <input
                    type="date"
                    required
                    value={guruAttendanceDate}
                    onChange={(e) => setGuruAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700 text-xs"
                  />
                  <p className="text-[9.5px] text-slate-400 font-medium italic mt-0.5">⚠️ Presensi pendidik dilakukan satu kali per hari (saat masuk saja).</p>
                </div>

                {/* Status Options Toggles */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Status Kehadiran</label>
                  <div className="grid grid-cols-5 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
                    {(["Hadir", "Sakit", "Izin", "Cuti", "Alpa"] as AttendanceStatusGuru[]).map(st => {
                      const isAct = selectedGuruStatus === st;
                      let actC = "bg-emerald-600 text-white";
                      if (st === "Sakit") actC = "bg-amber-500 text-white";
                      if (st === "Izin") actC = "bg-blue-500 text-white";
                      if (st === "Cuti") actC = "bg-indigo-500 text-white";
                      if (st === "Alpa") actC = "bg-rose-500 text-white";

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedGuruStatus(st)}
                          className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                            isAct ? actC : "text-slate-500 hover:text-slate-850"
                          }`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Aktivitas / Materi (Opsional)</label>
                  <textarea
                    placeholder="Materi mutalaah, hiwar, atau pengerjaan mufradat..."
                    value={guruCatatan}
                    onChange={(e) => setGuruCatatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700 text-xs h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  Kirim Absen Pendidik
                </button>

              </form>
            </div>
          </div>

          {/* Teacher Attendance logs list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-emerald-600" /> Log Presensi Pengajar Harian
                </h3>
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl text-emerald-700 font-mono font-bold">
                  {absenGuru.length} Absensi Tercatat
                </span>
              </div>

              {absenGuru.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Belum ada absen guru yang terekam.</p>
                  <p className="text-[10px] text-slate-400">Silakan isi form presensi di panel samping.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[430px] overflow-y-auto text-xs">
                  {absenGuru
                    .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                    .map(item => {
                      const currentGuru = guruCodes.find(g => g.code === item.teacherCode);
                      let styleBadge = "bg-emerald-50 text-emerald-700 border-emerald-150";
                      if (item.status === "Sakit") styleBadge = "bg-amber-50 text-amber-700 border-amber-150";
                      if (item.status === "Izin") styleBadge = "bg-blue-50 text-blue-700 border-blue-150";
                      if (item.status === "Cuti") styleBadge = "bg-indigo-50 text-indigo-700 border-indigo-150";
                      if (item.status === "Alpa") styleBadge = "bg-rose-50 text-rose-700 border-rose-150";

                      return (
                        <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm">
                                {currentGuru?.namaGuru || item.teacherCode === "USTADZ-MASTER" ? "Ustadz Pembina Utama" : item.teacherCode}
                              </span>
                              <span className="text-[9px] font-semibold font-mono text-slate-400">
                                {item.teacherCode}
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-slate-550 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{item.tanggal}</span>
                                <span className="text-slate-300">|</span>
                                <span className="font-semibold text-emerald-700 bg-emerald-100/50 px-1.5 py-0.2 rounded">{item.jamPelajaran || JAM_PELAJARAN_OPTIONS[0]}</span>
                              </div>
                              {item.catatan && (
                                <p className="italic text-slate-400 mt-1">
                                  "{item.catatan}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border rounded-lg ${styleBadge}`}>
                              {item.status}
                            </span>
                            
                            {userRole === "admin" && (
                              <button
                                onClick={() => handleDeleteGuruAttendance(item.id)}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Hapus catatan absen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        // ======================== REKAP BULANAN TAB ========================
        <div className="bg-white rounded-3xl border border-slate-250 p-6 space-y-6 shadow-xs animate-fadeIn print-card">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-100 pb-5 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:max-w-2xl">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Pilih Rombel / Kelas</label>
                <select
                  value={rekapKelasId}
                  onChange={(e) => setRekapKelasId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                >
                  {finalKelasOptionsPast.map(k => (
                    <option key={k.id} value={k.id}>{k.namaKelas}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Bulan Rekapitulator</label>
                <select
                  value={rekapMonth}
                  onChange={(e) => setRekapMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                >
                  {BULAN_OPTIONS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tahun Akademik</label>
                <select
                  value={rekapYear}
                  onChange={(e) => setRekapYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 text-slate-800 font-semibold"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            {/* Direct exports */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all"
              >
                <Printer className="w-4 h-4 text-slate-500" /> Cetak PDF
              </button>
              <button
                type="button"
                onClick={handleExportMonthlyRecapExcel}
                disabled={monthlyRecapData.length === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Unduh Laporan Excel
              </button>
            </div>
          </div>

          {/* Printable Report Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-100">
            <h3 className="text-md font-display font-black text-slate-850 tracking-tight uppercase">
              REKAPITULASI BULANAN KEHADIRAN SISWA DIGITAL
            </h3>
            <p className="text-xs text-slate-500 font-semibold tracking-wide">
              Mata Pelajaran: <span className="text-emerald-700 font-bold">Bahasa Arab</span> &bull; 
              Kelas: <span className="text-slate-800 font-bold">{kelas.find(k => k.id === rekapKelasId)?.namaKelas || "Semua"}</span> &bull; 
              Periode: <span className="text-slate-800 font-bold">{BULAN_OPTIONS.find(b => b.value === rekapMonth)?.label} {rekapYear}</span>
            </p>
          </div>

          {/* Table representation */}
          {monthlyRecapData.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium italic">
              Belum ada data siswa terdaftar atau aktif pada kelas dan periode bulan ini di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase border-b border-slate-200">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-28">NIS</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3 text-center bg-emerald-50/50 w-16 text-emerald-800 font-black">H</th>
                    <th className="p-3 text-center bg-amber-50/50 w-16 text-amber-800 font-black">S</th>
                    <th className="p-3 text-center bg-blue-50/50 w-16 text-blue-800 font-black">I</th>
                    <th className="p-3 text-center bg-rose-50/50 w-16 text-rose-800 font-black">A</th>
                    <th className="p-3 text-center w-24 text-slate-500 font-mono">Total Sesi</th>
                    <th className="p-3 text-center w-24 text-slate-800 font-extrabold">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {monthlyRecapData.map((row, idx) => {
                    let pctColor = "text-emerald-750 font-black";
                    if (row.pct < 85) pctColor = "text-amber-600 font-extrabold";
                    if (row.pct < 70) pctColor = "text-rose-600 font-black";

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono font-semibold">{idx + 1}</td>
                        <td className="p-3 text-slate-600 font-mono font-bold">{row.nis}</td>
                        <td className="p-3 text-slate-900 font-extrabold font-display">{row.nama}</td>
                        <td className="p-3 text-center bg-emerald-50/20 font-bold text-emerald-800 text-sm">{row.H}</td>
                        <td className="p-3 text-center bg-amber-50/20 font-bold text-amber-700 text-sm">{row.S}</td>
                        <td className="p-3 text-center bg-blue-50/20 font-bold text-blue-700 text-sm">{row.I}</td>
                        <td className="p-3 text-center bg-rose-50/20 font-bold text-rose-750 text-sm">{row.A}</td>
                        <td className="p-3 text-center font-mono text-slate-500 text-sm">{row.totalSession}</td>
                        <td className={`p-3 text-center text-sm ${pctColor}`}>{row.pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Informative Legend */}
              <div className="mt-6 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-450 font-semibold border-t border-slate-100 pt-4">
                <div className="flex gap-4">
                  <span><strong>Keterangan Singkatan:</strong></span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> H = Hadir</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span> S = Sakit</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block"></span> I = Izin</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span> A = Alpa</span>
                </div>
                <div>
                  * Persentase dihitung dari: (Hadir &divide; Total Sesi Tercatat) &times; 100%
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
