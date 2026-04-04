import { Client, Events, GatewayIntentBits, EmbedBuilder, Colors } from 'discord.js';
import dotenv from 'dotenv';
import tasks from './utils/taskHandler.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    tasks.initializeTasks();
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const userId = message.author.id;

    // --- !tasks Command (Multi-task support) ---
    if (command === "tasks") {
        const fullMessage = args.join(" ");
        if (!fullMessage) {
            return message.reply("Please provide one or more task descriptions, separated by `;` or `,`.");
        }

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

        const userData = tasks.getUserData(userId) || {};
        const embed = new EmbedBuilder()
            .setColor(userData.userColor || Colors.Green)
            .setTitle(`✅ ${addedTasks.length} Task(s) Added!`)
            .setTimestamp()
            .setFooter({
                text: `Requested by ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
            });

        let taskList = "";
        addedTasks.forEach((task) => {
            taskList += `**${task.number}.** '${task.description}' (ID: \`${task.id}\`)\n`;
        });
        embed.setDescription(taskList);

        return message.channel.send({ embeds: [embed] });
    }

    if (command === 'pings') {
        message.reply('Slave me is, but still here!');
    }

    if (command === 'hellos') {
        message.channel.send(`Hello there, ${message.author.username}!`);
    }

    if (command === 'echos') {
        if (!args.length) {
            return message.reply('You didn\'t provide anything to echo!');
        }
        message.channel.send(args.join(" "));
    }

    // --- !checks Command ---
    if (command === "checks") {
        const userAllTasks = tasks.getUserTasks(userId);
        const incompleteTasks = userAllTasks.filter((task) => !task.completed);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff) // Blue color
            .setTitle(`📔 Your Outstanding Tasks`)
            .setDescription(
                incompleteTasks.length > 0
                    ? `Here are your ${incompleteTasks.length} pending tasks:`
                    : "You currently have no outstanding tasks! 🎉"
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}` });

        if (incompleteTasks.length > 0) {
            let taskList = "";
            let chunkCount = 0;
            incompleteTasks.forEach((task) => {
                if (chunkCount === 25) {
                    embed.addFields({ name: `Tasks`, value: taskList || "None", inline: false });
                    taskList = "";
                    chunkCount = 0;
                }
                taskList += `**${task.number}.** [ ] ${task.description}\n`;
                chunkCount++;
            });
            embed.addFields({ name: `Tasks`, value: taskList || "None", inline: false });
        }

        return message.channel.send({ embeds: [embed] });
    }

    // --- !dones Command ---
    if (command === "dones") {
        const identifier = args.join(" ");
        if (!identifier) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xffcc00)
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
        for (const doneTask of allDones) {
            let taskToComplete = null;

            // Try to parse as a number (for stored task number)
            const taskNumber = parseInt(doneTask);
            if (!isNaN(taskNumber)) {
                taskToComplete = tasks.getTaskByNumber(userId, taskNumber);
            }

            // If not found by number, try to find by ID
            if (!taskToComplete) {
                const userAllTasks = tasks.getUserTasks(userId);
                taskToComplete = userAllTasks.find(
                    (t) => t.id === doneTask && !t.completed
                );
            }

            if (taskToComplete) {
                const completedTask = await tasks.markTaskDone(userId, taskToComplete.id);
                doneTasks.push(completedTask);
            }
        }

        if (doneTasks.length) {
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle("✅ Task Completed!")
                .setDescription(`'**${doneTasks.length}**' tasks completed.`)
                .addFields(
                    { name: "DONE", value: `YES`, inline: true },
                    { name: "Completed By", value: `<@${userId}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}` });

            return message.channel.send({ embeds: [embed] });
        } else {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setDescription("❌ No pending tasks found matching those identifiers."),
                ],
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
