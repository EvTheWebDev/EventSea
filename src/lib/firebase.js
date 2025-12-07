import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  updateDoc,
  writeBatch,
  collection,
  arrayUnion,
  documentId,
  query,
  where,
  getDocs,
  limit,
  orderBy
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA04n74SGTp7dKqXFl6Udy3ryfDx1uX2b8",
  authDomain: "eventsea-12963.firebaseapp.com",
  projectId: "eventsea-12963",
  storageBucket: "eventsea-12963.firebasestorage.app",
  messagingSenderId: "869381378518",
  appId: "1:869381378518:web:e4b99830faaa5922b8d477",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

export { auth, app };

/* ==============================
   USER PROFILE FUNCTIONS
   ============================== */

/**
 * @typedef {Object} UserProfile
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string[]} [managedOrgIDs] - Note the capital ID to match your DB
 * @property {string} [email]
 * @property {string} [profilePicture]
 */

/**
 * Get a user's profile document from Firestore.
 * @param {string} uid
 * @returns {Promise<UserProfile|null>} 
 */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  // We tell the editor "Trust me, this data matches the UserProfile shape"
  return snap.exists() ? /** @type {UserProfile} */ (snap.data()) : null;
}

/**
 * Update a user's profile (first/last name) in Auth and Firestore.
 * @param {string} uid
 * @param {string} firstName
 * @param {string} lastName
 */
export async function changeUserProfile(uid, firstName, lastName) {
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
    } catch (err) {
      console.warn("Failed to update auth profile:", err);
    }
  }

  const userRef = doc(db, "users", uid);
  try {
    await updateDoc(userRef, {
      firstName: firstName || null,
      lastName: lastName || null,
      profileUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
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

  await updateEmail(auth.currentUser, newEmail);

  try {
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, {
      email: newEmail,
      profileUpdatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Failed to update user email in Firestore:", err);
  }
}

/* ==============================
   AUTH FUNCTIONS
   ============================== */

/**
 * Sign up a new user using email/password and save profile data.
 * @param {string} email
 * @param {string} password
 * @param {string} [firstName]
 * @param {string} [lastName]
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function signUp(email, password, firstName = "", lastName = "") {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  try {
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`.trim(),
    });
  } catch (err) {
    console.warn("Failed to update user profile:", err);
  }

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
 * Subscribe to auth state changes.
 * @param {(user: import("firebase/auth").User|null) => void} cb
 * @returns {() => void} unsubscribe function
 */
export function onAuthStateListener(cb) {
  return onAuthStateChanged(auth, cb);
}

/* ==============================
   IMAGE HANDLING FUNCTIONS
   ============================== */

/**
 * Upload a profile picture for a USER.
 * Saves to 'users' collection under field 'profilePicture'.
 * @param {string} uid - The User ID.
 * @param {File} file - The image file.
 * @returns {Promise<string>} The saved Base64 string.
 */
export async function uploadProfilePicture(uid, file) {
  return saveImageToCollection("users", uid, "profilePicture", file);
}

/**
 * Fetch user's profile picture from Firestore.
 * @param {string} uid
 * @returns {Promise<string|null>} data URL or null if not found
 */
export async function getProfilePicture(uid) {
  return getImageFromCollection("users", uid, "profilePicture");
}

/**
 * Upload a profile picture/logo for an ORGANIZATION.
 * Saves to 'orgs' collection under field 'image'.
 * @param {string} orgId - The Organization ID.
 * @param {File} file - The image file.
 * @returns {Promise<string>} The saved Base64 string.
 */
export async function uploadOrgPicture(orgId, file) {
  return saveImageToCollection("orgs", orgId, "image", file);
}

/**
 * Fetch an ORGANIZATION'S profile picture/logo.
 * @param {string} orgId - The Organization ID.
 * @returns {Promise<string | null>} The Base64 string or null.
 */
export async function getOrgPicture(orgId) {
  return getImageFromCollection("orgs", orgId, "image");
}

/* ==============================
   INTERNAL HELPER FUNCTIONS
   ============================== */

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
      resolve(/** @type {string} */ (result));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a base64 image to a specific field in any Firestore collection.
 * @param {string} collectionName
 * @param {string} docId
 * @param {string} fieldName
 * @param {File} file
 * @returns {Promise<string>}
 */
async function saveImageToCollection(collectionName, docId, fieldName, file) {
  const base64 = await fileToBase64(file);
  const docRef = doc(db, collectionName, docId);

  const updateData = {
    [fieldName]: base64,
    [`${fieldName}UpdatedAt`]: serverTimestamp(),
  };

  try {
    await updateDoc(docRef, updateData);
  } catch (err) {
    await setDoc(docRef, updateData, { merge: true });
  }

  return base64;
}

/**
 * Fetches an image string from any Firestore collection.
 * @param {string} collectionName
 * @param {string} docId
 * @param {string} fieldName
 * @returns {Promise<string | null>}
 */
async function getImageFromCollection(collectionName, docId, fieldName) {
  try {
    const docRef = doc(db, collectionName, docId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    return data?.[fieldName] || null;
  } catch (err) {
    console.error(`Error fetching image from ${collectionName}:`, err);
    return null;
  }
}

/* ==============================
   ORGANIZATION MANAGEMENT
   ============================== */

/**
 * * @param {string} uid - The ID of the user creating the org.
 * @param {string} orgName - The display name of the org.
 * @param {string} orgEmail - The contact email for the org.
 * @returns {Promise<string>} The new Organization ID.
 */
export async function createOrganization(uid, orgName, orgEmail) {
  const batch = writeBatch(db);

  const newOrgRef = doc(collection(db, "orgs"));
  
  const orgData = {
    orgName: orgName,
    email: orgEmail,
    adminUid: uid, 
    createdAt: serverTimestamp(),
    image: null, 
  };

  batch.set(newOrgRef, orgData);

  const userRef = doc(db, "users", uid);
  batch.update(userRef, {
    // This allows multiple orgs!
    managedOrgIDs: arrayUnion(newOrgRef.id), 
    isOrgAdmin: true, 
  });

  await batch.commit();
  return newOrgRef.id;
}

/**
 * Checks if the current user manages organization(s).
 * @param {string} uid 
 * @returns {Promise<string[]|null>} Returns an ARRAY of Org IDs, or null.
 */
export async function checkUserAdminStatus(uid) {
  const userProfile = await getUserProfile(uid);
  
  if (userProfile && userProfile.managedOrgIDs && userProfile.managedOrgIDs.length > 0) {
    return userProfile.managedOrgIDs; 
  }
  
  

  return null;
}

/**
 * Fetch multiple organizations by their IDs.
 * @param {string[]} orgIds - Array of organization IDs.
 * @returns {Promise<Array>} Array of org objects containing { id, ...data }.
 */
export async function getOrgsByIds(orgIds) {
  if (!orgIds || orgIds.length === 0) return [];

  const orgsRef = collection(db, "orgs");
 
  const q = query(orgsRef, where(documentId(), "in", orgIds));
  
  const querySnapshot = await getDocs(q);
  const orgs = [];
  querySnapshot.forEach((doc) => {
    orgs.push({ id: doc.id, ...doc.data() });
  });
  return orgs;
}


/**
 * Fetches events based on filters.
 * @param {Object} options
 * @param {'trending' | 'org' | 'all'} [options.mode='all'] 
 * @param {string} [options.orgId] 
 * @param {string} [options.userId]
 * @param {number} [options.limitCount] 
 * @returns {Promise<Array>}
 */
export async function fetchEvents({ mode = 'all', orgId, userId, limitCount } = {}) {
  try {
    const eventsRef = collection(db, "events");
    let q;

    switch (mode) {
      case 'trending':
        q = query(
            eventsRef, 
            orderBy("createdAt", "desc"), 
            limit(limitCount || 3)
        );
        break;

      case 'org':
        if (!orgId) throw new Error("Org ID required for org fetch");
        q = query(
            eventsRef, 
            where("ORG_ID", "==", orgId), 
            orderBy("createdAt", "desc")
        );
        break;

        case 'myEvents':
        if (!userId) throw new Error("User ID required");
        q = query(eventsRef, where("rsvps", "array-contains", userId));
        break;
        
      case 'all':
      default:
        q = query(eventsRef, orderBy("DATE", "asc"));
        break;
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toMillis() : null,
      };
    });

  } catch (err) {
    console.error(`Error fetching events (${mode}):`, err);
    return [];
  }
}

/**
 * Fetches organizations based on filters.
 * @param {Object} options
 * @param {'featured' | 'all' | 'myOrgs'} [options.mode='all'] 
 * @param {string} [options.userId] 
 * @param {number} [options.limitCount] 
 * @returns {Promise<Array>}
 */
export async function fetchOrgs({ mode = 'all', userId, limitCount } = {}) {
  try {
    const orgsRef = collection(db, "orgs");
    let q;

    switch (mode) {
      case 'featured':
        // Just grab the first X orgs (or sort by 'followers' if you have an index)
        q = query(orgsRef, limit(limitCount || 3));
        break;

      case 'myOrgs':
        if (!userId) throw new Error("User ID required");
        q = query(orgsRef, where("followers", "array-contains", userId));
        break;
        
      case 'all':
      default:
        // Sort A-Z
        q = query(orgsRef, orderBy("orgName", "asc"));
        break;
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

  } catch (err) {
    console.error(`Error fetching orgs (${mode}):`, err);
    return [];
  }
}