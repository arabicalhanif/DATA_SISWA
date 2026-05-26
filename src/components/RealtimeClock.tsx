import React, { useState, useEffect, useMemo } from "react";
import { Clock, Calendar } from "lucide-react";

export function RealtimeClockWidgetMini() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [currentTime]);

  const formattedHijri = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(currentTime);
    } catch (e) {
      return "";
    }
  }, [currentTime]);

  return (
    <div className="hidden lg:flex items-center gap-4 bg-emerald-50/50 backdrop-blur-xs px-4 py-1.5 rounded-2xl border border-emerald-100/45 shadow-3xs hover:bg-emerald-100/30 transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-600 text-white p-1.5 rounded-xl border border-emerald-500/20 shadow-xs animate-pulse">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left font-sans">
          <span className="text-[9px] text-[#577354] font-black uppercase tracking-wider leading-none">Waktu Realtime</span>
          <span className="text-xs font-mono font-bold text-slate-850 tracking-tight mt-0.5">{formattedTime}</span>
        </div>
      </div>

      <div className="w-px h-7 bg-emerald-100/50" />

      <div className="flex items-center gap-2 font-sans">
        <div className="bg-amber-100/30 text-amber-800 p-1.5 rounded-xl border border-amber-200/40">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] text-amber-805 font-black uppercase tracking-wider leading-none">Kalender Maslahat</span>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-705 leading-none mt-0.5">
            <span>{formattedDate}</span>
            {formattedHijri && (
              <>
                <span className="text-slate-300 font-normal">|</span>
                <span className="text-emerald-750 font-black">{formattedHijri} H</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RealtimeClockWidgetLarge() {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [currentTime]);

  const formattedHijri = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(currentTime);
    } catch (e) {
      return "";
    }
  }, [currentTime]);

  return (
    <div className="max-w-xl mx-auto rounded-3xl p-6 bg-white/70 backdrop-blur-md border border-emerald-100/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-sm hover:border-[#8BA888]/50 transition-all duration-300">
      <div className="flex items-center gap-4 w-full justify-center md:justify-start">
        <div className="w-12 h-12 rounded-2xl bg-emerald-650/10 text-emerald-700 flex items-center justify-center border border-emerald-200/30 shrink-0">
          <Clock className="w-6 h-6 animate-pulse text-emerald-600" />
        </div>
        <div className="text-left font-sans">
          <span className="text-[10px] text-emerald-805 font-black uppercase tracking-wider block leading-none">Waktu Realtime</span>
          <span className="text-2xl font-mono font-black text-slate-900 tracking-tight block mt-1">{formattedTime}</span>
        </div>
      </div>

      <div className="w-full md:w-px h-px md:h-12 bg-emerald-100/60 shrink-0" />

      <div className="flex items-center gap-4 w-full justify-center md:justify-start">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200/30 shrink-0">
          <Calendar className="w-6 h-6 text-amber-600" />
        </div>
        <div className="text-left font-sans">
          <span className="text-[10px] text-amber-805 font-black uppercase tracking-wider block leading-none">Kalender Maslahat</span>
          <span className="text-sm font-bold text-slate-850 block mt-1 leading-tight">{formattedDate}</span>
          {formattedHijri && (
            <span className="text-xs font-black text-emerald-805 tracking-tight block mt-0.5">{formattedHijri} Hijriah</span>
          )}
        </div>
      </div>
    </div>
  );
}
