// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0JCQDUZ9slUeA3REIPN0poCuMWy55uFc",
  authDomain: "marketerraja-d4054.firebaseapp.com",
  projectId: "marketerraja-d4054",
  storageBucket: "marketerraja-d4054.firebasestorage.app",
  messagingSenderId: "1089812986562",
  appId: "1:1089812986562:web:964fbb3cda2b0ee4aad95b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, provider, db };
