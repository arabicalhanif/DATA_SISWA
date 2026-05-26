import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, ClipboardList, X, AlertOctagon, Filter } from "lucide-react";
import { KategoriPenilaian, Kelas, MataPelajaran, Penilaian } from "../types";

interface KategoriCRUDProps {
  kategori: KategoriPenilaian[];
  kelas: Kelas[];
  mapel: MataPelajaran[];
  penilaian: Penilaian[];
  onAdd: (newKategori: Omit<KategoriPenilaian, "id">) => void;
  onUpdate: (updatedKategori: KategoriPenilaian) => void;
  onDelete: (id: string) => void;
}

export default function KategoriCRUD({ 
  kategori, 
  kelas, 
  mapel, 
  penilaian, 
  onAdd, 
  onUpdate, 
  onDelete 
}: KategoriCRUDProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>("ALL");
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [namaKategori, setNamaKategori] = useState(""); // Kategori/Tugas
  const [errorMessage, setErrorMessage] = useState("");
  const [allClasses, setAllClasses] = useState(false);

  const filteredKategori = kategori.filter(k => {
    const matchesSearch = k.namaKategori.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === "ALL" || k.kelasId === selectedClassFilter;
    const matchesMapel = selectedMapelFilter === "ALL" || k.mapelId === selectedMapelFilter;
    return matchesSearch && matchesClass && matchesMapel;
  });

  const handleOpenAdd = () => {
    setIsEditing(null);
    setKelasId(kelas.length > 0 ? kelas[0].id : "");
    setMapelId(mapel.length > 0 ? mapel[0].id : "");
    setNamaKategori("");
    setErrorMessage("");
    setAllClasses(false);
    setShowModal(true);
  };

  const handleOpenEdit = (kat: KategoriPenilaian) => {
    setIsEditing(kat.id);
    setKelasId(kat.kelasId);
    setMapelId(kat.mapelId);
    setNamaKategori(kat.namaKategori);
    setErrorMessage("");
    setAllClasses(false);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allClasses && !kelasId) {
      setErrorMessage("Silakan pilih Kelas target.");
      return;
    }
    if (!mapelId) {
      setErrorMessage("Silakan pilih Mata Pelajaran.");
      return;
    }
    if (!namaKategori.trim()) {
      setErrorMessage("Nama Kategori/Tugas tidak boleh kosong.");
      return;
    }

    if (isEditing) {
      // Check duplicate in same Class and Subject
      const duplicate = kategori.some(kat => 
        kat.kelasId === kelasId && 
        kat.mapelId === mapelId &&
        kat.namaKategori.toLowerCase().trim() === namaKategori.toLowerCase().trim() &&
        kat.id !== isEditing
      );

      if (duplicate) {
        setErrorMessage("Kategori/Tugas dengan nama yang sama sudah ada di kelas dan mapel ini!");
        return;
      }

      onUpdate({
        id: isEditing,
        kelasId,
        mapelId,
        namaKategori: namaKategori.trim()
      });
    } else {
      if (allClasses) {
        let addedCount = 0;
        kelas.forEach(kl => {
          const duplicate = kategori.some(kat => 
            kat.kelasId === kl.id && 
            kat.mapelId === mapelId &&
            kat.namaKategori.toLowerCase().trim() === namaKategori.toLowerCase().trim()
          );
          if (!duplicate) {
            onAdd({
              kelasId: kl.id,
              mapelId,
              namaKategori: namaKategori.trim()
            });
            addedCount++;
          }
        });
      } else {
        const duplicate = kategori.some(kat => 
          kat.kelasId === kelasId && 
          kat.mapelId === mapelId &&
          kat.namaKategori.toLowerCase().trim() === namaKategori.toLowerCase().trim()
        );

        if (duplicate) {
          setErrorMessage("Kategori/Tugas dengan nama yang sama sudah ada di kelas dan mapel ini!");
          return;
        }

        onAdd({
          kelasId,
          mapelId,
          namaKategori: namaKategori.trim()
        });
      }
    }

    setShowModal(false);
  };

  const handleDeleteWithWarning = (id: string, name: string) => {
    // Check if there is actual input grades referencing this category in penilaian list
    const assessmentWithGrades = penilaian.filter(p => p.kategoriId === id);
    let confirmMsg = `Apakah Anda yakin ingin menghapus kategori tugas '${name}'?`;
    if (assessmentWithGrades.length > 0) {
      confirmMsg = `⚠️ Peringatan: Kategori '${name}' sudah diisi nilai tugas oleh guru (ada ${assessmentWithGrades.length} rekaman lembar penilaian). Menghapus kategori ini akan ikut menghapus seluruh lembar nilai terkait. Apakah Anda yakin ingin melanjutkan?`;
    }

    if (confirm(confirmMsg)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Komponen Penilaian
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Kategori Penilaian / Tugas</h2>
          <p className="text-sm text-slate-500">
            Definisikan daftar tugas, ulangan harian, proyek, ujian, atau praktek untuk masing-masing kelas & mata pelajaran.
          </p>
        </div>
        
        {kelas.length === 0 || mapel.length === 0 ? (
          <div className="text-xs bg-red-55 border border-red-100 text-red-700 px-4 py-2.5 rounded-lg font-medium">
            ⚠️ Buat Kelas & Mapel Terlebih Dahulu!
          </div>
        ) : (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-rose-550 hover:bg-rose-600 active:translate-y-0.5 text-white text-xs font-semibold px-4 py-2.5 rounded-lg bg-rose-500 transition-all duration-200 shadow-sm shadow-rose-150 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori/Tugas</span>
          </button>
        )}
      </div>

      {/* Control Filters */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama Kategori/Tugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-rose-550 focus:bg-white focus:border-rose-500 transition-all text-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-rose-500 text-slate-700"
            >
              <option value="ALL">Semua Kelas</option>
              {kelas.map(k => (
                <option key={k.id} value={k.id}>{k.namaKelas}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedMapelFilter}
              onChange={(e) => setSelectedMapelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium focus:outline-none focus:border-rose-500 text-slate-700"
            >
              <option value="ALL">Semua Mapel</option>
              {mapel.map(m => (
                <option key={m.id} value={m.id}>{m.namaMapel}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori / Nama Tugas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKategori.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <ClipboardList className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium">Tidak ada kategori penilaian ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Ganti kriteria pencarian atau buat Kategori/Tugas baru.</p>
                  </td>
                </tr>
              ) : (
                filteredKategori.map((k, index) => {
                  const resolvedClass = kelas.find(kl => kl.id === k.kelasId);
                  const resolvedMapel = mapel.find(mp => mp.id === k.mapelId);
                  return (
                    <tr key={k.id} className="hover:bg-slate-55/35 transition-colors">
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">{index + 1}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">{k.namaKategori}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
                        {resolvedClass ? resolvedClass.namaKelas : "Kelas Terhapus"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-105">
                          {resolvedMapel ? resolvedMapel.namaMapel : "Mapel Terhapus"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(k)}
                            className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit kategori"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWithWarning(k.id, k.namaKategori)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus kategori"
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

      {/* Modal CRUD Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden my-8">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-800">
                {isEditing ? "Edit Kategori / Tugas" : "Tambah Kategori / Tugas"}
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

              {/* All Classes or Single Class Selector */}
              {!isEditing && (
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-105 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="allClasses"
                    checked={allClasses}
                    onChange={(e) => {
                      setAllClasses(e.target.checked);
                      if (e.target.checked) setKelasId("ALL");
                      else setKelasId(kelas.length > 0 ? kelas[0].id : "");
                    }}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 accent-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="allClasses" className="text-xs font-bold text-rose-950 cursor-pointer select-none">
                      Berikan tugas ini ke SEMUA KELAS sekaligus
                    </label>
                    <p className="text-[10px] text-rose-800 leading-normal mt-0.5">
                      Check ini untuk mengandandakan pembuatan tugas ke seluruh rombel kelas yang ada di sistem secara massal.
                    </p>
                  </div>
                </div>
              )}

              {/* Kelas (only if NOT adding to all classes simultaneously) */}
              {!allClasses && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Kelas Rombel *
                  </label>
                  <select
                    value={kelasId}
                    onChange={(e) => setKelasId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all text-slate-800 cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Pilih Kelas --</option>
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKelas}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih kelas tempat tugas/penilaian ini akan diberikan kepada seluruh anggotanya.
                  </p>
                </div>
              )}

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Mata Pelajaran *
                </label>
                <select
                  value={mapelId}
                  onChange={(e) => setMapelId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all text-slate-800 cursor-pointer"
                  required
                >
                  <option value="" disabled>-- Pilih Mata Pelajaran --</option>
                  {mapel.map(m => (
                    <option key={m.id} value={m.id}>{m.namaMapel}</option>
                  ))}
                </select>
              </div>

              {/* Kategori/Tugas */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Kategori / Nama Tugas atau Pembahasan *
                </label>
                
                {/* Predefined Assessment Presets */}
                <div className="mb-2.5 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Pintasan Kategori Penilaian:</span>
                  <div className="flex flex-wrap gap-1 md:gap-1.5">
                    {[
                      "Ulangan Harian (UH)",
                      "Sumatif Tengah Semester (STS)",
                      "Sumatif Akhir Semester (SAS)",
                      "Ulangan Lain (Praktek/Proyek)"
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNamaKategori(preset)}
                        className="px-2 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-150 transition-colors cursor-pointer shrink-0"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Contoh: Tugas 1 - Persamaan Aljabar, UTS, UAS"
                  value={namaKategori}
                  onChange={(e) => setNamaKategori(e.target.value)}
                  maxLength={100}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-rose-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
                  required
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
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white rounded-lg transition-all shadow-sm"
                >
                  {isEditing ? "Simpan Perubahan" : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
