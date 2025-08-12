import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClk297fXBwIqOBmUYqkb_9n6K_i_yvtWw",
  authDomain: "t4-pbl-db.firebaseapp.com",
  databaseURL: "https://t4-pbl-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "t4-pbl-db",
  storageBucket: "t4-pbl-db.firebasestorage.app",
  messagingSenderId: "653930191392",
  appId: "1:653930191392:web:d93ebb18ae14174de73a45",
  measurementId: "G-LPW3QJ5CXN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);
