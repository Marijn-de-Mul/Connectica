
// ----------------------
// Connectica Discord Bot
// ----------------------


// Standard Modules
const fs = require('node:fs')
const path = require('node:path')

// Discord.JS Modules
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// Config Modules
const { DISCORD_BOT_TOKEN } = require('./config.json')


// Initializing Slash Commands
client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command)
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
}

// Started The Bot
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})


// Handling Slash Commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return

    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error)
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
})


// Log In To Discord Using TOKEN
client.login(DISCORD_BOT_TOKEN)