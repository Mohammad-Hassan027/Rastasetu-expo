import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD2OUk5HqDlkeXBLUiocbDTf4OGrxrteTM",
  authDomain: "rastasetu.firebaseapp.com",
  projectId: "rastasetu",
  storageBucket: "rastasetu.firebasestorage.app",
  messagingSenderId: "418007313547",
  appId: "1:418007313547:web:a76abc58cc7d09f030788e",
  measurementId: "G-G6RRPQ5LKM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;

// apiKey: "AIzaSyD2OUk5HqDlkeXBLUiocbDTf4OGrxrteTM",
//   authDomain: "rastasetu.firebaseapp.com",
//   projectId: "rastasetu",
//   storageBucket: "rastasetu.firebasestorage.app",
//   messagingSenderId: "418007313547",
//   appId: "1:418007313547:web:a76abc58cc7d09f030788e",
//   measurementId: "G-G6RRPQ5LKM"
