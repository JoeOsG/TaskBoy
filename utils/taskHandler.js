// index.js (or utils/taskHandler.js)
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid"); // For generating unique task IDs

const tasksFilePath = path.resolve(__dirname, "tasks.json");

// Function to read tasks from the JSON file
async function loadTasks() {
    try {
        const data = await fs.readFile(tasksFilePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            // File not found, return empty object (first run)
            console.log("tasks.json not found, creating an empty one.");
            await fs.writeFile(tasksFilePath, JSON.stringify({}), "utf8");
            return {};
        }
        console.error("Error loading tasks:", error);
        return {}; // Return empty object on other errors to prevent bot crash
    }
}


// Function to write tasks to the JSON file
async function saveTasks(tasks) {
    try {
        await fs.writeFile(tasksFilePath, JSON.stringify(tasks, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving tasks:", error);
    }
}


// Initialize tasks in memory
let userTasks = {};

// Load tasks when the bot starts
async function initializeTasks() {
    userTasks = await loadTasks();
    console.log("Tasks loaded successfully.");
}

// Export functions for use in your main bot file
module.exports = {
    initializeTasks,
    getUserTasks: (userId) => userTasks[userId] || [],
    addTask: async (userId, description) => {
        if (!userTasks[userId]) {
            userTasks[userId] = [];
        }
        const newTask = {
            id: uuidv4().slice(0, 8), // Use a shorter UUID for easier input
            description,
            completed: false,
            timestamp: new Date().toISOString(),
        };
        userTasks[userId].push(newTask);
        await saveTasks(userTasks);
        return newTask;
    },
    markTaskDone: async (userId, taskId) => {
        if (!userTasks[userId]) return null;

        const task = userTasks[userId].find(
            (t) => t.id === taskId && !t.completed
        );
        if (task) {
            task.completed = true;
            await saveTasks(userTasks);
            return task;
        }
        return null; // Task not found or already completed
    },
    // We'll add a function to find tasks by index for !done 1 later
    getTaskByIndex: (userId, index) => {
        if (!userTasks[userId] || index < 1) return null;
        const incompleteTasks = userTasks[userId].filter((t) => !t.completed);
        return incompleteTasks[index - 1] || null;
    },
};