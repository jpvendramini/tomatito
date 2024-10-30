document.getElementById("add-task-button").addEventListener("click", addOrUpdateTask);
document.getElementById("copy-button").addEventListener("click", copyActivitiesToClipboard);

let editingTaskId = null;
let activeTimer = {};

const playIconPath = "../icons/play-button.svg";
const pauseIconPath = "../icons/pause.svg";
const editIconPath = "../icons/edit.svg";
const trashIconPath = "../icons/trash.svg";

function addOrUpdateTask() {
    const inputValue = document.getElementById("register-activity-input").value;
    if (!inputValue.trim()) return;

   
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) {
        tasks = [];
    }

    if (editingTaskId) {
        tasks = tasks.map(task => {
            if (task.id === editingTaskId) {
                return { ...task, title: inputValue };
            }
            return task;
        });
        editingTaskId = null;
    } else {
        let task = {
            id: tasks.length + 1,
            title: inputValue,
            startDate: null,
            endDate: null,
            elapsedTime: 0
        };
        tasks.push(task);
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    displayTasks();
    document.getElementById("register-activity-input").value = "";
}

function displayTasks() {
    const tasksContainer = document.getElementById("activities");
    tasksContainer.innerHTML = "";

    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) {
        tasks = [];
    }
    
    tasks.forEach(task => {
       
        const taskElement = document.createElement("div");
        taskElement.classList.add("activity");
        taskElement.setAttribute("data-task-id", task.id);

        const playPauseIcon = task.startDate && !task.endDate ? pauseIconPath : playIconPath;

        taskElement.innerHTML = `
            <span style="flex: .5;"><img src="${playPauseIcon}" class="icon-button play-button" alt="Play/Pause" width="24" height="24"></span>
            <span style="flex: 3;" title="${task.title}">${task.title}</span>
            <span style="flex: 1;" class="task-timer">${formatTime(task.elapsedTime)}</span>
            <span style="display: flex; gap: 0.5rem; justify-content: end; flex: 0.8;">
                <img src="${editIconPath}" class="icon-button edit-button" alt="Edit" width="24" height="24">
                <img src="${trashIconPath}" class="icon-button delete-button" alt="Delete" width="24" height="24">
            </span>`;
       
        taskElement.querySelector(".delete-button").addEventListener("click", () => {
            deleteTask(task.id);
            calculateTotalTime();
        });
        taskElement.querySelector(".edit-button").addEventListener("click", () => editTask(task.id));
        taskElement.querySelector(".play-button").addEventListener("click", () => {
            togglePlay(task.id);
            calculateTotalTime();
        });

        tasksContainer.appendChild(taskElement);
       
        if (task.startDate && !task.endDate) {
            startTimer(task.id);
        }
    });

    calculateTotalTime();
}

function copyActivitiesToClipboard() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) {
        tasks = [];
    }

    const formattedTasks = tasks.map(task => `${task.title}, ${formatTime(task.elapsedTime)}`).join("\n");

    navigator.clipboard.writeText(formattedTasks).then(() => {
        alert("Atividades copiadas com sucesso!");
    }).catch(err => {
        console.error("Erro ao copiar as atividades: ", err);
    });
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function togglePlay(taskId) {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) return;

    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    if (task.startDate && !task.endDate) {
        task.endDate = new Date();
        task.elapsedTime += new Date() - new Date(task.startDate);
        stopTimer(taskId);
    } else {
        task.startDate = new Date();
        task.endDate = null;
        startTimer(taskId);
    }

    localStorage.setItem("tasks", JSON.stringify(tasks));
    displayTasks();
}

function startTimer(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    const timerDisplay = taskElement.querySelector(".task-timer");

    let tasks = JSON.parse(localStorage.getItem("tasks"));
    const task = tasks.find(task => task.id === taskId);

    activeTimer[taskId] = setInterval(() => {
        const currentTime = new Date() - new Date(task.startDate);
        const totalElapsedTime = task.elapsedTime + currentTime;
        timerDisplay.textContent = formatTime(totalElapsedTime);
    }, 1000);
}

function stopTimer(taskId) {
    clearInterval(activeTimer[taskId]);
    delete activeTimer[taskId];
}

function deleteTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) return;

    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem("tasks", JSON.stringify(tasks));
   
    stopTimer(taskId);
   
    displayTasks();
}

function editTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) return;

    const taskToEdit = tasks.find(task => task.id === taskId);
    if (taskToEdit) {
        document.getElementById("register-activity-input").value = taskToEdit.title;
        editingTaskId = taskId;
    }
}

function calculateTotalTime() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(tasks)) {
        tasks = [];
    }

    const totalTime = tasks.reduce((sum, task) => {
        if (task.startDate && !task.endDate) {
            return sum + task.elapsedTime + (new Date() - new Date(task.startDate));
        }
        return sum + task.elapsedTime;
    }, 0);

   
    const totalTimeElement = document.querySelector("#header p span");
    totalTimeElement.textContent = formatTime(totalTime);
}

window.addEventListener("load", displayTasks);

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
        Object.keys(activeTimer).forEach(taskId => stopTimer(taskId));
    } else if (document.visibilityState === "visible") {
       
        let tasks = JSON.parse(localStorage.getItem("tasks"));
        if (!Array.isArray(tasks)) return;

        tasks.forEach(task => {
            if (task.startDate && !task.endDate) {
                startTimer(task.id);
            }
        });
    }
});
