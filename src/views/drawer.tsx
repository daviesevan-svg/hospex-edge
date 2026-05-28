/** @jsxImportSource hono/jsx */
import type { Booking, Source, BookingStatus } from "../data/mock";

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

export function BookingDrawer({ booking }: { booking: Booking }) {
  return (
    <aside class="drawer" hx-on:click="event.stopPropagation()">
      <div class="drawer-head">
        <div>
          <div class="drawer-ref">{booking.ref}</div>
          <div class="drawer-guest">{booking.lead_guest}</div>
        </div>
        <button
          type="button"
          class="drawer-close"
          hx-get="/drawer/empty"
          hx-target="#drawer"
          hx-swap="innerHTML"
          aria-label="Close"
        >×</button>
      </div>

      <div class="drawer-row">
        <span class="drawer-label">Source</span>
        <span>{SRC_LABEL[booking.src]}{booking.ota_ref ? ` · ${booking.ota_ref}` : ""}</span>
      </div>
      <div class="drawer-row">
        <span class="drawer-label">Status</span>
        <span class={`drawer-status status-${booking.status}`}>{STATUS_LABEL[booking.status]}</span>
      </div>
      <div class="drawer-row">
        <span class="drawer-label">Dates</span>
        <span>{booking.check_in} → {booking.check_out}</span>
      </div>
      <div class="drawer-row">
        <span class="drawer-label">Total</span>
        <span>{fmtMoney(booking.total)} <em class="muted">({fmtMoney(booking.paid)} paid)</em></span>
      </div>

      <h4 class="drawer-h4">Stays ({booking.stays.length})</h4>
      <ul class="drawer-stays">
        {booking.stays.map(s => (
          <li>
            <div><strong>{s.room_id}</strong> · {s.guest_name}</div>
            <div class="muted">
              {s.check_in} · {s.nights}n · {s.adults}A{s.kids > 0 ? `+${s.kids}K` : ""}
            </div>
          </li>
        ))}
      </ul>

      <div class="drawer-actions">
        <button type="button" class="btn primary" disabled>Edit</button>
        <button type="button" class="btn" disabled>Cancel</button>
      </div>
      <p class="muted small">Edit / cancel are stubs in this scaffold. Wire to D1 in v2.</p>
    </aside>
  );
}

function fmtMoney(n: number) {
  return `€${n.toLocaleString("en-IE")}`;
}
