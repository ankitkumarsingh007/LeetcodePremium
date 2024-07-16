// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBBuZr67qZvdfFB9oF8FImPdq5IgdR7xdI",
  authDomain: "leetcodetracker-178fe.firebaseapp.com",
  projectId: "leetcodetracker-178fe",
  storageBucket: "leetcodetracker-178fe.appspot.com",
  messagingSenderId: "152372861433",
  appId: "1:152372861433:web:3f7f15bfb054896c554528",
  measurementId: "G-X3TQK45E8Y",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
