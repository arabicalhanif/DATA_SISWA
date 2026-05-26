import React, { useState, useMemo } from "react";
import { 
  Search, 
  GraduationCap, 
  BookOpen, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  XCircle, 
  Share2, 
  LogOut, 
  RefreshCw,
  FileText, 
  Info, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Bot,
  Calendar,
  Clock,
  User,
  MapPin,
  Layers,
  ListFilter,
  Megaphone,
  Pin,
  ClipboardList,
  Phone,
  MessageSquare,
  ExternalLink,
  Menu,
  Check,
  AlertCircle
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  Legend, 
  Bar 
} from "recharts";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, SiswaNilai, AbsenSiswa, Jadwal, GuruCode, Announcement, Tugas, PengumpulanTugas, UjianPraktek } from "../types";
import HomeworkPortal from "./HomeworkPortal";
import AcademicCalendar from "./AcademicCalendar";

interface WaliMuridViewProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  onExitPortal: () => void;
  absenSiswa: AbsenSiswa[];
  jadwal: Jadwal[];
  guruCodes: GuruCode[];
  announcements: Announcement[];
  tugas: Tugas[];
  setTugas: React.Dispatch<React.SetStateAction<Tugas[]>>;
  pengumpulanTugas: PengumpulanTugas[];
  setPengumpulanTugas: React.Dispatch<React.SetStateAction<PengumpulanTugas[]>>;
  ujianPraktek?: UjianPraktek[];
  showWelcomeBanners?: boolean;
  activeSiswaProp?: Siswa | null;
  setActiveSiswaProp?: (s: Siswa | null) => void;
  parentActiveTabProp?: "rapor" | "absen" | "jadwal" | "tugas" | "les" | "kalender" | "hubungi";
  setParentActiveTabProp?: (t: "rapor" | "absen" | "jadwal" | "tugas" | "les" | "kalender" | "hubungi") => void;
}

export interface LesProgram {
  id: string;
  title: string;
  tutor: string;
  time: string;
  fee: string;
  targetKelasIds?: string[]; // Target classes for targeted tutoring
}

export interface LesRegistration {
  id: string;
  siswaId: string;
  siswaNama: string;
  kelasNama: string;
  programId: string;
  programNama: string;
  tutorNama: string;
  nohp: string;
  catatan: string;
  tanggalDaftar: string;
  status: "Menunggu" | "Disetujui" | "Ditolak";
}

export default function WaliMuridView({
  kelas,
  mapel,
  siswa,
  kategori,
  penilaian,
  onExitPortal,
  absenSiswa,
  jadwal,
  guruCodes,
  announcements,
  tugas,
  setTugas,
  pengumpulanTugas,
  setPengumpulanTugas,
  ujianPraktek = [],
  showWelcomeBanners = true,
  activeSiswaProp,
  setActiveSiswaProp,
  parentActiveTabProp,
  setParentActiveTabProp
}: WaliMuridViewProps) {
  const [nisInput, setNisInput] = useState("");
  const [activeSiswaLocal, setActiveSiswaLocal] = useState<Siswa | null>(null);
  const activeSiswa = activeSiswaProp !== undefined ? activeSiswaProp : activeSiswaLocal;
  const setActiveSiswa = setActiveSiswaProp !== undefined ? setActiveSiswaProp : setActiveSiswaLocal;

  const [errorMessage, setErrorMessage] = useState("");
  
  const [parentActiveTabLocal, setParentActiveTabLocal] = useState<"rapor" | "absen" | "jadwal" | "tugas" | "les" | "kalender" | "hubungi">("rapor");
  const parentActiveTab = parentActiveTabProp !== undefined ? parentActiveTabProp : parentActiveTabLocal;
  const setParentActiveTab = setParentActiveTabProp !== undefined ? setParentActiveTabProp : setParentActiveTabLocal;

  const [parentSuccessToast, setParentSuccessToast] = useState<string | null>(null);

  // Responsive sidebar drawer state matches teacher toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tutoring / Les form inputs
  const [selectedLesProgId, setSelectedLesProgId] = useState("");
  const [parentPhoneInput, setParentPhoneInput] = useState("");
  const [registrationNote, setRegistrationNote] = useState("");
  const [selectedTutorName, setSelectedTutorName] = useState("");

  const [isGeneratingParentAI, setIsGeneratingParentAI] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("siswadigital_ai_evaluations");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Load Tutoring Programs & Registrations from localstorage
  const lesPrograms = useMemo<LesProgram[]>(() => {
    const saved = localStorage.getItem("PSD_LES_PROGRAMS");
    if (saved) return JSON.parse(saved);
    return [];
  }, []);

  const [registrations, setRegistrations] = useState<LesRegistration[]>(() => {
    const saved = localStorage.getItem("PSD_LES_REGISTRATIONS");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const saveRegistrationsToStorage = (updated: LesRegistration[]) => {
    setRegistrations(updated);
    localStorage.setItem("PSD_LES_REGISTRATIONS", JSON.stringify(updated));
  };

  const currentStudentRegistrations = useMemo(() => {
    if (!activeSiswa) return [];
    return registrations.filter(r => r.siswaId === activeSiswa.id);
  }, [registrations, activeSiswa]);

  const activeStudentLesPrograms = useMemo(() => {
    if (!activeSiswa) return [];
    return lesPrograms.filter(p => p.targetKelasIds && p.targetKelasIds.includes(activeSiswa.kelasId));
  }, [lesPrograms, activeSiswa]);

  const handleRegisterLes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSiswa) return;
    if (!selectedLesProgId) {
      alert("Silakan tentukan bimbingan pelajaran terlebih dahulu.");
      return;
    }
    if (!selectedTutorName) {
      alert("Silakan pilih guru bimbingan terpilih terlebih dahulu.");
      return;
    }
    if (!parentPhoneInput.trim()) {
      alert("Masukkan nomor WhatsApp aktif Anda!");
      return;
    }

    const selectedProg = lesPrograms.find(p => p.id === selectedLesProgId);
    if (!selectedProg) return;

    // Check if duplicate
    const isAlreadyRegistered = currentStudentRegistrations.some(r => r.programId === selectedLesProgId);
    if (isAlreadyRegistered) {
      alert(`Ananda sudah terdaftar pada '${selectedProg.title}' sebelumnya.`);
      return;
    }

    const matchedKelas = kelas.find(k => k.id === activeSiswa.kelasId);

    const newReg: LesRegistration = {
      id: `reg-${Date.now()}`,
      siswaId: activeSiswa.id,
      siswaNama: activeSiswa.namaSiswa,
      kelasNama: matchedKelas ? matchedKelas.namaKelas : "Kelas",
      programId: selectedProg.id,
      programNama: selectedProg.title,
      tutorNama: selectedTutorName,
      nohp: parentPhoneInput.trim(),
      catatan: registrationNote.trim(),
      tanggalDaftar: new Date().toISOString().split("T")[0],
      status: "Menunggu"
    };

    const updated = [...registrations, newReg];
    saveRegistrationsToStorage(updated);

    // Retrieve Admin WhatsApp targets coordinate
    const adminNum = (localStorage.getItem("PSD_LES_ADMIN_WA") || "628123456781").replace(/[^0-9]/g, "").trim();

    const waText = `Assalamualaikum Wr. Wb. Admin SDIT Al Hanif, saya ingin mendaftarkan program bimbingan/les untuk anak tercinta:
- *Nama Siswa*: ${activeSiswa.namaSiswa}
- *Kelas*: ${matchedKelas ? matchedKelas.namaKelas : "Kelas"}
- *Program Les*: ${selectedProg.title}
- *Guru Pilihan*: ${selectedTutorName}
- *No. WhatsApp Orang Tua*: ${parentPhoneInput}
- *Catatan Pendukung*: ${registrationNote || "-"}

Mohon konfirmasi dan bimbingan selanjutnya dari pihak sekolah. Syukron.`;

    const waLink = `https://wa.me/${adminNum}?text=${encodeURIComponent(waText)}`;

    setSelectedLesProgId("");
    setRegistrationNote("");
    setSelectedTutorName("");

    // Trigger redirection
    const a = document.createElement("a");
    a.href = waLink;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();

    setParentSuccessToast(`Pendaftaran Ananda pada ${selectedProg.title} sukses dicatat! Mengalihkan ke WhatsApp Admin (${adminNum})...`);
    setTimeout(() => setParentSuccessToast(null), 5000);
  };

  const handleGenerateParentAI = async () => {
    if (!activeSiswa || !studentMetrics) return;
    const studentId = activeSiswa.id;
    const studentName = activeSiswa.namaSiswa;
    const nis = activeSiswa.nis;
    const avg = studentMetrics.average;
    
    setIsGeneratingParentAI(true);
    
    // Construct grades detail
    const listScores = studentMetrics.grades.map(g => `- ${g.mapelNama} (${g.kategoriNama}): nilai ${g.nilai}`).join("\n");
    
    const prompt = `Berikan bimbingan evaluasi belajar dan kolaborasi parenting di rumah yang sangat hangat, ramah, singkat, dan mendalam untuk Bapak/Ibu Orang Tua dari ${studentName} (NIS: ${nis}) dengan nilai rata-rata keseluruhan ${avg}.

Berikut rincian nilai tugas/ujian yang VALID:
${listScores}

Tolong berikan bimbingan positif yang singkat (Masing-masing paragraf cukup 2-3 kalimat penuh makna):
Paragraf 1 (Apresiasi & Kekuatan Aktual): Sapa dengan hangat Bapak/Ibu Orang Tua dari ${studentName}, sampaikan apresiasi tulus atas usaha belajar anak tercinta, dan puji mata pelajaran terbaiknya yang bernilai tertinggi dari data aktual di atas.
Paragraf 2 (Strategi Bimbingan Rumah): Berikan strategi bimbingan rumah yang santai, menyenangkan, serta dipenuhi kata-kata hangat yang memotivasi anak agar gembira belajar secara berkelanjutan.

Aturan Penting:
- Tulis langsung jawabannya tanpa kata pengantar sama sekali (Jangan bertele-tele!).
- Gunakan Bahasa Indonesia yang sangat hangat, ramah, mendorong kerja sama positif, dan solutif.`;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          appContext: {
            kelas,
            mapel,
            siswa,
            kategori,
            penilaian,
            currentRole: "wali"
          }
        })
      });

      if (!response.ok) throw new Error("Gagal mengambil data AI.");
      const data = await response.json();
      const text = data.text || "Gagal membuat evaluasi.";
      
      const updated = { ...evaluations, [studentId]: text };
      setEvaluations(updated);
      localStorage.setItem("siswadigital_ai_evaluations", JSON.stringify(updated));
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan atau API Key belum dikonfigurasi.");
    } finally {
      setIsGeneratingParentAI(false);
    }
  };

  // Helper lists of current NIS to make mock preview extremely easy to test
  const demoSiswaList = useMemo(() => {
    const evaluated = siswa.filter(s => evaluations[s.id] && evaluations[s.id].trim() !== "");
    if (evaluated.length > 0) return evaluated.slice(0, 4);
    return siswa.slice(0, 4);
  }, [siswa, evaluations]);

  // Handle Login using Student's NIS or custom Access Code
  const handlePortalLogin = (nisToSubmit: string) => {
    setErrorMessage("");
    const sanitizedInput = nisToSubmit.trim();
    if (!sanitizedInput) {
      setErrorMessage("Silakan masukkan NIS atau Kode Akses Murid terlebih dahulu.");
      return;
    }

    const foundSiswa = siswa.find(
      s => s.nis.toLowerCase() === sanitizedInput.toLowerCase() || 
           (s.kodeAkses && s.kodeAkses.toLowerCase() === sanitizedInput.toLowerCase())
    );

    if (foundSiswa) {
      setActiveSiswa(foundSiswa);
    } else {
      setErrorMessage(
        `NIS atau Kode Akses "${sanitizedInput}" tidak ditemukan dalam sistem. Harap periksa kembali atau hubungi operator sekolah.`
      );
    }
  };

  const handleLogout = () => {
    setActiveSiswa(null);
    setNisInput("");
    setErrorMessage("");
    setParentActiveTab("rapor");
    setIsSidebarOpen(false);
  };

  // Track assignments and exams the logged-in student has missed
  const myMissedTugas = useMemo(() => {
    if (!activeSiswa) return [];
    return tugas.filter(t => {
      const isTargetClass = t.kelasId === activeSiswa.kelasId || t.kelasId === "semua";
      if (!isTargetClass) return false;
      const foundSub = pengumpulanTugas.find(pt => pt.tugasId === t.id && pt.siswaId === activeSiswa.id);
      return !foundSub || foundSub.statusVerifikasi !== "Disetujui";
    });
  }, [tugas, pengumpulanTugas, activeSiswa]);

  const myMissedUjianPraktek = useMemo(() => {
    if (!activeSiswa || !ujianPraktek) return [];
    return ujianPraktek.filter(up => {
      // Respect teacher choice: "guru bisa memilih untuk memberitahu atau tidak"
      if (up.umumkanWali === false) return false;
      const isTargetClass = up.kelasId === activeSiswa.kelasId;
      if (!isTargetClass) return false;
      const item = up.items.find(i => i.siswaId === activeSiswa.id);
      return !item || !item.sudahMengikuti;
    });
  }, [ujianPraktek, activeSiswa]);

  const myMissedPenilaian = useMemo(() => {
    if (!activeSiswa || !penilaian) return [];
    return penilaian.filter(p => {
      // Respect teacher choice: "guru bisa memilih untuk memberitahu atau tidak"
      if (p.umumkanWali === false) return false;
      
      const kat = kategori.find(k => k.id === p.kategoriId);
      if (!kat) return false;
      if (kat.kelasId !== activeSiswa.kelasId) return false;

      // Check if student has no grade registry for this assessment
      const gradeEntry = p.grades.find(g => g.siswaId === activeSiswa.id);
      return !gradeEntry;
    });
  }, [penilaian, kategori, activeSiswa]);

  // ----------------------------------------------------
  // SCORING ANALYTICS AND TRANSLATIONS FOR LOGGED IN PARENT
  // ----------------------------------------------------
  const studentMetrics = useMemo(() => {
    if (!activeSiswa) return null;

    // Get Student's Class details
    const studentKelas = kelas.find(k => k.id === activeSiswa.kelasId);

    // Get all grades belonging to this student
    const studentGrades: {
      id: string;
      tanggal: string;
      kategoriId: string;
      kategoriNama: string;
      mapelId: string;
      mapelNama: string;
      nilai: number;
    }[] = [];

    penilaian.forEach(p => {
      if (p.umumkanWali === false) return; // Exclude unpublished grades from parent portal
      const gradeObj = p.grades.find(g => g.siswaId === activeSiswa.id);
      if (gradeObj) {
        const kat = kategori.find(k => k.id === p.kategoriId);
        const mpl = kat ? mapel.find(m => m.id === kat.mapelId) : null;

        studentGrades.push({
          id: p.id,
          tanggal: p.tanggal,
          kategoriId: p.kategoriId,
          kategoriNama: kat ? kat.namaKategori : "Tugas Umum",
          mapelId: kat ? kat.mapelId : "",
          mapelNama: mpl ? mpl.namaMapel : "Lainnya",
          nilai: gradeObj.nilai
        });
      }
    });

    // 1. Calculate Average Score (No cumulative totals according to user, we keep simple grade charts only)
    const totalScoreSum = studentGrades.reduce((sum, g) => sum + g.nilai, 0);
    const avgScore = studentGrades.length > 0 ? Number((totalScoreSum / studentGrades.length).toFixed(1)) : 0;

    // 2. Mapel Average calculations
    const subjectAverages: { [mapelId: string]: { sum: number; count: number; name: string } } = {};
    mapel.forEach(m => {
      subjectAverages[m.id] = { sum: 0, count: 0, name: m.namaMapel };
    });

    studentGrades.forEach(g => {
      if (g.mapelId && subjectAverages[g.mapelId]) {
        subjectAverages[g.mapelId].sum += g.nilai;
        subjectAverages[g.mapelId].count += 1;
      }
    });

    const studentMapelPerformance = Object.entries(subjectAverages)
      .map(([id, info]) => {
        const studentAvg = info.count > 0 ? Number((info.sum / info.count).toFixed(1)) : null;
        
        // Calculate class average for this subject for context
        let classSum = 0;
        let classCount = 0;

        penilaian.forEach(p => {
          const kat = kategori.find(k => k.id === p.kategoriId);
          // Only same subject and same class as student
          if (kat && kat.mapelId === id && kat.kelasId === activeSiswa.kelasId) {
            p.grades.forEach(g => {
              classSum += g.nilai;
              classCount += 1;
            });
          }
        });

        const classAvg = classCount > 0 ? Number((classSum / classCount).toFixed(1)) : 80.0;

        return {
          subjectId: id,
          subjectName: info.name,
          studentAverage: studentAvg !== null ? studentAvg : 0,
          classAverage: classAvg,
          hasData: info.count > 0
        };
      })
      .filter(item => item.hasData);

    // 3. Counting achievements
    const completedCount = studentGrades.filter(g => g.nilai >= 75).length;
    const remedialCount = studentGrades.filter(g => g.nilai < 75).length;

    return {
      studentKelas,
      grades: studentGrades,
      average: avgScore,
      completedCount,
      remedialCount,
      mapelPerformance: studentMapelPerformance,
    };
  }, [activeSiswa, kelas, mapel, kategori, penilaian]);

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PORTAL ACCESS SCREEN (Logged-out state) */}
      {!activeSiswa ? (
        <div className="max-w-xl mx-auto py-12 animate-fadeIn px-4">
          
          <div className="text-center space-y-3 mb-8">
            <span className="inline-flex bg-[#D6E0D2] text-[#2D3A3A] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
              Sistem Rapor Indonesia
            </span>
            <h1 className="text-3xl font-black font-display tracking-tight text-[#2D3A3A] mt-2">
              Selamat Datang Wali Murid! 👋
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Marhaban bikum, selamat datang di Portal Akademik Wali Murid. Silakan masukkan Nomor Induk Siswa (NIS) putra/putri Anda untuk meninjau perkembangan belajar secara transparan.
            </p>
          </div>

          <div className="bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/60 shadow-xl space-y-6">
            <div className="space-y-2">
              <label htmlFor="nis-input" className="text-xs font-bold text-slate-700 block text-left">
                Nomor Induk Siswa (NIS) atau Kode Akses Murid
              </label>
              
              <div className="relative">
                <input
                  id="nis-input"
                  type="text"
                  placeholder="Masukkan NIS atau Kode Akses"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePortalLogin(nisInput);
                  }}
                  className="w-full text-base bg-[#F8FAFC] border-2 border-[#E2E8F0] focus:border-teal-600 focus:ring-0 rounded-2xl py-3.5 pl-11 pr-4 font-semibold text-slate-800 tracking-wide transition-all placeholder:text-slate-400"
                />
                <Search className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-left font-medium">{errorMessage}</p>
              </div>
            )}

            <button
              onClick={() => handlePortalLogin(nisInput)}
              className="w-full cursor-pointer bg-[#2D3A3A] hover:bg-[#1C2727] text-white py-4 rounded-xl text-xs font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              Cek Rapor Siswa Sekarang
              <ArrowRight className="w-4 h-4 text-[#8BA888]" />
            </button>

            <div className="border-t border-emerald-100/50 pt-5 space-y-3.5">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <Info className="w-4 h-4 text-[#8BA888] shrink-0" />
                <span>Pemberitahuan &amp; Keamanan Akses:</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                Yth. Bapak/Ibu Orang Tua / Wali Murid SDIT Al Hanif Cilegon, demi menjaga kerahasiaan, privasi, dan keamanan data tumbuh kembang serta laporan nilai ananda tercinta, <span className="font-bold text-slate-700">setiap siswa wajib menggunakan Nomor Induk Siswa (NIS/NISN) atau Kode Akses Unik</span> yang telah dicetak dan dibagikan secara resmi oleh wali kelas masing-masing.
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed text-left">
                Bila Bapak/Ibu belum menerima atau kehilangan data nomor unik tersebut, silakan berkoordinasi langsung dengan guru wali kelas atau pihak madrasah untuk mendapatkan salinan informasi. Terima kasih atas pengertian dan kerjasamanya yang baik.
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={onExitPortal}
              className="text-slate-400 hover:text-[#8BA888] text-xs font-semibold hover:underline cursor-pointer bg-transparent border-0"
            >
              &larr; Kembali ke Dashboard Guru Utama
            </button>
          </div>

        </div>
      ) : (
        
        // SECTION B: ACTIVE PORTAL INTERFACE WITH BURGER TOGGLE MENU
        <div className="space-y-6 animate-fadeIn">
          
          {/* HEADER NAV WITH BURGER BUTTON & HORIZONTAL TABS (Sticky top-[80px] to prevent sinking on scroll) */}
          <div className="sticky top-20 z-30 space-y-3 no-print">
            <div className="bg-[#2D3A3A] text-white py-3.5 px-4 sm:px-5 select-none rounded-3xl flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-9 h-9 bg-white/10 hover:bg-white/15 text-[#8BA888] rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none border-0 relative lg:hidden"
                  title="Pencet untuk memilih menu"
                >
                  <Menu className="w-5 h-5 stroke-[2]" />
                  {myMissedTugas.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#2D3A3A] animate-pulse">
                      {myMissedTugas.length}
                    </span>
                  )}
                </button>
                <div>
                  <span className="text-[8px] sm:text-[9px] font-black uppercase text-[#8BA888] tracking-widest block font-mono leading-none">
                    Mata Pelajaran Bahasa Arab &bull; Wali Murid
                  </span>
                  <h3 className="text-xs sm:text-base font-black text-white tracking-tight leading-snug flex flex-wrap items-center gap-1.5 mt-0.5">
                    {activeSiswa.namaSiswa}
                    <span className="text-[10px] sm:text-[11px] font-mono font-black py-0.5 px-1.5 bg-[#4B5E50] border border-emerald-500/20 text-emerald-100 rounded-lg shrink-0">
                      Rombel {kelas.find(k => k.id === activeSiswa.kelasId)?.namaKelas || activeSiswa.kelasId}
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-350">
                      &bull; NIS {activeSiswa.nis}
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-3 py-1.5 hover:bg-emerald-500/10 hover:text-emerald-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-emerald-300 transition-all flex items-center gap-1 cursor-pointer outline-none font-mono"
                  title="Perbarui Halaman"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 hover:bg-red-500/10 hover:text-red-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-300 transition-all flex items-center gap-1 cursor-pointer outline-none font-mono"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>

            {/* Sticky Horizontal Tab Switcher for Instant Navigation */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: "rapor", label: "Rapor", icon: Award },
                { id: "absen", label: "Kehadiran", icon: Calendar },
                { id: "jadwal", label: "Jadwal", icon: Clock },
                { id: "tugas", label: "Tugas & PR", icon: ClipboardList, badge: myMissedTugas.length },
                { id: "les", label: "Program Bimbel", icon: BookOpen },
                { id: "kalender", label: "Kalender", icon: Calendar },
                { id: "hubungi", label: "Hubungi Ustadz/ah", icon: MessageSquare }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = parentActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setParentActiveTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? "bg-[#2D3A3A] text-white shadow-xs"
                        : "text-slate-550 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#8BA888]" : "text-slate-450"}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-rose-500 text-white text-[8px] font-sans font-black px-1.5 py-0.5 rounded-full shrink-0">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kata Sambutan Hangat untuk Wali Murid */}
          {parentActiveTab === "rapor" && (
            <div className="bg-gradient-to-tr from-[#F4F6F2] to-[#FBFCFA] p-6 rounded-3xl border border-emerald-100 shadow-xs space-y-3 relative overflow-hidden animate-fadeIn text-left">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 select-none pointer-events-none">
                <GraduationCap className="w-36 h-36 text-emerald-800" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#577354] tracking-widest block font-mono">Sambutan Kepala Sekolah & Civitas SDIT Al Hanif</span>
                  <h4 className="text-sm font-black text-slate-800 mt-0.5">Ahlan wa Sahlan, Bapak/Ibu Wali Murid dari {activeSiswa.namaSiswa}! 🌸</h4>
                </div>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed text-left">
                Marhaban bikum di Portal Akademik Wali Murid resmi SDIT Al Hanif. Syukron jazakumullah khairan atas amanah kepercayaan luar biasa yang Bapak/Ibu berikan kepada kami dalam membimbing putra-putri tercinta. Kami berkomitmen terus menyajikan transparansi seluruh hasil belajar, jadwal, kehadiran harian, dan koordinasi tugas interaktif secara intensif demi menjaga keselarasan parenting rumah & sekolah. Selamat meninjau tumbuh kembang dan pencapaian mulia ananda tercinta.
              </p>
            </div>
          )}

          {/* Quick instructions notifying parent about the collapsible side sheet */}
          <div className="bg-emerald-50 text-[#1E3A20] p-3 rounded-2xl text-[11px] font-semibold border border-emerald-100 flex items-center justify-center gap-1.5 text-center no-print">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Petunjuk: Pencet tombol garis tiga ☰ di ujung kiri atas untuk memilih lembar Rapor, Absen, Jadwal, Tugas, Les, dan Kalender!</span>
          </div>

          {/* PORTAL STUDENT SIDEBAR DRAWER OVERLAY */}
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex animate-fadeIn no-print">
              <div className="fixed inset-0" onClick={() => setIsSidebarOpen(false)} />
              
              <aside className="w-72 bg-[#2D3A3A] text-white p-6 h-full flex flex-col justify-between shrink-0 shadow-2xl relative z-10 animate-slideInLeft border-r border-white/5">
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#8BA888]" />
                      <span className="text-xs font-black tracking-widest text-[#8BA888] uppercase font-mono">Pilih Laman</span>
                    </div>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 px-2 text-[#8BA888] hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black tracking-wider uppercase"
                    >
                      Batal [X]
                    </button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1">
                    <p className="text-[10px] font-bold text-[#8BA888] uppercase tracking-wide leading-none font-mono">Wali Murid</p>
                    <h4 className="text-xs font-black text-white truncate">{activeSiswa.namaSiswa}</h4>
                    <p className="text-[10px] text-slate-350 font-mono">Kelas {studentMetrics?.studentKelas?.namaKelas}</p>
                  </div>

                  {/* Menu options mimicking the teacher navigation */}
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-wider mb-2 px-1">Menu Portal</p>
                    {[
                      { id: "rapor", label: "Rapor Hasil Belajar", icon: Award },
                      { id: "absen", label: "Kehadiran & Absen Ananda", icon: Calendar },
                      { id: "jadwal", label: "Jadwal Pelajaran Kelas", icon: Clock },
                      { id: "tugas", label: "Tugas & PR Elektronik", icon: ClipboardList },
                      { id: "les", label: "Les & Bimbingan Belajar", icon: BookOpen },
                      { id: "kalender", label: "Kalender Akademik SDIT", icon: Calendar },
                      { id: "hubungi", label: "Hubungi Ustadz/ah", icon: MessageSquare }
                    ].map(tab => {
                      const TabIcon = tab.icon;
                      const isTugas = tab.id === "tugas";
                      const countUnfinished = myMissedTugas.length;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setParentActiveTab(tab.id as any);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full px-4 py-3 rounded-xl text-xs font-bold leading-none cursor-pointer flex items-center justify-between transition-all ${
                            parentActiveTab === tab.id 
                              ? "bg-white/12 text-white shadow-sm border-l-4 border-emerald-400" 
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <TabIcon className="w-4.5 h-4.5 text-[#8BA888]" />
                            <span>{tab.label}</span>
                          </div>
                          {isTugas && countUnfinished > 0 && (
                            <span className="bg-rose-600 text-white font-extrabold px-2 py-1 rounded-full text-[9px] uppercase tracking-wider scale-95 shadow-md border border-rose-500/30 animate-pulse">
                              {countUnfinished} Missed
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-white/10 hover:bg-red-500/10 hover:text-red-300 font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Portal</span>
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* MAIN CONTAINER WORKSPACE */}
          <div className="w-full space-y-6">
            
            {parentSuccessToast && (
              <div className="fixed top-20 right-4 bg-[#2D3A3A] text-white px-5 py-3 rounded-2xl border border-emerald-500/30 shadow-xl z-50 flex items-center gap-2 animate-slideIn">
                <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse shrink-0" />
                <p className="text-xs font-bold leading-normal">{parentSuccessToast}</p>
              </div>
            )}

            {/* TAB 1: RAPOR HASIL BELAJAR */}
            {parentActiveTab === "rapor" && (
              <div className="space-y-6">
                
                {/* School Announcements Section - Placed right after identity information according to developer logs */}
                {(() => {
                  const studentKelasId = activeSiswa.kelasId;
                  const relevantAnns = announcements ? announcements.filter(ann => {
                    // Check expiration
                    const todayStr = new Date().toISOString().split("T")[0];
                    if (ann.expiredDate && todayStr > ann.expiredDate) return false;

                    if (!ann.targetKelasIds || ann.targetKelasIds.length === 0) {
                      return true; 
                    }
                    return ann.targetKelasIds.includes(studentKelasId);
                  }) : [];

                  return (
                    <div className="bg-[#FAF9F5] border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 text-left no-print">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shadow-3xs">
                          <Megaphone className="w-4.5 h-4.5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">📌 Papan Pengumuman Kelas & Sekolah</h3>
                          <p className="text-[10px] text-slate-400 font-medium">Informasi resmi dari MGMP Bahasa Arab Cilegon yang wajib ditindaklanjui.</p>
                        </div>
                      </div>

                      {relevantAnns.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Tidak ada pengumuman khusus untuk kelas ini saat ini.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {relevantAnns.map(ann => (
                            <div key={ann.id} className="p-4 bg-white border border-slate-200 hover:border-[#8BA888]/30 rounded-2xl relative shadow-3xs flex flex-col justify-between space-y-3">
                              <Pin className="w-3.5 h-3.5 text-emerald-600 absolute -top-1.5 -right-1.5 rotate-45 transform" />
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold text-slate-850 tracking-tight leading-snug">{ann.title}</h4>
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg">{ann.date}</span>
                                </div>
                                
                                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line font-medium pr-2">{ann.content}</p>
                                
                                {ann.imageUrl && (
                                  <div className="my-2.5 max-w-full rounded-xl overflow-hidden border border-slate-200">
                                    <img src={ann.imageUrl} alt="Poster pengumuman" className="w-full max-h-48 object-cover" />
                                  </div>
                                )}
                                
                                {(ann.phoneNumber || ann.actionLink) && (
                                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 mt-1">
                                    {ann.phoneNumber && (
                                      <a
                                        href={`https://wa.me/${ann.phoneNumber.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                        <span>WA ({ann.phoneNumber})</span>
                                      </a>
                                    )}
                                    {ann.actionLink && (
                                      <a
                                        href={ann.actionLink.startsWith("http") ? ann.actionLink : `https://${ann.actionLink}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 active:scale-97 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Buka Link Form</span>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 pt-1.5 text-[9px] font-semibold text-slate-400 border-t border-dotted border-slate-200">
                                <span className="flex items-center gap-1">
                                  <span className="text-teal-600 uppercase font-bold text-[8px]">Pengirim:</span>
                                  <span className="text-slate-600 font-bold bg-slate-100 px-1 rounded">{ann.authorName}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* NOTIFIKASI LATIHAN & UJIAN BELUM DIIKUTI ANANDA */}
                {(() => {
                  const missesPenilaian = myMissedPenilaian;
                  const missesPraktek = myMissedUjianPraktek;
                  const totalMissed = missesPenilaian.length + missesPraktek.length;

                  return (
                    <div className="bg-white rounded-3xl border border-rose-200/60 shadow-3xs overflow-hidden text-left">
                      <div className="p-5 sm:p-6 bg-rose-50/20 border-b border-rose-100 flex items-center justify-between flex-wrap gap-2 text-left">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8.5 h-8.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                            <AlertCircle className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Status Keikutsertaan Latihan & Ujian</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Informasi latihan harian atau ujian praktek yang belum diikuti oleh Ananda.</p>
                          </div>
                        </div>
                        {totalMissed > 0 ? (
                          <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 animate-pulse">
                            {totalMissed} Belum Diikuti / Terlewati
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            Lengkap ✓
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-4">
                        {totalMissed === 0 ? (
                          <div className="flex items-center gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Check className="w-4.5 h-4.5" strokeWidth={3} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-emerald-950 leading-snug">Barakallahu Fiikum!</h4>
                              <p className="text-[11px] text-emerald-700 leading-snug">Alhamdulillah, Ananda tercinta telah mengikuti seluruh agenda latihan harian, evaluasi kelas, dan ujian praktek aktif secara lengkap.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3 font-sans">
                            <div className="text-[11px] text-rose-800 bg-rose-50/70 rounded-xl p-3 border border-rose-100/75 leading-relaxed font-semibold">
                              Mohon bimbingan belajar untuk mendampingi Ananda melakukan susulan/pengerjaan latihan atau ujian berikut yang saat ini tercatat belum diikuti. Silakan hubungi wali kelas atau guru mata pelajaran untuk koordinasi ujian susulan.
                            </div>

                            <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/20">
                              {/* 1. Missed Written Assessments / Penilaian */}
                              {missesPenilaian.map(p => {
                                const kat = kategori.find(k => k.id === p.kategoriId);
                                const mpl = kat ? mapel.find(m => m.id === kat.mapelId) : null;
                                return (
                                  <div key={p.id} className="p-3.5 flex sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/65 flex-wrap sm:flex-nowrap">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-150 font-mono">Latihan</span>
                                        <span className="font-extrabold text-slate-800">{kat?.namaKategori || "Latihan Harian"}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        Mata Pelajaran: <strong className="text-slate-600">{mpl?.namaMapel || "Pelajaran"}</strong> &bull; Jadwal: {p.tanggal}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider bg-rose-50 border border-rose-250 px-2 py-0.5 rounded-lg shrink-0">
                                      Belum Ada Nilai / Absen Ujian
                                    </span>
                                  </div>
                                );
                              })}

                              {/* 2. Missed Practical Exams / Ujian Praktek */}
                              {missesPraktek.map(up => {
                                const mpl = mapel.find(m => m.id === up.mapelId);
                                return (
                                  <div key={up.id} className="p-3.5 flex sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/65 flex-wrap sm:flex-nowrap">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-150 font-mono">Praktek</span>
                                        <span className="font-extrabold text-slate-800">{up.namaUjian}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        Mata Pelajaran: <strong className="text-slate-600">{mpl?.namaMapel || "Pelajaran"}</strong> &bull; Sesi Praktek: {up.tanggal}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-lg shrink-0">
                                      Belum Mengikuti Ujian
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Grade Transcript card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">Transkrip Nilai Akademik</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Daftar menyeluruh perolehan nilai penugasan Bahasa Arab harian.</p>
                    </div>
                    <span className="text-xs text-teal-700 font-bold bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 font-mono">
                      {studentMetrics?.grades.length || 0} Uji Kompetensi
                    </span>
                  </div>

                  {studentMetrics?.grades.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2.5">
                      <FileText className="w-11 h-11 text-slate-300 mx-auto" strokeWidth={1.5} />
                      <p className="text-xs font-semibold">Belum Ada Catatan Nilai harian</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#F8FAFC] text-[10px] uppercase text-slate-400 font-bold tracking-widest border-b border-slate-200">
                          <tr>
                            <th className="px-5 py-3 ml-2">Mata Pelajaran</th>
                            <th className="px-5 py-3">Nama Tugas & Asesmen</th>
                            <th className="px-5 py-3 text-center">Skor Nilai</th>
                            <th className="px-5 py-3 text-right">Kriteria Kelulusan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentMetrics?.grades.map((g) => {
                            const isTuntas = g.nilai >= 75;
                            return (
                              <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3 text-xs font-bold text-slate-800">
                                  {g.mapelNama}
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-550 font-medium">
                                  {g.kategoriNama} <span className="block font-mono text-[9px] text-slate-400 font-normal">{g.tanggal}</span>
                                </td>
                                <td className="px-5 py-3 text-center font-mono font-bold text-slate-800">
                                  <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${
                                    isTuntas ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-700"
                                  }`}>
                                    {g.nilai}
                                  </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <span className={`inline-flex px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-wider ${
                                    isTuntas 
                                      ? "bg-emerald-100 text-emerald-805" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {isTuntas ? "Tuntas KKM" : "Koreksi / Remedial"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* GRAPH & PERFORMANCE ANALYSIS COMMENTARY (Lowered to the end of the portal tab) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Visual Recharts comparison */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-none">
                        Grafik Perbandingan Kelompok Belajar
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Membandingkan rata-rata nilai mata pelajaran Ananda dengan rata-rata satu kelas.
                      </p>
                    </div>

                    <div className="h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={studentMetrics?.mapelPerformance || []} 
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="subjectName" fontSize={10} stroke="#64748B" tickLine={false} />
                          <YAxis domain={[0, 100]} fontSize={11} stroke="#64748B" tickLine={false} />
                          <ChartTooltip 
                            contentStyle={{ background: "#2D3A3A", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} 
                            labelStyle={{ fontWeight: "bold", fontSize: 12 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="studentAverage" name="Siswa (Ananda)" fill="#4d7c0f" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="classAverage" name="Rata-rata Kelas" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Performance analysis commentary - Placed at the very end */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-800 text-base leading-none">
                        Catatan Pengembangan Siswa
                      </h3>
                      <p className="text-xs text-slate-400">
                        Berikut adalah rekomendasi akademik otomatis berdasarkan analisis data nilai.
                      </p>

                      <div className="space-y-3 pt-1">
                        <div className="p-4 rounded-xl bg-emerald-50/55 border border-emerald-150 text-xs leading-relaxed text-slate-700 space-y-2">
                          <p className="font-bold text-[#577354] flex items-center gap-1.5 select-none text-[11px]">
                            <CheckCircle className="w-4 h-4" /> Capaian Unggul Pembelajaran:
                          </p>
                          <p>
                            Siswa menunjukkan penguasaan materi yang prima pada bidang di mana nilai melampaui rata-rata kelas. Pertahankan kebiasaan belajar mandiri dan keaktifan di jam pelajaran tersebut.
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/50 text-xs leading-relaxed text-slate-700 space-y-2">
                          <p className="font-bold text-amber-700 flex items-center gap-1.5 select-none text-[11px]">
                            <XCircle className="w-4 h-4" /> Bimbingan Rumah (Evaluasi):
                          </p>
                          <p>
                            Mata pelajaran dengan status kurang memuaskan memerlukan peninjauan ulang bersama orang tua. Disarankan untuk menambah sesi bimbingan praktik harian intensif.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: KEHADIRAN & ABSENSI */}
            {parentActiveTab === "absen" && (() => {
              const studentLogs = absenSiswa.filter(a => a.siswaId === activeSiswa.id);
              const totalDays = studentLogs.length;

              const presentCount = studentLogs.filter(a => a.status === "Hadir").length;
              const sickCount = studentLogs.filter(a => a.status === "Sakit").length;
              const permittedCount = studentLogs.filter(a => a.status === "Izin").length;
              const alpaCount = studentLogs.filter(a => a.status === "Alpa").length;
              const overallPct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;

              return (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs text-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kehadiran</span>
                      <p className="text-3xl font-display font-black text-[#2D3A3A]">{overallPct}%</p>
                      <div className="w-full bg-slate-100 rounded-full h-1 mt-2">
                        <div className="bg-[#8BA888] h-1 rounded-full" style={{ width: `${overallPct}%` }} />
                      </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs text-center">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Hadir</span>
                      <p className="text-3xl font-display font-black text-emerald-700 mt-1">{presentCount}</p>
                      <span className="text-[10px] text-slate-400">Hari</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs text-center">
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Sakit/Izin</span>
                      <p className="text-3xl font-display font-black text-blue-750 mt-1">{sickCount + permittedCount}</p>
                      <span className="text-[9px] text-slate-400">S: {sickCount} | I: {permittedCount}</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs text-center">
                      <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Alpa</span>
                      <p className="text-3xl font-display font-black text-rose-650 mt-1">{alpaCount}</p>
                      <span className="text-[10px] text-slate-400">{alpaCount > 0 ? "Butuh Tindak Lanjut" : "Nihil"}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="p-5 border-b border-slate-150 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-sm">Riwayat Absensi Kehadiran</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Dada riwayat presensi berkala yang diinput oleh wali kelas.</p>
                    </div>

                    {studentLogs.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 space-y-2.5">
                        <Calendar className="w-11 h-11 text-slate-300 mx-auto" strokeWidth={1.5} />
                        <p className="text-xs font-semibold">Belum Ada Riwayat Absen</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {studentLogs
                          .sort((a,b) => b.tanggal.localeCompare(a.tanggal))
                          .map(log => {
                            let labelColor = "bg-green-150 text-green-800";
                            if (log.status === "Sakit") labelColor = "bg-amber-100 text-amber-800";
                            if (log.status === "Izin") labelColor = "bg-blue-100 text-blue-800";
                            if (log.status === "Alpa") labelColor = "bg-rose-100 text-rose-800";

                            return (
                              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                  <span className="text-xs font-bold text-slate-800 font-mono block">
                                    {log.tanggal}
                                  </span>
                                  {log.catatan && (
                                    <span className="text-[11px] text-slate-400 italic block">
                                      Catatan: &quot;{log.catatan}&quot;
                                    </span>
                                  )}
                                </div>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${labelColor}`}>
                                  {log.status}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB 3: JADWAL PELAJARAN */}
            {parentActiveTab === "jadwal" && (() => {
              const classId = activeSiswa.kelasId;
              const classSchedules = jadwal.filter(j => j.kelasId === classId);
              const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
              
              return (
                <div className="space-y-6 animate-fadeIn">
                  {classSchedules.length === 0 ? (
                    <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-400 space-y-2.5">
                      <Calendar className="w-11 h-11 text-slate-250 mx-auto" />
                      <p className="text-xs font-semibold">Belum Ada Jadwal Pelajaran Kelas</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                      {HARI_LIST.map(day => {
                        const daySchedules = classSchedules.filter(j => j.hari === day);
                        daySchedules.sort((a,b) => a.jamMulai.localeCompare(b.jamMulai));
                        if (daySchedules.length === 0) return null;

                        return (
                          <div key={day} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-3xs">
                            <span className="text-xs font-black uppercase text-teal-700 tracking-wider">📅 Hari {day}</span>

                            <div className="space-y-2">
                              {daySchedules.map(session => {
                                const currentMapel = mapel.find(m => m.id === session.mapelId);
                                const currentTeacher = guruCodes.find(g => g.code === session.teacherCode);
                                return (
                                  <div key={session.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 leading-none">
                                    <div className="flex justify-between items-center gap-1.5 flex-wrap">
                                      <h5 className="text-xs font-black text-slate-800">{currentMapel?.namaMapel || "Mapel"}</h5>
                                      <span className="text-[10px] text-slate-450 font-mono font-bold">{session.jamMulai} - {session.jamSelesai}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">Pengampu: {currentTeacher?.namaGuru || session.teacherCode}</p>
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
              );
            })()}

            {/* TAB 4: TUGAS & PR ELEKTRONIK */}
            {parentActiveTab === "tugas" && (
              <div className="space-y-6 animate-fadeIn font-sans">
                <HomeworkPortal
                  kelas={kelas}
                  siswa={siswa}
                  guruCodes={guruCodes}
                  currentGuruCode={null}
                  userRole="wali"
                  tugas={tugas}
                  setTugas={setTugas}
                  pengumpulanTugas={pengumpulanTugas}
                  setPengumpulanTugas={setPengumpulanTugas}
                  showNotification={(txt) => {
                    setParentSuccessToast(txt);
                    setTimeout(() => setParentSuccessToast(null), 4000);
                  }}
                  selectedSiswaId={activeSiswa.id}
                />
              </div>
            )}

            {/* TAB 5: LES & BIMBINGAN BELAJAR (NEW TUTORING ENROLL SECTION!) */}
            {parentActiveTab === "les" && (
              <div className="space-y-6 animate-fadeIn w-full max-w-4xl mx-auto">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Pendaftaran Les dan Bimbingan</h2>
                    <p className="text-xs text-slate-500 font-medium">Bantu putra/putri Anda mendaftar program les intensif bahasa Arab harian.</p>
                  </div>
                </div>

                {activeStudentLesPrograms.length === 0 ? (
                  <div className="bg-amber-50/20 border border-amber-205 p-6 sm:p-10 rounded-2xl text-center space-y-4 max-w-2xl mx-auto">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-extrabold text-slate-800">Sesi Les & Bimbingan Belajar Belum Tersedia</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Pihak sekolah/admin belum merilis jadwal program bimbingan belajar khusus untuk kelas putra/putri Anda. Hubungi Administrator untuk informasi pendaftaran les mandiri:
                      </p>
                      <p className="font-mono text-indigo-700 text-xs font-black bg-indigo-50/50 inline-block px-3 py-1 rounded-md border border-indigo-100">
                        {(() => {
                          const adminNum = (localStorage.getItem("PSD_LES_ADMIN_WA") || "628123456781").replace(/[^0-9]/g, "").trim();
                          return adminNum.startsWith("62") ? "0" + adminNum.slice(2) : adminNum;
                        })()}
                      </p>
                    </div>
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/${(() => {
                          return (localStorage.getItem("PSD_LES_ADMIN_WA") || "628123456781").replace(/[^0-9]/g, "").trim();
                        })()}?text=${encodeURIComponent(
                          `Assalamu'alaikum Admin, saya ingin menanyakan ketersediaan kelas les tambahan untuk siswa nama ${activeSiswa.namaSiswa} kelas ${studentMetrics?.studentKelas?.namaKelas || ""}.`
                        )}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-97 select-none"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Hubungi WhatsApp Admin</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Column: Register Form */}
                    <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-205 shadow-3xs space-y-4">
                      <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">Form Registrasi</h3>
                      
                      <form onSubmit={handleRegisterLes} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase block">Pilih Judul Program *</label>
                          <select
                            required
                            value={selectedLesProgId}
                            onChange={(e) => setSelectedLesProgId(e.target.value)}
                            className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-250 focus:border-indigo-500 rounded-xl"
                          >
                            <option value="">-- Pilih Bimbingan --</option>
                            {activeStudentLesPrograms.map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase block">Pilih Guru Pembimbing / Tutor *</label>
                          <select
                            required
                            value={selectedTutorName}
                            onChange={(e) => setSelectedTutorName(e.target.value)}
                            className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-250 focus:border-indigo-500 rounded-xl font-medium"
                          >
                            <option value="">-- Pilih Guru Les --</option>
                            {guruCodes.filter(g => g.isActive).map(g => (
                              <option key={g.code} value={g.namaGuru}>{g.namaGuru}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase block">No. WhatsApp Orang Tua *</label>
                          <input
                            type="text"
                            required
                            value={parentPhoneInput}
                            onChange={(e) => setParentPhoneInput(e.target.value)}
                            placeholder="e.g. 081234567890"
                            className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-250 rounded-xl font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase block">Catatan Pendukung (Opsi)</label>
                          <textarea
                            rows={3}
                            value={registrationNote}
                            onChange={(e) => setRegistrationNote(e.target.value)}
                            placeholder="Misal: Mohon bimbingan pelafalan kata atau mufrodat hafalan..."
                            className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-250 focus:border-indigo-500 rounded-xl resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all border-0"
                        >
                          Kirim Pendaftaran
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Programs Available & Joined classes status */}
                    <div className="md:col-span-2 space-y-5">
                      
                      {/* List of Available Programs */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3.5">
                        <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">Daftar Brosur Bimbingan Sekolah</h3>
                        
                        <div className="space-y-3">
                          {activeStudentLesPrograms.map(p => (
                            <div key={p.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="text-xs font-extrabold text-slate-800 leading-snug">{p.title}</h4>
                                <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-150 whitespace-nowrap">{p.fee}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium space-y-0.5">
                                <p>Tutor / Pengajar: <span className="font-bold text-slate-700">{p.tutor}</span></p>
                                <p>Sesi Kelas: <span className="font-mono text-slate-650 font-semibold">{p.time}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status of Student registrations (Live data matching screen) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3.5">
                        <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">Status Riwayat Pendaftaran Ananda</h3>
                        
                        {currentStudentRegistrations.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Ananda belum didaftarkan pada bimbingan apapun saat ini.</p>
                        ) : (
                          <div className="space-y-2.5">
                            {currentStudentRegistrations.map(r => {
                              let statusColor = "bg-amber-100 text-amber-800";
                              if (r.status === "Disetujui") statusColor = "bg-emerald-100 text-emerald-800";
                              if (r.status === "Ditolak") statusColor = "bg-rose-100 text-rose-800";

                              return (
                                <div key={r.id} className="p-3 bg-[#FAF9F5] border border-slate-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                                  <div>
                                    <h4 className="text-xs font-semibold text-slate-800 leading-none">{r.programNama}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1.5 font-mono">Tgl Daftar: {r.tanggalDaftar} | Pengajar: {r.tutorNama}</p>
                                  </div>

                                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
                                    {r.status === "Menunggu" ? "Menunggu Admin" : r.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 6: KALENDER AKADEMIK */}
            {parentActiveTab === "kalender" && (
              <div className="space-y-6 animate-fadeIn">
                <AcademicCalendar userRole="wali" />
              </div>
            )}

            {/* TAB 7: HUBUNGI USTADZ/AH */}
            {parentActiveTab === "hubungi" && (
              <div className="space-y-6 animate-fadeIn text-left">
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-3xs space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-slate-800 text-sm tracking-tight uppercase">Hubungi Ustadz & Ustadzah</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Layanan komunikasi terpadu untuk berkoordinasi langsung dengan dewan guru mengenai perkembangan ananda.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const savedContactMode = localStorage.getItem("PSD_WALI_PORTAL_CONTACT_MODE") || "ALL";
                    let savedAllowedRepo: string[] = [];
                    try {
                      savedAllowedRepo = JSON.parse(localStorage.getItem("PSD_WALI_PORTAL_ALLOWED_GURU_CODES") || "[]");
                    } catch {
                      savedAllowedRepo = [];
                    }

                    const filteredTeachersForWali = guruCodes.filter(g => {
                      if (!g.isActive) return false;
                      
                      if (savedContactMode === "WALAS") {
                        const activeStudentKelasId = activeSiswa?.kelasId;
                        if (!activeStudentKelasId) return false;
                        
                        const isWaliOfStudent = g.assignedKelasId === activeStudentKelasId || (g.assignedKelasIds && g.assignedKelasIds.includes(activeStudentKelasId));
                        return isWaliOfStudent && (g.isWaliKelas || g.code.startsWith("WALI-"));
                      }
                      
                      if (savedContactMode === "CUSTOM") {
                        return savedAllowedRepo.includes(g.code);
                      }
                      
                      return true;
                    });

                    if (filteredTeachersForWali.length === 0) {
                      return (
                        <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-150 text-xs text-slate-400 italic">
                          Tidak ada kontak pendidik aktif yang diizinkan untuk ditampilkan saat ini.
                        </div>
                      );
                    }

                    return filteredTeachersForWali.map(g => {
                      const teacherWA = g.phoneNumber || "6285210002000";
                      const cleanPhone = teacherWA.replace(/\D/g, "");
                      
                      // Message templates
                      const studentKelasObj = kelas.find(k => k.id === activeSiswa?.kelasId);
                      const studentKelasNama = studentKelasObj ? studentKelasObj.namaKelas : (activeSiswa ? activeSiswa.kelasId : "[Kelas]");
                      const introMsg = `Assalamu'alaikum wr. wb. Ustadz/ah ${g.namaGuru}, mohon maaf mengganggu waktunya. Saya wali murid dari ananda ${activeSiswa ? activeSiswa.namaSiswa : "[Nama Siswa]"} kelas ${studentKelasNama}`;
                      
                      const templates = [
                        { label: "Silaturahim & Belajar", text: "ingin bersilaturahim dan berkonsultasi mengenai proses belajar mengajar serta perilaku ananda di sekolah." },
                        { label: "Tanya Kehadiran", text: "ingin menanyakan perihal absensi / kehadiran ananda hari ini di kelas." },
                        { label: "Tanya PR / Tugas", text: "ingin mengonfirmasi mengenai perincian latihan tugas / pekerjaan rumah (PR) digital yang diberikan." },
                        { label: "Tanya Hafalan Quran", text: "ingin berkonsultasi perihal kelancaran hafalan mufrodat & mutabaah tilawah Al-Qur'an ananda." }
                      ];

                      return (
                        <div key={g.code} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2 font-sans text-xs">
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-800 tracking-tight leading-snug">{g.namaGuru}</h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {g.assignedKelasId && (
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                                      Walas: {g.assignedKelasId}
                                    </span>
                                  )}
                                  {g.mapelAjar ? (
                                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-150 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                      {g.mapelAjar}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-md">
                                      Bahasa Arab
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 uppercase text-xs font-black select-none">
                                {g.namaGuru.charAt(0)}
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-405 font-semibold font-mono leading-none">
                              No. WA: {g.phoneNumber || "6285210002000"}
                            </p>

                            <div className="space-y-1.5 text-xs">
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Pilih Template Pesan:</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {templates.map((t, idx) => {
                                  const fullWAUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(introMsg + " " + t.text)}`;
                                  return (
                                    <a
                                      key={idx}
                                      href={fullWAUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block p-2 text-center text-[9.5px] leading-tight font-bold bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200 hover:border-emerald-250 rounded-xl transition-all"
                                    >
                                      {t.label}
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(introMsg + " ingin bersilaturahim dan menanyakan perkembangan belajar di kelas.")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white text-[10px] font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 border-0 text-center"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Hubungi Ustadz via WA</span>
                          </a>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
