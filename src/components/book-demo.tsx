"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, easeOutExpo } from "@/lib/animations";

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: Date | null, b: Date | null) {
  return (
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function isToday(d: Date) {
  return isSameDay(d, new Date());
}
function isPast(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/* ═══════════════════════════════════════════
   CUSTOM CALENDAR
   ═══════════════════════════════════════════ */
function CustomCalendar({
  selected,
  onSelect,
  bookedDates,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  bookedDates: Date[];
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const isBooked = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    return bookedDates.some((bd) => isSameDay(bd, d));
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="w-9 h-9 border border-border flex items-center justify-center cursor-pointer text-muted-foreground hover:border-foreground transition-colors bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <div className="font-display text-xl lg:text-2xl font-bold tracking-tight text-foreground">
            {MONTHS[viewMonth]}
          </div>
          <div className="font-sans text-[10px] font-[600] tracking-[3px] text-muted-foreground">
            {viewYear}
          </div>
        </div>

        <button
          onClick={nextMonth}
          className="w-9 h-9 border border-border flex items-center justify-center cursor-pointer text-muted-foreground hover:border-foreground transition-colors bg-transparent"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center font-sans text-[9px] font-[600] tracking-[2px] uppercase text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const date = new Date(viewYear, viewMonth, day);
          const isSelected = isSameDay(date, selected);
          const isTodayDate = isToday(date);
          const isPastDate = isPast(date);
          const isBookedDate = isBooked(day);
          const disabled = isPastDate || isBookedDate;

          return (
            <motion.button
              key={day}
              whileTap={!disabled ? { scale: 0.9 } : {}}
              onClick={() => !disabled && onSelect(date)}
              className={cn(
                "relative w-full aspect-square flex items-center justify-center border-none cursor-pointer font-sans text-sm outline-none transition-all duration-200",
                disabled && "cursor-default text-muted-foreground/30",
                isSelected &&
                  "font-[700] text-white bg-[var(--primary)]",
                !isSelected &&
                  !disabled &&
                  "text-muted-foreground hover:text-foreground hover:bg-[rgba(0,95,2,0.06)]",
                isBookedDate && "line-through",
                !isSelected && !disabled && !isBookedDate && "bg-transparent"
              )}
            >
              {day}
              {isTodayDate && !isSelected && (
                <div
                  className="absolute bottom-1 w-1 h-1 "
                  style={{ background: "var(--primary)" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TIME SLOT PICKER
   ═══════════════════════════════════════════ */
function TimePicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (t: string) => void;
}) {
  const slots = useMemo(() => {
    const arr: string[] = [];
    for (let h = 9; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 18 && m > 0) break;
        arr.push(
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
        );
      }
    }
    return arr;
  }, []);

  return (
    <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto time-scroll">
      {slots.map((time) => {
        const isActive = selected === time;
        return (
          <motion.button
            key={time}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(time)}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 border cursor-pointer font-sans text-[13px] tracking-[1px] transition-all duration-200 outline-none shrink-0 bg-transparent",
              isActive
                ? "border-[var(--primary)] bg-[rgba(0,95,2,0.06)] text-[var(--primary)] font-[600]"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground font-[400]"
            )}
          >
            {time}
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-1.5 h-1.5 rotate-45"
                style={{ background: "var(--primary)" }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function BookDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("10:00");

  const bookedDates = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + 3 + i);
      return d;
    });
  }, []);

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <section
      ref={sectionRef}
      id="book-demo-section"
      className="relative overflow-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
        {/* ─── Header ─── */}
        <motion.div
          ref={headerRef}
          className="text-center mb-16 lg:mb-20"
          variants={staggerContainer(0.12, 0)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            className="font-sans text-xs font-[500] tracking-[3px] uppercase mb-5"
            style={{ color: "var(--primary)" }}
            variants={staggerItem}
          >
            Book a Demo
          </motion.p>

          <motion.h2
            className="font-display text-[clamp(28px,4vw,44px)] font-bold leading-[1.15] tracking-tight text-foreground mb-4"
            variants={staggerItem}
          >
            See Fundex{" "}
            <span className="font-sans font-normal">in action.</span>
          </motion.h2>

          <motion.p
            className="font-sans text-[16px] text-muted-foreground leading-[1.7] max-w-md mx-auto"
            variants={staggerItem}
          >
            Pick a date and time that works for you. Our team will walk you
            through the platform.
          </motion.p>
        </motion.div>

        {/* ─── Booking Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.3, ease: easeOutExpo }}
          className="relative border-[.1px] overflow-hidden bg-background"
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] booking-grid">
            {/* Calendar */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-border calendar-col">
              <div className="font-sans text-[10px] font-[600] tracking-[4px] uppercase text-muted-foreground mb-5">
                Select Date
              </div>
              <CustomCalendar
                selected={selectedDate}
                onSelect={setSelectedDate}
                bookedDates={bookedDates}
              />
            </div>

            {/* Time picker */}
            <div className="p-8 md:py-10 md:px-6 flex flex-col time-col">
              <div className="font-sans text-[10px] font-[600] tracking-[4px] uppercase text-muted-foreground mb-5">
                Select Time
              </div>
              <TimePicker selected={selectedTime} onSelect={setSelectedTime} />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-8 md:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              {selectedDate && selectedTime ? (
                <p className="font-sans text-sm text-muted-foreground m-0">
                  Demo scheduled for{" "}
                  <span className="text-foreground font-[600]">
                    {formattedDate}
                  </span>{" "}
                  at{" "}
                  <span
                    className="font-[600] font-sans text-[13px]"
                    style={{ color: "var(--primary)" }}
                  >
                    {selectedTime}
                  </span>
                </p>
              ) : (
                <p className="font-display text-sm italic text-muted-foreground m-0">
                  Select a date and time to continue.
                </p>
              )}
            </div>

            <motion.button
              whileHover={selectedDate ? { scale: 1.04, y: -2 } : {}}
              whileTap={selectedDate ? { scale: 0.96 } : {}}
              disabled={!selectedDate}
              className={cn(
                "inline-flex items-center gap-2.5 px-8 py-3.5 font-sans text-[15px] font-[500] border-none transition-all duration-300 cursor-pointer",
                selectedDate
                  ? "bg-foreground text-background hover:opacity-90 "
                  : "bg-muted text-muted-foreground cursor-default "
              )}
            >
              Confirm
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style>{`
        .time-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .time-scroll::-webkit-scrollbar-track {
          background: var(--border);
        }
        .time-scroll::-webkit-scrollbar-thumb {
          background: var(--accent);
          opacity: 0.3;
        }
      `}</style>
    </section>
  );
}
