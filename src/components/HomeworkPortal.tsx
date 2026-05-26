import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  Search, 
  User, 
  Paperclip, 
  FileCheck2, 
  BookOpen, 
  HelpCircle,
  FolderOpen,
  Calendar,
  Sparkles,
  ClipboardList,
  UploadCloud
} from "lucide-react";
import { Kelas, Siswa, GuruCode, Tugas, PengumpulanTugas } from "../types";

interface HomeworkPortalProps {
  kelas: Kelas[];
  siswa: Siswa[];
  guruCodes: GuruCode[];
  currentGuruCode: string | null;
  activeTeacherName?: string;
  userRole: "admin" | "guru" | "wali";
  tugas: Tugas[];
  setTugas: React.Dispatch<React.SetStateAction<Tugas[]>>;
  pengumpulanTugas: PengumpulanTugas[];
  setPengumpulanTugas: React.Dispatch<React.SetStateAction<PengumpulanTugas[]>>;
  showNotification: (text: string, type?: "success" | "neutral") => void;
  // If in parent/guardian view, tracks selected active student ID
  selectedSiswaId?: string;
}

const TEMPLATE_SOAL = [
  { judul: "Tugas Kosa Kata (Mufrodat)", deskripsi: "Artikan kosa kata berikut ke rentang bahasa Indonesia:\n1. مَكْتَبٌ (Maktabun)\n2. قَلَمٌ (Qolamun)\n3. كُرْسِيٌّ (Kursiyyun)\n4. تِلْمِيْذٌ (Tilmizun)\nKerjakan di buku tulis lalu unggah foto tulisannya ke sistem." },
  { judul: "Latihan Al-Hiwar (Percakapan)", deskripsi: "Bacalah teks hiwar perkenalan halaman 14 bersama keluarga. Rekam suara/foto catatan hasil prakteknya, lalu kumpulkan file m4a/jpg ke mari." },
  { judul: "Tugas Qira'ah (Membaca)", deskripsi: "Lafalkan Qira'ah teks 'Al-Madrasah' dengan intonasi sempurna dan kirimkan video atau rekaman suara membacakan naskah arabnya." }
];

export default function HomeworkPortal({
  kelas,
  siswa,
  guruCodes,
  currentGuruCode,
  activeTeacherName,
  userRole,
  tugas,
  setTugas,
  pengumpulanTugas,
  setPengumpulanTugas,
  showNotification,
  selectedSiswaId
}: HomeworkPortalProps) {
  
  // --- SUB TAB (Tugas / Kirim Tugas) ---
  const [activeSubTab, setActiveSubTab] = useState<"daftar" | "buat" | "verifikasi">("daftar");

  // --- FOR TEACHER: EDITING & DELETING STATE ---
  const [editingTugasId, setEditingTugasId] = useState<string | null>(null);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);

  const handleDeleteTugas = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen dari pangkalan data?")) {
      setTugas(prev => prev.filter(t => t.id !== id));
      setPengumpulanTugas(prev => prev.filter(p => p.tugasId !== id));
      showNotification("Tugas berhasil dihapus secara permanen.", "neutral");
    }
  };

  const handleStartEditTugas = (t: Tugas) => {
    setEditingTugasId(t.id);
    setJudulTugas(t.judul);
    setDeskripsiSoal(t.deskripsiSoal);
    setTargetKelas(t.kelasId);
    setDueDate(t.dueDate);
    setEduLink(t.eduLink || "");
    setEduLinkLabel(t.eduLinkLabel || "");
    setSelectedSiswaIds(t.targetSiswaIds || []);
    setActiveSubTab("buat");
    showNotification(`Silakan sunting tugas: "${t.judul}"`, "success");
  };

  // --- FOR TEACHER: CREATING ASSIGNMENT ---
  const [judulTugas, setJudulTugas] = useState("");
  const [deskripsiSoal, setDeskripsiSoal] = useState("");
  const [targetKelas, setTargetKelas] = useState("semua"); // "semua" or specific kelasId
  const [dueDate, setDueDate] = useState("2026-06-05");
  const [eduLink, setEduLink] = useState("");
  const [eduLinkLabel, setEduLinkLabel] = useState("");

  // Clean target students state whenever the target class is updated
  React.useEffect(() => {
    setSelectedSiswaIds([]);
  }, [targetKelas]);

  // --- FOR STUDENT: SUBMITTING ASSIGNMENT ---
  const [submittingTugasId, setSubmittingTugasId] = useState<string | null>(null);
  const [linkFile, setLinkFile] = useState("Tugas_B_Arab_Latihan.jpg");
  const [catatanSiswa, setCatatanSiswa] = useState("");
  const [studentAttachedFile, setStudentAttachedFile] = useState<{
    name: string;
    type: string;
    dataUrl: string;
  } | null>(null);

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setStudentAttachedFile({
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // --- FOR TEACHER: GRADING SUBMISSION ---
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [scoreGrade, setScoreGrade] = useState("90");
  const [teacherNotes, setTeacherNotes] = useState("");

  // --- SELECTION CORRECTION ---
  const [selectedVerificationKelas, setSelectedVerificationKelas] = useState<string>("semua");

  // --- REAL-TIME STUDENT PROGRESS MONITORING ---
  const [showStudentsForTugasId, setShowStudentsForTugasId] = useState<Record<string, boolean>>({});
  const [tugasCategoryTab, setTugasCategoryTab] = useState<Record<string, "graded" | "pending" | "incomplete">>({});

  // --- ATTACHED FILE FOR CREATING WORK ---
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    type: "pdf" | "word" | "image" | "none";
    size?: string;
    dataUrl?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let detectedType: "pdf" | "word" | "image" | "none" = "none";
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (extension === "pdf") {
      detectedType = "pdf";
    } else if (["doc", "docx"].includes(extension)) {
      detectedType = "word";
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      detectedType = "image";
    }

    const sizeInKb = (file.size / 1024).toFixed(1) + " KB";
    
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        type: detectedType,
        size: sizeInKb,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle Create Task
  const handleCreateTugas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulTugas.trim() || !deskripsiSoal.trim()) {
      showNotification("Suguhi judul dan deskripsi soal yang jelas.", "neutral");
      return;
    }

    const targetSiswaToStore = (targetKelas !== "semua" && selectedSiswaIds.length > 0) ? selectedSiswaIds : undefined;

    const newTugas: Tugas = {
      id: editingTugasId || `TUG-${Date.now()}`,
      judul: judulTugas,
      deskripsiSoal: deskripsiSoal,
      tanggalDibuat: new Date().toISOString().split("T")[0],
      dueDate: dueDate,
      kelasId: targetKelas,
      teacherCode: currentGuruCode || "USTADZ-01",
      lampiranFile: attachedFile ? (attachedFile.type === "image" ? attachedFile.dataUrl : attachedFile.name) : undefined,
      lampiranFileType: attachedFile ? attachedFile.type : undefined,
      eduLink: eduLink.trim() || undefined,
      eduLinkLabel: eduLinkLabel.trim() || undefined,
      targetSiswaIds: targetSiswaToStore
    };

    if (editingTugasId) {
      setTugas(prev => prev.map(t => t.id === editingTugasId ? newTugas : t));
      showNotification(`Tugas '${judulTugas}' berhasil diperbarui!`, "success");
      setEditingTugasId(null);
    } else {
      setTugas(prev => [newTugas, ...prev]);
      showNotification(`Tugas '${judulTugas}' dikirimkan kepada murid!`, "success");
    }

    setJudulTugas("");
    setDeskripsiSoal("");
    setAttachedFile(null); // Reset file
    setEduLink("");
    setEduLinkLabel("");
    setSelectedSiswaIds([]);
    setActiveSubTab("daftar");
  };

  // Handle Verify Submission (Teacher grades student)
  const handleVerifySubmission = (status: "Disetujui" | "Ditolak") => {
    if (!selectedSubmissionId) return;

    const numericScore = parseInt(scoreGrade);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      showNotification("Skor nilai harus berkisar 0 sampai 100.", "neutral");
      return;
    }

    setPengumpulanTugas(prev => prev.map(p => {
      if (p.id === selectedSubmissionId) {
        return {
          ...p,
          statusVerifikasi: status,
          nilaiTugas: numericScore,
          catatanGuru: teacherNotes.trim() || undefined
        };
      }
      return p;
    }));

    showNotification(`Koreksi tugas berhasil diperbarui menjadi: ${status}.`, "success");
    setSelectedSubmissionId(null);
    setTeacherNotes("");
  };

  // Handle Student Submit Homework
  const handleStudentSubmitTugas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTugasId || !selectedSiswaId) {
      return;
    }

    const fileField = studentAttachedFile 
      ? `${studentAttachedFile.name}|||${studentAttachedFile.dataUrl}` 
      : linkFile.trim();

    const newSub: PengumpulanTugas = {
      id: `SUB-${Date.now()}`,
      tugasId: submittingTugasId,
      siswaId: selectedSiswaId,
      tanggalKumpul: new Date().toISOString().split("T")[0],
      linkFileAtauFoto: fileField,
      catatanSiswa: catatanSiswa.trim(),
      statusVerifikasi: "Belum Diverifikasi"
    };

    setPengumpulanTugas(prev => {
      // Avoid duplicated uploads for same student and assignment
      const filtered = prev.filter(p => !(p.tugasId === submittingTugasId && p.siswaId === selectedSiswaId));
      return [newSub, ...filtered];
    });

    showNotification("Selamat! Berhasil melampirkan file tugas untuk diverifikasi ustadz.", "success");
    setSubmittingTugasId(null);
    setCatatanSiswa("");
    setStudentAttachedFile(null); // Reset student custom file upload state
  };

  // Quick templates application
  const applyTemplate = (title: string, desc: string) => {
    setJudulTugas(title);
    setDeskripsiSoal(desc);
  };

  // Find submissions for selected task
  const filteredSubmissions = useMemo(() => {
    return pengumpulanTugas.filter(p => {
      // Find relative student
      const subStudent = siswa.find(s => s.id === p.siswaId);
      if (!subStudent) return false;

      if (selectedVerificationKelas !== "semua" && subStudent.kelasId !== selectedVerificationKelas) {
        return false;
      }
      return true;
    });
  }, [pengumpulanTugas, selectedVerificationKelas, siswa]);

  // Compute filtered assignments list
  const visibleTugas = useMemo(() => {
    if (selectedSiswaId) {
      const activeStudent = siswa.find(s => s.id === selectedSiswaId);
      if (!activeStudent) return [];

      return tugas.filter(t => {
        const isClassMatch = t.kelasId === "semua" || t.kelasId === activeStudent.kelasId;
        if (!isClassMatch) return false;

        if (t.targetSiswaIds && t.targetSiswaIds.length > 0) {
          return t.targetSiswaIds.includes(activeStudent.id);
        }
        return true;
      });
    }

    if (userRole === "guru" && currentGuruCode) {
      return tugas.filter(t => t.teacherCode === currentGuruCode);
    }

    return tugas;
  }, [tugas, selectedSiswaId, siswa, userRole, currentGuruCode]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visual Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-display font-black text-slate-800 tracking-tight">Lembar Penugasan Elektronik</h2>
            <p className="text-xs text-slate-500 font-medium">Kirim tugas soal, lampirkan foto pekerjaan rumah, dan lakukan verifikasi asisten guru</p>
          </div>
        </div>

        {/* Dual Actions Tabs depending on Role (Vertical on mobile, horizontal on desktop) */}
        <div className="bg-slate-150 p-1 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center self-stretch sm:self-center border border-slate-205 gap-1.5 sm:gap-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab("daftar")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === "daftar" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
            } w-full sm:w-auto`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Daftar Tugas
          </button>

          {(userRole === "guru" || userRole === "admin") && (
            <>
              <button
                onClick={() => setActiveSubTab("buat")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSubTab === "buat" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                } w-full sm:w-auto`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" /> {editingTugasId ? "Sunting Tugas" : "Buat Tugas Baru"}
              </button>
              <button
                onClick={() => setActiveSubTab("verifikasi")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeSubTab === "verifikasi" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                } w-full sm:w-auto`}
              >
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> Verifikasi ({pengumpulanTugas.filter(p => p.statusVerifikasi === "Belum Diverifikasi").length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* ======================== ACTIVE TAB: DAFTAR TUGAS ======================== */}
      {activeSubTab === "daftar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {visibleTugas.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <FolderOpen className="w-10 h-10 text-slate-350 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Belum ada Lembar Tugas Berjalan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">Tidak ada tugas kuis atau mutalaah mandiri yang aktif saat ini.</p>
              </div>
            ) : (
              visibleTugas.map(t => {
                const targetCls = kelas.find(k => k.id === t.kelasId);
                const ownSub = selectedSiswaId ? pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === selectedSiswaId) : null;
                const authorGuru = guruCodes.find(g => g.code === t.teacherCode)?.namaGuru || "Ustadz Pembina";

                return (
                  <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-3xs hover:shadow-2xs transition-all space-y-4 relative">
                    {/* Badge Due Date */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        {t.kelasId === "semua" ? (
                          <span className="bg-amber-100/70 border border-amber-200 text-amber-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg select-none">
                            📢 Semua Kelas
                          </span>
                        ) : (
                          <span className="bg-emerald-50 border border-emerald-100 text-[#577354] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg select-none">
                            Kelas {targetCls ? targetCls.namaKelas : t.kelasId}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-450 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#8BA888]" /> Batas Kumpul: <span className="text-rose-600 underline font-mono">{t.dueDate}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">{t.judul}</h3>
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed">{t.deskripsiSoal}</p>
                    </div>

                    {t.lampiranFile && (
                      <div className="pt-1.5">
                        {t.lampiranFileType === "image" ? (
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-2 max-w-sm">
                            <img 
                              src={t.lampiranFile} 
                              className="max-h-52 w-full object-cover rounded-xl" 
                              referrerPolicy="no-referrer" 
                              alt="Lampiran Tugas" 
                            />
                            <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block px-1 truncate">
                              🖼️ Gambar Lampiran Soal
                            </span>
                          </div>
                        ) : t.lampiranFileType === "pdf" ? (
                          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/40 border border-rose-100 max-w-md">
                            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-750 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                              PDF
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 truncate">{t.lampiranFile}</p>
                              <p className="text-[10px] text-rose-600 font-medium">Dokumen Tugas Pembelajaran PDF</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                showNotification(`Simulasi mengunduh file PDF: ${t.lampiranFile}`);
                              }}
                              className="px-3 py-1 bg-white border border-rose-200 text-rose-700 text-[10px] font-bold rounded-lg hover:bg-rose-50"
                            >
                              Unduh PDF
                            </button>
                          </div>
                        ) : t.lampiranFileType === "word" ? (
                          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50/40 border border-blue-100 max-w-md">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-750 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                              DOCX
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 truncate">{t.lampiranFile}</p>
                              <p className="text-[10px] text-blue-600 font-medium">Bahan ajar / Lembar Soal Word</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                showNotification(`Simulasi mengunduh file Word: ${t.lampiranFile}`);
                              }}
                              className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg hover:bg-blue-50"
                            >
                              Unduh Word
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-205 max-w-md">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink shrink-0">
                              FILE
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-750 truncate">{t.lampiranFile}</p>
                              <p className="text-[10px] text-slate-450 font-semibold font-mono">Berkas Tugas Lainnya</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                showNotification(`Simulasi mengunduh file pendukung: ${t.lampiranFile}`);
                              }}
                              className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50"
                            >
                              Unduh File
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {t.eduLink && (
                      <div className="pt-2">
                        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 max-w-md">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-750 text-base flex items-center justify-center shrink shrink-0">
                            🎥
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-indigo-950 truncate leading-tight">{t.eduLinkLabel || "Materi Pembelajaran Edukatif"}</p>
                            <p className="text-[9px] text-indigo-600 font-medium truncate mt-0.5">{t.eduLink}</p>
                          </div>
                          <a
                            href={t.eduLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-[#2D3A3A] hover:bg-[#425555] text-white text-[10px] font-black uppercase rounded-lg shadow-3xs"
                          >
                            Buka Link &rarr;
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-dotted border-slate-200 text-[10px] text-slate-400 font-semibold">
                      <div>
                        Diunggah oleh: <span className="text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{authorGuru} ({t.teacherCode})</span>
                      </div>

                      {/* View Submission Stats or Actions */}
                      {userRole === "wali" && selectedSiswaId && (
                        <div>
                          {ownSub ? (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase border ${
                                ownSub.statusVerifikasi === "Disetujui" 
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                                  : ownSub.statusVerifikasi === "Ditolak"
                                  ? "bg-rose-50 border-rose-105 text-rose-700"
                                  : "bg-blue-50 border-blue-100 text-blue-700"
                              }`}>
                                {ownSub.statusVerifikasi}
                              </span>
                              {ownSub.nilaiTugas !== undefined && (
                                <span className="bg-[#2D3A3A] text-white px-2 py-0.5 rounded-lg font-mono font-bold text-[9px]">
                                  Skor: {ownSub.nilaiTugas}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSubmittingTugasId(t.id);
                                setLinkFile("Tugas_B_Arab_Latihan.jpg");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Kirim Jawaban Tugas
                            </button>
                          )}
                        </div>
                      )}

                      {(userRole === "guru" || userRole === "admin") && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                            Sudah Mengumpulkan: <strong className="text-slate-800 font-extrabold">{pengumpulanTugas.filter(p => p.tugasId === t.id).length} Siswa</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTugas(t)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTugas(t.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Simulated Submit Form for Students loaded directly below the question/soal card */}
                    {submittingTugasId === t.id && selectedSiswaId && (
                      <div className="bg-emerald-50 border border-emerald-150 rounded-3xl p-5 space-y-4 shadow-sm mt-4">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-155">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                            <UploadCloud className="w-5 h-5 text-emerald-600 animate-bounce" /> Formulir Kirim Tugas Murid
                          </h4>
                          <button 
                            type="button"
                            onClick={() => setSubmittingTugasId(null)}
                            className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Batal x
                          </button>
                        </div>

                        <form onSubmit={handleStudentSubmitTugas} className="space-y-3.5 text-xs text-slate-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Opsi Kirim Berkas Tugas</label>
                              <div className="flex flex-col gap-2">
                                <select
                                  value={studentAttachedFile ? "custom" : linkFile}
                                  onChange={(e) => {
                                    if (e.target.value !== "custom") {
                                      setStudentAttachedFile(null);
                                      setLinkFile(e.target.value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-[#8BA888]"
                                >
                                  <option value="Jawaban_Tulis_Arab_Murid.jpg">Jawaban_Tulis_Arab_Murid.jpg (Simulasi Foto)</option>
                                  <option value="Hiwar_Bahasa_Arab_Rekaman.mp3">Hiwar_Bahasa_Arab_Rekaman.mp3 (Simulasi Suara)</option>
                                  <option value="Praktek_Penyebutan_Keluarga.pdf">Praktek_Penyebutan_Keluarga.pdf (Simulasi PDF)</option>
                                  <option value="Tugas_Kosakata_Arab.png">Tugas_Kosakata_Arab.png (Simulasi Screenshot)</option>
                                  {studentAttachedFile && (
                                    <option value="custom">📁 Berkas Kustom ({studentAttachedFile.name})</option>
                                  )}
                                </select>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id={`student-file-picker-${t.id}`}
                                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                    className="hidden"
                                    onChange={handleStudentFileChange}
                                  />
                                  <label
                                    htmlFor={`student-file-picker-${t.id}`}
                                    className="px-3 py-1.5 bg-[#8BA888] hover:bg-[#577354] text-white font-black text-[10px] uppercase tracking-wide rounded-xl cursor-pointer flex items-center gap-1.5 shadow-3xs transition-colors"
                                  >
                                    <UploadCloud className="w-4 h-4" /> Unggah Foto/PDF/Word
                                  </label>
                                  {studentAttachedFile && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStudentAttachedFile(null);
                                        setLinkFile("Jawaban_Tulis_Arab_Murid.jpg");
                                      }}
                                      className="text-rose-600 font-extrabold text-[9px] uppercase tracking-wider hover:underline"
                                    >
                                      Reset Berkas
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">NIS & Nama Siswa Aktif</label>
                              <input
                                type="text"
                                disabled
                                value={`${siswa.find(s => s.id === selectedSiswaId)?.nis || "xxx"} - ${siswa.find(s => s.id === selectedSiswaId)?.namaSiswa || ""}`}
                                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500"
                              />
                            </div>
                          </div>

                          {studentAttachedFile && (
                            <div className="bg-white border border-slate-200/80 p-2.5 rounded-2xl max-w-sm mx-auto shadow-3xs">
                              {studentAttachedFile.type.startsWith("image/") ? (
                                <img 
                                  src={studentAttachedFile.dataUrl} 
                                  className="max-h-24 mx-auto object-contain rounded-lg" 
                                  alt="Pratinjau" 
                                  referrerPolicy="no-referrer" 
                                />
                              ) : (
                                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                                    FILE
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">{studentAttachedFile.name}</p>
                                    <p className="text-[8px] text-slate-400 uppercase tracking-wider font-extrabold">{studentAttachedFile.type || "Berkas Dokumen"}</p>
                                  </div>
                                </div>
                              )}
                              <p className="text-[9px] text-slate-400 text-center font-semibold mt-1.5 truncate">Terlampir siap pengerjaan</p>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Catatan Pendukung untuk Ustadz/Guru</label>
                            <textarea
                              placeholder="Ustadz, berikut tugas kosa kata saya. Mohon bimbingannya..."
                              value={catatanSiswa}
                              onChange={(e) => setCatatanSiswa(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl h-16 resize-none font-medium text-slate-700"
                            />
                          </div>

                          <button
                            type="submit"
                            className="bg-[#2D3A3A] hover:bg-slate-800 w-full py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest cursor-pointer"
                          >
                            Lampirkan & Kirim ke Guru
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Collapsible student progress monitoring board */}
                    {(() => {
                      const targetStudents = t.kelasId === "semua" ? siswa : siswa.filter(s => s.kelasId === t.kelasId);
                      const gradedStudents = targetStudents.filter(s => {
                        const sub = pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === s.id);
                        return sub && sub.statusVerifikasi === "Disetujui";
                      });
                      const pendingStudents = targetStudents.filter(s => {
                        const sub = pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === s.id);
                        return sub && sub.statusVerifikasi === "Belum Diverifikasi";
                      });
                      const incompleteStudents = targetStudents.filter(s => {
                        const sub = pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === s.id);
                        return !sub || sub.statusVerifikasi === "Ditolak";
                      });

                      const isExpanded = showStudentsForTugasId[t.id];
                      const activeTab = tugasCategoryTab[t.id] || "graded";

                      return (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 bg-[#FAF9F5]/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
                          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 font-black uppercase">
                              <span className="w-1.5 h-1.5 bg-[#8BA888] rounded-full animate-pulse shrink-0" />
                              Monitoring Pengerjaan Siswa ({targetStudents.length} Terdaftar)
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setShowStudentsForTugasId(prev => ({...prev, [t.id]: !prev[t.id]}))}
                              className="text-[10px] font-black uppercase text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? "Sembunyikan Status Siswa ▲" : "Lihat Status Siswa ▼"}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 pt-1.5 animate-fadeIn">
                              {/* Tabs selector */}
                              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto w-full">
                                <button
                                  type="button"
                                  onClick={() => setTugasCategoryTab(prev => ({...prev, [t.id]: "graded"}))}
                                  className={`flex-1 py-1 px-2.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === "graded" 
                                      ? "bg-white text-[#577354] shadow-xs font-black" 
                                      : "text-slate-450 hover:text-slate-700"
                                  }`}
                                >
                                  Sudah Selesai ({gradedStudents.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTugasCategoryTab(prev => ({...prev, [t.id]: "pending"}))}
                                  className={`flex-1 py-1 px-2.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === "pending" 
                                      ? "bg-amber-500 text-white shadow-xs font-black" 
                                      : "text-slate-450 hover:text-slate-700"
                                  }`}
                                >
                                  Menunggu Autentikasi ({pendingStudents.length})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTugasCategoryTab(prev => ({...prev, [t.id]: "incomplete"}))}
                                  className={`flex-1 py-1 px-2.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                                    activeTab === "incomplete" 
                                      ? "bg-slate-300 text-slate-700 font-bold" 
                                      : "text-slate-450 hover:text-slate-700"
                                  }`}
                                >
                                  Belum Mengerjakan ({incompleteStudents.length})
                                </button>
                              </div>

                              {/* Categorized rendering lists */}
                              <div className="max-h-56 overflow-y-auto pr-1 space-y-2">
                                {activeTab === "graded" && (
                                  gradedStudents.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">Belum ada murid yang nilainya diverifikasi.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {gradedStudents.map(student => {
                                        const sub = pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === student.id);
                                        const stKelas = kelas.find(k => k.id === student.kelasId)?.namaKelas || student.kelasId;
                                        return (
                                          <div key={student.id} className="bg-emerald-50/55 border border-emerald-150 p-2 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-emerald-100/30">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-extrabold text-slate-800 truncate">{student.namaSiswa}</p>
                                              <p className="text-[9px] text-[#577354] font-semibold uppercase tracking-wider">Kelas {stKelas} &bull; NIS: {student.nis}</p>
                                            </div>
                                            <div className="bg-[#577354] text-white font-mono text-[9px] px-2 py-0.5 rounded-lg font-black shrink-0">
                                              Nilai: {sub?.nilaiTugas ?? 0}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                )}

                                {activeTab === "pending" && (
                                  pendingStudents.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 italic">Tidak ada pertimbangan pengumpulan tertunda saat ini.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {pendingStudents.map(student => {
                                        const sub = pengumpulanTugas.find(p => p.tugasId === t.id && p.siswaId === student.id);
                                        const stKelas = kelas.find(k => k.id === student.kelasId)?.namaKelas || student.kelasId;
                                        return (
                                          <div key={student.id} className="bg-amber-50/40 border border-amber-200/70 p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-amber-50">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-extrabold text-slate-800 truncate">{student.namaSiswa}</p>
                                              <p className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider">Kelas {stKelas} &bull; NIS: {student.nis}</p>
                                              {sub?.catatanSiswa && (
                                                <p className="text-[9px] text-slate-500 italic mt-0.5 truncate bg-white/70 p-1 rounded-md">"{sub.catatanSiswa}"</p>
                                              )}
                                            </div>
                                            <div className="bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 select-none animate-pulse">
                                              Menunggu Autentikasi
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                )}

                                {activeTab === "incomplete" && (
                                  incompleteStudents.length === 0 ? (
                                    <p className="text-[10px] text-emerald-650 font-black italic">🎉 Sempurna! Semua siswa yang disasar sudah mengumpulkan.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {incompleteStudents.map(student => {
                                        const stKelas = kelas.find(k => k.id === student.kelasId)?.namaKelas || student.kelasId;
                                        return (
                                          <div key={student.id} className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-bold text-slate-750 truncate">{student.namaSiswa}</p>
                                              <p className="text-[9px] text-slate-400 font-semibold font-mono">Kelas {stKelas} &bull; NIS: {student.nis}</p>
                                            </div>
                                            <span className="text-[9px] text-slate-450 italic bg-slate-100 px-2 py-0.5 rounded-md">Belum Mengumpul</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Informative Column on side */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Panduan Tugas Bahasa Arab
              </h4>

              <div className="space-y-3.5 text-[11px] text-slate-550 leading-relaxed font-semibold">
                <p>
                  Sistem Tugas ini didesain khusus agar Ustadz/Ustadzah dapat membubuhkan soal kepada satu rombel pilihan ataupun <strong>semua jenjang kelas 2A sampai 6F</strong> sekaligus.
                </p>
                <p>
                  Murid / Wali murid dapat melihat daftar tugas secara real-time, melampirkan file pengerjaan (foto latihan menulis bahasa Arab, rekaman vokal bercakap, dsb.), dan melihat rekapitulasi penilaian digital langsung setelah diperiksa guru.
                </p>
              </div>
            </div>

            {selectedSiswaId && (
              <div className="bg-[#FAF9F5] p-5 rounded-3xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 font-display">
                  📋 Progress Tugas Anda
                </h4>

                {(() => {
                  const submitted = pengumpulanTugas.filter(p => p.siswaId === selectedSiswaId);
                  const approved = submitted.filter(p => p.statusVerifikasi === "Disetujui");
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">Total Dikirim:</span>
                        <span className="font-bold text-slate-800">{submitted.length} Tugas</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold">Disetujui Guru:</span>
                        <span className="font-bold text-emerald-700">{approved.length} Tugas</span>
                      </div>

                      {submitted.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Daftar Nilai Masuk</span>
                          <div className="space-y-1 text-xs">
                            {submitted.map(sub => {
                              const tg = tugas.find(t => t.id === sub.tugasId);
                              return (
                                <div key={sub.id} className="flex justify-between items-center bg-white p-1.5 rounded-lg border border-slate-100">
                                  <span className="font-semibold truncate max-w-28" title={tg?.judul}>{tg?.judul || "Tugas"}</span>
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                                    {sub.nilaiTugas ?? "Belum"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================== ACTIVE TAB: CONSTRUCT TUGAS ======================== */}
      {activeSubTab === "buat" && (userRole === "guru" || userRole === "admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Create form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" /> Tulis Masalah & Soal Tugas Baru
              </h3>

              <form onSubmit={handleCreateTugas} className="space-y-4 font-sans text-xs text-slate-700">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Judul Penugasan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Latihan Hiwar Mutabaah II"
                      value={judulTugas}
                      onChange={(e) => setJudulTugas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Sasaran Rombel / Kelas</label>
                    <select
                      value={targetKelas}
                      onChange={(e) => setTargetKelas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold"
                    >
                      <option value="semua">Semua Rombel (Kelas 2A sampai 6F)</option>
                      {kelas.map(k => (
                        <option key={k.id} value={k.id}>{k.namaKelas}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Batas Waktu Pengumpulan (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Deskripsi Detail & Butir Soal Arab</label>
                  <textarea
                    required
                    placeholder="Masukkan pertanyaan di sini. Anda juga bisa menempelkan teks bahasa Arab..."
                    value={deskripsiSoal}
                    onChange={(e) => setDeskripsiSoal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-44 resize-none focus:outline-emerald-500 font-medium"
                  />
                </div>

                {/* FILE ATTACHMENT BOX */}
                <div className="p-4 bg-[#FAF9F5] border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">📎 Lampirkan Dokumen Pendukung / Gambar Soal</span>
                  <p className="text-[10px] text-slate-400">Pilih berkas berupa PDF, Word (.doc/.docx), atau Gambar (.jpg/.png) dari perangkat Anda untuk dilampirkan bersama soal tugas ini.</p>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="attach_file_tugas"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {!attachedFile ? (
                      <label
                        htmlFor="attach_file_tugas"
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-3xs flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-4 h-4 text-[#8BA888]" /> Pilih Berkas Perangkat
                      </label>
                    ) : (
                      <div className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-bold text-slate-850 truncate">{attachedFile.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-black tracking-wide">{attachedFile.type} &bull; {attachedFile.size}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="px-2.5 py-1 text-[9px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-widest cursor-pointer hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        >
                          Batalkan
                        </button>
                      </div>
                    )}
                  </div>

                  {attachedFile && attachedFile.type === "image" && attachedFile.dataUrl && (
                    <div className="mt-2 text-center bg-white border border-slate-200 p-2 rounded-xl max-w-xs overflow-hidden shadow-3xs">
                      <img src={attachedFile.dataUrl} className="max-h-36 mx-auto object-contain rounded-lg" referrerPolicy="no-referrer" alt="Pratinjau gambar" />
                      <span className="text-[9px] text-slate-400 block mt-1 italic">Pratinjau Gambar Lampiran</span>
                    </div>
                  )}
                </div>

                {/* EDUCATIONAL VIDEO / LEARNING MATERIALS LINK */}
                <div className="p-4 bg-indigo-55/35 border border-indigo-150/60 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">🔗 Tautkan Link Video / Pembelajaran Edukatif</span>
                  <p className="text-[10px] text-indigo-700/80">Tambahkan materi pembelajaran online seperti link YouTube, website edukatif, Google Drive, atau pustaka digital pendukung untuk dipelajari siswa.</p>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] font-bold text-indigo-950 uppercase block mb-1">Nama / Label Link</label>
                      <input
                        type="text"
                        placeholder="Contoh: Video Animasi Percakapan Bahasa Arab"
                        value={eduLinkLabel}
                        onChange={(e) => setEduLinkLabel(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-200/80 rounded-xl focus:outline-indigo-500 font-semibold text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-indigo-950 uppercase block mb-1">URL Link Pembelajaran</label>
                      <input
                        type="url"
                        placeholder="Contoh: https://www.youtube.com/watch?v=..."
                        value={eduLink}
                        onChange={(e) => setEduLink(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-200/80 rounded-xl focus:outline-indigo-500 font-mono text-xs text-slate-750"
                      />
                    </div>
                  </div>
                </div>

                {/* SELECT SPECIFIC TARGET STUDENTS (CHOOSE ONLY A FEW STUDENTS OPTIONALLY) */}
                {targetKelas !== "semua" && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">👥 Kirim Hanya ke Siswa Tertentu (Opsional)</span>
                    <p className="text-[10px] text-slate-400">Pilih satu atau beberapa siswa terpilih untuk ditugaskan secara individual. <strong>Biarkan semuanya tidak tercentang jika ingin menugaskan ke seluruh siswa di kelas {kelas.find(k => k.id === targetKelas)?.namaKelas || targetKelas}.</strong></p>
                    
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl p-3">
                      {siswa.filter(s => s.kelasId === targetKelas).map(s => {
                        const isChecked = selectedSiswaIds.includes(s.id);
                        return (
                          <label key={s.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-150 rounded-lg hover:bg-emerald-50 hover:border-emerald-205 cursor-pointer text-[11px] font-bold text-slate-700 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSiswaIds(prev => [...prev, s.id]);
                                } else {
                                  setSelectedSiswaIds(prev => prev.filter(id => id !== s.id));
                                }
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{s.namaSiswa} <span className="text-[9px] font-mono text-slate-400 font-normal">({s.nis})</span></span>
                          </label>
                        );
                      })}
                      {siswa.filter(s => s.kelasId === targetKelas).length === 0 && (
                        <p className="text-slate-400 text-[10px] font-medium">Tidak ada data siswa dalam rombel ini.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-sm text-center"
                  >
                    {editingTugasId ? "Simpan Perubahan Tugas" : "Rilis & Kirim Lembar Tugas"}
                  </button>
                  {editingTugasId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTugasId(null);
                        setJudulTugas("");
                        setDeskripsiSoal("");
                        setAttachedFile(null);
                        setEduLink("");
                        setEduLinkLabel("");
                        setSelectedSiswaIds([]);
                        setActiveSubTab("daftar");
                        showNotification("Batal mengedit tugas.", "neutral");
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Quick template triggers */}
          <div className="space-y-4">
            <div className="bg-[#FAF9F5] p-5 rounded-3xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1 font-display">
                💡 Template Cepat Soal Bahasa Arab
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Klik salah satu template di bawah untuk langsung menyalin deskripsi soal pelajaran Bahasa Arab secara otomatis:
              </p>

              <div className="space-y-2 mt-2">
                {TEMPLATE_SOAL.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyTemplate(tmpl.judul, tmpl.deskripsi)}
                    className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl text-[11px] font-bold text-slate-700 transition-all flex flex-col gap-0.5 shadow-3xs hover:shadow-2xs cursor-pointer"
                  >
                    <span className="text-emerald-700 font-extrabold block text-xs">{tmpl.judul}</span>
                    <span className="text-[9px] text-slate-400 font-medium line-clamp-2">{tmpl.deskripsi}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================== ACTIVE TAB: VERIFIKASI PENGUMPULAN ======================== */}
      {activeSubTab === "verifikasi" && (userRole === "guru" || userRole === "admin") && (
        <div className="space-y-6">
          {/* Verification selection menu */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-black uppercase text-slate-600">Saring Pengumpulan:</span>
              <select
                value={selectedVerificationKelas}
                onChange={(e) => setSelectedVerificationKelas(e.target.value)}
                className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-semibold"
              >
                <option value="semua">Semua Rombel / Kelas</option>
                {kelas.map(k => (
                  <option key={k.id} value={k.id}>{k.namaKelas}</option>
                ))}
              </select>
            </div>

            <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-xl font-mono font-bold">
              Total {filteredSubmissions.length} Berkas Tugas
            </span>
          </div>

          {/* Verification lists */}
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-black text-slate-700">Semua Berkas Sudah Bersih!</p>
              <p className="text-[10px] text-slate-400">Tidak ada pengumpulan tugas siswa yang tertunda menunggu keputusan filter saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Submission cards list */}
              <div className="lg:col-span-2 space-y-3.5">
                {filteredSubmissions.map(subItem => {
                  const targetTgas = tugas.find(t => t.id === subItem.tugasId);
                  const targetStud = siswa.find(s => s.id === subItem.siswaId);
                  const targetCls = targetStud ? kelas.find(k => k.id === targetStud.kelasId) : null;
                  const isSele = selectedSubmissionId === subItem.id;

                  let checkBadge = "bg-blue-50 border-blue-100 text-blue-700";
                  if (subItem.statusVerifikasi === "Disetujui") checkBadge = "bg-emerald-50 border-emerald-100 text-emerald-700";
                  if (subItem.statusVerifikasi === "Ditolak") checkBadge = "bg-rose-50 border-rose-105 text-rose-700";

                  return (
                    <div 
                      key={subItem.id}
                      onClick={() => {
                        setSelectedSubmissionId(subItem.id);
                        setScoreGrade(String(subItem.nilaiTugas || 90));
                        setTeacherNotes(subItem.catatanGuru || "");
                      }}
                      className={`p-5 rounded-3xl bg-white border cursor-pointer hover:bg-slate-50/50 transition-all text-xs space-y-3.5 ${
                        isSele ? "outline-2 outline-emerald-500 border-transparent shadow-xs" : "border-slate-200 shadow-3xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block">
                            {targetStud?.namaSiswa || "Murid Tidak Dikenal"}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                            NIS: {targetStud?.nis} &bull; Rombel: {targetCls?.namaKelas}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${checkBadge}`}>
                          {subItem.statusVerifikasi}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl space-y-3 border border-slate-150 font-medium">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Judul Tugas: <span className="text-slate-700 underline">{targetTgas?.judul || subItem.tugasId}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100 mt-1.5">
                          {(() => {
                            const fileParts = subItem.linkFileAtauFoto.split("|||");
                            const isCustomUploaded = fileParts.length > 1;
                            const fileName = isCustomUploaded ? fileParts[0] : subItem.linkFileAtauFoto;
                            const fileContent = isCustomUploaded ? fileParts[1] : null;

                            return (
                              <div className="space-y-1.5">
                                <div className="flex gap-2 text-[10px] text-slate-500">
                                  <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Berkas Dilampirkan: <span className="font-bold text-emerald-805 truncate font-mono select-none">{fileName}</span>
                                </div>

                                {isCustomUploaded && fileContent ? (
                                  <div className="mt-1 p-2 bg-white border border-slate-205 rounded-xl space-y-1.5">
                                    {fileContent.startsWith("data:image/") ? (
                                      <div className="space-y-1.5">
                                        <img 
                                          src={fileContent} 
                                          className="max-h-40 rounded-lg object-contain mx-auto border border-slate-100" 
                                          alt="Unggahan Siswa" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <a 
                                          href={fileContent} 
                                          download={fileName}
                                          className="block text-center text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1 rounded-md transition-colors"
                                        >
                                          💾 Unduh / Buka Gambar Siswa
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-1 text-[9px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                        <span className="text-slate-650 font-bold truncate max-w-[150px] shrink-0">📁 Dokumen Kustom Siswa</span>
                                        <a 
                                          href={fileContent} 
                                          download={fileName}
                                          className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                                        >
                                          💾 Unduh Berkas
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[9px] text-slate-400 italic flex items-center gap-1 bg-slate-100/50 p-1 rounded">
                                    <span>⚙️ Berkas Simulasi Pengujian Default</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {subItem.catatanSiswa && (
                          <p className="text-[10.5px] italic text-slate-600 mt-1.5 pl-2.5 border-l-2 border-emerald-400 bg-emerald-50/20 py-1 rounded-r-lg">
                            "{subItem.catatanSiswa}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-2 border-t border-dotted border-slate-200">
                        <span>Tanggal Dikumpul: <span className="font-mono text-slate-600">{subItem.tanggalKumpul}</span></span>
                        
                        {subItem.nilaiTugas !== undefined && (
                          <span className="bg-[#2D3A3A] text-white font-mono px-2 py-0.5 rounded-lg">
                            Score: {subItem.nilaiTugas}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grading decision panel */}
              <div className="lg:col-span-1">
                {selectedSubmissionId ? (
                  <div className="bg-white p-5 rounded-3xl border border-slate-250 shadow-xs space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-100 pb-2">
                      ✍️ Lembar Verifikasi & Nilai
                    </h3>

                    <div className="space-y-3.5 text-xs text-slate-750">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Masukkan Nilai Skor (0-100)</label>
                        <input
                          type="number"
                          max="100"
                          min="0"
                          value={scoreGrade}
                          onChange={(e) => setScoreGrade(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 font-mono font-bold text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Catatan Guru / Koreksi</label>
                        <textarea
                          placeholder="Makhraj huruf luar biasa, perhatikan penulisan tanwin sambung..."
                          value={teacherNotes}
                          onChange={(e) => setTeacherNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleVerifySubmission("Disetujui")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-300" /> Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifySubmission("Ditolak")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-wider py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 text-rose-300" /> Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs italic">
                    <HelpCircle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                    Pilih salah satu kartu pengumpulan koordinat siswa untuk mulai melakukan koreksi & koreksi penilaian.
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
