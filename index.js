import { readFileSync } from 'fs';
import 'dotenv/config';

import { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors } from 'discord.js';

import tasks from "./utils/taskHandler.js"; // Import our task functions
//import threads from "./utils/welcomeThread.js";

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once("clientReady", async () => {
    console.log(`Ready! Logged in as ${client.user.tag}!`);
    await tasks.initializeTasks(); // Load tasks when the bot starts
});

// 2. Button click handler
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'open_user_post') return;

    const forum = await client.channels.fetch(CONFIG.forumId);
    const userPostName = `${interaction.user.username} TASKS`;

    // reuse existing user post if it exists
    let post = forum.threads.cache.find(t => t.name === userPostName);
    if (!post) {
        post = await forum.threads.create({
            name: userPostName,
            message: `<@${interaction.user.id}> this is your place to use the bot.`
        });
        await post.members.add(interaction.user);
    } else {
        await post.send(`<@${interaction.user.id}> reopened your post.`);
    }
    await interaction.reply({ content: `Post ready: ${post}`, ephemeral: true });
});

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
    if (command === "task") {
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
    }

    if (command === 'ping') {
        message.reply('Slave me is, but still here!');
    }

    if (command === 'hello') {
        message.channel.send(`Hello there, ${message.author.username}!`);
    }

    if (command === 'echo') {
        if (!args.length) {
            return message.reply('You didn\'t provide anything to echo!');
        }
        message.channel.send(args.join(' '));
    }

    // --- !check Command ---
    if (command === "check") {
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
        }

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
            embed.addFields({ name: "Tasks", value: taskList || "None", inline: false });
        }

        return message.channel.send({ embeds: [embed] });
    }

    // --- !done Command ---
    if (command === "done") {
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