Inserir no projeto as informações:



Nome do Projeto: gestorderotas-elismar



Firebase (

npm install firebase



// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries



// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

&#x20; apiKey: "AIzaSyDj9UpR2G8ktc3siRj7r\_nWool3QElTUOI",

&#x20; authDomain: "gestorderotas-elismar.firebaseapp.com",

&#x20; projectId: "gestorderotas-elismar",

&#x20; storageBucket: "gestorderotas-elismar.firebasestorage.app",

&#x20; messagingSenderId: "639978122524",

&#x20; appId: "1:639978122524:web:565f7e1ffbf2a10eae5ed9",

&#x20; measurementId: "G-M07TY6H92D"

};



// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);



)



Git Hub (



https://github.com/FGileade/gestorderotas-elismar.git



)



Vercel (



gestorderotas-elismar.vercel.app



)





Estruturar:

gestorderotas-elismar/

├─ public/

│  ├─ icon.png (criar o ícone da aplicação)

│

├─ src/

│  ├─ App.jsx

│  ├─ main.jsx

│  └─ index.css

├─ .gitignore

├─ index.html

├─ package.json

├─ vite.config.js

├─ vercel.json

├─ README.md

└─ manifest.webmanifest











