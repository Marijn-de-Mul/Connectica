const whmcsClient = require("whmcs-api")
const fs = require('node:fs')
const path = require('node:path')
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')
const { DISCORD_BOT_TOKEN, WHMCS_API_ENDPOINT, WHMCS_API_IDENTIFIER, WHMCS_API_SECRET, WHMCS_API_KEY } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

let init = {
    "endpoint": WHMCS_API_ENDPOINT,
    "identifier": WHMCS_API_IDENTIFIER,
    "secret": WHMCS_API_SECRET,
    "accesskey": WHMCS_API_KEY,
    "responsetype":"json"
}

client.commands = new Collection()
const whmcs = new whmcsClient(init)
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// whmcs.call("GetClientsDetails", {
//     email: "marijndemuL@gmail.com"
// }).then(data => console.log(data))
//     .catch(error => console.error(error))

client.login(DISCORD_BOT_TOKEN)
