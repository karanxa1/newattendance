const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Add this line
require('dotenv').config();

const authRoutes = require('./routes/auth').router;
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); // Updated line

app.use('/api', authRoutes);
app.use('/api', classRoutes);
app.use('/api', attendanceRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//ing