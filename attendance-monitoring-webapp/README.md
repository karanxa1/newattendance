# College Attendance Monitoring System

A web application for managing and monitoring student attendance in college classes.

## Features

- User authentication with role-based access control (Admin, Faculty, Staff)
- Class management (create, update, delete classes)
- Student attendance tracking
- Attendance reports and analytics
- Data visualization with charts
- Export attendance data to Excel

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: Firebase Firestore
- Authentication: JWT
- Charts: Chart.js
- Excel Export: ExcelJS

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the application:
   ```
   npm start
   ```

## Deployment on Hugging Face

This application is configured to be deployed on Hugging Face Spaces. The configuration is defined in the `huggingface.yml` file.

## Firebase Configuration

The application uses Firebase Firestore for data storage. The Firebase configuration is stored in `src/config/firebaseConfig.js`.

## API Endpoints

- `/api/admin/users` - User management
- `/api/admin/classes` - Class management
- `/api/attendance` - Attendance recording and reporting
- `/api/classes` - Class information
- `/api/export-to-excel` - Export attendance data to Excel

## License

MIT