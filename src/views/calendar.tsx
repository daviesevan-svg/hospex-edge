/** @jsxImportSource hono/jsx */
import type { CalendarData, Stay, RoomGroup, Room } from "../data/mock";
import {
  addDays,
  diffDays,
  fromISO,
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

const CELL_W = 116; // matches --cell-w in calendar.css
const CELL_H = 64;

// Map this scaffold's bare statuses onto the design's richer status set.
// The Phoenix design uses :paid / :partial / :unpaid / :in / :hold / :cancelled / :ota_collect.
// Our mock data has: in | paid | partial | ota_collect — pass through.

export function CalendarPage({ data, anchor, span }: Props) {
  const dates = rangeDays(anchor, span);
  const today = todayISO();
  const todayCol = dates.indexOf(today);
  const totalGridW = CELL_W * dates.length;
  const cellWStyle = `--cell-w: ${CELL_W}px; --cell-h: ${CELL_H}px;`;

  // Pre-bucket stays by room
  const staysByRoom = new Map<string, Stay[]>();
  for (const s of data.stays) {
    const arr = staysByRoom.get(s.room_id) ?? [];
    arr.push(s);
    staysByRoom.set(s.room_id, arr);
  }

  const allRooms = data.room_groups.flatMap(g => g.rooms);
  const stats = computeStats(data, today, allRooms.length);

  return (
    <div class="app" style={cellWStyle}>
      <Topbar />
      <Subbar anchor={anchor} span={span} dates={dates} />

      <div class="main">
        <Sidebar groups={data.room_groups} />

        <div class="calendar">
          <DateHeader dates={dates} today={today} totalGridW={totalGridW} />

          <div class="grid-scroll" id="grid-scroll">
            <div class="grid" id="grid-root" style={`width:${totalGridW}px`}>
              {todayCol >= 0 ? (
                <div
                  class="today-line"
                  style={`left:${Math.trunc((todayCol + 0.5) * CELL_W)}px`}
                ></div>
              ) : null}

              {data.room_groups.map(g => (
                <GroupBlock
                  group={g}
                  dates={dates}
                  anchor={anchor}
                  span={span}
                  staysByRoom={staysByRoom}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer stats={stats} />
    </div>
  );
}

function Topbar() {
  return (
    <div class="topbar">
      <div class="brand">
        <div class="brand-mark"></div>
        <div class="brand-name">Hospex</div>
      </div>
      <div class="brand-sep"></div>
      <div class="property">
        <div class="property-avatar">LM</div>
        <div class="property-name">Le Petit Madeleine</div>
        <svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6 8 10.5 12.5 6"/></svg>
      </div>
      <div class="navtabs">
        <button class="navtab" disabled>Dashboard</button>
        <button class="navtab" data-active="1">Calendar</button>
        <button class="navtab" disabled>Bookings</button>
        <button class="navtab" disabled>Guests</button>
        <button class="navtab" disabled>Inventory</button>
        <button class="navtab" disabled>Settings</button>
        <button class="navtab" disabled>Reports</button>
      </div>
      <div class="top-right">
        <button class="icon-btn" title="Help" disabled>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M6 6.5a2 2 0 1 1 2.5 2c-.6.2-.5.7-.5 1.5"/><circle cx="8" cy="12" r=".5" fill="currentColor" stroke="none"/></svg>
        </button>
        <button class="icon-btn" title="Notifications" disabled>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a4 4 0 1 1 8 0v3l1 2H3l1-2V7Z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>
          <span class="badge-dot"></span>
        </button>
        <button class="icon-btn" title="Settings" disabled>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4 11.2 4.8M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8 3.4 3.4"/></svg>
        </button>
        <div class="me-avatar">EM</div>
      </div>
    </div>
  );
}

interface SubbarProps {
  anchor: ISODate;
  span: number;
  dates: ISODate[];
}

function Subbar({ anchor, span, dates }: SubbarProps) {
  const today = todayISO();
  const prevDay = addDays(anchor, -1);
  const nextDay = addDays(anchor, 1);
  const prev = addDays(anchor, -span);
  const next = addDays(anchor, span);
  const last = dates[dates.length - 1];
  const range = `${formatRangePart(anchor)} – ${formatRangePart(last)}`;

  return (
    <div class="subbar">
      <a class="today-btn" href={`/?anchor=${today}&span=${span}`} hx-boost="true">Today</a>

      <div style="display:flex;gap:4px">
        <a class="arrow" href={`/?anchor=${prevDay}&span=${span}`} hx-boost="true" title="Previous day">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8 10 12.5"/></svg>
        </a>
        <a class="arrow" href={`/?anchor=${nextDay}&span=${span}`} hx-boost="true" title="Next day">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>
        </a>
      </div>

      <button class="date-picker-btn" disabled>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5 2v3M11 2v3"/></svg>
        <span class="range">{range}</span>
        <svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6 8 10.5 12.5 6"/></svg>
      </button>

      <div style="display:flex;gap:4px">
        <a class="arrow" href={`/?anchor=${prev}&span=${span}`} hx-boost="true" title={`Previous ${span} days`}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8 10 12.5"/></svg>
        </a>
        <a class="arrow" href={`/?anchor=${next}&span=${span}`} hx-boost="true" title={`Next ${span} days`}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>
        </a>
      </div>

      <div class="seg" style="margin-left:4px">
        <a data-active={span === 7 ? "1" : "0"} href={`/?anchor=${anchor}&span=7`} hx-boost="true">Week</a>
        <a data-active={span === 14 ? "1" : "0"} href={`/?anchor=${anchor}&span=14`} hx-boost="true">2 weeks</a>
        <a data-active={span === 30 ? "1" : "0"} href={`/?anchor=${anchor}&span=30`} hx-boost="true">Month</a>
      </div>

      <div class="toolbar-spacer"></div>

      <label class="filter-chip" data-active="0">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 3.5h12M4 8h8M6 12.5h4"/></svg>
        All rooms
      </label>

      <label class="filter-chip" data-active="0">
        Status: All
        <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6 8 10.5 12.5 6"/></svg>
      </label>

      <div class="search">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5h12l-4.5 6v3l-3-1.5v-1.5L2 3.5Z"/></svg>
        <input placeholder="Filter guests, bookings, rooms…" disabled />
        <span class="kbd" title="Focus filter">⌘K</span>
      </div>

      <button class="primary-btn" disabled>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>
        New booking
      </button>
    </div>
  );
}

function Sidebar({ groups }: { groups: RoomGroup[] }) {
  const total = groups.reduce((n, g) => n + g.rooms.length, 0);

  return (
    <div class="sidebar">
      <div class="sidebar-head">
        <span>Rooms</span>
        <span class="count">{total}</span>
      </div>
      <div class="room-list" id="sidebar-scroll">
        {groups.map(g => (
          <div class="room-group" data-collapsed="0">
            <div class="room-group-head">
              <svg class="caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6 8 10.5 12.5 6"/></svg>
              <span class="type-name">{g.name}</span>
              <span class="type-meta">{g.rooms.length}</span>
            </div>
            {g.rooms.map(r => (
              <div class="room-row" data-lanes="1">
                <span class="num">{r.num}</span>
                <div class="room-meta">
                  <span class="name">{g.name}</span>
                  <span class="sub">{r.view} · F{r.floor}</span>
                </div>
                <span class="status" data-s={r.status}></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface DateHeaderProps {
  dates: ISODate[];
  today: ISODate;
  totalGridW: number;
}

function DateHeader({ dates, today, totalGridW }: DateHeaderProps) {
  return (
    <div class="date-header" id="date-header">
      <div style={`display:grid;grid-auto-flow:column;grid-auto-columns:${CELL_W}px;width:${totalGridW}px`}>
        {dates.map((date, i) => {
          const d = fromISO(date);
          const isToday = date === today;
          const weekend = isWeekend(date);
          const monthStart = d.getUTCDate() === 1 || i === 0;
          return (
            <div class="date-cell" data-today={isToday ? "1" : "0"} data-weekend={weekend ? "1" : "0"}>
              {monthStart ? <span class="month-tag">{monthAbbr(date)}</span> : null}
              <span class="dow">{dowAbbr(date)}</span>
              <span class="dom">{d.getUTCDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GroupBlockProps {
  group: RoomGroup;
  dates: ISODate[];
  anchor: ISODate;
  span: number;
  staysByRoom: Map<string, Stay[]>;
}

function GroupBlock({ group, dates, anchor, span, staysByRoom }: GroupBlockProps) {
  return (
    <div class="row-group" data-collapsed="0">
      <div class="row-group-head">
        {dates.map(d => (
          <div class="row-group-cell" data-weekend={isWeekend(d) ? "1" : "0"}></div>
        ))}
      </div>

      {group.rooms.map((room, ri) => (
        <RoomRow
          room={room}
          isLast={ri === group.rooms.length - 1}
          dates={dates}
          anchor={anchor}
          span={span}
          stays={staysByRoom.get(room.id) ?? []}
        />
      ))}
    </div>
  );
}

interface RoomRowProps {
  room: Room;
  isLast: boolean;
  dates: ISODate[];
  anchor: ISODate;
  span: number;
  stays: Stay[];
}

function RoomRow({ room, isLast, dates, anchor, span, stays }: RoomRowProps) {
  const rangeStart = anchor;
  const rangeEnd = addDays(dates[dates.length - 1], 1);

  const visible = stays.filter(s => {
    const co = addDays(s.check_in, s.nights);
    return s.check_in < rangeEnd && co > rangeStart;
  });

  return (
    <div class="row" id={`row-${room.id}`} data-room-id={room.id} data-lanes="1" data-group-end={isLast ? "1" : "0"}>
      {dates.map((date, ci) => (
        <div class="row-cell" data-col={ci} data-weekend={isWeekend(date) ? "1" : "0"}></div>
      ))}

      {visible.map(s => (
        <Pill stay={s} anchor={anchor} span={span} />
      ))}
    </div>
  );
}

interface PillProps {
  stay: Stay;
  anchor: ISODate;
  span: number;
}

function Pill({ stay, anchor, span }: PillProps) {
  const co = addDays(stay.check_in, stay.nights);
  const startCol = Math.max(0, diffDays(anchor, stay.check_in));
  const endCol = Math.min(span, diffDays(anchor, co));
  const nightsVisible = Math.max(1, endCol - startCol);

  // Pills span check-in noon → check-out noon: offset by half a cell.
  const left = Math.trunc((startCol + 0.5) * CELL_W);
  const width = nightsVisible * CELL_W - 4;

  return (
    <div
      class="booking"
      id={`stay-${stay.id}`}
      data-status={stay.status}
      data-w={nightsVisible}
      data-lane="0"
      data-multi={stay.room_count > 1 ? "1" : "0"}
      style={`left:${left}px;width:${width}px`}
      hx-get={`/booking/${stay.booking_id}`}
      hx-target="#drawer"
      hx-swap="innerHTML"
    >
      <div class="bar"></div>
      <div class="body">
        <div class="top">
          <span class="name">{stay.guest_name}</span>
          {stay.room_count > 1 && nightsVisible >= 2 ? (
            <span class="multi" title={`${stay.room_count} rooms`}>
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5 9.5 6.5"/><path d="M9 4.5l1-1a2.1 2.1 0 0 1 3 3l-1 1"/><path d="M7 11.5l-1 1a2.1 2.1 0 0 1-3-3l1-1"/></svg>
              {stay.room_count}
            </span>
          ) : null}
          {nightsVisible >= 2 ? <span class="src">{stay.src}</span> : null}
        </div>
        {nightsVisible >= 2 ? (
          <div class="bottom">
            <span class={"left" + (stay.total === stay.paid ? " paid" : "")}>
              {stay.room_count > 1
                ? `Group of ${stay.room_count}`
                : stay.total === stay.paid
                ? "✓ Paid"
                : stay.status === "ota_collect"
                ? "Prepaid"
                : `${formatMoney(stay.total - stay.paid)} due`}
            </span>
            <span class="pax">
              {stay.adults > 0 ? (
                <>
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="2.2"/><path d="M3.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/></svg>
                  <span class="ct">{stay.adults}</span>
                </>
              ) : null}
              {stay.kids > 0 ? (
                <>
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="1.7"/><path d="M5 13.5c0-1.8 1.4-3 3-3s3 1.2 3 3"/></svg>
                  <span class="ct">{stay.kids}</span>
                </>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface Stats {
  occ_rate: number;
  occupied_count: number;
  total_rooms: number;
  sold_count: number;
  check_ins: number;
  check_outs: number;
  due: number;
}

function computeStats(data: CalendarData, today: ISODate, totalRooms: number): Stats {
  let occupied = 0;
  let checkIns = 0;
  let checkOuts = 0;
  let due = 0;
  for (const s of data.stays) {
    const co = addDays(s.check_in, s.nights);
    if (s.check_in <= today && co > today) occupied++;
    if (s.check_in === today) checkIns++;
    if (co === today) checkOuts++;
  }
  for (const b of data.bookings) {
    due += Math.max(0, b.total - b.paid);
  }
  return {
    occ_rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
    occupied_count: occupied,
    total_rooms: totalRooms,
    sold_count: occupied,
    check_ins: checkIns,
    check_outs: checkOuts,
    due,
  };
}

function Footer({ stats }: { stats: Stats }) {
  return (
    <div class="footer">
      <div class="legend">
        <div class="legend-item"><div class="legend-dot in"></div>Checked in</div>
        <div class="legend-item"><div class="legend-dot paid"></div>Paid</div>
        <div class="legend-item"><div class="legend-dot partial"></div>Partial</div>
        <div class="legend-item"><div class="legend-dot unpaid"></div>Unpaid</div>
        <div class="legend-item"><div class="legend-dot ota"></div>OTA collect</div>
        <div class="legend-item"><div class="legend-dot hold"></div>Block</div>
      </div>
      <div class="footer-right">
        <div class="stat">
          Occupancy tonight <b>{stats.occ_rate}%</b>
          <span style="color:var(--ink-4)"> ({stats.occupied_count}/{stats.total_rooms})</span>
        </div>
        <div class="stat">Check-ins today <b>{stats.check_ins}</b></div>
        <div class="stat">Check-outs today <b>{stats.check_outs}</b></div>
        <div class="stat">Outstanding <b>{formatMoney(stats.due)}</b></div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOWS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function monthAbbr(s: ISODate): string {
  return MONTHS[fromISO(s).getUTCMonth()];
}

function dowAbbr(s: ISODate): string {
  return DOWS[fromISO(s).getUTCDay()];
}

function formatRangePart(s: ISODate): string {
  const d = fromISO(s);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatMoney(n: number): string {
  return `€${n.toLocaleString("en-IE")}`;
}

export function emptyDrawer() {
  return <div></div>;
}
