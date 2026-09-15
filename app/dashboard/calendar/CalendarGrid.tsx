"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useMemo, useRef } from "react";
import { CalendarCategory, CalendarDay } from "./calendarApi";

export default function CalendarGrid({ anchor, mode, days, category, onDay }: {
  anchor: string; mode: "month" | "week"; days: CalendarDay[]; category: CalendarCategory;
  onDay: (date: string, category?: CalendarCategory) => void;
}) {
  const ref = useRef<FullCalendar>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => ref.current?.getApi().changeView(mode === "month" ? "dayGridMonth" : "dayGridWeek", anchor));
    return () => cancelAnimationFrame(frame);
  }, [anchor, mode]);
  const events = useMemo(() => days.flatMap((day) => {
    const entries: any[] = [];
    const add = (title: string, kind: string, color: string, textColor: string) => entries.push({
      id: `${day.date}:${kind}:${entries.length}`, title, start: day.date, allDay: true, backgroundColor: color, borderColor: color, textColor,
      extendedProps: { date: day.date, order: entries.length, category: kind === "pending_leave" ? "leave" : kind === "pending_wfh" ? "wfh" : kind },
    });
    if (category === "all" || category === "leave") {
      if (day.onLeave) add(`${day.onLeave} on leave`, "leave", "#DBEAFE", "#1D4ED8");
      if (day.pendingLeave) add(`${day.pendingLeave} pending leave`, "pending_leave", "#FEF3C7", "#92400E");
    }
    if (category === "all" || category === "wfh") {
      if (day.wfh) add(`${day.wfh} WFH`, "wfh", "#CCFBF1", "#115E59");
      if (day.pendingWfh) add(`${day.pendingWfh} pending WFH`, "pending_wfh", "#FEF3C7", "#92400E");
    }
    if (category === "all" || category === "holiday") {
      for (const holiday of day.holidays) add(`${holiday.name}${holiday.type === "optional" ? " (optional)" : ""}${holiday.isHalfDay ? " (half day)" : ""}`, "holiday", "#FFE4E6", "#9F1239");
    }
    if ((category === "all" || category === "weekly_off") && day.weeklyOff) add(`${day.weeklyOff} weekly off`, "weekly_off", "#F1F5F9", "#475569");
    if (entries.length <= 4) return entries;
    return [...entries.slice(0, 4), { id: `${day.date}:more`, title: "Show all", start: day.date, allDay: true,
      backgroundColor: "#F1F5F9", borderColor: "#F1F5F9", textColor: "#475569",
      extendedProps: { date: day.date, category, order: 4 },
    }];
  }), [category, days]);
  return <FullCalendar ref={ref} plugins={[dayGridPlugin, interactionPlugin]} initialDate={anchor} initialView="dayGridMonth"
    headerToolbar={false} firstDay={1} fixedWeekCount={false} height="auto" events={events} dayMaxEvents={false}
    editable={false} selectable={false} eventOrder="order" displayEventTime={false}
    dateClick={(info) => onDay(info.dateStr)}
    eventClick={(info) => onDay(info.event.extendedProps.date, info.event.extendedProps.category)}
    eventContent={(info) => <span>{info.event.title}</span>}
  />;
}
