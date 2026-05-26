import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, GraduationCap, X, AlertOctagon } from "lucide-react";
import { Kelas, Siswa } from "../types";

interface KelasCRUDProps {
  kelas: Kelas[];
  siswa: Siswa[];
  onAdd: (newKelas: Omit<Kelas, "id">) => void;
  onUpdate: (updatedKelas: Kelas) => void;
  onDelete: (id: string) => void;
}

export default function KelasCRUD({ kelas, siswa, onAdd, onUpdate, onDelete }: KelasCRUDProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [namaKelas, setNamaKelas] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredKelas = kelas.filter(k => 
    k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.deskripsi && k.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setIsEditing(null);
    setNamaKelas("");
    setDeskripsi("");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleOpenEdit = (k: Kelas) => {
    setIsEditing(k.id);
    setNamaKelas(k.namaKelas);
    setDeskripsi(k.deskripsi || "");
    setErrorMessage("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) {
      setErrorMessage("Nama kelas tidak boleh kosong.");
      return;
    }

    // Check duplicate name
    const matchesDuplicate = kelas.some(k => 
      k.namaKelas.toLowerCase().trim() === namaKelas.toLowerCase().trim() && 
      k.id !== isEditing
    );

    if (matchesDuplicate) {
      setErrorMessage("Nama kelas ini sudah terdaftar!");
      return;
    }

    if (isEditing) {
      onUpdate({
        id: isEditing,
        namaKelas: namaKelas.trim(),
        deskripsi: deskripsi.trim()
      });
    } else {
      onAdd({
        namaKelas: namaKelas.trim(),
        deskripsi: deskripsi.trim()
      });
    }

    setShowModal(false);
  };

  const handleDeleteWithWarning = (id: string, name: string) => {
    // Check if class has students inside
    const studentCount = siswa.filter(s => s.kelasId === id).length;
    let confirmMsg = `Apakah Anda yakin ingin menghapus kelas ${name}?`;
    if (studentCount > 0) {
      confirmMsg = `⚠️ Peringatan: Masih ada ${studentCount} siswa terdaftar di kelas ini. Menghapus kelas akan mengosongkan status kelas siswa tersebut, serta menghapus seluruh kategori ujian terhubung. Apakah Anda yakin ingin melanjutkan menghapus kelas ${name}?`;
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
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Pengaturan Rombel
          </span>
          <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">Daftar Kelas (Rombongan Belajar)</h2>
          <p className="text-sm text-slate-500">
            Kelola data tingkatan kelas dan fokus penjurusan atau rombel belajar siswa.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 shadow-sm shadow-indigo-200 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
        </button>
      </div>

      {/* Control Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas berdasar nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-150 text-slate-700"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-end px-1">
          Menampilkan <strong className="text-slate-700 mx-1">{filteredKelas.length}</strong> kelas dari total <strong className="text-slate-700 mx-1">{kelas.length}</strong>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKelas.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">Tidak ada kelas yang ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci Anda atau daftarkan kelas baru.</p>
          </div>
        ) : (
          filteredKelas.map((k) => {
            const numSiswa = siswa.filter(s => s.kelasId === k.id).length;
            return (
              <div 
                key={k.id} 
                className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-display font-bold text-lg text-slate-800 tracking-tight">
                      {k.namaKelas}
                    </span>
                    <span className="bg-slate-100 text-slate-600 font-medium text-[10px] px-2 py-0.5 rounded-full uppercase">
                      Class ID: {k.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed min-h-[32px]">
                    {k.deskripsi || "Tidak ada deskripsi singkat."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md">
                    🧑‍🎓 <strong className="text-indigo-600">{numSiswa}</strong> Siswa
                  </span>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(k)}
                      title="Edit kelas"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWithWarning(k.id, k.namaKelas)}
                      title="Hapus kelas"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal CRUD Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="font-display font-bold text-slate-800">
                {isEditing ? "Edit Data Kelas" : "Daftarkan Kelas Baru"}
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: X RPL 1, XI TKJ 2, XII MM"
                  value={namaKelas}
                  onChange={(e) => setNamaKelas(e.target.value)}
                  maxLength={40}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-150 text-slate-800 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  placeholder="Tulis informasi singkat mengenai pendukung rombel ini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-150 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white rounded-lg transition-all shadow-sm"
                >
                  {isEditing ? "Simpan Perubahan" : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
