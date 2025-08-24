// Load environment variables from .env file
require('dotenv').config();

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // This is crucial for reading message content!
    ],
});

// When the client is ready, run this code (only once)
// We use 'c' for the client parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// --- Now let's make the bot respond to a command! ---

client.on(Events.MessageCreate, message => {
    // Ignore messages from other bots or itself
    if (message.author.bot) return;

    // Define a simple command prefix (e.g., !)
    const prefix = '!';

    // Check if the message starts with the prefix
    if (!message.content.startsWith(prefix)) return;

    // Extract the command and arguments
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // A simple 'ping' command
    if (command === 'ping') {
        message.reply('Pong!');
    }

    // A simple 'hello' command
    if (command === 'hello') {
        message.channel.send(`Hello there, ${message.author.username}!`);
    }

    // An 'echo' command
    if (command === 'echo') {
        if (!args.length) {
            return message.reply('You didn\'t provide anything to echo!');
        }
        message.channel.send(args.join(' '));
    }
});