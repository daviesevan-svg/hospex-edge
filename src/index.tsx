import { Hono } from "hono";
import { layout } from "./views/layout";
import { CalendarPage, emptyDrawer } from "./views/calendar";
import { BookingDrawer } from "./views/drawer";
import { buildData } from "./data/mock";
import { today as todayISO } from "./lib/dates";

type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// Static assets (CSS) — served by Workers Assets binding.
app.get("/calendar.css", c => c.env.ASSETS.fetch(new Request(new URL("/calendar.css", c.req.url))));
app.get("/favicon.ico", c => new Response(null, { status: 204 }));

app.get("/", c => {
  const anchor = c.req.query("anchor") ?? todayISO();
  const span = clamp(Number(c.req.query("span") ?? 14), 7, 30);
  const data = buildData(todayISO());

  return c.html(
    layout(
      "Calendar · hospex-edge",
      <>
        <CalendarPage data={data} anchor={anchor} span={span} />
        <div id="drawer"></div>
      </>,
    ),
  );
});

app.get("/booking/:id", c => {
  const id = Number(c.req.param("id"));
  const data = buildData(todayISO());
  const booking = data.bookings.find(b => b.id === id);
  if (!booking) return c.html(<div class="drawer-empty">Not found</div>, 404);
  return c.html(<BookingDrawer booking={booking} />);
});

app.get("/drawer/empty", c => c.html(emptyDrawer()));

app.get("/healthz", c => c.text("ok"));

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

export default app;
