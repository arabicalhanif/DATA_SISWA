import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, GuruCode, Jadwal, HariBelajar, Tugas, AbsenSiswa, AbsenGuru, Announcement, UjianPraktek, PengumpulanTugas, GuruPiket, TeacherAgenda } from "../types";

// Initialize Firebase App, Auth, and Firestore
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export let isFirestoreQuotaExceeded = false;
export function setFirestoreQuotaExceeded(val: boolean) {
  isFirestoreQuotaExceeded = val;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errMsg.toLowerCase().includes("quota") ||
    errMsg.toLowerCase().includes("resource-exhausted") ||
    errMsg.toLowerCase().includes("limit exceeded") ||
    errMsg.toLowerCase().includes("exhausted")
  ) {
    isFirestoreQuotaExceeded = true;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetches the Spreadsheet ID for the signed-in user from Firestore
 */
export async function fetchUserSpreadsheetId(userId: string): Promise<string | null> {
  const path = `userConfigs/${userId}`;
  try {
    const docRef = doc(db, "userConfigs", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.spreadsheetId || null;
    }
  } catch (err) {
    console.error("Gagal mengambil konfigurasi Spreadsheet ID dari Cloud:", err);
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves the User's Spreadsheet ID to Firestore for cross-device syncing
 */
export async function syncUserSpreadsheetId(userId: string, email: string, sheetId: string) {
  const path = `userConfigs/${userId}`;
  try {
    const docRef = doc(db, "userConfigs", userId);
    await setDoc(docRef, {
      userId,
      userEmail: email,
      spreadsheetId: sheetId,
      isAutoSyncEnabled: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Konfigurasi Spreadsheet ID berhasil disinkronkan ke Cloud!");
  } catch (err) {
    console.error("Gagal menyinkronkan Spreadsheet ID ke Cloud:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Saves all school academic state into Cloud Firestore under academicData collection for the logged-in user
 */
export async function syncAcademicDataToFirestore(userId: string, payload: any) {
  const path = `academicData/${userId}`;
  try {
    const docRef = doc(db, "academicData", userId);
    await setDoc(docRef, {
      userId,
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
      payload
    }, { merge: true });
    console.log("Database Sekolah berhasil dicadangkan ke Google Cloud Firestore!");
  } catch (err) {
    console.error("Gagal menyinkronkan Database Sekolah ke Firestore:", err);
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Loads school academic state from Cloud Firestore if available
 */
export async function fetchAcademicDataFromFirestore(userId: string): Promise<any | null> {
  const path = `academicData/${userId}`;
  try {
    const docRef = doc(db, "academicData", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.payload || null;
    }
  } catch (err) {
    console.error("Gagal mengambil Database Sekolah dari Firestore:", err);
    handleFirestoreError(err, OperationType.GET, path);
  }
  return null;
}

const provider = new GoogleAuthProvider();
// Request Sheets scope for full read-write access to spreadsheets
provider.addScope("https://www.googleapis.com/auth/spreadsheets");

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Auto-restore cached token from localStorage on app startup
  const savedToken = localStorage.getItem("PSD_GOOGLE_ACCESS_TOKEN");
  if (savedToken) {
    cachedAccessToken = savedToken;
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const activeToken = cachedAccessToken || localStorage.getItem("PSD_GOOGLE_ACCESS_TOKEN");
      if (activeToken) {
        cachedAccessToken = activeToken;
        localStorage.setItem("PSD_GOOGLE_ACCESS_TOKEN", activeToken);
        if (onAuthSuccess) onAuthSuccess(user, activeToken);
      } else {
        // Logged in with email & password, or token was deleted but user session is still fine
        if (onAuthSuccess) onAuthSuccess(user, "");
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("PSD_GOOGLE_ACCESS_TOKEN");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Firebase Email & Password
export const emailAndPasswordSignIn = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error("Email/Password Sign-In Error:", error);
    throw error;
  }
};

// Sign up/Register with Firebase Email & Password
export const emailAndPasswordSignUp = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName.trim()) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error: any) {
    console.error("Email/Password Sign-Up Error:", error);
    throw error;
  }
};

// Complete Sign-In popup with Google Sheets scopes
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Gagal memperoleh token akses dari Google Authentication.");
    }
    cachedAccessToken = credential.accessToken;
    localStorage.setItem("PSD_GOOGLE_ACCESS_TOKEN", cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Authentication Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem("PSD_GOOGLE_ACCESS_TOKEN");
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem("PSD_GOOGLE_ACCESS_TOKEN");
};

// target Google Spreadsheet ID
export let SPREADSHEET_ID = localStorage.getItem("PSD_SPREADSHEET_ID") || "1fKIvJVpQ1XxTbj-eNTayRBbvMiHOYstrf3N3Lm18KcI";

export function isSpreadsheetIdValid(id: string | null | undefined): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (trimmed === "" || trimmed === "null" || trimmed === "undefined") return false;
  if (trimmed.length < 20) return false;
  if (trimmed.includes("/") || trimmed.includes(":") || trimmed.includes(" ") || trimmed.includes("!")) return false;
  return true;
}

export function extractSpreadsheetId(input: string): string {
  if (!input) return "";
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input.trim();
}

export function setSpreadsheetId(id: string) {
  const cleanId = extractSpreadsheetId(id);
  SPREADSHEET_ID = cleanId;
  localStorage.setItem("PSD_SPREADSHEET_ID", cleanId);
}

// Define sheets and their headers
export const REQUIRED_SHEETS = [
  { title: "1. Petunjuk Penggunaan", headers: ["PETUNJUK PENGISIAN TEMPLATE DATA SISWADIGITAL"] },
  { title: "2. Kelas", headers: ["id", "namaKelas", "deskripsi"] },
  { title: "3. Mata Pelajaran", headers: ["id", "namaMapel"] },
  { title: "4. Siswa", headers: ["id", "nis", "namaSiswa", "kelasId", "namaWali", "noHpWali", "alamatSiswa"] },
  { title: "5. Kategori Tugas", headers: ["id", "kelasId", "mapelId", "namaKategori"] },
  { title: "6. Nilai Siswa", headers: ["tanggal", "kategoriId", "nisSiswa", "nilai"] },
  { title: "7. Daftar Guru", headers: ["code", "namaGuru", "assignedKelasIds", "phoneNumber", "mapelAjar", "isActive"] },
  { title: "8. Jadwal Pelajaran", headers: ["id", "hari", "jamMulai", "jamSelesai", "kelasId", "mapelId", "teacherCode", "ruangan"] },
  { title: "9. Lembar Tugas", headers: ["id", "judul", "deskripsiSoal", "tanggalDibuat", "dueDate", "kelasId", "teacherCode", "lampiranFile"] },
  { title: "10. Absensi Siswa", headers: ["id", "tanggal", "kelasId", "siswaId", "status", "catatan", "jamPelajaran"] },
  { title: "11. Absensi Guru", headers: ["id", "tanggal", "teacherCode", "status", "catatan", "jamPelajaran"] },
  { title: "12. Pengumuman", headers: ["id", "title", "content", "date", "authorName", "authorCode", "targetKelasIds", "phoneNumber", "actionLink"] },
  { title: "13. Ujian Praktek", headers: ["id", "namaUjian", "kelasId", "mapelId", "tanggal", "teacherCode", "siswaId", "nilai", "sudahMengikuti"] },
  { title: "14. Pengumpulan Tugas", headers: ["id", "tugasId", "siswaId", "tanggalKumpul", "linkFileAtauFoto", "catatanSiswa", "statusVerifikasi", "nilaiTugas", "catatanGuru"] },
  { title: "15. Guru Piket", headers: ["id", "hari", "namaGuru", "nohp", "statusTugas", "areaPiket", "catatan"] },
  { title: "16. Agenda Guru", headers: ["id", "tanggal", "judul", "deskripsi", "pertemuanKe", "deadlinePertemuanLain", "kelasId", "isCompleted", "teacherCode", "createdAt"] }
];

/**
 * Ensures REQUIRED_SHEETS tabs exist in the targeted Google Spreadsheet.
 * If some tabs are missing, it bootstraps their creation.
 */
export async function createGoogleSpreadsheet(accessToken: string, title: string = "SiswaDigital_SDIT_AlHanif"): Promise<string> {
  try {
    const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: {
          title: title
        }
      })
    });
    
    if (!resp.ok) {
      const errPayload = await resp.json().catch(() => ({}));
      throw new Error(`Gagal membuat Spreadsheet Baru (${resp.status}): ${errPayload?.error?.message || "Izin tidak memadai"}`);
    }
    
    const data = await resp.json();
    return data.spreadsheetId;
  } catch (err: any) {
    console.error("createGoogleSpreadsheet failed:", err);
    throw err;
  }
}

export async function ensureSpreadsheetTabs(accessToken: string): Promise<string[]> {
  if (!isSpreadsheetIdValid(SPREADSHEET_ID)) {
    throw new Error("Spreadsheet ID tidak valid atau belum dikonfigurasi.");
  }
  try {
    // 1. Fetch current sheets metadata
    const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!resp.ok) {
      throw new Error(`Google API Gagal (${resp.status}): Pastikan anda login dan Spreadsheet ini dapat diakses oleh akun anda.`);
    }
    
    const spreadsheetMeta = await resp.json();
    const existingTitles: string[] = (spreadsheetMeta.sheets || []).map(
      (s: any) => s.properties?.title || ""
    );
    
    const missingSheets = REQUIRED_SHEETS.filter(
      req => !existingTitles.some(ext => ext.toLowerCase() === req.title.toLowerCase())
    );
    
    if (missingSheets.length > 0) {
      // Create missing sheets using batchUpdate request
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;
      const requests = missingSheets.map(m => ({
        addSheet: {
          properties: {
            title: m.title
          }
        }
      }));
      
      const updateResp = await fetch(batchUpdateUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      });
      
      if (!updateResp.ok) {
        throw new Error("Gagal menginisialisasi tab lembaran kerja kerja baru di Google Sheets.");
      }
    }
    
    return REQUIRED_SHEETS.map(r => r.title);
  } catch (err: any) {
    console.error("ensureSpreadsheetTabs failed:", err);
    throw err;
  }
}

/**
 * Writes data objects to Google Sheets sheets by matching headers
 */
export async function exportLocalDataToGoogleSheets(
  accessToken: string,
  data: {
    kelas: Kelas[];
    mapel: MataPelajaran[];
    siswa: Siswa[];
    kategori: KategoriPenilaian[];
    penilaian: Penilaian[];
    guru: GuruCode[];
    jadwal: Jadwal[];
    tugas: Tugas[];
    absenSiswa?: AbsenSiswa[];
    absenGuru?: AbsenGuru[];
    announcements?: Announcement[];
    ujianPraktek?: UjianPraktek[];
    pengumpulanTugas?: PengumpulanTugas[];
    guruPiket?: GuruPiket[];
    agendas?: TeacherAgenda[];
  }
) {
  // Simple cell-quota protector to avoid overflow issues on Google Sheets.
  // Full, lossless Base64 payload is fully maintained & updated within Firestore backup.
  const safeText = (val: string): string => {
    if (!val) return "";
    if (val.length > 40000) {
      if (val.includes("|||")) {
        const parts = val.split("|||");
        return `${parts[0]}|||[Batas Sel Google Sheets Terlampaui - Berkas Utuh Berhasil Disimpan di Cloud Firestore]`;
      }
      return "[Berkas Terlalu Besar - Silakan Tinjau di Halaman Aplikasi]";
    }
    return val;
  };

  // First ensure all sheets are created
  await ensureSpreadsheetTabs(accessToken);
  
  // Transform nested penilaian to flat array for "6. Nilai Siswa"
  const flatGrades: any[] = [];
  data.penilaian.forEach(p => {
    (p.grades || []).forEach(g => {
      // Find matching siswa to retrieve NIS
      const matchedSiswa = data.siswa.find(s => s.id === g.siswaId);
      const nis = matchedSiswa ? matchedSiswa.nis : g.siswaId; // fallback
      flatGrades.push([p.tanggal, p.kategoriId, nis, g.nilai]);
    });
  });

  // Transform exam array for "13. Ujian Praktek"
  const flatExams: any[] = [];
  (data.ujianPraktek || []).forEach(u => {
    (u.items || []).forEach(item => {
      flatExams.push([
        u.id,
        u.namaUjian,
        u.kelasId,
        u.mapelId,
        u.tanggal,
        u.teacherCode || "",
        item.siswaId,
        item.nilai !== undefined ? item.nilai : "",
        item.sudahMengikuti ? "TRUE" : "FALSE"
      ]);
    });
  });

  const getRowsForSheet = (sheetTitle: string): any[][] => {
    switch (sheetTitle) {
      case "1. Petunjuk Penggunaan":
        return [
          ["1. Jangan mengubah nama/susunan kolom pada baris pertama di setiap sheet."],
          ["2. Setiap sheet saling berhubungan menggunakan Kode ID."],
          ["   - Sheet 'Siswa' merujuk ke 'ID Kelas' yang ada di sheet 'Kelas'."],
          ["   - Sheet 'Kategori Tugas' merujuk ke 'ID Kelas' dan 'ID Mapel'."],
          ["   - Sheet 'Nilai Siswa' merujuk ke 'ID Kategori' dan 'NIS' siswa."],
          ["3. Format ID:"],
          ["   - ID Kelas: K001, K002 (K diikuti 3 angka)"],
          ["   - ID Mapel: M001, M002 (M diikuti 3 angka)"],
          ["   - ID Kategori Tugas: KT001, KT002 (KT diikuti 3 angka)"],
          ["   - NIS Siswa: Angka unik (contoh: 240101)"],
          ["4. Format Tanggal pada sheet Nilai Siswa harus YYYY-MM-DD (Contoh: 2026-05-22)."],
          ["5. Nilai harus berupa angka di rentang 0 sampai 100."],
          [""],
          ["Unduh template ini, isi dengan data Anda, lalu unggah kembali melalui sistem."],
          ["Database ini dicadangkan secara otomatis dan tersinkronisasi secara langsung."]
        ];
      case "2. Kelas":
        return data.kelas.map(k => [k.id, k.namaKelas, k.deskripsi || ""]);
      case "3. Mata Pelajaran":
        return data.mapel.map(m => [m.id, m.namaMapel]);
      case "4. Siswa":
        return data.siswa.map(s => [s.id, s.nis, s.namaSiswa, s.kelasId, s.namaWali || "", s.noHpWali || "", s.alamatSiswa || ""]);
      case "5. Kategori Tugas":
        return data.kategori.map(k => [k.id, k.kelasId, k.mapelId, k.namaKategori]);
      case "6. Nilai Siswa":
        return flatGrades;
      case "7. Daftar Guru":
        return data.guru.map(g => [
          g.code,
          g.namaGuru,
          (g.assignedKelasIds || [g.assignedKelasId || ""]).join(","),
          g.phoneNumber || "",
          g.mapelAjar || "",
          g.isActive ? "TRUE" : "FALSE"
        ]);
      case "8. Jadwal Pelajaran":
        return data.jadwal.map(j => [
          j.id,
          j.hari,
          j.jamMulai,
          j.jamSelesai,
          j.kelasId,
          j.mapelId,
          j.teacherCode || "",
          j.ruangan || ""
        ]);
      case "9. Lembar Tugas":
        return (data.tugas || []).map(t => [
          t.id,
          t.judul,
          t.deskripsiSoal,
          t.tanggalDibuat,
          t.dueDate,
          t.kelasId,
          t.teacherCode,
          safeText(t.lampiranFile || "")
        ]);
      case "10. Absensi Siswa":
        return (data.absenSiswa || []).map(a => [
          a.id,
          a.tanggal,
          a.kelasId,
          a.siswaId,
          a.status,
          a.catatan || "",
          a.jamPelajaran || ""
        ]);
      case "11. Absensi Guru":
        return (data.absenGuru || []).map(a => [
          a.id,
          a.tanggal,
          a.teacherCode,
          a.status,
          a.catatan || "",
          a.jamPelajaran || ""
        ]);
      case "12. Pengumuman":
        return (data.announcements || []).map(a => [
          a.id,
          a.title,
          a.content,
          a.date,
          a.authorName,
          a.authorCode,
          (a.targetKelasIds || []).join(","),
          a.phoneNumber || "",
          a.actionLink || ""
        ]);
      case "13. Ujian Praktek":
        return flatExams;
      case "14. Pengumpulan Tugas":
        return (data.pengumpulanTugas || []).map(p => [
          p.id,
          p.tugasId,
          p.siswaId,
          p.tanggalKumpul,
          safeText(p.linkFileAtauFoto || ""),
          p.catatanSiswa || "",
          p.statusVerifikasi,
          p.nilaiTugas !== undefined ? p.nilaiTugas : "",
          p.catatanGuru || ""
        ]);
      case "15. Guru Piket":
        return (data.guruPiket || []).map(g => [
          g.id,
          g.hari,
          g.namaGuru,
          g.nohp,
          g.statusTugas,
          g.areaPiket,
          g.catatan || ""
        ]);
      case "16. Agenda Guru":
        return (data.agendas || []).map(a => [
          a.id,
          a.tanggal,
          a.judul,
          a.deskripsi || "",
          a.pertemuanKe || "",
          a.deadlinePertemuanLain || "",
          a.kelasId || "",
          a.isCompleted ? "TRUE" : "FALSE",
          a.teacherCode,
          a.createdAt
        ]);
      default:
        return [];
    }
  };

  // Perform a clean state by clearing and updating all tabs
  for (const sheet of REQUIRED_SHEETS) {
    const range = `${sheet.title}!A1:Z20000`;
    const encodedRange = encodeURIComponent(range);
    
    // Clear old data
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Format new rows
    const dataRows = getRowsForSheet(sheet.title);
    const bodyValues = [sheet.headers, ...dataRows];

    // Put new data
    const encodedUpdateRange = encodeURIComponent(`${sheet.title}!A1`);
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedUpdateRange}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `${sheet.title}!A1`,
        majorDimension: "ROWS",
        values: bodyValues
      })
    });

    if (!resp.ok) {
      throw new Error(`Gagal menulis data ke tab '${sheet.title}': ${resp.statusText}`);
    }
  }
}

/**
 * Pulls, deserializes and parses whole database tables from Google Sheets
 */
export async function importDataFromGoogleSheets(
  accessToken: string
): Promise<{
  kelas: Kelas[];
  mapel: MataPelajaran[];
  siswa: Siswa[];
  kategori: KategoriPenilaian[];
  penilaian: Penilaian[];
  guru: GuruCode[];
  jadwal: Jadwal[];
  tugas: Tugas[];
  absenSiswa: AbsenSiswa[];
  absenGuru: AbsenGuru[];
  announcements: Announcement[];
  ujianPraktek: UjianPraktek[];
  pengumpulanTugas: PengumpulanTugas[];
  guruPiket: GuruPiket[];
  agendas: TeacherAgenda[];
}> {
  // Ensure we have tabs
  await ensureSpreadsheetTabs(accessToken);

  const fetchValues = async (sheetTitle: string): Promise<any[][]> => {
    const range = `${sheetTitle}!A1:Z10000`;
    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.values || [];
  };

  // Fetch all sheets in parallel
  const [
    kelasRows,
    mapelRows,
    siswaRows,
    kategoriRows,
    nilaiRows,
    guruRows,
    jadwalRows,
    tugasRows,
    absenSiswaRows,
    absenGuruRows,
    announcementRows,
    ujianPraktekRows,
    pengumpulanTugasRows,
    guruPiketRows,
    agendaRows
  ] = await Promise.all([
    fetchValues("2. Kelas"),
    fetchValues("3. Mata Pelajaran"),
    fetchValues("4. Siswa"),
    fetchValues("5. Kategori Tugas"),
    fetchValues("6. Nilai Siswa"),
    fetchValues("7. Daftar Guru"),
    fetchValues("8. Jadwal Pelajaran"),
    fetchValues("9. Lembar Tugas"),
    fetchValues("10. Absensi Siswa"),
    fetchValues("11. Absensi Guru"),
    fetchValues("12. Pengumuman"),
    fetchValues("13. Ujian Praktek"),
    fetchValues("14. Pengumpulan Tugas"),
    fetchValues("14. Pengumpulan Tugas"), // secondary read placeholder or Guru Piket
    fetchValues("16. Agenda Guru")
  ]);

  // Read actual Guru Piket rows separately (idx matching index 13 was duplicate above due to typo in array, resolved here)
  const actualGuruPiketRows = await fetchValues("15. Guru Piket");

  const mapToJSON = (rows: any[][]): any[] => {
    if (rows.length < 1) return [];
    const headers = rows[0].map((h: string) => String(h).trim());
    return rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? row[idx] : "";
      });
      return obj;
    });
  };

  const rawKelas = mapToJSON(kelasRows);
  const rawMapel = mapToJSON(mapelRows);
  const rawSiswa = mapToJSON(siswaRows);
  const rawKategori = mapToJSON(kategoriRows);
  const rawNilai = mapToJSON(nilaiRows);
  const rawGuru = mapToJSON(guruRows);
  const rawJadwal = mapToJSON(jadwalRows);
  const rawTugas = mapToJSON(tugasRows);
  const rawAbsenSiswa = mapToJSON(absenSiswaRows);
  const rawAbsenGuru = mapToJSON(absenGuruRows);
  const rawAnnouncement = mapToJSON(announcementRows);
  const rawUjianPraktek = mapToJSON(ujianPraktekRows);
  const rawPengumpulan = mapToJSON(pengumpulanTugasRows);
  const rawGuruPiket = mapToJSON(actualGuruPiketRows);
  const rawAgendas = mapToJSON(agendaRows);

  // Validate and build entities
  const cleanKelas: Kelas[] = rawKelas.map((row, idx) => ({
    id: String(row.id || `K_NEW_${idx + 1}`).trim(),
    namaKelas: String(row.namaKelas || `Kelas ${idx + 1}`).trim(),
    deskripsi: row.deskripsi ? String(row.deskripsi).trim() : undefined
  })).filter(k => k.id && k.namaKelas);

  const cleanMapel: MataPelajaran[] = rawMapel.map((row, idx) => ({
    id: String(row.id || `M_NEW_${idx + 1}`).trim(),
    namaMapel: String(row.namaMapel || `Mapel ${idx + 1}`).trim()
  })).filter(m => m.id && m.namaMapel);

  const cleanSiswa: Siswa[] = rawSiswa.map((row, idx) => ({
    id: String(row.id || `S_NEW_${idx + 1}`).trim(),
    nis: String(row.nis || `NIS_${idx + 1}`).trim(),
    namaSiswa: String(row.namaSiswa || `Siswa ${idx + 1}`).trim(),
    kelasId: String(row.kelasId || (cleanKelas[0]?.id || "K001")).trim(),
    namaWali: row.namaWali ? String(row.namaWali).trim() : undefined,
    noHpWali: row.noHpWali ? String(row.noHpWali).trim() : undefined,
    alamatSiswa: row.alamatSiswa ? String(row.alamatSiswa).trim() : undefined
  })).filter(s => s.id && s.nis && s.namaSiswa);

  const cleanKategori: KategoriPenilaian[] = rawKategori.map((row, idx) => ({
    id: String(row.id || `KT_NEW_${idx + 1}`).trim(),
    kelasId: String(row.kelasId || "").trim(),
    mapelId: String(row.mapelId || "").trim(),
    namaKategori: String(row.namaKategori || `Kategori ${idx + 1}`).trim()
  })).filter(k => k.id && k.kelasId && k.mapelId && k.namaKategori);

  const cleanGuru: GuruCode[] = rawGuru.map((row, idx) => {
    const code = String(row.code || `G00${idx + 1}`).trim();
    const namaGuru = String(row.namaGuru || `Guru ${idx + 1}`).trim();
    const rawKelasIds = String(row.assignedKelasIds || "").trim();
    const assignedKelasIds = rawKelasIds ? rawKelasIds.split(",").map((x: string) => x.trim()).filter(Boolean) : [];
    const assignedKelasId = assignedKelasIds[0] || undefined;
    const phoneNumber = row.phoneNumber ? String(row.phoneNumber).trim() : undefined;
    const mapelAjar = row.mapelAjar ? String(row.mapelAjar).trim() : undefined;
    const isActive = String(row.isActive).toUpperCase() === "TRUE";

    return {
      code,
      namaGuru,
      assignedKelasId,
      assignedKelasIds,
      createdAt: new Date().toISOString().split("T")[0],
      isActive,
      phoneNumber,
      mapelAjar
    };
  }).filter(g => g.code && g.namaGuru);

  const cleanJadwal: Jadwal[] = rawJadwal.map((row, idx) => ({
    id: String(row.id || `J_NEW_${idx + 1}`).trim(),
    hari: String(row.hari || "Senin").trim() as HariBelajar,
    jamMulai: String(row.jamMulai || "07:30").trim(),
    jamSelesai: String(row.jamSelesai || "09:00").trim(),
    kelasId: String(row.kelasId || "").trim(),
    mapelId: String(row.mapelId || "").trim(),
    teacherCode: String(row.teacherCode || "").trim(),
    ruangan: row.ruangan ? String(row.ruangan).trim() : undefined
  })).filter(j => j.id && j.hari && j.kelasId && j.mapelId);

  const cleanTugas: Tugas[] = rawTugas.map((row, idx) => ({
    id: String(row.id || `T_NEW_${idx + 1}`).trim(),
    judul: String(row.judul || `Tugas ${idx + 1}`).trim(),
    deskripsiSoal: String(row.deskripsiSoal || "").trim(),
    tanggalDibuat: String(row.tanggalDibuat || new Date().toISOString().split("T")[0]).trim(),
    dueDate: String(row.dueDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0]).trim(),
    kelasId: String(row.kelasId || "semua").trim(),
    teacherCode: String(row.teacherCode || "GURU").trim(),
    lampiranFile: row.lampiranFile ? String(row.lampiranFile).trim() : undefined
  })).filter(t => t.id && t.judul && t.kelasId);

  const cleanAbsenSiswa: AbsenSiswa[] = rawAbsenSiswa.map((row, idx) => ({
    id: String(row.id || `ABS-${idx + 1}`).trim(),
    tanggal: String(row.tanggal || "").trim(),
    kelasId: String(row.kelasId || "").trim(),
    siswaId: String(row.siswaId || "").trim(),
    status: (row.status || "Hadir") as any,
    catatan: row.catatan ? String(row.catatan).trim() : undefined,
    jamPelajaran: row.jamPelajaran ? String(row.jamPelajaran).trim() : undefined
  })).filter(a => a.tanggal && a.siswaId);

  const cleanAbsenGuru: AbsenGuru[] = rawAbsenGuru.map((row, idx) => ({
    id: String(row.id || `ABG-${idx + 1}`).trim(),
    tanggal: String(row.tanggal || "").trim(),
    teacherCode: String(row.teacherCode || "").trim(),
    status: (row.status || "Hadir") as any,
    catatan: row.catatan ? String(row.catatan).trim() : undefined,
    jamPelajaran: row.jamPelajaran ? String(row.jamPelajaran).trim() : undefined
  })).filter(a => a.tanggal && a.teacherCode);

  const cleanAnnouncements: Announcement[] = rawAnnouncement.map((row, idx) => ({
    id: String(row.id || `ANN-${idx + 1}`).trim(),
    title: String(row.title || "").trim(),
    content: String(row.content || "").trim(),
    date: String(row.date || "").trim(),
    authorName: String(row.authorName || "").trim(),
    authorCode: String(row.authorCode || "").trim(),
    targetKelasIds: row.targetKelasIds ? String(row.targetKelasIds).split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
    phoneNumber: row.phoneNumber ? String(row.phoneNumber).trim() : undefined,
    actionLink: row.actionLink ? String(row.actionLink).trim() : undefined
  })).filter(a => a.title && a.content);

  const cleanPengumpulan: PengumpulanTugas[] = rawPengumpulan.map((row, idx) => ({
    id: String(row.id || `KMP-${idx + 1}`).trim(),
    tugasId: String(row.tugasId || "").trim(),
    siswaId: String(row.siswaId || "").trim(),
    tanggalKumpul: String(row.tanggalKumpul || "").trim(),
    linkFileAtauFoto: String(row.linkFileAtauFoto || "").trim(),
    catatanSiswa: row.catatanSiswa ? String(row.catatanSiswa).trim() : undefined,
    statusVerifikasi: (row.statusVerifikasi || "Belum Diverifikasi") as any,
    nilaiTugas: row.nilaiTugas ? Number(row.nilaiTugas) : undefined,
    catatanGuru: row.catatanGuru ? String(row.catatanGuru).trim() : undefined
  })).filter(p => p.tugasId && p.siswaId);

  const cleanGuruPiket: GuruPiket[] = rawGuruPiket.map((row, idx) => ({
    id: String(row.id || `PKT-${idx + 1}`).trim(),
    hari: String(row.hari || "").trim(),
    namaGuru: String(row.namaGuru || "").trim(),
    nohp: String(row.nohp || "").trim(),
    statusTugas: (row.statusTugas || "Standby") as any,
    areaPiket: String(row.areaPiket || "").trim(),
    catatan: row.catatan ? String(row.catatan).trim() : undefined
  })).filter(g => g.namaGuru && g.hari);

  const cleanAgendas: TeacherAgenda[] = rawAgendas.map((row, idx) => ({
    id: String(row.id || `AGD-${idx + 1}`).trim(),
    tanggal: String(row.tanggal || "").trim(),
    judul: String(row.judul || "").trim(),
    deskripsi: row.deskripsi ? String(row.deskripsi).trim() : undefined,
    pertemuanKe: row.pertemuanKe ? String(row.pertemuanKe).trim() : undefined,
    deadlinePertemuanLain: row.deadlinePertemuanLain ? String(row.deadlinePertemuanLain).trim() : undefined,
    kelasId: row.kelasId ? String(row.kelasId).trim() : undefined,
    isCompleted: String(row.isCompleted).toUpperCase() === "TRUE",
    teacherCode: String(row.teacherCode || "").trim(),
    createdAt: String(row.createdAt || "").trim()
  })).filter(a => a.judul && a.tanggal);

  // Grouped Ujian Praktek flat rows
  const cleanUjianPraktek: UjianPraktek[] = [];
  rawUjianPraktek.forEach(row => {
    const id = String(row.id || "").trim();
    const namaUjian = String(row.namaUjian || "").trim();
    const kelasId = String(row.kelasId || "").trim();
    const mapelId = String(row.mapelId || "").trim();
    const tanggal = String(row.tanggal || "").trim();
    const teacherCode = String(row.teacherCode || "").trim();
    const siswaId = String(row.siswaId || "").trim();
    const nilai = row.nilai !== "" ? Number(row.nilai) : undefined;
    const sudahMengikuti = String(row.sudahMengikuti).toUpperCase() === "TRUE";

    if (!id || !siswaId) return;

    let testObj = cleanUjianPraktek.find(t => t.id === id);
    if (!testObj) {
      testObj = {
        id,
        namaUjian,
        kelasId,
        mapelId,
        tanggal,
        teacherCode: teacherCode || undefined,
        items: []
      };
      cleanUjianPraktek.push(testObj);
    }
    testObj.items.push({
      siswaId,
      nilai,
      sudahMengikuti
    });
  });

  // Re-build structured Penilaian entries from flat nilai rows
  const cleanPenilaian: Penilaian[] = [];
  rawNilai.forEach(row => {
    const tanggal = String(row.tanggal || new Date().toISOString().split("T")[0]).trim();
    const kategoriId = String(row.kategoriId || "").trim();
    const nisSiswa = String(row.nisSiswa || "").trim();
    const nilai = Number(row.nilai ?? 0);

    if (!kategoriId || !nisSiswa) return;

    // See if group already mapped
    let existPenilaian = cleanPenilaian.find(p => p.tanggal === tanggal && p.kategoriId === kategoriId);
    if (!existPenilaian) {
      existPenilaian = {
        id: `P_NEW_GS_${cleanPenilaian.length + 1}-${Math.floor(100 + Math.random() * 900)}`,
        tanggal,
        kategoriId,
        grades: []
      };
      cleanPenilaian.push(existPenilaian);
    }

    const matchedSiswa = cleanSiswa.find(s => s.nis === nisSiswa);
    const studentId = matchedSiswa ? matchedSiswa.id : `S_UNKM_${nisSiswa}`;

    existPenilaian.grades!.push({
      siswaId: studentId,
      nilai: isNaN(nilai) ? 0 : Math.min(100, Math.max(0, nilai))
    });
  });

  return {
    kelas: cleanKelas,
    mapel: cleanMapel,
    siswa: cleanSiswa,
    kategori: cleanKategori,
    penilaian: cleanPenilaian,
    guru: cleanGuru,
    jadwal: cleanJadwal,
    tugas: cleanTugas,
    absenSiswa: cleanAbsenSiswa,
    absenGuru: cleanAbsenGuru,
    announcements: cleanAnnouncements,
    ujianPraktek: cleanUjianPraktek,
    pengumpulanTugas: cleanPengumpulan,
    guruPiket: cleanGuruPiket,
    agendas: cleanAgendas
  };
}
