import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  User, 
  BookOpen, 
  Download,
  Filter,
  BarChart2,
  Sparkles,
  Bot,
  Megaphone,
  Pin
} from "lucide-react";
import { Penilaian, KategoriPenilaian, Kelas, MataPelajaran, Siswa, Announcement, AbsenSiswa } from "../types";

interface LaporanViewProps {
  penilaian: Penilaian[];
  kategori: KategoriPenilaian[];
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  announcements: Announcement[];
  activeTeacherName?: string;
  activeTeacherCode?: string;
  absenSiswa?: AbsenSiswa[];
}

type ModeLaporan = "HARIAN" | "BULANAN" | "SISWA" | "KELAS" | "ABSENSI" | "KONSOLIDASI";

export default function LaporanView({
  penilaian,
  kategori,
  kelas,
  mapel,
  siswa,
  announcements,
  activeTeacherName,
  activeTeacherCode,
  absenSiswa = []
}: LaporanViewProps) {
  const [activeMode, setActiveMode] = useState<ModeLaporan>("SISWA");

  // Selection filters
  const [targetDate, setTargetDate] = useState<string>("2026-05-10"); // Defaults to an active mock date
  const [targetMonth, setTargetMonth] = useState<string>("2026-05"); // YYYY-MM
  const [searchClassId, setSearchClassId] = useState<string>(kelas[0]?.id || "");
  const [searchStudentId, setSearchStudentId] = useState<string>("");

  // Keep searchStudentId perfectly synchronized and validated with searchClassId
  useEffect(() => {
    if (!searchClassId) {
      setSearchStudentId("");
      return;
    }
    // Verify if the current selected student is valid for the newly selected class
    const isCurrentSiswaValid = siswa.some(s => 
      s.id === searchStudentId && 
      (searchClassId === "ALL" || s.kelasId === searchClassId)
    );
    if (!isCurrentSiswaValid) {
      const candidates = siswa.filter(s => searchClassId === "ALL" || s.kelasId === searchClassId);
      if (candidates.length > 0) {
        setSearchStudentId(candidates[0].id);
      } else {
        setSearchStudentId("");
      }
    }
  }, [searchClassId, siswa, searchStudentId]);

  // Pre-cached classNames map for O(1) lookups
  const classNamesMap = useMemo(() => {
    const m = new Map<string, string>();
    kelas.forEach(k => {
      m.set(k.id, k.namaKelas);
    });
    return m;
  }, [kelas]);

  // Memoized options for the student dropdown to prevent high lag in rendering thousands of elements
  const studentSelectorOptions = useMemo(() => {
    return siswa.map(s => {
      const associatedClass = classNamesMap.get(s.kelasId) || "-";
      return (
        <option key={s.id} value={s.id}>
          {s.namaSiswa} ({associatedClass} - NIS {s.nis})
        </option>
      );
    });
  }, [siswa, classNamesMap]);

  // Compute monthly attendance recap
  const monthlyRecapData = useMemo(() => {
    if (!absenSiswa || !searchClassId) return [];
    
    // Get year & month from targetMonth (format YYYY-MM, e.g. "2026-05")
    const [yearPart, monthPart] = targetMonth.split("-");
    if (!yearPart || !monthPart) return [];
    
    // Filter students belonging to selected class
    const classSiswa = siswa.filter(s => s.kelasId === searchClassId);
    
    // Filter attendances for that class, occurring on that month & year
    const monthlyRecords = absenSiswa.filter(a => {
      if (a.kelasId !== searchClassId) return false;
      const [recY, recM] = a.tanggal.split("-"); // YYYY-MM-DD
      return recY === yearPart && recM === monthPart;
    });

    return classSiswa.map(s => {
      const studentRecords = monthlyRecords.filter(a => a.siswaId === s.id);
      const totalSession = studentRecords.length;
      
      const H = studentRecords.filter(a => a.status === "Hadir").length;
      const S = studentRecords.filter(a => a.status === "Sakit").length;
      const I = studentRecords.filter(a => a.status === "Izin").length;
      const A = studentRecords.filter(a => a.status === "Alpa").length;
      
      const pct = totalSession > 0 ? Math.round((H / totalSession) * 100) : 100;

      return {
        id: s.id,
        nis: s.nis,
        nama: s.namaSiswa,
        H,
        S,
        I,
        A,
        totalSession,
        pct
      };
    });
  }, [absenSiswa, siswa, searchClassId, targetMonth]);

  // AI Evaluation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [editingText, setEditingText] = useState("");
  const [evaluations, setEvaluations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("siswadigital_ai_evaluations");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const saveEvaluation = (studentId: string, text: string) => {
    const updated = { ...evaluations, [studentId]: text };
    setEvaluations(updated);
    localStorage.setItem("siswadigital_ai_evaluations", JSON.stringify(updated));
  };

  const handleGenerateEvaluation = async () => {
    if (!studentReportCard) return;
    const studentId = studentReportCard.student.id;
    const studentName = studentReportCard.student.namaSiswa;
    const nis = studentReportCard.student.nis;
    const avg = studentReportCard.average;
    
    setIsGenerating(true);
    
    // Construct grades detail for prompt
    const listScores = studentReportCard.scores.map(s => `- ${s.mapel} (Tugas: ${s.tugas}) dengan nilai ${s.nilai}`).join("\n");
    
    const cleanTeacherName = (activeTeacherName || "MGMP BAHASA ARAB").replace(/(,?\s*[S|M]\.[P|K]d\.?)/g, "").trim();
    const prompt = `Berikan penilaian evaluasi akademik dan catatan motivasi belajar rapor yang SANGAT HANGAT, bersahabat, menyentuh hati, singkat, dan mendalam untuk siswa bernama ${studentName} (NIS: ${nis}) dengan nilai rata-rata keseluruhan ${avg}.

Berikut adalah data rincian tugas dan nilainya yang VALID dari kelas:
${listScores}

Tolong susun catatan evaluasi dari Guru bernama ${cleanTeacherName}. Evaluasi harus ringkas (Masing-masing paragraf hanya berisi 2-3 kalimat yang sangat padat, sejuk, dan memotivasi):
Paragraf 1 (Apresiasi hangat & Data Aktual): Sebutkan nama guru (${cleanTeacherName}) yang sangat bangga atas usaha ${studentName}, sebutkan rincian tugas atau pelajaran terbaiknya berdasarkan nilai tertinggi di atas dengan nada penuh apresiasi tulus.
Paragraf 2 (Harapan & Saran Pembelajaran): Berikan saran bimbingan atau dorongan belajar dengan penuh semangat juang secara gembira dan positif.
Paragraf 3 (Tanda Tangan/Salam Hangat): Akhiri catatan dengan kalimat sapaan kasih sayang pribadi dari guru, contoh: "Dengan kasih sayang dan doa restu, - Ibu ${cleanTeacherName}" atau "Salam hangat, - Bapak ${cleanTeacherName}".

Aturan Penting:
- Tulis langsung draf catatan rapornya tanpa kata pengantar robotik apa pun (Jangan bertele-tele!).
- Gunakan Bahasa Indonesia yang paling hangat, mendidik, menginspirasi, dan bersahabat.
- Sajikan semua data nilai di atas secara akurat dan tidak melenceng.`;

    try {
      setErrorText("");
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
            currentRole: "guru",
            teacherName: activeTeacherName || "MGMP BAHASA ARAB",
            teacherCode: activeTeacherCode || "GURU-2026"
          }
        })
      });

      if (!response.ok) throw new Error("Gagal mengambil data AI.");
      const data = await response.json();
      const text = data.text || "Gagal membuat evaluasi.";
      saveEvaluation(studentId, text);
      setEditingText(text);
    } catch (error) {
      console.error(error);
      setErrorText("Terjadi kesalahan atau API Key belum dikonfigurasi. Silakan periksa kembali.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helpers to resolve metadata
  const resolveSiswaName = (id: string) => siswa.find(s => s.id === id)?.namaSiswa || "Terhapus";
  const resolveSiswaNis = (id: string) => siswa.find(s => s.id === id)?.nis || "-";
  const resolveKelasName = (id: string) => kelas.find(k => k.id === id)?.namaKelas || "-";
  const resolveMapelName = (id: string) => mapel.find(m => m.id === id)?.namaMapel || "-";
  const resolveKategoriName = (id: string) => kategori.find(k => k.id === id)?.namaKategori || "-";

  // LAPORAN 1: HARIAN DATA
  const harianReportData = useMemo(() => {
    // Find all assessments on targetDate
    const assessmentsOnDate = penilaian.filter(p => p.tanggal === targetDate);
    
    // Flatten grades with assessment meta
    const flatReport: any[] = [];
    assessmentsOnDate.forEach(p => {
      const kat = kategori.find(k => k.id === p.kategoriId);
      const sub = mapel.find(m => m.id === kat?.mapelId);
      const cls = kelas.find(c => c.id === kat?.kelasId);

      p.grades.forEach(g => {
        flatReport.push({
          id: `${p.id}-${g.siswaId}`,
          tanggal: p.tanggal,
          tugas: kat?.namaKategori || "Tugas Terhapus",
          mapel: sub?.namaMapel || "Mapel Terhapus",
          kelas: cls?.namaKelas || "Kelas Terhapus",
          namaSiswa: resolveSiswaName(g.siswaId),
          nis: resolveSiswaNis(g.siswaId),
          nilai: g.nilai,
          status: g.nilai >= 75 ? "LULUS" : "REMEDIAL"
        });
      });
    });

    return flatReport.sort((a, b) => b.nilai - a.nilai); // High scores first
  }, [penilaian, targetDate, kategori, mapel, kelas, siswa]);

  // LAPORAN 2: BULANAN DATA
  const bulananReportData = useMemo(() => {
    // Filter assessments by targetMonth (YYYY-MM)
    const assessmentsInMonth = penilaian.filter(p => p.tanggal.startsWith(targetMonth));

    const flatReport: any[] = [];
    assessmentsInMonth.forEach(p => {
      const kat = kategori.find(k => k.id === p.kategoriId);
      const sub = mapel.find(m => m.id === kat?.mapelId);
      const cls = kelas.find(c => c.id === kat?.kelasId);

      p.grades.forEach(g => {
        flatReport.push({
          id: `${p.id}-${g.siswaId}`,
          tanggal: p.tanggal,
          tugas: kat?.namaKategori || "Tugas Terhapus",
          mapel: sub?.namaMapel || "Mapel Terhapus",
          kelas: cls?.namaKelas || "Kelas Terhapus",
          namaSiswa: resolveSiswaName(g.siswaId),
          nis: resolveSiswaNis(g.siswaId),
          nilai: g.nilai,
          status: g.nilai >= 75 ? "LULUS" : "REMEDIAL"
        });
      });
    });

    return flatReport.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [penilaian, targetMonth, kategori, mapel, kelas, siswa]);

  // LAPORAN 3: PERSISWA REPORT CARD
  const studentReportCard = useMemo(() => {
    if (!searchStudentId) return null;
    const selectedStd = siswa.find(s => s.id === searchStudentId);
    if (!selectedStd) return null;

    const classOfStudent = kelas.find(k => k.id === selectedStd.kelasId);

    // Filter all grades which belongs to this student
    const scores: any[] = [];
    let totScore = 0;
    let countGrade = 0;
    let maxGrade = 0;
    let minGrade = 100;

    penilaian.forEach(p => {
      const activeGrade = p.grades.find(g => g.siswaId === searchStudentId);
      if (activeGrade) {
        const kat = kategori.find(k => k.id === p.kategoriId);
        const refMapel = mapel.find(m => m.id === kat?.mapelId);
        const scoreVal = activeGrade.nilai;

        totScore += scoreVal;
        countGrade++;
        if (scoreVal > maxGrade) maxGrade = scoreVal;
        if (scoreVal < minGrade) minGrade = scoreVal;

        scores.push({
          tanggal: p.tanggal,
          tugas: kat?.namaKategori || "Tugas Terhapus",
          mapel: refMapel?.namaMapel || "Mapel Terhapus",
          mapelId: refMapel?.id || "",
          kkm: refMapel?.kkm || 75,
          nilai: scoreVal,
          status: scoreVal >= (refMapel?.kkm || 75) ? `TUNTAS (>= ${refMapel?.kkm || 75})` : `BELUM LULUS (< ${refMapel?.kkm || 75})`
        });
      }
    });

    const average = countGrade > 0 ? Math.round((totScore / countGrade) * 10) / 10 : 0;
    
    // Sort oldest-to-newest to accurately compute trend sequence
    const sortedChrono = [...scores].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const scoresWithTrends = scores.map(current => {
      // Find previous chrono score on the SAME subject (mapel)
      const sameMapelPrev = sortedChrono.filter(sc => sc.mapelId === current.mapelId && sc.tanggal < current.tanggal);
      const prev = sameMapelPrev.length > 0 ? sameMapelPrev[sameMapelPrev.length - 1] : null;

      let trend: "naik" | "turun" | "stabil" | "awal" = "awal";
      let diff = 0;

      if (prev) {
        diff = current.nilai - prev.nilai;
        if (diff > 0) trend = "naik";
        else if (diff < 0) trend = "turun";
        else trend = "stabil";
      }

      return {
        ...current,
        trend,
        diff
      };
    });

    return {
      student: selectedStd,
      kelasName: classOfStudent?.namaKelas || "Tanpa Kelas",
      scores: scoresWithTrends.sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
      average,
      totalTugas: countGrade,
      maxGrade: countGrade > 0 ? maxGrade : 0,
      minGrade: countGrade > 0 ? minGrade : 0
    };
  }, [searchStudentId, siswa, kelas, penilaian, kategori, mapel]);

  // LAPORAN 4: KELAS MATRIX
  const classMatrixReport = useMemo(() => {
    if (!searchClassId) return null;
    const selectedCls = kelas.find(k => k.id === searchClassId);
    if (!selectedCls) return null;

    // Students in this glass
    const studentsInClass = siswa.filter(s => s.kelasId === searchClassId);

    // Kategori/Tugas assigned to this class
    const categoryForClass = kategori.filter(k => k.kelasId === searchClassId);

    // Build grid
    const matrixRows = studentsInClass.map(s => {
      let total = 0;
      let count = 0;
      const gradesOfStudent: Record<string, number> = {};

      categoryForClass.forEach(kat => {
        // Find assessment matching this category
        const assessmentOfKat = penilaian.find(p => p.kategoriId === kat.id);
        const gr = assessmentOfKat?.grades.find(g => g.siswaId === s.id);
        if (gr) {
          gradesOfStudent[kat.id] = gr.nilai;
          total += gr.nilai;
          count++;
        }
      });

      const avg = count > 0 ? Math.round((total / count) * 10) / 10 : null;

      return {
        id: s.id,
        nis: s.nis,
        namaSiswa: s.namaSiswa,
        grades: gradesOfStudent,
        avg: avg !== null ? avg : 0,
        taskCount: count
      };
    }).sort((a, b) => b.avg - a.avg); // Sort by avg grade for class ranking!

    return {
      kelas: selectedCls,
      categories: categoryForClass,
      rows: matrixRows
    };
  }, [searchClassId, kelas, siswa, kategori, penilaian]);

  // EXCEL CSV DOWNLOADER
  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let fileName = `Laporan_Nilai.csv`;

    if (activeMode === "HARIAN") {
      csvContent += `"LAPORAN PENILAIAN HARIAN (Tanggal: ${targetDate})"\n\n`;
      csvContent += `"Peringkat","NIS","Nama Siswa","Kelas","Mata Pelajaran","Tugas/Kategori","Nilai","Status KKM"\n`;
      
      harianReportData.forEach((row, idx) => {
        csvContent += `"${idx + 1}","${row.nis}","${row.namaSiswa}","${row.kelas}","${row.mapel}","${row.tugas}","${row.nilai}","${row.status}"\n`;
      });
      fileName = `Penilaian_Harian_${targetDate}.csv`;
    } 
    else if (activeMode === "BULANAN") {
      csvContent += `"LAPORAN PENILAIAN BULANAN (Bulan: ${targetMonth})"\n\n`;
      csvContent += `"Tanggal","NIS","Nama Siswa","Kelas","Mata Pelajaran","Tugas/Kategori","Nilai","Status"\n`;
      
      bulananReportData.forEach(row => {
        csvContent += `"${row.tanggal}","${row.nis}","${row.namaSiswa}","${row.kelas}","${row.mapel}","${row.tugas}","${row.nilai}","${row.status}"\n`;
      });
      fileName = `Penilaian_Bulanan_${targetMonth}.csv`;
    } 
    else if (activeMode === "SISWA") {
      if (!studentReportCard) return;
      csvContent += `"LAPORAN HASIL BELAJAR SISWA MANDIRI"\n`;
      csvContent += `"Nama Siswa:","${studentReportCard.student.namaSiswa}"\n`;
      csvContent += `"NIS/NISN:","${studentReportCard.student.nis}"\n`;
      csvContent += `"Kelas:","${studentReportCard.kelasName}"\n`;
      csvContent += `"Rata-Rata Seluruh Tugas:","${studentReportCard.average}"\n\n`;
      
      csvContent += `"Tanggal","Mata Pelajaran","Kategori/Tugas","Nilai","Status Terlewati"\n`;
      studentReportCard.scores.forEach(row => {
        csvContent += `"${row.tanggal}","${row.mapel}","${row.tugas}","${row.nilai}","${row.status}"\n`;
      });
      fileName = `Rapor_${studentReportCard.student.namaSiswa.replace(/\s+/g, "_")}.csv`;
    } 
    else if (activeMode === "KELAS") {
      if (!classMatrixReport) return;
      csvContent += `"REKAP MATRIKS NILAI KELAS: ${classMatrixReport.kelas.namaKelas}"\n\n`;
      
      // Header item
      let headerStr = `"Peringkat","NIS","Nama Siswa"`;
      classMatrixReport.categories.forEach(kat => {
        const correspondingMapel = mapel.find(m => m.id === kat.mapelId);
        headerStr += `,"${kat.namaKategori} (${correspondingMapel?.namaMapel || ''})"`;
      });
      headerStr += `,"Rata-Rata Kelas"\n`;
      csvContent += headerStr;

      // Rows
      classMatrixReport.rows.forEach((row, idx) => {
        let rowStr = `"${idx + 1}","${row.nis}","${row.namaSiswa}"`;
        classMatrixReport.categories.forEach(kat => {
          const scoreVal = row.grades[kat.id] !== undefined ? row.grades[kat.id] : "-";
          rowStr += `,"${scoreVal}"`;
        });
        rowStr += `,"${row.avg}"\n`;
        csvContent += rowStr;
      });
      fileName = `Matriks_Nilai_Kelas_${classMatrixReport.kelas.namaKelas.replace(/\s+/g, "_")}.csv`;
    }
    else if (activeMode === "KONSOLIDASI") {
      const selectedClassIdx = kelas.find(k => k.id === searchClassId);
      const classSiswa = siswa.filter(s => s.kelasId === searchClassId);
      csvContent += `"LAPORAN KONSOLIDASI TERPADU (Kelas: ${selectedClassIdx?.namaKelas || "-"}, Periode: ${targetMonth})"\n\n`;
      csvContent += `"No","NIS","Nama Siswa","Rata-Rata Nilai","Presensi Hadir (H)","Presensi Sakit (S)","Presensi Izin (I)","Presensi Alpa (A)","Persentase Kehadiran (%)","Evaluasi Catatan Guru"\n`;
      
      classSiswa.forEach((s, idx) => {
        const sPenilaians = penilaian.filter(p => {
          const katItem = kategori.find(k => k.id === p.kategoriId && k.kelasId === s.kelasId);
          return !!katItem;
        });
        let sum = 0;
        let count = 0;
        sPenilaians.forEach(p => {
          const g = p.grades.find(gr => gr.siswaId === s.id);
          if (g !== undefined) {
            sum += g.nilai;
            count++;
          }
        });
        const currentAvg = count > 0 ? Math.round((sum / count) * 10) / 10 : 100;

        const sRecords = (absenSiswa || []).filter(a => a.siswaId === s.id);
        const H = sRecords.filter(a => a.status === "Hadir").length;
        const S = sRecords.filter(a => a.status === "Sakit").length;
        const I = sRecords.filter(a => a.status === "Izin").length;
        const A = sRecords.filter(a => a.status === "Alpa").length;
        const total = sRecords.length;
        const pct = total > 0 ? Math.round((H / total) * 100) : 100;
        const evalTxt = evaluations[s.id] ? evaluations[s.id].replace(/"/g, '""').replace(/\n/g, ' ') : "Belum dievaluasi";

        csvContent += `"${idx + 1}","${s.nis}","${s.namaSiswa}","${currentAvg}","${H}","${S}","${I}","${A}","${pct}%","${evalTxt}"\n`;
      });
      fileName = `Rekap_Konsolidasi_Kelas_${selectedClassIdx?.namaKelas.replace(/\s+/g, "_") || 'Lain'}.csv`;
    }

    const encodeUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodeUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TRIGGER PRINT SYSTEM PORT
  const triggerPrintSession = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER CONTROLS SHEET */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Sistem Laporan
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Laporan Hasil Penilaian Siswa</h2>
          <p className="text-sm text-slate-500">
            Cari, cetak, atau unduh laporan evaluasi belajar harian, bulanan, per siswa, maupun rekapitulasi kelas.
          </p>
        </div>

        {/* Action Button Downloader */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrintSession}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer shadow-xs border border-transparent"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* TABS SELECTION STRIP (no-print) */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit no-print">
        <button
          onClick={() => setActiveMode("SISWA")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "SISWA" 
              ? "bg-white text-slate-800 shadow-xs" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <User className="w-3.5 h-3.5 inline mr-1" />
          Detail Nilai per Nama Siswa
        </button>
        
        <button
          onClick={() => setActiveMode("KELAS")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "KELAS" 
              ? "bg-white text-slate-800 shadow-xs" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1" />
          Rekap per Kelas
        </button>

        <button
          onClick={() => setActiveMode("HARIAN")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "HARIAN" 
              ? "bg-white text-slate-800 shadow-xs" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1" />
          Laporan Harian
        </button>

        <button
          onClick={() => setActiveMode("BULANAN")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "BULANAN" 
              ? "bg-white text-slate-800 shadow-xs" 
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
          Laporan Bulanan
        </button>

        <button
          onClick={() => setActiveMode("ABSENSI")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "ABSENSI" 
              ? "bg-white text-slate-850 shadow-xs" 
              : "text-slate-550 hover:text-slate-850 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
          Rekap Absensi Bulanan
        </button>

        <button
          onClick={() => setActiveMode("KONSOLIDASI")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeMode === "KONSOLIDASI" 
              ? "bg-white text-emerald-800 shadow-xs border border-emerald-250" 
              : "text-slate-550 hover:text-slate-850 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
          Rekap Konsolidasi Terpadu (Nilai + Absen)
        </button>
      </div>

      {/* REPORT PARAMETERS CONTROL CONTAINER (no-print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
        {(activeMode === "ABSENSI" || activeMode === "KONSOLIDASI") && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Pilih Rombel Kelas & Periode Bulan:
            </span>
            <select
              value={searchClassId}
              onChange={(e) => setSearchClassId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[120px]"
            >
              {kelas.map(k => (
                <option key={k.id} value={k.id}>{k.namaKelas}</option>
              ))}
            </select>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-[#2D3A3A] focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        )}
        {activeMode === "HARIAN" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Tanggal Laporan:</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400">
              * Menampilkan nilai tugas harian yang masuk pada tanggal tersebut.
            </span>
          </div>
        )}

        {activeMode === "BULANAN" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Bulan & Tahun Laporan:</span>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400">
              * Menyortir seluruh rekam nilai yang disubmit dalam periode bulan yang bersangkutan.
            </span>
          </div>
        )}

        {activeMode === "SISWA" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Saring Kelas:
            </span>
            <select
              value={searchClassId}
              onChange={(e) => {
                const newClassId = e.target.value;
                setSearchClassId(newClassId);
                // Auto-select first student of this class
                const filteredSiswa = siswa.filter(s => newClassId === "ALL" || s.kelasId === newClassId);
                if (filteredSiswa.length > 0) {
                  setSearchStudentId(filteredSiswa[0].id);
                } else {
                  setSearchStudentId("");
                }
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[130px]"
            >
              <option value="ALL">-- Semua Kelas --</option>
              {kelas.map(k => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas}
                </option>
              ))}
            </select>

            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Pilih Siswa:
            </span>
            <select
              value={searchStudentId}
              onChange={(e) => setSearchStudentId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[200px]"
            >
              {siswa
                .filter(s => searchClassId === "ALL" || s.kelasId === searchClassId)
                .map(s => {
                  const associatedClass = classNamesMap.get(s.kelasId) || "-";
                  return (
                    <option key={s.id} value={s.id}>
                      {s.namaSiswa} ({associatedClass} - NIS {s.nis})
                    </option>
                  );
                })}
            </select>
          </div>
        )}

        {activeMode === "KELAS" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Pilih Kelas Rujukan:
            </span>
            <select
              value={searchClassId}
              onChange={(e) => setSearchClassId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[150px]"
            >
              {kelas.map(k => (
                <option key={k.id} value={k.id}>
                  {k.namaKelas}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">
              Matrix nilai menampilkan semua murid dan perbandingan nilai tugas mereka di kelas terpilih.
            </span>
          </div>
        )}
      </div>

      {/* RENDER CONTENT CARD READY FOR PRINTER & DISPLAY */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs print-card">
        
        {/* Printable Formal Header (designed strictly for print media output, styled minimalistically) */}
        <div className="border-b-4 border-slate-800 pb-5 mb-6 text-center">
          <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-900">
            RAPOR PENILAIAN KOMPETENSI SISWA DIGITAL
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
            PENYELENGGARA LEMBAGA AKADEMIK &bull; REKAPITULASI RESMI
          </p>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            Dibuat secara digital pada: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* 1. VIEW HARIAN */}
        {activeMode === "HARIAN" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2.5">
              <span>LAPORAN HARIAN TANGGAL: <strong className="text-slate-800 font-mono">{targetDate}</strong></span>
              <span>Daftar Nilai Masuk</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Tugas / Kategori</th>
                    <th className="px-4 py-3 text-center w-20">Nilai</th>
                    <th className="px-4 py-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {harianReportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Tidak ditemukan penilaian masuk pada tanggal {targetDate}.
                      </td>
                    </tr>
                  ) : (
                    harianReportData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{row.nis}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{row.namaSiswa}</td>
                        <td className="px-4 py-2.5 font-medium">{row.kelas}</td>
                        <td className="px-4 py-2.5 text-slate-550">{row.mapel}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.tugas}</td>
                        <td className="px-4 py-2.5 text-center font-bold font-mono text-xs bg-slate-50">{row.nilai}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            row.nilai >= 75 
                              ? "bg-emerald-55 text-emerald-800 bg-emerald-50 border border-emerald-150" 
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. VIEW BULANAN */}
        {activeMode === "BULANAN" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2.5">
              <span>LAPORAN MONITORING BULAN: <strong className="text-slate-800 font-mono uppercase">{targetMonth}</strong></span>
              <span>Rekap Bulanan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 w-28">Tanggal</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3 font-semibold">Nama Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Kategori / Tugas</th>
                    <th className="px-4 py-3 text-center w-20">Nilai</th>
                    <th className="px-4 py-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulananReportData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Tidak ditemukan data penilaian terbit pada bulan {targetMonth}.
                      </td>
                    </tr>
                  ) : (
                    bulananReportData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.tanggal}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{row.nis}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{row.namaSiswa}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-600">{row.kelas}</td>
                        <td className="px-4 py-2.5">{row.mapel}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.tugas}</td>
                        <td className="px-4 py-2.5 text-center font-bold font-mono text-xs bg-slate-50">{row.nilai}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            row.nilai >= 75 
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-150" 
                              : "bg-red-50 text-red-700 border border-red-150"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. VIEW SISWA REPORT CARD */}
        {activeMode === "SISWA" && studentReportCard && (
          <div className="space-y-6">
            
            {/* Student Profile Row */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Nama Siswa:</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{studentReportCard.student.namaSiswa}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">NIS / NISN:</span>
                <p className="text-sm font-semibold text-slate-800 font-mono mt-1">{studentReportCard.student.nis}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Penempatan Kelas:</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{studentReportCard.kelasName}</p>
              </div>
              <div className="bg-emerald-500 text-white p-3 rounded-lg flex flex-col justify-center">
                <span className="text-[10px] text-emerald-100 uppercase font-semibold">NILAI RATA-RATA:</span>
                <p className="text-xl font-bold font-mono tracking-tight mt-0.5">{studentReportCard.average}</p>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-slate-150 rounded-lg p-2 bg-slate-50/50">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Tugas Diikuti</span>
                <p className="text-lg font-bold font-mono text-slate-800 mt-0.5">{studentReportCard.totalTugas} kali</p>
              </div>
              <div className="border border-slate-150 rounded-lg p-2 bg-slate-50/50">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Nilai Tertinggi</span>
                <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">{studentReportCard.maxGrade}</p>
              </div>
              <div className="border border-slate-150 rounded-lg p-2 bg-slate-50/50">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Nilai Terendah</span>
                <p className="text-lg font-bold font-mono text-red-500 mt-0.5">{studentReportCard.minGrade}</p>
              </div>
            </div>

            {/* Assessment Records Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rekaman Riwayat Penilaian Akademik</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="px-4 py-3 w-32">Tanggal</th>
                      <th className="px-4 py-3">Mata Pelajaran</th>
                      <th className="px-4 py-3">Kategori / Nama Tugas</th>
                      <th className="px-4 py-3 text-center w-20">KKM</th>
                      <th className="px-4 py-3 text-center w-40">Tren Perkembangan</th>
                      <th className="px-4 py-3 text-right w-32">Perolehan Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentReportCard.scores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400 leading-relaxed">
                          Siswa ini belum memperoleh pencatatan nilai di kelas ini.<br />
                          Silakan isi nilai siswa di menu <strong>&quot;Penilaian&quot;</strong>.
                        </td>
                      </tr>
                    ) : (
                      studentReportCard.scores.map((row, idx) => {
                        const scorePass = row.nilai >= row.kkm;
                        
                        let trendLabel = "▬ Stabil";
                        let trendBg = "bg-slate-50 text-slate-550 border-slate-200";
                        if (row.trend === "naik") {
                          trendLabel = `▲ Naik (+${row.diff})`;
                          trendBg = "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
                        } else if (row.trend === "turun") {
                          trendLabel = `▼ Turun (${row.diff})`;
                          trendBg = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
                        } else if (row.trend === "awal") {
                          trendLabel = "✨ Penataran Awal";
                          trendBg = "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold";
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/55 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500">{row.tanggal}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">{row.mapel}</td>
                            <td className="px-4 py-3 text-slate-500">{row.tugas}</td>
                            <td className="px-4 py-3 text-center font-bold font-mono text-slate-600 bg-amber-50/30">{row.kkm}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block text-[9px] uppercase px-2 py-0.5 rounded-lg border ${trendBg}`}>
                                {trendLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded-md border ${
                                scorePass 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-150" 
                                  : "bg-red-50 text-red-800 border-red-150"
                              }`}>
                                {row.nilai}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI EVALUATION REPORT BOARD ACTION BLOCK */}
            <div className="mt-8 border-t-2 border-dashed border-slate-200 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#FAF9F5] border border-amber-200 rounded-xl text-amber-700">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      Catatan dan Evaluasi Guru
                    </h4>
                    <p className="text-[11px] text-slate-400">Deskripsi analisis tindak lanjut, tingkat motivasi, dan bimbingan belajar khusus siswa.</p>
                  </div>
                </div>

                <div className="no-print flex items-center gap-2">
                  {!evaluations[studentReportCard.student.id] && !isEditing && (
                    <>
                      <button
                        onClick={() => {
                          setEditingText("");
                          setIsEditing(true);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-705 bg-white hover:bg-slate-50 font-extrabold text-[11px] cursor-pointer"
                      >
                        Tulis Manual
                      </button>
                      <button
                        onClick={handleGenerateEvaluation}
                        disabled={isGenerating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D3A3A] hover:bg-[#425555] disabled:opacity-50 text-white font-extrabold text-[11px] transition-all duration-150 cursor-pointer shadow-sm shadow-slate-900/10"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#8BA888]" />
                        {isGenerating ? "Menganalisis Nilai..." : "Buatkan Catatan Evaluasi AI"}
                      </button>
                    </>
                  )}

                  {evaluations[studentReportCard.student.id] && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingText(evaluations[studentReportCard.student.id]);
                        setIsEditing(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#2D3A3A] hover:bg-[#425555] text-white text-xs font-black rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      Sunting Catatan
                    </button>
                  )}
                </div>
              </div>

              {/* Display Result or Prompt Box */}
              {errorText && (
                <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-xs text-rose-700 mb-3 flex items-start gap-2">
                  <span className="font-bold">⚠️</span>
                  <p>{errorText}</p>
                </div>
              )}
              {isEditing ? (
                <div className="no-print space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full h-36 p-3 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans text-slate-800"
                    placeholder="Masukkan catatan evaluasi dan saran belajar secara bebas..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        saveEvaluation(studentReportCard.student.id, editingText);
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-[#8BA888] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-600 transition-colors"
                    >
                      Simpan Catatan
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                      }}
                      className="px-3.5 py-2 bg-slate-100 text-slate-605 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : evaluations[studentReportCard.student.id] ? (
                <div className="space-y-3">
                  <div className="p-4 bg-[#FAF9F5] border border-slate-150 rounded-2xl relative">
                    <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                      {evaluations[studentReportCard.student.id]}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center space-y-2 py-6">
                  {isGenerating ? (
                    <div className="space-y-1 animate-pulse">
                      <Bot className="w-8 h-8 text-[#8BA888] mx-auto animate-bounce" />
                      <p className="text-xs font-bold text-slate-600">AI SiswaDigital sedang meneliti riwayat nilai siswa...</p>
                      <p className="text-[10px] text-slate-400">Menghitung rata-rata kelas, membandingkan KKM, dan mengarang catatan...</p>
                    </div>
                  ) : (
                    <>
                      <Bot className="w-8 h-8 text-slate-350 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">Catatan Evaluasi Belum Dibuat</p>
                      <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                        Silakan klik tombol <strong>&quot;Tulis Manual&quot;</strong> atau <strong>&quot;Buatkan Catatan Evaluasi AI&quot;</strong> di atas untuk melengkapi laporan hasil belajar siswa.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ANNOUNCEMENT BOARD EMBED IN INDIVIDUAL REPORT CARD */}
            {(() => {
              const studentKelasId = studentReportCard.student.kelasId;
              const relevantAnns = announcements ? announcements.filter(ann => {
                if (!ann.targetKelasIds || ann.targetKelasIds.length === 0) {
                  return true;
                }
                return ann.targetKelasIds.includes(studentKelasId);
              }) : [];

              return (
                <div className="mt-8 border-t-2 border-dashed border-slate-200 pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-700">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        Papan Pengumuman Kelas & Sekolah
                      </h4>
                      <p className="text-[11px] text-slate-400">Pengumuman akademis resmi yang berkaitan dengan kelas siswa ini.</p>
                    </div>
                  </div>

                  {relevantAnns.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center py-6 text-xs text-slate-400">
                      Tidak ada pengumuman khusus untuk kelas ini saat ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relevantAnns.map((ann) => (
                        <div key={ann.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl relative">
                          <Pin className="w-3.5 h-3.5 text-emerald-600 absolute -top-1.5 -right-1.5 rotate-45 transform" />
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-xs font-bold text-slate-800 tracking-tight leading-snug">{ann.title}</h5>
                              <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-200/60 px-1.5 py-0.5 rounded-lg">{ann.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-605 leading-relaxed whitespace-pre-line font-medium pr-2">{ann.content}</p>
                            <div className="flex items-center gap-1 pt-1.5 text-[9px] text-slate-400 font-semibold border-t border-dotted border-slate-200">
                              <span className="text-[#8BA888]">Pengirim:</span>
                              <span className="text-slate-550 font-bold bg-slate-100/40 px-1 rounded">{ann.authorName}</span>
                              <span className="px-1 text-slate-250">&bull;</span>
                              <span className="font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-bold">{ann.authorCode}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        )}

        {/* 4. VIEW KELAS MATRIX */}
        {activeMode === "KELAS" && classMatrixReport && (
          <div className="space-y-6">
            
            {/* Metas display */}
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2.5">
              <span>DAFTAR MATRIX NILAI KELAS: <strong className="text-slate-800">{classMatrixReport.kelas.namaKelas}</strong></span>
              <span>Diurutkan berdasarkan Rata-Rata</span>
            </div>

            {classMatrixReport.rows.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">Tidak ada siswa terdaftar di dalam kelas ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 divide-x divide-slate-150">
                      <th className="px-4 py-3.5 w-12 text-center">Rank</th>
                      <th className="px-4 py-3.5 w-24 font-semibold">NIS</th>
                      <th className="px-4 py-3.5 font-semibold min-w-[150px]">Nama Siswa</th>
                      
                      {/* Render header per kategori */}
                      {classMatrixReport.categories.map(kat => {
                        const sSubObj = mapel.find(m => m.id === kat.mapelId);
                        return (
                          <th key={kat.id} className="px-3 py-3.5 text-center min-w-[110px] text-[10px] leading-tight font-medium" title={kat.namaKategori}>
                            <p className="font-bold truncate max-w-[110px] text-slate-700">{kat.namaKategori}</p>
                            <span className="text-slate-400 truncate max-w-[110px] block">{sSubObj ? sSubObj.namaMapel : ""}</span>
                          </th>
                        );
                      })}

                      <th className="px-4 py-3.5 text-center w-24 font-bold bg-slate-100 text-slate-700">Rata-Rata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {classMatrixReport.rows.map((row, idx) => {
                      const overallPass = row.avg >= 75;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/55 divide-x divide-slate-150">
                          <td className="px-4 py-2.5 text-center font-bold font-mono text-slate-750">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">{row.nis}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">{row.namaSiswa}</td>
                          
                          {/* Render nilai matching specific category */}
                          {classMatrixReport.categories.map(kat => {
                            const sc = row.grades[kat.id];
                            const isPresent = sc !== undefined;
                            let passClass = "text-slate-400 font-mono";
                            if (isPresent) {
                              passClass = sc >= 75 ? "text-emerald-700 font-bold font-mono bg-emerald-50/20" : "text-red-650 font-bold font-mono bg-red-50/10";
                            }
                            return (
                              <td key={kat.id} className={`px-3 py-2.5 text-center ${passClass}`}>
                                {isPresent ? sc : "-"}
                              </td>
                            );
                          })}

                          <td className={`px-4 py-2.5 text-center font-bold font-mono ${
                            overallPass ? "text-emerald-800 bg-emerald-50/40" : "text-amber-800 bg-amber-50/40"
                          }`}>
                            {row.avg}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Note box showing at printout bottom */}
            <div className="text-[10px] text-slate-400 italic text-left leading-relaxed pt-2">
              * Matrix ini menyajikan perbandingan nilai tugas seluruh siswa secara transparan untuk guru menetapkan kenaikan, kelulusan, dan rekomendasi program remedial KKM.
            </div>

          </div>
        )}

        {/* 5. VIEW ABSENSI KELAS REKAP */}
        {activeMode === "ABSENSI" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Metas display */}
            <div className="flex justify-between items-center text-xs text-slate-550 border-b border-slate-100 pb-2.5">
              <span>DAFTAR REKAP ABSENSI KELAS BULANAN: <strong className="text-slate-800">{kelas.find(k => k.id === searchClassId)?.namaKelas || "-"}</strong></span>
              <span>Periode Bulan: <strong className="text-slate-800">{targetMonth}</strong></span>
            </div>

            {monthlyRecapData.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">Tidak ada data absensi terekam pada rombel dan bulan ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-extrabold uppercase border-b border-slate-200 divide-x divide-slate-150">
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
                        <tr key={row.id} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-150">
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

                {/* Legend helper */}
                <div className="mt-6 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-450 font-semibold border-t border-slate-100 pt-4">
                  <div className="flex gap-4">
                    <span><strong>Keterangan Singkatan:</strong></span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> H = Hadir</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block"></span> S = Sakit</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-400 rounded-full inline-block"></span> I = Izin</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block"></span> A = Alpa</span>
                  </div>
                  <div>
                    * Persentase Kehadiran = (Hadir &divide; Total Sesi Terpilih) &times; 100%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. VIEW KONSOLIDASI KELAS (NILAI + PRESENSI TERPADU) */}
        {activeMode === "KONSOLIDASI" && (() => {
          const selectedClassIdx = kelas.find(k => k.id === searchClassId);
          const classSiswa = siswa.filter(s => s.kelasId === searchClassId);

          return (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center text-xs text-slate-550 border-b border-slate-100 pb-2.5">
                <span>DAFTAR REKAPITULASI KONSOLIDASI KELAS: <strong className="text-slate-800 uppercase">{selectedClassIdx?.namaKelas || "-"}</strong></span>
                <span>Periode Bulan: <strong className="text-slate-800 font-mono">{targetMonth}</strong></span>
              </div>

              {classSiswa.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-12">Tidak ada siswa terdaftar pada kelas ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-200 divide-x divide-slate-150">
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3 w-28">NIS</th>
                        <th className="p-3">Nama Lengkap Siswa</th>
                        <th className="p-3 text-center bg-amber-50 w-24 text-amber-900 font-extrabold">Akademik Avg</th>
                        <th className="p-3 text-center bg-emerald-50 w-12 text-emerald-800 font-black">H</th>
                        <th className="p-3 text-center bg-amber-50 w-12 text-amber-700 font-black">S</th>
                        <th className="p-3 text-center bg-blue-50 w-12 text-blue-700 font-black">I</th>
                        <th className="p-3 text-center bg-rose-50 w-12 text-rose-750 font-black">A</th>
                        <th className="p-3 text-center w-24 text-slate-800 font-black">Kehadiran %</th>
                        <th className="p-3 min-w-[200px]">Catatan Evaluasi / Rekomendasi Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-800">
                      {classSiswa.map((s, idx) => {
                        // Compute average akademis
                        const sPenilaians = penilaian.filter(p => {
                          const katItem = kategori.find(k => k.id === p.kategoriId && k.kelasId === s.kelasId);
                          return !!katItem;
                        });
                        let sum = 0;
                        let count = 0;
                        sPenilaians.forEach(p => {
                          const g = p.grades.find(gr => gr.siswaId === s.id);
                          if (g !== undefined) {
                            sum += g.nilai;
                            count++;
                          }
                        });
                        const currentAvg = count > 0 ? Math.round((sum / count) * 10) / 10 : 100;

                        // Absen tally
                        const sRecords = (absenSiswa || []).filter(a => a.siswaId === s.id);
                        const H = sRecords.filter(a => a.status === "Hadir").length;
                        const S = sRecords.filter(a => a.status === "Sakit").length;
                        const I = sRecords.filter(a => a.status === "Izin").length;
                        const A = sRecords.filter(a => a.status === "Alpa").length;
                        const total = sRecords.length;
                        const pct = total > 0 ? Math.round((H / total) * 100) : 100;

                        let avgColor = "text-emerald-700 bg-emerald-50";
                        if (currentAvg < 75) avgColor = "text-rose-700 bg-rose-50 font-black";

                        let pctColor = "text-emerald-700 font-black";
                        if (pct < 80) pctColor = "text-rose-700 font-black";

                        const evalComment = evaluations[s.id] || "Belum ada rekomendasi belajar.";

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 divide-x divide-slate-150 transition-colors">
                            <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-3 text-slate-500 font-mono">{s.nis}</td>
                            <td className="p-3 font-extrabold text-slate-850">{s.namaSiswa}</td>
                            <td className={`p-3 text-center font-mono font-bold ${avgColor}`}>{currentAvg}</td>
                            <td className="p-3 text-center bg-emerald-50/10 font-bold text-emerald-800">{H}</td>
                            <td className="p-3 text-center bg-amber-50/10 font-bold text-amber-700">{S}</td>
                            <td className="p-3 text-center bg-blue-50/10 font-bold text-blue-700">{I}</td>
                            <td className="p-3 text-center bg-rose-50/10 font-bold text-rose-750">{A}</td>
                            <td className={`p-3 text-center font-mono ${pctColor}`}>{pct}%</td>
                            <td className="p-3 text-slate-600 font-normal leading-relaxed text-[11px] max-w-[300px]">
                              {evalComment}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* Printable Footer Stamp */}
        <div className="mt-16 pt-8 border-t border-slate-150 flex justify-between items-start text-xs hidden print:flex">
          <div>
            <p className="font-semibold text-slate-600">Diketahui oleh,</p>
            <p className="font-bold text-slate-800 mt-12">( _____________________________ )</p>
            <p className="text-[10px] text-slate-400">Kepala Instansi Sekolah / Pengawas Kurikulum</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-600">Dibuat oleh,</p>
            <p className="font-bold text-slate-850 mt-12">( _____________________________ )</p>
            <p className="text-[10px] text-slate-400">Guru Kelas / Administrator Akademik</p>
          </div>
        </div>

      </div>
    </div>
  );
}
