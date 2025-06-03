import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from 'firebase/auth';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCvDFmGZmXT4BY7FYaEmXE5RxaQ9Q3kfF0",
  authDomain: "dumpy-1b8e1.firebaseapp.com",
  projectId: "dumpy-1b8e1",
  storageBucket: "dumpy-1b8e1.firebasestorage.app",
  messagingSenderId: "403897874672",
  appId: "1:403897874672:web:7316b7cb1328b568e4aa35",
  measurementId: "G-T0YCF11BXH"
};

// Initialize Firebase
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Initialize Auth
export const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Initialize Analytics only if supported
let analytics = null;

export default app; 