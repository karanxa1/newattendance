# Deployment Guide for Hugging Face Spaces

This guide provides step-by-step instructions for deploying the College Attendance Monitoring System to Hugging Face Spaces.

## Prerequisites

1. A Hugging Face account (sign up at [huggingface.co](https://huggingface.co) if you don't have one)
2. Your Firebase project credentials
3. Google Sheets API credentials (if using Google Sheets integration)

## Deployment Steps

### 1. Fork or Clone the Repository

Make sure you have the latest version of the code in your own repository.

### 2. Create a New Space on Hugging Face

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click on "Create a new Space"
3. Choose a name for your Space
4. Select "Web App" as the Space SDK
5. Choose "Static" as the template
6. Set the visibility as per your requirements (Public or Private)
7. Click "Create Space"

### 3. Configure GitHub Integration

1. In your Space, go to the "Settings" tab
2. Under "Repository", click "Link a GitHub repository"
3. Select your repository containing the attendance monitoring webapp
4. Configure the branch to deploy (usually `main` or `master`)

### 4. Set Environment Variables

1. In your Space, go to the "Settings" tab
2. Under "Repository secrets", add the following environment variables:

   - `JWT_SECRET`: Your JWT secret key for authentication
   - `FIREBASE_API_KEY`: Your Firebase API key
   - `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `FIREBASE_APP_ID`: Your Firebase app ID
   - `FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID
   
   If using Google Sheets integration:
   - `GOOGLE_CLIENT_EMAIL`: Your Google service account client email
   - `GOOGLE_PRIVATE_KEY`: Your Google service account private key (make sure to include all newlines)
   - `USER_EMAIL`: Default user email for Google Sheets operations

### 5. Deploy Your Application

1. Commit and push your changes to the linked GitHub repository
2. Hugging Face will automatically deploy your application based on the `huggingface.yml` configuration
3. You can monitor the deployment process in the "Factory" tab of your Space

### 6. Verify Deployment

1. Once deployment is complete, visit your Space URL
2. Test the application functionality to ensure everything works as expected
3. Check the logs in the "Factory" tab if you encounter any issues

## Troubleshooting

### Common Issues

1. **Application fails to start**: Check the logs in the "Factory" tab for error messages. Common issues include missing environment variables or dependency problems.

2. **Firebase connection issues**: Verify that all Firebase environment variables are correctly set and that your Firebase project has the appropriate security rules.

3. **Google Sheets integration not working**: Ensure that the Google service account has the necessary permissions and that the private key is correctly formatted with newlines.

4. **Port conflicts**: The application is configured to use port 3000, which is the default port for Hugging Face Spaces. If you've modified the port in your code, make sure to update the `port` setting in `huggingface.yml`.

## Updating Your Deployment

To update your deployed application:

1. Make changes to your code locally
2. Commit and push the changes to your GitHub repository
3. Hugging Face will automatically redeploy your application

## Additional Resources

- [Hugging Face Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)