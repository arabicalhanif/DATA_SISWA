import React, { useMemo, useState } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CheckSquare, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Search,
  Phone,
  MapPin,
  MessageSquare,
  PlusCircle,
  CheckCircle2,
  Circle,
  UserCheck,
  Send,
  ExternalLink
} from "lucide-react";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, UjianPraktek, Tugas, PengumpulanTugas, GuruCode, TeacherAgenda } from "../types";

interface DashboardProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  onNavigate: (tab: string) => void;
  userRole?: string | null;
  ujianPraktek?: UjianPraktek[];
  tugas?: Tugas[];
  pengumpulanTugas?: PengumpulanTugas[];
  showWelcomeBanners?: boolean;
  activeGuruProfile?: GuruCode;
  guruCodes?: GuruCode[];
  agendas?: TeacherAgenda[];
  setAgendas?: React.Dispatch<React.SetStateAction<TeacherAgenda[]>>;
}

export default function Dashboard({ 
  kelas, 
  mapel, 
  siswa, 
  kategori, 
  penilaian,
  onNavigate,
  userRole,
  ujianPraktek = [],
  tugas = [],
  pengumpulanTugas = [],
  showWelcomeBanners = true,
  activeGuruProfile,
  guruCodes = [],
  agendas = [],
  setAgendas
}: DashboardProps) {
  
  // TEACHER WORKSPACE STATES
  const [dashboardSubTab, setDashboardSubTab] = useState<"overview" | "agenda" | "siswa" | "rekan">("overview");
  const [studentSearch, setStudentSearch] = useState("");
  const [colleagueSearch, setColleagueSearch] = useState("");
  
  // Add Agenda Form State
  const [agendaJudul, setAgendaJudul] = useState("");
  const [agendaDeskripsi, setAgendaDeskripsi] = useState("");
  const [agendaPertemuanKe, setAgendaPertemuanKe] = useState("");
  const [agendaDeadline, setAgendaDeadline] = useState("");
  const [agendaKelasId, setAgendaKelasId] = useState("");
  const [agendaTanggal, setAgendaTanggal] = useState(new Date().toISOString().split("T")[0]);

  // Handle Adding new Agenda
  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setAgendas || !activeGuruProfile) return;
    if (!agendaJudul.trim()) return;

    const newAgenda: TeacherAgenda = {
      id: `AGD-${Date.now()}`,
      tanggal: agendaTanggal,
      judul: agendaJudul.trim(),
      deskripsi: agendaDeskripsi.trim() || undefined,
      pertemuanKe: agendaPertemuanKe.trim() || undefined,
      deadlinePertemuanLain: agendaDeadline.trim() || undefined,
      kelasId: agendaKelasId || undefined,
      isCompleted: false,
      teacherCode: activeGuruProfile.code,
      createdAt: new Date().toISOString()
    };

    setAgendas(prev => [newAgenda, ...prev]);
    
    // Clear Form
    setAgendaJudul("");
    setAgendaDeskripsi("");
    setAgendaPertemuanKe("");
    setAgendaDeadline("");
    setAgendaKelasId("");
  };

  // Toggle Agenda item complete status
  const handleToggleAgenda = (id: string) => {
    if (!setAgendas) return;
    setAgendas(prev => prev.map(a => a.id === id ? { ...a, isCompleted: !a.isCompleted } : a));
  };

  // Delete Agenda item
  const handleDeleteAgenda = (id: string) => {
    if (!setAgendas) return;
    if (!confirm("Hapus agenda pengingat ini?")) return;
    setAgendas(prev => prev.filter(a => a.id !== id));
  };

  // Filter students we can actually teach or display
  const targetTeacherCode = activeGuruProfile?.code;
  const taughtClassIds = useMemo(() => {
    if (!activeGuruProfile) return [];
    return activeGuruProfile.assignedKelasIds || (activeGuruProfile.assignedKelasId ? [activeGuruProfile.assignedKelasId] : []);
  }, [activeGuruProfile]);

  const studentsTaughtByTeacher = useMemo(() => {
    if (userRole === "guru" && activeGuruProfile) {
      return siswa.filter(s => taughtClassIds.includes(s.kelasId));
    }
    return siswa;
  }, [siswa, userRole, activeGuruProfile, taughtClassIds]);

  const studentTaughtIds = useMemo(() => {
    return new Set(studentsTaughtByTeacher.map(s => s.id));
  }, [studentsTaughtByTeacher]);

  const classesToDisplay = useMemo(() => {
    if (userRole === "guru" && activeGuruProfile) {
      return kelas.filter(k => taughtClassIds.includes(k.id));
    }
    return kelas;
  }, [kelas, userRole, activeGuruProfile, taughtClassIds]);

  // STATS CALCULATIONS
  const totalKelas = classesToDisplay.length;
  const totalMapel = mapel.length;
  const totalSiswa = studentsTaughtByTeacher.length;
  const totalTugas = kategori.length;

  // Calculate Average Student Score across all assessments
  const { averageScore, passCount, remedialCount, allScoresCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    let passed = 0;
    let remedial = 0;

    penilaian.forEach(p => {
      p.grades.forEach(g => {
        if (studentTaughtIds.has(g.siswaId)) {
          total += g.nilai;
          count++;
          if (g.nilai >= 75) { // KKM is 75
            passed++;
          } else {
            remedial++;
          }
        }
      });
    });

    return {
      averageScore: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
      passCount: passed,
      remedialCount: remedial,
      allScoresCount: count
    };
  }, [penilaian, studentTaughtIds]);

  // Graph 1: Average Score per Class
  const classAveragesData = useMemo(() => {
    return classesToDisplay.map(k => {
      // Find students in this class
      const studentsInClass = siswa.filter(s => s.kelasId === k.id);
      const studentIds = new Set(studentsInClass.map(s => s.id));
      
      let classTotal = 0;
      let classCount = 0;

      penilaian.forEach(p => {
        p.grades.forEach(g => {
          if (studentIds.has(g.siswaId) && studentTaughtIds.has(g.siswaId)) {
            classTotal += g.nilai;
            classCount++;
          }
        });
      });

      const avg = classCount > 0 ? Math.round((classTotal / classCount) * 10) / 10 : 0;
      return {
        name: k.namaKelas,
        Average: avg,
        "Jumlah Siswa": studentsInClass.length
      };
    });
  }, [classesToDisplay, siswa, penilaian, studentTaughtIds]);

  // Graph 2: Performance by Subject (Mapel)
  const subjectPerformanceData = useMemo(() => {
    return mapel.map(m => {
      // Find all categories with this mapelId
      const categoriesForSubject = kategori.filter(kat => kat.mapelId === m.id);
      const catIds = new Set(categoriesForSubject.map(kat => kat.id));

      let subTotal = 0;
      let subCount = 0;

      penilaian.forEach(p => {
        if (catIds.has(p.kategoriId)) {
          p.grades.forEach(g => {
            if (studentTaughtIds.has(g.siswaId)) {
              subTotal += g.nilai;
              subCount++;
            }
          });
        }
      });

      const avg = subCount > 0 ? Math.round((subTotal / subCount) * 10) / 10 : 0;
      return {
        subject: m.namaMapel,
        RataRata: avg,
        "Total Penilaian": subCount
      };
    }).filter(item => item["Total Penilaian"] > 0 || mapel.length <= 5); // list first 5 if no data
  }, [mapel, kategori, penilaian, studentTaughtIds]);

  // Graph 3: Score distribution ranges
  const scoreDistributionData = useMemo(() => {
    let ranges = {
      "90 - 100 (Istimewa)": 0,
      "80 - 89 (Baik)": 0,
      "75 - 79 (Cukup KKM)": 0,
      "< 75 (Perlu Remedial)": 0
    };

    penilaian.forEach(p => {
      p.grades.forEach(g => {
        if (studentTaughtIds.has(g.siswaId)) {
          if (g.nilai >= 90) ranges["90 - 100 (Istimewa)"]++;
          else if (g.nilai >= 80) ranges["80 - 89 (Baik)"]++;
          else if (g.nilai >= 75) ranges["75 - 79 (Cukup KKM)"]++;
          else ranges["< 75 (Perlu Remedial)"]++;
        }
      });
    });

    return Object.entries(ranges).map(([range, count]) => ({
      name: range,
      value: count
    })).filter(r => r.value > 0 || allScoresCount === 0);
  }, [penilaian, allScoresCount, studentTaughtIds]);

  // Top Student Stars
  const topStudents = useMemo(() => {
    const studentStats = studentsTaughtByTeacher.map(s => {
      let total = 0;
      let count = 0;

      penilaian.forEach(p => {
        p.grades.forEach(g => {
          if (g.siswaId === s.id) {
            total += g.nilai;
            count++;
          }
        });
      });

      const avg = count > 0 ? Math.round((total / count) * 10) / 10 : null;
      const associatedClass = kelas.find(k => k.id === s.kelasId)?.namaKelas || "-";
      return {
        ...s,
        namaKelas: associatedClass,
        avg,
        count
      };
    })
    .filter(s => s.avg !== null)
    .sort((a, b) => (b.avg || 0) - (a.avg || 0))
    .slice(0, 5);

    return studentStats;
  }, [studentsTaughtByTeacher, penilaian, kelas]);

  // Find all kids who haven't submitted their Homework
  const pendingHomeworkList = useMemo(() => {
    const list: Array<{ studentName: string; className: string; taskTitle: string; dueDate: string }> = [];
    if (!tugas || !pengumpulanTugas) return list;

    // Direct filter tasks assigned to classes taught by the teacher (if teacher)
    const filteredTasks = userRole === "guru" && activeGuruProfile
      ? tugas.filter(t => taughtClassIds.includes(t.kelasId) || t.kelasId === "semua")
      : tugas;

    filteredTasks.forEach(t => {
      // Find students in this class or "semua"
      const targetClass = kelas.find(k => k.id === t.kelasId);
      const studentsInClass = studentsTaughtByTeacher.filter(s => s.kelasId === t.kelasId || t.kelasId === "semua");
      
      studentsInClass.forEach(s => {
        // Check if student has a submission for this task
        const submission = pengumpulanTugas.find(pt => pt.tugasId === t.id && pt.siswaId === s.id);
        if (!submission || submission.statusVerifikasi !== "Disetujui") {
          list.push({
            studentName: s.namaSiswa,
            className: targetClass?.namaKelas || "Rombel Lain",
            taskTitle: t.judul,
            dueDate: t.dueDate
          });
        }
      });
    });
    return list;
  }, [tugas, pengumpulanTugas, studentsTaughtByTeacher, kelas, userRole, activeGuruProfile, taughtClassIds]);

  // Find all kids who haven't attended Ujian Praktek
  const pendingUjianList = useMemo(() => {
    const list: Array<{ studentName: string; className: string; examName: string; date: string }> = [];
    if (!ujianPraktek) return list;

    const filteredExams = userRole === "guru" && activeGuruProfile
      ? ujianPraktek.filter(up => taughtClassIds.includes(up.kelasId))
      : ujianPraktek;

    filteredExams.forEach(up => {
      const targetClass = kelas.find(k => k.id === up.kelasId);
      const studentsInClass = studentsTaughtByTeacher.filter(s => s.kelasId === up.kelasId);

      studentsInClass.forEach(s => {
        const item = up.items.find(i => i.siswaId === s.id);
        if (!item || !item.sudahMengikuti) {
          list.push({
            studentName: s.namaSiswa,
            className: targetClass?.namaKelas || "Rombel Lain",
            examName: up.namaUjian,
            date: up.tanggal
          });
        }
      });
    });
    return list;
  }, [ujianPraktek, studentsTaughtByTeacher, kelas, userRole, activeGuruProfile, taughtClassIds]);

  const COLORS = ["#8BA888", "#D6E0D2", "#D2E0E0", "#EAE8D2"];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#577354] bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
            {userRole === "guru" ? "Portal Utama Guru" : "Dashboard Utama"}
          </span>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-800 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Penilaian Siswa Digital</span>
            {userRole === "guru" && activeGuruProfile && (
              <span className="text-lg md:text-xl font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-2xl border border-emerald-150 shadow-3xs">
                &bull; {activeGuruProfile.namaGuru}
              </span>
            )}
          </h1>
          {userRole === "guru" && activeGuruProfile ? (
            <p className="text-sm text-slate-500 mt-1">
              Selamat bertugas mendoakan dan mendidik, <strong className="text-emerald-800 font-bold">{activeGuruProfile.namaGuru}</strong> &bull; Kode: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-700 font-black uppercase">{activeGuruProfile.code}</code> &bull; Kelas Diajar: <span className="font-semibold text-slate-700">{kelas.filter(k => (activeGuruProfile.assignedKelasIds || (activeGuruProfile.assignedKelasId ? [activeGuruProfile.assignedKelasId] : [])).includes(k.id)).map(k => k.namaKelas).join(", ") || "Semua Kelas"}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              Pantau dan analisis perkembangan akademik siswa Anda secara komprehensif.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white shadow-xs border border-slate-200/80 rounded-lg px-3.5 py-2 w-fit">
          <Clock className="w-4 h-4 text-[#8BA888]" />
          <span>Waktu Sistem: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* 🌟 Welcome Banner for Teachers */}
      {showWelcomeBanners && (
        <div className="bg-gradient-to-r from-emerald-800 to-[#2D3A3A] p-6 rounded-3xl text-white relative overflow-hidden shadow-sm shadow-emerald-900/5">
          <div className="absolute right-[-10%] top-[-50%] w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100/10 border border-emerald-500/30 text-emerald-100 px-2.5 py-1 rounded-lg">
                Sambut Hangat Ustadz & Ustadzah
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">
              Selamat Datang, {activeGuruProfile ? activeGuruProfile.namaGuru : "Ustadz/Ustadzah Pendidik"}! 👋
            </h2>
            <p className="text-xs text-slate-200/90 leading-relaxed max-w-2xl font-medium">
              Alhamdulillah, selamat beraktivitas kembali untuk mendidik para tunas bangsa. Portal ini membantu mempermudah penginputan rapor harian, penilaian ujian praktek, monitoring tugas mandiri, serta pencatatan presensi siswa secara modern dan terintegrasi.
            </p>
          </div>
        </div>
      )}

      {/* 🧭 Horizontal Nav-rail for Teacher Workspace & Admin View */}
      {((userRole === "guru" && activeGuruProfile) || (userRole === "admin")) && (
        <div className="flex flex-wrap gap-2 bg-slate-100/85 p-1.5 rounded-2xl w-fit border border-slate-200 shadow-3xs">
          <button
            type="button"
            onClick={() => setDashboardSubTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              dashboardSubTab === "overview" ? "bg-[#2D3A3A] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${dashboardSubTab === "overview" ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} /> 
            Rangkuman Kinerja
          </button>
          
          <button
            type="button"
            onClick={() => setDashboardSubTab("agenda")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              dashboardSubTab === "agenda" ? "bg-[#2D3A3A] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CheckSquare className={`w-4 h-4 ${dashboardSubTab === "agenda" ? "text-emerald-400" : "text-slate-400"}`} /> 
            Agenda Hari Ini
          </button>
          
          <button
            type="button"
            onClick={() => setDashboardSubTab("siswa")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              dashboardSubTab === "siswa" ? "bg-[#2D3A3A] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className={`w-4 h-4 ${dashboardSubTab === "siswa" ? "text-emerald-400" : "text-slate-400"}`} /> 
            Kontak Siswa & Wali
          </button>
          
          <button
            type="button"
            onClick={() => setDashboardSubTab("rekan")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              dashboardSubTab === "rekan" ? "bg-[#2D3A3A] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck className={`w-4 h-4 ${dashboardSubTab === "rekan" ? "text-emerald-400" : "text-slate-400"}`} /> 
            Rekan Guru
          </button>
        </div>
      )}

      {dashboardSubTab === "overview" && (
        <>
          {/* Grid Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        {userRole === "guru" ? (
          <div 
            className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-400 select-none relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-slate-200/50 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
              Hanya Baca
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kelas</p>
                <h3 className="text-2xl font-bold font-display text-slate-655 mt-1">
                  {totalKelas} <span className="text-xs font-normal text-slate-400">rombel</span>
                </h3>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-400 rounded-lg">
                <GraduationCap className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
              <span>Rombongan belajar aktif di sekolah</span>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onNavigate("kelas")} 
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Kelas</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
                  {totalKelas} <span className="text-xs font-normal text-slate-400">rombel</span>
                </h3>
              </div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
              <span>Kelola rombongan belajar sekolah</span>
            </div>
          </div>
        )}

        {/* Card 2 */}
        {userRole === "guru" ? (
          <div 
            className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-slate-400 select-none relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-slate-200/50 text-slate-500 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
              Hanya Baca
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Siswa</p>
                <h3 className="text-2xl font-bold font-display text-slate-655 mt-1">
                  {totalSiswa} <span className="text-xs font-normal text-slate-400">orang</span>
                </h3>
              </div>
              <div className="p-2.5 bg-slate-100 text-slate-400 rounded-lg">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
              <span>Jumlah seluruh siswa terdaftar</span>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onNavigate("siswa")} 
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300 cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Siswa</p>
                <h3 className="text-2xl font-bold font-display text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
                  {totalSiswa} <span className="text-xs font-normal text-slate-400">orang</span>
                </h3>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
              <span>Daftar siswa aktif terdaftar</span>
            </div>
          </div>
        )}

        {/* Card 3 */}
        <div 
          onClick={() => onNavigate("mapel")} 
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mata Pelajaran</p>
              <h3 className="text-2xl font-bold font-display text-slate-800 mt-1 group-hover:text-emerald-600 transition-colors">
                {totalMapel} <span className="text-xs font-normal text-slate-400">bidang</span>
              </h3>
            </div>
            <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-lg group-hover:bg-yellow-100 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
            <span>Mata pelajaran kurikulum aktif</span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => onNavigate("penilaian")} 
          className="bg-white p-5 rounded-xl border border-emerald-100 bg-emerald-50/20 hover:shadow-md transition-all duration-300 cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Rata-Rata Nilai</p>
              <h3 className="text-2xl font-bold font-display text-emerald-800 mt-1">
                {averageScore} <span className="text-xs font-normal text-emerald-600">/ 100</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500 text-white rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
              <Award className="w-3.5 h-3.5" />
              {passCount} Lulus KKM
            </span>
            <span className="flex items-center gap-0.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {remedialCount} Remedial
            </span>
          </div>
        </div>
      </div>

      {/* 🔴 Pemberitahuan Alarm & Ketuntasan Siswa (Real-time) */}
      <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Moni & Filter Aktivitas Belum Tuntas Siswa
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                Pemberitahuan Otomatis Siswa Belum Ujian atau Mengumpulkan Tugas harian
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg w-fit">
            Belum Selesai: {pendingHomeworkList.length + pendingUjianList.length} Kasus
          </span>
        </div>

        {pendingHomeworkList.length === 0 && pendingUjianList.length === 0 ? (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <span>✨ Alhamdulillah! Seluruh murid telah menuntaskan semua Lembar Tugas (PR) dan Ujian Praktek yang diselenggarakan saat ini.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Column 1: Homework Task Defaulters */}
            <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/40">
              <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wider border-b border-slate-200 pb-1.5">
                📝 Siswa Belum Mengumpulkan Tugas (PR):
              </span>
              {pendingHomeworkList.length === 0 ? (
                <p className="text-slate-400 font-medium italic">Tidak ada tunggakan tugas.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingHomeworkList.slice(0, 8).map((ph, idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-850 block text-xs">{ph.studentName}</span>
                        <span className="text-[9px] text-slate-400 block truncate font-mono mt-0.5">Tugas: {ph.taskTitle}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded shrink-0">
                        Rombel {ph.className}
                      </span>
                    </div>
                  ))}
                  {pendingHomeworkList.length > 8 && (
                    <p className="text-[10px] text-slate-400 font-bold text-center mt-1">
                      Dan {pendingHomeworkList.length - 8} siswa tugas lainnya...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Column 2: Practical Exam Defaulters */}
            <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/40">
              <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wider border-b border-slate-200 pb-1.5">
                🏆 Siswa Belum Mengikuti Ujian Praktek:
              </span>
              {pendingUjianList.length === 0 ? (
                <p className="text-slate-400 font-medium italic">Seluruh siswa sudah mengikuti ujian praktek.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pendingUjianList.slice(0, 8).map((pu, idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 p-2.5 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-850 block text-xs">{pu.studentName}</span>
                        <span className="text-[9px] text-slate-400 block truncate font-mono mt-0.5">Ujian: {pu.examName}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-105 px-1.5 py-0.5 rounded shrink-0">
                        Rombel {pu.className}
                      </span>
                    </div>
                  ))}
                  {pendingUjianList.length > 8 && (
                    <p className="text-[10px] text-slate-400 font-bold text-center mt-1">
                      Dan {pendingUjianList.length - 8} siswa ujian lainnya...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Excel Quick Option Hero Action call */}
      <div className="bg-[#2D3A3A] p-6 rounded-2xl text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-[#8BA888] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
            BARU: INTEGRASI EXCEL
          </span>
          <h2 className="text-xl font-bold font-display mt-2.5">Input & Atur Semua Data Sekaligus Menggunakan Excel</h2>
          <p className="text-white/70 text-xs mt-1.5 leading-relaxed">
            Tidak perlu menginput kelas, siswa, mata pelajaran, dan nilai harian satu per satu. Cukup unduh template Excel kami, isi seluruh data di excel laptop Anda, lalu unggah kembali untuk sinkronisasi otomatis instan!
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => onNavigate("excel")}
            className="w-full sm:w-auto bg-[#8BA888] hover:bg-[#718F6E] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#8BA888]/20"
          >
            Buka Alat Impor Excel &rarr;
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Graphs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart 1: Rata Rata Kelas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-slate-800">
                  Rata-Rata Nilai & Jumlah Siswa per Kelas
                </h3>
                <p className="text-xs text-slate-400">Perbandingan antarsatuan kelas aktif</p>
              </div>
            </div>
            <div className="h-64 sm:h-80 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classAveragesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={12} stroke="#64748b" tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={12} stroke="#64748b" tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: "#2D3A3A", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} 
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend iconSize={10} verticalAlign="top" height={36} />
                  <Bar dataKey="Average" name="Rata-Rata Nilai" fill="#8BA888" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="Jumlah Siswa" name="Jumlah Siswa" fill="#D6E0D2" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Mapel Performance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h3 className="text-lg font-display font-bold text-slate-800">
                Peringkat Rata-Rata Nilai per Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-400">Mata pelajaran dengan nilai paling kompetitif</p>
            </div>
            <div className="h-64 sm:h-80 w-full overflow-hidden">
              {subjectPerformanceData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p>Belum ada data nilai masuk. Silakan isi Penilaian.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={subjectPerformanceData}
                    margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="subject" fontSize={12} stroke="#64748b" tickLine={false} />
                    <YAxis domain={[0, 100]} fontSize={12} stroke="#64748b" tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "#2D3A3A", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} 
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line 
                      type="monotone" 
                      dataKey="RataRata" 
                      name="Rata-Rata Nilai" 
                      stroke="#718F6E" 
                      strokeWidth={3} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Charts & Rankings */}
        <div className="space-y-6">
          {/* Chart 3: Pie Chart Sebaran Nilai */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="mb-4">
              <h3 className="text-base font-display font-bold text-slate-800">
                Sebaran Kategori Nilai Siswa
              </h3>
              <p className="text-xs text-slate-400">Peta kompetensi berdasarkan standar KKM (75)</p>
            </div>
            
            <div className="h-48 w-full flex items-center justify-center">
              {allScoresCount === 0 ? (
                <p className="text-xs text-slate-400">Tidak ada data sebaran nilai.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {scoreDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="mt-2 space-y-2">
              {scoreDistributionData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full block shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate max-w-[150px]">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 bg-slate-100 rounded-md px-1.5 py-0.5 font-mono">
                    {entry.value} skor
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Best Performing Students */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-display font-bold text-slate-800">
                  Siswa Berprestasi (Top 5)
                </h3>
                <p className="text-xs text-slate-400">Berdasarkan rata-rata seluruh tugas</p>
              </div>
              <Award className="w-5 h-5 text-amber-500 bg-amber-50 rounded p-0.5" />
            </div>

            <div className="space-y-3.5">
              {topStudents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada peringkat siswa.</p>
              ) : (
                topStudents.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        idx === 0 ? "bg-amber-100 text-amber-800" :
                        idx === 1 ? "bg-slate-100 text-slate-800" :
                        idx === 2 ? "bg-orange-100 text-orange-800" :
                        "bg-teal-50 text-teal-800"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{item.namaSiswa}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.nis} • {item.namaKelas}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold font-mono px-2 py-0.5 rounded-md border border-emerald-200">
                        {item.avg}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.count} tugas</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  )}

  {/* 📅 Daily Teacher Agenda and To-Do Reminder workspace */}
  {dashboardSubTab === "agenda" && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Left Column: List Agendas */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-display font-bold text-slate-800">Agenda Hari Ini & Agenda Mendatang</h3>
              <p className="text-xs text-slate-400">Pengingat tugas & persiapan KBM pribadi Anda</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">
              ACTIVE: {activeGuruProfile ? activeGuruProfile.namaGuru : "Master Admin"}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {agendas.filter(a => activeGuruProfile ? a.teacherCode === activeGuruProfile.code : true).length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 italic">
                 Belum ada agenda terdaftar. Tambahkan agenda harian baru di sisi kanan untuk memulai pengingat.
              </div>
            ) : (
              agendas
                .filter(a => activeGuruProfile ? a.teacherCode === activeGuruProfile.code : true)
                .map(item => {
                  const associatedClass = kelas.find(k => k.id === item.kelasId)?.namaKelas || "Semua Rombel";
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        item.isCompleted 
                          ? "bg-slate-50/70 border-slate-200 text-slate-400" 
                          : "bg-white border-slate-200/90 hover:border-slate-350 shadow-3xs"
                      }`}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAgenda(item.id)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                          title={item.isCompleted ? "Tandai Belum Selesai" : "Tandai Selesai"}
                        >
                          {item.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                        <div className="min-w-0 space-y-1">
                          <h4 className={`text-xs font-bold leading-snug ${item.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {item.judul}
                          </h4>
                          {item.deskripsi && (
                            <p className={`text-[10px] leading-relaxed ${item.isCompleted ? "text-slate-400/80" : "text-slate-500"}`}>
                              {item.deskripsi}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-[9px] text-slate-450 font-sans">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">Tanggal: {item.tanggal}</span>
                            <span>&bull;</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Kelas: {associatedClass}</span>
                            {item.pertemuanKe && (
                              <>
                                <span>&bull;</span>
                                <span className="text-slate-600 font-bold bg-amber-50 text-amber-750 px-1.5 py-0.5 rounded">{item.pertemuanKe}</span>
                              </>
                            )}
                            {item.deadlinePertemuanLain && (
                              <>
                                <span>&bull;</span>
                                <span className="text-red-650 bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">🎯 Target: {item.deadlinePertemuanLain}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAgenda(item.id)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded cursor-pointer transition-colors shrink-0"
                        title="Hapus Agenda"
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

      {/* Right Column: Add Agenda Form */}
      {activeGuruProfile ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-4">
          <div>
            <h3 className="text-base font-display font-bold text-slate-800">Tambah Agenda Pengingat</h3>
            <p className="text-xs text-slate-400">Buat catatan pertemuan atau batas tugas baru</p>
          </div>

          <form onSubmit={handleAddAgenda} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550">Judul Agenda / Catatan *</label>
              <input
                type="text"
                required
                value={agendaJudul}
                onChange={(e) => setAgendaJudul(e.target.value)}
                placeholder="Contoh: Menyiapkan kuis nahwu..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550">Keterangan / Deskripsi</label>
              <textarea
                value={agendaDeskripsi}
                onChange={(e) => setAgendaDeskripsi(e.target.value)}
                placeholder="Detail tambahan agenda..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550">Tanggal Target</label>
                <input
                  type="date"
                  required
                  value={agendaTanggal}
                  onChange={(e) => setAgendaTanggal(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-555">Pilih Kelas/Rombel</label>
                <select
                  value={agendaKelasId}
                  onChange={(e) => setAgendaKelasId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888] bg-white cursor-pointer"
                >
                  <option value="">Semua Kelas</option>
                  {kelas.map(kl => (
                    <option key={kl.id} value={kl.id}>{kl.namaKelas}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550">Pertemuan Saat Ini</label>
                <input
                  type="text"
                  value={agendaPertemuanKe}
                  onChange={(e) => setAgendaPertemuanKe(e.target.value)}
                  placeholder="e.g. Pertemuan 10"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-550">Batas Tugas Pertemuan Berikit</label>
                <input
                  type="text"
                  value={agendaDeadline}
                  onChange={(e) => setAgendaDeadline(e.target.value)}
                  placeholder="e.g. Pertemuan 11 (Evaluasi)"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1 bg-[#2D3A3A] hover:bg-[#3d4f4f] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-sans shadow-xs mt-2"
            >
              <PlusCircle className="w-4 h-4 text-[#BCE6B9]" /> Simpan Pengingat
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-400 text-xs italic text-center h-fit">
          Hanya guru pengajar yang dapat membuat agenda pengingat baru di portal masing-masing.
        </div>
      )}
    </div>
  )}

  {/* 🎒 Student and Parent search and quick-dial lists */}
  {dashboardSubTab === "siswa" && (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-fadeIn space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-display font-bold text-slate-800">Kontak Siswa & Orang Tua / Wali Murid</h3>
          <p className="text-xs text-slate-500">Pencarian cepat profil wali murid dan nomor hubung aktif</p>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Cari nama siswa, nama wali, NIS..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888] focus:ring-1 focus:ring-emerald-100 placeholder-slate-400 font-sans"
          />
        </div>
      </div>

      <div className="space-y-6">
        {(() => {
          // Filter students first
          const filteredList = siswa.filter(s => {
            if (activeGuruProfile) {
              const assignedIds = activeGuruProfile.assignedKelasIds || (activeGuruProfile.assignedKelasId ? [activeGuruProfile.assignedKelasId] : []);
              if (!assignedIds.includes(s.kelasId)) return false;
            }
            const term = studentSearch.toLowerCase();
            return (
              s.namaSiswa.toLowerCase().includes(term) ||
              (s.namaWali || "").toLowerCase().includes(term) ||
              s.nis.includes(term) ||
              (s.alamatSiswa || "").toLowerCase().includes(term)
            );
          });

          if (filteredList.length === 0) {
            return (
              <div className="p-12 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Siswa tidak ditemukan untuk pencarian "{studentSearch}".
              </div>
            );
          }

          // Group by class
          const studentsByClass: { [kelasId: string]: typeof filteredList } = {};
          filteredList.forEach(s => {
            if (!studentsByClass[s.kelasId]) {
              studentsByClass[s.kelasId] = [];
            }
            studentsByClass[s.kelasId].push(s);
          });

          // Sort class grouped sections so they appear consistently
          return Object.entries(studentsByClass).map(([classId, classStudents]) => {
            const classObj = kelas.find(k => k.id === classId);
            const className = classObj ? classObj.namaKelas : "Kelas Lepas / Lainnya";
            return (
              <div key={classId} className="space-y-3 bg-slate-50/30 p-4 rounded-2xl border border-slate-150 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block animate-pulse"></span>
                    Kelas: <span className="text-emerald-700">{className}</span>
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    {classStudents.length} Rekor Kontak
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classStudents.map(s => {
                    const studentClass = className;
                    const cleanPhone = s.noHpWali ? s.noHpWali.replace(/\D/g, '') : '';
                    let waLink = "";
                    if (cleanPhone) {
                      const prefix = cleanPhone.startsWith('0') 
                        ? '62' + cleanPhone.substring(1) 
                        : cleanPhone.startsWith('62') 
                        ? cleanPhone 
                        : '62' + cleanPhone;
                      waLink = `https://wa.me/${prefix}`;
                    }

                    return (
                      <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-250 hover:shadow-sm transition-all space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md">
                              NIS {s.nis}
                            </span>
                            <h4 className="text-xs font-black text-slate-800 tracking-tight mt-1.5 truncate">{s.namaSiswa}</h4>
                            <p className="text-[9px] text-slate-405 font-bold mt-0.5">Rombel: <span className="text-indigo-650 bg-indigo-50 px-1.5 py-0.2 rounded-sm">{className}</span></p>
                          </div>
                          
                          {s.isAlumni ? (
                            <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                              Alumni
                            </span>
                          ) : (
                            s.jenisKelamin && (
                              <span className={`text-[8px] border px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                s.jenisKelamin === "L" 
                                  ? "bg-sky-50 text-sky-700 border-sky-150" 
                                  : "bg-pink-50 text-pink-700 border-pink-150"
                              }`}>
                                {s.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                              </span>
                            )
                          )}
                        </div>

                        <div className="space-y-1.5 text-[10px] border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-2 text-slate-650">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Orang Tua/Wali: <strong className="text-slate-800">{s.namaWali || "Belum diisi"}</strong></span>
                          </div>

                          <div className="flex items-start gap-2 text-slate-650">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">Alamat: <strong className="text-slate-800 font-normal">{s.alamatSiswa || "Belum diisi"}</strong></span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-650">
                            <Phone className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                            <span>No. WhatsApp: <strong className="font-mono text-slate-800">+{s.noHpWali || "-"}</strong></span>
                          </div>
                        </div>

                        {s.noHpWali && (
                          <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-2 border-t border-slate-100/50">
                            <a
                              href={`tel:${s.noHpWali}`}
                              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-250 text-slate-705 py-2 rounded-xl font-bold border border-slate-200 transition-colors cursor-pointer font-sans"
                            >
                              <Phone className="w-3 h-3 text-[#8BA888]" /> Telepon
                            </a>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer referrer"
                              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black uppercase tracking-wider transition-colors cursor-pointer font-sans"
                            >
                              <MessageSquare className="w-3 h-3 text-white" /> WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  )}

  {/* 🤝 Colleague network directory listings */}
  {dashboardSubTab === "rekan" && (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-fadeIn space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-display font-bold text-slate-800">Direktori Rekan Sejawat Pendidik (MGMP)</h3>
          <p className="text-xs text-slate-500">Daftar nomor kontak resmi pengajar dan mata pelajaran yang diampu</p>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={colleagueSearch}
            onChange={(e) => setColleagueSearch(e.target.value)}
            placeholder="Cari nama guru, pelajaran..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#8BA888] focus:ring-1 focus:ring-emerald-100 placeholder-slate-400 font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guruCodes
          .filter(g => {
            const term = colleagueSearch.toLowerCase();
            return (
              g.namaGuru.toLowerCase().includes(term) ||
              (g.mapelAjar || "").toLowerCase().includes(term) ||
              g.code.toLowerCase().includes(term)
            );
          })
          .length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-slate-400 italic">
              Rekan sejawat tidak ditemukan untuk pencarian "{colleagueSearch}".
            </div>
          ) : (
            guruCodes
              .filter(g => {
                const term = colleagueSearch.toLowerCase();
                return (
                  g.namaGuru.toLowerCase().includes(term) ||
                  (g.mapelAjar || "").toLowerCase().includes(term) ||
                  g.code.toLowerCase().includes(term)
                );
              })
              .map(g => {
                const cleanPhone = g.phoneNumber ? g.phoneNumber.replace(/\D/g, '') : '';
                let waLink = "";
                if (cleanPhone) {
                  const prefix = cleanPhone.startsWith('0') 
                    ? '62' + cleanPhone.substring(1) 
                    : cleanPhone.startsWith('62') 
                    ? cleanPhone 
                    : '62' + cleanPhone;
                  waLink = `https://wa.me/${prefix}`;
                }

                // Check highlight for active/inactive profile
                const isSelf = targetTeacherCode === g.code;

                return (
                  <div 
                    key={g.code} 
                    className={`p-4 rounded-xl border transition-all space-y-4 hover:shadow-2xs ${
                      isSelf 
                        ? "border-emerald-250 bg-emerald-50/15" 
                        : "border-slate-200/95 bg-slate-50/20 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-[#718F6E] px-1.5 py-0.5 rounded-md uppercase">
                          {isSelf || userRole === "admin" ? g.code : "AKTIF"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <h4 className="text-xs font-black text-slate-800 tracking-tight truncate">{g.namaGuru}</h4>
                          {isSelf && (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 w-fit">
                              Saya
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-450 font-bold mt-0.5 font-sans">Pelajaran: <span className="text-emerald-700 bg-emerald-50/60 px-1.5 py-0.2 rounded">{g.mapelAjar || "Hiwar & Tahfidz"}</span></p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[10px] border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-[#577354]">
                        <Phone className="w-3.5 h-3.5 text-[#8BA888]" />
                        <span>No. WhatsApp: <strong className="font-mono text-slate-800">+{g.phoneNumber || "0812XXXXXXXX"}</strong></span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Status: <strong className={g.isActive ? "text-emerald-500 font-extrabold" : "text-amber-600"}>{g.isActive ? "Aktif" : "Non-aktif"}</strong></span>
                      </div>
                    </div>

                    {g.phoneNumber && (
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-2 border-t border-slate-100/50">
                        <a
                          href={`tel:${g.phoneNumber}`}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-bold border border-slate-200 transition-colors cursor-pointer font-sans"
                        >
                          <Phone className="w-3 h-3 text-[#8BA888]" /> Telepon
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer referrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black uppercase tracking-wider transition-colors cursor-pointer font-sans"
                        >
                          <MessageSquare className="w-3 h-3 text-white" /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
          )}
      </div>
    </div>
  )}

  {/* Info footer box */}
      <div className="bg-emerald-50/40 border border-emerald-100/70 p-4 rounded-xl flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-emerald-800">
          <p className="font-semibold">Info Sistem KKM</p>
          <p className="mt-1 leading-relaxed text-emerald-800/80">
            Kriteria Ketuntasan Minimal (KKM) diatur standar pada angka <strong>75</strong>. Siswa dengan nilai di bawah 75 ditandai dengan label merah di menu Laporan Siswa dan dianggap membutuhkan program pengayaan atau remedial.
          </p>
        </div>
      </div>
    </div>
  );
}
