import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - Hidden in RN type definitions
  browserLocalPersistence,
  // @ts-ignore - Hidden in Web type definitions
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD2OUk5HqDlkeXBLUiocbDTf4OGrxrteTM",
  authDomain: "rastasetu.firebaseapp.com",
  projectId: "rastasetu",
  storageBucket: "rastasetu.firebasestorage.app",
  messagingSenderId: "418007313547",
  appId: "1:418007313547:web:a76abc58cc7d09f030788e",
  measurementId: "G-G6RRPQ5LKM",
};

const app = initializeApp(firebaseConfig);

// Select persistence based on platform
const persistence =
  Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);

export const auth = initializeAuth(app, {
  persistence: persistence,
});

export default app;
