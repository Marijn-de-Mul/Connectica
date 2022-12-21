
// ----------------------
// Connectica Discord Bot
// ----------------------


// Standard Modules
const fs = require('node:fs')
const path = require('node:path')

// Discord.JS Modules
const { SlashCommandBuilder, messageLink} = require('discord.js')

// WHMCS Modules
const whmcsClient = require("whmcs-api")

// MySQL Modules
const mysql = require('mysql')

// Nodemailer Modules
const nodemailer = require('nodemailer')

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

    console.log('Connected to the MySQL server.')
})

// Initializing WHMCS API Connection
const init = {
    "endpoint": WHMCS_API_ENDPOINT,
    "identifier": WHMCS_API_IDENTIFIER,
    "secret": WHMCS_API_SECRET,
    "accesskey": WHMCS_API_KEY,
    "responsetype":"json"
}

const whmcs = new whmcsClient(init)


// Create Function To Generate 6 Digit Verification Codes
function generate(n) {
    var add = 1, max = 12 - add   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if ( n > max ) {
        return generate(max) + generate(n - max)
    }

    max        = Math.pow(10, n+add)
    var min    = max/10 // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min

    return ("" + number).substring(add)
}

// Create Function To Check If JSON String Contains Data
function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

// Run The Main Command Code
module.exports = {
    data: new SlashCommandBuilder()
        .setName('getclientrole')
        .setDescription('This command verifies your e-mail with our back-end.')
        .addStringOption(option =>
            option.setName('email')
                .setDescription('This command verifies your e-mail with our back-end.')
                .setRequired(true)),
    async execute(interaction) {
        whmcs.call("GetClientsDetails", {
            email: interaction.options.getString('email')
        }).then(async data => {
            if (interaction.member.roles.cache.has(WHMCS_DISCORD_ROLE) == false) {
                if (JSON.stringify(data.result) == '"success"') {
                    await interaction.reply("Client Found! Check your e-mail for the verification code after which you can execute /verify with the code as input.")

                    const transporter = nodemailer.createTransport({
                        host: EMAIL_SMTP_HOST,
                        port: EMAIL_SMTP_HOST_PORT,
                        secure: EMAIL_SMTP_HOST_SECURE,
                        auth: {
                            user: EMAIL_SMTP_HOST_AUTH_USER,
                            pass: EMAIL_SMTP_HOST_AUTH_PASSWORD
                        }
                    })

                    verification_code = generate(6)
                    discord_user_id = interaction.user.id
                    e_mail = interaction.options.getString('email')

                    message = {
                        from: EMAIL_FROM,
                        to: interaction.options.getString('email'),
                        subject: EMAIL_SUBJECT,
                        text: verification_code
                    }
                    transporter.sendMail(message, function (err, info) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log(info)
                        }
                    })

                    const mysql_input_select = [
                        [discord_user_id, verification_code, e_mail]
                    ]

                    const selectUsername = con.query("SELECT discord_user_id FROM whmcs WHERE discord_user_id= ?", [discord_user_id], function (err, row) {

                        if (isEmptyObject(row)) {
                            con.query("INSERT INTO whmcs (discord_user_id,verification_code,e_mail) VALUES ?", [mysql_input_select], function (err, result, fields) {
                                if (err) throw err
                            });
                        } else {
                            con.query("UPDATE whmcs SET verification_code = ? WHERE discord_user_id = ?", [verification_code, discord_user_id], function (err, result, fields) {
                                if (err) throw err
                            });
                        }
                    })

                } else {
                    await interaction.reply("No client was found using this e-mail address.")
                }
            } else {
                await interaction.reply("You already have the role.")
            }

        })
            .catch(async error => {
                if (error == "Error: Client Not Found") {
                    await interaction.reply("No client was found using this e-mail address.")
                } else {
                    console.log(error)
                }})
    },
}