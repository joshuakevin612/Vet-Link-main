// =====================================================================
// VET LINK — shared Firebase setup
// Every page imports from here so there is exactly one config to change.
// Firebase v10 modular SDK, loaded straight from the CDN (no build step).
// =====================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDm1Uk3CMwTN3U8T671lNB2K6a9AbYfCV4",
  authDomain: "vet-link-e520b.firebaseapp.com",
  projectId: "vet-link-e520b",
  storageBucket: "vet-link-e520b.firebasestorage.app",
  messagingSenderId: "103463753923",
  appId: "1:103463753923:web:12120be1419ff0b8b7aa76",
  measurementId: "G-B4XK19EMRL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Collections
export const PETS = "pets";              // full record, owner-only
export const PUBLIC_TAGS = "publicTags"; // emergency-only projection, world-readable
export const OWNERS = "owners";          // owner profile
export const SCANS = "scans";            // subcollection of pets/{petId}

// Where a scanned QR code points. Change this if you host under a subpath.
export function publicProfileUrl(petId) {
  const base = window.location.origin +
    window.location.pathname.replace(/[^/]*$/, "");
  return `${base}pet-profile.html?pet=${encodeURIComponent(petId)}`;
}
