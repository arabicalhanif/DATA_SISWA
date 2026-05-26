import React, { useState } from "react";
import { Calendar, Plus, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "academic" | "exam" | "holiday" | "event";
  description: string;
}

interface AcademicCalendarProps {
  userRole: "admin" | "guru" | "wali" | null;
  showNotification?: (msg: string, type?: "success" | "neutral") => void;
}

export default function AcademicCalendar({ userRole, showNotification }: AcademicCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("PSD_ACADEMIC_CALENDAR");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "ev-1",
        title: "Ujian Akhir Semester Ganjil 1447 H / 2026",
        date: "2026-06-01",
        endDate: "2026-06-12",
        type: "exam",
        description: "Evaluasi tertulis & lisan komprehensif mata pelajaran Bahasa Arab harian."
      },
      {
        id: "ev-2",
        title: "Pembagian Rapor Semester Ganjil",
        date: "2026-06-19",
        type: "academic",
        description: "Pertemuan wali murid tatap muka dengan guru kelas masing-masing."
      },
      {
        id: "ev-3",
        title: "Libur Akhir Semester Ganjil",
        date: "2026-06-20",
        endDate: "2026-07-05",
        type: "holiday",
        description: "Hari libur resmi siswa pasca ujian semester ganjil."
      },
      {
        id: "ev-4",
        title: "Hari Pertama Masuk Semester Genap",
        date: "2026-07-06",
        type: "academic",
        description: "Permulaan proses belajar mengajar (KBM) kitab Bahasa Arab jilid terbaru."
      },
      {
        id: "ev-5",
        title: "Kuis Mufradat Akbar Nasional",
        date: "2026-05-28",
        type: "event",
        description: "Lomba cerdas cermat hafalan mufrodat antar kelas di lapangan SDIT."
      }
    ];
  });

  const saveEventsToStorage = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem("PSD_ACADEMIC_CALENDAR", JSON.stringify(updated));
  };

  // Admin CRUD Modal Trigger States
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");
  const [modalType, setModalType] = useState<"academic" | "exam" | "holiday" | "event">("academic");
  const [modalDesc, setModalDesc] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState("all");

  const isAdmin = userRole === "admin";

  const handleOpenAdd = () => {
    setEditingEventId(null);
    setModalTitle("");
    setModalDate(new Date().toISOString().split("T")[0]);
    setModalEndDate("");
    setModalType("academic");
    setModalDesc("");
    setShowModal(true);
  };

  const handleOpenEdit = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setModalTitle(ev.title);
    setModalDate(ev.date);
    setModalEndDate(ev.endDate || "");
    setModalType(ev.type);
    setModalDesc(ev.description);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus agenda akademik ini?")) {
      const updated = events.filter(e => e.id !== id);
      saveEventsToStorage(updated);
      if (showNotification) showNotification("Agenda berhasil dihapus.", "neutral");
    }
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalDate) {
      alert("Judul agenda dan tanggal wajib diisi!");
      return;
    }

    if (editingEventId) {
      // Edit mode
      const updated = events.map(ev => 
        ev.id === editingEventId 
          ? { 
              ...ev, 
              title: modalTitle, 
              date: modalDate, 
              endDate: modalEndDate || undefined, 
              type: modalType, 
              description: modalDesc 
            } 
          : ev
      );
      saveEventsToStorage(updated);
      if (showNotification) showNotification("Agenda akademik berhasil diperbarui.");
    } else {
      // Add mode
      const newEv: CalendarEvent = {
        id: `ev-${Date.now()}`,
        title: modalTitle,
        date: modalDate,
        endDate: modalEndDate || undefined,
        type: modalType,
        description: modalDesc
      };
      saveEventsToStorage([...events, newEv]);
      if (showNotification) showNotification("Agenda akademik baru berhasil didaftarkan!");
    }

    setShowModal(false);
  };

  // Filters and sorts
  const filteredEvents = events.filter(ev => {
    if (dateFilter === "all") return true;
    const nowStr = new Date().toISOString().split("T")[0];
    if (dateFilter === "upcoming") {
      return ev.date >= nowStr || (ev.endDate && ev.endDate >= nowStr);
    }
    if (dateFilter === "past") {
      return ev.date < nowStr && (!ev.endDate || ev.endDate < nowStr);
    }
    return ev.type === dateFilter;
  }).sort((a,b) => a.date.localeCompare(b.date));

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-white/65 p-6 md:p-8 shadow-xs space-y-6 w-full animate-fadeIn max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-100/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-2xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
              Kalender Akademik SDIT
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Agenda penting, jadwal ujian, dan kalender libur SDIT Al-Hanif Cilegon.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider h-10 px-4 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.03]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
        {[
          { id: "all", label: "Semua Agenda" },
          { id: "upcoming", label: "Mendatang" },
          { id: "academic", label: "Akademik" },
          { id: "exam", label: "Pekan Ujian" },
          { id: "holiday", label: "Hari Libur" },
          { id: "event", label: "Lomba & Kegiatan" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setDateFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              dateFilter === tab.id
                ? "bg-[#2D3A3A] text-white"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Timeline List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">Tidak ditemukan agenda yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map(ev => {
              // Badge color mapping
              let colorClasses = "bg-blue-50 text-blue-700 border-blue-150";
              let typeLabel = "Akademik";
              if (ev.type === "exam") {
                colorClasses = "bg-purple-50 text-purple-700 border-purple-150";
                typeLabel = "Ujian / Ulangan";
              } else if (ev.type === "holiday") {
                colorClasses = "bg-rose-50 text-rose-700 border-rose-150";
                typeLabel = "Libur Sekolah";
              } else if (ev.type === "event") {
                colorClasses = "bg-amber-50 text-amber-700 border-amber-150";
                typeLabel = "Kegiatan";
              }

              return (
                <div 
                  key={ev.id} 
                  className="p-5 bg-[#FAF9F5] border border-slate-200 rounded-2xl relative flex flex-col justify-between shadow-3xs hover:border-emerald-600/30 hover:bg-white transition-all space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${colorClasses}`}>
                        {typeLabel}
                      </span>

                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-150 rounded-lg px-2 py-0.5">
                        <span>{ev.date}</span>
                        {ev.endDate && (
                          <>
                            <span className="text-slate-400 font-sans">&rarr;</span>
                            <span>{ev.endDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-950 leading-snug group-hover:text-emerald-700 transition-colors">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 justify-end pt-3 border-t border-slate-200/50 mt-1">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-xs font-semibold cursor-pointer shadow-3xs hover:bg-slate-50 inline-flex items-center gap-1"
                        title="Edit agenda"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 bg-rose-50 border border-rose-150 text-rose-600 hover:bg-rose-105 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        title="Hapus agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Add/Edit Modal Dialg */}
      {showModal && (
        <div className="fixed inset-0 bg-[#161d1d]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2x">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-base font-black text-[#2D3A3A] flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {editingEventId ? "Edit Agenda Akademik" : "Tambah Agenda Baru"}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Agenda / Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="Contoh: Ujian Praktek Bahasa Arab"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-250 focus:border-emerald-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Tanggal Selesai (Opsi)</label>
                  <input
                    type="date"
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Kategori Agenda *</label>
                <select
                  value={modalType}
                  onChange={(e) => setModalType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-250 rounded-xl"
                >
                  <option value="academic">Akademik Sekolah / KBM</option>
                  <option value="exam">Pekan Ujian & Ulangan</option>
                  <option value="holiday">Hari Libur Sekolah</option>
                  <option value="event">Lomba & Kegiatan Ekstra</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="Ceritakan rincian teknis singkat atau petunjuk kegiatan..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-250 focus:border-emerald-500 rounded-xl resize-none"
                />
              </div>

              <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-650"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-[#2D3A3A] hover:bg-slate-900 rounded-xl text-xs font-black text-white"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
