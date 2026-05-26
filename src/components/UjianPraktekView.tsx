import React, { useState, useMemo } from "react";
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Save, 
  PlusCircle, 
  Calendar, 
  Flame, 
  User, 
  BookOpen, 
  TrendingUp, 
  FileText, 
  X,
  Sparkles,
  ClipboardCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import { UjianPraktek, Kelas, MataPelajaran, Siswa, UjianPraktekSiswa } from "../types";

interface UjianPraktekViewProps {
  ujianPraktek: UjianPraktek[];
  setUjianPraktek: React.Dispatch<React.SetStateAction<UjianPraktek[]>>;
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  showNotification: (msg: string, type: "success" | "error" | "neutral") => void;
  activeTeacherCode?: string;
  guruCodes?: Array<{ code: string; namaGuru: string }>;
}

export default function UjianPraktekView({
  ujianPraktek,
  setUjianPraktek,
  kelas,
  mapel,
  siswa,
  showNotification,
  activeTeacherCode,
  guruCodes
}: UjianPraktekViewProps) {
  // Navigation inside Ujian Praktek tab
  const [activeSubTab, setActiveSubTab] = useState<"penilaian" | "monitoring">("penilaian");

  // Selection states for grading
  const [selectedKelasId, setSelectedKelasId] = useState<string>(kelas[0]?.id || "");
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapel[0]?.id || "");
  
  // Selection of active practical exam session for grading
  const [selectedExamId, setSelectedExamId] = useState<string>("");

  // Create new session states
  const [namaUjianBaru, setNamaUjianBaru] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tanggalUjian, setTanggalUjian] = useState(new Date().toISOString().split("T")[0]);
  const [umumkanWaliUjian, setUmumkanWaliUjian] = useState(true);

  // Temporary scores state for unsaved bulk grading
  // Key: studentId, Value: { score: string, participated: boolean }
  const [bulkGrades, setBulkGrades] = useState<Record<string, { score: string; participated: boolean }>>({});

  // Search filter for student grading list
  const [studentSearch, setStudentSearch] = useState("");

  // Resolve active classes having kids
  const filteredStudents = useMemo(() => {
    return siswa.filter(s => s.kelasId === selectedKelasId);
  }, [siswa, selectedKelasId]);

  // Current list of exam sessions available for chosen class and subject
  const sessionsOfSelection = useMemo(() => {
    return ujianPraktek.filter(u => u.kelasId === selectedKelasId && u.mapelId === selectedMapelId);
  }, [ujianPraktek, selectedKelasId, selectedMapelId]);

  // Auto select first exam session if none selected when class/subject changes
  React.useEffect(() => {
    if (sessionsOfSelection.length > 0) {
      const firstSessionId = sessionsOfSelection[0].id;
      setSelectedExamId(firstSessionId);
      
      // Load current scores to bulk input state
      const initialGrades: Record<string, { score: string; participated: boolean }> = {};
      const currentSession = sessionsOfSelection[0];
      
      filteredStudents.forEach(stu => {
        const studentRecord = currentSession.items.find(i => i.siswaId === stu.id);
        initialGrades[stu.id] = {
          score: studentRecord?.nilai !== undefined ? String(studentRecord.nilai) : "",
          participated: studentRecord?.sudahMengikuti || false
        };
      });
      setBulkGrades(initialGrades);
    } else {
      setSelectedExamId("");
      setBulkGrades({});
    }
  }, [selectedKelasId, selectedMapelId, sessionsOfSelection.length, filteredStudents]);

  // Load bulk forms when selecting a different exam session
  const handleExamSessionChange = (examId: string) => {
    setSelectedExamId(examId);
    const sessionObj = ujianPraktek.find(u => u.id === examId);
    if (sessionObj) {
      const initialGrades: Record<string, { score: string; participated: boolean }> = {};
      filteredStudents.forEach(stu => {
        const record = sessionObj.items.find(i => i.siswaId === stu.id);
        initialGrades[stu.id] = {
          score: record?.nilai !== undefined ? String(record.nilai) : "",
          participated: record?.sudahMengikuti || false
        };
      });
      setBulkGrades(initialGrades);
    }
  };

  // Create Ujian Praktek session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaUjianBaru.trim()) {
      showNotification("Suguhi Nama Ujian Praktek dengan detail.", "neutral");
      return;
    }

    // Prepare default items for all students in that class
    const defaultItems: UjianPraktekSiswa[] = filteredStudents.map(stu => ({
      siswaId: stu.id,
      sudahMengikuti: false
    }));

    const newSession: UjianPraktek = {
      id: `PRK-${Date.now()}`,
      namaUjian: namaUjianBaru.trim(),
      kelasId: selectedKelasId,
      mapelId: selectedMapelId,
      tanggal: tanggalUjian,
      items: defaultItems,
      teacherCode: activeTeacherCode || "GURU",
      umumkanWali: umumkanWaliUjian
    };

    setUjianPraktek(prev => [newSession, ...prev]);
    showNotification(`Laman ujian praktek "${newSession.namaUjian}" berhasil dibuat!`, "success");
    setNamaUjianBaru("");
    setShowCreateModal(false);
    setSelectedExamId(newSession.id);
  };

  // Save bulk scores instantly
  const handleSaveBulkScores = () => {
    if (!selectedExamId) {
      showNotification("Pilih atau buat sesi Ujian Praktek terlebih dahulu.", "error");
      return;
    }

    setUjianPraktek(prev => prev.map(session => {
      if (session.id === selectedExamId) {
        // Construct new items list
        const updatedItems = filteredStudents.map(student => {
          const bulkInput = bulkGrades[student.id];
          const scoreNum = bulkInput?.score !== "" ? parseInt(bulkInput?.score) : undefined;
          
          return {
            siswaId: student.id,
            nilai: isNaN(scoreNum as number) ? undefined : scoreNum,
            sudahMengikuti: bulkInput?.participated || false
          };
        });

        return {
          ...session,
          items: updatedItems
        };
      }
      return session;
    }));

    showNotification("Selamat! Seluruh nilai Ujian Praktek massal berhasil disimpan ke sistem terpadu.", "success");
  };

  // Utility calculations
  const gradingStats = useMemo(() => {
    if (!selectedExamId) return null;
    const sessionObj = ujianPraktek.find(u => u.id === selectedExamId);
    if (!sessionObj) return null;

    const totalInClass = filteredStudents.length;
    const itemsWithGrades = sessionObj.items.filter(i => filteredStudents.some(fs => fs.id === i.siswaId));
    const sudahFollow = itemsWithGrades.filter(i => i.sudahMengikuti).length;
    const belumFollow = totalInClass - sudahFollow;

    let averageVal = 0;
    const values = itemsWithGrades.filter(i => i.sudahMengikuti && i.nilai !== undefined).map(i => i.nilai!);
    if (values.length > 0) {
      const termTotal = values.reduce((sum, item) => sum + item, 0);
      averageVal = Math.round(termTotal / values.length);
    }

    return {
      total: totalInClass,
      sudah: sudahFollow,
      belum: belumFollow,
      persenSudah: totalInClass > 0 ? Math.round((sudahFollow / totalInClass) * 100) : 0,
      persenBelum: totalInClass > 0 ? Math.round((belumFollow / totalInClass) * 100) : 0,
      rataRata: averageVal
    };
  }, [ujianPraktek, selectedExamId, filteredStudents]);

  // Overall General Stats for monitoring tab
  const monitoringData = useMemo(() => {
    // Generate overall statistics for every exam session
    return ujianPraktek.map(session => {
      const cls = kelas.find(k => k.id === session.kelasId);
      const sub = mapel.find(m => m.id === session.mapelId);
      const kidsInCls = siswa.filter(s => s.kelasId === session.kelasId);
      
      const countSudah = session.items.filter(i => i.sudahMengikuti).length;
      const countBelum = kidsInCls.length - countSudah;

      return {
        id: session.id,
        namaUjian: session.namaUjian,
        kelas: cls?.namaKelas || "Tanpa Kelas",
        pelajaran: sub?.namaMapel || "Tanpa Mapel",
        tanggal: session.tanggal,
        totalStudents: kidsInCls.length,
        sudah: countSudah,
        belum: countBelum,
        belumList: kidsInCls.filter(k => {
          const matchedItem = session.items.find(si => si.siswaId === k.id);
          return !matchedItem?.sudahMengikuti;
        })
      };
    });
  }, [ujianPraktek, kelas, mapel, siswa]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-[-10%] right-[-5%] w-[15rem] h-[15rem] bg-[#8BA888]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-display font-black tracking-tight flex items-center gap-2">
              Laman Ujian Praktek Terpadu
              <span className="text-[10px] font-bold uppercase tracking-widest bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                Sistem Input Cepat & Masal
              </span>
            </h2>
            <p className="text-xs text-white/70 max-w-xl leading-relaxed">
              Modul pengisian nilai ujian praktek murid secara cepat berkala seluruh kelas dalam hitungan detik dilengkapi statistik kelayakan tuntas ujian.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#8BA888] hover:bg-[#577354] text-slate-950 hover:text-white text-xs font-black px-5 py-3 rounded-2xl transition-all shadow-md cursor-pointer self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Sesi Ujian Baru</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveSubTab("penilaian")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "penilaian" 
              ? "bg-white text-slate-900 shadow-3xs" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ✍️ Penilaian Cepat (Input Masal)
        </button>
        <button
          onClick={() => setActiveSubTab("monitoring")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === "monitoring" 
              ? "bg-white text-slate-900 shadow-3xs" 
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📢 Pemantau Ketuntasan Ujian
        </button>
      </div>

      {activeSubTab === "penilaian" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4 h-fit">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#8BA888]" /> Saring Kelas & Mapel
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Rombel / Kelas</label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Mata Pelajaran</label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    {mapel.map(m => (
                      <option key={m.id} value={m.id}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-500" /> Pilih Sesi Ujian Praktek
              </h3>

              {sessionsOfSelection.length === 0 ? (
                <div className="bg-amber-50/50 p-4 rounded-2xl text-center border border-amber-100 space-y-2">
                  <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="text-[10px] font-extrabold text-amber-800 uppercase leading-relaxed">Belum Ada Sesi Ujian</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-[9px] font-black uppercase text-amber-700 underline hover:text-slate-900"
                  >
                    + Buat Sesi Baru Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sessionsOfSelection.map(session => (
                    <button
                      key={session.id}
                      onClick={() => handleExamSessionChange(session.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition-all flex items-center justify-between ${
                        selectedExamId === session.id
                          ? "bg-slate-900 text-white border-transparent shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-204"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold block truncate">{session.namaUjian}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[9px] font-mono">
                          <span className="text-slate-400">{session.tanggal}</span>
                          <span className="text-emerald-500 font-sans">• Oleh: {
                            session.teacherCode === "MASTER-ADMIN" ? "Admin Utama" :
                            (guruCodes?.find(g => g.code === session.teacherCode)?.namaGuru?.split(',')[0] || session.teacherCode || "Pendidik")
                          }</span>
                        </div>
                      </div>
                      <span className="text-[9px] bg-slate-700 text-white font-mono font-black ml-1.5 px-2 py-0.5 rounded">
                        {session.items.filter(i => i.sudahMengikuti).length}/{filteredStudents.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Helper */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-[10px] text-slate-500 space-y-1">
              <span className="font-extrabold text-slate-750 block">💡 Tips Pengisian Cepat:</span>
              <p>1. Menulis nilai pada kotak input akan **otomatis mencentang** status keikutsertaan murid.</p>
              <p>2. Kosongkan nilai atau hilangkan centang jika murid tidak hadir atau berhalangan.</p>
            </div>
          </div>

          {/* Core Score Input Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Session Stats card */}
            {gradingStats && selectedExamId && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Murid</span>
                  <p className="text-xl font-bold font-mono text-slate-800 mt-1">{gradingStats.total} Siswa</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Sudah Mengikuti</span>
                  <p className="text-xl font-bold font-mono text-emerald-800 mt-1">
                    {gradingStats.sudah} <span className="text-[10px] text-emerald-650">({gradingStats.persenSudah}%)</span>
                  </p>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-rose-500 uppercase">Belum Mengikuti</span>
                  <p className="text-xl font-bold font-mono text-rose-900 mt-1">
                    {gradingStats.belum} <span className="text-[10px] text-rose-650">({gradingStats.persenBelum}%)</span>
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Nilai Rata-Rata</span>
                  <p className="text-xl font-bold font-mono text-amber-900 mt-1">{gradingStats.rataRata} / 100</p>
                </div>
              </div>
            )}

            {/* Students List for scoring */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Form Rincian Nilai Siswa
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 font-mono">
                    {selectedExamId 
                      ? ujianPraktek.find(u => u.id === selectedExamId)?.namaUjian 
                      : "Pilih / Buat Sesi Ujian Praktek Terlebih Dahulu"}
                  </p>
                </div>
                
                {/* Search box */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Saring nama murid..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#8BA888] w-48 text-slate-700"
                  />
                </div>
              </div>

              {!selectedExamId ? (
                <div className="p-16 text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-500">Silakan pilih atau buat ujian praktek di panel kiri</p>
                  <p className="text-[10px] text-slate-400 max-w-md mx-auto">Nilai praktek dapat diisikan dengan cepat serentak setelah memilih rombel kelas dan mata pelajaran yang aktif bersangkutan.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-0.5">
                  {filteredStudents.filter(u => u.namaSiswa.toLowerCase().includes(studentSearch.toLowerCase())).length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <p className="text-xs font-medium">Tidak ada murid yang sesuai filter pencarian.</p>
                    </div>
                  ) : (
                    filteredStudents
                      .filter(u => u.namaSiswa.toLowerCase().includes(studentSearch.toLowerCase()))
                      .map((stu, index) => {
                        const scoreData = bulkGrades[stu.id] || { score: "", participated: false };
                        const hasScore = scoreData.score !== "";

                        return (
                          <div key={stu.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                                {index + 1}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-800 text-sm block tracking-tight">
                                  {stu.namaSiswa}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono font-semibold block uppercase">
                                  NIS: {stu.nis} &bull; Rombel: {kelas.find(k => k.id === stu.kelasId)?.namaKelas}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 self-end sm:self-auto">
                              {/* Participant Status */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">Ikut Ujian:</label>
                                <input
                                  type="checkbox"
                                  checked={scoreData.participated}
                                  onChange={(e) => {
                                    setBulkGrades(prev => ({
                                      ...prev,
                                      [stu.id]: {
                                        ...prev[stu.id],
                                        participated: e.target.checked,
                                        // Set score to 100 on check, clear if checking off
                                        score: e.target.checked ? (prev[stu.id]?.score || "100") : ""
                                      }
                                    }));
                                  }}
                                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                              </div>

                              {/* Score Input Box */}
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">Nilai (0-100):</label>
                                <input
                                  type="number"
                                  placeholder="Contoh: 90"
                                  min={0}
                                  max={100}
                                  disabled={!scoreData.participated}
                                  value={scoreData.score}
                                  onChange={(e) => {
                                    const valueStr = e.target.value;
                                    setBulkGrades(prev => ({
                                      ...prev,
                                      [stu.id]: {
                                        ...prev[stu.id],
                                        score: valueStr,
                                        participated: true // Autocheck if typing a score
                                      }
                                    }));
                                  }}
                                  className={`w-18 px-2 py-1.5 border rounded-lg text-center font-bold font-mono text-xs ${
                                    !scoreData.participated 
                                      ? "bg-slate-100 border-slate-200 text-slate-400" 
                                      : scoreData.score !== "" 
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 focus:outline-emerald-500" 
                                        : "bg-white border-slate-300 focus:outline-[#8BA888]"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* Instant Submit Button */}
              {selectedExamId && (
                <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={handleSaveBulkScores}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Seluruh Nilai Masal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* MONITORING Ketuntasan Ujian */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" /> Daftar Pelacakan Belum Ujian & Tugas
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-0.5 rounded-lg font-mono">
                Real-Time Tracking
              </span>
            </div>

            {monitoringData.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <p className="text-xs">Ujian praktek belum tercatat di data sekolah.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {monitoringData.map(stat => (
                  <div key={stat.id} className="border border-slate-200 rounded-3xl p-5 space-y-4 bg-slate-50/30">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">Rombel: {stat.kelas} &bull; {stat.pelajaran}</span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 tracking-tight">{stat.namaUjian}</h4>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-600 font-bold text-center">
                        📅 {stat.tanggal}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white border border-slate-200 p-2 rounded-xl">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Siswa Ikut</span>
                        <span className="text-sm font-black font-mono text-emerald-600 block mt-0.5">{stat.sudah} Siswa</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-2 rounded-xl">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Siswa Belum</span>
                        <span className="text-sm font-black font-mono text-rose-600 block mt-0.5">{stat.belum} Siswa</span>
                      </div>
                      <div className="bg-white border border-slate-200 p-2 rounded-xl">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Kontribusi Kelas</span>
                        <span className="text-sm font-black font-mono text-blue-600 block mt-0.5">
                          {stat.totalStudents > 0 ? Math.round((stat.sudah / stat.totalStudents) * 100) : 0}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide block">Daftar Siswa Belum Mengikuti Ujian:</span>
                      
                      {stat.belumList.length === 0 ? (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-xl flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                          <CheckCircle className="w-4 h-4 text-emerald-605" /> Semua Murid Telah Tuntas Mengikuti Ujian Praktek ini!
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                          {stat.belumList.map(b => (
                            <span key={b.id} className="text-[9.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-lg block">
                              🔴 {b.namaSiswa} (NIS: {b.nis})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE EXAM SESSION MODAL POPUP */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-5 h-5 text-yellow-500" /> Buat Sesi Ujian Praktek Baru
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-440 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Nama / Jenis Ujian Praktek *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Praktek Membaca Al-Qur'an / Hiwar Mandiri Kelas"
                  value={namaUjianBaru}
                  onChange={(e) => setNamaUjianBaru(e.target.value)}
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-[#8BA888]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Kelas Rombel</label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-705"
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mata Pelajaran Diuji</label>
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-705"
                  >
                    {mapel.map(m => (
                      <option key={m.id} value={m.id}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tanggal Ujian dilaksanakan</label>
                <input
                  type="date"
                  value={tanggalUjian}
                  onChange={(e) => setTanggalUjian(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2.5">
                <input
                  type="checkbox"
                  id="umumkanWaliUjianCheck"
                  checked={umumkanWaliUjian}
                  onChange={(e) => setUmumkanWaliUjian(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-200 rounded cursor-pointer accent-[#8BA888]"
                />
                <label htmlFor="umumkanWaliUjianCheck" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                  Hubungkan ke Rapor Wali Murid jika Ananda belum ikut ujian
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-extrabold rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8BA888] hover:bg-[#577354] text-slate-950 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Buat Lembar Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
