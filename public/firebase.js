// firebase.js

// Esses scripts precisam estar na princp.html ANTES de firebase.js e app.js:
//
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "db-frfinance.firebaseapp.com",
  projectId: "db-frfinance",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
