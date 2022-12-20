const { SlashCommandBuilder, messageLink} = require('discord.js');
const whmcsClient = require("whmcs-api")
const fs = require('node:fs')
const path = require('node:path')
const { WHMCS_API_ENDPOINT, WHMCS_API_IDENTIFIER, WHMCS_API_SECRET, WHMCS_API_KEY } = require('./../config.json');

let init = {
    "endpoint": WHMCS_API_ENDPOINT,
    "identifier": WHMCS_API_IDENTIFIER,
    "secret": WHMCS_API_SECRET,
    "accesskey": WHMCS_API_KEY,
    "responsetype":"json"
}

const whmcs = new whmcsClient(init)

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const myOAuth2Client = new OAuth2(
    "client ID goes here",
    "client secret goes here",
    "https://developers.google.com/oauthplayground"
)

myOAuth2Client.setCredentials({
    refresh_token:"refresh token from oauth playground goes here"
});

const myAccessToken = myOAuth2Client.getAccessToken()

function generate(n) {
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if ( n > max ) {
        return generate(max) + generate(n - max);
    }

    max        = Math.pow(10, n+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;

    return ("" + number).substring(add);
}

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
            if (JSON.stringify(data.result) == '"success"') {
                await interaction.reply("Client Found! Check your e-mail for the verification code after which you can execute /verify with the code as input.")

                const transport = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        type: "OAuth2",
                        user: "marijndemul@gmail.com", //your gmail account you used to set the project up in google cloud console"
                        clientId: " Client ID Here",
                        clientSecret: "Client Secret Here",
                        refreshToken: "Refresh Token Here",
                        accessToken: myAccessToken //access token variable we defined earlier
                    }});

                message = {
                    from: "marijndemul@gmail.com",
                    to: interaction.options.getString('email'),
                    subject: "Verification Code",
                    text: generate(6)
                }
                transporter.sendMail(message, function(err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(info)
                    }
                })
            } else {
                await interaction.reply("No client was found using this e-mail address.")
            }
        })
            .catch(async error => {
                if (error == "Error: Client Not Found") {
                    await interaction.reply("No client was found using this e-mail address.")
                } else {
                        console.log(error)
                }})
    },
};