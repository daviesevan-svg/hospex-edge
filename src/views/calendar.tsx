/** @jsxImportSource hono/jsx */
import type { CalendarData, Stay, RoomGroup, Room, Source, BookingStatus } from "../data/mock";
import {
  addDays,
  diffDays,
  formatMonthLabel,
  formatShort,
  isWeekend,
  rangeDays,
  today as todayISO,
  type ISODate,
} from "../lib/dates";

interface Props {
  data: CalendarData;
  anchor: ISODate;
  span: number; // number of days visible
}

const SRC_LABEL: Record<Source, string> = {
  BC: "Booking.com",
  AB: "Airbnb",
  EX: "Expedia",
  DR: "Direct",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  in: "In-house",
  paid: "Paid",
  partial: "Partial",
  ota_collect: "OTA collect",
};

export function CalendarPage({ data, anchor, span }: Props) {
  const days = rangeDays(anchor, span);
  const prev = addDays(anchor, -span);
  const next = addDays(anchor, span);
  const today = todayISO();

  // Pre-bucket stays by room for fast rendering
  const stayByRoom = new Map<string, Stay[]>();
  for (const s of data.stays) {
    const arr = stayByRoom.get(s.room_id) ?? [];
    arr.push(s);
    stayByRoom.set(s.room_id, arr);
  }

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">⌂</span>
          <span class="brand-name">hospex<em>·edge</em></span>
        </div>
        <nav class="nav">
          <a class="nav-item active">Calendar</a>
          <a class="nav-item" aria-disabled="true">Bookings</a>
          <a class="nav-item" aria-disabled="true">Rooms</a>
          <a class="nav-item" aria-disabled="true">Settings</a>
        </nav>
        <div class="topright">
          <span class="prop-name">Le Petit Madeleine</span>
        </div>
      </header>

      <section class="toolbar">
        <div class="datebar">
          <a class="btn" href={`/?anchor=${prev}&span=${span}`} hx-boost="true">← Prev</a>
          <a class="btn" href={`/?anchor=${today}&span=${span}`} hx-boost="true">Today</a>
          <a class="btn" href={`/?anchor=${next}&span=${span}`} hx-boost="true">Next →</a>
          <span class="month-label">{formatMonthLabel(anchor)}</span>
        </div>
        <div class="spanbar">
          {[7, 14, 30].map(n => (
            <a
              class={`chip ${n === span ? "active" : ""}`}
              href={`/?anchor=${anchor}&span=${n}`}
              hx-boost="true"
            >{n}d</a>
          ))}
        </div>
      </section>

      <main class="grid-wrap">
        <Grid data={data} days={days} stayByRoom={stayByRoom} today={today} />
      </main>

      <footer class="statusbar">
        <span>Rooms: {totalRooms(data)}</span>
        <span>·</span>
        <span>Bookings in view: {visibleBookings(data, anchor, span)}</span>
        <span>·</span>
        <span>Source: in-memory mock</span>
      </footer>
    </div>
  );
}

function totalRooms(data: CalendarData) {
  return data.room_groups.reduce((n, g) => n + g.rooms.length, 0);
}

function visibleBookings(data: CalendarData, anchor: ISODate, span: number) {
  const end = addDays(anchor, span);
  const ids = new Set<number>();
  for (const s of data.stays) {
    const co = addDays(s.check_in, s.nights);
    if (s.check_in < end && co > anchor) ids.add(s.booking_id);
  }
  return ids.size;
}

interface GridProps {
  data: CalendarData;
  days: ISODate[];
  stayByRoom: Map<string, Stay[]>;
  today: ISODate;
}

function Grid({ data, days, stayByRoom, today }: GridProps) {
  const dayCount = days.length;
  // Column template: 220px room column + N day columns
  const gridStyle = `--days:${dayCount}`;

  return (
    <div class="grid" style={gridStyle}>
      <div class="grid-head">
        <div class="room-col head-cell">Room</div>
        {days.map(d => (
          <div
            class={`day-cell head-cell ${d === today ? "today" : ""} ${isWeekend(d) ? "weekend" : ""}`}
          >
            <div class="day-label">{formatShort(d)}</div>
          </div>
        ))}
      </div>

      {data.room_groups.map(g => (
        <GroupRows group={g} days={days} stayByRoom={stayByRoom} today={today} />
      ))}
    </div>
  );
}

interface GroupProps {
  group: RoomGroup;
  days: ISODate[];
  stayByRoom: Map<string, Stay[]>;
  today: ISODate;
}

function GroupRows({ group, days, stayByRoom, today }: GroupProps) {
  return (
    <>
      <div class="group-head">
        <div class="room-col">
          <div class="group-name">{group.name}</div>
          <div class="group-beds">{group.beds}</div>
        </div>
        {days.map(d => (
          <div class={`day-cell group-fill ${d === today ? "today" : ""} ${isWeekend(d) ? "weekend" : ""}`}></div>
        ))}
      </div>
      {group.rooms.map(r => (
        <RoomRow room={r} days={days} stays={stayByRoom.get(r.id) ?? []} today={today} />
      ))}
    </>
  );
}

interface RoomRowProps {
  room: Room;
  days: ISODate[];
  stays: Stay[];
  today: ISODate;
}

function RoomRow({ room, days, stays, today }: RoomRowProps) {
  const rangeStart = days[0];
  const rangeEnd = addDays(days[days.length - 1], 1);

  // Stays that overlap the visible range
  const visible = stays.filter(s => {
    const co = addDays(s.check_in, s.nights);
    return s.check_in < rangeEnd && co > rangeStart;
  });

  return (
    <div class="room-row">
      <div class="room-col">
        <div class="room-num">{room.num}</div>
        <div class="room-meta">
          <span class="room-view">{room.view}</span>
          <span class={`room-status status-${room.status}`}>{room.status}</span>
        </div>
      </div>
      {days.map(d => (
        <div class={`day-cell ${d === today ? "today" : ""} ${isWeekend(d) ? "weekend" : ""}`}></div>
      ))}
      {visible.map(s => (
        <Pill stay={s} rangeStart={rangeStart} rangeEnd={rangeEnd} dayCount={days.length} />
      ))}
    </div>
  );
}

interface PillProps {
  stay: Stay;
  rangeStart: ISODate;
  rangeEnd: ISODate;
  dayCount: number;
}

function Pill({ stay, rangeStart, rangeEnd, dayCount }: PillProps) {
  const co = addDays(stay.check_in, stay.nights);
  const startCol = Math.max(0, diffDays(rangeStart, stay.check_in));
  const endCol = Math.min(dayCount, diffDays(rangeStart, co));
  const span = Math.max(1, endCol - startCol);
  const leftClipped = stay.check_in < rangeStart;
  const rightClipped = co > rangeEnd;

  // grid-column is 1-indexed AND the first column is the room column,
  // so day d at offset i lives in column (i + 2).
  const colStart = startCol + 2;
  const colEnd = colStart + span;

  const style = `grid-column: ${colStart} / ${colEnd}`;

  return (
    <button
      type="button"
      class={`pill src-${stay.src} status-${stay.status} ${leftClipped ? "clip-l" : ""} ${rightClipped ? "clip-r" : ""}`}
      style={style}
      hx-get={`/booking/${stay.booking_id}`}
      hx-target="#drawer"
      hx-swap="innerHTML"
      title={`${stay.guest_name} · ${SRC_LABEL[stay.src]} · ${STATUS_LABEL[stay.status]}`}
    >
      <span class="pill-guest">{stay.guest_name}</span>
      <span class="pill-meta">
        {stay.nights}n · {stay.adults}A{stay.kids > 0 ? `+${stay.kids}K` : ""}
      </span>
    </button>
  );
}

export function emptyDrawer() {
  return <div class="drawer-empty"></div>;
}
