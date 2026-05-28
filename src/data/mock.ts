// Hardcoded demo data, ported from Hospex.Content.MockCalendarData.
//
// A booking is the contract-level entity (one folio, one payment trail) and
// contains one or more stays — each stay is a room-night allocation with its
// own guest. The calendar renders one pill per stay; clicking any pill opens
// the parent booking.
//
// In the Workers version this will be replaced by D1 queries; the in-memory
// store mirrors the shape so the view layer doesn't need to change.

import { addDays, type ISODate } from "../lib/dates";

export type RoomStatus = "clean" | "dirty" | "ooo";
export type BookingStatus = "in" | "paid" | "partial" | "ota_collect";
export type Source = "BC" | "AB" | "EX" | "DR";

export interface Room {
  id: string;
  num: string;
  floor: number;
  view: string;
  status: RoomStatus;
}

export interface RoomGroup {
  id: string;
  name: string;
  beds: string;
  rooms: Room[];
}

export interface Stay {
  id: number;
  booking_id: number;
  room_id: string;
  guest_name: string;
  adults: number;
  kids: number;
  check_in: ISODate;
  nights: number;
  // denormalized for pill rendering
  status: BookingStatus;
  src: Source;
  total: number;
  paid: number;
  room_count: number;
}

export interface Booking {
  id: number;
  ref: string;
  lead_guest: string;
  src: Source;
  status: BookingStatus;
  total: number;
  paid: number;
  check_in: ISODate;
  check_out: ISODate;
  stays: Stay[];
  ota_ref: string | null;
  payment_collect: "property" | "ota";
}

export interface CalendarData {
  room_groups: RoomGroup[];
  bookings: Booking[];
  stays: Stay[];
}

const ROOM_GROUPS: RoomGroup[] = [
  {
    id: "std",
    name: "Standard Queen",
    beds: "Queen · 22 m²",
    rooms: [
      { id: "room-101", num: "101", floor: 1, view: "Garden",    status: "clean" },
      { id: "room-102", num: "102", floor: 1, view: "Garden",    status: "clean" },
      { id: "r103",     num: "103", floor: 1, view: "Courtyard", status: "dirty" },
      { id: "r104",     num: "104", floor: 1, view: "Courtyard", status: "clean" },
      { id: "r105",     num: "105", floor: 1, view: "Garden",    status: "clean" },
    ],
  },
  {
    id: "dlx",
    name: "Deluxe King",
    beds: "King · 32 m²",
    rooms: [
      { id: "room-201", num: "201", floor: 2, view: "Sea",  status: "clean" },
      { id: "room-202", num: "202", floor: 2, view: "Sea",  status: "clean" },
      { id: "r203",     num: "203", floor: 2, view: "City", status: "dirty" },
      { id: "r204",     num: "204", floor: 2, view: "City", status: "ooo" },
    ],
  },
  {
    id: "sui",
    name: "Junior Suite",
    beds: "King + sofa · 44 m²",
    rooms: [
      { id: "room-301", num: "301", floor: 3, view: "Sea", status: "clean" },
      { id: "r302",     num: "302", floor: 3, view: "Sea", status: "clean" },
      { id: "r303",     num: "303", floor: 3, view: "Sea", status: "clean" },
    ],
  },
  {
    id: "fam",
    name: "Family Room",
    beds: "2 Queen · 38 m²",
    rooms: [
      { id: "r401", num: "401", floor: 4, view: "Sea", status: "clean" },
      { id: "r402", num: "402", floor: 4, view: "Sea", status: "clean" },
    ],
  },
];

interface RawStay {
  room_id: string;
  guest?: string;
  adults: number;
  kids: number;
  offset: number;
  nights: number;
}

interface RawBooking {
  lead_guest: string;
  src: Source;
  status: BookingStatus;
  total: number;
  paid: number;
  stays: RawStay[];
}

function single(
  guest: string,
  room_id: string,
  offset: number,
  nights: number,
  adults: number,
  kids: number,
  status: BookingStatus,
  total: number,
  paid: number,
  src: Source,
): RawBooking {
  return {
    lead_guest: guest, src, status, total, paid,
    stays: [{ room_id, guest, adults, kids, offset, nights }],
  };
}

const RAW: RawBooking[] = [
  // Single-room bookings
  single("Anya Petrova",    "room-101", -4, 5, 2, 0, "in",          540,  270,  "BC"),
  single("Marcus Klein",    "room-101",  2, 3, 2, 1, "partial",     510,  200,  "DR"),
  single("Eddie Long",      "room-101",  6, 2, 1, 0, "paid",        340,  340,  "EX"),
  single("Sofia Marchetti", "room-102", -2, 4, 2, 0, "paid",        680,  680,  "BC"),
  single("David Park",      "room-102",  3, 2, 2, 0, "ota_collect", 320,  0,    "AB"),
  single("Maya Adler",      "room-102",  7, 3, 1, 0, "partial",     510,  150,  "DR"),
  single("James Whitlock",  "room-201", -3, 4, 2, 0, "in",          920,  460,  "BC"),
  single("Felix Ozuna",     "room-201",  8, 2, 2, 0, "paid",        460,  460,  "EX"),
  single("Hannah Müller",   "room-202", -1, 7, 2, 0, "paid",       1610, 1610, "BC"),
  single("Robin Cassidy",   "room-202",  7, 2, 2, 0, "ota_collect", 460,  0,    "AB"),
  single("Eleanor Whitmore","room-301", -2, 6, 2, 0, "in",         2100, 1050, "DR"),
  single("Khalid Rashid",   "room-301",  5, 3, 2, 0, "paid",       1050, 1050, "BC"),

  // Multi-room: wedding party
  {
    lead_guest: "Olivia Brandt",
    src: "DR", status: "partial", total: 2300, paid: 1150,
    stays: [
      { room_id: "room-201", guest: "Olivia & Tom Brandt", adults: 2, kids: 1, offset: 2, nights: 5 },
      { room_id: "room-202", guest: "Eric & Mara Brandt",  adults: 2, kids: 0, offset: 2, nights: 5 },
    ],
  },

  // Multi-room: family booking
  {
    lead_guest: "The Okonkwo Family",
    src: "BC", status: "in", total: 3360, paid: 1680,
    stays: [
      { room_id: "room-301", guest: "Adaeze Okonkwo",      adults: 2, kids: 0, offset: -3, nights: 6 },
      { room_id: "room-102", guest: "Sade & Femi Okonkwo", adults: 2, kids: 2, offset: -3, nights: 6 },
    ],
  },
];

function otaRef(src: Source, bid: number): string | null {
  switch (src) {
    case "BC": return `BDC-${4_000_000_000 + bid * 137}`;
    case "AB": return `HM${bid.toString(36).toUpperCase()}4FZ`;
    case "EX": return `EXP-${800_000_000 + bid * 91}`;
    case "DR": return null;
  }
}

function paymentCollect(src: Source): "property" | "ota" {
  return src === "AB" || src === "EX" ? "ota" : "property";
}

export function buildData(today: ISODate): CalendarData {
  const bookings: Booking[] = RAW.map((b, i) => {
    const bid = 1000 + i;
    const stays: Stay[] = b.stays.map((s, j) => ({
      id: bid * 100 + j,
      booking_id: bid,
      room_id: s.room_id,
      guest_name: s.guest ?? b.lead_guest,
      adults: s.adults,
      kids: s.kids,
      check_in: addDays(today, s.offset),
      nights: s.nights,
      status: b.status,
      src: b.src,
      total: b.total,
      paid: b.paid,
      room_count: b.stays.length,
    }));

    const earliest = stays.reduce((a, s) => (s.check_in < a ? s.check_in : a), stays[0].check_in);
    const latest = stays.reduce((a, s) => {
      const co = addDays(s.check_in, s.nights);
      return co > a ? co : a;
    }, addDays(stays[0].check_in, stays[0].nights));

    return {
      id: bid,
      ref: `BK-${bid}`,
      lead_guest: b.lead_guest,
      src: b.src,
      status: b.status,
      total: b.total,
      paid: b.paid,
      check_in: earliest,
      check_out: latest,
      stays,
      ota_ref: otaRef(b.src, bid),
      payment_collect: paymentCollect(b.src),
    };
  });

  return {
    room_groups: ROOM_GROUPS,
    bookings,
    stays: bookings.flatMap(b => b.stays),
  };
}
