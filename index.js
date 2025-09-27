require('dotenv').config();

const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const {
    initializeTasks,
    addTask,
    getUserTasks,
    markTaskDone,
    getTaskByIndex,
} = require("./utils/taskHandler"); // Import our task functions

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});


client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await initializeTasks(); // Load tasks when the bot starts
    console.log("Task system initialized.");
});


client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);


client.on(Events.MessageCreate, async message => { // Added 'async' keyword here!
    if (message.author.bot) return;

    const prefix = '!';

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const userId = message.author.id; // Get the ID of the user who sent the command

    // --- Existing Commands ---

    if (command === 'hello') {
        message.channel.send(`Hello there, ${message.author.username}!`);
    }

    // --- !task Command ---
    if (command === "task") {
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
            .setTitle(`📋 Your Outstanding Tasks`)
            .setDescription(
                incompleteTasks.length > 0
                    ? `Here are your ${incompleteTasks.length} pending tasks:`
                    : "You currently have no outstanding tasks! 🎉"
            )
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}` });

        if (incompleteTasks.length === 0) {
            return message.reply("You currently have no outstanding tasks! 🎉");
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

    // --- New `kat` Command ---
    if (command === '0task') {
        if (!args.length) {
            return message.reply('Please specify a subcommand for `task`. Try `!kat help`. Please specify a task action (e.g., `list`, `assign`, `complete`).');
        }

        const subcommand = args.shift().toLowerCase();

        switch (subcommand) {
            case 'etask':
                const taskListString = tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');

                const etaskEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('👷‍♂️ Your Current Task List')
                    .setDescription(taskListString || 'No tasks currently assigned. Time to relax!') // Add a fallback if tasks array is empty
                    .setTimestamp()
                    .setFooter({ text: 'Task Management Bot' });

                message.channel.send({ embeds: [etaskEmbed] });
                break;
            case 'te0st1':
                // ... inside your messageCreate listener
                if (message.content === '!markdown') {
                    const markdownEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('Markdown Examples')
                        .setDescription(
                            'This embed showcases different **Markdown** capabilities:\n' +
                            '*   **Bold text**\n' +
                            '*   _Italic text_\n' +
                            '*   __Underlined text__\n' +
                            '*   ~~Strikethrough text~~\n' +
                            '*   `Inline code` example\n' +
                            '```javascript\nconst a = 1;\nconst b = 2;\nconsole.log(a + b);\n```\n' +
                            '[Click here for a link!](https://discord.com)'
                        )
                        .addFields(
                            { name: 'Field with Markdown', value: 'This field also has **bold** and _italic_ text.' },
                            { name: 'Spoiler Alert', value: '||This is a secret message!||' }
                        );

                    message.channel.send({ embeds: [markdownEmbed] });
                }
                break;
            case 'li0st':
                let taskListMessage = '**Current Tasks:**\n';
                if (tasks.length === 0) {
                    taskListMessage += 'No tasks currently defined.';
                } else {
                    tasks.forEach(task => {
                        const status = task.completed ? '✅ Completed' : '⏳ Pending';
                        const assignee = task.assignedTo ? ` (${task.assignedTo})` : '';
                        taskListMessage += `- ID:${task.id} ${task.name}${assignee} - ${status}\n`;
                    });
                }
                message.channel.send(taskListMessage);
                break;

            case 'as0sign':
                // Expected format: !kat task assign @user Task Name
                // We need at least one arg (the user) and then the task name
                if (args.length < 2) { // Minimum 1 mention + 1 word for task name
                    return message.reply('Usage: `!kat task assign <@user> <Task Name>`');
                }

                const targetUser = message.mentions.users.first();
                if (!targetUser) {
                    return message.reply('Please mention a user to assign the task to (e.g., `@username`).');
                }

                // Remove the user mention from args and reconstruct the task name
                // Note: user mention is like <@ID> so it occupies one 'arg' slot if split by spaces
                // If it's the first arg, we need to shift it out.
                // A more robust way is to rebuild the task name from the remaining args
                const taskNameToAssign = args.slice(1).join(' '); // Skip the mention which is args[0]
                if (!taskNameToAssign) {
                    return message.reply('Please provide the name of the task to assign.');
                }


                const taskToAssign = tasks.find(t => t.name.toLowerCase() === taskNameToAssign.toLowerCase());

                if (!taskToAssign) {
                    return message.reply(`Task "${taskNameToAssign}" not found.`);
                }
                if (taskToAssign.completed) {
                    return message.reply(`Task "${taskNameToAssign}" is already completed.`);
                }

                taskToAssign.assignedTo = targetUser.username; // Or targetUser.tag for full name#tag
                message.reply(`Task "${taskToAssign.name}" assigned to ${targetUser.username}.`);
                break;

            case 'comp0lete':
                // Expected format: !kat task complete Task Name
                if (!args.length) {
                    return message.reply('Usage: `!kat task complete <Task Name>`');
                }
                const taskNameToComplete = args.join(' ');

                const taskToComplete = tasks.find(t => t.name.toLowerCase() === taskNameToComplete.toLowerCase());

                if (!taskToComplete) {
                    return message.reply(`Task "${taskNameToComplete}" not found.`);
                }
                if (taskToComplete.completed) {
                    return message.reply(`Task "${taskNameToComplete}" is already completed.`);
                }

                taskToComplete.completed = true;
                taskToComplete.assignedTo = null; // Clear assignee on completion
                message.reply(`Task "${taskToComplete.name}" marked as complete!`);
                break;

            case 'embed':
                const exampleEmbed = new EmbedBuilder()
                    .setColor(0x0099FF) // Hex color code
                    .setTitle('Your tasks!')
                    .setURL('https://katisawesome.yes.def/') // Optional URL for the title
                    .setAuthor({ name: 'YOU', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://taskbot.no.page' })
                    .setDescription('Tasks for the user.')
                    .setThumbnail('https://i.imgur.com/AfFp7pu.png') // Small image on the right
                    .addFields(
                        { name: 'Regular field title', value: 'Some value here' },
                        { name: '\u200B', value: '\u200B' }, // An empty field for spacing
                        { name: 'Inline field title', value: 'Some value here', inline: true },
                        { name: 'Another inline field', value: 'This one is also inline', inline: true },
                    )
                    .setImage('https://i.imgur.com/AfFp7pu.png') // Large image at the bottom
                    .setTimestamp() // Adds the current date/time to the footer
                    .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

                message.channel.send({ embeds: [exampleEmbed] });
                break;
            default:
                message.reply('Invalid task action. Try `list`, `assign`, or `complete`.');





        }
    }
    // --- End New `kat` Command ---

    // --- End Existing Commands ---



});