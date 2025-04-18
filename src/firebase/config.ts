import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAIKt4hHMA7mjkLcC7VK7X1PXPAawfbIqk",
  authDomain: "gogodoz.firebaseapp.com",
  projectId: "gogodoz",
  storageBucket: "gogodoz.firebasestorage.app",
  messagingSenderId: "980272476745",
  appId: "1:980272476745:web:da78b87457e4d48ed48598",
  databaseURL: "https://gogodoz-default-rtdb.firebaseio.com/",
  measurementId: "G-8BZ5NMNJ7L"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const database: Database = getDatabase(app);

// Set persistence to local storage
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set successfully
  })
  .catch((error) => {
    console.error("Error setting Firebase Auth persistence:", error);
  });

export { app, auth, database };