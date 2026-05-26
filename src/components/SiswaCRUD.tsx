import React, { useState, useMemo, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Users, X, AlertOctagon, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Siswa, Kelas, Penilaian } from "../types";

interface SiswaCRUDProps {
  siswa: Siswa[];
  kelas: Kelas[];
  penilaian: Penilaian[];
  onAdd: (newSiswa: Omit<Siswa, "id">) => void;
  onUpdate: (updatedSiswa: Siswa) => void;
  onDelete: (id: string) => void;
}

export default function SiswaCRUD({ siswa, kelas, penilaian, onAdd, onUpdate, onDelete }: SiswaCRUDProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [nis, setNis] = useState("");
  const [namaSiswa, setNamaSiswa] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [namaWali, setNamaWali] = useState("");
  const [noHpWali, setNoHpWali] = useState("");
  const [alamatSiswa, setAlamatSiswa] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reset page number on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClassFilter]);

  const filteredSiswa = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    // Cache class names for speed
    const classMap = new Map<string, string>();
    kelas.forEach(k => classMap.set(k.id, k.namaKelas));

    return siswa.filter(s => {
      const clsName = classMap.get(s.kelasId) || "";
      // Also support searching parent name, NIS, or Class Name
      const matchesSearch = s.namaSiswa.toLowerCase().includes(term) || 
                            s.nis.includes(term) ||
                            (s.namaWali && s.namaWali.toLowerCase().includes(term)) ||
                            clsName.toLowerCase().includes(term);
      const matchesClass = selectedClassFilter === "ALL" || s.kelasId === selectedClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [siswa, kelas, searchTerm, selectedClassFilter]);

  const paginatedSiswa = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSiswa.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSiswa, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);

  const handleOpenAdd = () => {
    setIsEditing(null);
    setNis("");
    setNamaSiswa("");
    setNamaWali("");
    setNoHpWali("");
    setAlamatSiswa("");
    // Default to the first class if available
    setKelasId(kelas.length > 0 ? kelas[0].id : "");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEdit = (s: Siswa) => {
    setIsEditing(s.id);
    setNis(s.nis);
    setNamaSiswa(s.namaSiswa);
    setKelasId(s.kelasId);
    setNamaWali(s.namaWali || "");
    setNoHpWali(s.noHpWali || "");
    setAlamatSiswa(s.alamatSiswa || "");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      setErrorMessage("NIS/NISN tidak boleh kosong.");
      return;
    }
    if (!namaSiswa.trim()) {
      setErrorMessage("Nama siswa tidak boleh kosong.");
      return;
    }
    if (!kelasId) {
      setErrorMessage("Silakan pilih Kelas siswa!");
      return;
    }

    // Check duplicate NIS
    const pinDuplicate = siswa.some(s => 
      s.nis.toLowerCase().trim() === nis.toLowerCase().trim() && 
      s.id !== isEditing
    );

    if (pinDuplicate) {
      setErrorMessage("NIS/NISN ini sudah digunakan oleh siswa lain!");
      return;
    }

    if (isEditing) {
      onUpdate({
        id: isEditing,
        nis: nis.trim(),
        namaSiswa: namaSiswa.trim(),
        kelasId: kelasId,
        namaWali: namaWali.trim(),
        noHpWali: noHpWali.replace(/[^0-9]/g, "").trim(), // sanitise phone
        alamatSiswa: alamatSiswa.trim()
      });
    } else {
      onAdd({
        nis: nis.trim(),
        namaSiswa: namaSiswa.trim(),
        kelasId: kelasId,
        namaWali: namaWali.trim(),
        noHpWali: noHpWali.replace(/[^0-9]/g, "").trim(), // sanitise phone
        alamatSiswa: alamatSiswa.trim()
      });
    }

    setShowModal(false);
  };

  const handleDeleteWithWarning = (id: string, name: string) => {
    // Check if there are assessments/grades given to this student
    let scoresCount = 0;
    penilaian.forEach(p => {
      p.grades.forEach(g => {
        if (g.siswaId === id) scoresCount++;
      });
    });

    if (scoresCount > 0) {
      if (!confirm(`Warning: Siswa ${name} memiliki ${scoresCount} data nilai tersimpan di sistem. Menghapus siswa akan menghapus seluruh data pencapaian nilainya dari sistem penilaian. Apakah Anda yakin?`)) {
        return;
      }
    } else {
      if (!confirm(`Apakah Anda yakin ingin menghapus siswa '${name}'?`)) {
        return;
      }
    }

    onDelete(id);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Manajemen Data
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Daftar Siswa Aktif</h2>
          <p className="text-sm text-slate-500">
            Kelola data pokok siswa, termasuk Nomor Induk Siswa (NIS/NISN) dan penempatan kelas.
          </p>
        </div>
        
        {kelas.length === 0 ? (
          <div className="text-xs bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-lg font-medium">
            ⚠️ Buat Kelas Terlebih Dahulu!
          </div>
        ) : (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-emerald-150 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        )}
      </div>

      {/* Controls Container */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari NIS atau Nama Siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-700"
          />
        </div>

        {/* Filter on Class */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 text-slate-700"
          >
            <option value="ALL">Semua Kelas</option>
            {kelas.map(k => (
              <option key={k.id} value={k.id}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students List View */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">NIS/NISN</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap Siswa</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Kelas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">Tidak ada siswa yang ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Ganti filter kelas atau tambahkan data siswa baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedSiswa.map((s, index) => {
                  const resolvedClass = kelas.find(k => k.id === s.kelasId);
                  const consecutiveNo = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={s.id} className="hover:bg-slate-55/35 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{consecutiveNo}</td>
                      <td className="px-6 py-3.5 text-xs font-semibold font-mono text-slate-700 bg-slate-50/50">{s.nis}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">{s.namaSiswa}</td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {resolvedClass ? resolvedClass.namaKelas : "Tanpa Kelas / Kelas Terhapus"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWithWarning(s.id, s.namaSiswa)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-55 rounded-lg transition-colors"
                            title="Hapus siswa"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4.5 bg-slate-50/50 border-t border-slate-150">
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredSiswa.length)}</span> dari <span className="font-bold text-slate-700">{filteredSiswa.length}</span> siswa
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Double Left */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-white transition-all cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-white transition-all cursor-pointer"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers Indicator */}
              <div className="flex items-center gap-1 text-xs">
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                  // Generate neat page window around currentPage
                  let targetPageNum = 1;
                  if (totalPages <= 5) {
                    targetPageNum = index + 1;
                  } else if (currentPage <= 3) {
                    targetPageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    targetPageNum = totalPages - 4 + index;
                  } else {
                    targetPageNum = currentPage - 2 + index;
                  }

                  const isSelected = targetPageNum === currentPage;
                  return (
                    <button
                      key={targetPageNum}
                      type="button"
                      onClick={() => setCurrentPage(targetPageNum)}
                      className={`px-3 py-1.5 border rounded-lg font-mono font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-emerald-600 border-emerald-600 text-white" 
                          : "border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:text-emerald-600"
                      }`}
                    >
                      {targetPageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-white transition-all cursor-pointer"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Double Right */}
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-white transition-all cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal CRUD Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-800">
                {isEditing ? "Edit Data Siswa" : "Tambahkan Siswa Baru"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* NIS/NISN */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nomor Induk Siswa (NIS/NISN) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 240101, 23091102"
                  value={nis}
                  onChange={(e) => setNis(e.target.value.replace(/\D/g, ""))} // Limit to numbers
                  maxLength={15}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-mono"
                  required
                />
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Nasution"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  maxLength={80}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kelas (Rombel) *
                </label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Pilih Tingkatan Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.namaKelas}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Siswa akan otomatis terkelompokkan ke dalam rekapitulasi nilai kelas yang bersangkutan.
                </p>
              </div>

              {/* Nama Wali Murid */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Orang Tua / Wali Murid
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Gunawan"
                  value={namaWali}
                  onChange={(e) => setNamaWali(e.target.value)}
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* No HP Wali Murid */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  No. WhatsApp Wali Murid (e.g. 6281234567)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 628123456789 atau 08123456789"
                  value={noHpWali}
                  onChange={(e) => setNoHpWali(e.target.value)}
                  maxLength={16}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>

              {/* Alamat Siswa */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat Tempat Tinggal Siswa
                </label>
                <textarea
                  placeholder="Contoh: Perumahan PCI Blok B3, Cilegon"
                  value={alamatSiswa}
                  onChange={(e) => setAlamatSiswa(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-sans"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-lg transition-all shadow-sm"
                >
                  {isEditing ? "Simpan Perubahan" : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
