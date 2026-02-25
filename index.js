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

<<<<<<< HEAD
// Function to write tasks to the JSON file
function saveTasks(tasks) {
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), "utf8");
    } catch (error) {
        console.error("Error saving tasks:", error);
=======
client.login(process.env.DISCORD_TOKEN);


client.on(Events.MessageCreate, async message => { // Added 'async' keyword here!
    if (message.author.bot) return;

    if (!message.inGuild()) return;
    // if (!ALLOWED_TEXT_CHANNELS.has(message.channel.id)) return;

    const prefix = '!';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const userId = message.author.id; // Get the ID of the user who sent the command
    const username = message.author.username;

    // --- Existing Commands ---
    // --- !task Command (Multi-task support) ---
    if (command === "tasks") {
        const fullMessage = args.join(" ");
        if (!fullMessage) {
            return message.reply("Please provide one or more task descriptions, separated by `;` or `,`.");
        }

        // Split tasks by semicolon or comma, then trim whitespace and filter out empty strings
        const descriptions = fullMessage
            .split(/;|,/)
            .map((desc) => desc.trim())
            .filter((desc) => desc.length > 0);

        if (descriptions.length === 0) {
            return message.reply("No valid task descriptions found after splitting. Please try again.");
        }

        const addedTasks = [];
        for (const description of descriptions) {
            const newTask = await tasks.addTask(userId, description);
            addedTasks.push(newTask);
        }

        const userData = tasks.getUserData(userId);
        const embed = new EmbedBuilder()
            .setColor(userData.userColor || Colors.Green)
            .setTitle(`✅ ${addedTasks.length} Task(s) Added!`)
            .setTimestamp()
            .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
            });

        let taskList = "";
        addedTasks.forEach((task, index) => {
            taskList += `**${index + 1}.** '${task.description}' (ID: \`${task.id}\`)\n`;
        });
        embed.setDescription(taskList); // Use description for the list of added tasks

        return message.channel.send({ embeds: [embed] });
>>>>>>> 3aee4d1 (For testing and fix total tasks when a lot)
    }
}

<<<<<<< HEAD
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
=======
    if (command === 'pings') {
        message.reply('Slave me is, but still here!');
    }

    if (command === 'hellos') {
        message.channel.send(`Hello there, ${message.author.username}!`);
    }

    if (command === 'echos') {
        if (!args.length) {
            return message.reply('You didn\'t provide anything to echo!');
>>>>>>> 3aee4d1 (For testing and fix total tasks when a lot)
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

<<<<<<< HEAD
        const task = userTasks[userId].find(
            (t) => t.id === taskId && !t.completed
        );
        if (task) {
            task.completed = true;
            await saveTasks(userTasks);
            return task;
=======
    // --- !check Command ---
    if (command === "checks") {
        const userAllTasks = tasks.getUserTasks(userId);
        const incompleteTasks = userAllTasks.filter((task) => !task.completed);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff) // Blue color
            .setTitle(`� Your Outstanding Tasks`)
            .setDescription(
                incompleteTasks.length > 0
                    ? `Here are your ${incompleteTasks.length} pending tasks:`
                    : "You currently have no outstanding tasks! �"
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}` });

        if (incompleteTasks.length === 0) {
            return message.reply("You currently have no outstanding tasks! �");
>>>>>>> 3aee4d1 (For testing and fix total tasks when a lot)
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

<<<<<<< HEAD
export default tasks;
=======
        if (incompleteTasks.length > 0) {
            // Add tasks as fields or description text
            let taskList = "";
            let countTasks = 0;
            incompleteTasks.forEach((task, index) => {
                if (countTasks === 25) {
                    embed.addFields({ name: `Tasks (${countTasks})`, value: taskList || "None", inline: false });
                    taskList = "";
                    countTasks = 0;
                }
                taskList += `**${index + 1}.** [ ] ${task.description}\n`;
                countTasks++;
            });
            embed.addFields({ name: `Tasks (${countTasks})`, value: taskList || "None", inline: false });
        }

        return message.channel.send({ embeds: [embed] });
    }

    // --- !done Command ---
    if (command === "dones") {
        const identifier = args.join(" "); // Can be task ID or list number
        if (!identifier) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffcc00) // Yellowish color for warning
                        .setDescription(
                            "Please provide the ID or the number of the task you want to mark as done."
                        ),
                ],
            });
        }

        const allDones = identifier
            .split(/;|,/)
            .map((oneDone) => oneDone.trim())
            .filter((oneDone) => oneDone.length > 0);

        const doneTasks = [];
        const notFound = [];
        for (const doneTask of allDones) {

            let taskToComplete = null;

            // Try to parse as a number (for list index)
            const taskNumber = parseInt(identifier);
            if (!isNaN(taskNumber)) {
                taskToComplete = tasks.getTaskByIndex(userId, taskNumber);
            }

            // If not found by number, try to find by ID
            if (!taskToComplete) {
                const userAllTasks = tasks.getUserTasks(userId);
                taskToComplete = userAllTasks.find(
                    (t) => t.id === identifier && !t.completed
                );
            }

            if (!taskToComplete) {
                notFound.push(doneTask);
            }

            if (taskToComplete) {
                const completedTask = await tasks.markTaskDone(userId, taskToComplete.id);
                doneTasks.push(completedTask);
            }
        }

        if (doneTasks.length) {
            // Create an embed for task completion
            const embed = new EmbedBuilder()
                .setColor(0x00ff00) // Green color
                .setTitle("✅ Task Completed!")
                .setDescription(`'**${doneTasks.length}**'`)
                .addFields(
                    // { name: "ID", value: `\`${completedTask.id}\``, inline: true },
                    { name: "DONE", value: `\YES\``, inline: true },
                    { name: "Completed By", value: `<@${userId}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}` });

            return message.channel.send({ embeds: [embed] });
        } else {
            // This case should ideally not be reached if taskToComplete was found
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000) // Red color for error
                        .setDescription("❌ Failed to mark task as done. Please try again."),
                ],
            });
        }
    }
    // --- End Existing Commands ---
});
>>>>>>> 3aee4d1 (For testing and fix total tasks when a lot)
