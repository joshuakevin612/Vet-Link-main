// =====================================================================
// VET LINK — auth.js
// Email/password auth with mandatory email verification.
//
// The rule enforced here and in firestore.rules:
//   signed in            -> can edit their own owner profile, nothing else
//   signed in + verified -> can create, read and edit their own pets
// =====================================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { auth, db, OWNERS } from "./firebase-config.js";

export { auth, db };

// ---------------------------------------------------------------------
// Sign up
// Creates the account, stores the owner profile, sends the verification
// email, then signs the user out again — an unverified session has no
// use in this app and leaving it open invites confusion.
// ---------------------------------------------------------------------
export async function signUp({ name, email, phone, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (name) {
    await updateProfile(user, { displayName: name });
  }

  await setDoc(doc(db, OWNERS, user.uid), {
    name: name || "",
    email: user.email,
    phone: phone || "",
    createdAt: serverTimestamp()
  });

  await sendEmailVerification(user, { url: verifyRedirectUrl() });
  await signOut(auth);

  return { email: user.email };
}

// ---------------------------------------------------------------------
// Log in
// Refuses to hand back a session for an unverified address. The thrown
// error carries code "auth/email-not-verified" so the page can offer to
// resend the email.
// ---------------------------------------------------------------------
export async function logIn({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await cred.user.reload();

  if (!cred.user.emailVerified) {
    await sendEmailVerification(cred.user, { url: verifyRedirectUrl() });
    await signOut(auth);
    const err = new Error("Email not verified");
    err.code = "auth/email-not-verified";
    throw err;
  }
  return cred.user;
}

export async function resendVerification({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user, { url: verifyRedirectUrl() });
  await signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function logOut() {
  return signOut(auth);
}

// ---------------------------------------------------------------------
// Route guard
// Call at the top of any owner-only page. Resolves with a verified user
// or sends the visitor to log in. Also re-checks emailVerified against
// the server, because the cached token goes stale after the user clicks
// the link in their inbox.
// ---------------------------------------------------------------------
export function requireVerifiedUser({ redirect = "login.html" } = {}) {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, async (user) => {
      stop();
      if (!user) {
        window.location.replace(`${redirect}?next=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      await user.reload();
      if (!user.emailVerified) {
        // Force a token refresh — the email_verified claim the security
        // rules read only updates on a new ID token.
        await user.getIdToken(true);
      }
      if (!user.emailVerified) {
        window.location.replace(`${redirect}?verify=1`);
        return;
      }
      await user.getIdToken(true);
      resolve(user);
    });
  });
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getOwnerProfile(uid) {
  const snap = await getDoc(doc(db, OWNERS, uid));
  return snap.exists() ? snap.data() : null;
}

// ---------------------------------------------------------------------
// Navigation
// Swaps "Log in / Sign up" for "Dashboard / Log out" once a verified
// session exists. Markup contract:
//   <div data-nav-auth>  ... links shown while signed out
//   <div data-nav-user>  ... links shown while signed in
//   <span data-nav-email></span>
//   <button data-logout>
// ---------------------------------------------------------------------
export function wireNav() {
  const signedOut = document.querySelectorAll("[data-nav-auth]");
  const signedIn = document.querySelectorAll("[data-nav-user]");
  const emailSlots = document.querySelectorAll("[data-nav-email]");

  const show = (nodes, on) =>
    nodes.forEach((n) => { n.style.display = on ? "" : "none"; });

  show(signedOut, false);
  show(signedIn, false);

  watchAuth((user) => {
    const active = !!user && user.emailVerified;
    show(signedOut, !active);
    show(signedIn, active);
    emailSlots.forEach((n) => { n.textContent = active ? user.email : ""; });
  });

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logOut();
      window.location.href = "index.html";
    });
  });
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function verifyRedirectUrl() {
  return window.location.origin +
    window.location.pathname.replace(/[^/]*$/, "") + "login.html";
}

const MESSAGES = {
  "auth/email-already-in-use": "That email already has an account. Log in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/weak-password": "Use at least 6 characters for the password.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account with that email.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "Can't reach Firebase. Check the connection.",
  "auth/email-not-verified": "Verify your email first — we've sent a fresh link.",
  "permission-denied": "Your account isn't allowed to do that."
};

export function authErrorMessage(err) {
  return MESSAGES[err?.code] || err?.message || "Something went wrong.";
}
