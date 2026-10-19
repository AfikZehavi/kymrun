// Business details shown on the legal pages (terms, privacy, cancellation, accessibility).
// Empty fields are simply not shown, so fill them in when you have them.
export const BUSINESS = {
  brand: "KYMRUN",
  legalName: "", // e.g. "קימרון בע״מ" or the owner's name for an עוסק מורשה
  businessId: "", // ח.פ / ע.מ
  address: "", // registered business address
  email: "service@kymrun.co.il",
  phone: "050-4001575",
  // Accessibility coordinator (רכז/ת נגישות)
  accessibilityContactName: "",
  accessibilityEmail: "service@kymrun.co.il",
  accessibilityPhone: "050-4001575",
  // Courts with exclusive jurisdiction
  courts: "בתי המשפט המוסמכים במחוז מרכז (ראשון לציון)",
  updated: "18.10.2026",
};

export const legalLinks = [
  { to: "/terms", label: "תקנון ותנאי שימוש ומכירה" },
  { to: "/cancellation", label: "ביטול עסקה" },
  { to: "/privacy", label: "מדיניות פרטיות" },
  { to: "/accessibility", label: "הצהרת נגישות" },
] as const;
