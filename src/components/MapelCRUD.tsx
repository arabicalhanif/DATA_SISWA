import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, Book, X, AlertOctagon } from "lucide-react";
import { MataPelajaran, KategoriPenilaian } from "../types";

interface MapelCRUDProps {
  mapel: MataPelajaran[];
  kategori: KategoriPenilaian[];
  onAdd: (newMapel: Omit<MataPelajaran, "id">) => void;
  onUpdate: (updatedMapel: MataPelajaran) => void;
  onDelete: (id: string) => void;
}

export default function MapelCRUD({ mapel, kategori, onAdd, onUpdate, onDelete }: MapelCRUDProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [namaMapel, setNamaMapel] = useState("");
  const [kkm, setKkm] = useState<number>(75);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredMapel = mapel.filter(m => 
    m.namaMapel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setIsEditing(null);
    setNamaMapel("");
    setKkm(75);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEdit = (m: MataPelajaran) => {
    setIsEditing(m.id);
    setNamaMapel(m.namaMapel);
    setKkm(m.kkm || 75);
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMapel.trim()) {
      setErrorMessage("Nama mata pelajaran tidak boleh kosong.");
      return;
    }

    // Check duplicate
    const duplicated = mapel.some(m => 
      m.namaMapel.toLowerCase().trim() === namaMapel.toLowerCase().trim() && 
      m.id !== isEditing
    );

    if (duplicated) {
      setErrorMessage("Nama mata pelajaran ini sudah ada!");
      return;
    }

    if (isEditing) {
      onUpdate({
        id: isEditing,
        namaMapel: namaMapel.trim(),
        kkm: kkm
      });
    } else {
      onAdd({
        namaMapel: namaMapel.trim(),
        kkm: kkm
      });
    }

    setShowModal(false);
  };

  const handleDeleteWithWarning = (id: string, name: string) => {
    // Check if there are assessment categories using this mapel
    const categoryCount = kategori.filter(k => k.mapelId === id).length;
    let confirmMsg = `Apakah Anda yakin ingin menghapus mata pelajaran '${name}'?`;
    if (categoryCount > 0) {
      confirmMsg = `⚠️ Peringatan: Mata pelajaran '${name}' masih digunakan di dalam ${categoryCount} Kategori Penilaian/Tugas. Menghapus mata pelajaran ini akan ikut menghapus seluruh kategori penilaian dan lembar nilai terkait. Apakah Anda yakin ingin melanjutkan?`;
    }

    if (confirm(confirmMsg)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Kurikulum Nasional
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Daftar Mata Pelajaran (Mapel)</h2>
          <p className="text-sm text-slate-500">
            Daftarkan materi bidang kajian utama yang diajarkan pada lembaga sekolah ini.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 active:translate-y-0.5 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-yellow-150 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mapel</span>
        </button>
      </div>

      {/* Control Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata pelajaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:bg-white transition-all duration-150 text-slate-700"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-end px-1">
          Menampilkan <strong className="text-slate-700 mx-1">{filteredMapel.length}</strong> mapel dari total <strong className="text-slate-700 mx-1">{mapel.length}</strong>
        </div>
      </div>

      {/* Table & List View */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">No</th>
                <th className="px-6 py-4.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Kode Mapel</th>
                <th className="px-6 py-4.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Mata Pelajaran</th>
                <th className="px-6 py-4.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">KKM</th>
                <th className="px-6 py-4.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMapel.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Book className="w-10 h-10 stroke-1 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">Tidak ada mata pelajaran ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredMapel.map((m, index) => {
                  return (
                    <tr key={m.id} className="hover:bg-slate-55/35 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{index + 1}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 font-mono">{m.id}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">{m.namaMapel}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold font-mono border border-yellow-200">
                          {m.kkm || 75}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-500 hover:text-yellow-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Mapel"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWithWarning(m.id, m.namaMapel)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Mapel"
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

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-800">
                {isEditing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Matematika, Pemrograman Web"
                  value={namaMapel}
                  onChange={(e) => setNamaMapel(e.target.value)}
                  maxLength={50}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:bg-white transition-all duration-150 text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  KKM (Kriteria Ketuntasan Minimal) *
                </label>
                <input
                  type="number"
                  placeholder="75"
                  value={kkm}
                  onChange={(e) => setKkm(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-yellow-500 focus:bg-white transition-all duration-150 text-slate-805 font-mono text-center font-bold"
                  min={1}
                  max={100}
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
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-xs font-semibold text-white rounded-lg transition-all shadow-sm"
                >
                  {isEditing ? "Simpan Perubahan" : "Simpan Mapel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
