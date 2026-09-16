// =====================================================================
// VET LINK — shared Firebase setup
// Every page imports from here so there is exactly one config to change.
// Firebase v10 modular SDK, loaded straight from the CDN (no build step).
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCYqnAwl_MaSA7qv3FkCUa9-VUN_OhJwjc",
  authDomain: "vetlink-b046b.firebaseapp.com",
  projectId: "vetlink-b046b",
  storageBucket: "vetlink-b046b.firebasestorage.app",
  messagingSenderId: "601192030186",
  appId: "1:601192030186:web:704cceb573449670691c93"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collections
export const PETS = "pets";              // full record, owner-only
export const PUBLIC_TAGS = "publicTags"; // emergency-only projection, world-readable
export const OWNERS = "owners";          // owner profile
export const SCANS = "scans";            // subcollection of pets/{petId}

// ---------------------------------------------------------------------
// EmailJS — sends the "your tag was scanned" alert straight from the
// browser, no server needed. Fill these in from your EmailJS dashboard
// (emailjs.com → Email Services / Email Templates / Account → API Keys).
// Leave PUBLIC_KEY empty to disable the alert without touching page code.
// ---------------------------------------------------------------------
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: "",     // Account → General → Public Key
  SERVICE_ID: "",     // Email Services → your service's ID
  TEMPLATE_ID: ""     // Email Templates → your template's ID
};

// A new random token per tag. Regenerating it (dashboard "Regenerate QR")
// invalidates every previously printed sticker for that pet instantly,
// even though the pet's record and petId stay the same.
export function newQrToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

// Where a scanned QR code points. Change this if you host under a subpath.
// `token` must match the pet's current qrToken or the public page treats
// the tag as inactive — that's what makes "Regenerate QR" actually void
// the old sticker instead of just relabeling the same live link.
export function publicProfileUrl(petId, token) {
  const base = window.location.origin +
    window.location.pathname.replace(/[^/]*$/, "");
  const t = token ? `&t=${encodeURIComponent(token)}` : "";
  return `${base}pet-profile.html?pet=${encodeURIComponent(petId)}${t}`;
}
