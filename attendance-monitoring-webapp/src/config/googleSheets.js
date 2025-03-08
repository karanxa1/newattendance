
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: '../credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

module.exports = google.sheets({ version: 'v4', auth });