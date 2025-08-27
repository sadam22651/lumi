// src/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyCUOFbLGDrq11gcbSc9BPXS4XY01CNxPws",
  authDomain: "logintime-cfa5f.firebaseapp.com",
  projectId: "logintime-cfa5f",
  storageBucket: "logintime-cfa5f.appspot.com",
  messagingSenderId: "1015040388826",
  appId: "1:1015040388826:web:e941858a63360f06d57fe3"
}

export const app = initializeApp(firebaseConfig) // ← ini penting ditambahkan!
export const auth = getAuth(app)
