import { AllowlistedApp } from "@/types/capture";

// Package names verified against each app's live Google Play Store listing
// (2026-08-10). Android has no policy-safe way to enumerate all installed
// apps for a picker (that needs the QUERY_ALL_PACKAGES permission, which
// Play review scrutinizes heavily for an app that isn't primarily a
// launcher/backup/antivirus tool — 2026-08-10 decision, see PLAN.md §7), so
// this curated list plus a manual "add by package name" field is the
// allowlist UI instead.
// Card-network authorisation alerts ("Purchase at X for LKR Y ... authorised
// on your debit card") are typically relayed as an SMS, delivered through
// the phone's default Messages app — not the bank's own app — so these two
// (by far the most common on Android in Sri Lanka; Samsung phones are
// increasingly defaulting to Google Messages too) are listed alongside the
// banking apps rather than assuming the bank app alone covers everything.
// Any other OEM's SMS app (or a carrier-branded one) can still be added
// manually below.
export const KNOWN_CAPTURE_APPS: AllowlistedApp[] = [
  { packageName: "com.google.android.apps.messaging", label: "Messages (Google)" },
  { packageName: "com.samsung.android.messaging", label: "Messages (Samsung)" },
  { packageName: "combank.com.combankdigital", label: "ComBank Digital" },
  { packageName: "com.hnb.DigitalApp", label: "HNB Digital Banking" },
  { packageName: "lk.sampath.sampathvishwa", label: "Sampath Vishwa Retail" },
  { packageName: "lk.sampath.iwallet", label: "Sampath Wepay" },
  { packageName: "com.ofss.fcdb.mobile.android.phone.boc.launcher", label: "Bank of Ceylon Mobile Banking" },
  { packageName: "com.ndb.mobilebanking", label: "NDB Neos" },
  { packageName: "com.pickme.passenger", label: "PickMe" },
  { packageName: "com.ubercab", label: "Uber" },
];

// Watching one of these means SnapBudget reads the text of every SMS
// received, not just bank ones — used to show an extra disclosure in the
// allowlist picker rather than treating it as just another chip.
export const MESSAGING_APP_PACKAGES = new Set([
  "com.google.android.apps.messaging",
  "com.samsung.android.messaging",
]);
