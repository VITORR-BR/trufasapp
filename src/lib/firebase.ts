import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhYDQDazWZ3O7xV_VcXh3i8t4DYizQPcE",
  authDomain: "fiado-d4214.firebaseapp.com",
  projectId: "fiado-d4214",
  storageBucket: "fiado-d4214.appspot.com",
  messagingSenderId: "200757798377",
  appId: "1:200757798377:web:82e605d3e3198baafa9778"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
