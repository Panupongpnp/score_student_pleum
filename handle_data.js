import { db } from "./database.js";
import { doc, setDoc, updateDoc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

let collectionName = getCollectionFromURL();

// Initialize students data
let students = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `นักเรียน ${i + 1}` }));

// Load score datas
let scores = {};
// Set previous scores to empty
let previousScores = {};

// Set score on page to 0
students.forEach(student => scores[student.id] ??= 0);

updateTable();

// Fetch data from Firestore
getDataFromDB().then((data) => {
    data.forEach(({ name, id, score }) => {
        if (students[id-1] !== undefined) {
            students[id-1].name = name;
        }

        if (scores[id] !== undefined) {
            scores[id] = score;
        } 
    });
    updateTable();
});

function updateTable() {
    let table = document.getElementById("scoreTable");
    table.innerHTML = "";
    students.forEach(student => {
        let row = table.insertRow();
        row.insertCell(0).innerText = student.id;
        
        let nameCell = row.insertCell(1);
        let nameInput = document.createElement("span");
        nameInput.contentEditable = "true";
        nameInput.classList.add("editable");
        nameInput.innerText = student.name;
        nameInput.onblur = () => updateStudentName(student.id, nameInput.innerText);
        nameCell.appendChild(nameInput);
        
        let prevScoreCell = row.insertCell(2);
        prevScoreCell.innerText = previousScores[student.id]?.toFixed(1) || "-";

        let inputCell = row.insertCell(3);
        let input = document.createElement("input");
        input.type = "number";
        input.step = "0.1";
        input.placeholder = "0.0";
        inputCell.appendChild(input);

        let scoreCell = row.insertCell(4);
        scoreCell.innerText = scores[student.id].toFixed(1);
        
        let actionCell = row.insertCell(5);
        actionCell.classList.add("btn-container");
        
        let confirmBtn = document.createElement("button");
        confirmBtn.innerText = "ยืนยัน";
        confirmBtn.classList.add("btn-confirm");
        confirmBtn.onclick = () => {
            addScore(student, parseFloat(input.value) || 0);
            input.value = "";
        };
        actionCell.appendChild(confirmBtn);

        let undoBtn = document.createElement("button");
        undoBtn.innerText = "Undo";
        undoBtn.classList.add("btn-undo");
        undoBtn.onclick = () => undoScore(student.id);
        actionCell.appendChild(undoBtn);
        
        let resetBtn = document.createElement("button");
        resetBtn.innerText = "รีเซ็ต";
        resetBtn.classList.add("btn-reset");
        resetBtn.onclick = () => resetScore(student.id);
        actionCell.appendChild(resetBtn);

        // เพิ่มเหตุการณ์สำหรับการกด Enter
        input.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                confirmBtn.click();  // ทำการกดปุ่มยืนยัน
                event.preventDefault();  // ห้ามการกระทำปกติของ Enter (ไม่ให้ form submit ถ้ามี)
            }
        });
    });
}

// Methods to manage database
// Set/Update data to Firestore
async function saveDataToDB(studentId, data) {
    const docRef = doc(db, collectionName, studentId.toString());

    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            await updateDoc(docRef, data);
            console.log(`Updated student ${studentId}:`, data);
        } else {
            await setDoc(docRef, data);
            console.log(`Created new entry for student ${studentId}:`, data);
        }
    } catch (error) {
        console.error("Error saving document:", error);
    }
}

// Get data from Firestore
async function getDataFromDB() {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        
        if (querySnapshot.empty) {
            console.warn("No data found in Firestore.");
        }

        const data = querySnapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() }));
        console.log("Fetched data:", data);
        
        return data;
    } catch (error) {
        console.error("Error fetching data from Firestore:", error);
    }
}

    // Methods to manage score
function addScore(student, score) {
    const id = student.id;
    previousScores[id] = scores[id];
    scores[id] = parseFloat((scores[id] + score).toFixed(1));

    // Format data
    const data = {
        "name": student.name,
        "id": student.id,
        "score": scores[id],
        "timestamp": getTime()
    }

    saveDataToDB(id, data);
    updateTable();
}

function undoScore(id) {
    if (previousScores[id] !== undefined) {
        scores[id] = previousScores[id];

        // Format data
        const data = {
            "score": scores[id],
            "timestamp": getTime()
        }

        saveDataToDB(id, data);
        updateTable();
    }
}

function resetScore(id) {
    if (confirm("แน่ใจหรือไม่ว่าต้องการรีเซ็ตคะแนนของนักเรียนนี้?")) {
        if (scores[id] === 0 || !scores.hasOwnProperty(id)) {
            return;
        }

        previousScores[id] = scores[id];
        scores[id] = 0;

        // Format data
        const data = {
            "score": scores[id],
            "timestamp": getTime()
        }

        saveDataToDB(id, data);
        updateTable();
    }
}

function resetAllScores() {
    if (confirm("แน่ใจหรือไม่ว่าต้องการรีเซ็ตคะแนนทั้งหมด?")) {
        students.forEach(student => {
            if (scores[student.id] === 0 || !scores.hasOwnProperty(student.id)) {
                return;
            }

            previousScores[student.id] = scores[student.id];
            scores[student.id] = 0;

            // Format data
            const data = {
                "score": 0,
                "timestamp": getTime()
            }

            saveDataToDB(student.id, data);
        });
        updateTable();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("fullResetBtn").addEventListener("click", resetAllScores);
});

function updateStudentName(id, newName) {
    students.find(s => s.id === id).name = newName;
    // Format data
    const data = {
        "name": newName
    }

    saveDataToDB(id, data);
}

function getTime() {
    // Get Thailand time
    const thailandTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        dateStyle: 'full',
        timeStyle: 'medium'
    }).format(new Date());

    return thailandTime
}

function getCollectionFromURL() {
    const match = window.location.pathname.match(/score(\d{3})\.html/);
    return match ? `Room_${match[1]}` : "defaultCollection";
}