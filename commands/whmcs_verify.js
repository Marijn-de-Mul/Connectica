
// ----------------------
// Connectica Discord Bot
// ----------------------


// Standard Modules
const fs = require('node:fs')
const path = require('node:path')

// Discord.JS Modules
const { SlashCommandBuilder, messageLink} = require('discord.js')

// MySQL Modules
const mysql = require('mysql')

// Config Modules
const { WHMCS_DISCORD_ROLE, DATABASE_PASS, DATABASE_USER, DATABASE_NAME, DATABASE_HOST, EMAIL_SMTP_HOST_AUTH_PASSWORD, EMAIL_SMTP_HOST_AUTH_USER, EMAIL_SMTP_HOST_SECURE, EMAIL_SMTP_HOST_PORT, EMAIL_SMTP_HOST, EMAIL_SUBJECT, EMAIL_FROM, WHMCS_API_ENDPOINT, WHMCS_API_IDENTIFIER, WHMCS_API_SECRET, WHMCS_API_KEY } = require('./../config.json')


// Initializing MySQL Database Connection
const con = mysql.createConnection({
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASS,
    database: DATABASE_NAME
})

con.connect(function(err) {
    if (err) {
        return console.error('error: ' + err.message)
    }
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('You Run This Command After Running /getclientrole.')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('You Run This Command After Running /getclientrole.')
                .setRequired(true)),
    async execute(interaction) {
        con.query("SELECT verification_code FROM whmcs WHERE discord_user_id = ?", [interaction.user.id], (error, results) => {
            if (error) throw error

            if (interaction.member.roles.cache.has(WHMCS_DISCORD_ROLE) == false) {
                if (JSON.stringify(results) == '[{"verification_code":"' + interaction.options.getString('code') + '"}]') {
                    interaction.member.roles.add(WHMCS_DISCORD_ROLE)
                    interaction.reply("We have added your customer role.")
                } else {
                    interaction.reply("It seems like your verification code is incorrect. Please request a new one by running /getclientrole.")
                }
            } else {
                interaction.reply("You already have the role.")
            }
        })
    }
}
