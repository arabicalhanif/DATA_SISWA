import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  User, 
  MapPin, 
  Plus, 
  Trash2, 
  Layers,
  GraduationCap,
  Sparkles,
  Trophy,
  Share2
} from "lucide-react";
import { Kelas, MataPelajaran, GuruCode, Jadwal, HariBelajar } from "../types";

interface SchedulePortalProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  guruCodes: GuruCode[];
  jadwal: Jadwal[];
  setJadwal: React.Dispatch<React.SetStateAction<Jadwal[]>>;
  showNotification: (text: string, type?: "success" | "neutral") => void;
  userRole: "admin" | "guru" | "wali";
  currentGuruCode: string | null;
}

const HARI_LIST: HariBelajar[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function SchedulePortal({
  kelas,
  mapel,
  guruCodes,
  jadwal,
  setJadwal,
  showNotification,
  userRole,
  currentGuruCode
}: SchedulePortalProps) {
  // Toggle Mode: Siswa views (by Kelas) or Guru views (by Guru code)
  const [viewMode, setViewMode] = useState<"siswa" | "guru">(userRole === "guru" ? "guru" : "siswa");

  // Selected filters for schedules viewing
  const [filterKelasId, setFilterKelasId] = useState<string>(kelas[0]?.id || "");
  const [filterGuruCode, setFilterGuruCode] = useState<string>(
    userRole === "guru" && currentGuruCode ? currentGuruCode : (currentGuruCode || guruCodes[0]?.code || "")
  );

  // Form states for creating a new Schedule (Visible for Guru/Admin roles)
  const [newHari, setNewHari] = useState<HariBelajar>("Senin");
  const [newJamMulai, setNewJamMulai] = useState("07:30");
  const [newJamSelesai, setNewJamSelesai] = useState("09:00");
  const [newKelasId, setNewKelasId] = useState(kelas[0]?.id || "");
  const [newMapelId, setNewMapelId] = useState(mapel[0]?.id || "");
  const [newTeacherCode, setNewTeacherCode] = useState(currentGuruCode || guruCodes[0]?.code || "");
  const [newRuangan, setNewRuangan] = useState("");

  // Break Times Expansion states
  const [isIstirahat, setIsIstirahat] = useState(false);
  const [labelIstirahat, setLabelIstirahat] = useState("Istirahat Banin");
  const [targetKelasScope, setTargetKelasScope] = useState<"selected" | "banin" | "banat" | "all">("selected");

  // Helper check for Banin / Banat Parallel Code
  const isBaninClass = (className: string) => {
    const match = className.match(/Kelas\s+\d+([A-G])/i);
    if (!match) return false;
    const suffix = match[1].toUpperCase();
    return ["A", "B", "C"].includes(suffix);
  };

  const isBanatClass = (className: string) => {
    const match = className.match(/Kelas\s+\d+([A-G])/i);
    if (!match) return false;
    const suffix = match[1].toUpperCase();
    return ["D", "E", "F", "G"].includes(suffix);
  };

  // Sync inputs when lists open
  React.useEffect(() => {
    if (!newKelasId && kelas.length > 0) setNewKelasId(kelas[0].id);
    if (!newMapelId && mapel.length > 0) setNewMapelId(mapel[0].id);
    if (!newTeacherCode && guruCodes.length > 0) setNewTeacherCode(guruCodes[0].code);
    
    if (userRole === "guru" && currentGuruCode) {
      setViewMode("guru");
      setFilterGuruCode(currentGuruCode);
    }
  }, [kelas, mapel, guruCodes, userRole, currentGuruCode]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawBytes = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(rawBytes, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        if (rows.length === 0) {
          showNotification("Beruntung sekali, file Excel terupload melainkan datanya kosong.", "neutral");
          return;
        }

        const importedItems: Jadwal[] = [];
        rows.forEach((row, idx) => {
          const hariRaw = String(row.hari || row.Hari || "Senin").trim();
          const hariNormalized = (hariRaw.charAt(0).toUpperCase() + hariRaw.slice(1).toLowerCase());
          const hari = (HARI_LIST.includes(hariNormalized as HariBelajar) ? hariNormalized : "Senin") as HariBelajar;

          const jamMulai = String(row.jamMulai || row.jamMulai || "07:30").trim();
          const jamSelesai = String(row.jamSelesai || row.jamSelesai || "09:00").trim();
          const ruangan = row.ruangan ? String(row.ruangan).trim() : undefined;

          // Find class ID mapping, e.g. "Kelas 2A", match suffix
          const classSearchCode = String(row.namaKelas || row.kelas || row.kelasId || "").trim();
          let targetKelasId = "";
          const matchedKelas = kelas.find(k => 
            k.id === classSearchCode || 
            k.namaKelas.toLowerCase() === classSearchCode.toLowerCase() ||
            k.namaKelas.toLowerCase().includes(classSearchCode.toLowerCase())
          );
          if (matchedKelas) {
            targetKelasId = matchedKelas.id;
          } else {
            targetKelasId = kelas[0]?.id || "";
          }

          // Check if break
          const mapelRaw = String(row.namaMapel || row.mapel || "").trim().toLowerCase();
          const isBreak = mapelRaw.includes("istirahat") || String(row.isIstirahat || "").toLowerCase() === "true";

          if (isBreak) {
            importedItems.push({
              id: `JAD-${Date.now()}-${idx}-${Math.floor(Math.random() * 100)}`,
              hari,
              jamMulai,
              jamSelesai,
              kelasId: targetKelasId,
              mapelId: "ISTIRAHAT",
              teacherCode: "ISTIRAHAT",
              ruangan,
              isIstirahat: true,
              labelIstirahat: String(row.namaMapel || row.labelIstirahat || "Istirahat").trim()
            });
          } else {
            // Mapel lookup
            const matchedMapel = mapel.find(m => 
              m.id === mapelRaw || 
              m.namaMapel.toLowerCase() === mapelRaw.toLowerCase() ||
              m.namaMapel.toLowerCase().includes(mapelRaw.toLowerCase())
            );
            const mapelId = matchedMapel ? matchedMapel.id : (mapel[0]?.id || "");

            // Guru lookup
            const tCodeRaw = String(row.teacherCode || row.kodeGuru || "").trim().toUpperCase();
            const matchedTeacher = guruCodes.find(g => g.code === tCodeRaw);
            const teacherCode = matchedTeacher ? matchedTeacher.code : (guruCodes[0]?.code || "GURU");

            importedItems.push({
              id: `JAD-${Date.now()}-${idx}-${Math.floor(Math.random() * 100)}`,
              hari,
              jamMulai,
              jamSelesai,
              kelasId: targetKelasId,
              mapelId,
              teacherCode,
              ruangan
            });
          }
        });

        setJadwal(prev => [...prev, ...importedItems]);
        showNotification(`Berhasil mengimpor ${importedItems.length} jadwal pelajaran dari Excel!`, "success");
      } catch (err: any) {
        showNotification(`Gagal mengimpor file: ${err.message || err}`, "neutral");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          hari: "Senin",
          jamMulai: "07:30",
          jamSelesai: "09:00",
          namaKelas: "Kelas 2A",
          namaMapel: "Bahasa Arab",
          teacherCode: "USTADZ-01",
          ruangan: "R. Kelas 2A"
        },
        {
          hari: "Senin",
          jamMulai: "09:00",
          jamSelesai: "09:30",
          namaKelas: "Kelas 2A",
          namaMapel: "Istirahat Banin",
          teacherCode: "ISTIRAHAT",
          ruangan: "Kantin Utama"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Jadwal Pelajaran");
      XLSX.writeFile(wb, "Template_Import_Jadwal.xlsx");
      showNotification("Template Excel Jadwal Pelajaran berhasil diunduh!", "success");
    } catch (err: any) {
      showNotification("Gagal mengunduh template.", "neutral");
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (isIstirahat) {
      // Determine target classes based on scope
      let filteredClasses: Kelas[] = [];
      if (targetKelasScope === "selected") {
        const found = kelas.find(k => k.id === newKelasId);
        if (found) filteredClasses = [found];
      } else if (targetKelasScope === "banin") {
        filteredClasses = kelas.filter(k => isBaninClass(k.namaKelas));
      } else if (targetKelasScope === "banat") {
        filteredClasses = kelas.filter(k => isBanatClass(k.namaKelas));
      } else if (targetKelasScope === "all") {
        filteredClasses = kelas;
      }

      if (filteredClasses.length === 0) {
        showNotification("Tidak ada kelas sasar yang sesuai dengan rujukan scope.", "neutral");
        return;
      }

      const timestamp = Date.now();
      const newEntries: Jadwal[] = filteredClasses.map((c, idx) => ({
        id: `JAD-${timestamp}-${idx}-${Math.floor(Math.random() * 100)}`,
        hari: newHari,
        jamMulai: newJamMulai,
        jamSelesai: newJamSelesai,
        kelasId: c.id,
        mapelId: "ISTIRAHAT",
        teacherCode: "ISTIRAHAT",
        ruangan: newRuangan.trim() || undefined,
        isIstirahat: true,
        labelIstirahat: labelIstirahat.trim() || "Istirahat"
      }));

      setJadwal(prev => [...prev, ...newEntries]);
      showNotification(`Berhasil mendaftarkan ${newEntries.length} sesi istirahat untuk kelas sasar!`, "success");
      setNewRuangan("");
      return;
    }

    if (!newKelasId || !newMapelId || !newTeacherCode) {
      showNotification("Sasar Kelas, Mapel, dan Guru wajib diisi.", "neutral");
      return;
    }

    const newId = `JAD-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    const newEntry: Jadwal = {
      id: newId,
      hari: newHari,
      jamMulai: newJamMulai,
      jamSelesai: newJamSelesai,
      kelasId: newKelasId,
      mapelId: newMapelId,
      teacherCode: newTeacherCode,
      ruangan: newRuangan.trim() || undefined
    };

    setJadwal(prev => [...prev, newEntry]);
    showNotification("Jadwal mengajar-belajar berhasil didaftarkan ke sistem!", "success");
    setNewRuangan("");
  };

  const handleDeleteSchedule = (id: string) => {
    setJadwal(prev => prev.filter(j => j.id !== id));
    showNotification("Jadwal pelajaran berhasil dihapus.", "neutral");
  };

  // Class Study Scheduler view computations
  const currentClassSchedules = useMemo(() => {
    return FiltratedSchedulesByClass(jadwal, filterKelasId);
  }, [jadwal, filterKelasId]);

  function FiltratedSchedulesByClass(list: Jadwal[], classId: string) {
    return list.filter(j => j.kelasId === classId);
  }

  // Guru teaching schedules view computations
  const currentGuruSchedules = useMemo(() => {
    return FiltratedSchedulesByGuru(jadwal, filterGuruCode);
  }, [jadwal, filterGuruCode]);

  function FiltratedSchedulesByGuru(list: Jadwal[], gCode: string) {
    return list.filter(j => j.teacherCode === gCode);
  }

  // Group schedules by day for neat display
  const groupedSchedulesByDay = useMemo(() => {
    const listToProcess = viewMode === "siswa" ? currentClassSchedules : currentGuruSchedules;
    const map: { [key in HariBelajar]?: Jadwal[] } = {};
    
    HARI_LIST.forEach(d => {
      const matching = listToProcess.filter(j => j.hari === d);
      // Sort in ascending order by start time
      matching.sort((a,b) => a.jamMulai.localeCompare(b.jamMulai));
      if (matching.length > 0) {
        map[d] = matching;
      }
    });
    return map;
  }, [viewMode, currentClassSchedules, currentGuruSchedules]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-slate-800 tracking-tight">Portal Jadwal Mengajar & Belajar</h2>
            <p className="text-xs text-slate-500 font-medium">Informasi kalender mingguan kelas siswa dan penugasan guru pengampu</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start xl:self-center">
          {/* View Switchers */}
          {userRole !== "guru" && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setViewMode("siswa")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "siswa"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Jadwal Belajar Siswa
              </button>
              <button
                onClick={() => setViewMode("guru")}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "guru"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-850 cursor-pointer"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Jadwal Mengajar Guru
              </button>
            </div>
          )}

          {userRole === "admin" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                type="button"
                className="px-3.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-650 cursor-pointer flex items-center gap-1.5 transition-colors"
                title="Unduh Template Excel Jadwal"
              >
                📥 Template Excel
              </button>
              <label className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-indigo-700 cursor-pointer flex items-center gap-1.5 transition-colors">
                📤 Impor Excel
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Board Schedule Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs">
            
            {/* Filter Selector depending on Mode */}
            {userRole !== "guru" && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    {viewMode === "siswa" ? "Filter Sasar Kelas" : "Filter Pengajar Guru"}
                  </span>
                </div>

                {viewMode === "siswa" ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Pilih Kelas:</span>
                    <select
                      value={filterKelasId}
                      onChange={(e) => setFilterKelasId(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-500 text-slate-800 font-bold"
                    >
                      {kelas.map(k => (
                        <option key={k.id} value={k.id}>{k.namaKelas}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Pilih Guru:</span>
                    <select
                      value={filterGuruCode}
                      onChange={(e) => setFilterGuruCode(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-500 text-slate-800 font-bold"
                    >
                      {guruCodes.map(g => (
                        <option key={g.code} value={g.code}>{g.namaGuru}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Timetable visual planner content */}
            {Object.keys(groupedSchedulesByDay).length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-2.5">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Tidak ada jadwal tercatat.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  {userRole !== "wali" 
                    ? "Gunakan form untuk menambahkan agenda jadwal pembelajaran mata pelajaran di rombel ini." 
                    : "Wali Murid dapat menyarankan program jadwal pelajaran ke super admin sekolah."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HARI_LIST.map(day => {
                  const daySchedules = groupedSchedulesByDay[day];
                  if (!daySchedules) return null;

                  return (
                    <div key={day} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 space-y-3 shadow-xs">
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-wider">
                          📅 {day}
                        </span>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-600 font-bold px-2 py-0.5 rounded-lg">
                          {daySchedules.length} Sesi
                        </span>
                      </div>

                      {/* Sessions within this day */}
                      <div className="space-y-2.5">
                        {daySchedules.map(session => {
                          const currentMapel = mapel.find(m => m.id === session.mapelId);
                          const currentKelas = kelas.find(k => k.id === session.kelasId);
                          const currentTeacher = guruCodes.find(g => g.code === session.teacherCode);

                          if (session.isIstirahat) {
                            return (
                              <div key={session.id} className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 space-y-2 hover:bg-amber-50 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 leading-none">
                                    <span className="text-xs font-black text-amber-805 flex items-center gap-1 block">
                                      ☕ {session.labelIstirahat || "Istirahat"}
                                    </span>
                                    {viewMode === "guru" && (
                                      <span className="text-[10px] text-amber-700/85 font-medium flex items-center gap-1 mt-1 block">
                                        <Layers className="w-3 h-3 shrink-0" /> Ke Kelas: {currentKelas?.namaKelas || "Kelas Lain"}
                                      </span>
                                    )}
                                  </div>

                                  {userRole === "admin" && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSchedule(session.id)}
                                      className="p-1 text-amber-500 hover:text-red-500 hover:bg-white rounded-lg cursor-pointer shrink-0 transition-all border border-transparent hover:border-amber-200"
                                      title="Hapus istirahat"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-[9px] pt-1 border-t border-amber-205 border-dashed font-mono text-amber-700">
                                  <span className="flex items-center gap-1 font-extrabold">
                                    <Clock className="w-3 h-3 text-amber-600" /> {session.jamMulai} - {session.jamSelesai}
                                  </span>
                                  {session.ruangan && (
                                    <span className="flex items-center gap-0.5 bg-white border border-amber-200 rounded px-1.5 py-0.5 text-amber-800 font-bold max-w-24 truncate">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" /> {session.ruangan}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={session.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 hover:shadow-2xs transition-shadow">
                              
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 leading-none">
                                  <span className="text-xs font-extrabold text-[#2D3A3A] block">
                                    {currentMapel?.namaMapel || "Mapel Lain"}
                                  </span>
                                  {viewMode === "siswa" ? (
                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                      <User className="w-3 h-3 shrink-0" /> {currentTeacher?.namaGuru || session.teacherCode}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                      <Layers className="w-3 h-3 shrink-0" /> Ke Kelas: {currentKelas?.namaKelas || "Kelas Lain"}
                                    </span>
                                  )}
                                </div>

                                {/* Allow Delete directly on schedule box */}
                                {userRole === "admin" && (
                                  <button
                                    onClick={() => handleDeleteSchedule(session.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 transition-all"
                                    title="Hapus jadwal"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Time and Location Tag badges */}
                              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-slate-100 font-mono text-slate-500">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock className="w-3 h-3 text-[#8BA888]" /> {session.jamMulai} - {session.jamSelesai}
                                </span>
                                {session.ruangan && (
                                  <span className="flex items-center gap-0.5 bg-slate-105 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 font-bold max-w-24 truncate">
                                    <MapPin className="w-2.5 h-2.5 shrink-0" /> {session.ruangan}
                                  </span>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Schedule Creation Box Form (Only show for Admin and Guru roles) */}
        <div className="space-y-6">
          
          {userRole !== "wali" ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 shadow-xs animate-fadeIn">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" /> Daftarkan Sesi Jadwal Baru
              </h3>
              
              <form onSubmit={handleAddSchedule} className="space-y-3.5 font-sans text-xs">
                
                <div className="flex items-center gap-2 p-2.5 bg-amber-55/40 border border-amber-205 rounded-xl">
                  <input
                    type="checkbox"
                    id="isIstirahatCheckbox"
                    checked={isIstirahat}
                    onChange={(e) => setIsIstirahat(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-400 border-slate-350 cursor-pointer"
                  />
                  <label htmlFor="isIstirahatCheckbox" className="text-[11px] font-bold text-amber-800 cursor-pointer select-none">
                    Atur sebagai Sesi ISTIRAHAT (Break Slot)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hari Kuliah</label>
                    <select
                      value={newHari}
                      onChange={(e) => setNewHari(e.target.value as HariBelajar)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500"
                    >
                      {HARI_LIST.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Input Ruangan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Kelas 1, Lab IPA"
                      value={newRuangan}
                      onChange={(e) => setNewRuangan(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jam Mulai</label>
                    <input
                      type="text"
                      required
                      placeholder="07:30"
                      value={newJamMulai}
                      onChange={(e) => setNewJamMulai(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 font-mono text-center text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Jam Selesai</label>
                    <input
                      type="text"
                      required
                      placeholder="09:00"
                      value={newJamSelesai}
                      onChange={(e) => setNewJamSelesai(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 font-mono text-center text-slate-800"
                    />
                  </div>
                </div>

                {isIstirahat && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cakupan Kelas Penerima</label>
                    <select
                      value={targetKelasScope}
                      onChange={(e) => setTargetKelasScope(e.target.value as any)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-700"
                    >
                      <option value="selected">Hanya Rombel / Kelas Terpilih</option>
                      <option value="banin">Semua Kelas Laki-Laki (Banin: A-C)</option>
                      <option value="banat">Semua Kelas Perempuan (Banat: D-G)</option>
                      <option value="all">Semua Kelas Tanpa Terkecuali</option>
                    </select>
                  </div>
                )}

                {(!isIstirahat || targetKelasScope === "selected") && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Rombel / Kelas</label>
                    <select
                      value={newKelasId}
                      onChange={(e) => setNewKelasId(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-700"
                    >
                      {kelas.map(k => (
                        <option key={k.id} value={k.id}>{k.namaKelas}</option>
                      ))}
                    </select>
                  </div>
                )}

                {isIstirahat ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Label Sesi Istirahat</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Istirahat Banin, Istirahat Banat, Shalat Dzuhur"
                      value={labelIstirahat}
                      onChange={(e) => setLabelIstirahat(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-800"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Mata Pelajaran</label>
                      <select
                        value={newMapelId}
                        onChange={(e) => setNewMapelId(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-700"
                      >
                        {mapel.map(m => (
                          <option key={m.id} value={m.id}>{m.namaMapel}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Guru Pengajar / Pemateri</label>
                      <select
                        value={newTeacherCode}
                        onChange={(e) => setNewTeacherCode(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 text-slate-700"
                      >
                        {guruCodes.map(g => (
                          <option key={g.code} value={g.code}>{g.namaGuru}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 rounded-xl bg-[#2D3A3A] hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer font-sans"
                >
                  {isIstirahat ? "Daftarkan Sesi Istirahat" : "Daftarkan ke Kalender"}
                </button>

              </form>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-3xl space-y-3 shade-sm">
              <span className="text-[10px] font-mono bg-white text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg font-bold">
                PRO TIPS WALI MURID
              </span>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Jadwal ini disinkronisasikan secara otomatis dengan kalender kurikulum sekolah. Jika ada ketidaksesuaian jam mengajar atau pergantian guru pendamping, Anda dapat menghubungi guru walikelas masing-masing.
              </p>
            </div>
          )}

          {/* Quick Info Board */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs">
            <h4 className="text-xs font-black uppercase text-slate-705 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Statistik Kalender
            </h4>
            
            <div className="space-y-2.5 text-xs text-slate-500 font-medium font-sans">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Total Sesi Terjadwal</span>
                <span className="font-bold text-slate-700 font-mono text-sm">{jadwal.length} Sesi</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Mata Pelajaran Aktif</span>
                <span className="font-bold text-slate-700 font-mono text-sm">{mapel.length}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                <span>Rombel Kelas</span>
                <span className="font-bold text-slate-700 font-mono text-sm">{kelas.length}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
