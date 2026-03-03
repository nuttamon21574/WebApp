// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyCbQG4CcAPCHQM8gNtX6OVGdVbYqRvknxs",
  authDomain: "webapp-e03b3.firebaseapp.com",
  projectId: "webapp-e03b3",
  storageBucket: "webapp-e03b3.firebasestorage.app",
  messagingSenderId: "457430839956",
  appId: "1:457430839956:web:352b9f3a5049bda364ba81",
  measurementId: "G-86W2YZNY8W"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const db = getFirestore(app);
