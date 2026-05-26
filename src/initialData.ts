import { Kelas, MataPelajaran, Siswa, KategoriPenilaian, Penilaian, AbsenSiswa, AbsenGuru, Jadwal } from "./types";

// Programmatic helper to generate Indonesian/Muslim student names deterministically
const generateDeterministicSiswa = (kelasId: string, idx: number, prefix: string, lvl: number): Siswa => {
  const boysFirst = [
    "Ahmad", "Muhammad", "Ali", "Yusuf", "Ibrahim", "Hasan", "Husain", "Hamzah", "Umar", "Usman", 
    "Abdurrahman", "Luqman", "Zainuddin", "Syarif", "Fauzan", "Akmal", "Zikri", "Farhan", "Rizky", "Aditya", 
    "Bilal", "Habib", "Arifan", "Zaki", "Raihan", "Hilman", "Fahri", "Gibran", "Yahya", "Thufail"
  ];
  const boysLast = [
    "Pratama", "Hidayat", "Saputra", "Ramadhan", "Putra", "Kurniawan", "Setyawan", "Wijaya", "Santoso", "Suryanto", 
    "Gunawan", "Fauzi", "Hakim", "Zuhri", "Siregar", "Lubis", "Nasution", "Wardana", "Al-Fatih", "Al-Habsyi"
  ];
  
  const girlsFirst = [
    "Aisyah", "Fatimah", "Khadijah", "Zainab", "Maryam", "Siti", "Hana", "Sarah", "Nabila", "Zahra", 
    "Salma", "Rania", "Kayla", "Humaira", "Safira", "Najwa", "Sabrina", "Yasmin", "Syifa", "Amira", 
    "Farida", "Nailah", "Talita", "Alya", "Naura", "Tsabitah", "Rahma", "Laili", "Zulfa", "Kamila"
  ];
  const girlsLast = [
    "Sari", "Lestari", "Putri", "Kartika", "Yuliana", "Kartini", "Nurul", "Huda", "Rosminah", "Al-Atas", 
    "Safitri", "Rahmawati", "Anggraini", "Wahyuni", "Pertiwi", "Kusuma", "Amalia", "Fitriani", "Hasanah", "Fauziah"
  ];

  const waliFirst = [
    "Bp. Hermawan", "Bp. Slamet", "Bp. Joko", "Bp. Bambang", "Bp. Gunawan", "Bp. Budi", "Bp. Hidayat", 
    "Bp. Ridwan", "Bp. Taufik", "Bp. Hendra", "Ibu Rosminah", "Ibu Aminah", "Ibu Rina", "Ibu Dian", "Ibu Kartini"
  ];
  const waliLast = [
    "Syahputra", "Suryanto", "Wahyudi", "Pamungkas", "Santoso", "Syarifuddin", "Wijaya", "Kamil", "Nugroho", "Kartika"
  ];

  const neighborhoods = [
    "Jl. Jenderal Sudirman No. #, Ramanuju, Citangkil, Cilegon",
    "Perumahan PCI Blok B# No. @, Cibeber, Cilegon",
    "Jl. Ahmad Yani Gg. Masjid No. #, Ketileng, Cilegon",
    "Komp. Krakatau Steel Gg. Anyar No. #, Purwakarta, Cilegon",
    "Jl. Sultan Ageng Tirtayasa No. #, Jombang, Cilegon",
    "Perum Taman Cilegon Indah Blok H# No. @, Cibeber, Cilegon",
    "Link. Kadipaten RT 0#/RW 0@, Kedaleman, Cilegon",
    "Jl. Sunan Ampel No. #, Kedaleman, Cilegon",
    "Komp. Metro Cilegon Cluster Saphire No. #, Cilegon",
    "Komp. Taman Grogol Indah Blok D# No. @, Grogol, Cilegon"
  ];

  const classNum = parseInt(kelasId.replace("K", "")) || 1;
  // Deterministic seed based on indices to guarantee no duplicates across classes
  const seed = (idx + classNum * 7) % 30;
  const isBoy = ["A", "B", "C"].includes(prefix.toUpperCase());

  const firstName = isBoy ? boysFirst[seed % boysFirst.length] : girlsFirst[seed % girlsFirst.length];
  const lastName = isBoy ? boysLast[(seed + 3) % boysLast.length] : girlsLast[(seed + 3) % girlsLast.length];
  const namaSiswa = `${firstName} ${lastName}`;

  // Deterministic parent name
  const parentFirst = waliFirst[(seed * 2) % waliFirst.length];
  const parentLast = waliLast[(seed * 2 + 1) % waliLast.length];
  const namaWali = `${parentFirst} ${parentLast}`;

  // Deterministic phoneNumber starting with '628' so WhatsApp buttons work perfectly
  const pSeed = 1000 + (lvl * 100) + (classNum * 13) + idx;
  const noHpWali = `62819321${pSeed}`;

  // Deterministic address
  const addrTemplate = neighborhoods[seed % neighborhoods.length];
  const alamatSiswa = addrTemplate.replace("#", String(idx + 1)).replace("@", String((idx % 5) + 1));

  // NIS sequence starts uniquely per grade level
  const nis = `${26 - lvl}${kelasId.substring(1)}${String(idx + 1).padStart(2, "0")}`;

  return {
    id: `S-${kelasId}-${idx + 1}`,
    nis,
    namaSiswa,
    kelasId,
    namaWali,
    noHpWali,
    alamatSiswa,
    jenisKelamin: isBoy ? "L" : "P"
  };
};

// 1. GENERATE CLASSES FROM 2A TO 6G (35 classes total)
const generateClasses = (): Kelas[] => {
  const levels = [2, 3, 4, 5, 6];
  const parallels = ["A", "B", "C", "D", "E", "F", "G"];
  const list: Kelas[] = [];
  let idCounter = 1;

  levels.forEach(t => {
    parallels.forEach(p => {
      let waliNama = `Ustadz Abdurrahman, S.Pd.I.`;
      let waliNohp = "628123456781";
      
      if (t === 2) {
        waliNama = "Ustadz Abdurrahman, S.Pd.I.";
        waliNohp = "628123456781";
      } else if (t === 3) {
        waliNama = "Ustadzah Fatimah, S.Pd.";
        waliNohp = "628123456782";
      } else if (t === 4) {
        waliNama = "Ustadz Ahmad Fauzi, Lc.";
        waliNohp = "628123456783";
      } else if (t === 5) {
        waliNama = "Ustadz Dr. Luqman Hakim, S.Pd.I";
        waliNohp = "628129876543";
      } else {
        waliNama = "Ustadzah Zahra Al-Atas, Lc";
        waliNohp = "628123212345";
      }

      list.push({
        id: `K${String(idCounter++).padStart(3, "0")}`,
        namaKelas: `Kelas ${t}${p}`,
        deskripsi: `Kelas Jenjang ${t} Paralel ${p} - Kurikulum SDIT Terpadu`,
        waliKelasNama: waliNama,
        waliKelasNohp: waliNohp
      });
    });
  });
  return list;
};

export const INITIAL_KELAS: Kelas[] = generateClasses();

// 2. GENERATE ALL MATULIS (All subjects)
export const INITIAL_MAPEL: MataPelajaran[] = [
  { id: "M001", namaMapel: "Bahasa Arab", kkm: 75 },
  { id: "M002", namaMapel: "Pendidikan Agama Islam (PAI)", kkm: 75 },
  { id: "M003", namaMapel: "Matematika", kkm: 70 },
  { id: "M004", namaMapel: "Sains / IPA", kkm: 72 },
  { id: "M005", namaMapel: "Bahasa Indonesia", kkm: 75 },
  { id: "M006", namaMapel: "Pancasila / PKN", kkm: 75 },
  { id: "M007", namaMapel: "Ilmu Pengetahuan Sosial (IPS)", kkm: 70 },
  { id: "M008", namaMapel: "Seni Budaya & Prakarya (SBDP)", kkm: 75 },
  { id: "M009", namaMapel: "Bahasa Inggris", kkm: 70 },
  { id: "M010", namaMapel: "PJOK (Olahraga)", kkm: 75 }
];

// 3. GENERATE 25 STUDENTS FOR EACH OF THE 35 CLASSES (total 875 students)
const generateAllStudents = (): Siswa[] => {
  const students: Siswa[] = [];
  INITIAL_KELAS.forEach(k => {
    // Extract grade level e.g. "Kelas 2A" -> 2
    const lvlStr = k.namaKelas.split(" ")[1];
    const lvl = parseInt(lvlStr.charAt(0)) || 2;
    const prefix = lvlStr.substring(1); // parallel code e.g. "A"

    for (let i = 0; i < 25; i++) {
      students.push(generateDeterministicSiswa(k.id, i, prefix, lvl));
    }
  });
  return students;
};

export const INITIAL_SISWA: Siswa[] = generateAllStudents();

// 4. CATEGORIES SEEDS OR EMPTY
export const INITIAL_KATEGORI: KategoriPenilaian[] = [
  { id: "KT-001", kelasId: "K001", mapelId: "M001", namaKategori: "Tugas 1 - Percakapan Hiwar Dasar" },
  { id: "KT-002", kelasId: "K001", mapelId: "M001", namaKategori: "Latihan 2 - Hafalan Mufradat Jam 1-2" }
];

// 5. SCORE GRADES FOR SEEDS
export const INITIAL_PENILAIAN: Penilaian[] = [];

// 6. DEFAULT ATTENDANCES FOR SEEDS
export const INITIAL_ABSEN_SISWA: AbsenSiswa[] = [];
export const INITIAL_ABSEN_GURU: AbsenGuru[] = [];

// 7. TIMETABLE SCHEDULE GENERATOR
// "ada 6 guru yang mengajar setiap guru mendapat jadwal di 6 kelas setiap kelas ada 2 kali pertemuan setiap pertemuan ada 2 jam pelajaran setiap jam pelajaran 45 menit"
const generateTimetable = (): Jadwal[] => {
  const timetable: Jadwal[] = [];
  
  const teacherCodes = [
    "USTADZ-01", // Ustadz Abdurrahman
    "USTADZ-02", // Ustadzah Fatimah
    "USTADZ-03", // Ustadz Ahmad Fauzi
    "USTADZ-04", // Ustadz Dr. Luqman Hakim
    "USTADZ-05", // Ustadzah Zahra Al-Atas
    "USTADZ-06"  // Ustadz Shalahuddin
  ];

  // Define 3 blocks of 2x45 minutes sessions (90 minutes total per session)
  const blocks = [
    { start: "07:00", end: "08:30" }, // Jam ke 1-2
    { start: "08:35", end: "10:05" }, // Jam ke 3-4
    { start: "10:15", end: "11:45" }  // Jam ke 5-6
  ];

  teacherCodes.forEach((tCode, tIdx) => {
    // Each teacher teaches 6 classes distributed across K001-K035
    const assignedClassIndices = [
      (tIdx * 6 + 0) % 35,
      (tIdx * 6 + 1) % 35,
      (tIdx * 6 + 2) % 35,
      (tIdx * 6 + 3) % 35,
      (tIdx * 6 + 4) % 35,
      (tIdx * 6 + 5) % 35
    ];

    assignedClassIndices.forEach((cIdx, subIdx) => {
      const targetClass = INITIAL_KELAS[cIdx];
      if (!targetClass) return;

      // 2 meetings per week:
      // Meeting 1 and 2 allocation based on class index role:
      let day1: "Senin" | "Selasa" | "Rabu" | "Kamis" = "Senin";
      let day2: "Senin" | "Selasa" | "Rabu" | "Kamis" = "Rabu";
      let blockIdx = subIdx;

      if (subIdx >= 3) {
        day1 = "Selasa";
        day2 = "Kamis";
        blockIdx = subIdx - 3;
      }

      const activeBlock = blocks[blockIdx] || blocks[0];

      const mapelId = `M${String((tIdx % 10) + 1).padStart(3, "0")}`;

      // Meeting 1
      timetable.push({
        id: `JAD-${tCode}-C${cIdx}-M1`,
        hari: day1,
        jamMulai: activeBlock.start,
        jamSelesai: activeBlock.end,
        kelasId: targetClass.id,
        mapelId: mapelId,
        teacherCode: tCode,
        ruangan: `R. ${targetClass.namaKelas}`
      });

      // Meeting 2
      timetable.push({
        id: `JAD-${tCode}-C${cIdx}-M2`,
        hari: day2,
        jamMulai: activeBlock.start,
        jamSelesai: activeBlock.end,
        kelasId: targetClass.id,
        mapelId: mapelId,
        teacherCode: tCode,
        ruangan: `R. ${targetClass.namaKelas}`
      });
    });
  });

  return timetable;
};

export const INITIAL_JADWAL: Jadwal[] = generateTimetable();
