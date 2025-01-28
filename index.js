require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const db = require('./utils/database'); // Import the SQLite database
const userReactionsMap = require('./data/userReactionsMap'); // Import the reactions map from the data folder

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Read command files
const commandFiles = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter(file => file.endsWith('.js'));

// Listen for the bot being ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for slash command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data.name === interaction.commandName) {
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: 'There was an error executing that command!',
          ephemeral: true,
        });
      }
      break;
    }
  }
});

// Listen for messages
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Increment the user's message count
  db.incrementMessage.run(message.author.id);

  // --- KEYWORD REACTIONS ---
  const content = message.content.toLowerCase();

  if (content.includes('french')) {
    await message.react('🤮');
  }
  if (content.includes('british')) {
    await message.react('💪');
    await message.react('🇬🇧');
  }
  if (content.includes('american')) {
    await message.react('🫃');
  }
  if (content.includes('9dots')) {
    await message.react('🐀');
  }
  if (content.includes('squidposting')) {
    await message.react('🦑');
  }
  if (content.includes('frfr')) {
    await message.react('🇫');
    await message.react('🇷');
  }
  if (content.includes('blaber')) {
    await message.react('🐐');
  }
  if (content.includes('inspired')) {
    await message.react('🐶');
  }

  // --- RANDOM 1/100 REACTION PER USER ---
  const userReactions = userReactionsMap[message.author.id];
  if (userReactions && Math.random() < 0.01) {
    // Increment the trigger count
    db.incrementTrigger.run(message.author.id);

    // React with each emoji
    for (const emoji of userReactions) {
      try {
        await message.react(emoji);
      } catch (err) {
        console.error(`Failed to react with ${emoji}:`, err);
      }
    }
  }
});

// Finally, log in
client.login(TOKEN);
