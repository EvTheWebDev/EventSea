// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { updateEmail } from "firebase/auth";
import { updateProfile } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
} from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA04n74SGTp7dKqXFl6Udy3ryfDx1uX2b8",
  authDomain: "eventsea-12963.firebaseapp.com",
  projectId: "eventsea-12963",
  storageBucket: "eventsea-12963.firebasestorage.app",
  messagingSenderId: "869381378518",
  appId: "1:869381378518:web:e4b99830faaa5922b8d477",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, app };

/**
 * Get a user's profile document from Firestore.
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Update a user's profile (first/last name) in Auth and Firestore.
 * @param {string} uid
 * @param {string} firstName
 * @param {string} lastName
 */
export async function changeUserProfile(uid, firstName, lastName) {
  // Update Firebase Auth displayName if current user matches
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
    } catch (err) {
      console.warn("Failed to update auth profile:", err);
    }
  }

  // Update Firestore user doc
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      firstName: firstName || null,
      lastName: lastName || null,
      profileUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    // if doc doesn't exist, create it
    await setDoc(userRef, {
      firstName: firstName || null,
      lastName: lastName || null,
      profileUpdatedAt: serverTimestamp(),
    });
  }
}

/**
 * Change the authenticated user's email (Auth + Firestore sync).
 * @param {string} newEmail
 * @returns {Promise<void>}
 */
export async function changeUserEmail(newEmail) {
  if (!auth.currentUser) throw new Error("No authenticated user");
  // Update Auth email
  await updateEmail(auth.currentUser, newEmail);
  // Update Firestore user doc if exists
  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      email: newEmail,
      profileUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    // ignore Firestore update failures (auth changed)
    console.warn("Failed to update user email in Firestore:", err);
  }
}

/**
 * Sign up a new user using email/password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
/**
 * Sign up a new user using email/password and save profile data.
 * @param {string} email
 * @param {string} password
 * @param {string} [firstName]
 * @param {string} [lastName]
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function signUp(email, password, firstName = "", lastName = "") {
  // create the user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // update the Firebase user profile displayName
  try {
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`.trim(),
    });
  } catch (err) {
    // non-fatal: profile update failed, but user account exists
    console.warn("Failed to update user profile:", err);
  }

  // persist user profile in Firestore for later use
  try {
    await setDoc(doc(db, "users", userCredential.user.uid), {
      firstName: firstName || null,
      lastName: lastName || null,
      email: userCredential.user.email || null,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to write user document:", err);
  }

  return userCredential;
}

/**
 * Log in user with email/password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function logIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential;
}

export async function logOut() {
  await signOut(auth);
}

/**
 * Convert File to base64 data URL.
 * @param {File} file
 * @returns {Promise<string>} base64 data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // result is a data URL like "data:image/jpeg;base64,..."
      resolve(/** @type {string} */ (result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a profile picture for the user (stored as base64 in Firestore).
 * @param {string} uid
 * @param {File} file
 * @returns {Promise<string>} data URL for immediate display
 */
export async function uploadProfilePicture(uid, file) {
  // Convert file to base64
  const base64 = await fileToBase64(file);

  // Store in Firestore user document
  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      profilePicture: base64,
      profilePictureUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    // If user doc doesn't exist, create it
    await setDoc(userRef, {
      profilePicture: base64,
      profilePictureUpdatedAt: serverTimestamp(),
    });
  }

  // Return the data URL for immediate display
  return base64;
}

/**
 * Fetch user's profile picture from Firestore.
 * @param {string} uid
 * @returns {Promise<string|null>} data URL or null if not found
 */
export async function getProfilePicture(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    return data?.profilePicture || null;
  } catch (err) {
    return null;
  }
}

/**
 * Subscribe to auth state changes.
 * @param {(user: import("firebase/auth").User|null) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateListener(cb) {
  return onAuthStateChanged(auth, cb);
}
