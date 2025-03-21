const { google } = require('googleapis');

// Load credentials from environment variables
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// Properly format the private key - handle newlines and quotes correctly
const formattedKey = GOOGLE_PRIVATE_KEY ? 
  GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"|"$/g, '') : '';

// Configure auth client
const auth = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  formattedKey, // Use the properly formatted key
  [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file', // Add Drive scope for sharing permissions
    'https://www.googleapis.com/auth/drive' // Add full Drive scope for better sharing capabilities
  ]
);

// Create sheets client with authentication
const sheets = google.sheets({ version: 'v4', auth });

// Export both the sheets client and the auth client
module.exports = { sheets, auth };