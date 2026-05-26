import React, { useState, useMemo, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  Users, 
  Filter, 
  Phone, 
  ExternalLink, 
  CheckCircle, 
  Layers, 
  Save, 
  Check, 
  Info,
  Smartphone,
  Image,
  Music,
  Video,
  Link,
  Paperclip
} from "lucide-react";
import { Kelas, Siswa, AbsenSiswa, Penilaian, KategoriPenilaian } from "../types";
import { logWhatsAppSent } from "../utils/waLogger";

interface BroadcastConsoleProps {
  kelas: Kelas[];
  siswa: Siswa[];
  absenSiswa?: AbsenSiswa[];
  penilaian?: Penilaian[];
  kategori?: KategoriPenilaian[];
  userRole: "admin" | "guru" | "wali";
  showNotification: (text: string, type?: "success" | "neutral") => void;
  activeTeacherName?: string;
  activeTeacherCode?: string;
}

export default function BroadcastConsole({
  kelas,
  siswa,
  absenSiswa = [],
  penilaian = [],
  kategori = [],
  userRole,
  showNotification,
  activeTeacherName = "Admin Al Hanif",
  activeTeacherCode = "ADMIN_MASTER"
}: BroadcastConsoleProps) {
  // Filters
  const [filterType, setFilterType] = useState<"CLASS" | "GRADE" | "ALL">("CLASS");
  const [selectedClassId, setSelectedClassId] = useState<string>(kelas[0]?.id || "");
  const [selectedGrade, setSelectedGrade] = useState<string>("4"); // Defaults to Grade 4

  // Automatically sync selectedClassId if kelas list loads/changes or selectedClassId is empty
  useEffect(() => {
    if (kelas.length > 0) {
      if (!selectedClassId || !kelas.some(k => k.id === selectedClassId)) {
        setSelectedClassId(kelas[0].id);
      }
    }
  }, [kelas, selectedClassId]);
  
  // Custom templates
  const [msgBody, setMsgBody] = useState<string>(
    "Assalamualaikum Ayah/Bunda dari {{nama_siswa}} (Kelas {{kelas}}).\n\nKami menginfokan bahwa perkembangan belajar ananda saat ini memiliki Rata-Rata Nilai Akademik {{rata_rata_nilai}} dengan Persentase Absen Kehadiran {{absensi_kehadiran}}%.\n\nMohon untuk terus memotivasi ananda dalam belajar di rumah. Syukron Katsiran."
  );

  const [groupMsgBody, setGroupMsgBody] = useState<string>(
    "Assalamualaikum Bapak/Ibu Wali Murid sekalian.\n\nBerikut kami lampirkan pengumuman penting mengenai kegiatan pembelajaran pekan ini. Harap dipedomani dengan baik. Terima kasih."
  );

  // Dynamic Media & Attachment states for broadcast messages
  const [attachImage, setAttachImage] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("https://alhanif.sch.id/brosur-penerimaan-2026.jpg");
  const [attachAudio, setAttachAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("https://alhanif.sch.id/suara-hafalan-terbaru.mp3");
  const [attachVideo, setAttachVideo] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>("https://alhanif.sch.id/profil-sekolah.mp4");
  const [attachRegistration, setAttachRegistration] = useState<boolean>(false);
  const [registrationUrl, setRegistrationUrl] = useState<string>("https://alhanif.sch.id/ppdb-online-2026");

  // Group WA Links store inside LocalStorage
  const [groupLinks, setGroupLinks] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("siswadigital_wa_group_links");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingGroupLinkId, setEditingGroupLinkId] = useState<string | null>(null);
  const [tempGroupLink, setTempGroupLink] = useState<string>("");

  const handleSaveGroupLink = (classId: string) => {
    const updated = { ...groupLinks, [classId]: tempGroupLink.trim() };
    setGroupLinks(updated);
    localStorage.setItem("siswadigital_wa_group_links", JSON.stringify(updated));
    setEditingGroupLinkId(null);
    setTempGroupLink("");
    showNotification("Tautan Grup WhatsApp kelas berhasil disimpan!", "success");
  };

  // Filtered targeted students
  const targetedSiswa = useMemo(() => {
    if (filterType === "ALL") {
      return siswa;
    }
    if (filterType === "CLASS") {
      return siswa.filter(s => s.kelasId === selectedClassId);
    }
    if (filterType === "GRADE") {
      // Find all classes that belong to this grade (completely inclusive matching - e.g. "2a" matches grade "2")
      const classIdsInGrade = kelas
        .filter(k => {
          const name = k.namaKelas.toLowerCase().replace(/\s+/g, "");
          const target = selectedGrade.toLowerCase();
          return name.includes(`kelas${target}`) || name.startsWith(target) || name.includes(`kls${target}`);
        })
        .map(k => k.id);
      return siswa.filter(s => classIdsInGrade.includes(s.kelasId));
    }
    return [];
  }, [siswa, kelas, filterType, selectedClassId, selectedGrade]);

  // Keep track of clicked/sent item IDs in this render session
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});

  // Bulk sending state engine properties (Requirement 7)
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkLog, setBulkLog] = useState<string[]>([]);

  const handleBulkBroadcast = async () => {
    const activeRecipients = targetedSiswa.filter(s => s.noHpWali && s.noHpWali.trim().length > 0);
    if (activeRecipients.length === 0) {
      showNotification("Tidak ada kontak wali murid yang memiliki nomor HP aktif!", "neutral");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin memproses pengiriman siaran pesan masal ke ${activeRecipients.length} nomor wali murid secara berurutan dalam tab baru otomatis? Klik OK lalu izinkan pop-up jika browser memblokirnya.`)) {
      return;
    }

    setIsBulkSending(true);
    setBulkProgress(0);
    setBulkLog(["Memulai penyiapan antrean siaran masal..."]);

    // Process one by one with a small interval so popups don't get blocked
    for (let i = 0; i < activeRecipients.length; i++) {
      const student = activeRecipients[i];
      const name = student.namaSiswa;
      const hp = student.noHpWali!.trim();

      // Format WhatsApp number
      let cleanHp = hp.replace(/[^0-9]/g, "");
      if (cleanHp.startsWith("0")) {
        cleanHp = "62" + cleanHp.substring(1);
      }

      const compiledText = getPersonalizedMessage(student, msgBody);
      const url = `https://api.whatsapp.com/send?phone=${cleanHp}&text=${encodeURIComponent(compiledText)}`;
      
      // Open tab
      window.open(url, "_blank");

      // Audit Log Entry
      logWhatsAppSent(
        activeTeacherName,
        activeTeacherCode,
        "BULK",
        `${student.namaWali || "Wali"} (${student.namaSiswa})`,
        compiledText
      );

      // Update sent status
      setSentStatus(prev => ({ ...prev, [student.id]: true }));
      setBulkProgress(i + 1);
      setBulkLog(prev => [...prev, `[Selesai ${i + 1}/${activeRecipients.length}] Pesan untuk wali ${name} (${hp}) berhasil dikirim ke antrean browser.`]);

      // Delay between opens to prevent browser from thinking it is spam
      if (i < activeRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    showNotification(`Berhasil memproses seluruh ${activeRecipients.length} pengiriman siaran masal!`, "success");
    setBulkLog(prev => [...prev, "🎉 Semua antrean siaran masal berhasil diproses! Silakan ketuk tombol kirim di masing-masing tab WhatsApp."]);
  };

  // Helper placeholder parser
  const getPersonalizedMessage = (s: Siswa, template: string) => {
    const currentClass = kelas.find(k => k.id === s.kelasId);
    
    // Compute student's academic average
    const sPenilaians = penilaian.filter(p => {
      const katItem = kategori.find(kat => kat.id === p.kategoriId && kat.kelasId === s.kelasId);
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

    // Attendance calculation
    const sRecords = (absenSiswa || []).filter(a => a.siswaId === s.id);
    const H = sRecords.filter(a => a.status === "Hadir").length;
    const total = sRecords.length;
    const pct = total > 0 ? Math.round((H / total) * 100) : 100;

    let finalText = template
      .replace(/{{nama_siswa}}/g, s.namaSiswa)
      .replace(/{{nama_wali}}/g, s.namaWali || "Bapak/Ibu Wali Murid")
      .replace(/{{kelas}}/g, currentClass?.namaKelas || "Kelas")
      .replace(/{{rata_rata_nilai}}/g, currentAvg.toString())
      .replace(/{{absensi_kehadiran}}/g, pct.toString());

    // Append active media links if selected
    if (attachImage && imageUrl.trim()) {
      finalText += `\n\n🖼️ Brosur / Foto: ${imageUrl.trim()}`;
    }
    if (attachAudio && audioUrl.trim()) {
      finalText += `\n\n🎵 Lampiran Audio: ${audioUrl.trim()}`;
    }
    if (attachVideo && videoUrl.trim()) {
      finalText += `\n\n🎥 Lampiran Video: ${videoUrl.trim()}`;
    }
    if (attachRegistration && registrationUrl.trim()) {
      finalText += `\n\n📝 Link Pendaftaran: ${registrationUrl.trim()}`;
    }

    return finalText;
  };

  const handleSendIndividualWA = (s: Siswa) => {
    const hp = s.noHpWali?.trim();
    if (!hp) {
      showNotification(`Gagal: Nomer HP Wali dari ${s.namaSiswa} tidak terekam dalam database!`, "neutral");
      return;
    }

    const compiledText = getPersonalizedMessage(s, msgBody);
    
    // Clean phone number format for WhatsApp (e.g. change starting 08 to 628)
    let cleanHp = hp.replace(/[^0-9]/g, "");
    if (cleanHp.startsWith("0")) {
      cleanHp = "62" + cleanHp.substring(1);
    }

    // Build api link
    const url = `https://api.whatsapp.com/send?phone=${cleanHp}&text=${encodeURIComponent(compiledText)}`;
    
    // Audit Log Entry
    logWhatsAppSent(
      activeTeacherName,
      activeTeacherCode,
      "INDIVIDUAL",
      `${s.namaWali || "Wali"} (${s.namaSiswa})`,
      compiledText
    );

    window.open(url, "_blank");

    setSentStatus(prev => ({ ...prev, [s.id]: true }));
  };

  const handleSendGroupWA = () => {
    if (filterType !== "CLASS") {
      showNotification("Untuk mengirim pesan ke grup kelas, silakan aktifkan filter 'Berdasarkan Rombel Kelas' terlebih dahulu.", "neutral");
      return;
    }

    const currentClass = kelas.find(k => k.id === selectedClassId);
    if (!currentClass) return;

    const groupLink = groupLinks[selectedClassId];
    if (!groupLink) {
      showNotification(`Belum ada kaitan Tautan Grup WA untuk kelas ${currentClass.namaKelas}. Silakan tautkan tautannya di bagian bawah terlebih dahulu.`, "neutral");
      return;
    }

    // Compile group body with active attachments
    let compiledGroupBody = groupMsgBody;
    if (attachImage && imageUrl.trim()) {
      compiledGroupBody += `\n\n🖼️ Brosur / Foto: ${imageUrl.trim()}`;
    }
    if (attachAudio && audioUrl.trim()) {
      compiledGroupBody += `\n\n🎵 Lampiran Audio: ${audioUrl.trim()}`;
    }
    if (attachVideo && videoUrl.trim()) {
      compiledGroupBody += `\n\n🎥 Lampiran Video: ${videoUrl.trim()}`;
    }
    if (attachRegistration && registrationUrl.trim()) {
      compiledGroupBody += `\n\n📝 Link Pendaftaran: ${registrationUrl.trim()}`;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(compiledGroupBody);
    showNotification("Pesan grup beserta lampiran berhasil disalin ke clipboard! Mengalihkan ke grup WhatsApp...", "success");
    
    // Audit Log Entry
    logWhatsAppSent(
      activeTeacherName,
      activeTeacherCode,
      "GROUP",
      `Grup Kelas ${currentClass.namaKelas}`,
      compiledGroupBody
    );

    setTimeout(() => {
      window.open(groupLink, "_blank");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page header */}
      <div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
          Sistem Komunikasi Terpadu
        </span>
        <h2 className="text-2xl font-display font-bold text-slate-800 mt-2">WhatsApp Hub & Broadcast Penyiaran</h2>
        <p className="text-sm text-slate-500">
          Kirim laporan nilai akademik, persentase kehadiran, dan pengumuman kelas langsung ke WhatsApp orang tua/wali murid atau grup kelas secara dinamis.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Core Settings & Configuration form */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Filter className="w-4 h-4 text-[#8BA888]" /> Penyaringan Sasaran Siaran
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Mode Target Siaran</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterType("CLASS")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                    filterType === "CLASS" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Rombel Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("GRADE")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                    filterType === "GRADE" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tingkat (Grade)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("ALL")}
                  className={`py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer ${
                    filterType === "ALL" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Semua Wali
                </button>
              </div>

              {filterType === "CLASS" && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Rombongan Belajar</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    {kelas.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
              )}

              {filterType === "GRADE" && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Tingkat Kelas Angkatan</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1">Kelas 1 (Satu)</option>
                    <option value="2">Kelas 2 (Dua)</option>
                    <option value="3">Kelas 3 (Tiga)</option>
                    <option value="4">Kelas 4 (Empat)</option>
                    <option value="5">Kelas 5 (Lima)</option>
                    <option value="6">Kelas 6 (Enam)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    * Akan menyaring seluruh rombel kelas yang memiliki identifikasi tingkat ini (misal Kelas 4A, Kelas 4B).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Template editor */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Template Pesan Pribadi
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full h-44 p-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 leading-relaxed font-sans text-[11px]"
                  placeholder="Ketik draf pesan pribadi di sini..."
                />
              </div>

              {/* Placeholders quick guides */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-1.5 text-[10px] text-slate-500">
                <p className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-slate-400" /> Panduan Tag Tempat Penampung:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[9px]">
                  <div><code>{"{{nama_siswa}}"}</code> - Nama Siswa</div>
                  <div><code>{"{{nama_wali}}"}</code> - Nama Wali</div>
                  <div><code>{"{{kelas}}"}</code> - Rombel Kelas</div>
                  <div><code>{"{{rata_rata_nilai}}"}</code> - Rata-Rata Nilai</div>
                  <div><code>{"{{absensi_kehadiran}}"}</code> - Kehadiran %</div>
                </div>
              </div>
            </div>
          </div>

          {/* Media & Attachments Configuration */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Paperclip className="w-4 h-4 text-emerald-600 animate-pulse" /> Lampiran & Media Broadcast
            </h3>

            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Aktifkan berkas pendukung di bawah ini jika ingin dilampirkan secara otomatis ke dalam tautan pesan WhatsApp:
            </p>

            <div className="space-y-4 font-sans text-xs">
              
              {/* Image Input */}
              <div className="space-y-1.5 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attachImage}
                    onChange={(e) => setAttachImage(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <Image className="w-3.5 h-3.5 text-emerald-600" /> Sertakan Gambar / Brosur
                </label>
                {attachImage && (
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Masukkan URL foto/gambar brosur (jpg/png)..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                )}
              </div>

              {/* Audio Input */}
              <div className="space-y-1.5 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attachAudio}
                    onChange={(e) => setAttachAudio(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <Music className="w-3.5 h-3.5 text-emerald-600" /> Sertakan Rekaman Audio Suara
                </label>
                {attachAudio && (
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Masukkan URL file audio suara hafalan (mp3)..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                )}
              </div>

              {/* Video Input */}
              <div className="space-y-1.5 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attachVideo}
                    onChange={(e) => setAttachVideo(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <Video className="w-3.5 h-3.5 text-emerald-600" /> Sertakan File Video
                </label>
                {attachVideo && (
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Masukkan URL video liputan atau panduan (mp4)..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                )}
              </div>

              {/* Registration Link Input */}
              <div className="space-y-1.5 border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={attachRegistration}
                    onChange={(e) => setAttachRegistration(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <Link className="w-3.5 h-3.5 text-emerald-600" /> Sertakan Link Pendaftaran (PPDB)
                </label>
                {attachRegistration && (
                  <input
                    type="text"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="Masukkan link pendaftaran santri baru/acara..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10.5px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                )}
              </div>

            </div>
          </div>

          {/* Classroom Group WA link manager */}
          {filterType === "CLASS" && (
            <div className="bg-[#FAF9F5] p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2.5">
                <Smartphone className="w-4 h-4 text-emerald-600" /> Tautan Grup WA Kelas
              </h3>

              {(() => {
                const currentClass = kelas.find(k => k.id === selectedClassId);
                if (!currentClass) return null;
                const link = groupLinks[currentClass.id] || "";

                return (
                  <div className="space-y-3 text-xs font-sans">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tautan Grup Kelas {currentClass.namaKelas}:</span>
                      {editingGroupLinkId === currentClass.id ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={tempGroupLink}
                            onChange={(e) => setTempGroupLink(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full p-2 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-emerald-600 font-mono"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                setEditingGroupLinkId(null);
                                setTempGroupLink("");
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-[10px]"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleSaveGroupLink(currentClass.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px]"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 overflow-hidden text-[11px]">
                          <span className="text-slate-650 font-mono truncate max-w-44 text-xs font-medium">
                            {link || "Belum ditautkan"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingGroupLinkId(currentClass.id);
                              setTempGroupLink(link);
                            }}
                            className="px-2.5 py-1 hover:bg-emerald-50 text-emerald-700 border border-emerald-100 rounded font-bold text-[10px] shrink-0"
                          >
                            Hubungkan
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-250/50 p-3 rounded-2xl bg-white space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Broadcast ke Grup WA Kelas {currentClass.namaKelas}</span>
                      <textarea
                        value={groupMsgBody}
                        onChange={(e) => setGroupMsgBody(e.target.value)}
                        className="w-full h-24 p-2.5 border border-slate-200 rounded-xl text-[10px] text-slate-750 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                        placeholder="Ubah isi pesan grup..."
                      />
                      <button
                        onClick={handleSendGroupWA}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/10 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" /> Kirim ke Grup WA Kelas
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Targeted recipients table checklist */}
        <div className="xl:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-601" /> Daftar Orang Tua / Wali Target ({targetedSiswa.length} Siswa)
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBulkBroadcast}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10.5px] rounded-xl flex items-center gap-1.5 shadow-sm transform transition-all cursor-pointer uppercase tracking-wider"
              >
                <Send className="w-3.5 h-3.5" /> Kirim Masal Otomatis Sekaligus
              </button>
              
              <span className="text-[10px] text-slate-400 font-bold border border-slate-200 bg-slate-50 px-2 py-1 rounded-lg">
                {filterType === "GRADE" ? `Filter: Tingkat Kelas ${selectedGrade}` : filterType === "CLASS" ? "Filter: Sasar Rombel" : "Semua Wali"}
              </span>
            </div>
          </div>

          {isBulkSending && (
            <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4.5 space-y-3 animate-fadeIn text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">📡 Pengiriman Siaran Otomatis Sedang Berjalan...</span>
                <span className="text-xs font-black text-emerald-800 font-mono">
                  {bulkProgress} / {targetedSiswa.filter(s => s.noHpWali && s.noHpWali.trim()).length} Selesai
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${Math.round((bulkProgress / (targetedSiswa.filter(s => s.noHpWali && s.noHpWali.trim()).length || 1)) * 100)}%` }}
                />
              </div>

              {/* Status log box */}
              <div className="bg-slate-900 text-[#22C55E] p-3 rounded-xl font-mono text-[9.5px] h-28 overflow-y-auto space-y-1 text-left select-none">
                {bulkLog.map((log, idx) => (
                  <p key={idx} className="leading-relaxed">{log}</p>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsBulkSending(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-[10px] font-bold rounded-lg cursor-pointer max-w-max transition-colors"
                >
                  Tutup Monitor
                </button>
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl">
            {targetedSiswa.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-16 space-y-2">
                <p>Tidak ada daftar wali murid yang cocok dengan penyaringan ini.</p>
                <p className="text-[10px] text-slate-400">Silakan pastikan data kelas dan tingkat sudah terdaftar dalam sistem.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 divide-x divide-slate-150">
                    <th className="px-3 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Rombel</th>
                    <th className="px-4 py-3">Nama Wali</th>
                    <th className="px-4 py-3">Nomer HP Wali</th>
                    <th className="px-4 py-3 text-center w-36">Aksi Kirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-750">
                  {targetedSiswa.map((s, idx) => {
                    const mappedClass = kelas.find(k => k.id === s.kelasId);
                    const hp = s.noHpWali?.trim() || "";
                    const hasHp = hp.length > 0;
                    const isSent = sentStatus[s.id];

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50 divide-x divide-slate-150 transition-colors">
                        <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-440">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{s.namaSiswa}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-550">{mappedClass?.namaKelas || "-"}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700">{s.namaWali || "-"}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                          {hasHp ? (
                            <span className="flex items-center gap-1 text-[#22C55E] font-bold">
                              <Phone className="w-3 h-3 text-emerald-600" /> {hp}
                            </span>
                          ) : (
                            <span className="text-rose-500 font-semibold italic">Nomer Belum Ada</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {hasHp ? (
                            <button
                              onClick={() => handleSendIndividualWA(s)}
                              className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSent 
                                  ? "bg-slate-100 text-slate-505 border border-slate-200" 
                                  : "bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-[#2D3A3A] hover:text-[#425555] border border-emerald-250/50"
                              }`}
                              title="Kirim laporan personal ke WhatsApp"
                            >
                              {isSent ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" /> Dikirim
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5 text-emerald-600 shrink-0 animate-pulse" /> Hubungi
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-250 border-dotted cursor-not-allowed"
                            >
                              Tanpa HP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="text-[10px] text-slate-500 italic p-3 bg-slate-50 rounded-2xl border border-slate-150 leading-relaxed space-y-1 no-print">
            <p className="font-extrabold text-slate-700">💡 Tip Hub WhatsApp:</p>
            <p>1. Template pesan dapat Anda modifikasi sebebasnya dengan memanfaatkan tag tempat penampung (misal: {"{{nama_siswa}}"}).</p>
            <p>2. Tombol "Hubungi" akan membuka WhatsApp Web atau aplikasi WhatsApp dengan teks pesan laporan pribadi yang telah terisi otomatis untuk dikirimkan secara berurutan.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
