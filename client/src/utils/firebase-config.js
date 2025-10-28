// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// Read values from Vite env vars when available (client/.env or Vercel build env)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey:
		import.meta.env.VITE_FIREBASE_API_KEY ||
		"AIzaSyA8Y5FS58SHN18Kt8eHHYoyB0MRx5CLytE",
	authDomain:
		import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
		"smartchild-2e350.firebaseapp.com",
	databaseURL:
		import.meta.env.VITE_FIREBASE_DATABASE_URL ||
		"https://smartchild-2e350-default-rtdb.firebaseio.com",
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartchild-2e350",
	storageBucket:
		import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
		"smartchild-2e350.firebasestorage.app",
	messagingSenderId:
		import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "683277352301",
	appId:
		import.meta.env.VITE_FIREBASE_APP_ID ||
		"1:683277352301:web:99cc889ade7915353c2e64",
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JSVT1WSGEH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
