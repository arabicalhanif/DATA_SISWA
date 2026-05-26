import React, { useState } from "react";
import { 
  Award, 
  Plus, 
  Trash2, 
  X, 
  Calendar, 
  Link as LinkIcon, 
  Phone, 
  User, 
  Sparkles, 
  Image as ImageIcon,
  ChevronRight,
  Share2
} from "lucide-react";
import { KegiatanEkstra } from "../types";

interface KegiatanEkstraViewProps {
  kegiatan: KegiatanEkstra[];
  setKegiatan: React.Dispatch<React.SetStateAction<KegiatanEkstra[]>>;
  userRole: "admin" | "guru" | "wali" | null;
  activeSiswaNama?: string;
  showNotification: (text: string, type?: "success" | "neutral") => void;
}

export default function KegiatanEkstraView({
  kegiatan,
  setKegiatan,
  userRole,
  activeSiswaNama,
  showNotification
}: KegiatanEkstraViewProps) {
  const [newNama, setNewNama] = useState("");
  const [newDeskripsi, setNewDeskripsi] = useState("");
  const [newTanggal, setNewTanggal] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newWa, setNewWa] = useState("");
  const [newPic, setNewPic] = useState("");
  const [newFlyer, setNewFlyer] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // File Upload logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      showNotification("Ukuran flyer melebihi batasan 3MB!", "neutral");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewFlyer(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newDeskripsi.trim() || !newWa.trim()) {
      showNotification("Nama, deskripsi, dan nomor WA wajib diisi!", "neutral");
      return;
    }

    // Sanitize WA number
    let cleanWa = newWa.replace(/\D/g, "");
    if (cleanWa.startsWith("0")) {
      cleanWa = "62" + cleanWa.slice(1);
    } else if (!cleanWa.startsWith("62") && cleanWa.length > 5) {
      cleanWa = "62" + cleanWa;
    }

    const newActivity: KegiatanEkstra = {
      id: `EXT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      namaKegiatan: newNama.trim(),
      deskripsi: newDeskripsi.trim(),
      tanggalKegiatan: newTanggal || undefined,
      flyerImage: newFlyer || undefined,
      linkPendaftaran: newLink.trim() || undefined,
      contactNoWa: cleanWa,
      contactNama: newPic.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0]
    };

    setKegiatan(prev => {
      const next = [...prev, newActivity];
      localStorage.setItem("PSD_KEGIATAN_EKSTRA", JSON.stringify(next));
      return next;
    });

    showNotification("Kegiatan Ekstra & Acara luar biasa berhasil diterbitkan!", "success");
    
    // Clear inputs
    setNewNama("");
    setNewDeskripsi("");
    setNewTanggal("");
    setNewLink("");
    setNewWa("");
    setNewPic("");
    setNewFlyer("");
    setIsAdding(false);
  };

  const handleDeleteActivity = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kegiatan "${name}"?`)) {
      setKegiatan(prev => {
        const next = prev.filter(k => k.id !== id);
        localStorage.setItem("PSD_KEGIATAN_EKSTRA", JSON.stringify(next));
        return next;
      });
      showNotification("Kegiatan berhasil dihapus.", "neutral");
    }
  };

  const handleShareToWA = (item: KegiatanEkstra) => {
    const formattedDate = item.tanggalKegiatan 
      ? new Date(item.tanggalKegiatan).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : "Segera Hadir";
      
    const textMsg = `*📢 INFO ACARA & KEGIATAN EKSTRA SEKOLAH*
*Kegiatan:* ${item.namaKegiatan}
*Tanggal Pelaksanaan:* ${formattedDate}

${item.deskripsi}

${item.linkPendaftaran ? `*Link Registrasi:* ${item.linkPendaftaran}` : ""}
*Kontak Person:* ${item.contactNama || "Panitia"} (wa.me/${item.contactNoWa})

_Yuk daftarkan ananda sekalian untuk menambah wawasan dan keterampilan pendukung! Syukron katsiran._`;

    navigator.clipboard.writeText(textMsg).then(() => {
      showNotification("Teks pengumuman acara berhasil disalin ke clipboard!", "success");
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`;
      window.open(waUrl, "_blank");
    }).catch(() => {
      showNotification("Gagal menyalin teks otomatis.", "neutral");
    });
  };

  const filteredKegiatan = kegiatan.filter(
    k => k.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
         k.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-[#2D3A3A]/5 to-teal-50/20 p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2D3A3A] text-white flex items-center justify-center shadow-lg">
              <Award className="w-5 h-5 text-[#8BA888]" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm tracking-tight uppercase">Acara & Kegiatan Ekstra</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ekstrakurikuler, Perlombaan, & Kegiatan Pengembangan Siswa</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="text"
            placeholder="Cari kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 font-medium w-full sm:w-48 shadow-2xs"
          />
          {userRole === "admin" && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAdding ? "Batal" : "Upload Acara"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Upload Form */}
      {isAdding && userRole === "admin" && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-md space-y-4 max-w-xl animate-scaleUp">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Terbitkan Brosur / Kegiatan Baru</h4>
          </div>

          <form onSubmit={handleCreateActivity} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kegiatan / Acara</label>
                <input
                  type="text"
                  required
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Ekstrakurikuler Memanah Berkuda"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Pelaksanaan (Opsional)</label>
                <input
                  type="date"
                  value={newTanggal}
                  onChange={(e) => setNewTanggal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Deskripsi Detail & Informasi Tambahan</label>
              <textarea
                required
                value={newDeskripsi}
                onChange={(e) => setNewDeskripsi(e.target.value)}
                placeholder="Rincikan mengenai persyaratan, jadwal latihan, biaya (jika ada), serta faedah mengikuti kegiatan ini..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Flyer Brosur Gambar (Maks 3MB)</label>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="px-4 py-2 border border-slate-350 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer select-none flex items-center gap-1.5 shrink-0">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Pilih Flyer Gambar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <div className="min-w-0 flex-1">
                  {newFlyer ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 truncate bg-emerald-50 px-2 py-1 rounded-md block">✓ Flyer berhasil dimuat</span>
                      <button 
                        type="button" 
                        onClick={() => setNewFlyer("")}
                        className="text-[10px] text-red-500 hover:underline font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Format file gambar (.png, .jpg, .jpeg) disarankan</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Link Pendaftaran / G-Form (Opsional)</label>
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://forms.gle/..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">No. WA PIC Kontak</label>
                  <input
                    type="text"
                    required
                    value={newWa}
                    onChange={(e) => setNewWa(e.target.value)}
                    placeholder="628123456789"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama PIC</label>
                  <input
                    type="text"
                    value={newPic}
                    onChange={(e) => setNewPic(e.target.value)}
                    placeholder="Ust. Yazid"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#2D3A3A] hover:bg-[#425555] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Terbitkan Brosur Kegiatan
            </button>
          </form>
        </div>
      )}

      {/* Grid Display of Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredKegiatan.length === 0 ? (
          <div className="col-span-full bg-white p-16 text-center rounded-3xl border border-slate-150 shadow-sm text-slate-400 italic">
            <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <span className="text-xs">Belum ada rincian kegiatan ekstra atau perlombaan aktif saat ini.</span>
          </div>
        ) : (
          filteredKegiatan.map((item) => {
            const dateFormatted = item.tanggalKegiatan 
              ? new Date(item.tanggalKegiatan).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : null;
            const introMsg = `Assalamu'alaikum wr. wb. Kak/Ust. ${item.contactNama || "PIC"}, saya ingin menanyakan lebih lanjut mengenai kegiatan *"${item.namaKegiatan}"* yang diunggah di portal SiswaDigital.`;
            const waUrl = `https://wa.me/${item.contactNoWa}?text=${encodeURIComponent(introMsg)}`;
            
            return (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Image flyer banner container */}
                {item.flyerImage ? (
                  <div className="h-52 w-full rouned-t-3xl overflow-hidden border-b border-slate-100 relative group bg-slate-50">
                    <img 
                      src={item.flyerImage} 
                      alt={item.namaKegiatan} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-[#2D3A3A]/90 backdrop-blur-xs text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                      BROSUR RESMI
                    </div>
                  </div>
                ) : (
                  <div className="h-44 w-full bg-gradient-to-br from-slate-50 to-teal-50 border-b border-slate-105 flex flex-col items-center justify-center p-6 text-center shrink-0">
                    <Award className="w-12 h-12 text-[#2D3A3A]/20 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SISWADIGITAL INTERACTIVE EVT</span>
                  </div>
                )}

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 tracking-tight leading-sm">{item.namaKegiatan}</h4>
                    
                    {dateFormatted && (
                      <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50 border border-teal-100 py-1 px-2.5 rounded-lg w-max font-semibold text-[10px]">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{dateFormatted}</span>
                      </div>
                    )}

                    <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans font-medium line-clamp-4 whitespace-pre-line">
                      {item.deskripsi}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <div className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center font-bold text-slate-700">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="truncate">PIC: <strong>{item.contactNama || "Panitia"}</strong> ({item.contactNoWa})</span>
                    </div>

                    <div className="flex gap-2">
                      {item.linkPendaftaran && (
                        <a
                          href={item.linkPendaftaran}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 text-center text-[10px] font-black bg-[#2D3A3A] hover:bg-[#425555] text-white border border-[#2D3A3A] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm shadow-[#2D3A3A]/10 uppercase"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Daftar Kegiatan
                        </a>
                      )}
                      
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 text-center text-[10px] font-bold bg-emerald-55 hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-150 hover:border-emerald-250 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer uppercase"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" /> Tanya WA
                      </a>

                      {(userRole === "admin" || userRole === "guru") && (
                        <button
                          onClick={() => handleShareToWA(item)}
                          className="p-2 border border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Share Brosur ke Group WA"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {userRole === "admin" && (
                        <button
                          onClick={() => handleDeleteActivity(item.id, item.namaKegiatan)}
                          className="p-2 bg-red-500/10 hover:bg-red-50 border border-red-500/15 text-red-600 rounded-xl transition-all cursor-pointer"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
