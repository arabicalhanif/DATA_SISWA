import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Users, 
  ClipboardList, 
  ClipboardCheck, 
  FileText,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  Github,
  FileSpreadsheet,
  Calendar,
  Clock,
  Lock,
  Home,
  ArrowRight,
  ArrowLeft,
  Shield,
  DoorOpen,
  Megaphone,
  Award,
  Maximize2,
  Minimize2,
  MessageSquare,
  BarChart2
} from "lucide-react";

import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, GuruCode, AbsenSiswa, AbsenGuru, Jadwal, Announcement, Tugas, PengumpulanTugas, UjianPraktek, GuruPiket, TeacherAgenda } from "./types";
import { 
  initAuth, 
  importDataFromGoogleSheets, 
  fetchUserSpreadsheetId, 
  setSpreadsheetId, 
  syncUserSpreadsheetId, 
  exportLocalDataToGoogleSheets,
  SPREADSHEET_ID,
  fetchAcademicDataFromFirestore,
  syncAcademicDataToFirestore,
  createGoogleSpreadsheet,
  emailAndPasswordSignIn,
  emailAndPasswordSignUp
} from "./lib/googleSheets";
import HomeworkPortal from "./components/HomeworkPortal";
import { 
  INITIAL_KELAS, 
  INITIAL_MAPEL, 
  INITIAL_SISWA, 
  INITIAL_KATEGORI, 
  INITIAL_PENILAIAN,
  INITIAL_ABSEN_SISWA,
  INITIAL_ABSEN_GURU,
  INITIAL_JADWAL
} from "./initialData";

// Components
import { RealtimeClockWidgetMini, RealtimeClockWidgetLarge } from "./components/RealtimeClock";
import Dashboard from "./components/Dashboard";
import KelasCRUD from "./components/KelasCRUD";
import MapelCRUD from "./components/MapelCRUD";
import SiswaCRUD from "./components/SiswaCRUD";
import KategoriCRUD from "./components/KategoriCRUD";
import PenilaianForm from "./components/PenilaianForm";
import LaporanView from "./components/LaporanView";
import ExcelIntegration from "./components/ExcelIntegration";
import WaliMuridView from "./components/WaliMuridView";
import AdminPortal from "./components/AdminPortal";
import AICopilot from "./components/AICopilot";
import AttendancePortal from "./components/AttendancePortal";
import SchedulePortal from "./components/SchedulePortal";
import AnnouncementManager from "./components/AnnouncementManager";
import UjianPraktekView from "./components/UjianPraktekView";
import GuruPiketView from "./components/GuruPiketView";
import BroadcastConsole from "./components/BroadcastConsole";
import { KegiatanEkstra } from "./types";
import KegiatanEkstraView from "./components/KegiatanEkstraView";
import RekapTerpadu from "./components/RekapTerpadu";
import { Palette, Paintbrush, Download, Trash, Undo2 } from "lucide-react";

// Brightness adjuster utility to darken or lighten Hex colors
function adjustColorBrightness(hex: string, percent: number): string {
  if (!hex || hex.trim() === "") return "#8BA888";
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#8BA888"; // fallback
  }

  r = Math.max(0, Math.min(255, r + (percent * 2.55)));
  g = Math.max(0, Math.min(255, g + (percent * 2.55)));
  b = Math.max(0, Math.min(255, b + (percent * 2.55)));

  const rHex = Math.round(r).toString(16).padStart(2, '0');
  const gHex = Math.round(g).toString(16).padStart(2, '0');
  const bHex = Math.round(b).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

const THEME_PRESETS = [
  {
    name: "Default Moss Elegant",
    primaryColor: "#8BA888",
    primaryHover: "#718F6E",
    bgPage: "#F7F8F3",
    bgSidebar: "#2D3A3A",
    bgCard: "#FFFFFF",
    textMain: "#2D3A3A",
    textSidebar: "#FFFFFF",
    patternType: "geo",
    patternOpacity: 25,
    fontFamily: "Outfit",
    icon: "🌿",
    description: "Tema asli Al-Hanif yang sejuk, bersahaja, dan tenang."
  },
  {
    name: "Sweet Sakura Cute",
    primaryColor: "#F472B6",
    primaryHover: "#DB2777",
    bgPage: "#FFF5F5",
    bgSidebar: "#4D1D2D",
    bgCard: "#FFFFFF",
    textMain: "#501B2E",
    textSidebar: "#FFFFFF",
    patternType: "hearts",
    patternOpacity: 50,
    fontFamily: "Quicksand",
    icon: "🌸",
    description: "Nuansa merah muda sakura yang imut, riang, dan penuh kasih sayang."
  },
  {
    name: "Blueberry Ice Cream",
    primaryColor: "#06B6D4",
    primaryHover: "#0891B2",
    bgPage: "#F0FDFA",
    bgSidebar: "#0F3A44",
    bgCard: "#FFFFFF",
    textMain: "#0F2D3A",
    textSidebar: "#FFFFFF",
    patternType: "dots",
    patternOpacity: 40,
    fontFamily: "Inter",
    icon: "🧊",
    description: "Sangat segar, modern, asri, dan memberikan efek menenangkan mata."
  },
  {
    name: "Golden Honey Bee",
    primaryColor: "#F59E0B",
    primaryHover: "#D97706",
    bgPage: "#FEFCE8",
    bgSidebar: "#3C2809",
    bgCard: "#FFFFFF",
    textMain: "#451A03",
    textSidebar: "#FFFFFF",
    patternType: "grid",
    patternOpacity: 35,
    fontFamily: "Outfit",
    icon: "🐝",
    description: "Kombinasi kuning madu cerah dan aksen cokelat hangat yang energik."
  },
  {
    name: "Lavender Twilight",
    primaryColor: "#A78BFA",
    primaryHover: "#8B5CF6",
    bgPage: "#FAF5FF",
    bgSidebar: "#2E1C4D",
    bgCard: "#FFFFFF",
    textMain: "#2E1030",
    textSidebar: "#FFFFFF",
    patternType: "stars",
    patternOpacity: 50,
    fontFamily: "Outfit",
    icon: "🌌",
    description: "Warna ungu lavender anggun yang bernuansa magis, malam, dan elegan."
  },
  {
    name: "Matcha Latte Cream",
    primaryColor: "#65A30D",
    primaryHover: "#4D7C0F",
    bgPage: "#F7FEE7",
    bgSidebar: "#1A2E05",
    bgCard: "#FFFFFF",
    textMain: "#1A2E05",
    textSidebar: "#FFFFFF",
    patternType: "dots",
    patternOpacity: 35,
    fontFamily: "Quicksand",
    icon: "🍵",
    description: "Hijau teh matcha lembut yang sangat asri, menyejukkan, dan ramah anak."
  },
  {
    name: "Kawaii Strawberry Cat",
    primaryColor: "#F43F5E",
    primaryHover: "#E11D48",
    bgPage: "#FFF1F2",
    bgSidebar: "#4C0519",
    bgCard: "#FFFFFF",
    textMain: "#4C0519",
    textSidebar: "#FFFFFF",
    patternType: "cats",
    patternOpacity: 45,
    fontFamily: "Quicksand",
    icon: "🐱",
    description: "Motif telapak kaki kucing imut dengan dominan warna stroberi segar lucu."
  },
  {
    name: "Cosmic Midnight",
    primaryColor: "#3B82F6",
    primaryHover: "#2563EB",
    bgPage: "#0B132B",
    bgSidebar: "#1C2541",
    bgCard: "#1C2541",
    textMain: "#C5D1E8",
    textSidebar: "#FFFFFF",
    patternType: "stars",
    patternOpacity: 70,
    fontFamily: "JetBrains Mono",
    icon: "🚀",
    description: "Tema gelap kosmik bertabur bintang yang futuristik dan aman untuk mata."
  },
  {
    name: "Vintage Royal Palace",
    primaryColor: "#B91C1C",
    primaryHover: "#991B1B",
    bgPage: "#FDF6E2",
    bgSidebar: "#450A0A",
    bgCard: "#FFFFFF",
    textMain: "#220303",
    textSidebar: "#FFFFFF",
    patternType: "geo",
    patternOpacity: 40,
    fontFamily: "Playfair",
    icon: "🕌",
    description: "Perpaduan merah marun ningrat dwi-warna khas kerajaan yang agung."
  },
  {
    name: "Cozy Boba Tea",
    primaryColor: "#0D9488",
    primaryHover: "#0F766E",
    bgPage: "#FCF8F2",
    bgSidebar: "#2D2214",
    bgCard: "#FFFFFF",
    textMain: "#3F3220",
    textSidebar: "#FFFFFF",
    patternType: "grid",
    patternOpacity: 30,
    fontFamily: "Outfit",
    icon: "🧋",
    description: "Kombinasi latte cokelat boba yang hangat, estetik, dan menyenangkan."
  },
  {
    name: "Cute Cotton Candy",
    primaryColor: "#EC4899",
    primaryHover: "#DB2777",
    bgPage: "#EEF2FF",
    bgSidebar: "#4F46E5",
    bgCard: "#FFFFFF",
    textMain: "#312E81",
    textSidebar: "#FFFFFF",
    patternType: "hearts",
    patternOpacity: 35,
    fontFamily: "Quicksand",
    icon: "🍬",
    description: "Warna pastel manis perpaduan pink stroberi dan biru langit yang sangat imut."
  },
  {
    name: "Aesthetic Warm Peach",
    primaryColor: "#F97316",
    primaryHover: "#EA580C",
    bgPage: "#FFF7ED",
    bgSidebar: "#431407",
    bgCard: "#FFFFFF",
    textMain: "#431407",
    textSidebar: "#FFFFFF",
    patternType: "dots",
    patternOpacity: 45,
    fontFamily: "Outfit",
    icon: "🍑",
    description: "Gradasi jingga buah persik hangat laksana senja yang kalem dan estetik."
  },
  {
    name: "Elegant Emerald Jade",
    primaryColor: "#059669",
    primaryHover: "#047857",
    bgPage: "#F0FDF4",
    bgSidebar: "#064E3B",
    bgCard: "#FFFFFF",
    textMain: "#064E3B",
    textSidebar: "#FFFFFF",
    patternType: "geo",
    patternOpacity: 35,
    fontFamily: "Playfair",
    icon: "💎",
    description: "Nuansa hijau zamrud mewah yang sangat tenang, profesional, dan agung."
  },
  {
    name: "Cute Custard Pudding",
    primaryColor: "#EAB308",
    primaryHover: "#CA8A04",
    bgPage: "#FEFCE8",
    bgSidebar: "#422006",
    bgCard: "#FFFFFF",
    textMain: "#451A03",
    textSidebar: "#FFFFFF",
    patternType: "cats",
    patternOpacity: 35,
    fontFamily: "Quicksand",
    icon: "🍮",
    description: "Cokelat karamel lembut berpadu kuning puding yang manis dan menggemaskan."
  },
  {
    name: "Aesthetic Sage Garden",
    primaryColor: "#10B981",
    primaryHover: "#059669",
    bgPage: "#F4F7F5",
    bgSidebar: "#2E3F37",
    bgCard: "#FFFFFF",
    textMain: "#1C2E24",
    textSidebar: "#FFFFFF",
    patternType: "dots",
    patternOpacity: 30,
    fontFamily: "Inter",
    icon: "🌿",
    description: "Warna hijau daun sage modern yang estetik, teduh, dan ramah lingkungan."
  },
  {
    name: "Elegant Lilac Blossom",
    primaryColor: "#C084FC",
    primaryHover: "#A855F7",
    bgPage: "#FDF7FF",
    bgSidebar: "#3B0764",
    bgCard: "#FFFFFF",
    textMain: "#2E0854",
    textSidebar: "#FFFFFF",
    patternType: "stars",
    patternOpacity: 45,
    fontFamily: "Outfit",
    icon: "🦄",
    description: "Bunga lilac ungu muda pastel yang magis, lembut, dan menenangkan jiwa."
  },
  {
    name: "Aesthetic Choco Mint",
    primaryColor: "#14B8A6",
    primaryHover: "#0D9488",
    bgPage: "#F0FDFA",
    bgSidebar: "#271A12",
    bgCard: "#FFFFFF",
    textMain: "#271A12",
    textSidebar: "#FFFFFF",
    patternType: "grid",
    patternOpacity: 40,
    fontFamily: "Quicksand",
    icon: "🍃",
    description: "Kombinasi menyegarkan antara minty green dan cokelat gelap premium."
  },
  {
    name: "Elegant Rose Gold",
    primaryColor: "#FDA4AF",
    primaryHover: "#F43F5E",
    bgPage: "#FFF1F2",
    bgSidebar: "#4C0519",
    bgCard: "#FFFFFF",
    textMain: "#31050F",
    textSidebar: "#FFFFFF",
    patternType: "geo",
    patternOpacity: 30,
    fontFamily: "Playfair",
    icon: "🌹",
    description: "Perpaduan mawar pink keemasan yang berkilau mewah, anggun, dan berkelas."
  },
  {
    name: "Gotham Charcoal City",
    primaryColor: "#2563EB",
    primaryHover: "#1D4ED8",
    bgPage: "#F1F5F9",
    bgSidebar: "#0F172A",
    bgCard: "#FFFFFF",
    textMain: "#0F172A",
    textSidebar: "#F1F5F9",
    patternType: "grid",
    patternOpacity: 25,
    fontFamily: "Outfit",
    icon: "🏙️",
    description: "Gaya urban modern kota metropolitan yang elegan, maskulin, dan profesional untuk Pendidik ikhwan."
  },
  {
    name: "Carbon Asphalt F1",
    primaryColor: "#DC2626",
    primaryHover: "#B91C1C",
    bgPage: "#F8FAFC",
    bgSidebar: "#1E293B",
    bgCard: "#FFFFFF",
    textMain: "#0F172A",
    textSidebar: "#F8FAFC",
    patternType: "geo",
    patternOpacity: 30,
    fontFamily: "JetBrains Mono",
    icon: "🏎️",
    description: "Kecepatan dan performa dalam paduan serat karbon abu-abu, merah menyala, otomotif berkelas tinggi."
  },
  {
    name: "Sakura Garden Blossom",
    primaryColor: "#F472B6",
    primaryHover: "#EC4899",
    bgPage: "#FFF5F7",
    bgSidebar: "#9D174D",
    bgCard: "#FFFFFF",
    textMain: "#831843",
    textSidebar: "#FFF5F7",
    patternType: "hearts",
    patternOpacity: 35,
    fontFamily: "Quicksand",
    icon: "🌸",
    description: "Sentuhan lembut mawar sakura segar, meneduhkan hati, merepresentasikan kelembutan ustadzah akhwat."
  },
  {
    name: "Sovereign Dark Gold",
    primaryColor: "#D97706",
    primaryHover: "#B45309",
    bgPage: "#0E0F14",
    bgSidebar: "#050608",
    bgCard: "#171923",
    textMain: "#E5E7EB",
    textSidebar: "#F9FAFB",
    patternType: "stars",
    patternOpacity: 30,
    fontFamily: "Playfair",
    icon: "🔱",
    description: "Kemewahan premium absolut malam berbalut warna gelap pekat terlapis keemasan agung nan megah."
  },
  {
    name: "Imperial Scarlet Dark",
    primaryColor: "#E11D48",
    primaryHover: "#BE1230",
    bgPage: "#0F0206",
    bgSidebar: "#020001",
    bgCard: "#18070B",
    textMain: "#FFE4E6",
    textSidebar: "#FFE4E6",
    patternType: "geo",
    patternOpacity: 25,
    fontFamily: "Outfit",
    icon: "🎗️",
    description: "Pesona berkharisma ksatria berselimut merah delima crimson pekat dan hitam legam mewah tak terbatas."
  },
  {
    name: "Classic Shelby GT",
    primaryColor: "#15803D",
    primaryHover: "#166534",
    bgPage: "#F0FDF4",
    bgSidebar: "#14532D",
    bgCard: "#FFFFFF",
    textMain: "#14532D",
    textSidebar: "#F0FDF4",
    patternType: "grid",
    patternOpacity: 35,
    fontFamily: "Outfit",
    icon: "🏎️",
    description: "Desain mobil balap retro legendaris warna hijau botol (Racing Green) dipadukan garis putih melambangkan performa kerja melaju cepat."
  },
  {
    name: "Grand Luxury Swiss Watch",
    primaryColor: "#D97706",
    primaryHover: "#B45309",
    bgPage: "#FAF7F2",
    bgSidebar: "#1C1917",
    bgCard: "#FFFFFF",
    textMain: "#1C1917",
    textSidebar: "#FAF7F2",
    patternType: "geo",
    patternOpacity: 40,
    fontFamily: "Cinzel",
    icon: "⌚",
    description: "Gaya maskulin arloji mewah Swiss, memadukan tembaga fajar, bodi baja hitam pekat, dan tipografi Romawi klasik abadi."
  },
  {
    name: "Sakura Blossom Garden",
    primaryColor: "#EC4899",
    primaryHover: "#DB2777",
    bgPage: "#FFF5F7",
    bgSidebar: "#500724",
    bgCard: "#FFFFFF",
    textMain: "#500724",
    textSidebar: "#FFF5F7",
    patternType: "hearts",
    patternOpacity: 45,
    fontFamily: "Fredoka",
    icon: "🌸",
    description: "Taman bunga sakura bermekaran dengan bodi pink pastel lembut dan tipografi gelembung Fredoka imut yang manis untuk Ustadzah akhwat."
  },
  {
    name: "Warm Jasmine Pearl",
    primaryColor: "#0D9488",
    primaryHover: "#0F766E",
    bgPage: "#FAFDFB",
    bgSidebar: "#112F24",
    bgCard: "#FFFFFF",
    textMain: "#112F24",
    textSidebar: "#FAFDFB",
    patternType: "stars",
    patternOpacity: 35,
    fontFamily: "Great Vibes",
    icon: "🌼",
    description: "Keharuman melati putih tradisional dan aksen benang sulam emas yang halus dengan jenis huruf kaligrafi latin premium."
  },
  {
    name: "Cute Cotton Candy Bear",
    primaryColor: "#F472B6",
    primaryHover: "#EC4899",
    bgPage: "#F0F9FF",
    bgSidebar: "#1E3A8A",
    bgCard: "#FFFFFF",
    textMain: "#1E306E",
    textSidebar: "#F0F9FF",
    patternType: "cats",
    patternOpacity: 40,
    fontFamily: "Comfortaa",
    icon: "🧸",
    description: "Paduan balon permen kapas pink-biru muda ceria dan huruf Comfortaa modern, sangat ramah anak dan disukai santri cilik."
  },
  {
    name: "Midnight Royal Black Gold",
    primaryColor: "#EAB308",
    primaryHover: "#CA8A04",
    bgPage: "#090A0F",
    bgSidebar: "#030406",
    bgCard: "#131520",
    textMain: "#FDFDFD",
    textSidebar: "#FDFDFD",
    patternType: "geo",
    patternOpacity: 60,
    fontFamily: "Cinzel",
    icon: "🔱",
    description: "Mahakarya gelap premium absolut berkilau emas berlatar beludru obsidian fajar hitam disulam megah huruf Romawi mewah."
  },
  {
    name: "Velvet Crimson Stars",
    primaryColor: "#F43F5E",
    primaryHover: "#E11D48",
    bgPage: "#0D0306",
    bgSidebar: "#030001",
    bgCard: "#16070B",
    textMain: "#FFE4E6",
    textSidebar: "#FFE4E6",
    patternType: "stars",
    patternOpacity: 55,
    fontFamily: "Great Vibes",
    icon: "🏮",
    description: "Malam premium berselimut merah delima crimson beludru, dihiasi bintang gemerlap dan kaligrafi mawar menguntai indah."
  }
];

type TabMenu = "dashboard" | "kelas" | "mapel" | "siswa" | "kategori" | "penilaian" | "laporan" | "excel" | "absen" | "jadwal" | "pengumuman" | "tugas" | "praktek" | "piket" | "admin_panel" | "broadcast" | "ekstra" | "rekap";


export default function App() {
  const [activeTab, setActiveTab] = useState<TabMenu>(() => {
    return (localStorage.getItem("PSD_ACTIVE_TAB") as TabMenu) || "dashboard";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "guru" | "wali" | null>(() => {
    return (localStorage.getItem("PSD_USER_ROLE") as any) || null;
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem("PSD_ADMIN_UNLOCKED") === "true";
  });
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");

  // Fullscreen layout controls
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Gagal masuk mode layar penuh:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Back button synchronization using HTML5 history pushState / popstate 
  const [waliActiveSiswa, setWaliActiveSiswa] = useState<Siswa | null>(() => {
    const saved = localStorage.getItem("PSD_WALI_ACTIVE_SISWA");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [parentActiveTab, setParentActiveTab] = useState<"rapor" | "absen" | "jadwal" | "tugas" | "les" | "kalender" | "ekstra" | "hubungi">(() => {
    return (localStorage.getItem("PSD_PARENT_ACTIVE_TAB") as any) || "rapor";
  });

  const [kegiatan, setKegiatan] = useState<KegiatanEkstra[]>(() => {
    const saved = localStorage.getItem("PSD_KEGIATAN_EKSTRA");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const isPopStateRef = React.useRef(false);

  useEffect(() => {
    // Check initial state on page mount
    if (!window.history.state) {
      window.history.replaceState({
        role: (localStorage.getItem("PSD_USER_ROLE") as any) || null,
        tab: (localStorage.getItem("PSD_ACTIVE_TAB") as any) || "dashboard",
        waliSiswa: (() => {
          const s = localStorage.getItem("PSD_WALI_ACTIVE_SISWA");
          try { return s ? JSON.parse(s) : null; } catch { return null; }
        })(),
        parentTab: localStorage.getItem("PSD_PARENT_ACTIVE_TAB") || "rapor"
      }, "");
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        isPopStateRef.current = true;
        setUserRole(e.state.role);
        setActiveTab(e.state.tab);
        setWaliActiveSiswa(e.state.waliSiswa);
        setParentActiveTab(e.state.parentTab);
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 50);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab) localStorage.setItem("PSD_ACTIVE_TAB", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem("PSD_USER_ROLE", userRole);
    } else {
      localStorage.removeItem("PSD_USER_ROLE");
    }
  }, [userRole]);

  useEffect(() => {
    if (waliActiveSiswa) {
      localStorage.setItem("PSD_WALI_ACTIVE_SISWA", JSON.stringify(waliActiveSiswa));
    } else {
      localStorage.removeItem("PSD_WALI_ACTIVE_SISWA");
    }
  }, [waliActiveSiswa]);

  useEffect(() => {
    if (parentActiveTab) localStorage.setItem("PSD_PARENT_ACTIVE_TAB", parentActiveTab);
  }, [parentActiveTab]);

  useEffect(() => {
    if (isPopStateRef.current) return;

    const currentState = {
      role: userRole,
      tab: activeTab,
      waliSiswa: waliActiveSiswa,
      parentTab: parentActiveTab
    };

    const histState = window.history.state;
    const isSame = histState &&
      histState.role === userRole &&
      histState.tab === activeTab &&
      ((!histState.waliSiswa && !waliActiveSiswa) || (histState.waliSiswa?.id === waliActiveSiswa?.id)) &&
      histState.parentTab === parentActiveTab;

    if (!isSame) {
      window.history.pushState(currentState, "");
    }
  }, [userRole, activeTab, waliActiveSiswa, parentActiveTab]);

  // Admin Portal & Teacher uniqueness codes control state
  const [guruCodes, setGuruCodes] = useState<GuruCode[]>(() => {
    const saved = localStorage.getItem("PSD_GURU_CODES");
    if (saved) return JSON.parse(saved);
    return [
      { code: "USTADZ-01", namaGuru: "Ustadz Abdurrahman, S.Pd.I.", assignedKelasId: "K001", createdAt: "2026-05-18", isActive: true, phoneNumber: "628123456781" },
      { code: "USTADZ-02", namaGuru: "Ustadzah Fatimah, S.Pd.", assignedKelasId: "K007", createdAt: "2026-05-19", isActive: true, phoneNumber: "628123456782" },
      { code: "USTADZ-03", namaGuru: "Ustadz Ahmad Fauzi, Lc.", assignedKelasId: "K025", createdAt: "2026-05-20", isActive: true, phoneNumber: "628123456783" }
    ];
  });

  // Guru Piket state
  const [guruPiket, setGuruPiket] = useState<GuruPiket[]>(() => {
    const saved = localStorage.getItem("PSD_GURU_PIKET");
    if (saved) return JSON.parse(saved);
    return [
      { id: "piket-1", hari: "Senin", namaGuru: "Ustadz Abdurrahman, S.Pd.I.", nohp: "628123456781", statusTugas: "Standby", areaPiket: "Gedung Utama, Rombel Lantai 1" },
      { id: "piket-2", hari: "Selasa", namaGuru: "Ustadzah Fatimah, S.Pd.", nohp: "628123456782", statusTugas: "Standby", areaPiket: "Gedung RA, Masjid Hijau" },
      { id: "piket-3", hari: "Rabu", namaGuru: "Ustadz Ahmad Fauzi, Lc.", nohp: "628123456783", statusTugas: "Standby", areaPiket: "Gedung Baru, Lantai 2" },
      { id: "piket-4", hari: "Kamis", namaGuru: "Ustadz Dr. Luqman Hakim, S.Pd.I", nohp: "628129876543", statusTugas: "Standby", areaPiket: "Rombel Kelas 4 & 5" },
      { id: "piket-5", hari: "Jumat", namaGuru: "Ustadzah Zahra Al-Atas, Lc", nohp: "628123212345", statusTugas: "Standby", areaPiket: "Piket Umum Utama" }
    ];
  });

  // Arabic homework tasks state
  const [tugas, setTugas] = useState<Tugas[]>(() => {
    const saved = localStorage.getItem("PSD_TUGAS");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "TUG-SEED-1",
        judul: "Kuis Mufradat Al-Jadid (الْمُفْرَدَاتُ الْجَدِيْدَةُ)",
        deskripsiSoal: "Terjemahkan kata-kata berikut ke dalam Bahasa Indonesia dengan benar:\n1. مَدْرَسَةٌ (Sekolah)\n2. بَيْتٌ (Rumah)\n3. كِتَابٌ (Buku)\n4. أُسْتَاذٌ (Guru)\n\nKerjakan di buku catatan, lalu foto dan unggah lembar jawaban Anda ke sistem ini.",
        tanggalDibuat: "2026-05-22",
        dueDate: "2026-06-02",
        kelasId: "semua",
        teacherCode: "USTADZ-01"
      }
    ];
  });

  const [pengumpulanTugas, setPengumpulanTugas] = useState<PengumpulanTugas[]>(() => {
    const saved = localStorage.getItem("PSD_PENGUMPULAN_TUGAS");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "SUB-SEED-1",
        tugasId: "TUG-SEED-1",
        siswaId: "S2A-1",
        tanggalKumpul: "2026-05-22",
        linkFileAtauFoto: "Jawaban_Tulis_Arab_Murid.jpg",
        catatanSiswa: "Assalamualaikum ustadz, ini tugas AHMAD FAUZAN Kelas 2A.",
        statusVerifikasi: "Belum Diverifikasi"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("PSD_TUGAS", JSON.stringify(tugas));
  }, [tugas]);

  useEffect(() => {
    localStorage.setItem("PSD_PENGUMPULAN_TUGAS", JSON.stringify(pengumpulanTugas));
  }, [pengumpulanTugas]);

  const [currentGuruCode, setCurrentGuruCode] = useState<string | null>(() => {
    return localStorage.getItem("PSD_CURRENT_GURU_CODE") || null;
  });

  const [verificationInput, setVerificationInput] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "code">("email");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Visual Theme Engine states
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [adminTargetThemeKey, setAdminTargetThemeKey] = useState<"admin" | "default">("admin");

  // We'll manage themes as a key-value store in localStorage so that they are isolated per portal path.
  const [portalThemes, setPortalThemes] = useState<{ [key: string]: any }>(() => {
    try {
      const saved = localStorage.getItem("PSD_PORTAL_THEMES_DICT");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  const defaultTheme = {
    name: "Default Moss Elegant",
    primaryColor: "#8BA888",
    primaryHover: "#718F6E",
    bgPage: "#F7F8F3",
    bgSidebar: "#2D3A3A",
    bgCard: "#FFFFFF",
    textMain: "#2D3A3A",
    textSidebar: "#FFFFFF",
    patternType: "geo", // geo, dots, stars, hearts, cats, grid, none
    patternOpacity: 25,
    customBgUrl: "",
    customBgSize: "cover", // cover, contain, repeat
    fontFamily: "Outfit", // Inter, Outfit, JetBrains Mono, Quicksand, Playfair
  };

  const currentPortalKey = useMemo(() => {
    if (userRole === "guru" && currentGuruCode) {
      return `guru_${currentGuruCode}`;
    }
    if (userRole === "admin" && isAdminUnlocked) {
      return adminTargetThemeKey;
    }
    if (userRole === "wali") {
      return "wali";
    }
    return "default";
  }, [userRole, currentGuruCode, isAdminUnlocked, adminTargetThemeKey]);

  const activeTheme = useMemo(() => {
    return portalThemes[currentPortalKey] || defaultTheme;
  }, [portalThemes, currentPortalKey]);

  const setActiveTheme = (newTheme: any) => {
    setPortalThemes(prev => {
      const currentTheme = prev[currentPortalKey] || defaultTheme;
      const nextTheme = typeof newTheme === 'function' ? newTheme(currentTheme) : newTheme;
      const updated = {
        ...prev,
        [currentPortalKey]: nextTheme
      };
      localStorage.setItem("PSD_PORTAL_THEMES_DICT", JSON.stringify(updated));
      return updated;
    });
  };

  // Save Theme on change
  useEffect(() => {
    localStorage.setItem("PSD_PORTAL_THEME", JSON.stringify(activeTheme));
  }, [activeTheme]);

  // Dynamic CSS Generator for Root Styling
  const injectedCSS = useMemo(() => {
    const {
      primaryColor,
      primaryHover,
      bgPage,
      bgSidebar,
      bgCard,
      textMain,
      textSidebar,
      patternType,
      patternOpacity,
      customBgUrl,
      customBgSize,
      fontFamily
    } = activeTheme;

    let bgImageStr = "";
    const cleanPrimary = (primaryColor || "#8BA888").replace("#", "");

    if (customBgUrl && customBgUrl.trim().length > 0) {
      bgImageStr = `url("${customBgUrl}")`;
    } else {
      switch (patternType) {
        case "dots":
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='5' fill='%23${cleanPrimary}' fill-opacity='${patternOpacity / 300}'/%3E%3C/svg%3E")`;
          break;
        case "hearts":
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M12 5 c -2 -2, -5 -2, -7 0 c -2 2, -2 5, 0 7 l 7 7 l 7 -7 c 2 -2, 2 -5, 0 -7 c -2 -2, -5 -2, -7 0' fill='%23${cleanPrimary}' fill-opacity='${patternOpacity / 350}'/%3E%3C/svg%3E")`;
          break;
        case "cats":
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 100 100'%3E%3Cg fill='%23${cleanPrimary}' fill-opacity='${patternOpacity / 300}'%3E%3Ccircle cx='50' cy='60' r='14'/%3E%3Ccircle cx='30' cy='40' r='7'/%3E%3Ccircle cx='50' cy='30' r='7'/%3E%3Ccircle cx='70' cy='40' r='7'/%3E%3C/g%3E%3C/svg%3E")`;
          break;
        case "stars":
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23${cleanPrimary}' fill-opacity='${patternOpacity / 250}'%3E%3Cpath d='M10 5L11 8L14 9L11 10L10 13L9 10L6 9L9 8Z'/%3E%3Cpath d='M45 25L46 27L48 28L46 29L45 31L44 29L42 28L44 27Z'/%3E%3Ccircle cx='30' cy='45' r='2'/%3E%3Ccircle cx='15' cy='25' r='1.5'/%3E%3Ccircle cx='50' cy='12' r='2.5'/%3E%3C/g%3E%3C/svg%3E")`;
          break;
        case "grid":
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='%23${cleanPrimary}' stroke-width='1.2' stroke-opacity='${patternOpacity / 400}'/%3E%3C/svg%3E")`;
          break;
        case "none":
          bgImageStr = "none";
          break;
        case "geo":
        default:
          bgImageStr = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg stroke='%23${cleanPrimary}' stroke-width='0.5' fill='none' stroke-opacity='${patternOpacity / 250}'%3E%3Cpath d='M50 0 L61.7 38.3 L100 50 L61.7 61.7 L50 100 L38.3 61.7 L0 50 L38.3 38.3 Z'/%3E%3Crect x='28' y='28' width='44' height='44' transform='rotate(45 50 50)'/%3E%3Ccircle cx='50' cy='50' r='18' stroke-dasharray='1,3'/%3E%3Ccircle cx='50' cy='50' r='26'/%3E%3Ccircle cx='50' cy='50' r='8'/%3E%3C/g%3E%3C/svg%3E")`;
          break;
      }
    }

    let fontStack = `"Inter", sans-serif`;
    if (fontFamily === "Outfit") fontStack = `"Outfit", sans-serif`;
    else if (fontFamily === "JetBrains Mono") fontStack = `"JetBrains Mono", monospace`;
    else if (fontFamily === "Quicksand") fontStack = `"Quicksand", "Inter", sans-serif`;
    else if (fontFamily === "Playfair") fontStack = `"Playfair Display", "Georgia", serif`;
    else if (fontFamily === "Fredoka") fontStack = `"Fredoka", "Quicksand", sans-serif`;
    else if (fontFamily === "Pacifico") fontStack = `"Pacifico", cursive`;
    else if (fontFamily === "Comfortaa") fontStack = `"Comfortaa", cursive`;
    else if (fontFamily === "Caveat") fontStack = `"Caveat", cursive`;
    else if (fontFamily === "Cinzel") fontStack = `"Cinzel", serif`;
    else if (fontFamily === "Great Vibes") fontStack = `"Great Vibes", cursive`;

    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Quicksand:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Fredoka:wght@400;500;600;700&family=Pacifico&family=Comfortaa:wght@400;500;700&family=Caveat:wght@400;700&family=Cinzel:wght@400;700;900&family=Great+Vibes&display=swap');

      :root {
        --color-slate-50: ${bgPage};
        --color-slate-100: ${adjustColorBrightness(bgPage, -4)};
        --color-slate-200: ${adjustColorBrightness(bgPage, -12)};
        --color-cream-canvas: ${bgPage};
        
        --color-slate-800: ${textMain};
        --color-slate-900: ${textMain};
        
        --color-emerald-500: ${primaryColor};
        --color-emerald-600: ${primaryHover};
        --color-[#577354]: ${primaryHover};
        --color-emerald-100: ${adjustColorBrightness(primaryColor, 40)};
        --color-emerald-50: ${adjustColorBrightness(primaryColor, 52)};
        
        --color-forest-dark: ${bgSidebar};
        --color-sage-green: ${primaryColor};
        
        --font-sans: ${fontStack};
      }

      body {
        background-color: ${bgPage} !important;
        font-family: ${fontStack} !important;
      }

      .bg-cream-canvas {
        background-color: ${bgPage} !important;
      }

      .bg-islamic-pattern {
        background-image: ${bgImageStr} !important;
        background-size: ${customBgSize === "cover" ? "cover" : customBgSize === "contain" ? "contain" : "auto"} !important;
        background-repeat: ${customBgSize === "repeat" ? "repeat" : "no-repeat"} !important;
        opacity: 1 !important;
      }

      aside.bg-forest-dark, .bg-forest-dark {
        background-color: ${bgSidebar} !important;
        color: ${textSidebar} !important;
      }

      .text-emerald-600 {
        color: ${primaryColor} !important;
      }
      .text-emerald-500 {
        color: ${primaryColor} !important;
      }
      .border-emerald-500 {
        border-color: ${primaryColor} !important;
      }
      .bg-emerald-50 {
        background-color: ${adjustColorBrightness(primaryColor, 52)} !important;
      }
    `;
  }, [activeTheme]);

  const activeGuruProfile = guruCodes.find(g => g.code === currentGuruCode && g.isActive);

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      showToast("Email dan Kata Sandi wajib diisi!", "neutral");
      return;
    }
    setAuthLoading(true);
    try {
      if (isSignUp) {
        // Sign-Up Flow
        const user = await emailAndPasswordSignUp(emailInput.trim(), passwordInput.trim(), displayNameInput.trim());
        setGoogleUser(user);
        showToast("Registrasi sukses! Selamat datang.", "success");
        
        // Auto-detect role
        const lowerEmail = emailInput.toLowerCase();
        if (lowerEmail === "documenmondok003@gmail.com" || lowerEmail.includes("admin")) {
          setIsAdminUnlocked(true);
          localStorage.setItem("PSD_ADMIN_UNLOCKED", "true");
          setUserRole("admin");
          localStorage.setItem("PSD_USER_ROLE", "admin");
        } else {
          // If they entered a matching guru code on signup, associate it!
          const codeVal = verificationInput.trim().toUpperCase();
          const matched = codeVal ? guruCodes.find(g => g.code.toUpperCase() === codeVal && g.isActive) : undefined;
          
          if (matched) {
            setGuruCodes(prev => prev.map(g => g.code === matched.code ? { ...g, email: lowerEmail } : g));
            setCurrentGuruCode(matched.code);
            localStorage.setItem("PSD_CURRENT_GURU_CODE", matched.code);
            setUserRole("guru");
            localStorage.setItem("PSD_USER_ROLE", "guru");
            showToast(`Akun Anda terhubung dengan profil ${matched.namaGuru}`, "success");
          } else {
            // Since no other verification code is required, automatically spawn a clean teacher profile
            const generatedCode = "GURU-" + Math.floor(1000 + Math.random() * 9000);
            const friendlyName = displayNameInput.trim() || emailInput.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            const newGuru: GuruCode = {
              code: generatedCode,
              namaGuru: friendlyName,
              assignedKelasId: "K001",
              createdAt: new Date().toISOString().split("T")[0],
              isActive: true,
              phoneNumber: "",
              email: lowerEmail
            };
            setGuruCodes(prev => [...prev, newGuru]);
            setCurrentGuruCode(generatedCode);
            localStorage.setItem("PSD_CURRENT_GURU_CODE", generatedCode);
            setUserRole("guru");
            localStorage.setItem("PSD_USER_ROLE", "guru");
            showToast(`Akun Baru Guru disiapkan: ${friendlyName}`, "success");
          }
        }
      } else {
        // Sign-In Flow
        const user = await emailAndPasswordSignIn(emailInput.trim(), passwordInput.trim());
        setGoogleUser(user);
        showToast("Masuk berhasil!", "success");
        
        // Auto-detect role
        const lowerEmail = emailInput.toLowerCase();
        if (lowerEmail === "documenmondok003@gmail.com" || lowerEmail.includes("admin")) {
          setIsAdminUnlocked(true);
          localStorage.setItem("PSD_ADMIN_UNLOCKED", "true");
          setUserRole("admin");
          localStorage.setItem("PSD_USER_ROLE", "admin");
        } else {
          setUserRole("guru");
          localStorage.setItem("PSD_USER_ROLE", "guru");

          // Look up if any profile in guruCodes matches this login email
          const existingGuruByEmail = guruCodes.find(g => g.email?.toLowerCase() === lowerEmail);
          const savedCode = localStorage.getItem("PSD_CURRENT_GURU_CODE");

          if (existingGuruByEmail) {
            setCurrentGuruCode(existingGuruByEmail.code);
            localStorage.setItem("PSD_CURRENT_GURU_CODE", existingGuruByEmail.code);
            showToast(`Selamat datang kembali, ${existingGuruByEmail.namaGuru}!`, "success");
          } else if (savedCode && guruCodes.some(g => g.code === savedCode)) {
            setCurrentGuruCode(savedCode);
            setGuruCodes(prev => prev.map(g => g.code === savedCode ? { ...g, email: lowerEmail } : g));
            showToast("Masuk berhasil!", "success");
          } else {
            // Check if they typed a code in the verificationInput field
            const codeVal = verificationInput.trim().toUpperCase();
            const matched = codeVal ? guruCodes.find(g => g.code.toUpperCase() === codeVal && g.isActive) : undefined;

            if (matched) {
              setGuruCodes(prev => prev.map(g => g.code === matched.code ? { ...g, email: lowerEmail } : g));
              setCurrentGuruCode(matched.code);
              localStorage.setItem("PSD_CURRENT_GURU_CODE", matched.code);
              showToast(`Akun terhubung dengan profil ${matched.namaGuru}!`, "success");
            } else {
              // Automatically spawn a clean teacher profile so they can enter immediately
              const generatedCode = "GURU-" + Math.floor(1000 + Math.random() * 9000);
              const friendlyName = user.displayName || emailInput.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              const newGuru: GuruCode = {
                code: generatedCode,
                namaGuru: friendlyName,
                assignedKelasId: "K001",
                createdAt: new Date().toISOString().split("T")[0],
                isActive: true,
                phoneNumber: "",
                email: lowerEmail
              };
              setGuruCodes(prev => [...prev, newGuru]);
              setCurrentGuruCode(generatedCode);
              localStorage.setItem("PSD_CURRENT_GURU_CODE", generatedCode);
              showToast(`Selamat datang, ${friendlyName}! Profil Guru baru disiapkan.`, "success");
            }
          }
        }
      }
      
      // Clean up fields
      setEmailInput("");
      setPasswordInput("");
      setDisplayNameInput("");
      setVerificationInput("");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Terjadi kesalahan autentikasi.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "Alamat email ini sudah terdaftar.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Email atau sandi salah.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Kata sandi terlalu pendek (minimal 6 karakter).";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Format alamat email tidak valid.";
      } else if (err.message) {
        errMsg = err.message;
      }
      showToast(errMsg, "neutral");
    } finally {
      setAuthLoading(false);
    }
  };

  // Core STATE load from LocalStorage with smart initials fallback
  const [kelas, setKelas] = useState<Kelas[]>(() => {
    const saved = localStorage.getItem("PSD_KELAS");
    return saved ? JSON.parse(saved) : INITIAL_KELAS;
  });

  const [mapel, setMapel] = useState<MataPelajaran[]>(() => {
    const saved = localStorage.getItem("PSD_MAPEL");
    return saved ? JSON.parse(saved) : INITIAL_MAPEL;
  });

  const [siswa, setSiswa] = useState<Siswa[]>(() => {
    const saved = localStorage.getItem("PSD_SISWA");
    if (saved) {
      try {
        const list = JSON.parse(saved);
        // Robust Self-Healing: check if Kelas 2A and Kelas 2B have duplicated names (evidence of the old generator bug)
        const s2a = list.filter((s: any) => s.kelasId === "K001").map((s: any) => s.namaSiswa);
        const s2b = list.filter((s: any) => s.kelasId === "K002").map((s: any) => s.namaSiswa);
        const hasDuplicationBug = s2a.length > 0 && s2b.length > 0 && s2a[0] === s2b[0];
        if (!hasDuplicationBug) {
          return list;
        }
      } catch (e) {
        // Fallback to initial
      }
    }
    return INITIAL_SISWA;
  });

  const [kategori, setKategori] = useState<KategoriPenilaian[]>(() => {
    const saved = localStorage.getItem("PSD_KATEGORI");
    return saved ? JSON.parse(saved) : INITIAL_KATEGORI;
  });

  const [penilaian, setPenilaian] = useState<Penilaian[]>(() => {
    const saved = localStorage.getItem("PSD_PENILAIAN");
    return saved ? JSON.parse(saved) : INITIAL_PENILAIAN;
  });

  const [absenSiswa, setAbsenSiswa] = useState<AbsenSiswa[]>(() => {
    const saved = localStorage.getItem("PSD_ABSEN_SISWA");
    return saved ? JSON.parse(saved) : INITIAL_ABSEN_SISWA;
  });

  const [absenGuru, setAbsenGuru] = useState<AbsenGuru[]>(() => {
    const saved = localStorage.getItem("PSD_ABSEN_GURU");
    return saved ? JSON.parse(saved) : INITIAL_ABSEN_GURU;
  });

  const [jadwal, setJadwal] = useState<Jadwal[]>(() => {
    const saved = localStorage.getItem("PSD_JADWAL");
    return saved ? JSON.parse(saved) : INITIAL_JADWAL;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("PSD_ANNOUNCEMENTS");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "ann-1",
        title: "Ujian Akhir Semester Ganjil 2026",
        content: "Diberitahukan kepada seluruh siswa bahwa pelaksanaan UAS Ganjil akan diselenggarakan mulai tanggal 1-12 Juni 2026. Persiapkan diri Anda dengan rajin belajar, jaga kesehatan, dan laksanakan presensi kehadiran secara tertib.",
        date: "2026-05-22",
        authorName: "KOMUNITAS MGMP SDIT AL HANIF",
        authorCode: "MASTER-ADMIN"
      },
      {
        id: "ann-2",
        title: "Pelaksanaan Ekstrakurikuler Wajib Pramuka",
        content: "Kegiatan pramuka wajib bagi seluruh siswa akan diaktifkan kembali mulai Sabtu esok jam 14.00 WIB di lapangan sekolah. Mohon hadir tepat waktu menggunakan seragam pramuka lengkap.",
        date: "2026-05-20",
        authorName: "Ibu Siti Aminah, S.Pd.",
        authorCode: "GURU-002"
      }
    ];
  });

  const [ujianPraktek, setUjianPraktek] = useState<UjianPraktek[]>(() => {
    const saved = localStorage.getItem("PSD_UJIAN_PRAKTEK");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "PRK-SEED-1",
        namaUjian: "Ujian Praktek Percakapan (Hiwar) Bahasa Arab",
        kelasId: "K-02A",
        mapelId: "M-02",
        tanggal: "2026-05-22",
        items: [
          { siswaId: "S2A-1", nilai: 88, sudahMengikuti: true },
          { siswaId: "S2A-2", nilai: 92, sudahMengikuti: true },
          { siswaId: "S2A-3", nilai: undefined, sudahMengikuti: false }
        ]
      }
    ];
  });

  const [agendas, setAgendas] = useState<TeacherAgenda[]>(() => {
    const saved = localStorage.getItem("PSD_TEACHER_AGENDAS");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "AGD-1",
        tanggal: "2026-05-23",
        judul: "Persiapan Penilaian Tengah Semester (PTS)",
        deskripsi: "Menyiapkan lembar latihan kosa kata Bahasa Arab tentang perkenalan dasar.",
        pertemuanKe: "Pertemuan 10",
        deadlinePertemuanLain: "Pertemuan 11 (Evaluasi Mandiri)",
        kelasId: "K001",
        isCompleted: false,
        teacherCode: "GURU-001",
        createdAt: new Date().toISOString()
      },
      {
        id: "AGD-2",
        tanggal: "2026-05-24",
        judul: "Pengambilan Nilai Surat Pendek",
        deskripsi: "Mendengarkan satu per satu setoran kelancaran hafalan An-Naas s/d Al-Falaq.",
        pertemuanKe: "Pertemuan 14",
        deadlinePertemuanLain: "Pertemuan 15 (Batas Akhir Remedial)",
        kelasId: "K007",
        isCompleted: false,
        teacherCode: "GURU-001",
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Persists states automatically
  useEffect(() => {
    localStorage.setItem("PSD_TEACHER_AGENDAS", JSON.stringify(agendas));
  }, [agendas]);

  // Google Sheets Auto-Sync States on Launch
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGSheetsSyncingOnLaunch, setIsGSheetsSyncingOnLaunch] = useState(false);
  const [gsLaunchSyncError, setGsLaunchSyncError] = useState<string | null>(null);
  const [gsLaunchSyncSuccess, setGsLaunchSyncSuccess] = useState<boolean>(false);

  // Real-time Cloud Auto-Sync engine states
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(() => localStorage.getItem("PSD_AUTO_SYNC_ENABLED") !== "false");
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);

        // Auto-configure user role and map Guru profile on refresh/auth detection
        if (user.email) {
          const lowerEmail = user.email.toLowerCase();
          if (lowerEmail === "documenmondok003@gmail.com" || lowerEmail.includes("admin")) {
            setIsAdminUnlocked(true);
            localStorage.setItem("PSD_ADMIN_UNLOCKED", "true");
            setUserRole("admin");
            localStorage.setItem("PSD_USER_ROLE", "admin");
          } else {
            setUserRole("guru");
            localStorage.setItem("PSD_USER_ROLE", "guru");
            
            // Look up existing profile or create one
            const savedGuru = localStorage.getItem("PSD_GURU_CODES");
            const listGuru: GuruCode[] = savedGuru ? JSON.parse(savedGuru) : [
              { code: "USTADZ-01", namaGuru: "Ustadz Abdurrahman, S.Pd.I.", assignedKelasId: "K001", createdAt: "2026-05-18", isActive: true, phoneNumber: "628123456781" },
              { code: "USTADZ-02", namaGuru: "Ustadzah Fatimah, S.Pd.", assignedKelasId: "K007", createdAt: "2026-05-19", isActive: true, phoneNumber: "628123456782" },
              { code: "USTADZ-03", namaGuru: "Ustadz Ahmad Fauzi, Lc.", assignedKelasId: "K025", createdAt: "2026-05-20", isActive: true, phoneNumber: "628123456783" }
            ];

            const existing = listGuru.find(g => g.email?.toLowerCase() === lowerEmail);
            const savedCode = localStorage.getItem("PSD_CURRENT_GURU_CODE");

            if (existing) {
              setCurrentGuruCode(existing.code);
              localStorage.setItem("PSD_CURRENT_GURU_CODE", existing.code);
            } else if (savedCode && listGuru.some(g => g.code === savedCode)) {
              setCurrentGuruCode(savedCode);
              setGuruCodes(prev => prev.map(g => g.code === savedCode ? { ...g, email: lowerEmail } : g));
            } else {
              const generatedCode = "GURU-" + Math.floor(1000 + Math.random() * 9000);
              const friendlyName = user.displayName || user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
              const newGuru: GuruCode = {
                code: generatedCode,
                namaGuru: friendlyName,
                assignedKelasId: "K001",
                createdAt: new Date().toISOString().split("T")[0],
                isActive: true,
                phoneNumber: "",
                email: lowerEmail
              };
              setGuruCodes(prev => {
                if (prev.some(g => g.email?.toLowerCase() === lowerEmail)) return prev;
                return [...prev, newGuru];
              });
              setCurrentGuruCode(generatedCode);
              localStorage.setItem("PSD_CURRENT_GURU_CODE", generatedCode);
            }
          }
        }

        setIsGSheetsSyncingOnLaunch(true);
        setGsLaunchSyncError(null);
        try {
          // 1. Fetch custom Spreadsheet ID from Firestore for cross-device sync!
          const cloudSheetId = await fetchUserSpreadsheetId(user.uid);
          if (cloudSheetId) {
            setSpreadsheetId(cloudSheetId);
          } else if (SPREADSHEET_ID) {
            // Backup the current local spreadsheet id to cloud if not already synced
            await syncUserSpreadsheetId(user.uid, user.email || "", SPREADSHEET_ID);
          }

          // 2. Fetch Academic State backup from Google Cloud Firestore
          const cloudState = await fetchAcademicDataFromFirestore(user.uid);

          // 3. Auto-pull/sync upon launch/refresh from Google Sheets
          let data = null;
          try {
            data = await importDataFromGoogleSheets(token);
          } catch (sheetsErr: any) {
            console.warn("Gagal mengimpor data secara langsung dari Google Sheets, beralih ke cadangan Firestore...", sheetsErr);
            const errMsg = String(sheetsErr.message || "");
            if (errMsg.includes("403") || errMsg.includes("Gagal") || !cloudSheetId) {
              console.log("Mendeteksi galat akses atau pengguna baru. Membuat spreadsheet pribadi berjalan otomatis...");
              try {
                const autoSheetId = await createGoogleSpreadsheet(token, `SiswaDigital_SDIT_AlHanif_Database`);
                if (autoSheetId) {
                  setSpreadsheetId(autoSheetId);
                  await syncUserSpreadsheetId(user.uid, user.email || "", autoSheetId);
                  // Push current cloudState or default empty structure to the newly created spreadsheet
                  const fallbackData = cloudState || {
                    kelas, mapel, siswa, kategori, penilaian,
                    guru: guruCodes, jadwal, tugas, absenSiswa, absenGuru,
                    announcements, ujianPraktek, pengumpulanTugas, guruPiket, agendas
                  };
                  await exportLocalDataToGoogleSheets(token, {
                    kelas: fallbackData.kelas || [],
                    mapel: fallbackData.mapel || [],
                    siswa: fallbackData.siswa || [],
                    kategori: fallbackData.kategori || [],
                    penilaian: fallbackData.penilaian || [],
                    guru: fallbackData.guru || fallbackData.guruCodes || [],
                    jadwal: fallbackData.jadwal || [],
                    tugas: fallbackData.tugas || [],
                    absenSiswa: fallbackData.absenSiswa || [],
                    absenGuru: fallbackData.absenGuru || [],
                    announcements: fallbackData.announcements || [],
                    ujianPraktek: fallbackData.ujianPraktek || [],
                    pengumpulanTugas: fallbackData.pengumpulanTugas || [],
                    guruPiket: fallbackData.guruPiket || [],
                    agendas: fallbackData.agendas || []
                  });
                  data = await importDataFromGoogleSheets(token);
                }
              } catch (createErr) {
                console.error("Gagal asisten cerdas pembuatan otomatis spreadsheet Google Anda:", createErr);
              }
            }
          }

          const finalData = data || cloudState;

          if (finalData) {
            if (finalData.kelas && finalData.kelas.length > 0) setKelas(finalData.kelas);
            if (finalData.mapel && finalData.mapel.length > 0) setMapel(finalData.mapel);
            if (finalData.siswa && finalData.siswa.length > 0) setSiswa(finalData.siswa);
            if (finalData.kategori && finalData.kategori.length > 0) setKategori(finalData.kategori);
            if (finalData.penilaian) setPenilaian(finalData.penilaian);
            
            // Backup other local entities to state
            const loadedGuru = finalData.guru || finalData.guruCodes;
            if (loadedGuru && loadedGuru.length > 0) setGuruCodes(loadedGuru);
            if (finalData.jadwal && finalData.jadwal.length > 0) setJadwal(finalData.jadwal);
            if (finalData.tugas && finalData.tugas.length > 0) setTugas(finalData.tugas);
            if (finalData.absenSiswa && finalData.absenSiswa.length > 0) setAbsenSiswa(finalData.absenSiswa);
            if (finalData.absenGuru && finalData.absenGuru.length > 0) setAbsenGuru(finalData.absenGuru);
            if (finalData.announcements && finalData.announcements.length > 0) setAnnouncements(finalData.announcements);
            if (finalData.ujianPraktek && finalData.ujianPraktek.length > 0) setUjianPraktek(finalData.ujianPraktek);
            if (finalData.pengumpulanTugas && finalData.pengumpulanTugas.length > 0) setPengumpulanTugas(finalData.pengumpulanTugas);
            if (finalData.guruPiket && finalData.guruPiket.length > 0) setGuruPiket(finalData.guruPiket);
            if (finalData.agendas && finalData.agendas.length > 0) setAgendas(finalData.agendas);

            setGsLaunchSyncSuccess(true);
          } else {
            console.log("Pengguna baru terdeteksi dengan state kosong, menyimpan data lokal saat ini ke Cloud.");
            await syncAcademicDataToFirestore(user.uid, {
              kelas, mapel, siswa, kategori, penilaian,
              guru: guruCodes, jadwal, tugas, absenSiswa, absenGuru,
              announcements, ujianPraktek, pengumpulanTugas, guruPiket, agendas
            });
            setGsLaunchSyncSuccess(true);
          }
        } catch (err: any) {
          console.error("Auto-sync dengan Google Sheets Gagal:", err);
          setGsLaunchSyncError(err.message || "Gagal menghubungi Spreadsheet");
        } finally {
          setIsGSheetsSyncingOnLaunch(false);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setIsGSheetsSyncingOnLaunch(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("PSD_ANNOUNCEMENTS", JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem("PSD_UJIAN_PRAKTEK", JSON.stringify(ujianPraktek));
  }, [ujianPraktek]);

  useEffect(() => {
    localStorage.setItem("PSD_KELAS", JSON.stringify(kelas));
  }, [kelas]);

  useEffect(() => {
    localStorage.setItem("PSD_MAPEL", JSON.stringify(mapel));
  }, [mapel]);

  useEffect(() => {
    localStorage.setItem("PSD_SISWA", JSON.stringify(siswa));
  }, [siswa]);

  useEffect(() => {
    localStorage.setItem("PSD_KATEGORI", JSON.stringify(kategori));
  }, [kategori]);

  useEffect(() => {
    localStorage.setItem("PSD_PENILAIAN", JSON.stringify(penilaian));
  }, [penilaian]);

  useEffect(() => {
    localStorage.setItem("PSD_ABSEN_SISWA", JSON.stringify(absenSiswa));
  }, [absenSiswa]);

  useEffect(() => {
    localStorage.setItem("PSD_ABSEN_GURU", JSON.stringify(absenGuru));
  }, [absenGuru]);

  useEffect(() => {
    localStorage.setItem("PSD_JADWAL", JSON.stringify(jadwal));
  }, [jadwal]);

  // Allowed data filtering for the current logged-in teacher (strictly showing only taught classes/data)
  const teacherClassIdsForFiltering = useMemo(() => {
    if (userRole !== "guru" || !activeGuruProfile) return [];
    const assignedIds = activeGuruProfile.assignedKelasIds || (activeGuruProfile.assignedKelasId ? [activeGuruProfile.assignedKelasId] : []);
    const scheduledIds = (jadwal || [])
      .filter(j => j.teacherCode === activeGuruProfile.code)
      .map(j => j.kelasId);
    return Array.from(new Set([...assignedIds, ...scheduledIds]));
  }, [userRole, activeGuruProfile, jadwal]);

  const allowedKelas = useMemo(() => {
    if (userRole === "admin") return kelas;
    if (userRole === "guru" && activeGuruProfile) {
      if (teacherClassIdsForFiltering.length > 0) {
        return kelas.filter(k => teacherClassIdsForFiltering.includes(k.id));
      }
      return []; // empty if no classes assigned (classes not taught -> no data at all)
    }
    return kelas;
  }, [kelas, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  const allowedSiswa = useMemo(() => {
    if (userRole === "admin") return siswa;
    if (userRole === "guru" && activeGuruProfile) {
      return siswa.filter(s => teacherClassIdsForFiltering.includes(s.kelasId));
    }
    return siswa;
  }, [siswa, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  const allowedKategori = useMemo(() => {
    if (userRole === "admin") return kategori;
    if (userRole === "guru" && activeGuruProfile) {
      return kategori.filter(k => teacherClassIdsForFiltering.includes(k.kelasId));
    }
    return kategori;
  }, [kategori, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  const allowedPenilaian = useMemo(() => {
    if (userRole === "admin") return penilaian;
    if (userRole === "guru" && activeGuruProfile) {
      const allowedKatIds = allowedKategori.map(k => k.id);
      return penilaian.filter(p => allowedKatIds.includes(p.kategoriId));
    }
    return penilaian;
  }, [penilaian, allowedKategori, userRole, activeGuruProfile]);

  const allowedUjianPraktek = useMemo(() => {
    if (userRole === "admin") return ujianPraktek;
    if (userRole === "guru" && activeGuruProfile) {
      return ujianPraktek.filter(u => teacherClassIdsForFiltering.includes(u.kelasId));
    }
    return ujianPraktek;
  }, [ujianPraktek, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  const allowedTugas = useMemo(() => {
    if (userRole === "admin") return tugas;
    if (userRole === "guru" && activeGuruProfile) {
      return tugas.filter(t => teacherClassIdsForFiltering.includes(t.kelasId));
    }
    return tugas;
  }, [tugas, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  const allowedAnnouncements = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const activeAnns = announcements.filter(ann => {
      if (ann.expiredDate && todayStr > ann.expiredDate) return false;
      return true;
    });

    if (userRole === "admin") return activeAnns;
    if (userRole === "guru" && activeGuruProfile) {
      return activeAnns.filter(ann => {
        if (!ann.targetKelasIds || ann.targetKelasIds.length === 0) return true;
        return ann.targetKelasIds.some(id => teacherClassIdsForFiltering.includes(id));
      });
    }
    return activeAnns;
  }, [announcements, userRole, activeGuruProfile, teacherClassIdsForFiltering]);

  useEffect(() => {
    localStorage.setItem("PSD_GURU_CODES", JSON.stringify(guruCodes));
  }, [guruCodes]);

  useEffect(() => {
    localStorage.setItem("PSD_GURU_PIKET", JSON.stringify(guruPiket));
  }, [guruPiket]);

  useEffect(() => {
    if (currentGuruCode) {
      localStorage.setItem("PSD_CURRENT_GURU_CODE", currentGuruCode);
    } else {
      localStorage.removeItem("PSD_CURRENT_GURU_CODE");
    }
  }, [currentGuruCode]);

  // Save auto-sync switch value to local storage
  useEffect(() => {
    localStorage.setItem("PSD_AUTO_SYNC_ENABLED", String(isAutoSyncEnabled));
  }, [isAutoSyncEnabled]);

  // Keep a ref to verify if initial data import on launch has completed
  const hasFinishedInitialPull = useRef(false);

  useEffect(() => {
    if (!isGSheetsSyncingOnLaunch) {
      const t = setTimeout(() => {
        hasFinishedInitialPull.current = true;
      }, 2000);
      return () => clearTimeout(t);
    } else {
      hasFinishedInitialPull.current = false;
    }
  }, [isGSheetsSyncingOnLaunch]);

  // Real-time automatic background synchronization to Google Sheets and Cloud Firestore
  useEffect(() => {
    if (!hasFinishedInitialPull.current) return;
    if (!googleUser) return;
    if (!isAutoSyncEnabled) return;

    setCloudSyncStatus("saving");
    setCloudSyncError(null);

    const timer = setTimeout(async () => {
      try {
        // 1. Sync to Google Sheets if access token is available
        if (googleAccessToken) {
          try {
            await exportLocalDataToGoogleSheets(googleAccessToken, {
              kelas,
              mapel,
              siswa,
              kategori,
              penilaian,
              guru: guruCodes,
              jadwal,
              tugas,
              absenSiswa,
              absenGuru,
              announcements,
              ujianPraktek,
              pengumpulanTugas,
              guruPiket,
              agendas
            });
          } catch (sheetsErr: any) {
            console.error("Auto-sync background ke Google Sheets gagal, beralih ke cadangan Firestore:", sheetsErr);
            const errMsg = String(sheetsErr.message || "");
            if (errMsg.includes("403")) {
              const cloudSheetId = await fetchUserSpreadsheetId(googleUser.uid);
              if (!cloudSheetId || SPREADSHEET_ID === "1fKIvJVpQ1XxTbj-eNTayRBbvMiHOYstrf3N3Lm18KcI") {
                console.log("Membuat spreadsheet pribadi otomatis dari background sync...");
                try {
                  const autoSheetId = await createGoogleSpreadsheet(googleAccessToken, `SiswaDigital_SDIT_AlHanif_Database`);
                  if (autoSheetId) {
                    setSpreadsheetId(autoSheetId);
                    await syncUserSpreadsheetId(googleUser.uid, googleUser.email || "", autoSheetId);
                    await exportLocalDataToGoogleSheets(googleAccessToken, {
                      kelas, mapel, siswa, kategori, penilaian, guru: guruCodes, jadwal, tugas, absenSiswa, absenGuru, announcements, ujianPraktek, pengumpulanTugas, guruPiket, agendas
                    });
                  }
                } catch (createErr) {
                  console.error("Gagal asisten otomatis pembuatan spreadsheet:", createErr);
                }
              }
            }
          }
        }

        // 2. Sync to Cloud Firestore (Google Database Account) for ultimate device-switch redundancy
        await syncAcademicDataToFirestore(googleUser.uid, {
          kelas,
          mapel,
          siswa,
          kategori,
          penilaian,
          guru: guruCodes,
          jadwal,
          tugas,
          absenSiswa,
          absenGuru,
          announcements,
          ujianPraktek,
          pengumpulanTugas,
          guruPiket,
          agendas
        });

        setCloudSyncStatus("saved");
        setCloudSyncError(null);
        setTimeout(() => setCloudSyncStatus("idle"), 4000);
      } catch (err: any) {
        console.error("Auto-sync background gagal:", err);
        setCloudSyncStatus("error");
        setCloudSyncError(err.message || "Koneksi Google/Firestore terputus.");
      }
    }, 4005); // 4 seconds debounce to bundle edits together

    return () => clearTimeout(timer);
  }, [
    kelas,
    mapel,
    siswa,
    kategori,
    penilaian,
    guruCodes,
    jadwal,
    tugas,
    absenSiswa,
    absenGuru,
    announcements,
    ujianPraktek,
    pengumpulanTugas,
    guruPiket,
    agendas,
    googleUser,
    googleAccessToken,
    isAutoSyncEnabled
  ]);

  // State to handle automatic timed-dismissal of welcome banners
  const [showWelcomeBanners, setShowWelcomeBanners] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeBanners(false);
    }, 45000); // 45 seconds (between 30s and 1 minute)
    return () => clearTimeout(timer);
  }, []);

  // Admin Portal state handlers
  const handleAddGuruCode = (
    name: string, 
    assignedKelasId?: string, 
    assignedKelasIds?: string[], 
    isWaliKelas?: boolean, 
    phoneNumber?: string,
    mapelAjars?: string[]
  ) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const code = isWaliKelas ? `WALI-${randomSuffix}` : `MAPEL-${randomSuffix}`;
    const newCodeItem: GuruCode = {
      code,
      namaGuru: name,
      assignedKelasId,
      assignedKelasIds,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true,
      phoneNumber: phoneNumber?.trim() || undefined,
      isWaliKelas: isWaliKelas || false,
      mapelAjars: mapelAjars || [],
      mapelAjar: mapelAjars && mapelAjars.length > 0 ? mapelAjars.join(", ") : undefined
    };
    setGuruCodes(prev => [...prev, newCodeItem]);
    showToast(`Berhasil menerbitkan kode ${code} untuk ${name}!`);
  };

  const handleToggleGuruCodeStatus = (code: string) => {
    setGuruCodes(prev => prev.map(g => g.code === code ? { ...g, isActive: !g.isActive } : g));
    showToast("Status aktif kode guru berhasil diperbarui.", "neutral");
  };

  const handleDeleteGuruCode = (code: string) => {
    setGuruCodes(prev => prev.filter(g => g.code !== code));
    if (currentGuruCode === code) {
      setCurrentGuruCode(null);
    }
    showToast("Kode unik berhasil dihapus.", "neutral");
  };

  const handleClearAllMasterData = () => {
    setKelas([]);
    setMapel([]);
    setSiswa([]);
    setKategori([]);
    setPenilaian([]);
    setAbsenSiswa([]);
    setAbsenGuru([]);
    setJadwal([]);
    setActiveTab("dashboard");
    showToast("Seluruh database telah dibersihkan secara total!", "neutral");
  };

  // Toast / System notifications state helper
  const [toast, setToast] = useState<{ text: string; type: "success" | "neutral" } | null>(null);

  const showToast = (text: string, type: "success" | "neutral" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // REST RESET BACK TO DEFAULTS SEED DATA
  const handleResetToSeeds = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang data kembali ke data contoh bawaan? Seluruh perubahan nilai Anda saat ini akan dihapus.")) {
      setKelas(INITIAL_KELAS);
      setMapel(INITIAL_MAPEL);
      setSiswa(INITIAL_SISWA);
      setKategori(INITIAL_KATEGORI);
      setPenilaian(INITIAL_PENILAIAN);
      setAbsenSiswa(INITIAL_ABSEN_SISWA);
      setAbsenGuru(INITIAL_ABSEN_GURU);
      setJadwal(INITIAL_JADWAL);
      setActiveTab("dashboard");
      showToast("Data berhasil di-reset ke data bawaan!", "neutral");
    }
  };

  // State mutators for KELAS
  const handleAddKelas = (val: Omit<Kelas, "id">) => {
    const newId = `K${String(kelas.length + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const newItem = { id: newId, ...val };
    setKelas(prev => [...prev, newItem]);
    showToast(`Kelas ${val.namaKelas} berhasil ditambahkan!`);
  };

  const handleUpdateKelas = (val: Kelas) => {
    setKelas(prev => prev.map(k => k.id === val.id ? val : k));
    showToast(`Data Kelas ${val.namaKelas} berhasil diperbarui!`);
  };

  const handleDeleteKelas = (id: string) => {
    // 1. Delete the class
    setKelas(prev => prev.filter(k => k.id !== id));
    // 2. Delete all students belonging to this class, their grades and attendance
    setSiswa(prev => {
      const removedStudents = prev.filter(s => s.kelasId === id);
      const removedStudentIds = removedStudents.map(s => s.id);
      
      // Remove student attendance for these students
      setAbsenSiswa(prevAbs => prevAbs.filter(ab => !removedStudentIds.includes(ab.siswaId)));
      
      // Remove grade records for these students
      setPenilaian(prevP => prevP.map(p => ({
        ...p,
        grades: p.grades.filter(g => !removedStudentIds.includes(g.siswaId))
      })));
      
      return prev.filter(s => s.kelasId !== id);
    });
    
    // 3. Remove student attendance associated with this class directly
    setAbsenSiswa(prev => prev.filter(ab => ab.kelasId !== id));
    
    // 4. Remove all categories of this class and their assessments
    setKategori(prev => {
      const removedKats = prev.filter(k => k.kelasId === id);
      const removedKatIds = removedKats.map(k => k.id);
      setPenilaian(prevP => prevP.filter(p => !removedKatIds.includes(p.kategoriId)));
      return prev.filter(k => k.kelasId !== id);
    });
    
    // 5. Remove schedules associated with this class
    setJadwal(prev => prev.filter(j => j.kelasId !== id));
    
    // 6. Clean up announcements target list
    setAnnouncements(prev => prev.map(ann => ({
      ...ann,
      targetKelasIds: ann.targetKelasIds ? ann.targetKelasIds.filter(cid => cid !== id) : []
    })));
    
    // 7. Clean up assigned classes from guru codes
    setGuruCodes(prev => prev.map(g => ({
      ...g,
      assignedKelasId: g.assignedKelasId === id ? undefined : g.assignedKelasId,
      assignedKelasIds: g.assignedKelasIds ? g.assignedKelasIds.filter(cid => cid !== id) : []
    })));

    showToast("Kelas, seluruh data siswa didalamnya, serta rekap nilai, jadwal, dan presensi terelasi berhasil dihapus permanen.", "neutral");
  };

  // State mutators for MAPEL
  const handleAddMapel = (val: Omit<MataPelajaran, "id">) => {
    const newId = `M${String(mapel.length + 1).padStart(3, "0")}`;
    const newItem = { id: newId, ...val };
    setMapel(prev => [...prev, newItem]);
    showToast(`Mata Pelajaran '${val.namaMapel}' berhasil didaftarkan!`);
  };

  const handleUpdateMapel = (val: MataPelajaran) => {
    setMapel(prev => prev.map(m => m.id === val.id ? val : m));
    showToast(`Mata Pelajaran '${val.namaMapel}' diperbarui.`);
  };

  const handleDeleteMapel = (id: string) => {
    setMapel(prev => prev.filter(m => m.id !== id));
    // Remove categories and assessments associated with this Mapel
    setKategori(prev => {
      const removedKats = prev.filter(k => k.mapelId === id);
      const removedIds = removedKats.map(k => k.id);
      setPenilaian(prevP => prevP.filter(p => !removedIds.includes(p.kategoriId)));
      return prev.filter(k => k.mapelId !== id);
    });
    // Remove scheduling for this Mapel
    setJadwal(prev => prev.filter(j => j.mapelId !== id));
    showToast("Mata pelajaran berhasil dihapus beserta seluruh kategori, jadwal, & lembar nilai terkait.", "neutral");
  };

  // State mutators for SISWA
  const handleAddSiswa = (val: Omit<Siswa, "id">) => {
    const newId = `S${String(siswa.length + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
    const newItem: Siswa = { id: newId, ...val, teacherCode: currentGuruCode || "GURU-MASTER" };
    setSiswa(prev => [...prev, newItem]);
    showToast(`Siswa ${val.namaSiswa} (NIS: ${val.nis}) terdaftar!`);
  };

  const handleUpdateSiswa = (val: Siswa) => {
    setSiswa(prev => prev.map(s => s.id === val.id ? val : s));
    showToast(`Data siswa '${val.namaSiswa}' berhasil diperbarui.`);
  };

  const handleDeleteSiswa = (id: string) => {
    setSiswa(prev => prev.filter(s => s.id !== id));
    // Also remove student score records from any penilaian lists
    setPenilaian(prev => prev.map(p => ({
      ...p,
      grades: p.grades.filter(g => g.siswaId !== id)
    })));
    // Remove student attendance records
    setAbsenSiswa(prev => prev.filter(a => a.siswaId !== id));
    showToast("Data siswa, histori nilai, dan catatan absensi berhasil disapu bersih dari seluruh sistem.", "neutral");
  };

  // State mutators for KATEGORI
  const handleAddKategori = (val: Omit<KategoriPenilaian, "id">): KategoriPenilaian => {
    const newId = `KT${String(kategori.length + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: KategoriPenilaian = { id: newId, ...val, teacherCode: currentGuruCode || "GURU-MASTER" };
    setKategori(prev => [...prev, newItem]);
    showToast(`Kategori ${val.namaKategori} berhasil ditambahkan!`);
    return newItem;
  };

  const handleUpdateKategori = (val: KategoriPenilaian) => {
    setKategori(prev => prev.map(kat => kat.id === val.id ? val : kat));
    showToast(`Kategori penugasan berhasil disunting.`);
  };

  const handleDeleteKategori = (id: string) => {
    setKategori(prev => prev.filter(kat => kat.id !== id));
    setPenilaian(prev => prev.filter(p => p.kategoriId !== id));
    showToast("Kategori Penilaian dan seluruh lembar nilai tugas di dalamnya berhasil dihapus.", "neutral");
  };

  // State mutators for PENILAIAN
  const handleAddPenilaian = (val: Omit<Penilaian, "id">) => {
    const newId = `P${String(penilaian.length + 1).padStart(3, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    const newItem: Penilaian = { id: newId, ...val, teacherCode: currentGuruCode || "GURU-MASTER" };
    setPenilaian(prev => [...prev, newItem]);
    showToast("Nilai tugas berhasil disimpan di database local!");
  };

  const handleUpdatePenilaian = (val: Penilaian) => {
    setPenilaian(prev => prev.map(p => p.id === val.id ? val : p));
    showToast("Nilai tugas berhasil diperbarui.");
  };

  const handleDeletePenilaian = (id: string) => {
    setPenilaian(prev => prev.filter(p => p.id !== id));
    showToast("Lembar penilaian beserta seluruh nilainya berhasil dihapus.", "neutral");
  };

  const handleAddTugasAI = (newTug: Omit<Tugas, "id">) => {
    const fresh: Tugas = {
      ...newTug,
      id: `TUG-${Date.now()}`
    };
    const updated = [fresh, ...tugas];
    setTugas(updated);
    localStorage.setItem("PSD_TUGAS", JSON.stringify(updated));
  };

  const handleImportAllData = (data: {
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
    guru?: GuruCode[];
    jadwal?: Jadwal[];
    tugas?: Tugas[];
    absenSiswa?: AbsenSiswa[];
    absenGuru?: AbsenGuru[];
    announcements?: Announcement[];
    ujianPraktek?: UjianPraktek[];
    pengumpulanTugas?: PengumpulanTugas[];
    guruPiket?: GuruPiket[];
    agendas?: TeacherAgenda[];
  }, mode: "replace" | "merge") => {
    if (mode === "replace") {
      setKelas(data.kelas);
      setMapel(data.mapel);
      setSiswa(data.siswa);
      setKategori(data.kategori);
      setPenilaian(data.penilaian);
      if (data.guru) {
        setGuruCodes(data.guru);
      }
      if (data.jadwal) {
        setJadwal(data.jadwal);
      }
      if (data.tugas) {
        setTugas(data.tugas);
      }
      if (data.absenSiswa) {
        setAbsenSiswa(data.absenSiswa);
      }
      if (data.absenGuru) {
        setAbsenGuru(data.absenGuru);
      }
      if (data.announcements) {
        setAnnouncements(data.announcements);
      }
      if (data.ujianPraktek) {
        setUjianPraktek(data.ujianPraktek);
      }
      if (data.pengumpulanTugas) {
        setPengumpulanTugas(data.pengumpulanTugas);
      }
      if (data.guruPiket) {
        setGuruPiket(data.guruPiket);
      }
      if (data.agendas) {
        setAgendas(data.agendas);
      }
      showToast("Seluruh database berhasil ditimpa dengan data awan Google Sheets / Excel baru!", "success");
    } else {
      // Merge mode
      // Merge Kelas
      setKelas(prev => {
        const merged = [...prev];
        data.kelas.forEach(newK => {
          if (!merged.some(k => k.id === newK.id)) {
            merged.push(newK);
          }
        });
        return merged;
      });

      // Merge Mapel
      setMapel(prev => {
        const merged = [...prev];
        data.mapel.forEach(newM => {
          if (!merged.some(m => m.id === newM.id)) {
            merged.push(newM);
          }
        });
        return merged;
      });

      // Merge Siswa
      setSiswa(prev => {
        const merged = [...prev];
        data.siswa.forEach(newS => {
          if (!merged.some(s => s.id === newS.id || s.nis === newS.nis)) {
            merged.push(newS);
          }
        });
        return merged;
      });

      // Merge Kategori
      setKategori(prev => {
        const merged = [...prev];
        data.kategori.forEach(newKat => {
          if (!merged.some(kat => kat.id === newKat.id)) {
            merged.push(newKat);
          }
        });
        return merged;
      });

      // Merge Penilaian
      setPenilaian(prev => {
        const merged = [...prev];
        data.penilaian.forEach(newP => {
          const existingIdx = merged.findIndex(p => p.tanggal === newP.tanggal && p.kategoriId === newP.kategoriId);
          if (existingIdx !== -1) {
            const updatedGrades = [...merged[existingIdx].grades];
            newP.grades.forEach(newG => {
              const gIdx = updatedGrades.findIndex(g => g.siswaId === newG.siswaId);
              if (gIdx !== -1) {
                updatedGrades[gIdx].nilai = newG.nilai;
              } else {
                updatedGrades.push(newG);
              }
            });
            merged[existingIdx] = { ...merged[existingIdx], grades: updatedGrades };
          } else {
            merged.push(newP);
          }
        });
        return merged;
      });

      // Merge Guru
      if (data.guru && data.guru.length > 0) {
        setGuruCodes(prev => {
          const merged = [...prev];
          data.guru!.forEach(newG => {
            const idxExist = merged.findIndex(g => g.code.toLowerCase() === newG.code.toLowerCase());
            if (idxExist !== -1) {
              merged[idxExist] = { ...merged[idxExist], ...newG };
            } else {
              merged.push(newG);
            }
          });
          return merged;
        });
      }

      // Merge Jadwal
      if (data.jadwal && data.jadwal.length > 0) {
        setJadwal(prev => {
          const merged = [...prev];
          data.jadwal!.forEach(newJ => {
            const idxExist = merged.findIndex(j => j.id === newJ.id);
            if (idxExist !== -1) {
              merged[idxExist] = newJ;
            } else {
              merged.push(newJ);
            }
          });
          return merged;
        });
      }

      // Merge Tugas
      if (data.tugas && data.tugas.length > 0) {
        setTugas(prev => {
          const merged = [...prev];
          data.tugas!.forEach(newT => {
            const idxExist = merged.findIndex(t => t.id === newT.id);
            if (idxExist !== -1) {
              merged[idxExist] = { ...merged[idxExist], ...newT };
            } else {
              merged.push(newT);
            }
          });
          return merged;
        });
      }

      // Merge Absen Siswa
      if (data.absenSiswa && data.absenSiswa.length > 0) {
        setAbsenSiswa(prev => {
          const merged = [...prev];
          data.absenSiswa!.forEach(newA => {
            const idxExist = merged.findIndex(a => a.id === newA.id);
            if (idxExist !== -1) {
              merged[idxExist] = newA;
            } else {
              merged.push(newA);
            }
          });
          return merged;
        });
      }

      // Merge Absen Guru
      if (data.absenGuru && data.absenGuru.length > 0) {
        setAbsenGuru(prev => {
          const merged = [...prev];
          data.absenGuru!.forEach(newA => {
            const idxExist = merged.findIndex(a => a.id === newA.id);
            if (idxExist !== -1) {
              merged[idxExist] = newA;
            } else {
              merged.push(newA);
            }
          });
          return merged;
        });
      }

      // Merge Announcements
      if (data.announcements && data.announcements.length > 0) {
        setAnnouncements(prev => {
          const merged = [...prev];
          data.announcements!.forEach(newA => {
            const idxExist = merged.findIndex(a => a.id === newA.id);
            if (idxExist !== -1) {
              merged[idxExist] = newA;
            } else {
              merged.push(newA);
            }
          });
          return merged;
        });
      }

      // Merge Ujian Praktek
      if (data.ujianPraktek && data.ujianPraktek.length > 0) {
        setUjianPraktek(prev => {
          const merged = [...prev];
          data.ujianPraktek!.forEach(newU => {
            const idxExist = merged.findIndex(u => u.id === newU.id);
            if (idxExist !== -1) {
              merged[idxExist] = newU;
            } else {
              merged.push(newU);
            }
          });
          return merged;
        });
      }

      // Merge Pengumpulan Tugas
      if (data.pengumpulanTugas && data.pengumpulanTugas.length > 0) {
        setPengumpulanTugas(prev => {
          const merged = [...prev];
          data.pengumpulanTugas!.forEach(newP => {
            const idxExist = merged.findIndex(p => p.id === newP.id);
            if (idxExist !== -1) {
              merged[idxExist] = newP;
            } else {
              merged.push(newP);
            }
          });
          return merged;
        });
      }

      // Merge Guru Piket
      if (data.guruPiket && data.guruPiket.length > 0) {
        setGuruPiket(prev => {
          const merged = [...prev];
          data.guruPiket!.forEach(newG => {
            const idxExist = merged.findIndex(g => g.id === newG.id);
            if (idxExist !== -1) {
              merged[idxExist] = newG;
            } else {
              merged.push(newG);
            }
          });
          return merged;
        });
      }

      // Merge Agendas
      if (data.agendas && data.agendas.length > 0) {
        setAgendas(prev => {
          const merged = [...prev];
          data.agendas!.forEach(newA => {
            const idxExist = merged.findIndex(a => a.id === newA.id);
            if (idxExist !== -1) {
              merged[idxExist] = newA;
            } else {
              merged.push(newA);
            }
          });
          return merged;
        });
      }

      showToast("Data baru berhasil digabungkan dengan database yang sudah ada!", "success");
    }
    setActiveTab("dashboard");
  };

  // Render navigation tab items dynamically helper
  const navigationItems = [
    { id: "dashboard", label: "Beranda", icon: LayoutDashboard, color: "text-emerald-500" },
    ...(userRole === "admin" ? [
      { id: "kelas", label: "Data Kelas", icon: GraduationCap, color: "text-indigo-550" },
      { id: "siswa", label: "Data Siswa", icon: Users, color: "text-emerald-550" },
      { id: "kategori", label: "Kategori & Tugas", icon: ClipboardList, color: "text-rose-500" },
      { id: "admin_panel", label: "Manajemen Utama", icon: Lock, color: "text-rose-500" }
    ] : []),
    { id: "rekap", label: "Rekap Hub Terpadu", icon: BarChart2, color: "text-emerald-600" },
    { id: "jadwal", label: "Jadwal Pelajaran", icon: Clock, color: "text-indigo-550" },
    { id: "penilaian", label: "Input Nilai Siswa", icon: ClipboardCheck, color: "text-teal-500" },
    { id: "broadcast", label: "WhatsApp Broadcast", icon: MessageSquare, color: "text-emerald-600" },
    { id: "tugas", label: "Lembar Tugas (PR)", icon: ClipboardList, color: "text-[#577354]" },
    { id: "praktek", label: "Ujian Praktek", icon: Award, color: "text-amber-500" },
    { id: "absen", label: "Absensi & Presensi", icon: Calendar, color: "text-emerald-600" },
    { id: "piket", label: "Guru Piket", icon: Shield, color: "text-amber-600" },
    { id: "pengumuman", label: "Papan Pengumuman", icon: Megaphone, color: "text-amber-500" },
    { id: "ekstra", label: "Acara & Kegiatan Ekstra", icon: Award, color: "text-emerald-500" },
    { id: "laporan", label: "Laporan & Rapor", icon: FileText, color: "text-blue-500" },
    { id: "excel", label: "Cloud Sync & Backup", icon: FileSpreadsheet, color: "text-emerald-600" }
  ];

  return (
    <div className="min-h-screen bg-cream-canvas text-slate-800 flex flex-col font-sans selection:bg-emerald-250 relative overflow-x-hidden">
      
      {/* Dynamic Style Injection */}
      <style>{injectedCSS}</style>

      {/* Dynamic Elevated Aesthetic Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 no-print select-none">
        {/* Soft floating fluid gradient blobs */}
        <div className="absolute top-[5%] left-[-10%] w-[35rem] h-[35rem] md:w-[50rem] md:h-[50rem] bg-[#8BA888]/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40rem] h-[40rem] md:w-[60rem] md:h-[60rem] bg-emerald-100/25 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-[45%] left-[20%] w-[25rem] h-[25rem] md:w-[35rem] md:h-[35rem] bg-[#D6E0D2]/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[40%] left-[-5%] w-[30rem] h-[30rem] bg-white/40 rounded-full blur-3xl animate-float-slow" />

        {/* Sacred Geometry Tiled Motif Backdrop Line-Art */}
        <div className="absolute inset-0 bg-islamic-pattern opacity-100" />
        
        {/* Subtle vignette layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F7F8F3]/20 to-[#F7F8F3]/60" />
      </div>

      {/* 1. TOP RESPONSIVE CORPORATE BAR BRANDING (visible everywhere, hidden on print out) */}
      <header className="bg-white/85 backdrop-blur-md border-b border-emerald-100/50 h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 no-print shadow-xs transition-all duration-300">
        <div className="flex items-center gap-2.5">
          {/* Burger menu on Mobile (Only for Guru mode since Wali has unified simple page) */}
          {userRole === "guru" && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-550 focus:outline-none lg:hidden cursor-pointer"
              title="Toggle navigasi"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          <div 
            onClick={() => {
              setUserRole(null);
              setCurrentGuruCode(null);
              setActiveTab("dashboard");
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
            title="Kembali ke Gerbang Utama"
          >
            <span className="bg-sage-green text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-sage-green/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-display font-black text-slate-800 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                SDIT <span className="text-emerald-600 font-extrabold text-xs sm:text-sm">Al-Hanif</span>
              </h1>
              <span className="text-[9px] text-[#718F6E] font-extrabold uppercase tracking-wider mt-0.5 block">
                {userRole === "guru" ? "Portal Guru" : userRole === "admin" ? "Portal Admin" : userRole === "wali" ? "Wali Murid" : "Portal Utama"}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Digital Clock & Calendar Widget (Visible on md and up, beautifully integrated) */}
        <RealtimeClockWidgetMini />

        {/* Global actions */}
        <div className="flex items-center gap-3">
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-[#577354] h-9 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border border-[#8BA888]/20 shadow-2xs no-print"
            title={isFullscreen ? "Keluar dari Layar Penuh" : "Masuk Mode Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 font-bold" /> : <Maximize2 className="w-3.5 h-3.5 font-bold" />}
            <span className="hidden sm:inline">{isFullscreen ? "Layar Normal" : "Layar Penuh"}</span>
          </button>
          
          {/* Connection Status Badge to Google Sheets */}
          {googleAccessToken ? (
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sans text-[11px] font-black border ${
                isGSheetsSyncingOnLaunch || cloudSyncStatus === "saving"
                  ? "bg-amber-50 border-amber-200 text-amber-700 animate-pulse" 
                  : gsLaunchSyncError || cloudSyncStatus === "error"
                    ? "bg-rose-50 border-rose-205 text-rose-700 animate-shake" 
                    : cloudSyncStatus === "saved"
                      ? "bg-teal-50 border-teal-200 text-teal-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
              title={
                isGSheetsSyncingOnLaunch || cloudSyncStatus === "saving"
                  ? "Sedang menyinkronkan data Google Spreadsheet..." 
                  : gsLaunchSyncError || cloudSyncStatus === "error"
                    ? `Gagal Sinkronisasi: ${gsLaunchSyncError || cloudSyncError}` 
                    : "Terkoneksi Sempurna dengan Google Spreadsheet"
              }
            >
              <div className={`w-2 h-2 rounded-full ${isGSheetsSyncingOnLaunch || cloudSyncStatus === "saving" ? 'bg-amber-400 animate-ping' : gsLaunchSyncError || cloudSyncStatus === "error" ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <span className="hidden sm:inline">
                {isGSheetsSyncingOnLaunch 
                  ? "Menyinkronkan..." 
                  : cloudSyncStatus === "saving"
                    ? "Menyimpan ke Awan..."
                    : cloudSyncStatus === "saved"
                      ? "Tersimpan Online"
                      : gsLaunchSyncError 
                        ? "GSheets Error" 
                        : "Cloud Sinkron: Aktif"}
              </span>
              <span className="sm:hidden font-extrabold">Spreadsheet: OK</span>
            </div>
          ) : null}

          {userRole !== null && (
            <button
              onClick={() => {
                showToast("Menyegarkan pangkalan data...", "success");
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
              className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-[#577354] h-9 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border border-[#8BA888]/20 shadow-2xs no-print mr-1"
              title="Perbaharui dan Sinkronkan Data"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {userRole !== null && (
            <button
              onClick={() => {
                setUserRole(null);
                setCurrentGuruCode(null);
                setActiveTab("dashboard");
              }}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 h-9 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer border border-[#E2E8F0] shadow-2xs mr-1"
              title="Kembali ke Panel Pilih Portal"
            >
              <Home className="w-3.5 h-3.5 text-[#718F6E]" />
              <span className="hidden md:inline">Gerbang Utama</span>
            </button>
          )}

          {/* Aesthetic Portal Theme Customizer Trigger */}
          {((userRole === "admin" && isAdminUnlocked) || 
            (userRole === "guru" && activeGuruProfile) || 
            (userRole === "wali")) && (
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50/80 to-amber-100/40 hover:from-amber-100/90 hover:to-amber-200/60 text-amber-800 border border-amber-300/40 h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer shadow-[0_1px_3px_rgba(217,119,6,0.06)] hover:shadow-[0_4px_12px_rgba(217,119,6,0.12)] no-print mr-1 transform hover:-translate-y-0.5 active:translate-y-0 duration-250 ease-out animate-fadeIn"
              title={userRole === "admin" ? "Kustomisasi Tema Sistem & Gerbang Utama" : "Personalisasi Tema Portal Saya"}
            >
              <Palette className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
              <span className="hidden sm:inline tracking-tight font-extrabold text-amber-900">
                {userRole === "admin" ? "Kustomisasi Tema (Admin)" : "Tema Portal Saya"}
              </span>
            </button>
          )}



          {userRole === "admin" ? (
            <>
              {/* Reset Database triggers */}
              {isAdminUnlocked && (
                <>
                  <button
                    onClick={handleResetToSeeds}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 h-10 px-4 rounded-xl text-xs font-semibold select-none transition-all cursor-pointer border border-[#E2E8F0] hover:border-slate-300"
                    title="Kosongkan database local dan reset kembali ke contoh"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#718F6E]" />
                    <span className="hidden sm:inline">Setel Ulang Data</span>
                  </button>

                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                </>
              )}

              {/* Admin profile view */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-white text-xs font-bold font-mono uppercase flex items-center justify-center border border-amber-600/20 shadow-xs">
                  {isAdminUnlocked ? "ADM" : "🔒"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-850 leading-none">
                    {isAdminUnlocked ? "Admin Utama" : "Portal Terkunci"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Super Admin</p>
                </div>

                {isAdminUnlocked && (
                  <button
                    onClick={() => {
                      setIsAdminUnlocked(false);
                      localStorage.setItem("PSD_ADMIN_UNLOCKED", "false");
                      showToast("Sesi Admin berhasil dikunci.", "neutral");
                    }}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-105 border border-red-200 text-red-600 h-10 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors"
                  >
                    Kunci Portal
                  </button>
                )}
              </div>
            </>
          ) : userRole === "guru" ? (
            <>
              {activeGuruProfile && (
                <>
                  {/* Verified Guru Profile card */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sage-light text-slate-850 text-xs font-bold font-mono uppercase flex items-center justify-center border border-sage-green/20 shadow-xs">
                      Guru
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-bold text-slate-850 leading-none max-w-28 truncate">{activeGuruProfile.namaGuru}</p>
                      <p className="text-[9px] text-emerald-600 font-mono uppercase mt-1">CODE: {activeGuruProfile.code}</p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : userRole === "wali" ? (
            <>
              <div className="w-px h-8 bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EAE8D2] text-[#2D3A3A] text-xs font-bold font-mono uppercase flex items-center justify-center border border-amber-200 shadow-xs">
                  Wali
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-850 leading-none">Wali Murid</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Peninjau Nilai</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </header>

      {/* 2. BODY FRAME: SIDE-DEPOT NAVIGATION & MAIN CANVAS */}
      <div className="flex-1 flex relative">
        
        {/* SIDEBAR ON DESKTOP (no-print) */}
        {((userRole === "guru" && activeGuruProfile) || (userRole === "admin" && isAdminUnlocked)) && (
          <aside className="w-68 bg-forest-dark text-white hidden lg:flex flex-col justify-between p-5 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto no-print shadow-xl">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-3.5">
                  Navigasi Menu
                </p>
                <nav className="space-y-1.5">
                  {navigationItems.map(item => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as TabMenu)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-colors duration-150 cursor-pointer ${
                          isActive 
                            ? "bg-sage-green/20 text-sage-green border border-sage-green/10" 
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <IconComp className={`w-4.5 h-4.5 ${isActive ? "text-sage-green" : "text-white/50"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
   
              {/* Quick Summary State Panel */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-[11px] space-y-2.5">
                <p className="font-bold text-white/40 tracking-widest text-[10px] uppercase">Database Stat:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <span className="text-white/50 font-medium">Total Kelas</span>
                    <p className="text-sm font-bold mt-0.5 text-white">{kelas.length}</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-[#E2E8F0]/10">
                    <span className="text-white/50 font-medium">Siswa Aktif</span>
                    <p className="text-sm font-bold mt-0.5 text-sage-green">{siswa.length}</p>
                  </div>
                </div>
              </div>
            </div>
   
            {/* Compact visual accent info */}
            <div className="text-[10px] text-white/30 border-t border-white/5 pt-3.5 flex items-center justify-between font-mono">
              <span>Aplikasi v2.0</span>
              <span className="text-sage-green font-bold uppercase">&bull; Online</span>
            </div>
          </aside>
        )}
 
        {/* MOBILE SIDEBAR MODAL OVERLAY (no-print) */}
        {((userRole === "guru" && activeGuruProfile) || (userRole === "admin" && isAdminUnlocked)) && isMobileMenuOpen && (
          <div 
            className="fixed inset-0 top-20 bg-[#161d1d]/60 backdrop-blur-xs z-30 lg:hidden no-print"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div 
              className="w-64 bg-forest-dark text-white h-full border-r border-[#1C2727] p-4 space-y-4 animate-slideIn flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Menu Penilaian
                  </span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 hover:bg-white/5 rounded text-white/60 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
  
                <nav className="space-y-1.5">
                  {navigationItems.map(item => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as TabMenu);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isActive 
                            ? "bg-sage-green/20 text-sage-green" 
                            : "text-white/70 hover:bg-white/5"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isActive ? "text-sage-green" : "text-white/40"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
 
              <div className="border-t border-white/15 pt-4">
                <button
                  onClick={() => {
                    handleResetToSeeds();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center bg-white/5 text-white/90 hover:bg-white/10 py-2.5 rounded-xl text-[11px] font-semibold block transition-colors cursor-pointer border border-white/10"
                >
                  Setel Ulang Data ke Contoh
                </button>
              </div>
            </div>
          </div>
        )}
 
         {/* MAIN VISUAL BOARD CANVAS */}
         <main className={`flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full z-10 ${userRole === "wali" ? "pt-8" : ""}`}>
           
           {/* Active component rendered depending on active navigation tab item / active role */}

             {userRole === null ? (
              <div className="max-w-5xl mx-auto my-6 space-y-12 animate-fadeIn py-4">
                
                {/* Elegant Top Header Header - SDIT Al Hanif Cilegon */}
                <div className="flex flex-col items-center text-center space-y-5 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Gerbang Utama Portal SiswaDigital
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-slate-900 tracking-tight leading-none">
                      SDIT AL HANIF <span className="text-emerald-600">CILEGON</span>
                    </h1>
                    <p className="text-xs md:text-sm font-extrabold tracking-widest text-slate-500 uppercase">
                      Portal Pengelolaan Akademik &amp; Seluruh Mata Pelajaran
                    </p>
                  </div>
                  
                  <p className="text-xs text-slate-550 max-w-xl mx-auto leading-relaxed">
                    Sistem informasi edukasi SiswaDigital, mewadahi kolaborasi harmonis antara dewan pendidik dan para orang tua/wali murid untuk mencetak generasi Qur'ani yang cerdas, santun, bernilai tinggi, dan unggul di seluruh mata pelajaran.
                  </p>

                  {/* Academic Badges Info Row */}
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5 select-none font-sans">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      TA 2026/2027
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Seluruh Mata Pelajaran (KBM)
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Proteksi Database
                    </span>
                  </div>
                </div>

                {/* Aesthetic Arabic Calligraphy Motto Screen */}
                <div className="max-w-2xl mx-auto p-5 bg-gradient-to-br from-emerald-50/10 to-teal-50/5 rounded-3xl border border-emerald-100/50 text-center space-y-2.5 shadow-2xs">
                  <p className="text-lg md:text-xl text-emerald-950 font-bold tracking-tight font-serif rtl leading-loose" dir="rtl">
                    يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنْكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ
                  </p>
                  <p className="text-[11px] text-slate-500 italic font-semibold leading-relaxed">
                    "Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat." (QS. Al-Mujadilah: 11)
                  </p>
                </div>

                {/* Real-time Digital Clock & Calendar Widget Row */}
                <RealtimeClockWidgetLarge />

                {/* Redesigned 2 Doors Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 max-w-4xl mx-auto">
                  
                  {/* CARD DOOR 1: PORTAL WALI MURID */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs hover:shadow-lg hover:border-[#8BA888]/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-[#F6F8F5] text-[#8BA888] rounded-2xl flex items-center justify-center border border-emerald-100/60 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                          <Users className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest font-mono">
                          Akses Bebas
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-[#718F6E] transition-colors leading-none tracking-tight">
                          Pintu 1: Portal Wali Murid
                        </h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed text-left">
                        Akses khusus bagi para orang tua untuk memantau rekam jejak hafalan, latihan harian, dan rapor seluruh mata pelajaran terintegrasi di SDIT Al Hanif Cilegon.
                      </p>

                      {/* Feature Bullet Points */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-left">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-[#8BA888] font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Evaluasi lembar rapor akhir seluruh mata pelajaran, catatan guru piket &amp; grafik progres nilai siswa.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-[#8BA888] font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Lihat jam belajar &amp; penyesuaian jam pelajaran serta istirahat.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-[#8BA888] font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Konseling materi pelajaran umum &amp; agama di rumah dibantu Guru AI Asisten interaktif.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-[#8BA888] font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Pendaftaran mandiri program bimbingan belajar/les intensif secara online.</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <button
                        onClick={() => {
                          setUserRole("wali");
                        }}
                        className="w-full py-4 px-4 bg-[#8BA888] hover:bg-[#718F6E] text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-990/5 active:scale-[0.98]"
                      >
                        <span>Masuk Pintu Wali Murid</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-wider">
                        Akses Instan Tanpa Kode Sandi
                      </p>
                    </div>
                  </div>

                  {/* CARD DOOR 2: PORTAL GURU & ADMINISTRATOR */}
                  <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs hover:shadow-lg hover:border-emerald-500/80 transition-all duration-300 group flex flex-col justify-between transform hover:-translate-y-1">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                            <GraduationCap className="w-5.5 h-5.5" />
                          </div>
                          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                            <Shield className="w-5 h-5" />
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-widest font-mono border border-emerald-100">
                          Terproteksi
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-left">
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-emerald-700 transition-colors leading-none tracking-tight">
                          Pintu 2: Portal Pendidik &amp; Admin
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                          Konsol Akademik &amp; Administrasi Kurikulum
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed text-left">
                        Gerbang operasional sistem bagi asatidzah, dewan guru seluruh mapel, wali kelas, serta pengawas kurikulum SDIT untuk mengelola administrasi &amp; basis data terpadu.
                      </p>

                      {/* Feature Bullet Points */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-left">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Input nilai harian, rekap ulangan, portofolio &amp; penilaian ujian seluruh mata pelajaran.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Sistem absensi (kehadiran) harian siswa &amp; asatidzah secara terkomputasi.</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Otoritas master data (Rombel, Pengumuman, Brosur Les, &amp; Kalender Akademik).</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">✓</span>
                          <span>Fitur Cadangan database Emas sekolah &amp; integrasi spreadsheet dua arah.</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <button
                        onClick={() => {
                          setUserRole("guru");
                          setActiveTab("dashboard");
                        }}
                        className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/10 active:scale-[0.98]"
                      >
                        <span>Masuk Pintu Guru &amp; Admin</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </button>
                      <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-wider">
                        Memerlukan Kode Pendidik &amp; Sandi Utama
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ) : (userRole === "admin" && !isAdminUnlocked) ? (
                <div className="max-w-md mx-auto my-12 bg-white/80 backdrop-blur-md rounded-3xl border border-white/65 p-8 shadow-sm text-center space-y-6 animate-fadeIn">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-amber-100">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-display font-black text-slate-800 tracking-tight">Portal Admin Terkunci</h2>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Sistem ini dilindungi kode akses. Silakan masukkan kode keamanan khusus untuk membuka dasbor administrasi sekolah Anda.
                    </p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (adminPasscodeInput === "B1smillah") {
                      setIsAdminUnlocked(true);
                      localStorage.setItem("PSD_ADMIN_UNLOCKED", "true");
                      showToast("Kunci portal admin terbuka!", "success");
                    } else {
                      showToast("Kode akses tidak valid!", "neutral");
                    }
                  }} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block text-center">Kode Akses Khusus/Utama</label>
                      <input
                        type="password"
                        required
                        placeholder="Masukkan Kode Akses..."
                        value={adminPasscodeInput}
                        onChange={(e) => setAdminPasscodeInput(e.target.value)}
                        className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center font-bold tracking-widest placeholder:tracking-normal text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#2D3A3A] hover:bg-[#425555] active:scale-[0.98] text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md"
                    >
                      Buka Kunci Portal
                    </button>
                  </form>
                </div>
            ) : userRole === "wali" ? (
              <WaliMuridView 
                kelas={kelas}
                mapel={mapel}
                siswa={siswa}
                kategori={kategori}
                penilaian={penilaian}
                absenSiswa={absenSiswa}
                jadwal={jadwal}
                guruCodes={guruCodes}
                announcements={announcements}
                tugas={tugas}
                setTugas={setTugas}
                pengumpulanTugas={pengumpulanTugas}
                setPengumpulanTugas={setPengumpulanTugas}
                ujianPraktek={ujianPraktek}
                showWelcomeBanners={showWelcomeBanners}
                activeSiswaProp={waliActiveSiswa}
                setActiveSiswaProp={setWaliActiveSiswa}
                parentActiveTabProp={parentActiveTab}
                setParentActiveTabProp={setParentActiveTab}
                onExitPortal={() => {
                  setUserRole(null);
                  setWaliActiveSiswa(null);
                  setActiveTab("dashboard");
                }}
              />
            ) : (userRole === "guru" && !activeGuruProfile) ? (
              /* Verification Gateway Card with Email/Password & Auto-Sync Support */
              <div className="max-w-md mx-auto my-12 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 shadow-lg text-center space-y-6 animate-fadeIn transition-all">
                <div className="mx-auto flex items-center justify-center gap-3">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-xs border border-emerald-100">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center shadow-xs border border-slate-150">
                    <Lock className="w-5.5 h-5.5" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-black text-slate-800 tracking-tight">Gerbang Akses Pendidik</h2>
                  <p className="text-xs text-slate-550 max-w-sm mx-auto leading-relaxed">
                    Aman, andal, dan tersinkronisasi realtime ke Google Cloud &amp; Google Drive Anda.
                  </p>
                </div>

                {/* Tab Switcher for Methods */}
                <div className="flex bg-slate-105 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("email");
                      setIsSignUp(false);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      authMethod === "email" 
                        ? "bg-white text-slate-800 shadow-2xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Masuk Akun (Email)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("code")}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      authMethod === "code" 
                        ? "bg-white text-slate-800 shadow-2xs" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Verifikasi Kode
                  </button>
                </div>

                {/* CONTENT FOR TAB: EMAIL/PASSWORD AUTH */}
                {authMethod === "email" && (
                  <form onSubmit={handleEmailPasswordAuth} className="space-y-4 text-left animate-fadeIn">
                    <div className="text-center mb-1">
                      <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-3 py-1 rounded-full">
                        {isSignUp ? "Registrasi Akun Baru" : "Masuk dengan Email & Sandi"}
                      </span>
                    </div>

                    {isSignUp && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Nama Lengkap</label>
                        <input
                          type="text"
                          required
                          placeholder="Masukkan Nama Lengkap..."
                          value={displayNameInput}
                          onChange={(e) => setDisplayNameInput(e.target.value)}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Alamat Email</label>
                      <input
                        type="email"
                        required
                        placeholder="contoh: ustadz@alhanif.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Kata Sandi</label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 6 karakter..."
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>

                    {/* Ask for Guru Code optional field so we map it immediately on registered accounts */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">KONEKSI KODE GURU (OPSIONAL)</label>
                        <span className="text-[9px] text-emerald-600 font-extrabold">e.g. USTADZ-01</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan kode unik di sini..."
                        value={verificationInput}
                        onChange={(e) => setVerificationInput(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 font-mono text-center uppercase"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-990/10 flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses Akun...</span>
                        </>
                      ) : (
                        <span>{isSignUp ? "Daftarkan Akun & Buka Portal" : "Masuk Pintu Akademik"}</span>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 hover:underline font-extrabold"
                      >
                        {isSignUp 
                          ? "Sudah memiliki akun? Masuk di sini" 
                          : "Belum punya akun? Registrasi Akun Baru"}
                      </button>
                    </div>
                  </form>
                )}

                {/* CONTENT FOR TAB: LEGACY VERIFICATION CODE */}
                {authMethod === "code" && (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const codeVal = verificationInput.trim();
                    if (codeVal === "B1smillah") {
                      setIsAdminUnlocked(true);
                      localStorage.setItem("PSD_ADMIN_UNLOCKED", "true");
                      setUserRole("admin");
                      setVerificationInput("");
                      showToast("Portal admin berhasil dibuka!", "success");
                      return;
                    }

                    const matched = guruCodes.find(g => g.code === codeVal && g.isActive);
                    if (matched) {
                      setCurrentGuruCode(matched.code);
                      localStorage.setItem("PSD_CURRENT_GURU_CODE", matched.code);
                      showToast(`Selamat datang, ${matched.namaGuru}!`, "success");
                    } else {
                      showToast("Kode akses tidak valid atau dinonaktifkan Admin.", "neutral");
                    }
                  }} className="space-y-4 animate-fadeIn">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block text-center">Kode Akses Unik Guru / Admin</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan Kode Guru (e.g. USTADZ-01)"
                        value={verificationInput}
                        onChange={(e) => setVerificationInput(e.target.value)}
                        className="w-full text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8BA888] text-sm font-mono font-bold tracking-widest text-slate-800 uppercase placeholder-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-[#2D3A3A] hover:bg-[#425555] text-white font-extrabold text-[11px] uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-slate-900/10"
                    >
                      Buka Akses Guru &amp; Admin
                    </button>
                  </form>
                )}

                {/* Back button to return to the root door selection page */}
                <div className="pt-2 border-t border-slate-100 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUserRole(null);
                      setWaliActiveSiswa(null);
                      setActiveTab("dashboard");
                    }}
                    className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-slate-750 transition-colors font-extrabold cursor-pointer hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Gerbang Utama</span>
                  </button>
                </div>

                {/* Helpful list box */}
                <div className="bg-emerald-50/40 border border-[#8BA888]/20 rounded-2xl p-4.5 text-left space-y-2">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">ℹ️ Petunjuk Akses Pendidik &amp; Staf:</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Dewan Pendidik SDIT Al Hanif Cilegon, silakan masuk menggunakan akun email/password atau Kode Guru Anda. Alamat email yang terdaftar sebagai Administrator Utama Kurikulum (<span className="font-semibold text-slate-700">documenmondok003@gmail.com</span>) memiliki akses penuh ke seluruh pengaturan kurikulum Al-Hanif.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <Dashboard 
                    kelas={kelas} 
                    mapel={mapel} 
                    siswa={siswa} 
                    kategori={kategori} 
                    penilaian={penilaian} 
                    onNavigate={(destination) => setActiveTab(destination as TabMenu)}
                    userRole={userRole}
                    ujianPraktek={ujianPraktek}
                    tugas={tugas}
                    pengumpulanTugas={pengumpulanTugas}
                    showWelcomeBanners={showWelcomeBanners}
                    activeGuruProfile={activeGuruProfile}
                    guruCodes={guruCodes}
                    agendas={agendas}
                    setAgendas={setAgendas}
                  />
                )}

                {activeTab === "kelas" && (
                  <KelasCRUD 
                    kelas={kelas} 
                    siswa={siswa}
                    onAdd={handleAddKelas} 
                    onUpdate={handleUpdateKelas} 
                    onDelete={handleDeleteKelas} 
                  />
                )}

                {activeTab === "mapel" && (
                  <MapelCRUD 
                    mapel={mapel} 
                    kategori={kategori}
                    onAdd={handleAddMapel} 
                    onUpdate={handleUpdateMapel} 
                    onDelete={handleDeleteMapel} 
                  />
                )}

                {activeTab === "siswa" && (
                  <SiswaCRUD 
                    siswa={allowedSiswa} 
                    kelas={allowedKelas} 
                    penilaian={allowedPenilaian} 
                    onAdd={handleAddSiswa} 
                    onUpdate={handleUpdateSiswa} 
                    onDelete={handleDeleteSiswa} 
                  />
                )}

                {activeTab === "kategori" && (
                  userRole === "admin" ? (
                    <KategoriCRUD 
                      kategori={allowedKategori} 
                      kelas={allowedKelas} 
                      mapel={mapel} 
                      penilaian={allowedPenilaian} 
                      onAdd={handleAddKategori} 
                      onUpdate={handleUpdateKategori} 
                      onDelete={handleDeleteKategori} 
                    />
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-rose-100 text-center font-sans max-w-xl mx-auto space-y-4 shadow-sm my-10 animate-fadeIn">
                      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-lg">Akses Terbatas (Hanya Admin)</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Seksi pembuatan dan pengelolaan Kategori Tugas & Penilaian dialihkan sepenuhnya kepada Administrator. Pendidik/Guru tidak diizinkan mengubah kategori dari portal ini.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {activeTab === "penilaian" && (
                  <PenilaianForm 
                    penilaian={allowedPenilaian} 
                    kategori={allowedKategori} 
                    kelas={allowedKelas} 
                    mapel={mapel} 
                    siswa={allowedSiswa} 
                    onAdd={handleAddPenilaian} 
                    onUpdate={handleUpdatePenilaian} 
                    onDelete={handleDeletePenilaian} 
                    onAddKategori={handleAddKategori}
                  />
                )}

                {activeTab === "praktek" && (
                  <UjianPraktekView 
                    ujianPraktek={ujianPraktek} // We must pass the entire array so edits can be saved back, but UjianPraktekView filters by selectedKelasId which is bound to allowedKelas.
                    setUjianPraktek={setUjianPraktek}
                    kelas={allowedKelas}
                    mapel={mapel}
                    siswa={allowedSiswa}
                    showNotification={(msg, type) => showToast(msg, type === "error" ? "neutral" : "success")}
                    activeTeacherCode={userRole === "admin" ? "MASTER-ADMIN" : activeGuruProfile?.code || "GURU"}
                    guruCodes={guruCodes}
                  />
                )}

                {activeTab === "absen" && (
                  <AttendancePortal 
                    kelas={allowedKelas}
                    siswa={allowedSiswa}
                    guruCodes={guruCodes}
                    currentGuruCode={currentGuruCode}
                    activeTeacherName={activeGuruProfile?.namaGuru}
                    absenSiswa={absenSiswa}
                    setAbsenSiswa={setAbsenSiswa}
                    absenGuru={absenGuru}
                    setAbsenGuru={setAbsenGuru}
                    showNotification={(txt) => showToast(txt, "success")}
                    userRole={userRole}
                    jadwal={jadwal}
                  />
                )}

                {activeTab === "jadwal" && (
                  <SchedulePortal 
                    kelas={allowedKelas}
                    mapel={mapel}
                    guruCodes={guruCodes}
                    jadwal={jadwal}
                    setJadwal={setJadwal}
                    showNotification={(txt) => showToast(txt, "success")}
                    userRole={userRole}
                    currentGuruCode={currentGuruCode}
                  />
                )}

                {activeTab === "piket" && (
                  <GuruPiketView 
                    guruCodes={guruCodes}
                    guruPiket={guruPiket}
                    setGuruPiket={setGuruPiket}
                    userRole={userRole || "guru"}
                    showNotification={(txt, ty) => showToast(txt, ty === "neutral" ? "success" : "success")}
                  />
                )}

                {activeTab === "laporan" && (
                  <LaporanView 
                    penilaian={allowedPenilaian} 
                    kategori={allowedKategori} 
                    kelas={allowedKelas} 
                    mapel={mapel} 
                    siswa={allowedSiswa} 
                    announcements={allowedAnnouncements}
                    activeTeacherName={userRole === "admin" ? "KOMUNITAS MGMP SDIT AL HANIF" : activeGuruProfile?.namaGuru}
                    activeTeacherCode={userRole === "admin" ? "MASTER-ADMIN" : activeGuruProfile?.code}
                    absenSiswa={absenSiswa}
                  />
                )}

                {activeTab === "excel" && (
                  <ExcelIntegration 
                    kelas={allowedKelas}
                    mapel={mapel}
                    siswa={allowedSiswa}
                    kategori={allowedKategori}
                    penilaian={allowedPenilaian}
                    guruCodes={guruCodes}
                    jadwal={jadwal}
                    tugas={tugas}
                    absenSiswa={absenSiswa}
                    absenGuru={absenGuru}
                    announcements={announcements}
                    ujianPraktek={ujianPraktek}
                    pengumpulanTugas={pengumpulanTugas}
                    guruPiket={guruPiket}
                    agendas={agendas}
                    userRole={userRole || "guru"}
                    isAutoSyncEnabled={isAutoSyncEnabled}
                    setIsAutoSyncEnabled={setIsAutoSyncEnabled}
                    onImportAllData={handleImportAllData}
                  />
                )}

                {activeTab === "rekap" && (
                  <RekapTerpadu
                    kelas={kelas}
                    siswa={siswa}
                    mapel={mapel}
                    kategori={kategori}
                    penilaian={penilaian}
                    absenSiswa={absenSiswa}
                    tugas={tugas}
                    pengumpulanTugas={pengumpulanTugas}
                    ujianPraktek={ujianPraktek}
                    guruCodes={guruCodes}
                    jadwal={jadwal}
                    activeGuruProfile={activeGuruProfile}
                    userRole={userRole || "guru"}
                    showNotification={(txt, ty) => showToast(txt, ty || "success")}
                  />
                )}

                {activeTab === "broadcast" && (
                  <BroadcastConsole
                    kelas={allowedKelas}
                    siswa={allowedSiswa}
                    absenSiswa={absenSiswa}
                    penilaian={penilaian}
                    kategori={kategori}
                    userRole={userRole || "guru"}
                    showNotification={(txt, ty) => showToast(txt, ty || "success")}
                    activeTeacherName={activeGuruProfile?.namaGuru || "Admin Al Hanif"}
                    activeTeacherCode={activeGuruProfile?.code || "ADMIN_MASTER"}
                  />
                )}

                {activeTab === "pengumuman" && (
                  <AnnouncementManager
                    announcements={announcements} // Pass the primary array for editing, but they can only target allowedKelas in creation dropdowns!
                    setAnnouncements={setAnnouncements}
                    kelas={allowedKelas}
                    authorName={activeGuruProfile?.namaGuru || "Pendidik Al Hanif"}
                    authorCode={activeGuruProfile?.code || "GURU"}
                    showNotification={(txt, ty) => showToast(txt, ty || "success")}
                  />
                )}

                {activeTab === "tugas" && (
                  (userRole === "admin" || userRole === "guru") ? (
                    <HomeworkPortal
                      kelas={allowedKelas}
                      siswa={allowedSiswa}
                      guruCodes={guruCodes}
                      currentGuruCode={currentGuruCode}
                      activeTeacherName={activeGuruProfile?.namaGuru}
                      userRole={userRole || "guru"}
                      tugas={tugas}
                      setTugas={setTugas}
                      pengumpulanTugas={pengumpulanTugas}
                      setPengumpulanTugas={setPengumpulanTugas}
                      showNotification={(txt) => showToast(txt, "success")}
                    />
                  ) : (
                    <div className="bg-white p-8 rounded-3xl border border-rose-100 text-center font-sans max-w-xl mx-auto space-y-4 shadow-sm my-10 animate-fadeIn">
                      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-800 text-lg">Akses Terbatas (Hanya Admin)</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Seksi pembuatan dan pengelolaan Lembar Tugas (PR) dialihkan sepenuhnya kepada Administrator. Pendidik/Guru tidak diizinkan mengubah tugas dari portal ini.
                        </p>
                      </div>
                    </div>
                  )
                )}

                {activeTab === "ekstra" && (
                  <KegiatanEkstraView
                    kegiatan={kegiatan}
                    setKegiatan={setKegiatan}
                    userRole={userRole}
                    activeSiswaNama={waliActiveSiswa?.namaSiswa}
                    showNotification={(txt, ty) => showToast(txt, ty || "success")}
                  />
                )}

                {activeTab === "admin_panel" && userRole === "admin" && (
                  <AdminPortal
                    kelas={kelas}
                    mapel={mapel}
                    siswa={siswa}
                    kategori={kategori}
                    penilaian={penilaian}
                    ujianPraktek={ujianPraktek}
                    setUjianPraktek={setUjianPraktek}
                    announcements={announcements}
                    setAnnouncements={setAnnouncements}
                    guruCodes={guruCodes}
                    setGuruCodes={setGuruCodes}
                    jadwal={jadwal}
                    setJadwal={setJadwal}
                    absenGuru={absenGuru}
                    setAbsenGuru={setAbsenGuru}
                    onAddGuruCode={handleAddGuruCode}
                    onToggleGuruCodeStatus={handleToggleGuruCodeStatus}
                    onDeleteGuruCode={handleDeleteGuruCode}
                    onClearAllMasterData={handleClearAllMasterData}
                    showNotification={(txt, ty) => showToast(txt, ty || "success")}
                    setSiswa={setSiswa}
                    setKategori={setKategori}
                    setPenilaian={setPenilaian}
                    setKelas={setKelas}
                    setMapel={setMapel}
                    onImportAllData={handleImportAllData}
                    onDeleteKelas={handleDeleteKelas}
                    onDeleteMapel={handleDeleteMapel}
                    onDeleteSiswa={handleDeleteSiswa}
                    onDeleteKategori={handleDeleteKategori}
                    onDeletePenilaian={handleDeletePenilaian}
                    onUpdateKelas={handleUpdateKelas}
                    onUpdateMapel={handleUpdateMapel}
                    onUpdateSiswa={handleUpdateSiswa}
                    onUpdateKategori={handleUpdateKategori}
                    onUpdatePenilaian={handleUpdatePenilaian}
                  />
                )}
              </>
            )}

         </main>

      </div>

      {/* AI Copilot Assistant Widget */}
      {((userRole === "guru" && activeGuruProfile) || (userRole === "admin" && isAdminUnlocked)) && (
        <AICopilot 
          kelas={kelas}
          mapel={mapel}
          siswa={siswa}
          kategori={kategori}
          penilaian={penilaian}
          currentRole={userRole}
          teacherName={userRole === "admin" ? "KOMUNITAS MGMP SDIT AL HANIF" : userRole === "wali" ? "Orang Tua / Wali Murid" : activeGuruProfile?.namaGuru}
          teacherCode={userRole === "admin" ? "MASTER-ADMIN" : userRole === "wali" ? "WALI" : activeGuruProfile?.code}
          onTabNavigate={(tab) => {
            const lowerTab = tab.toLowerCase().trim();
            if (lowerTab === "wali" || lowerTab === "parent" || lowerTab === "wali-murid" || lowerTab === "wali_murid") {
              setUserRole("wali");
              showToast("Beralih ke Portal Wali Murid!", "success");
              return;
            }
            if (lowerTab === "admin" || lowerTab === "administrator" || lowerTab === "superadmin") {
              setIsAdminUnlocked(true);
              setUserRole("admin");
              showToast("Beralih ke Portal Administrator (KOMUNITAS MGMP SDIT AL HANIF)!", "success");
              return;
            }
            if (lowerTab === "guru" || lowerTab === "teacher") {
              setUserRole("guru");
              showToast("Beralih ke Portal Pendidik Guru!", "success");
              return;
            }

            if (userRole !== "guru") {
              setUserRole("guru");
            }
            setActiveTab(tab as TabMenu);
          }}
          showNotification={(text, type) => showToast(text, type || "success")}
          onAddKelas={handleAddKelas}
          onUpdateKelas={handleUpdateKelas}
          onDeleteKelas={handleDeleteKelas}
          onAddMapel={handleAddMapel}
          onUpdateMapel={handleUpdateMapel}
          onDeleteMapel={handleDeleteMapel}
          onAddSiswa={handleAddSiswa}
          onUpdateSiswa={handleUpdateSiswa}
          onDeleteSiswa={handleDeleteSiswa}
          onAddKategori={userRole === "admin" ? handleAddKategori : undefined}
          onUpdateKategori={userRole === "admin" ? handleUpdateKategori : undefined}
          onDeleteKategori={userRole === "admin" ? handleDeleteKategori : undefined}
          onAddPenilaian={handleAddPenilaian}
          onUpdatePenilaian={handleUpdatePenilaian}
          onDeletePenilaian={handleDeletePenilaian}
          onAddTugas={userRole === "admin" ? handleAddTugasAI : undefined}
          setSiswa={setSiswa}
          setKelas={setKelas}
          setMapel={setMapel}
          setKategori={setKategori}
          setPenilaian={setPenilaian}
          setJadwal={setJadwal}
          setGuruCodes={setGuruCodes}
          setAnnouncements={setAnnouncements}
        />
      )}

      {/* 3. FLOATING COMPACT SYSTEM TOAST */}
      {/* 4. STUDIO PERSONALISASI TEMA & WARNA PORTAL MODAL */}
      {isThemeModalOpen && ((userRole === "admin" && isAdminUnlocked) || (userRole === "guru" && activeGuruProfile) || userRole === "wali") && (
        <div className="fixed inset-0 bg-[#161d1d]/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#FAF9F5] rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                  <Palette className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-none">Studio Desain & Personalisasi Tema Portal</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Ganti warna, latar belakang lucu/elegan, font, dan download tema dari internet</p>
                </div>
              </div>
              <button
                onClick={() => setIsThemeModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1 text-left text-xs text-slate-705">
              
              {/* Admin Special: Target Theme Switcher */}
              {userRole === "admin" && (
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/50 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-800 tracking-wider">🔐 Kontrol Tema Gerbang Utama & Portal (Hak Akses Admin Utama)</span>
                  </div>
                  <p className="text-[11px] text-slate-650 font-semibold leading-relaxed">
                    Sebagai Admin Utama, Anda dapat menyesuaikan tampilan **Gerbang Utama** (pintu login luar) maupun **Portal Dashboard Admin Anda sendiri**. Guru dan Wali Murid hanya memiliki hak mengatur tema portal personal mereka sendiri secara mandiri.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAdminTargetThemeKey("default")}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminTargetThemeKey === "default" 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      Sesuaikan Tema Gerbang Utama & Portal Kode Akses
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTargetThemeKey("admin")}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminTargetThemeKey === "admin" 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      Sesuaikan Tema Portal Dashboard Admin
                    </button>
                  </div>
                </div>
              )}

              {/* Presets Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 1. Pilih Tema Preset (Lucu, Unik & Elegan)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {THEME_PRESETS.map((p) => {
                    const isSelected = activeTheme.name === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          setActiveTheme({
                            name: p.name,
                            primaryColor: p.primaryColor,
                            primaryHover: p.primaryHover,
                            bgPage: p.bgPage,
                            bgSidebar: p.bgSidebar,
                            bgCard: p.bgCard,
                            textMain: p.textMain,
                            textSidebar: p.textSidebar,
                            patternType: p.patternType as any,
                            patternOpacity: p.patternOpacity,
                            customBgUrl: "",
                            customBgSize: "cover",
                            fontFamily: p.fontFamily as any
                          });
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex gap-3 relative ${
                          isSelected 
                            ? "bg-amber-50/50 border-amber-400 shadow-sm ring-2 ring-amber-400/20" 
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="text-3xl select-none shrink-0 self-center">{p.icon}</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[8px] font-black uppercase rounded-md">Aktif</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">{p.description}</p>
                          
                          {/* Color preview row */}
                          <div className="flex gap-1 pt-1">
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.primaryColor }} title="Aksen" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.bgPage }} title="Latar Halaman" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.bgSidebar }} title="Sidebar" />
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: p.textMain }} title="Teks" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Color Combos - Hundreds of Colors */}
              <div className="space-y-4 border-t border-slate-100 pt-6 animate-fadeIn">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                    <Paintbrush className="w-4 h-4 text-amber-500" /> 2. Ratusan Kombinasi Warna Kustom (Kreativitas Bebas)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">Gunakan color picker di bawah untuk memadukan warna apa pun guna menciptakan aura portal impian Anda!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Primary Accent Picker */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Aksen Utama Brand</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.primaryColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveTheme(prev => ({ 
                            ...prev, 
                            name: "Custom Kombinasi",
                            primaryColor: val,
                            primaryHover: adjustColorBrightness(val, -15)
                          }));
                        }}
                        className="w-9 h-9 border border-slate-3 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.primaryColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("#") && val.length <= 7) {
                            setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", primaryColor: val }));
                          }
                        }}
                        className="w-full text-[11px] font-mono p-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </div>
                    {/* Quick Palettes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["#8BA888", "#F472B6", "#06B6D4", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setActiveTheme(prev => ({ 
                            ...prev, 
                            name: "Custom Kombinasi", 
                            primaryColor: c,
                            primaryHover: adjustColorBrightness(c, -15) 
                          }))}
                          className="w-4.5 h-4.5 rounded-full border border-black/10 cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Page BG Picker */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Latar Belakang Portal</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.bgPage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgPage: val }));
                        }}
                        className="w-9 h-9 border border-slate-3 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.bgPage}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("#") && val.length <= 7) {
                            setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgPage: val }));
                          }
                        }}
                        className="w-full text-[11px] font-mono p-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </div>
                    {/* Quick Palettes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["#F7F8F3", "#FFF5F5", "#F0FDFA", "#FEFCE8", "#FAF5FF", "#FFF1F2", "#111827"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgPage: c }))}
                          className="w-4.5 h-4.5 rounded-full border border-black/10 cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sidebar BG Picker */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150 space-y-2.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase block">Warna Menu Sidebar</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.bgSidebar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgSidebar: val }));
                        }}
                        className="w-9 h-9 border border-slate-3 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.bgSidebar}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.startsWith("#") && val.length <= 7) {
                            setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgSidebar: val }));
                          }
                        }}
                        className="w-full text-[11px] font-mono p-1 bg-white border border-slate-300 rounded font-bold"
                      />
                    </div>
                    {/* Quick Palettes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["#2D3A3A", "#4D1D2D", "#0F3A44", "#3C2809", "#2E1C4D", "#4C0519", "#0F172A"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", bgSidebar: c }))}
                          className="w-4.5 h-4.5 rounded-full border border-black/10 cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/20 p-4 rounded-2xl border border-amber-200/40">
                  {/* Text Color Control */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs block">Warna Teks Utama Portal</span>
                      <span className="text-[10px] text-slate-400 font-medium">Ubah kontras teks demi kenyamanan retina</span>
                    </div>
                    <input
                      type="color"
                      value={activeTheme.textMain}
                      onChange={(e) => {
                        setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", textMain: e.target.value }));
                      }}
                      className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer"
                    />
                  </div>

                  {/* Sidebar Text Control */}
                  <div className="flex items-center justify-between gap-4 border-l md:border-l border-slate-200/40 pl-0 md:pl-4">
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs block">Warna Teks Menu Sidebar</span>
                      <span className="text-[10px] text-slate-400 font-medium">Warna tulisan menu pada bilah samping</span>
                    </div>
                    <input
                      type="color"
                      value={activeTheme.textSidebar}
                      onChange={(e) => {
                        setActiveTheme(prev => ({ ...prev, name: "Custom Kombinasi", textSidebar: e.target.value }));
                      }}
                      className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Download Theme & Background from Internet */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-500" /> 3. Pasang / Unduh Wallpaper Latar dari Internet
                  </h4>
                  <p className="text-[11px] text-slate-500 font-semibold mt-1">
                    Anda bisa menempelkan langsung URL gambar apa pun dari mesin pencari atau web penyedia gambar (seperti Unsplash/Pinterest/Imgur) untuk dijadikan sebagai wallpaper latar belakang portal rombel Anda secara ajaib!
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tempelkan URL gambar/wallpaper dari internet di sini... (https://images.unsplash.com/...)"
                      value={activeTheme.customBgUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveTheme(prev => ({ 
                          ...prev, 
                          name: "Wallpaper Internet",
                          customBgUrl: val
                        }));
                      }}
                      className="w-full px-3.5 py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 text-[10.5px] font-mono"
                    />
                    {activeTheme.customBgUrl && (
                      <button
                        onClick={() => {
                          setActiveTheme(prev => ({ ...prev, customBgUrl: "" }));
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 font-bold font-sans cursor-pointer transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  {/* Preloaded downloadable community templates */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Template Unduhan Populer yang Cocok:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "☁️ Awan Pastel Fantasi", url: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1200&q=80" },
                        { name: "📓 Kertas Grid Sekolah", url: "https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=1200&q=80" },
                        { name: "🎨 Seni Cat Air Estetis", url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80" },
                        { name: "🏫 Papan Tulis Klasik", url: "https://images.unsplash.com/photo-1571844307560-f551fa31d7a7?auto=format&fit=crop&w=1200&q=80" },
                        { name: "🌿 Hutan Daun Tropis", url: "https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=1200&q=80" }
                      ].map((tmpl) => (
                        <button
                          key={tmpl.name}
                          onClick={() => {
                            setActiveTheme(prev => ({
                              ...prev,
                              name: `Aesthetic ${tmpl.name.slice(3)}`,
                              customBgUrl: tmpl.url,
                              patternType: "none",
                              bgPage: tmpl.name.includes("Papan Tulis") ? "#1E293B" : "#F7F8F3",
                              textMain: tmpl.name.includes("Papan Tulis") ? "#E2E8F0" : "#2D3A3A"
                            }));
                            showToast(`Berhasil menerapkan template ${tmpl.name}!`, "success");
                          }}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-650 cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Download className="w-3 h-3 text-slate-400" />
                          <span>Unduh {tmpl.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTheme.customBgUrl && (
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-[#3F3220] text-[10.5px] block">Latar Gambar Terpasang</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold truncate block max-w-lg font-mono">{activeTheme.customBgUrl}</span>
                      </div>
                      <select
                        value={activeTheme.customBgSize}
                        onChange={(e) => setActiveTheme(prev => ({ ...prev, customBgSize: e.target.value as any }))}
                        className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg font-bold text-[10px]"
                      >
                        <option value="cover">Penuh Layar (Cover)</option>
                        <option value="contain">Muat Utuh (Contain)</option>
                        <option value="repeat">Ulang Ubin (Repeat)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Core Textures & Patterns */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-500" /> 4. Pola & Tingkat Transparansi Latar Belakang (SVG)
                </h4>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {[
                    { id: "geo", name: "Geometric Islamic", icon: "🕌" },
                    { id: "dots", name: "Cute Polka Dots", icon: "⚪" },
                    { id: "hearts", name: "Sweet Hearts", icon: "♥" },
                    { id: "cats", name: "Cozy Cat Paws", icon: "🐾" },
                    { id: "stars", name: "Starry Night Sky", icon: "⭐" },
                    { id: "grid", name: "Classroom Notebook", icon: "📓" },
                    { id: "none", name: "Polos (Sederhana)", icon: "🚫" }
                  ].map((pat) => {
                    const isSelected = activeTheme.patternType === pat.id;
                    return (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => setActiveTheme(prev => ({ ...prev, patternType: pat.id as any }))}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
                          isSelected 
                            ? "bg-amber-50/70 border-amber-400 font-bold" 
                            : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <span className="text-sm shrink-0">{pat.icon}</span>
                        <span className="text-[10px] truncate">{pat.name}</span>
                      </button>
                    );
                  })}
                </div>

                {activeTheme.patternType !== "none" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                      <span>Kerapatan Pola Hiasan:</span>
                      <span className="font-mono text-slate-900">{activeTheme.patternOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={activeTheme.patternOpacity}
                      onChange={(e) => setActiveTheme(prev => ({ ...prev, patternOpacity: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>
                )}
              </div>

              {/* Fonts customizer */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 5. Karakter Jenis Huruf Portal (Tipografi)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {[
                    { id: "Outfit", name: "Outfit (Modern)", preview: "Selamat Belajar" },
                    { id: "Inter", name: "Inter (Standar)", preview: "Selamat Belajar" },
                    { id: "JetBrains Mono", name: "JetBrains (Tech)", preview: "selamat_belajar" },
                    { id: "Quicksand", name: "Quicksand (Imut)", preview: "Selamat Belajar!" },
                    { id: "Playfair", name: "Playfair (Klasik)", preview: "Selamat Belajar" },
                    { id: "Fredoka", name: "Fredoka (Cute Bubble)", preview: "Halo Ayah Bunda!" },
                    { id: "Comfortaa", name: "Comfortaa (Rounded Minimalist)", preview: "Edisi Al Hanif" },
                    { id: "Pacifico", name: "Pacifico (Retro Script)", preview: "Al-Hanif Boarding" },
                    { id: "Caveat", name: "Caveat (Handwritten)", preview: "Bismillah Berkah" },
                    { id: "Cinzel", name: "Cinzel (Kemegahan Romawi)", preview: "KHAZANAH AL HANIF" },
                    { id: "Great Vibes", name: "Great Vibes (Calligraphy)", preview: "Syukron Katsiran" }
                  ].map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setActiveTheme(prev => ({ ...prev, fontFamily: font.id as any }))}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        activeTheme.fontFamily === font.id 
                          ? "bg-amber-50/70 border-amber-400 font-bold text-slate-900" 
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 block">{font.name}</span>
                      <span className="text-xs font-semibold mt-0.5 block">{font.preview}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F5] rounded-b-3xl">
              <button
                onClick={() => {
                  if (confirm("Apakah anda yakin ingin mereset desain tema ke default aslinya?")) {
                    setActiveTheme({
                      name: "Default Moss Elegant",
                      primaryColor: "#8BA888",
                      primaryHover: "#718F6E",
                      bgPage: "#F7F8F3",
                      bgSidebar: "#2D3A3A",
                      bgCard: "#FFFFFF",
                      textMain: "#2D3A3A",
                      textSidebar: "#FFFFFF",
                      patternType: "geo",
                      patternOpacity: 25,
                      customBgUrl: "",
                      customBgSize: "cover",
                      fontFamily: "Outfit"
                    });
                    showToast("Tema berhasil dikembalikan ke default Al Hanif!", "success");
                  }
                }}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-colors w-full sm:w-auto text-center justify-center"
              >
                <Undo2 className="w-4 h-4" /> Reset ke Default
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsThemeModalOpen(false)}
                  className="w-1/2 sm:w-auto px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-xs cursor-pointer text-center justify-center"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsThemeModalOpen(false);
                    showToast("Kombinasi tema portal berhasil diterapkan dan disimpan!", "success");
                  }}
                  className="w-1/2 sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer shadow-sm text-center justify-center transition-all"
                >
                  Terapkan Tema Permanen
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-fadeIn no-print">
          <div className={`shadow-lg px-4.5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            toast.type === "success" 
              ? "bg-slate-900 border-emerald-500/30 text-emerald-400" 
              : "bg-slate-900 border-slate-700 text-slate-200"
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
