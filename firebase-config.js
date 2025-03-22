// Configuración de Firebase
// IMPORTANTE: Debes reemplazar estos valores con los proporcionados por tu proyecto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBovjrMNVohqkvB4JHSWSRZpgDkw5_4Ffc",
    authDomain: "mi-vida-en-semanas.firebaseapp.com",
    projectId: "mi-vida-en-semanas",
    storageBucket: "mi-vida-en-semanas.firebasestorage.app",
    messagingSenderId: "394621651646",
    appId: "1:394621651646:web:6fff5542eaedabe913ecef",
    measurementId: "G-4G0CMWHRFC"
  };

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// Proveedor de autenticación de Google
const googleProvider = new firebase.auth.GoogleAuthProvider(); 