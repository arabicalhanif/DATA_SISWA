export interface Kelas {
  id: string;
  namaKelas: string;
  deskripsi?: string;
  waliKelasNama?: string;  // Nama Lengkap Wali Kelas
  waliKelasNohp?: string;  // Nomor WhatsApp Aktif Wali Kelas
}

export interface MataPelajaran {
  id: string;
  namaMapel: string;
  kkm?: number; // Kriteria Ketuntasan Minimal, defaults to e.g. 75
}

export interface Siswa {
  id: string;
  nis: string; // NIS/NISN
  namaSiswa: string;
  kelasId: string; // Auto populated or chosen
  teacherCode?: string; // Tracks upload teacher
  namaWali?: string;    // Parent / Guardian Name (Nama Wali Murid)
  noHpWali?: string;    // Parent WA / Phone number (No WA Wali Murid)
  alamatSiswa?: string; // Student Residence Address (Alamat Siswa)
  isAlumni?: boolean;   // Marks as alumnus if student goes past Grade 6 (Alumni)
  tahunKeluar?: number; // Stores the year graduated / moved to Alumni for auto-cleanup checking
  jenisKelamin?: "L" | "P"; // L = Laki-laki, P = Perempuan
  kodeAkses?: string;   // Kode Akses khusus Ortu/Murid
}

export interface KategoriPenilaian {
  id: string;
  kelasId: string;
  mapelId: string;
  namaKategori: string; // Kategori/Tugas
  teacherCode?: string; // Tracks upload teacher
}

export interface SiswaNilai {
  siswaId: string;
  nilai: number; // 0-100
}

export interface Penilaian {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kategoriId: string; // Refers to KategoriPenilaian
  grades: SiswaNilai[];
  teacherCode?: string; // Tracks upload teacher
  umumkanWali?: boolean; // Choose to notify parents or not
}

export interface GuruCode {
  code: string;
  namaGuru: string;
  assignedKelasId?: string;
  assignedKelasIds?: string[]; // Multiple assigned classes support
  createdAt: string;
  isActive: boolean;
  phoneNumber?: string; // WhatsApp number for teacher coordination
  mapelAjar?: string;   // Lesson/subject taught (Mata pelajaran yang diajar)
  mapelAjars?: string[]; // Multiple assigned subjects support
  isWaliKelas?: boolean; // True if Wali Kelas, False if Guru Mapel
  email?: string;        // Account email associated with this guru
}

export interface KegiatanEkstra {
  id: string;
  namaKegiatan: string;
  deskripsi: string;
  tanggalKegiatan?: string;
  flyerImage?: string;       // Base64 image flyer
  linkPendaftaran?: string;  // Google Form / registration link
  contactNoWa: string;       // WhatsApp contact number (WA admin, guru, dll)
  contactNama?: string;      // PIC Name
  createdAt: string;
}

export type AttendanceStatusSiswa = "Hadir" | "Sakit" | "Izin" | "Alpa";
export type AttendanceStatusGuru = "Hadir" | "Sakit" | "Izin" | "Cuti" | "Alpa";

export interface AbsenSiswa {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelasId: string;
  siswaId: string;
  status: AttendanceStatusSiswa;
  catatan?: string;
  jamPelajaran?: string; // e.g. "Jam 1-2 (07:00-08:10)"
}

export interface AbsenGuru {
  id: string;
  tanggal: string; // YYYY-MM-DD
  teacherCode: string;
  status: AttendanceStatusGuru;
  catatan?: string;
  jamPelajaran?: string;
}

export type HariBelajar = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";

export interface Jadwal {
  id: string;
  hari: HariBelajar;
  jamMulai: string; // e.g., "07:30"
  jamSelesai: string; // e.g., "09:00"
  kelasId: string;
  mapelId: string;
  teacherCode: string;
  ruangan?: string;
  isIstirahat?: boolean; // Optional flag for break times
  labelIstirahat?: string; // e.g., "Istirahat Banin" or "Istirahat Banat"
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  authorCode: string; // e.g. "GURU-2026" or "MASTER-ADMIN"
  targetKelasIds?: string[]; // Optional target classes, empty or undefined means all classes
  phoneNumber?: string;      // Optional phone number for parents to contact/fill in
  actionLink?: string;       // Optional link/form URL for parents to fill in
  imageUrl?: string;         // Uploaded picture / poster for announcement
  expiredDate?: string;      // Expiration deadline of announcement
}

export interface Tugas {
  id: string;
  judul: string;
  deskripsiSoal: string;
  tanggalDibuat: string;
  dueDate: string;
  kelasId: string; // "semua" or specific kelasId
  teacherCode: string;
  lampiranFile?: string; // e.g. "mufrodat_latihan.pdf" / base64 data / simulated url
  lampiranFileType?: "pdf" | "word" | "image" | "none";
  eduLink?: string; // Links like video or educative references
  eduLinkLabel?: string; // e.g. "Video Pembelajaran Mufrodat"
  umumkanWali?: boolean; // Choose to notify parents or not
  targetSiswaIds?: string[]; // Specific students assignment (penerima tugas spesifik)
}

export interface PengumpulanTugas {
  id: string;
  tugasId: string;
  siswaId: string;
  tanggalKumpul: string;
  linkFileAtauFoto: string; // Simulated file name or base64 data
  catatanSiswa?: string;
  statusVerifikasi: "Belum Diverifikasi" | "Disetujui" | "Ditolak";
  nilaiTugas?: number; // 0-100
  catatanGuru?: string;
}

export interface UjianPraktekSiswa {
  siswaId: string;
  nilai?: number; // 0-100
  sudahMengikuti: boolean;
}

export interface UjianPraktek {
  id: string;
  namaUjian: string;
  kelasId: string;
  mapelId: string;
  tanggal: string; // YYYY-MM-DD
  items: UjianPraktekSiswa[];
  teacherCode?: string; // Tracks upload teacher
  umumkanWali?: boolean; // Choose to notify parents or not
}

export interface GuruPiket {
  id: string;
  hari: string; // Hari piket, e.g. "Senin"
  namaGuru: string;
  nohp: string; // WhatsApp number
  statusTugas: "Standby" | "Tugas Ganti" | "Selesai";
  areaPiket: string; // Blok tugas, e.g., "Gedung Utama, Rombel Atas"
  catatan?: string;
}

export interface TeacherAgenda {
  id: string;
  tanggal: string; // YYYY-MM-DD
  judul: string;
  deskripsi?: string;
  pertemuanKe?: string;          // e.g. "Pertemuan 8"
  deadlinePertemuanLain?: string; // reminding for target next meetings
  kelasId?: string;               // Optional associated class
  isCompleted: boolean;
  teacherCode: string;            // Tracks which teacher owns the agenda item
  createdAt: string;
}


