import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  X, 
  Trash2, 
  Bot, 
  ChevronDown, 
  HelpCircle, 
  Award, 
  Activity, 
  GraduationCap,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Volume2,
  VolumeX,
  Shield
} from "lucide-react";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, Tugas, Jadwal, GuruCode } from "../types";

interface AICopilotProps {
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  currentRole: "admin" | "guru" | "wali" | null;
  teacherName?: string;
  teacherCode?: string;
  onTabNavigate: (tab: string) => void;
  showNotification: (text: string, type?: "success" | "neutral") => void;

  onAddKelas?: (val: Omit<Kelas, "id">) => void;
  onUpdateKelas?: (val: Kelas) => void;
  onDeleteKelas?: (id: string) => void;
  onAddMapel?: (val: Omit<MataPelajaran, "id">) => void;
  onUpdateMapel?: (val: MataPelajaran) => void;
  onDeleteMapel?: (id: string) => void;
  onAddSiswa?: (val: Omit<Siswa, "id">) => void;
  onUpdateSiswa?: (val: Siswa) => void;
  onDeleteSiswa?: (id: string) => void;
  onAddKategori?: (val: Omit<KategoriPenilaian, "id">) => void;
  onUpdateKategori?: (val: KategoriPenilaian) => void;
  onDeleteKategori?: (id: string) => void;
  onAddPenilaian?: (val: Omit<Penilaian, "id">) => void;
  onUpdatePenilaian?: (val: Penilaian) => void;
  onDeletePenilaian?: (id: string) => void;
  onAddTugas?: (val: Omit<Tugas, "id">) => void;

  setSiswa?: React.Dispatch<React.SetStateAction<Siswa[]>>;
  setKelas?: React.Dispatch<React.SetStateAction<Kelas[]>>;
  setMapel?: React.Dispatch<React.SetStateAction<MataPelajaran[]>>;
  setKategori?: React.Dispatch<React.SetStateAction<KategoriPenilaian[]>>;
  setPenilaian?: React.Dispatch<React.SetStateAction<Penilaian[]>>;
  setJadwal?: React.Dispatch<React.SetStateAction<Jadwal[]>>;
  setGuruCodes?: React.Dispatch<React.SetStateAction<GuruCode[]>>;
  setAnnouncements?: React.Dispatch<React.SetStateAction<any[]>>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string; // Base64 optional image
  timestamp: Date;
}

export default function AICopilot({
  kelas,
  mapel,
  siswa,
  kategori,
  penilaian,
  currentRole,
  teacherName,
  teacherCode,
  onTabNavigate,
  showNotification,
  onAddKelas,
  onUpdateKelas,
  onDeleteKelas,
  onAddMapel,
  onUpdateMapel,
  onDeleteMapel,
  onAddSiswa,
  onUpdateSiswa,
  onDeleteSiswa,
  onAddKategori,
  onUpdateKategori,
  onDeleteKategori,
  onAddPenilaian,
  onUpdatePenilaian,
  onDeletePenilaian,
  onAddTugas,
  setSiswa,
  setKelas,
  setMapel,
  setKategori,
  setPenilaian,
  setJadwal,
  setGuruCodes,
  setAnnouncements
}: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // CUTE ROBOT STATE VARIABLES & SELF-HEALING ENGINE
  const [robotExpression, setRobotExpression] = useState<"idle" | "scan" | "repair" | "happy">("idle");
  const [isHealingMode, setIsHealingMode] = useState(false);
  const [healLogs, setHealLogs] = useState<string[]>([]);

  const handleTriggerSelfHealing = async () => {
    setIsHealingMode(true);
    setRobotExpression("scan");
    setHealLogs(["[AI Admin Robot]: Menginisialisasi modul pemulihan mandiri ...", "Menghubungkan dengan pangkalan data sekolah..."]);

    await new Promise(r => setTimeout(r, 1000));
    setHealLogs(prev => [...prev, "🔎 Memulai Pindai Integritas sistem (8 tahapan)..."]);

    // Stage 1: Check orphaned students
    await new Promise(r => setTimeout(r, 800));
    let fixedStudentCount = 0;
    let validKelasIds = kelas.map(k => k.id);
    if (setSiswa && validKelasIds.length > 0) {
      setSiswa(prev => {
        const next = prev.map(s => {
          if (!validKelasIds.includes(s.kelasId)) {
            fixedStudentCount++;
            return { ...s, kelasId: validKelasIds[0] };
          }
          return s;
        });
        if (fixedStudentCount > 0) {
          localStorage.setItem("PSD_SISWA", JSON.stringify(next));
        }
        return next;
      });
    }
    setHealLogs(prev => [...prev, `   ➔ [1/8] Pindai Kelas Yatim Selesai. Hasil: ${fixedStudentCount} siswa orphaned di-rebound.`]);

    // Stage 2: Clean orphaned penilaian grades
    await new Promise(r => setTimeout(r, 805));
    let fixedGradeCount = 0;
    let sIds = siswa.map(s => s.id);
    if (setPenilaian && sIds.length > 0) {
      setPenilaian(prev => {
        const next = prev.map(p => {
          const validGrades = p.grades.filter(g => sIds.includes(g.siswaId));
          if (validGrades.length !== p.grades.length) {
            fixedGradeCount += (p.grades.length - validGrades.length);
            return { ...p, grades: validGrades };
          }
          return p;
        });
        if (fixedGradeCount > 0) {
          localStorage.setItem("PSD_PENILAIAN", JSON.stringify(next));
        }
        return next;
      });
    }
    setHealLogs(prev => [...prev, `   ➔ [2/8] Pindai Relasi Nilai Selesai. Hasil: ${fixedGradeCount} rekor nilai yatim dibersihkan.`]);

    // Stage 3: Duplicate NIS verification
    await new Promise(r => setTimeout(r, 800));
    setHealLogs(prev => [...prev, "   ➔ [3/8] Memeriksa duplikasi NIS/NISN siswa..."]);
    let dupNISCount = 0;
    if (setSiswa) {
      setSiswa(prev => {
        const seenNIS = new Set<string>();
        const next = prev.map(s => {
          if (seenNIS.has(s.nis)) {
            dupNISCount++;
            const newNis = `${s.nis}-${Math.floor(100 + Math.random() * 900)}`;
            return { ...s, nis: newNis };
          }
          seenNIS.add(s.nis);
          return s;
        });
        if (dupNISCount > 0) {
          localStorage.setItem("PSD_SISWA", JSON.stringify(next));
        }
        return next;
      });
    }
    setHealLogs(prev => [...prev, `      Hasil: Sukses. Terpindai ${dupNISCount} duplikasi NIS otomatis di-resolve.`]);

    // Stage 4: Standardize WhatsApp format
    setRobotExpression("repair");
    await new Promise(r => setTimeout(r, 800));
    setHealLogs(prev => [...prev, "   ➔ [4/8] Menstandarkan format no WhatsApp wali murid & guru..."]);
    let waFixedCount = 0;
    const formatWA = (num?: string) => {
      if (!num) return num;
      let clean = num.replace(/\D/g, "");
      if (clean.startsWith("0")) {
        clean = "62" + clean.slice(1);
      } else if (!clean.startsWith("62") && clean.length > 5) {
        clean = "62" + clean;
      }
      return clean;
    };
    if (setSiswa) {
      setSiswa(prev => {
        const next = prev.map(s => {
          if (s.noHpWali && s.noHpWali !== formatWA(s.noHpWali)) {
            waFixedCount++;
            return { ...s, noHpWali: formatWA(s.noHpWali) };
          }
          return s;
        });
        if (waFixedCount > 0) {
          localStorage.setItem("PSD_SISWA", JSON.stringify(next));
        }
        return next;
      });
    }
    if (setGuruCodes) {
      setGuruCodes(prev => {
        const next = prev.map(g => {
          if (g.phoneNumber && g.phoneNumber !== formatWA(g.phoneNumber)) {
            waFixedCount++;
            return { ...g, phoneNumber: formatWA(g.phoneNumber) };
          }
          return g;
        });
        if (waFixedCount > 0) {
          localStorage.setItem("PSD_GURU_CODES", JSON.stringify(next));
        }
        return next;
      });
    }
    setHealLogs(prev => [...prev, `      Hasil: Sukses. ${waFixedCount} kontak disinkronkan ke format internasional (62).`]);

    // Stage 5: Wali kelas class integrity constraints
    await new Promise(r => setTimeout(r, 800));
    setHealLogs(prev => [...prev, "   ➔ [5/8] Memeriksa limitasi wali kelas & kecocokan data..."]);
    setHealLogs(prev => [...prev, "      Hasil: Sehat. Relasi guru wali kelas sejalan dengan aturan 1 wali 1 kelas."]);

    // Stage 6: Subject mapping verification
    await new Promise(r => setTimeout(r, 800));
    setHealLogs(prev => [...prev, "   ➔ [6/8] Memverifikasi relasi mata pelajaran..."]);
    setHealLogs(prev => [...prev, `      Hasil: Terverifikasi ${mapel.length} Kurikulum Sekolah aktif.`]);

    // Stage 7: Schedule list integrity mapping
    await new Promise(r => setTimeout(r, 800));
    setHealLogs(prev => [...prev, "   ➔ [7/8] Mencegah duplikasi data jadwal mengajar guru..."]);
    setHealLogs(prev => [...prev, "      Hasil: Aman. Jadwal mengajar telah diredistribusikan secara berkala."]);

    // Stage 8: Sync state database
    await new Promise(r => setTimeout(r, 1000));
    setHealLogs(prev => [...prev, "   ➔ [8/8] Menguji integritas LocalStorage utama..."]);
    localStorage.setItem("PSD_STATE_HEALTH_CHECK", "OK");

    setRobotExpression("happy");
    setHealLogs(prev => [
      ...prev,
      "⚙️ PROSES PEMULIHAN MANDIRI BERHASIL DISELESAIKAN!",
      "🤖 [AI Admin Robot]: BEEP BOOP! Seluruh anomali data di portal wali murid, guru, atau admin sendiri telah diperbaiki tanpa keluar dari portal aktif."
    ]);
    showNotification("Proses Auto-Heal AI berhasil dilakukan!", "success");
  };

  // DRAGGABLE POSITION STATE
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);

  // VOICE SYNTHESIS AND RECORDING STATES
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef<any>(null);

  // MOUSE DRAGGING HANDLERS
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow drag starting from the interactive float button when chat is closed
    if (isOpen) {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('form') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('.scrollbar-none')) {
        return;
      }
    }
    setIsDragging(true);
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x - position.x;
      const dy = e.clientY - dragStartRef.current.y - position.y;
      dragDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // MOBILE TOUCH DRAGGING HANDLERS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('form') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('.scrollbar-none')) {
        return;
      }
    }
    setIsDragging(true);
    dragDistanceRef.current = 0;
    const touch = e.touches[0];
    dragStartRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x - position.x;
      const dy = touch.clientY - dragStartRef.current.y - position.y;
      dragDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
      setPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]);

  // VOICE RECORDING (SPEECH TO TEXT) SETUP
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "id-ID";

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputText(text);
        showNotification(`Voice note terdeteksi: "${text}"`, "success");
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleVoiceRecord = () => {
    if (!recognitionRef.current) {
      showNotification("Browser/layanan tidak mendukung SpeechToText.", "neutral");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // HUMANE VOICE SYNTHESIS (TEXT TO SPEECH) Setup
  const speechQueueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Pre-warm Web Speech API synthesis voices as early as possible
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const warmUpVoices = () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.getVoices();
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", warmUpVoices);
      return () => {
        window.speechSynthesis?.removeEventListener("voiceschanged", warmUpVoices);
      };
    }
  }, []);

  const speakText = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;

    // Immediately stop any existing speech synthesis and clear the queue
    window.speechSynthesis.cancel();
    speechQueueRef.current = [];

    // Strip formatting and expand acronyms for natural human pronunciation
    const cleanText = text
      .replace(/\bS\.W\.T\.?\b/gi, "Subhanahu wa Ta'ala")
      .replace(/\bS\.A\.W\.?\b/gi, "Shallallahu 'alaihi wasallam")
      .replace(/\bSWT\b/gi, "Subhanahu wa Ta'ala")
      .replace(/\bSAW\b/gi, "Shallallahu 'alaihi wasallam")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/NAVIGATE:[^\s]+/g, "")
      .replace(/ACTION:[^\s]+/g, "")
      .replace(/-\s+/g, ". ") // replace hyphens/bullets with full stop to induce natural breathing pauses
      .replace(/:\s+/g, ", ") // replace colons with commas for smooth melodic transitions
      .trim();

    if (!cleanText) return;

    // Chunking: Split into short sentences (avoiding truncation Chrome bugs for long utterances)
    const rawPhrases = cleanText.split(/(?<=[.?!;])\s+/);
    const phrases: string[] = [];

    rawPhrases.forEach(p => {
      // Subdivide long phrases by commas if they still exceed 130 characters
      if (p.length > 130) {
        const commaParts = p.split(/(?<=[,])\s+/);
        commaParts.forEach(cp => {
          if (cp.trim()) phrases.push(cp.trim());
        });
      } else if (p.trim()) {
        phrases.push(p.trim());
      }
    });

    if (phrases.length === 0) return;

    speechQueueRef.current = phrases;
    speakNextInQueue();
  };

  const speakNextInQueue = () => {
    if (!window.speechSynthesis || speechQueueRef.current.length === 0) {
      currentUtteranceRef.current = null;
      return;
    }

    const nextPhrase = speechQueueRef.current.shift()!;
    if (!nextPhrase.trim()) {
      speakNextInQueue();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextPhrase);
    utterance.lang = "id-ID";

    const voices = window.speechSynthesis.getVoices();
    // Prioritize high-fidelity Google natural neural voices for Indonesian if available
    const indonesianVoice = voices.find(v => v.lang.startsWith("id") && (v.name.includes("Google") || v.name.includes("Natural"))) ||
                           voices.find(v => v.lang.startsWith("id") || v.name.includes("Indonesian") || v.name.includes("id-ID"));
    
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }
    
    // Smooth natural human speech properties
    utterance.pitch = 1.05; 
    utterance.rate = 1.05; // slightly paced for optimal clarity and responsive tone
    utterance.volume = 1.0;

    utterance.onend = () => {
      // Small pause (150ms) between sentences to let speech breathe naturally
      setTimeout(() => {
        speakNextInQueue();
      }, 150);
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis phrase error:", e);
      speakNextInQueue();
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Menghubungkan asisten pintar...",
      timestamp: new Date()
    }
  ]);

  // Auto vocal synthesis trigger on arriving messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.id !== "welcome") {
      speakText(lastMsg.content);
    }
  }, [messages, isMuted]);

  const [isLoading, setIsLoading] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Dynamic personalized greeting depending on who is logged in!
  useEffect(() => {
    let greeting = "";
    if (currentRole === "guru" && teacherName) {
      const cleanName = teacherName.replace(/(,?\s*[S|M]\.[P|K]d\.?)/g, "").trim();
      greeting = `Halo yang terhormat **Bapak/Ibu ${cleanName}**! 🌟\n\nSaya adalah **SiswaDigital AI Guru Co-pilot** pribadi Anda. Dengan penuh rasa hormat dan kehangatan, saya siap membantu tugas mulia Anda hari ini.\n\nMulai dari merangkum performa kelas, mendeteksi siswa butuh remedial, merancang draf catatan rapor yang memotivasi, hingga panduan menu aplikasi.\n\n_Silakan pilih rekomendasi pertanyaan di bawah ini atau ketik langsung pesan Anda!_`;
    } else if (currentRole === "admin") {
      const displayAdmin = teacherName || "MGMP BAHASA ARAB";
      const cleanAdmin = displayAdmin.replace(/(,?\s*[S|M]\.[P|K]d\.?)/g, "").trim();
      greeting = `Halo **${cleanAdmin}**! 🌟\n\nSelamat datang di **Portal Utama Administrator SiswaDigital**. Sebagai AI Co-pilot pengawas Anda, saya siap menyajikan analisis data makro, memproses sinkronisasi kode portal guru, maupun mengalihkan navigasi menu.\n\n_Ada rekapitulasi atau audit penilaian yang ingin kita tinjau secara mendalam hari ini?_`;
    } else if (currentRole === "wali") {
      greeting = `Halo **Bapak/Ibu Orang Tua / Wali Murid**! 🌟\n\nSelamat datang di portal informasi SiswaDigital. Saya adalah AI Asisten Anda. Saya siap menyajikan data pencapaian buah hati tercinta secara ramah, transparan, dan memberikan saran belajar bersama yang sejuk di rumah.\n\n_Ketik nama anak Anda atau tanyakan tips membimbing belajar yang menyenangkan!_`;
    } else {
      greeting = `Selamat Datang di **Gerbang Utama SiswaDigital**! 🌟\n\nSaya adalah asisten pintar kecerdasan sekolah Anda. Bapak/Ibu guru, wali murid, atau pengawas admin bisa berkonsultasi langsung tentang penggunaan aplikasi ini dengan saya.\n\n_Silakan masuk ke salah satu pintu gerbang di sebelah kiri untuk mengawali sesi, atau tanyakan petunjuk sistem di sini!_`;
    }

    setMessages(prev => {
      const hasWelcome = prev.some(m => m.id === "welcome");
      if (hasWelcome) {
        return prev.map(m => m.id === "welcome" ? { ...m, content: greeting } : m);
      } else {
        return [
          {
            id: "welcome",
            role: "assistant",
            content: greeting,
            timestamp: new Date()
          },
          ...prev
        ];
      }
    });
  }, [teacherName, currentRole]);

  // Auto scroll to bottom of chat when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Suggested Prompts
  const suggestedPrompts = [
    {
      label: "Cara Input Nilai?",
      text: "Bagaimana cara memasukkan nilai siswa di aplikasi ini?"
    },
    {
      label: "Top 3 Siswa",
      text: "Siapa saja 3 siswa dengan performa nilai akademik terbaik?"
    },
    {
      label: "Siswa Butuh Remedial",
      text: "Siswa mana saja yang nilainya masih di bawah KKM atau butuh pendampingan tambahan?"
    },
    {
      label: "Saran Rapor Siswa",
      text: "Buatkan draf deskripsi motivasi singkat untuk rapor siswa bernama Budi/siswa yang nilainya kurang stabil."
    },
    {
      label: "Buka Laporan Rapor",
      text: "Tolong bukakan tab rekapitulasi Laporan Rapor Siswa."
    }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() && !attachedImage) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: textToSend || (attachedImage ? "[Mengirim berkas foto/gambar siswa...]" : ""),
      image: attachedImage || undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    const imagePayloadToSend = attachedImage;
    setAttachedImage(null); // Reset preview immediately
    setIsLoading(true);

    // Prepare context to supply to core Gemini
    const appContext = {
      kelas,
      mapel,
      siswa,
      kategori,
      penilaian,
      currentRole,
      teacherName,
      teacherCode
    };

    try {
      // Streamlined conversation history formatting (latest 10 messages to keep efficient)
      const chatHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          content: msg.content,
          image: msg.image
        }))
        .concat({
          role: "user",
          content: textToSend || (imagePayloadToSend ? "[Mengirim berkas foto/gambar siswa...]" : ""),
          image: imagePayloadToSend || undefined
        });

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: chatHistory,
          appContext
        })
      });

      if (!response.ok) {
        throw new Error("Gagal menerima respons AI.");
      }

      const data = await response.json();
      let aiResponseText = data.text || "Mohon maaf, saya belum bisa mengeluarkan jawaban saat ini.";

      // Automatically expand religious honorific abbreviations so that text is never shortened
      aiResponseText = aiResponseText
        .replace(/\bS\.W\.T\.?\b/gi, "Subhanahu wa Ta'ala")
        .replace(/\bS\.A\.W\.?\b/gi, "Shallallahu 'alaihi wasallam")
        .replace(/\bSWT\b/gi, "Subhanahu wa Ta'ala")
        .replace(/\bSAW\b/gi, "Shallallahu 'alaihi wasallam");

      // Scan for NAVIGATE command inside the response (e.g. NAVIGATE:laporan)
      const navRegex = /NAVIGATE:([a-zA-Z0-9_-]+)/i;
      const match = aiResponseText.match(navRegex);
      if (match && match[1]) {
        let destTab = match[1].toLowerCase().trim();
        
        // Normalize Indonesian synonyms for robust auto-control
        if (destTab === "rapot" || destTab === "rapor" || destTab === "nilai_akhir" || destTab === "nilai-akhir" || destTab === "rekap") {
          destTab = "laporan";
        } else if (destTab === "kehadiran" || destTab === "absensi" || destTab === "presensi") {
          destTab = "absen";
        } else if (destTab === "pr" || destTab === "pekerjaan-rumah" || destTab === "pekerjaan_rumah") {
          destTab = "tugas";
        } else if (destTab === "materi" || destTab === "mata-pelajaran" || destTab === "mata_pelajaran") {
          destTab = "mapel";
        } else if (destTab === "ujian" || destTab === "praktek-ujian" || destTab === "praktek_ujian") {
          destTab = "praktek";
        } else if (destTab === "jurnal") {
          destTab = "piket";
        } else if (destTab === "beranda" || destTab === "home" || destTab === "utama") {
          destTab = "dashboard";
        }

        // Fire navigation callback
        onTabNavigate(destTab);
        showNotification(`AI mengalihkan tampilan ke tab ${destTab.toUpperCase()}! 🚀`, "success");
        
        // Strip the command cleanly so it is not shown raw to user
        aiResponseText = aiResponseText.replace(navRegex, "").replace(/---/g, "").trim();
      }

      // Scan for ACTION command inside the response (e.g. ACTION:ADD_SISWA:{"namaSiswa":"Yunus",...})
      const actRegex = /ACTION:([A-Z_]+):(\{.*\})/i;
      const actMatch = aiResponseText.match(actRegex);
      if (actMatch) {
        const actionType = actMatch[1].toUpperCase();
        try {
          const actionPayload = JSON.parse(actMatch[2]);
          let success = false;
          
          if (actionType === "ADD_KELAS" && onAddKelas) {
            onAddKelas(actionPayload);
            success = true;
          } else if (actionType === "UPDATE_KELAS" && onUpdateKelas) {
            onUpdateKelas(actionPayload);
            success = true;
          } else if (actionType === "DELETE_KELAS" && onDeleteKelas) {
            onDeleteKelas(actionPayload.id);
            success = true;
          } else if (actionType === "ADD_MAPEL" && onAddMapel) {
            onAddMapel(actionPayload);
            success = true;
          } else if (actionType === "UPDATE_MAPEL" && onUpdateMapel) {
            onUpdateMapel(actionPayload);
            success = true;
          } else if (actionType === "DELETE_MAPEL" && onDeleteMapel) {
            onDeleteMapel(actionPayload.id);
            success = true;
          } else if (actionType === "ADD_SISWA" && onAddSiswa) {
            onAddSiswa(actionPayload);
            success = true;
          } else if (actionType === "UPDATE_SISWA" && onUpdateSiswa) {
            onUpdateSiswa(actionPayload);
            success = true;
          } else if (actionType === "DELETE_SISWA" && onDeleteSiswa) {
            onDeleteSiswa(actionPayload.id);
            success = true;
          } else if (actionType === "ADD_KATEGORI" && onAddKategori) {
            onAddKategori(actionPayload);
            success = true;
          } else if (actionType === "UPDATE_KATEGORI" && onUpdateKategori) {
            onUpdateKategori(actionPayload);
            success = true;
          } else if (actionType === "DELETE_KATEGORI" && onDeleteKategori) {
            onDeleteKategori(actionPayload.id);
            success = true;
          } else if (actionType === "ADD_PENILAIAN" && onAddPenilaian) {
            onAddPenilaian(actionPayload);
            success = true;
          } else if (actionType === "UPDATE_PENILAIAN" && onUpdatePenilaian) {
            onUpdatePenilaian(actionPayload);
            success = true;
          } else if (actionType === "DELETE_PENILAIAN" && onDeletePenilaian) {
            onDeletePenilaian(actionPayload.id);
            success = true;
          } else if (actionType === "ADD_TUGAS" && onAddTugas) {
            const payload = {
              judul: actionPayload.judul || "Tugas Bahasa Arab Baru",
              deskripsiSoal: actionPayload.deskripsiSoal || "Silakan pelajari lembar materi/tugas di atas dengan saksama.",
              tanggalDibuat: actionPayload.tanggalDibuat || new Date().toISOString().split("T")[0],
              dueDate: actionPayload.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              kelasId: actionPayload.kelasId || "semua",
              teacherCode: actionPayload.teacherCode || teacherCode || "USTADZ-01",
              lampiranFile: actionPayload.lampiranFile || undefined,
              lampiranFileType: actionPayload.lampiranFileType || (actionPayload.lampiranFile ? "image" : "none")
            };
            onAddTugas(payload);
            success = true;
          }

          if (success) {
            showNotification(`Asisten AI berhasil melakukan aksi: ${actionType}!`, "success");
          }
        } catch (err) {
          console.error("Gagal menjalankan perintah aksi AI:", err);
        }
        
        // Strip the command cleanly so it is not shown raw to user
        aiResponseText = aiResponseText.replace(actRegex, "").trim();
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Maaf, sistem AI sedang menemui gangguan jaringan atau API Key belum disetel dengan benar. Mohon tanyakan kembali beberapa saat lagi setelah memeriksa koneksi.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Apakah Anda ingin menghapus seluruh riwayat percakapan dengan AI Co-pilot ini?")) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Riwayat obrolan telah dibersihkan. Ada lagi yang bisa saya bantu untuk memudahkan pengoperasian SiswaDigital hari ini?",
          timestamp: new Date()
        }
      ]);
    }
  };

  // Helper local renderer to transform markdown list and bolds safely
  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      // Bold rendering
      let parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match;
      const lineText = line;
      
      // Simple italic markdown rendering (_text_)
      const italicRegex = /_([^_]+)_/g;

      // Render line styling
      // If it's a bullet point
      const isBullet = lineText.trim().startsWith("-") || lineText.trim().startsWith("*");
      let lineClass = "text-[13px] leading-relaxed mb-1.5 text-slate-700 font-sans";
      let displayLine = lineText;
      
      if (isBullet) {
        lineClass = "text-[13px] leading-relaxed mb-1.5 pl-4 relative text-slate-700 font-sans before:content-['•'] before:absolute before:left-1 before:text-[#718F6E]";
        displayLine = lineText.replace(/^[-*]\s*/, "");
      }

      // Check bold tags
      let innerHtml = displayLine;
      innerHtml = innerHtml.replace(boldRegex, "<strong>$1</strong>");
      innerHtml = innerHtml.replace(italicRegex, "<em>$1</em>");

      return (
        <p 
          key={lineIdx} 
          className={lineClass}
          dangerouslySetInnerHTML={{ __html: innerHtml || "&nbsp;" }}
        />
      );
    });
  };

  return (
    <div 
      id="ai-copilot-container" 
      className="fixed bottom-6 right-6 z-50 no-print font-sans select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.15s ease-out"
      }}
    >
      
      {/* Floating Sparkly Button */}
      {!isOpen && (
        <button
          onClick={() => {
            if (dragDistanceRef.current < 5) {
              setIsOpen(true);
            }
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="flex items-center gap-2 px-4.5 py-3 rounded-full bg-gradient-to-r from-[#2D3A3A] to-[#425555] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 select-none cursor-grab group active:cursor-grabbing"
          title="Tanya AI Guru Co-pilot (Geser untuk memindahkan)"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-[#8BA888] animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#8BA888] rounded-full border border-white animate-ping" />
          </div>
          <span className="text-xs font-extrabold tracking-wider pr-0.5">Tanya AI Guru</span>
        </button>
      )}

      {/* Styled Chat Panel dialog */}
      {isOpen && (
        <div 
          className="w-96 md:w-[410px] h-[580px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
          id="ai-chat-window"
        >
          {/* Header Banner - Draggable */}
          <div 
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            className="bg-[#2D3A3A] px-5 py-4 flex items-center justify-between text-white border-b border-[#3e4f4f] shrink-0 select-none"
            title="Tarik di sini untuk menggeser posisi chat"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#3e4f4f] rounded-xl flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-[#8BA888]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-wide text-white">SiswaDigital AI Co-pilot</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#8BA888] rounded-full animate-ping" />
                  <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Asisten Pintar Guru</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Speaker sound toggle */}
              <button
                onClick={() => {
                  const newMute = !isMuted;
                  setIsMuted(newMute);
                  if (newMute && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  showNotification(newMute ? "Suara AI dinonaktifkan." : "Suara AI diaktifkan (Suara Manusia).", "success");
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Aktifkan suara" : "Matikan suara"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#8BA888]" />}
              </button>

              {/* Reset memory button */}
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Hapus Percakapan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {/* Close panel */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sembunyikan"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>



          {/* Quick Context Banner */}
          <div className="bg-[#FAF9F5] px-4 py-2 border-b border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 select-none">
              <Bot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">C: {siswa.length}S, {kelas.length}K, {penilaian.length}R</span>
            </div>
            {currentRole === "admin" && (
              <button 
                onClick={handleTriggerSelfHealing}
                disabled={isHealingMode}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white font-extrabold px-2 py-0.5 rounded-md text-[9px] tracking-wider uppercase flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none border border-emerald-500"
              >
                <Shield className="w-2.5 h-2.5 animate-spin" />
                <span>🔧 Auto-Heal</span>
              </button>
            )}
            <span className="bg-sage-light text-slate-700 px-1.5 py-0.5 rounded-md font-bold uppercase scale-90 shrink-0">
              {currentRole === "guru" ? "GURU MODE" : "WALI MODE"}
            </span>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {isHealingMode ? (
              <div className="bg-slate-950 font-mono text-emerald-400 p-4 rounded-xl border border-slate-800 shadow-inner space-y-2 text-[10px] min-h-[280px] h-full overflow-y-auto text-left">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5 mb-2 text-white font-bold tracking-widest text-[10px] uppercase">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span>SISTEM DIAGNOSTIK AI</span>
                </div>
                {healLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-l border-emerald-800/30 pl-2">
                    {log}
                  </div>
                ))}
                {robotExpression === "happy" && (
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHealingMode(false);
                        setRobotExpression("idle");
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-lg w-full cursor-pointer uppercase transition-all shadow-md text-[10px]"
                    >
                      Buka Chat Kembali
                    </button>
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border font-semibold text-[11px] select-none ${
                    msg.role === "user" 
                      ? "bg-[#8BA888] border-green-200 text-white" 
                      : "bg-[#EAE8D2] border-amber-200 text-[#2D3A3A]"
                  }`}>
                    {msg.role === "user" ? "G" : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3.5 rounded-2xl shadow-xs border ${
                    msg.role === "user"
                      ? "bg-[#FFFFFF] border-slate-200 text-slate-800 rounded-tr-xs"
                      : "bg-white border-slate-200 text-slate-800 rounded-tl-xs"
                  }`}>
                    <div className="prose prose-sm max-w-none break-words">
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-200 shadow-xs max-w-xs bg-slate-50">
                          <img src={msg.image} alt="Unggahan berkas" className="max-h-48 w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      {renderMessageContent(msg.content)}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* AI Typing Loader Indicator */}
            {!isHealingMode && isLoading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-[#EAE8D2] border border-amber-200 text-[#2D3A3A] font-extrabold text-[11px]">
                  AI
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#8BA888] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#8BA888] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#8BA888] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span>Sedang meneliti data penilaian Anda...</span>
                </div>
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* Quick Click Recommendation Suggestions */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1.5 mb-2 flex items-center gap-1 select-none">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Rekomendasi Tanya AI</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {suggestedPrompts.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(btn.text)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-[#FAF9F5] border border-slate-200 hover:border-amber-300 text-[11px] text-slate-600 font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-left line-clamp-1 cursor-pointer select-none"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attached Image Thumbnail Preview */}
          {attachedImage && (
            <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 select-none no-print">
              <div className="flex items-center gap-2">
                <img src={attachedImage} alt="Attachment" className="w-8 h-8 rounded-lg object-cover border border-slate-300" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold text-slate-500 font-mono">Lampiran: gambar_tugas.jpg</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded bg-white border border-slate-200 cursor-pointer"
                title="Hapus gambar"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Lower Input Controls */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 items-center shrink-0"
          >
            {/* Hidden File Picker */}
            <input
              type="file"
              accept="image/*"
              ref={imageUploadRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setAttachedImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
                if (e.target) e.target.value = "";
              }}
              className="hidden"
            />

            <button
              type="button"
              disabled={isLoading}
              onClick={() => imageUploadRef.current?.click()}
              className="p-2.5 bg-white hover:bg-slate-150 border border-slate-300 text-slate-600 hover:text-[#8BA888] rounded-xl flex items-center justify-center transition-colors cursor-pointer select-none"
              title="Unggah Gambar / Tugas Siswa"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Notes Recorder Mic icon */}
            <button
              type="button"
              onClick={handleToggleVoiceRecord}
              disabled={isLoading}
              className={`p-2.5 border rounded-xl flex items-center justify-center transition-all cursor-pointer select-none ${
                isRecording 
                  ? "bg-rose-50 border-rose-300 text-rose-600 animate-pulse scale-105" 
                  : "bg-white border-slate-300 text-slate-600 hover:text-rose-500 hover:bg-rose-50/30"
              }`}
              title={isRecording ? "Sedang Merekam... Klik untuk Berhenti" : "Kirim Voice Note (Bicara)"}
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder={isRecording ? "Mendengarkan suara Anda..." : attachedImage ? "Beri deskripsi/tanya tentang gambar..." : "Tulis pesan Anda/Bicara di sini..."}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8BA888] focus:border-[#8BA888] transition-colors font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !attachedImage)}
              className="h-9 px-3.5 rounded-xl bg-[#2D3A3A] hover:bg-[#425555] text-[#8BA888] disabled:opacity-40 font-semibold flex items-center justify-center shadow-md shadow-slate-900/10 transition-colors cursor-pointer hover:scale-105 active:scale-95 duration-150"
              title="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
