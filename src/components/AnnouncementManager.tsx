import React, { useState } from "react";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Pin, 
  X, 
  Calendar, 
  User, 
  Tag,
  CheckCircle2,
  Share2,
  Send
} from "lucide-react";
import { Announcement, Kelas } from "../types";
import { logWhatsAppSent } from "../utils/waLogger";

interface AnnouncementManagerProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  kelas: Kelas[];
  authorName: string;
  authorCode: string;
  showNotification: (text: string, type?: "success" | "neutral") => void;
}

export default function AnnouncementManager({
  announcements,
  setAnnouncements,
  kelas,
  authorName,
  authorCode,
  showNotification
}: AnnouncementManagerProps) {
  // New Announcement states
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newActionLink, setNewActionLink] = useState("");
  const [newExpiredDate, setNewExpiredDate] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTargetAll, setEditTargetAll] = useState(true);
  const [editSelectedKelasIds, setEditSelectedKelasIds] = useState<string[]>([]);
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editActionLink, setEditActionLink] = useState("");
  const [editExpiredDate, setEditExpiredDate] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification("Ukuran gambar maksimal 2MB.", "neutral");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditImageUrl(reader.result as string);
      } else {
        setNewImageUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleClass = (classId: string) => {
    setTargetAll(false);
    setSelectedKelasIds(prev => {
      if (prev.includes(classId)) {
        const next = prev.filter(id => id !== classId);
        if (next.length === 0) {
          setTargetAll(true);
        }
        return next;
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleToggleEditClass = (classId: string) => {
    setEditTargetAll(false);
    setEditSelectedKelasIds(prev => {
      if (prev.includes(classId)) {
        const next = prev.filter(id => id !== classId);
        if (next.length === 0) {
          setEditTargetAll(true);
        }
        return next;
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showNotification("Judul dan Konten pengumuman wajib diisi!", "neutral");
      return;
    }

    if (!targetAll && selectedKelasIds.length === 0) {
      showNotification("Pilih setidaknya satu kelas sasaran atau tandai Semua Kelas!", "neutral");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newAnn: Announcement = {
      id: "ann-" + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: todayStr,
      authorName: authorName,
      authorCode: authorCode,
      targetKelasIds: targetAll ? [] : selectedKelasIds,
      phoneNumber: newPhoneNumber.trim() || undefined,
      actionLink: newActionLink.trim() || undefined,
      imageUrl: newImageUrl || undefined,
      expiredDate: newExpiredDate || undefined
    };

    setAnnouncements(prev => [newAnn, ...prev]);
    setNewTitle("");
    setNewContent("");
    setTargetAll(true);
    setSelectedKelasIds([]);
    setNewPhoneNumber("");
    setNewActionLink("");
    setNewImageUrl("");
    setNewExpiredDate("");
    showNotification("Pengumuman baru berhasil dipublikasikan!", "success");
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
      showNotification("Pengumuman berhasil dihapus.", "neutral");
    }
  };

  const handleStartEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditPhoneNumber(ann.phoneNumber || "");
    setEditActionLink(ann.actionLink || "");
    setEditImageUrl(ann.imageUrl || "");
    setEditExpiredDate(ann.expiredDate || "");
    if (!ann.targetKelasIds || ann.targetKelasIds.length === 0) {
      setEditTargetAll(true);
      setEditSelectedKelasIds([]);
    } else {
      setEditTargetAll(false);
      setEditSelectedKelasIds(ann.targetKelasIds);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      showNotification("Judul dan Konten pengumuman wajib diisi!", "neutral");
      return;
    }

    if (!editTargetAll && editSelectedKelasIds.length === 0) {
      showNotification("Pilih setidaknya satu kelas sasaran atau tandai Semua Kelas!", "neutral");
      return;
    }

    setAnnouncements(prev => prev.map(ann => ann.id === editingId ? {
      ...ann,
      title: editTitle.trim(),
      content: editContent.trim(),
      targetKelasIds: editTargetAll ? [] : editSelectedKelasIds,
      phoneNumber: editPhoneNumber.trim() || undefined,
      actionLink: editActionLink.trim() || undefined,
      imageUrl: editImageUrl || undefined,
      expiredDate: editExpiredDate || undefined
    } : ann));

    setEditingId(null);
    setEditImageUrl("");
    setEditExpiredDate("");
    showNotification("Pengumuman berhasil diperbarui!", "success");
  };

  const handleShareToWAGroup = (ann: Announcement) => {
    // Format announcement content (Requirement 8)
    const formattedText = `📣 *PENGUMUMAN SEKOLAH* 📣\n\n*Judul:* ${ann.title}\n\n${ann.content}\n\n_Oleh: ${ann.authorName}_${ann.actionLink ? `\n\n🔗 *Tautan:* ${ann.actionLink}` : ""}${ann.phoneNumber ? `\n\n📞 *WhatsApp:* ${ann.phoneNumber}` : ""}`;

    // Get group WA link if specifically mapped
    let targetGroupLink = "";
    let firstClassId = "";
    if (ann.targetKelasIds && ann.targetKelasIds.length > 0) {
      try {
        const savedLinks = JSON.parse(localStorage.getItem("siswadigital_wa_group_links") || "{}");
        firstClassId = ann.targetKelasIds[0];
        targetGroupLink = savedLinks[firstClassId] || "";
      } catch {
        targetGroupLink = "";
      }
    }

    // Direct copy to clipboard
    navigator.clipboard.writeText(formattedText);
    showNotification("Isi pengumuman berhasil disalin! Mengalihkan ke WhatsApp...", "success");

    // Audit Log Entry
    const targetClassLabel = firstClassId ? `Grup Rombel` : `Semua Rombel`;
    logWhatsAppSent(
      authorName || "Pendidik Al Hanif",
      authorCode || "GURU",
      "ANNOUNCEMENT_SHARE",
      `Papan Pengumuman (${targetClassLabel})`,
      formattedText
    );

    setTimeout(() => {
      if (targetGroupLink) {
        window.open(targetGroupLink, "_blank");
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`, "_blank");
      }
    }, 1200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-left" id="announcement-manager-root">
      
      {/* COLUMN 1: PUBLISH FORM */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Publikasikan Pengumuman</h3>
              <p className="text-[9.5px] text-slate-400 font-medium">Siarkan pengumuman baru ke halaman utama siswa</p>
            </div>
          </div>

          <form onSubmit={handleAddAnnouncement} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Judul Pengumuman</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Jadwal Libur Semester Ganjil"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Konten / Isi Pengumuman</label>
              <textarea
                required
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Tuliskan detail pengumuman yang jelas dan hangat di sini..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-805 leading-relaxed placeholder-slate-400"
              />
            </div>

            {/* Optional Phone & Action Link fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-150 pt-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">No. Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  placeholder="Contoh: 0812345678"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Link / Tautan Google Form</label>
                <input
                  type="text"
                  value={newActionLink}
                  onChange={(e) => setNewActionLink(e.target.value)}
                  placeholder="Contoh: forms.gle/abc"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Image Upload and Expired Date fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-150 pt-3">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Unggah Gambar / Poster</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                  className="w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-[#8BA888]/15 file:text-[#577354] hover:file:bg-[#8BA888]/25 cursor-pointer"
                />
                {newImageUrl && (
                  <div className="relative mt-2 w-16 h-16 border rounded-lg overflow-hidden group">
                    <img src={newImageUrl} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("")}
                      className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Batas Pengumuman (Selesai)</label>
                <input
                  type="date"
                  value={newExpiredDate}
                  onChange={(e) => setNewExpiredDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Target Classes Selector */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Sasaran Penerima</label>
              
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTargetAll(true);
                    setSelectedKelasIds([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                    targetAll 
                      ? "bg-slate-800 text-white border-slate-800" 
                      : "bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  📢 Semua Kelas
                </button>
                
                {kelas.map(k => {
                  const isSelected = selectedKelasIds.includes(k.id) && !targetAll;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => handleToggleClass(k.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-emerald-650 hover:bg-emerald-700 text-white border-emerald-650" 
                          : "bg-slate-50/50 text-slate-505 border-slate-200/80 hover:bg-slate-100/50"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      {k.namaKelas}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Author Attribution Meta */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[10px] font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8BA888]" />
                <span>Pengirim: <strong className="text-slate-705 font-bold">{authorName}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kode Otoritas: <strong className="text-slate-705 font-bold">{authorCode}</strong></span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/15"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Siarkan Pengumuman
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2 & 3: ARCHIVE & MANAGEMENT LIST */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Arsip Pengumuman Aktif</h3>
                <p className="text-[9.5px] text-slate-400 font-medium">Kelola, sunting, atau hapus pengumuman tersemat</p>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2.5 py-0.5 text-[9.5px] font-bold font-mono">
              {announcements.length} Pengumuman
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px] space-y-3.5">
            {announcements.length === 0 ? (
              <div className="text-center py-16 space-y-1">
                <Pin className="w-8 h-8 text-slate-350 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-500">Papan pengumuman kosong.</p>
                <p className="text-[10px] text-slate-400">Silakan isi formulir kiri untuk menyiarkan pengumuman baru.</p>
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="pt-3.5 first:pt-0 group relative">
                  <div className="bg-slate-50/50 hover:bg-slate-50/80 border border-slate-100/80 rounded-xl p-4 flex flex-col justify-between gap-3 relative transition-colors">
                    <Pin className="w-3.5 h-3.5 text-emerald-600 absolute -top-1.5 -right-1.5 rotate-45 transform" />
                    
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-xs font-extrabold text-slate-800 tracking-tight leading-snug">{ann.title}</h4>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">{ann.date}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium pr-10">{ann.content}</p>

                      {ann.imageUrl && (
                        <div className="my-2.5 max-w-sm rounded-xl overflow-hidden border border-slate-200">
                          <img src={ann.imageUrl} alt="Poster pengumuman" className="w-full max-h-48 object-cover" />
                        </div>
                      )}

                      {/* Phone/WhatsApp & Links Meta Preview */}
                      {(ann.phoneNumber || ann.actionLink || ann.expiredDate) && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ann.phoneNumber && (
                            <span className="bg-[#25D366]/10 text-[#128C7E] text-[10px] font-bold px-2 py-0.5 rounded border border-[#25D366]/20 flex items-center gap-1">
                              📞 WhatsApp: {ann.phoneNumber}
                            </span>
                          )}
                          {ann.actionLink && (
                            <span className="bg-[#8BA888]/10 text-[#577354] text-[10px] font-bold px-2 py-0.5 rounded border border-[#8BA888]/20 flex items-center gap-1 truncate max-w-[200px]">
                              🔗 Tautan: {ann.actionLink}
                            </span>
                          )}
                          {ann.expiredDate && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-150 flex items-center gap-1">
                              ⏳ Batas Tampil: {ann.expiredDate}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Target Classes Badge Section */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wide mr-1 select-none">Penerima:</span>
                        {!ann.targetKelasIds || ann.targetKelasIds.length === 0 ? (
                          <span className="bg-amber-50 text-amber-850 text-[9px] font-black px-2 py-0.5 rounded border border-amber-200/50 uppercase tracking-widest">
                            📢 Semua Kelas
                          </span>
                        ) : (
                          ann.targetKelasIds.map(cid => {
                            const foundClass = kelas.find(k => k.id === cid);
                            return (
                              <span key={cid} className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.8 py-0.4 rounded border border-emerald-150">
                                {foundClass ? foundClass.namaKelas : "Kelas Terhapus"}
                              </span>
                            );
                          })
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 font-semibold text-[9.5px] text-slate-400 border-t border-dotted border-slate-200">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#8BA888]" />
                          Oleh: <strong className="text-slate-650 font-bold">{ann.authorName}</strong>
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[9px] text-slate-500 font-extrabold">{ann.authorCode}</span>
                      </div>
                    </div>

                    {/* Action buttons (Only shows actions if the author is self or current operator has admin authority) */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => handleShareToWAGroup(ann)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-[#128C7E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors mr-auto"
                        title="Bagikan Pengumuman ini ke Grup WhatsApp Kelas"
                      >
                        <Share2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        Share ke Grup WA
                      </button>

                      <button
                        onClick={() => handleStartEdit(ann)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-amber-705 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        Sunting
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-left" id="edit-announcement-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4.5 h-4.5 text-[#8BA888]" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Kemaskinikan Pengumuman</h3>
              </div>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Konten / Isi Pengumuman</label>
                <textarea
                  required
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium text-slate-805 leading-relaxed"
                />
              </div>

              {/* Edit optional Phone & Link fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-150 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-bold">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-bold">Link / Tautan Isian</label>
                  <input
                    type="text"
                    value={editActionLink}
                    onChange={(e) => setEditActionLink(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Edit Image Upload & Expired Date fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-150 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-bold">Ubah Gambar / Poster</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    className="w-full text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-semibold file:bg-[#8BA888]/15 file:text-[#577354] hover:file:bg-[#8BA888]/25 cursor-pointer"
                  />
                  {editImageUrl && (
                    <div className="relative mt-2 w-16 h-16 border rounded-lg overflow-hidden group">
                      <img src={editImageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditImageUrl("")}
                        className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-bold">Ubah Batas Kadaluarsa</label>
                  <input
                    type="date"
                    value={editExpiredDate}
                    onChange={(e) => setEditExpiredDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Edit Target Classes Selection */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-[10px] font-extrabold text-[#2D3A3A] uppercase tracking-widest block">Sasaran Penerima</label>
                
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetAll(true);
                      setEditSelectedKelasIds([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                      editTargetAll 
                        ? "bg-slate-800 text-white border-slate-800" 
                        : "bg-slate-50 text-slate-550 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    📢 Semua Kelas
                  </button>
                  
                  {kelas.map(k => {
                    const isSelected = editSelectedKelasIds.includes(k.id) && !editTargetAll;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => handleToggleEditClass(k.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isSelected 
                            ? "bg-emerald-650 hover:bg-emerald-700 text-white border-emerald-650" 
                            : "bg-slate-50/50 text-slate-505 border-slate-200/80 hover:bg-slate-100/50"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        {k.namaKelas}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
