// Fixture payloads for the insights_* RPCs, in the shapes of
// supabase/migrations/20261030000001_insights.sql. Days are Bangkok days
// counted back from today, so the page's range windows always have data.
// Snapshot day today-5 is missing on purpose (cron skipped: the line gaps).
// The first signup (today-75) predates the first snapshot (today-59), so the
// all-time snapshot charts say when history starts.

const DAY_MS = 86_400_000;
const today = () => Date.now() + 7 * 3_600_000;
const day = (back) => new Date(today() - back * DAY_MS).toISOString().slice(0, 10);
const at = (back, hour) => `${day(back)}T${String(hour).padStart(2, "0")}:00:00+07:00`;

function snapshots(shortHistory) {
  if (shortHistory) return [{ day: day(0), players: 140, verified: 100, guests: 30, unverified: 10, whitelisted: 90, banned: 2 }];
  const rows = [];
  for (let back = 59; back >= 0; back--) {
    if (back === 5) continue;
    const players = 80 + (59 - back);
    rows.push({ day: day(back), players, verified: Math.round(players * 0.7), guests: Math.round(players * 0.2), unverified: players - Math.round(players * 0.7) - Math.round(players * 0.2), whitelisted: Math.round(players * 0.6), banned: back % 9 === 0 ? 3 : 2 });
  }
  return rows;
}

const FACULTIES = ["คณะวิศวกรรมศาสตร์", "คณะอักษรศาสตร์", "คณะวิทยาศาสตร์", "คณะพาณิชยศาสตร์และการบัญชี", "คณะนิติศาสตร์", "Faculty of Medicine", "คณะสถาปัตยกรรมศาสตร์", "คณะครุศาสตร์", "คณะรัฐศาสตร์", "คณะเศรษฐศาสตร์", "คณะนิเทศศาสตร์", "Not set"];

export function insightsFixture(name, { shortHistory = false } = {}) {
  switch (name) {
    case "insights_players":
      return {
        snapshots: snapshots(shortHistory),
        signups: [0, 1, 2, 4, 9, 12, 20, 33, 47, 75].map((back, i) => ({ day: day(back), n: (i % 4) + 1 })),
        faculty: [...FACULTIES.map((faculty, i) => ({ faculty, n: 30 - i * 2 })), { faculty: "Other", n: 5 }],
      };
    case "insights_funnel":
      return {
        steps: [{ step: "signed_in", n: 120 }, { step: "discord", n: 112 }, { step: "verified", n: 90 }, { step: "registered", n: 70 }, { step: "whitelisted", n: 64 }],
        failures: [{ day: day(1), step: "minecraft", code: "INVALID_INPUT", n: 3 }, { day: day(2), step: "verify", code: "CU_WRONG_DOMAIN", n: 5 }, { day: day(3), step: "minecraft", code: "CLOSED", n: 1 }],
      };
    case "insights_events": {
      const events = [
        { id: "e1", name: "Build battle: สร้างปราสาทในหนึ่งชั่วโมง ใครสร้างสวยที่สุดได้รางวัล", starts_at: at(25, 19), interest: 40, attendance: 22, self: 15, staff: 5, backfill: 2 },
        { id: "e2", name: '=HYPERLINK("http://example.test","click")', starts_at: at(12, 20), interest: 18, attendance: 9, self: 9, staff: 0, backfill: 0 },
        { id: "e3", name: "+cmd night", starts_at: at(6, 18), interest: 25, attendance: 0, self: 0, staff: 0, backfill: 0 },
        { id: "e4", name: "Parkour ประจำเดือน", starts_at: at(2, 19), interest: 31, attendance: 17, self: 12, staff: 4, backfill: 1 },
      ];
      const attendance = events.filter((e) => e.attendance > 0).map((e) => ({ day: e.starts_at.slice(0, 10), n: e.attendance }));
      return { events, attendance };
    }
    case "insights_community":
      return {
        tiers: [{ tier: "common", owners: 80, badges: 6 }, { tier: "rare", owners: 41, badges: 4 }, { tier: "epic", owners: 12, badges: 3 }, { tier: "legendary", owners: 2, badges: 1 }],
        top: [{ id: "b1", name: "ผู้เข้าร่วมกิจกรรมครั้งแรก", tier: "common", owners: 70 }, { id: "b2", name: "Builder", tier: "rare", owners: 33 }, { id: "b3", name: "นักสำรวจแห่งโลกใต้ดิน", tier: "epic", owners: 12 }],
        reports: [{ day: day(1), opened: 2, resolved: 1 }, { day: day(4), opened: 1, resolved: 2 }, { day: day(15), opened: 3, resolved: 0 }],
        appeals: [{ day: day(3), opened: 1, decided: 0 }, { day: day(10), opened: 0, decided: 1 }],
      };
    case "insights_staff":
      return {
        actions: [
          { day: day(1), entity: "profiles", n: 4 }, { day: day(1), entity: "minecraft_registrations", n: 2 },
          { day: day(3), entity: "bans", n: 1 }, { day: day(8), entity: "achievement_awards", n: 5 },
          { day: day(8), entity: "events", n: 3 }, { day: day(20), entity: "announcements", n: 1 },
          { day: day(20), entity: "profiles", n: 2 },
        ],
      };
    default:
      return null;
  }
}
