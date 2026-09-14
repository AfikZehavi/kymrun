export type DeliverySpeed = {
  id: string;
  label: string;
  window: string;
  price: number;
  note: string;
};

export const deliverySpeeds: DeliverySpeed[] = [
  {
    id: "express",
    label: "עד 4 שעות",
    window: "אקספרס באזורי שירות נבחרים",
    price: 79,
    note: "להזמנות שמתקבלות עד 17:00, בימים א׳–ה׳",
  },
  {
    id: "next",
    label: "עד 24 שעות",
    window: "מחר אצלך",
    price: 39,
    note: "זמין ברוב אזורי המרכז, השרון והשפלה",
  },
  {
    id: "standard",
    label: "עד 48 שעות",
    window: "משלוח רגיל",
    price: 35,
    note: "חינם בהזמנה מעל ₪550",
  },
];

export type Zone = {
  name: string;
  cities: string[];
  speeds: string[];
};

export const deliveryZones: Zone[] = [
  {
    name: "גוש דן",
    cities: [
      "תל אביב",
      "רמת גן",
      "גבעתיים",
      "בני ברק",
      "הרצליה",
      "בת ים",
      "חולון",
      "פתח תקווה",
      "ראשון לציון",
    ],
    speeds: ["express", "next", "standard"],
  },
  {
    name: "שרון והשפלה",
    cities: [
      "רעננה",
      "כפר סבא",
      "הוד השרון",
      "נתניה",
      "רחובות",
      "נס ציונה",
      "מודיעין",
      "אשדוד",
    ],
    speeds: ["express", "next", "standard"],
  },
  {
    name: "ירושלים וסביבתה",
    cities: ["ירושלים", "מבשרת ציון", "בית שמש", "מעלה אדומים"],
    speeds: ["next", "standard"],
  },
  {
    name: "חיפה והצפון",
    cities: ["חיפה", "קריות", "נשר", "טירת כרמל", "עכו", "נהריה", "כרמיאל"],
    speeds: ["next", "standard"],
  },
  {
    name: "דרום",
    cities: ["באר שבע", "אשקלון", "קרית גת", "אילת", "דימונה"],
    speeds: ["standard"],
  },
];

export function findZone(query: string): Zone | null {
  const q = query.trim();
  if (!q) return null;
  return (
    deliveryZones.find((z) =>
      z.cities.some((c) => c.includes(q) || q.includes(c)),
    ) ?? null
  );
}

export function speedById(id: string): DeliverySpeed | undefined {
  return deliverySpeeds.find((s) => s.id === id);
}
