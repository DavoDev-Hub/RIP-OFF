import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwJNuzeq7_yBbrov7q0NAgK3DmXomubW0",
  authDomain: "ripoff-438115.firebaseapp.com",
  projectId: "ripoff-438115",
  storageBucket: "ripoff-438115.appspot.com",
  messagingSenderId: "482434096393",
  appId: "1:482434096393:web:69840db8c733a74e4347d8",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
