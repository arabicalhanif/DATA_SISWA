import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  ClipboardCheck, 
  Save, 
  Undo,
  Search,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Download,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { Penilaian, KategoriPenilaian, Kelas, MataPelajaran, Siswa, SiswaNilai } from "../types";

interface PenilaianFormProps {
  penilaian: Penilaian[];
  kategori: KategoriPenilaian[];
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  onAdd: (newPenilaian: Omit<Penilaian, "id">) => void;
  onUpdate: (updatedPenilaian: Penilaian) => void;
  onDelete: (id: string) => void;
  onAddKategori?: (val: Omit<KategoriPenilaian, "id">) => KategoriPenilaian;
}

export default function PenilaianForm({
  penilaian,
  kategori,
  kelas,
  mapel,
  siswa,
  onAdd,
  onUpdate,
  onDelete,
  onAddKategori
}: PenilaianFormProps) {
  // Navigation State
  const [activeView, setActiveView] = useState<"LIST" | "FORM">("LIST");
  const [editingPenilaianId, setEditingPenilaianId] = useState<string | null>(null);

  // Form State
  const [tanggal, setTanggal] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [studentGradesList, setStudentGradesList] = useState<SiswaNilai[]>([]);
  const [umumkanWali, setUmumkanWali] = useState(true);
  
  // Inline category creation state
  const [showAddNewKategoriInline, setShowAddNewKategoriInline] = useState(false);
  const [inlineNamaKategori, setInlineNamaKategori] = useState("");
  const [inlineKelasId, setInlineKelasId] = useState("");
  const [inlineMapelId, setInlineMapelId] = useState("");

  // Quick bulk fill tool state
  const [bulkGradeVal, setBulkGradeVal] = useState<string>("");

  // Error & warning messages
  const [errorText, setErrorText] = useState("");

  // List search term
  const [listSearch, setListSearch] = useState("");

  // Auto-set default date on mount or when opening form
  const resetForm = () => {
    const today = new Date().toISOString().substring(0, 10);
    setTanggal(today);
    setKategoriId("");
    setStudentGradesList([]);
    setUmumkanWali(true);
    setEditingPenilaianId(null);
    setBulkGradeVal("");
    setErrorText("");
    setShowAddNewKategoriInline(false);
    setInlineNamaKategori("");
    setInlineKelasId("");
    setInlineMapelId("");
  };

  const handleCreateKategoriInline = () => {
    setErrorText("");
    if (!inlineNamaKategori.trim()) {
      setErrorText("Nama kategori tugas wajib diisi!");
      return;
    }
    if (!inlineKelasId) {
      setErrorText("Pilih Kelas peserta terlebih dahulu!");
      return;
    }
    if (!inlineMapelId) {
      setErrorText("Pilih Mata Pelajaran terkait!");
      return;
    }

    if (onAddKategori) {
      const newKat = onAddKategori({
        namaKategori: inlineNamaKategori.trim(),
        kelasId: inlineKelasId,
        mapelId: inlineMapelId
      });
      if (newKat) {
        setKategoriId(newKat.id);
        setShowAddNewKategoriInline(false);
        setInlineNamaKategori("");
        setInlineKelasId("");
        setInlineMapelId("");
      }
    } else {
      setErrorText("Sistem tidak mengizinkan penambahan kategori tugas saat ini.");
    }
  };

  const handleOpenNewForm = () => {
    resetForm();
    if (kategori.length > 0) {
      // Default to first category
      setKategoriId(kategori[0].id);
    }
    setActiveView("FORM");
  };

  // When category changes in the form, automatically pull corresponding students
  useEffect(() => {
    if (!kategoriId) {
      setStudentGradesList([]);
      return;
    }

    const selectedKat = kategori.find(k => k.id === kategoriId);
    if (!selectedKat) return;

    // Find class of this category
    const targetClassId = selectedKat.kelasId;
    
    // Find all students in this class
    const studentsInClass = siswa.filter(s => s.kelasId === targetClassId);

    // If editing existing, retain their saved grades, otherwise initialize to 80 (standard) or 0
    if (editingPenilaianId) {
      const activeSheet = penilaian.find(p => p.id === editingPenilaianId);
      if (activeSheet && activeSheet.kategoriId === kategoriId) {
        const initialList = studentsInClass.map(st => {
          const preScore = activeSheet.grades.find(g => g.siswaId === st.id);
          return {
            siswaId: st.id,
            nilai: preScore ? preScore.nilai : 80
          };
        });
        setStudentGradesList(initialList);
        return;
      }
    }

    // Default list populated to empty score/80
    const initialList = studentsInClass.map(st => ({
      siswaId: st.id,
      nilai: 80 // Reasonable typical base score
    }));
    setStudentGradesList(initialList);
  }, [kategoriId, editingPenilaianId, kategori, siswa, penilaian]);

  // Load draft for editing
  const handleOpenEdit = (p: Penilaian) => {
    setEditingPenilaianId(p.id);
    setTanggal(p.tanggal);
    setKategoriId(p.kategoriId);
    setUmumkanWali(p.umumkanWali !== false);
    // Student grades loaded inside the useEffect hook above
    setErrorText("");
    setActiveView("FORM");
  };

  // Grade numeric change verification
  const handleGradeChange = (siswaId: string, valStr: string) => {
    let cleanVal = parseInt(valStr);
    if (isNaN(cleanVal)) cleanVal = 0;
    if (cleanVal < 0) cleanVal = 0;
    if (cleanVal > 100) cleanVal = 100;

    setStudentGradesList(prev => 
      prev.map(g => g.siswaId === siswaId ? { ...g, nilai: cleanVal } : g)
    );
  };

  // Bulk Apply Grade
  const handleBulkApply = () => {
    const numericVal = parseInt(bulkGradeVal);
    if (isNaN(numericVal) || numericVal < 0 || numericVal > 100) {
      setErrorText("Masukkan nilai sah antara 0 sampai 100!");
      return;
    }
    setErrorText("");
    setStudentGradesList(prev => prev.map(g => ({ ...g, nilai: numericVal })));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download Excel Template for Students of the selected Class
  const handleDownloadTemplate = () => {
    setErrorText("");
    if (!kategoriId) {
      setErrorText("Silakan tentukan Kategori Penilaian/Tugas terlebih dahulu untuk mengekspor template kelas!");
      return;
    }

    const activeKatObj = kategori.find(k => k.id === kategoriId);
    const resolvedCls = kelas.find(c => c.id === activeKatObj?.kelasId);
    const className = resolvedCls ? resolvedCls.namaKelas : "Kelas";
    const taskName = activeKatObj ? activeKatObj.namaKategori : "Tugas";

    const rows = studentGradesList.map((item, idx) => {
      const sObj = siswa.find(st => st.id === item.siswaId);
      return {
        "No": idx + 1,
        "NIS": sObj ? sObj.nis : "",
        "Nama Siswa": sObj ? sObj.namaSiswa : "",
        "Nilai": item.nilai
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Input Nilai");
    XLSX.writeFile(workbook, `Template_Nilai_${className}_${taskName.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
  };

  // Upload and parse Excel grade values
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorText("");
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rawRows.length === 0) {
          setErrorText("File Excel kosong atau format kolom tidak sesuai!");
          return;
        }

        let updatedCount = 0;
        const newList = [...studentGradesList];

        rawRows.forEach((row: any) => {
          // Identify NIS or Student Name from row
          const nisFromFile = String(row["NIS"] || row["nis"] || "").trim();
          const nameFromFile = String(row["Nama Siswa"] || row["nama siswa"] || row["Nama"] || row["nama"] || "").trim().toLowerCase();
          
          let scoreVal = row["Nilai"] !== undefined ? row["Nilai"] : row["nilai"];
          const scoreFromFile = parseInt(scoreVal);

          if (isNaN(scoreFromFile)) return;

          // Search matching student index
          const studentIndex = newList.findIndex(item => {
            const sObj = siswa.find(st => st.id === item.siswaId);
            if (!sObj) return false;
            if (nisFromFile && sObj.nis.trim() === nisFromFile) return true;
            if (nameFromFile && sObj.namaSiswa.trim().toLowerCase() === nameFromFile) return true;
            return false;
          });

          if (studentIndex !== -1) {
            newList[studentIndex] = {
              ...newList[studentIndex],
              nilai: Math.min(100, Math.max(0, scoreFromFile))
            };
            updatedCount++;
          }
        });

        setStudentGradesList(newList);
        alert(`Berhasil mengimpor ${updatedCount} data nilai siswa dari file Excel!`);
      } catch (err) {
        console.error(err);
        setErrorText("Gagal membaca file Excel. Harap pastikan format file .xlsx/.xls tepat dan memiliki kolom NIS/Nama Siswa serta Nilai!");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Submit Penilaian
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!tanggal) {
      setErrorText("Silakan tentukan Tanggal Pengumpulan Tugas!");
      return;
    }
    if (!kategoriId) {
      setErrorText("Silakan tentukan Kategori Penilaian/Tugas siswa!");
      return;
    }
    if (studentGradesList.length === 0) {
      setErrorText("Tidak ada data siswa aktif yang terdaftar untuk kelas dari kategori tugas terpilih.");
      return;
    }

    // Prepare content
    const preparedGrades = studentGradesList.map(g => ({
      siswaId: g.siswaId,
      nilai: Number(g.nilai)
    }));

    if (editingPenilaianId) {
      onUpdate({
        id: editingPenilaianId,
        tanggal,
        kategoriId,
        grades: preparedGrades,
        umumkanWali
      });
    } else {
      onAdd({
        tanggal,
        kategoriId,
        grades: preparedGrades,
        umumkanWali
      });
    }

    setActiveView("LIST");
    resetForm();
  };

  // Search filter for lists
  const filteredPenilaian = useMemo(() => {
    return penilaian.filter(p => {
      const kat = kategori.find(k => k.id === p.kategoriId);
      if (!kat) return false;
      
      const kl = kelas.find(c => c.id === kat.kelasId);
      const mp = mapel.find(m => m.id === kat.mapelId);

      const combinedText = [
        kat.namaKategori,
        p.tanggal,
        kl?.namaKelas || "",
        mp?.namaMapel || ""
      ].join(" ").toLowerCase();

      return combinedText.includes(listSearch.toLowerCase());
    });
  }, [penilaian, kategori, kelas, mapel, listSearch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Lembar Penilaian Guru
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Pemberian Nilai Siswa</h2>
          <p className="text-sm text-slate-500">
            Isi, edit, dan awasi perolehan nilai tugas berdasarkan lembar kelas penugasan siswa.
          </p>
        </div>

        {activeView === "LIST" && (
          <button
            onClick={handleOpenNewForm}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-teal-150 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Isi Penilaian Baru</span>
          </button>
        )}
      </div>

      {/* VIEW 1: ASSESSMENT LISTS TABLE */}
      {activeView === "LIST" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Cari penilaian berdasarkan tanggal, tugas, atau kelas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-all text-slate-700"
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-end">
              Merekam <strong className="text-slate-700 mx-1">{filteredPenilaian.length}</strong> lembar penilaian
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-55/35 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas & Mapel</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori / Nama Tugas</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Peserta</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Rata-Rata</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPenilaian.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <ClipboardCheck className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-medium">Tidak ada lembar penilaian terekam</p>
                        <p className="text-xs text-slate-400 mt-1">Silakan klik &lsquo;Isi Penilaian Baru&rsquo; untuk memulai pemberian nilai ke siswa.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPenilaian.map((p) => {
                      const kat = kategori.find(k => k.id === p.kategoriId);
                      const resolvedClass = kelas.find(c => c.id === kat?.kelasId);
                      const resolvedMapel = mapel.find(m => m.id === kat?.mapelId);

                      // Calculate mean score
                      const gradesSum = p.grades.reduce((sum, g) => sum + g.nilai, 0);
                      const meanScore = p.grades.length > 0 ? Math.round((gradesSum / p.grades.length) * 10) / 10 : 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 text-xs font-semibold font-mono text-slate-600 flex items-center gap-1.5 mt-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {p.tanggal}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <p className="font-bold text-slate-800">{resolvedClass?.namaKelas || "Kelas Terhapus"}</p>
                            <span className="text-slate-400 text-[10px] font-mono">{resolvedMapel?.namaMapel || "Mapel Terhapus"}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {kat ? kat.namaKategori : "Kategori Terhapus"}
                          </td>
                          <td className="px-6 py-4 text-xs text-center font-mono font-medium text-slate-600">
                            <strong>{p.grades.length}</strong> siswa
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                              meanScore >= 75 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {meanScore}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="px-2.5 py-1 text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 transition-colors text-xs font-semibold rounded-md border border-slate-200"
                                title="Edit nilai"
                              >
                                Edit Nilai
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Apakah anda yakin ingin menghapus seluruh rekaman nilai pada tugas ini?")) {
                                    onDelete(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                                title="Hapus seluruh nilai lembar ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DYNAMIC ASSESSMENT INPUT FORM */}
      {activeView === "FORM" && (
        <form onSubmit={handleSaveAssessment} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-display font-bold text-slate-800">
                  {editingPenilaianId ? "Halaman Sunting Nilai" : "Menginput Nilai Tugas Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("LIST")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
              >
                <Undo className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            </div>

            {errorText && (
              <div className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-lg border border-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorText}</span>
              </div>
            )}

            {/* Step 1: Meta Attributes Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 p-4.5 rounded-xl border border-slate-100">
              
              {/* Tanggal Terkumpul */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Pengumpulan Tugas *
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 font-mono text-slate-800 cursor-pointer"
                  required
                />
              </div>

              {/* Kategori/Tugas Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tugas / Kategori Penilaian *
                  </label>
                  {!editingPenilaianId && !showAddNewKategoriInline && onAddKategori && (
                    <button
                      type="button"
                      onClick={() => setShowAddNewKategoriInline(true)}
                      className="text-[10px] text-teal-600 hover:text-teal-800 font-extrabold flex items-center gap-1 uppercase bg-transparent"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Kategori Baru</span>
                    </button>
                  )}
                </div>

                {editingPenilaianId ? (
                  // Lock category to prevent data mismatch during editing since class membership depends on it
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-medium">
                    {(() => {
                      const katObj = kategori.find(k => k.id === kategoriId);
                      const classObj = kelas.find(c => c.id === katObj?.kelasId);
                      const mapelObj = mapel.find(m => m.id === katObj?.mapelId);
                      return `${katObj?.namaKategori || ""} - [${classObj?.namaKelas || ""} • ${mapelObj?.namaMapel || ""}]`;
                    })()}
                  </div>
                ) : showAddNewKategoriInline ? (
                  <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-150 space-y-3">
                    <p className="text-[10px] font-black text-[#577354] uppercase tracking-wider">Inline + Tambah Kategori Baru</p>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nama Tugas, e.g. Kuis 3 Al Hiwar"
                        value={inlineNamaKategori}
                        onChange={(e) => setInlineNamaKategori(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-850"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={inlineKelasId}
                          onChange={(e) => setInlineKelasId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 cursor-pointer"
                        >
                          <option value="">-- Pilih Kelas --</option>
                          {kelas.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKelas}</option>
                          ))}
                        </select>
                        <select
                          value={inlineMapelId}
                          onChange={(e) => setInlineMapelId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 cursor-pointer"
                        >
                          <option value="">-- Pilih Mapel --</option>
                          {mapel.map(m => (
                            <option key={m.id} value={m.id}>{m.namaMapel}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateKategoriInline}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide cursor-pointer flex-1"
                      >
                        Pasang Kategori
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddNewKategoriInline(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={kategoriId}
                    onChange={(e) => setKategoriId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 text-slate-800 cursor-pointer text-ellipsis overflow-hidden"
                    required
                  >
                    <option value="" disabled>-- Pilih Kategori Tugas --</option>
                    {kategori.map(kat => {
                      const correspondingClass = kelas.find(c => c.id === kat.kelasId);
                      const correspondingMapel = mapel.find(m => m.id === kat.mapelId);
                      return (
                        <option key={kat.id} value={kat.id}>
                          [{correspondingClass?.namaKelas || "Kelas Terhapus"} - {correspondingMapel?.namaMapel || "Mapel Terhapus"}] {kat.namaKategori}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

            </div>

            {/* Notification Control for Parents */}
            <div className="bg-amber-50/60 border border-amber-200/50 p-4.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 select-none">
                  🔔 Pengaturan Publikasi Wali Murid
                </span>
                <p className="text-[11px] text-amber-805 leading-relaxed font-medium">
                  Bila diaktifkan, hasil pencatatan nilai latihan/ujian ini dicantumkan pada Portal Rapor Wali Murid. Matikan ini jika belum ingin dipublikasikan.
                </p>
              </div>
              <label className="flex items-center gap-2.5 bg-white border border-slate-200 hover:border-teal-500/50 px-4 py-2.5 rounded-xl cursor-pointer select-none transition-all shadow-3xs hover:bg-teal-50/10">
                <input
                  type="checkbox"
                  checked={umumkanWali}
                  onChange={(e) => setUmumkanWali(e.target.checked)}
                  className="w-4.5 h-4.5 text-teal-600 border-slate-350 rounded focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <span className="text-xs font-bold text-slate-750">Publikasikan Rapor</span>
              </label>
            </div>

            {/* List of affected students & grade input row */}
            {kategoriId && (
              <div className="space-y-4 pt-2">
                
                {/* Section Header with Bulk Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-dashed border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      Pengisian Nilai Anggota Kelas: {" "}
                      <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full text-xs font-bold">
                        {(() => {
                          const activeKatObj = kategori.find(k => k.id === kategoriId);
                          const resolvedCls = kelas.find(c => c.id === activeKatObj?.kelasId);
                          return resolvedCls ? resolvedCls.namaKelas : "";
                        })()}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Tuliskan nilai dari rentang 0 hingga 100.</p>
                  </div>

                  {/* Bulk grade application tool */}
                  <div className="flex items-center gap-1.5 self-end">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                      Set massal semua:
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 85"
                      min={0}
                      max={100}
                      value={bulkGradeVal}
                      onChange={(e) => setBulkGradeVal(e.target.value)}
                      className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold text-center focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleBulkApply}
                      className="bg-slate-800 text-white hover:bg-slate-900 border border-transparent rounded px-2.5 py-1 text-xs font-semibold select-none transition-colors"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                {/* Excel tools integration */}
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/55 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="p-2.5 bg-emerald-100/70 border border-emerald-200/50 text-emerald-700 rounded-xl">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">Ekspor &amp; Impor Nilai Via Excel</h5>
                      <p className="text-[10px] text-slate-500 max-w-md leading-relaxed">Unduh template berisi daftar siswa kelas ini, tuliskan perolehan nilai mereka di Excel, lalu unggah kembali untuk pengisian instan.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50/50 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-150"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Unduh Daftar Siswa kelas (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer select-none transition-all duration-150 uppercase tracking-wide text-[11px]"
                    >
                      <Upload className="w-4 h-4 text-emerald-200" />
                      <span>Unggah Nilai</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleExcelImport}
                      accept=".xlsx, .xls"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Table list */}
                {studentGradesList.length === 0 ? (
                  <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 text-center text-amber-800 text-xs flex flex-col items-center gap-2">
                    <span>⚠️ Tidak ditemukan siswa aktif di dalam kelas ini. Daftarkan siswa ke kelas ini terlebih dahulu di halaman &quot;Siswa&quot; sebelum dapat memberi nilai!</span>
                  </div>
                ) : (
                  <>
                    {/* Desktop layout: Table */}
                    <div className="hidden sm:block border border-slate-150 rounded-xl overflow-hidden bg-white max-h-[420px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-100">
                            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">NIS/NISN</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap Siswa</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32 text-center">KKM (75)</th>
                            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40 text-right">Nilai Siswa (0-100)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentGradesList.map((item, idx) => {
                            const sObj = siswa.find(st => st.id === item.siswaId);
                            const isPassed = item.nilai >= 75;

                            return (
                              <tr key={item.siswaId} className="hover:bg-slate-50/50">
                                <td className="px-5 py-2.5 text-xs text-center font-mono text-slate-400">{idx + 1}</td>
                                <td className="px-5 py-2.5 text-xs font-semibold font-mono text-slate-600">{sObj ? sObj.nis : "-"}</td>
                                <td className="px-5 py-2.5 text-sm font-semibold text-slate-800">{sObj ? sObj.namaSiswa : "Siswa Terhapus"}</td>
                                <td className="px-5 py-2.5 text-center">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isPassed 
                                      ? "bg-emerald-50 text-emerald-750 border border-emerald-150" 
                                      : "bg-red-50 text-red-700 border border-red-150"
                                  }`}>
                                    {isPassed ? "TUNTAS" : "REMEDIAL"}
                                  </span>
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                  <div className="flex justify-end items-center gap-1.5">
                                    {/* Slider visual helper */}
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="100" 
                                      step="1"
                                      value={item.nilai} 
                                      onChange={(e) => handleGradeChange(item.siswaId, e.target.value)}
                                      className="hidden sm:block w-24 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={item.nilai}
                                      onChange={(e) => handleGradeChange(item.siswaId, e.target.value)}
                                      className={`w-18 bg-slate-50 border rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-center focus:outline-none focus:bg-white transition-all ${
                                        isPassed 
                                          ? "text-emerald-700 border-slate-200 focus:border-teal-500 bg-white" 
                                          : "text-red-700 border-red-200 focus:border-rose-500 bg-red-50/10 font-bold"
                                      }`}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Touch-optimized Card Layout for Mobile devices */}
                    <div className="block sm:hidden space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {studentGradesList.map((item, idx) => {
                        const sObj = siswa.find(st => st.id === item.siswaId);
                        const isPassed = item.nilai >= 75;

                        return (
                          <div key={item.siswaId} className="bg-[#FAF9F5] border border-slate-200 p-4 rounded-2xl relative flex flex-col justify-between shadow-3xs hover:border-teal-505 transition-all space-y-3">
                            <div className="flex items-start justify-between gap-1">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold font-mono text-slate-400">NO. {idx + 1} &bull; NIS {sObj ? sObj.nis : "-"}</span>
                                <h4 className="text-xs font-black text-slate-905">{sObj ? sObj.namaSiswa : "Siswa Terhapus"}</h4>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                isPassed 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-150" 
                                  : "bg-red-50 text-red-700 border-red-150"
                              }`}>
                                {isPassed ? "Tuntas" : "Remedial"}
                              </span>
                            </div>

                            {/* Scoring Interaction Area */}
                            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60 flex-wrap">
                              {/* Quick click preset scores */}
                              <div className="flex gap-1 flex-wrap">
                                {[75, 80, 85, 90, 100].map(pScore => (
                                  <button
                                    key={pScore}
                                    type="button"
                                    onClick={() => handleGradeChange(item.siswaId, String(pScore))}
                                    className={`px-2 py-1 rounded text-[10px] font-black tracking-wide border cursor-pointer active:scale-95 transition-all ${
                                      item.nilai === pScore 
                                        ? "bg-teal-600 text-white border-transparent" 
                                        : "bg-white text-slate-650 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {pScore}
                                  </button>
                                ))}
                              </div>

                              {/* Stepper controls */}
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleGradeChange(item.siswaId, String(Math.max(0, item.nilai - 5)))}
                                  className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 active:scale-95 cursor-pointer text-xs"
                                >
                                  -5
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={item.nilai}
                                  onChange={(e) => handleGradeChange(item.siswaId, e.target.value)}
                                  className="w-13 h-7 bg-white border border-slate-200 font-mono font-black text-xs text-center focus:outline-none rounded-lg focus:border-teal-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleGradeChange(item.siswaId, String(Math.min(100, item.nilai + 5)))}
                                  className="w-7 h-7 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 active:scale-95 cursor-pointer text-xs"
                                >
                                  +5
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
              <span className="text-xs text-slate-400">
                📌 Catatan: Selalu pastikan seluruh nilai terisi dengan valid sebelum menekan tombol simpan.
              </span>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveView("LIST")}
                  className="px-4.5 py-2 border border-slate-250 text-slate-500 hover:bg-slate-55 block rounded-lg text-xs font-semibold bg-white transition-colors cursor-pointer border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={studentGradesList.length === 0}
                  className={`flex items-center gap-1.5 px-6 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md cursor-pointer ${
                    studentGradesList.length === 0 
                      ? "bg-slate-300 cursor-not-allowed shadow-none" 
                      : "bg-teal-600 hover:bg-teal-700 shadow-teal-100"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingPenilaianId ? "Simpan Perubahan Nilai" : "Simpan Nilai Siswa"}</span>
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

    </div>
  );
}
