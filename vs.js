// ✅ Firebase Config & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyAN24hdknDVkWre4or_UvLYvDlV_kb1byM",
  authDomain: "virtual-assistant-1ad6b.firebaseapp.com",
  projectId: "virtual-assistant-1ad6b",
  storageBucket: "virtual-assistant-1ad6b.appspot.com",
  messagingSenderId: "761160254820",
  appId: "1:761160254820:web:22c6de4605150a12616671",
  measurementId: "G-C6L1VT0VS1"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ✅ DOM Elements
let btn = document.querySelector("#btn");
let content = document.querySelector("#content");
let voice = document.querySelector("#voice");
let historyContainer = document.querySelector("#historyContainer");

// ✅ Speak Function
function speak(text) {
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

// ✅ Time-Based Greeting
function wishMe() {
  let hours = new Date().getHours();
  let greeting = hours < 12 ? "Good Morning" : hours < 16 ? "Good Afternoon" : "Good Evening";
  speak(greeting);
}
window.addEventListener('load', wishMe);

// ✅ Save Commands
function saveCommand(command) {
  db.collection("commands").add({
    command: command,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    console.log("✅ Command stored:", command);
  }).catch((error) => {
    console.error("❌ Error storing command:", error);
  });
}

// ✅ Load Command History with Search/Date Filter
function loadHistory() {
  db.collection("commands")
    .orderBy("timestamp", "desc")
    .limit(100)
    .onSnapshot(snapshot => {
      const searchValue = document.querySelector("#searchInput")?.value.toLowerCase() || "";
      const selectedDate = document.querySelector("#dateInput")?.value || "";
      historyContainer.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const time = data.timestamp?.toDate();
        const timeString = time?.toLocaleString() || "Unknown";
        const command = data.command.toLowerCase();

        let show = true;

        if (searchValue && !command.includes(searchValue)) show = false;
        if (selectedDate && time) {
          const cmdDate = time.toISOString().split('T')[0];
          if (cmdDate !== selectedDate) show = false;
        }

        if (show) {
          historyContainer.innerHTML += `
            <div class="command-entry">
              <strong>${data.command}</strong><br />
              <time>${timeString}</time>
            </div>
          `;
        }
      });
    });
}
window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  document.querySelector("#searchInput").addEventListener("input", loadHistory);
  document.querySelector("#dateInput").addEventListener("change", loadHistory);
});

// ✅ Speech Recognition
if ('webkitSpeechRecognition' in window) {
  let recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => console.log("🎤 Listening...");

  recognition.onresult = (event) => {
    let transcript = event.results[0][0].transcript.toLowerCase();
    content.innerText = transcript;
    takeCommand(transcript);
    saveCommand(transcript);
  };

  btn.addEventListener("click", () => {
    recognition.start();
    btn.style.display = "none";
    voice.style.display = "block";
  });
} else {
  console.log("❌ Speech Recognition not supported.");
}

// ✅ Take Commands
function takeCommand(message) {
  btn.style.display = "flex";
  voice.style.display = "none";

  if (message.includes("hello") || message.includes("hey")) {
    speak("Hello! What can I help you with?");
  } else if (message.includes("who are you")) {
    speak("I am Chitti, created by Debabrata Sir and Kaushik Sir.");
  } else if (message.includes("open youtube")) {
    openWebsite("https://www.youtube.com", "Opening YouTube", message);
  } else if (message.includes("open facebook")) {
    openWebsite("https://www.facebook.com", "Opening Facebook", message);
  } else if (message.includes("open instagram")) {
    openWebsite("https://www.instagram.com", "Opening Instagram", message);
  } else if (message.includes("open whatsapp")) {
    openWebsite("whatsapp://", "Opening WhatsApp", message);
  } else if (message.includes("open chrome")) {
    openApplication("chrome", "Opening Google Chrome", message);
  } else if (message.includes("open edge")) {
    openApplication("microsoft-edge", "Opening Microsoft Edge", message);
  } else if (message.includes("open calculator")) {
    openApplication("calc", "Opening Calculator", message);
  } else if (message.includes("time")) {
    let time = new Date().toLocaleTimeString();
    speak(`The current time is ${time}`);
    saveCommand(`User asked time: ${time}`);
  } else if (message.includes("date")) {
    let date = new Date().toLocaleDateString();
    speak(`Today's date is ${date}`);
    saveCommand(`User asked date: ${date}`);
  } else if (message.includes("day")) {
    let day = new Date().toLocaleDateString(undefined, { weekday: "long" });
    speak(`Today is ${day}`);
    saveCommand(`User asked day: ${day}`);
  } else {
    speak(`Here is what I found about ${message}`);
    openWebsite(`https://www.google.com/search?q=${message}`, `Searching Google for ${message}`, message);
  }
}

// ✅ Open Website
function openWebsite(url, speechText, command) {
  speak(speechText);
  saveCommand(command);
  let newWindow = window.open(url, "_blank");
  if (!newWindow) alert("⚠️ Pop-up blocked! Please allow pop-ups and try again.");
}

// ✅ Open App
function openApplication(appName, speechText, command) {
  speak(speechText);
  saveCommand(command);
  try {
    window.location.href = appName + "://";
  } catch (error) {
    console.error(`❌ Failed to open ${appName}:`, error);
    speak(`Sorry, I couldn't open ${appName}.`);
  }
}
