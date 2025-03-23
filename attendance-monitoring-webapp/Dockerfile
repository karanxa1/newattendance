FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Create .env file at runtime from environment variables
RUN echo "#!/bin/sh\n\
echo \"PORT=\${PORT:-3000}\" > .env\n\
echo \"JWT_SECRET=\${JWT_SECRET}\" >> .env\n\
echo \"FIREBASE_API_KEY=\${FIREBASE_API_KEY}\" >> .env\n\
echo \"FIREBASE_AUTH_DOMAIN=\${FIREBASE_AUTH_DOMAIN}\" >> .env\n\
echo \"FIREBASE_PROJECT_ID=\${FIREBASE_PROJECT_ID}\" >> .env\n\
echo \"FIREBASE_STORAGE_BUCKET=\${FIREBASE_STORAGE_BUCKET}\" >> .env\n\
echo \"FIREBASE_MESSAGING_SENDER_ID=\${FIREBASE_MESSAGING_SENDER_ID}\" >> .env\n\
echo \"FIREBASE_APP_ID=\${FIREBASE_APP_ID}\" >> .env\n\
echo \"FIREBASE_MEASUREMENT_ID=\${FIREBASE_MEASUREMENT_ID}\" >> .env\n\
# Add Google Sheets API credentials if provided\n\
if [ ! -z \"\${GOOGLE_CLIENT_EMAIL}\" ]; then\n\
  echo \"GOOGLE_CLIENT_EMAIL=\${GOOGLE_CLIENT_EMAIL}\" >> .env\n\
fi\n\
if [ ! -z \"\${GOOGLE_PRIVATE_KEY}\" ]; then\n\
  echo \"GOOGLE_PRIVATE_KEY=\${GOOGLE_PRIVATE_KEY}\" >> .env\n\
fi\n\
if [ ! -z \"\${USER_EMAIL}\" ]; then\n\
  echo \"USER_EMAIL=\${USER_EMAIL}\" >> .env\n\
fi\n\
exec npm start" > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Use the entrypoint script to create .env file and start the app
CMD ["/app/entrypoint.sh"]