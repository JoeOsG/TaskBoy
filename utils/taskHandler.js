// utils/taskHandler.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid'; // For generating unique task IDs

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tasksFilePath = path.resolve(__dirname, "./tasks.json");

// Function to read tasks from the JSON file
const loadTasks = function () {
    try {
        const data = fs.readFileSync(tasksFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            // File not found, return empty object (first run)
            console.log("tasks.json not found, creating an empty one.");
            fs.writeFileSync(tasksFilePath, JSON.stringify({}), "utf8");
            return {};
        }
        console.error("Error loading tasks:", error);
        return {}; // Return empty object on other errors to prevent bot crash
    }
}

// Function to write tasks to the JSON file
function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving tasks:", error);
    }
}

// Initialize tasks in memory
let userTasks = {};

// Load tasks when the bot starts
const initializeTasks = async () => {
    userTasks = await loadTasks();
    console.log("Tasks loaded successfully.");
}

// Export functions for use in your main bot file
const tasks = {
    initializeTasks,
    getUserData: (userId) => userTasks[userId],
    getUserTasks: (userId) => userTasks[userId] || [],
    addTask: async (userId, description) => {
        if (!userTasks[userId]) {
            userTasks[userId] = [];
        }
        const nextNumber = userTasks[userId].length > 0
            ? Math.max(...userTasks[userId].map(t => t.number || 0)) + 1
            : 1;

        const newTask = {
            id: uuidv4().slice(0, 8), // Use a shorter UUID for easier input
            number: nextNumber,
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
    getTaskByNumber: (userId, number) => {
        if (!userTasks[userId]) return null;
        return userTasks[userId].find((t) => t.number === number && !t.completed) || null;
    },
};

export default tasks;