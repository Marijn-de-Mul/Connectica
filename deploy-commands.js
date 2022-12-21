
// ----------------------
// Connectica Discord Bot
// ----------------------


// Standard Modules
const fs = require('node:fs')

// Discord.JS Modules
const { REST, Routes } = require('discord.js')

// Config Modules
const { DISCORD_BOT_TOKEN, DISCORD_BOT_CLIENT_ID, DISCORD_BOT_GUILD_ID } = require('./config.json')


// Initializing Slash Commands
const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    commands.push(command.data.toJSON())
}

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN)


// Handle Command Registering
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`)

        const data = await rest.put(
            Routes.applicationGuildCommands(DISCORD_BOT_CLIENT_ID, DISCORD_BOT_GUILD_ID),
            { body: commands },
        )

        console.log(`Successfully reloaded ${data.length} application (/) commands.`)
    } catch (error) {
        console.error(error)
    }
})()

