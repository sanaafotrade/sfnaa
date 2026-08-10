'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Calendar, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface CustomDatePickerProps {
  value: string;         // YYYY-MM-DD or ''
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_AR = ['أح','اث','ثل','أر','خم','جم','سب'];
const DAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function CustomDatePicker({
  value, onChange, placeholder, label, required, disabled, minDate, maxDate,
}: CustomDatePickerProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  
  // Position state for fixed calendar
  const [calPos, setCalPos] = useState<{ top: number; left: number; width: number; dropUp: boolean }>({
    top: 0, left: 0, width: 300, dropUp: false,
  });

  // Parse current value or use today
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  // Portal ready after mount
  useEffect(() => { setPortalReady(true); }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (calRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll (for modals)
  useEffect(() => {
    if (!open) return;
    const handler = () => {
      if (triggerRef.current) updatePosition();
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  // Calculate position based on trigger button
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const calHeight = 380;
    const dropUp = spaceBelow < calHeight && rect.top > calHeight;
    
    setCalPos({
      top: dropUp ? rect.top - calHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 300),
      dropUp,
    });
  }, []);

  // Navigate months
  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const prevDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const calendarDays: { day: number; month: 'prev' | 'current' | 'next'; dateStr: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({ day: d, month: 'prev', dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ 
      day: d, month: 'current', 
      dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` 
    });
  }

  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({ day: d, month: 'next', dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  const isDisabledDate = (dateStr: string) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isToday = (dateStr: string) => dateStr === todayStr;

  const selectDate = (dateStr: string) => {
    if (isDisabledDate(dateStr)) return;
    onChange(dateStr);
    setOpen(false);
  };

  const handleToday = () => {
    selectDate(todayStr);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const handleOpen = () => {
    if (disabled) return;
    if (!open) {
      updatePosition();
      if (parsed) { setViewYear(parsed.getFullYear()); setViewMonth(parsed.getMonth()); }
    }
    setOpen(!open);
  };

  const displayValue = parsed
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
    : '';

  const dayHeaders = isEn ? DAYS_EN : DAYS_AR;
  const monthNames = isEn ? MONTHS_EN : MONTHS_AR;

  // Calendar rendered via portal to avoid overflow
  const calendarEl = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={calRef}
          initial={{ opacity: 0, y: calPos.dropUp ? 6 : -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: calPos.dropUp ? 6 : -6, scale: 0.97 }}
          transition={{ duration: 0.12 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4"
          style={{
            position: 'fixed',
            top: calPos.top,
            left: calPos.left,
            width: calPos.width,
            zIndex: 99999,
            maxWidth: '340px',
            minWidth: '300px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronUp className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-bold text-slate-800">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayHeaders.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              const isSelected = d.dateStr === value;
              const isTodayDay = isToday(d.dateStr);
              const isOtherMonth = d.month !== 'current';
              const isDateDisabled = isDisabledDate(d.dateStr);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDateDisabled}
                  onClick={() => selectDate(d.dateStr)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                      : isTodayDay
                        ? 'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200'
                        : isDateDisabled
                          ? 'text-slate-200 cursor-not-allowed'
                          : isOtherMonth
                            ? 'text-slate-300 hover:bg-slate-50'
                            : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {d.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-50 transition-colors"
            >
              {isEn ? 'Today' : 'اليوم'}
            </button>
            {value && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {isEn ? 'Clear' : 'مسح'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
          open ? 'border-amber-400 ring-2 ring-amber-100 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={displayValue ? 'text-slate-800 font-mono' : 'text-slate-400'} dir="ltr">
          {displayValue || placeholder || (isEn ? 'Select date' : 'اختر تاريخ')}
        </span>
        <Calendar className="w-4 h-4 text-slate-400" />
      </button>

      {/* Render calendar as portal to avoid modal overflow */}
      {portalReady && createPortal(calendarEl, document.body)}
    </div>
  );
}
