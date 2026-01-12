// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcuh-5U8ad76CG3dDTZ8-ptLSKp6s1Uuk",
  authDomain: "debt-management-10da2.firebaseapp.com",
  projectId: "debt-management-10da2",
  storageBucket: "debt-management-10da2.firebasestorage.app",
  messagingSenderId: "676299768214",
  appId: "1:676299768214:web:4e6183e4f7e39498faddb7",
  measurementId: "G-QV8B793V8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)