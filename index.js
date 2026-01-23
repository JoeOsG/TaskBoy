const { readFileSync } = require('fs');
require('dotenv').config();

const { Client, Events, GatewayIntentBits, EmbedBuilder, Colors } = require('discord.js');

const {
    initializeTasks,
    addTask,
    getUserTasks,
    markTaskDone,
    getTaskByIndex,
    getUserData,
} = require("./utils/taskHandler"); // Import our task functions

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once("clientReady", async () => {
    console.log(`Ready! Logged in as ${client.user.tag}!`);
    await initializeTasks(); // Load tasks when the bot starts
    console.log("Task system initialized.");

    //     m => m.author.id === client.user.id && m.embeds[0]?.title === 'Need help?'
    // );

    // if (!existing) {
    //     const embed = new EmbedBuilder()
    //         .setTitle('Need help?')
    //         .setDescription('Click the button below to open a private thread.');

    //     const row = new ActionRowBuilder().addComponents(
    //         new ButtonBuilder()
    //             .setCustomId('open_help_thread')
    //             .setLabel('Open Thread')
    //             .setStyle(ButtonStyle.Primary)
    //     );

    //     await welcomeCh.send({ embeds: [embed], components: [row] });
    // }
});

// 

client.login(process.env.DISCORD_TOKEN);


client.on(Events.MessageCreate, async message => { // Added 'async' keyword here!
    if (message.author.bot) return;


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
            const newTask = await addTask(userId, description);
            addedTasks.push(newTask);
        }

        const userData = getUserData(userId);
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

    if (command === 'task' && message.author.username === 'joeos') {
        message.reply('Hi original slave!');
    }
    if (command === 'task' && message.author.username === 'kawaiikitkat') {
        message.reply('Hi kat!   Hi kat!    Hi kat!          Hi kat!');
    }
    if (command === 'task' && message.author.username === 'alciia53') {
        message.reply('Smart!');
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
    if (command === 'task') {
        const description = args.join(" ");
        if (!description) {
            return message.reply("Please provide a description for your task!");
        }

        const newTask = await addTask(userId, description);
        // Create an embed for task addition
        const embed = new EmbedBuilder()
            .setColor(0x00ff00) // Green color
            .setTitle("✅ Task Added!")
            .setDescription(`'**${newTask.description}**'`)
            .addFields(
                // { name: "ID", value: `\`${newTask.id}\``, inline: true },
                { name: "ADDED", value: `\Success\``, inline: true },
                { name: "Assigned To", value: `<@${userId}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}` });

        return message.channel.send({ embeds: [embed] }); // Send the embed
    }
    // --- !check Command ---
    if (command === "check") {
        const userAllTasks = getUserTasks(userId);
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
            // For more than 25 tasks, you'd need pagination or multiple embeds.
            // For now, let's list them in the description if not too many  // (ID: \`${task.id                     }\`)\n`;
            let taskList = "";
            incompleteTasks.forEach((task, index) => {
                taskList += `**${index + 1}.** [ ] ${task.description}\n`;
            });
            embed.addFields({ name: "Tasks", value: taskList || "None", inline: false });
        }

        return message.channel.send({ embeds: [embed] });
    }

    // --- !done Command ---
    if (command === "done") {
        const identifier = args[0]; // Can be task ID or list number
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

        let taskToComplete = null;

        // Try to parse as a number (for list index)
        const taskNumber = parseInt(identifier);
        if (!isNaN(taskNumber)) {
            taskToComplete = getTaskByIndex(userId, taskNumber);
        }

        // If not found by number, try to find by ID
        if (!taskToComplete) {
            const userAllTasks = getUserTasks(userId);
            taskToComplete = userAllTasks.find(
                (t) => t.id === identifier && !t.completed
            );
        }

        if (!taskToComplete) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000) // Red color for error
                        .setDescription(
                            `❌ Could not find an outstanding task with ID/number \`${identifier}\`.`
                        ),
                ],
            });
        }

        const completedTask = await markTaskDone(userId, taskToComplete.id);

        if (completedTask) {
            // Create an embed for task completion
            const embed = new EmbedBuilder()
                .setColor(0x00ff00) // Green color
                .setTitle("✅ Task Completed!")
                .setDescription(`'**${completedTask.description}**'`)
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


    if (command === 'cats') {
        message.reply('maureen and jasper are just as spoiled if not more, also hi Nico!');
    }

    // --- End Existing Commands ---
});