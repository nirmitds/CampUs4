import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyCuQtqZpg4BtaO9PlWQJlpoE9MuuwfL_jI",
  authDomain:        "campus-f6661.firebaseapp.com",
  projectId:         "campus-f6661",
  storageBucket:     "campus-f6661.firebasestorage.app",
  messagingSenderId: "402973641793",
  appId:             "1:402973641793:web:64a5d7ff0fec9c2ff64ac0",
  measurementId:     "G-SR5SQ1FQSJ",
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
