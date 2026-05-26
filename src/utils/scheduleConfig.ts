export interface JamPelajaranItem {
  id: string;
  name: string; // e.g. "Jam 1" or "Istirahat L"
  time: string; // e.g. "07:00 - 07:40"
  type: "belajar" | "istirahat";
}

export interface ScheduleConfig {
  lakiLaki: JamPelajaranItem[];
  perempuan: JamPelajaranItem[];
}

export const DEFAULT_LAKI_LAKI_SCHEDULE: JamPelajaranItem[] = [
  { id: "L-1", name: "Jam Ke 1-2 (Laki-laki)", time: "07:00 - 08:10", type: "belajar" },
  { id: "L-2", name: "Jam Ke 3-4 (Laki-laki)", time: "08:15 - 09:25", type: "belajar" },
  { id: "L-3", name: "Istirahat Utama Laki-laki", time: "09:25 - 09:45", type: "istirahat" },
  { id: "L-4", name: "Jam Ke 5-6 (Laki-laki)", time: "09:45 - 10:55", type: "belajar" },
  { id: "L-5", name: "Jam Ke 7-8 (Laki-laki)", time: "11:00 - 12:10", type: "belajar" }
];

export const DEFAULT_PEREMPUAN_SCHEDULE: JamPelajaranItem[] = [
  { id: "P-1", name: "Jam Ke 1-2 (Perempuan)", time: "07:05 - 08:15", type: "belajar" },
  { id: "P-2", name: "Jam Ke 3-4 (Perempuan)", time: "08:20 - 09:30", type: "belajar" },
  { id: "P-3", name: "Istirahat Utama Perempuan", time: "09:30 - 09:50", type: "istirahat" },
  { id: "P-4", name: "Jam Ke 5-6 (Perempuan)", time: "09:50 - 11:00", type: "belajar" },
  { id: "P-5", name: "Jam Ke 7-8 (Perempuan)", time: "11:05 - 12:15", type: "belajar" }
];

export function getScheduleConfig(): ScheduleConfig {
  try {
    const saved = localStorage.getItem("PSD_SCHEDULE_CONFIG");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to parse schedule config", e);
  }
  return {
    lakiLaki: DEFAULT_LAKI_LAKI_SCHEDULE,
    perempuan: DEFAULT_PEREMPUAN_SCHEDULE
  };
}

export function saveScheduleConfig(config: ScheduleConfig): void {
  try {
    localStorage.setItem("PSD_SCHEDULE_CONFIG", JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save schedule config", e);
  }
}

export function getAllCombinedJamOptions(): string[] {
  const config = getScheduleConfig();
  const optionsList = new Set<string>();
  
  config.lakiLaki.forEach(item => {
    optionsList.add(`${item.name} (${item.time})`);
  });
  config.perempuan.forEach(item => {
    optionsList.add(`${item.name} (${item.time})`);
  });

  // Also include the legacy defaults in case historical database has them
  const legacy = [
    "Jam Ke 1-2 (07:00 - 08:10)",
    "Jam Ke 3-4 (08:15 - 09:25)",
    "Jam Ke 5-6 (09:45 - 10:55)",
    "Jam Ke 7-8 (11:00 - 12:10)"
  ];
  legacy.forEach(l => optionsList.add(l));

  return Array.from(optionsList);
}
