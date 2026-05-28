/** @jsxImportSource hono/jsx */
import type { Booking, Source, BookingStatus, Stay } from "../data/mock";
import { addDays, fromISO, type ISODate } from "../lib/dates";

const SRC_NAME: Record<Source, string> = {
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

const COLLECT_LABEL = {
  property: "Hotel",
  ota: "Channel",
} as const;

export function BookingDrawer({ booking }: { booking: Booking }) {
  const balance = booking.total - booking.paid;
  const pct = booking.total > 0 ? Math.round((booking.paid / booking.total) * 100) : 0;
  const balanceClass = balance === 0 ? "ok" : booking.paid === 0 ? "neg" : "warn";
  const initials = initialsOf(booking.lead_guest);
  const avatar = avatarColors(booking.lead_guest);

  return (
    <>
      <div
        id="booking-scrim"
        class="drawer-scrim"
        data-open="1"
        hx-get="/drawer/empty"
        hx-target="#drawer"
        hx-swap="innerHTML"
      ></div>

      <div id="booking-drawer" class="drawer" data-open="1" role="dialog" aria-modal="true">
        {/* Toolbar */}
        <div class="dr-toolbar">
          <button
            class="dr-back"
            type="button"
            hx-get="/drawer/empty"
            hx-target="#drawer"
            hx-swap="innerHTML"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5 5.5 8 10 12.5"/></svg>
            Calendar
          </button>
          <div class="dr-tool-right">
            <button class="dr-pill-btn" type="button" disabled>
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 13.5 4 5 12.5 2.5 13.5 3.5 11Z"/></svg>
              Edit
            </button>
            <button class="dr-icon" title="More" type="button" disabled>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="3.5" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12.5" cy="8" r="1.3"/></svg>
            </button>
            <button
              class="dr-icon"
              title="Close"
              type="button"
              hx-get="/drawer/empty"
              hx-target="#drawer"
              hx-swap="innerHTML"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
            </button>
          </div>
        </div>

        {/* Hero */}
        <div class="dr-hero">
          <div class="dr-guest">
            <div class="dr-avatar" style={`background:${avatar.bg};color:${avatar.fg}`}>
              {initials}
            </div>
            <div class="dr-guest-meta">
              <div class="dr-name">{booking.lead_guest}</div>
              <div class="dr-subline">
                <span class="id">#{booking.ref}</span>
                <span class="sep"></span>
                <span class="dr-source">{SRC_NAME[booking.src]}</span>
                {booking.stays.length > 1 ? (
                  <>
                    <span class="sep"></span>
                    <span class="multi-tag">{booking.stays.length} rooms</span>
                  </>
                ) : null}
              </div>
            </div>
            <div class="status-pill" data-s={booking.status}>
              <span class="dot"></span>
              {STATUS_LABEL[booking.status]}
            </div>
          </div>
        </div>

        {/* Tabs (inert — details only) */}
        <div class="dr-tabs">
          <button class="dr-tab" type="button" data-active="1">Details</button>
          <button class="dr-tab" type="button" data-active="0" disabled>
            Payments <span class="badge">0</span>
          </button>
          <button class="dr-tab" type="button" data-active="0" disabled>
            History <span class="badge">0</span>
          </button>
        </div>

        {/* Body */}
        <div class="dr-body">
          {/* Rooms */}
          <div class="dr-sect">
            <div class="dr-sect-head">
              <div class="dr-sect-title">Rooms ({booking.stays.length})</div>
              <button class="dr-sect-action" type="button" disabled>+ Add room</button>
            </div>
            <div class="dr-rooms">
              {booking.stays.map(s => (
                <RoomBlock stay={s} />
              ))}
            </div>
          </div>

          {/* Booking source */}
          <div class="dr-sect">
            <div class="dr-sect-head"><div class="dr-sect-title">Booking source</div></div>
            <div class="dr-fields">
              <div class="dr-field">
                <span class="k">Channel</span>
                <span class="v">
                  <span class={`src-badge src-${booking.src}`}>{booking.src}</span>
                  {SRC_NAME[booking.src]}
                </span>
              </div>
              {booking.ota_ref ? (
                <div class="dr-field">
                  <span class="k">OTA reference</span>
                  <span class="v mono">{booking.ota_ref}</span>
                </div>
              ) : null}
              <div class="dr-field">
                <span class="k">Payment collected by</span>
                <span class="v">
                  <span class={`collect-pill collect-${booking.payment_collect}`}>
                    {COLLECT_LABEL[booking.payment_collect]}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div class="dr-sect">
            <div class="dr-sect-head">
              <div class="dr-sect-title">Pricing</div>
            </div>
            <div class="dr-fields">
              <div class="dr-field">
                <span class="k">Total</span>
                <span class="v mono">{formatMoney(booking.total)}</span>
              </div>
              <div class="dr-field">
                <span class="k">Paid</span>
                <span class="v mono">{formatMoney(booking.paid)}</span>
              </div>
              <div class="dr-field total">
                <span class="k">Balance</span>
                <span class={`v mono ${balanceClass}`}>
                  {balance === 0 ? "✓ Settled" : formatMoney(balance)}
                </span>
              </div>
            </div>
            <div class="dr-balance-bars" style="margin-top:10px">
              <div class="paidbar" style={`width:${pct}%`}></div>
              <div class="duebar" style={`width:${100 - pct}%`}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RoomBlock({ stay }: { stay: Stay }) {
  const co = addDays(stay.check_in, stay.nights);
  return (
    <div class="dr-room" data-open="1" data-focused="0">
      <div class="dr-room-head">
        <svg class="dr-room-caret" viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 6 8 10.5 12.5 6"/></svg>
        <span class="dr-room-num">{stay.room_id.replace(/^r(oom-)?/, "")}</span>
        <span class="dr-room-type"></span>
        <span class="dr-room-summary">
          {stay.guest_name}
          <span class="dot-sep"></span>
          <span class="mono">{shortDate(stay.check_in)} → {shortDate(co)}</span>
        </span>
        <span class="dr-room-meta">{stay.nights}n</span>
      </div>
      <div class="dr-room-body">
        <div class="dr-room-row">
          <span class="k">Guest</span>
          <span class="v">{stay.guest_name}</span>
        </div>
        <div class="dr-room-row">
          <span class="k">Dates</span>
          <span class="v mono">{stay.check_in} → {co}</span>
        </div>
        <div class="dr-room-row">
          <span class="k">Nights</span>
          <span class="v mono">{stay.nights}</span>
        </div>
        <div class="dr-room-row">
          <span class="k">Party</span>
          <span class="v">
            <span class="chip-row">
              <span class="chip">{stay.adults} adult{stay.adults === 1 ? "" : "s"}</span>
              {stay.kids > 0 ? <span class="chip">{stay.kids} kid{stay.kids === 1 ? "" : "s"}</span> : null}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function shortDate(s: ISODate): string {
  const d = fromISO(s);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatMoney(n: number): string {
  return `€${n.toLocaleString("en-IE")}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(p => /[A-Za-z]/.test(p[0] ?? ""));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase();
}

function avatarColors(name: string): { bg: string; fg: string } {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  const hue = Math.abs(h) % 360;
  return { bg: `oklch(85% 0.08 ${hue})`, fg: `oklch(35% 0.12 ${hue})` };
}
