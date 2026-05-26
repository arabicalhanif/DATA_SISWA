import React, { useState } from "react";
import * as XLSX from "xlsx";
import { 
  Shield, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  MessageSquare,
  Search,
  ExternalLink,
  Layers
} from "lucide-react";
import { GuruCode, GuruPiket } from "../types";

interface GuruPiketViewProps {
  guruCodes: GuruCode[];
  guruPiket: GuruPiket[];
  setGuruPiket: React.Dispatch<React.SetStateAction<GuruPiket[]>>;
  userRole: "admin" | "guru" | "wali";
  showNotification: (text: string, type?: "success" | "neutral") => void;
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function GuruPiketView({
  guruCodes,
  guruPiket,
  setGuruPiket,
  userRole,
  showNotification
}: GuruPiketViewProps) {
  // Input Form States for Admin
  const [newHari, setNewHari] = useState("Senin");
  const [selectedTeacherCode, setSelectedTeacherCode] = useState("");
  const [customTeacherName, setCustomTeacherName] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newCatatan, setNewCatatan] = useState("");
  const [statusVal, setStatusVal] = useState<"Standby" | "Tugas Ganti" | "Selesai">("Standby");

  // Filter States
  const [filterHari, setFilterHari] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawBytes = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(rawBytes, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        if (rows.length === 0) {
          showNotification("Beruntung sekali, file Excel terupload melainkan datanya kosong.", "neutral");
          return;
        }

        const importedItems: GuruPiket[] = rows.map((row, idx) => {
          const hariRaw = String(row.hari || row.Hari || "Senin").trim();
          const hariNormalized = (hariRaw.charAt(0).toUpperCase() + hariRaw.slice(1).toLowerCase());
          const hari = (HARI_LIST.includes(hariNormalized) ? hariNormalized : "Senin");
          
          let statusTugas: "Standby" | "Tugas Ganti" | "Selesai" = "Standby";
          const statusRaw = String(row.statusTugas || row.status || "Standby").trim().toLowerCase();
          if (statusRaw.includes("selesai")) {
            statusTugas = "Selesai";
          } else if (statusRaw.includes("ganti") || statusRaw.includes("tugas")) {
            statusTugas = "Tugas Ganti";
          }

          return {
            id: `PIK-${Date.now()}-${idx}-${Math.floor(Math.random() * 100)}`,
            hari,
            namaGuru: String(row.namaGuru || row.nama || row.Nama || `Guru Piket ${idx + 1}`).trim(),
            nohp: String(row.nohp || row.noHp || row.phone || "628123456789").replace(/[^0-9]/g, "").trim(),
            statusTugas,
            areaPiket: String(row.areaPiket || row.area || row.Area || "Seluruh Area Sekolah").trim(),
            catatan: row.catatan || row.keterangan ? String(row.catatan || row.keterangan).trim() : undefined,
          };
        });

        setGuruPiket(prev => [...prev, ...importedItems]);
        showNotification(`Berhasil mengimpor ${importedItems.length} petugas piket dari Excel!`, "success");
      } catch (err: any) {
        showNotification(`Gagal mengimpor file: ${err.message || err}`, "neutral");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          hari: "Senin",
          namaGuru: "Ustadz Abdurrahman, S.Pd.I.",
          nohp: "628123456781",
          areaPiket: "Gedung Utama / Musholla",
          statusTugas: "Standby",
          catatan: "Menjaga kebersihan halaqah pagi"
        },
        {
          hari: "Selasa",
          namaGuru: "Ustadzah Fatimah, S.Pd.",
          nohp: "628123456782",
          areaPiket: "Gerbang Depan Banat",
          statusTugas: "Tugas Ganti",
          catatan: "Mengawal kepulangan siswi"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Guru Piket");
      XLSX.writeFile(wb, "Template_Import_Guru_Piket.xlsx");
      showNotification("Template Excel Guru Piket berhasil diunduh!", "success");
    } catch (err: any) {
      showNotification("Gagal mengunduh template.", "neutral");
    }
  };

  const handleSelectPredefinedTeacher = (code: string) => {
    setSelectedTeacherCode(code);
    const matched = guruCodes.find(g => g.code === code);
    if (matched) {
      setCustomTeacherName(matched.namaGuru);
      setCustomPhone(matched.phoneNumber || "");
    }
  };

  const handleAddPiket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeacherName.trim()) {
      showNotification("Nama guru piket harus ditentukan.", "neutral");
      return;
    }
    if (!customPhone.trim()) {
      showNotification("Nomor telepon WhatsApp pendidik wajib diisi.", "neutral");
      return;
    }

    const newItem: GuruPiket = {
      id: `PIK-${Date.now()}`,
      hari: newHari,
      namaGuru: customTeacherName.trim(),
      nohp: customPhone.replace(/[-\s]/g, "").trim(),
      statusTugas: statusVal,
      areaPiket: newArea.trim() || "Seluruh Area Sekolah",
      catatan: newCatatan.trim() || undefined
    };

    setGuruPiket(prev => [...prev, newItem]);
    showNotification("Roster Guru Piket berhasil didaftarkan!", "success");

    // Clear details
    setCustomTeacherName("");
    setCustomPhone("");
    setNewArea("");
    setNewCatatan("");
    setSelectedTeacherCode("");
  };

  const handleDeletePiket = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapus petugas piket ini?")) {
      setGuruPiket(prev => prev.filter(p => p.id !== id));
      showNotification("Jadwal guru piket telah dihapus.", "neutral");
    }
  };

  const handleUpdateStatusPiket = (id: string, nextStatus: "Standby" | "Tugas Ganti" | "Selesai") => {
    setGuruPiket(prev => prev.map(p => p.id === id ? { ...p, statusTugas: nextStatus } : p));
    showNotification(`Status tugas guru piket diperbarui ke '${nextStatus}'!`, "success");
  };

  // Filtered List
  const filteredPiket = guruPiket.filter(p => {
    const matchesHari = filterHari === "Semua" || p.hari === filterHari;
    const matchesSearch = p.namaGuru.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.areaPiket && p.areaPiket.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesHari && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Jejaring Koordinasi Pengganti</span>
            <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">Portal Roster Guru Piket</h2>
            <p className="text-xs text-slate-500 font-medium">Hubungi ustadz/ustadzah piket siaga untuk koordinasi pengganti apabila berhalangan hadir</p>
          </div>
        </div>

        {userRole === "admin" && (
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleDownloadTemplate}
              type="button"
              className="px-3.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-650 cursor-pointer flex items-center gap-1.5 transition-colors"
              title="Unduh Template Excel Guru Piket"
            >
              📥 Template Excel
            </button>
            <label className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-amber-700 cursor-pointer flex items-center gap-1.5 transition-colors">
              📤 Impor Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Piket List & Filters */}
        <div className={`${userRole === "admin" ? "lg:col-span-8" : "lg:col-span-12"} space-y-6`}>
          
          {/* List Toolbar / Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari guru piket..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-slate-700"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterHari}
                onChange={(e) => setFilterHari(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="Semua">Semua Hari</option>
                {HARI_LIST.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPiket.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-250/50">
                <Shield className="w-12 h-12 stroke-1 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Tidak ada jadwal Guru Piket terekam</p>
                <p className="text-xs text-slate-400 mt-1">Gunakan formulir untuk mendaftarkan jadwal piket sekolah.</p>
              </div>
            ) : (
              filteredPiket.map((p) => {
                const waText = `Assalamu'alaikum ustadz/ustadzah, saya sedang berhalangan hadir mengajar hari ini. Apakah bisa dibantu piket mengajar di kelas saya hari ${p.hari}? Syukron katsiran.`;
                const waUrl = `https://wa.me/${p.nohp.startsWith("62") ? p.nohp : "62" + p.nohp.replace(/^0/, "")}?text=${encodeURIComponent(waText)}`;

                return (
                  <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{p.hari}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          p.statusTugas === "Standby" 
                            ? "bg-amber-50 text-amber-800 border-amber-200" 
                            : p.statusTugas === "Tugas Ganti" 
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200" 
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          ● {p.statusTugas}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-slate-800 text-sm leading-tight">{p.namaGuru}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Area: {p.areaPiket}
                      </p>
                      {p.catatan && (
                        <p className="text-xs text-slate-400 italic bg-amber-50/40 p-1.5 rounded-md border border-amber-100/30">
                          &ldquo;{p.catatan}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* WhatsApp Trigger */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="referrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>

                      <span className="text-[10px] font-mono text-slate-400 font-bold">{p.nohp}</span>

                      {/* Admin extra states toggles */}
                      {userRole === "admin" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdateStatusPiket(p.id, "Tugas Ganti")}
                            className="p-1 hover:bg-indigo-55 hover:text-indigo-650 rounded border border-slate-200 text-[10px] font-bold"
                            title="Tandai Gantikan Kelas"
                          >
                            Ganti
                          </button>
                          <button
                            onClick={() => handleUpdateStatusPiket(p.id, "Selesai")}
                            className="p-1 hover:bg-emerald-55 hover:text-emerald-650 rounded border border-slate-200 text-[10px] font-bold"
                            title="Tandai Selesai"
                          >
                            Klik Selesai
                          </button>
                          <button
                            onClick={() => handleDeletePiket(p.id)}
                            className="p-1 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded border border-slate-200"
                            title="Hapus roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ACTIVE TEACHER DIRECTORY - Accessible to all roles */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Direktori Cepat Kontak Guru Aktif (Informasi WA)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Daftar lengkap guru bahasa arab untuk mempercepat komunikasi antar tenaga pengajar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {guruCodes.filter(g => g.isActive).map((gc) => {
                const phoneHasDigits = gc.phoneNumber || "628123456781";
                const waChatText = `Assalamu'alaikum ${gc.namaGuru}, mohon maaf mengganggu. Saya ingin berkoordinasi terkait proses pembelajaran kelas bahasa arab.`;
                const waUrl = `https://wa.me/${phoneHasDigits}?text=${encodeURIComponent(waChatText)}`;

                return (
                  <div key={gc.code} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{gc.namaGuru}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {userRole === "admin" ? (
                          <span className="text-[9px] font-mono bg-slate-200/85 text-slate-600 px-1.5 py-0.5 rounded font-black">{gc.code}</span>
                        ) : (
                          <span className="text-[9px] font-mono bg-[#8BA888]/15 text-[#718F6E] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Pendidik</span>
                        )}
                        {gc.assignedKelasId && (
                          <span className="text-[9px] text-slate-400 font-medium">Bimbing Walas: {gc.assignedKelasId}</span>
                        )}
                      </div>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="referrer"
                      className="inline-flex items-center justify-between text-[11px] text-emerald-700 hover:text-white bg-white hover:bg-emerald-600 border border-emerald-200 py-1 px-2.5 rounded-lg font-black tracking-wide transition-colors"
                    >
                      <span>Hubungi WA</span>
                      <Phone className="w-3 h-3 text-emerald-500 hover:text-white" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Admin Add Form (Only visible for Admin Role) */}
        {userRole === "admin" && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-b from-amber-50 to-white p-5 rounded-3xl border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                <h3 className="font-display font-black text-slate-800 text-sm">Tambah Roster Guru Piket</h3>
              </div>

              <form onSubmit={handleAddPiket} className="space-y-4 text-xs font-semibold">
                
                {/* Predefined Teachers Dropdown */}
                <div className="space-y-1">
                  <label className="text-slate-550 block">Pilih Guru Dari Sistem:</label>
                  <select
                    value={selectedTeacherCode}
                    onChange={(e) => handleSelectPredefinedTeacher(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-medium text-slate-700"
                  >
                    <option value="">-- Isian Manual / Pilih Guru --</option>
                    {guruCodes.filter(g => g.isActive).map(g => (
                      <option key={g.code} value={g.code}>{g.namaGuru}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Name */}
                <div className="space-y-1">
                  <label className="text-slate-550 block">Nama Lengkap Guru Piket:</label>
                  <input
                    type="text"
                    value={customTeacherName}
                    onChange={(e) => setCustomTeacherName(e.target.value)}
                    placeholder="Nama Lengkap & Gelar..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                  />
                </div>

                {/* Custom Phone */}
                <div className="space-y-1">
                  <label className="text-slate-550 block">No. WhatsApp Aktif (e.g., 628123xxx):</label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="6281xxxxxxxx"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Hari */}
                  <div className="space-y-1">
                    <label className="text-slate-550 block">Hari Tugas:</label>
                    <select
                      value={newHari}
                      onChange={(e) => setNewHari(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                    >
                      {HARI_LIST.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-slate-550 block">status Awal:</label>
                    <select
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                    >
                      <option value="Standby">Standby</option>
                      <option value="Tugas Ganti">Tugas Ganti</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Area */}
                <div className="space-y-1">
                  <label className="text-slate-550 block">Area/Blok Piket Siaga:</label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="e.g. Gedung Utama Lt.1"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                  />
                </div>

                {/* Catatan */}
                <div className="space-y-1">
                  <label className="text-slate-550 block">Catatan Pendukung:</label>
                  <textarea
                    value={newCatatan}
                    onChange={(e) => setNewCatatan(e.target.value)}
                    placeholder="e.g. Siap membackup jam 1-4"
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider py-2.5 rounded-lg transition-all focus:outline-none"
                >
                  Terbitkan Jadwal Piket
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
