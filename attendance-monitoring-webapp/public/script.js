document.addEventListener('DOMContentLoaded', () => {
    // Main DOM elements
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const usernameDisplay = document.getElementById('username-display');
    const roleDisplay = document.getElementById('role-display');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const adminPanel = document.getElementById('admin-panel');
    const facultyPanel = document.getElementById('faculty-panel');
    const graphContainer = document.getElementById('graph');

    // Config and global variables
    const API_URL = 'http://localhost:3000/api';
    // Add null check before setting date value
    const attendanceDateField = document.getElementById('attendance-date');
    if (attendanceDateField) {
        attendanceDateField.valueAsDate = new Date();
    }

    // Add graph controls (date range, update button, export button, chart type toggle)
    graphContainer.innerHTML += `
        <div class="graph-controls">
            <div class="form-group">
                <label for="graph-date-from"><i class="fas fa-calendar-alt"></i> From Date:</label>
                <input type="date" id="graph-date-from" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label for="graph-date-to"><i class="fas fa-calendar-alt"></i> To Date:</label>
                <input type="date" id="graph-date-to" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <button id="update-graph-btn" class="btn-success"><i class="fas fa-sync"></i> Update Graph</button>
            <button id="export-graph-btn" class="btn-success" style="margin-left: 10px;"><i class="fas fa-download"></i> Export as PNG</button>
            <div class="form-group" style="margin-top: 10px;">
                <label for="chart-type">Chart Type:</label>
                <select id="chart-type">
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                </select>
            </div>
        </div>
    `;

    // Dark mode toggle is now added directly in the HTML

    // Check stored authentication and dark mode preference
    init();

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    document.getElementById('add-user-btn').addEventListener('click', showUserForm);
    document.getElementById('cancel-user-btn').addEventListener('click', hideUserForm);
    document.getElementById('user-form').addEventListener('submit', createUser);
    document.getElementById('add-class-btn').addEventListener('click', showClassForm);
    document.getElementById('cancel-class-btn').addEventListener('click', hideClassForm);
    document.getElementById('class-form').addEventListener('submit', createClass);
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);
    document.getElementById('export-sheets-btn').addEventListener('click', exportToGoogleSheets);
    document.getElementById('graph-class').addEventListener('change', loadAttendanceGraph);
    document.getElementById('update-graph-btn').addEventListener('click', loadAttendanceGraph);
    document.getElementById('export-graph-btn').addEventListener('click', exportGraph);
    document.getElementById('chart-type').addEventListener('change', loadAttendanceGraph);
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Initialize the application
    function init() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        if (!token || !role || !username) {
            showLogin();
            showToast('No valid session found, please log in', 'error');
            return;
        }
        showApp(username, role);
        setupTabNavigation();
        // Apply dark mode preference on load
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
            if (darkModeCheckbox) {
                darkModeCheckbox.checked = true;
            }
        }
    }

    // Dark mode toggle function
    function toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        const darkModeCheckbox = document.getElementById('dark-mode-checkbox');
        darkModeCheckbox.checked = isDarkMode;
        showToast(`Switched to ${isDarkMode ? 'Dark' : 'Light'} Mode`, 'success');
    }

    // Authentication functions
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid credentials');
            }
            
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);
            showApp(username, data.role);
            showToast(`Welcome, ${username}!`, 'success');
        } catch (error) {
            showToast(`Login failed: ${error.message}`, 'error');
            console.error('Login error:', error);
        }
    }

    function handleLogout() {
        localStorage.clear();
        showLogin();
        showToast('You have been logged out', 'success');
    }

    // UI Display functions
    function showApp(username, role) {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        usernameDisplay.textContent = username;
        roleDisplay.textContent = `(${role})`;
        
        if (role === 'admin') {
            adminPanel.classList.remove('hidden');
            loadUsers();
            loadClasses('admin');
        } else if (role === 'faculty') {
            facultyPanel.classList.remove('hidden');
            loadClasses('faculty');
        }
    }

    function showLogin() {
        appContainer.classList.add('hidden');
        adminPanel.classList.add('hidden');
        facultyPanel.classList.add('hidden');
        userInfo.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        loginForm.reset();
    }

    function setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                tabContents.forEach(content => content.classList.add('hidden'));
                document.getElementById(tabId).classList.remove('hidden');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // Toast notification function
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        toast.prepend(icon, ' ');
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }

    // Enhanced toast with undo option
    function showToastWithUndo(message, type, undoCallback) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const text = document.createElement('span');
        text.textContent = message;
        
        const undoButton = document.createElement('button');
        undoButton.textContent = 'Undo';
        undoButton.style.marginLeft = '10px';
        undoButton.style.background = 'none';
        undoButton.style.border = 'none';
        undoButton.style.color = '#fff';
        undoButton.style.textDecoration = 'underline';
        undoButton.style.cursor = 'pointer';
        
        undoButton.onclick = async () => {
            await undoCallback();
            toast.remove();
            loadClasses('admin');
            showToast('Class creation undone', 'success');
        };

        toast.appendChild(document.createElement('i')).className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        toast.append(' ', text, undoButton);
        document.body.appendChild(toast);
        
        setTimeout(() => !undoButton.clicked && toast.remove(), 5000);
    }

    // User Management functions
    async function loadUsers() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '<tr><td colspan="4">Loading users...</td></tr>';
        
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            // Check if content-type is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Unexpected response format: Expected JSON');
            }

            const users = await response.json();
            
            if (users.length === 0) {
                usersList.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
                return;
            }
            
            usersList.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id || 'N/A'}</td>
                    <td>${user.username || 'N/A'}</td>
                    <td><span class="badge badge-${user.role || 'unknown'}">${user.role || 'Unknown'}</span></td>
                    <td>
                        <button class="edit-user-btn" data-id="${user.id || ''}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-user-btn" data-id="${user.id || ''}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
                
                row.querySelector('.edit-user-btn').addEventListener('click', () => editUser(user));
                row.querySelector('.delete-user-btn').addEventListener('click', () => deleteUser(user.id));
                
                usersList.appendChild(row);
            });
        } catch (error) {
            usersList.innerHTML = '<tr><td colspan="4">Error loading users</td></tr>';
            console.error('Error loading users:', error);
            showToast(`Error loading users: ${error.message}`, 'error');
        }
    }

    function showUserForm() {
        document.getElementById('user-form-container').classList.remove('hidden');
        document.getElementById('user-form').reset();
        document.getElementById('new-password').required = true;
    }

    function hideUserForm() {
        document.getElementById('user-form-container').classList.add('hidden');
    }

    async function createUser(e) {
        e.preventDefault();
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('role').value;

        // Input validation
        if (!username || !role) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (password && password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        // Log the request data for debugging
        console.log('Creating user with data:', { username, password, role });

        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            // Log the raw response for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Unexpected response format: Expected JSON');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create user');
            }

            hideUserForm();
            loadUsers();
            showToast('User created successfully', 'success');
        } catch (error) {
            console.error('Error creating user:', error);
            showToast(`Error creating user: ${error.message}`, 'error');
        }
    }

    function editUser(user) {
        const formContainer = document.getElementById('user-form-container');
        formContainer.classList.remove('hidden');
        
        document.getElementById('new-username').value = user.username;
        document.getElementById('new-password').value = '';
        document.getElementById('new-password').required = false;
        document.getElementById('role').value = user.role;
        
        document.getElementById('user-form').onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('new-username').value.trim();
            const password = document.getElementById('new-password').value;
            const role = document.getElementById('role').value;
            
            if (!username || !role) {
                showToast('Username and role are required', 'error');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/admin/users/${user.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password: password || undefined, role })
                });
                
                if (!response.ok) throw new Error('Failed to update user');
                
                formContainer.classList.add('hidden');
                loadUsers();
                showToast('User updated successfully', 'success');
            } catch (error) {
                showToast(`Error updating user: ${error.message}`, 'error');
                console.error('Error updating user:', error);
            }
        };
    }

    async function deleteUser(id) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        try {
            const response = await fetch(`${API_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) throw new Error('Failed to delete user');
            
            loadUsers();
            showToast('User deleted successfully', 'success');
        } catch (error) {
            showToast(`Error deleting user: ${error.message}`, 'error');
            console.error('Error deleting user:', error);
        }
    }

    // Class Management functions
    async function loadClasses(userRole) {
        const classesList = document.getElementById('classes-list');
        if (userRole === 'admin') classesList.innerHTML = '<tr><td colspan="4">Loading classes...</td></tr>';

        try {
            const response = await fetch(`${API_URL}/classes`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to fetch classes: ${response.statusText}`);
            }
            
            const classes = await response.json();
            
            if (userRole === 'admin') {
                classesList.innerHTML = '';
                classes.forEach(cls => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cls.id}</td>
                        <td>${cls.name}</td>
                        <td>${cls.strength}</td>
                        <td>
                            <button class="edit-class-btn" data-id="${cls.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="delete-class-btn" data-id="${cls.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                        </td>
                    `;
                    classesList.appendChild(row);
                });

                const reportClassSelect = document.getElementById('report-class');
                const graphClassSelect = document.getElementById('graph-class');
                reportClassSelect.innerHTML = '<option value="">Select a class</option>';
                graphClassSelect.innerHTML = '<option value="">Select a class</option>';
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    reportClassSelect.appendChild(option.cloneNode(true));
                    graphClassSelect.appendChild(option);
                });
            } else if (userRole === 'faculty') {
                const classSelect = document.getElementById('class-select');
                classSelect.innerHTML = '<option value="">Select a class</option>';
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    classSelect.appendChild(option);
                });
                
                classSelect.addEventListener('change', function() {
                    if (this.value) loadClassStudents(this.value);
                    else document.getElementById('attendance-buttons').innerHTML = '';
                });
            }
        } catch (error) {
            if (userRole === 'admin') classesList.innerHTML = '<tr><td colspan="4">Error loading classes</td></tr>';
            console.error('Error loading classes:', error);
            showToast(`Error loading classes: ${error.message}`, 'error');
        }
    }

    function showClassForm() {
        document.getElementById('class-form-container').classList.remove('hidden');
        document.getElementById('class-form').reset();
    }

    function hideClassForm() {
        document.getElementById('class-form-container').classList.add('hidden');
    }

    async function createClass(e) {
        e.preventDefault();
        const name = document.getElementById('class-name').value.trim();
        const strength = parseInt(document.getElementById('class-strength').value);

        if (!name || isNaN(strength) || strength < 1 || strength > 1000) {
            showToast('Invalid class name or strength', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/admin/classes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, strength })
            });
            
            if (!response.ok) throw new Error('Failed to create class');
            
            hideClassForm();
            loadClasses('admin');
            showToast('Class created successfully', 'success');
        } catch (error) {
            showToast(`Error creating class: ${error.message}`, 'error');
            console.error('Error creating class:', error);
        }
    }

    // Attendance functions
    async function loadClassStudents(classId) {
        const attendanceButtons = document.getElementById('attendance-buttons');
        attendanceButtons.innerHTML = 'Loading students...';
        
        try {
            const response = await fetch(`${API_URL}/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to fetch students: ${response.statusText}`);
            }
            
            const students = await response.json();
            attendanceButtons.innerHTML = '';
            
            students.forEach(student => {
                const button = document.createElement('button');
                button.className = 'student-btn';
                button.dataset.id = student.id;
                button.dataset.present = 'false';
                button.innerHTML = `${student.rollNumber}<br>${student.name}`;
                button.addEventListener('click', function() {
                    const isPresent = this.dataset.present === 'true';
                    this.dataset.present = !isPresent;
                    this.classList.toggle('present');
                });
                attendanceButtons.appendChild(button);
            });
            
            document.getElementById('mark-all-btn').onclick = () => {
                document.querySelectorAll('.student-btn').forEach(btn => {
                    btn.dataset.present = 'true';
                    btn.classList.add('present');
                });
            };
            
            document.getElementById('unmark-all-btn').onclick = () => {
                document.querySelectorAll('.student-btn').forEach(btn => {
                    btn.dataset.present = 'false';
                    btn.classList.remove('present');
                });
            };
            
            document.getElementById('save-attendance-btn').onclick = () => saveAttendance(classId);
        } catch (error) {
            attendanceButtons.innerHTML = 'Error loading students';
            console.error('Error loading students:', error);
            showToast(`Error loading students: ${error.message}`, 'error');
        }
    }

    async function saveAttendance(classId) {
        try {
            const buttons = document.querySelectorAll('.student-btn');
            const presentStudents = Array.from(buttons)
                .filter(btn => btn.dataset.present === 'true')
                .map(btn => btn.dataset.id);
            const date = document.getElementById('attendance-date').value;
            
            if (!date) {
                showToast('Please select a date', 'error');
                return;
            }
            
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ classId, date, presentStudents })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to save attendance: ${response.statusText}`);
            }
            
            showToast('Attendance saved successfully', 'success');
        } catch (error) {
            showToast(`Error saving attendance: ${error.message}`, 'error');
            console.error('Error saving attendance:', error);
        }
    }

    // Export to Google Sheets function
    async function exportToGoogleSheets() {
        const classId = document.getElementById('report-class').value;
        const fromDate = document.getElementById('report-date-from').value;
        const toDate = document.getElementById('report-date-to').value;
        const sheetName = 'Attendance Data';
        // Use the specific Google Sheet ID provided by the user
        const spreadsheetId = '1zEqCh3q9u7mNFu6MMAUMqt4aROLTCvEAZZtC2lPgzIA';
        
        if (!classId || !fromDate || !toDate) {
            showToast('Please select class and date range', 'error');
            return;
        }
        
        const resultDiv = document.getElementById('report-result');
        resultDiv.innerHTML = 'Exporting to Google Sheets...';
        
        try {
            // Get user email from localStorage or prompt the user
            let email = localStorage.getItem('email');
            if (!email) {
                email = prompt('Please enter your email address to share the Google Sheet with you:', '');
                if (email) {
                    localStorage.setItem('email', email);
                }
            }
            
            const response = await fetch(`${API_URL}/export-to-sheets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ classId, fromDate, toDate, sheetName, email, spreadsheetId })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to export to Google Sheets: ${response.statusText}`);
            }
            
            const data = await response.json();
            resultDiv.innerHTML = `
                <h4>Export Successful</h4>
                <p>Your attendance data has been exported to Google Sheets.</p>
                <p><a href="${data.spreadsheetUrl}" target="_blank" class="btn-primary">
                    <i class="fas fa-external-link-alt"></i> Open Spreadsheet
                </a></p>
            `;
            showToast('Exported to Google Sheets successfully', 'success');
        } catch (error) {
            resultDiv.innerHTML = 'Error exporting to Google Sheets';
            showToast(`Error exporting to Google Sheets: ${error.message}`, 'error');
            console.error('Error exporting to Google Sheets:', error);
        }
    }
    
    // Report function
    async function generateReport() {
        const classId = document.getElementById('report-class').value;
        const fromDate = document.getElementById('report-date-from').value;
        const toDate = document.getElementById('report-date-to').value;
        
        if (!classId || !fromDate || !toDate) {
            showToast('Please select class and date range', 'error');
            return;
        }
        
        const resultDiv = document.getElementById('report-result');
        resultDiv.innerHTML = 'Generating report...';
        
        try {
            const response = await fetch(`${API_URL}/attendance/${classId}?fromDate=${fromDate}&toDate=${toDate}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.clear();
                    showLogin();
                    showToast('Session expired, please log in again', 'error');
                    return;
                }
                throw new Error(`Failed to generate report: ${response.statusText}`);
            }
            
            const data = await response.json();
            resultDiv.innerHTML = '<h4>Attendance Report</h4>';
            const table = document.createElement('table');
            
            // Check the structure of the data and handle it accordingly
            if (data && data.length > 0) {
                // Create table header
                let tableHTML = '<thead><tr><th>Date</th><th>Attendance</th></tr></thead><tbody>';
                
                // Process data based on its structure
                if (Array.isArray(data[0].date)) {
                    // Handle case where date is an array
                    tableHTML += data.map(row => 
                        row.date.map((date, index) => 
                            `<tr><td>${date}</td><td>${row.attendance && row.attendance[index] || 'N/A'}</td></tr>`
                        ).join('')
                    ).join('');
                } else if (typeof data[0] === 'object') {
                    // Handle case where each item is a record with date and status
                    tableHTML += data.map(row => 
                        `<tr><td>${row.date || 'Unknown'}</td><td>${row.status || row.attendance || 'N/A'}</td></tr>`
                    ).join('');
                }
                
                tableHTML += '</tbody>';
                table.innerHTML = tableHTML;
            } else {
                table.innerHTML = '<thead><tr><th>Date</th><th>Attendance</th></tr></thead><tbody><tr><td colspan="2">No data available</td></tr></tbody>';
            }
            resultDiv.appendChild(table);
            showToast('Report generated successfully', 'success');
        } catch (error) {
            resultDiv.innerHTML = 'Error generating report';
            showToast(`Error generating report: ${error.message}`, 'error');
            console.error('Error generating report:', error);
        }
    }

    // Improved attendance graph function with height limit
    async function loadAttendanceGraph() {
        const classId = document.getElementById('graph-class').value;
        const fromDate = document.getElementById('graph-date-from').value;
        const toDate = document.getElementById('graph-date-to').value;
        const chartType = document.getElementById('chart-type').value;
        const canvas = document.getElementById('attendanceChart');
        const ctx = canvas.getContext('2d');

        if (!classId) {
            canvas.style.display = 'none';
            return;
        }

        // Show loading state
        canvas.style.display = 'block';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);

        try {
            const response = await fetch(`${API_URL}/attendance/${classId}?fromDate=${fromDate || ''}&toDate=${toDate || ''}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch attendance data');

            const data = await response.json();
            if (!data || data.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillText('No attendance data available', canvas.width / 2, canvas.height / 2);
                return;
            }

            // Determine data structure and process accordingly
            let studentsData = [];
            
            try {
                // Check if data is an array of students with attendance records
                if (Array.isArray(data) && data[0] && (data[0].attendance || data[0].students)) {
                    // Case 1: Each item represents a student with attendance records
                    studentsData = data.map(student => {
                        // Handle different possible data structures
                        const attendanceRecords = student.attendance || student.records || [];
                        const filteredRecords = attendanceRecords.filter(record => {
                            // Safely extract date from record
                            const recordDate = record && record.date ? 
                                new Date(record.date).toISOString().split('T')[0] : '';
                            const isValidFrom = !fromDate || recordDate >= fromDate;
                            const isValidTo = !toDate || recordDate <= toDate;
                            return recordDate && isValidFrom && isValidTo;
                        });
                        
                        // Count present/absent based on status field
                        const presentCount = filteredRecords.filter(r => 
                            r.status === 'Present' || r.status === 'present' || r.present === true).length;
                        const absentCount = filteredRecords.filter(r => 
                            r.status === 'Absent' || r.status === 'absent' || r.present === false).length;
                            
                        return {
                            name: student.name || `Student ${student.id || 'Unknown'}`,
                            presentCount,
                            absentCount,
                            details: filteredRecords.map(r => 
                                `${r.date || 'Unknown date'}: ${r.status || (r.present ? 'Present' : 'Absent')}`
                            ).join('\n') || 'No records'
                        };
                    });
                } else if (Array.isArray(data) && data[0] && data[0].date) {
                    // Case 2: Each item is a date-based record
                    // Group by student if possible, otherwise create a single aggregate entry
                    const aggregateData = {
                        present: 0,
                        absent: 0,
                        details: []
                    };
                    
                    data.forEach(record => {
                        const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : 'Unknown';
                        const isValidFrom = !fromDate || recordDate >= fromDate;
                        const isValidTo = !toDate || recordDate <= toDate;
                        
                        if (isValidFrom && isValidTo) {
                            if (record.status === 'Present' || record.present === true) {
                                aggregateData.present++;
                            } else {
                                aggregateData.absent++;
                            }
                            aggregateData.details.push(`${recordDate}: ${record.status || (record.present ? 'Present' : 'Absent')}`);
                        }
                    });
                    
                    studentsData = [{
                        name: 'Attendance Summary',
                        presentCount: aggregateData.present,
                        absentCount: aggregateData.absent,
                        details: aggregateData.details.join('\n') || 'No records'
                    }];
                } else {
                    // Fallback for unexpected data structure
                    throw new Error('Unexpected data format');
                }
            } catch (error) {
                console.error('Error processing attendance data:', error);
                // Create a fallback data point to avoid chart errors
                studentsData = [{
                    name: 'Error in data',
                    presentCount: 0,
                    absentCount: 0,
                    details: 'Could not process attendance data'
                }];
            }

            // Destroy existing chart if it exists
            if (window.attendanceChart instanceof Chart) {
                window.attendanceChart.destroy();
            }

            // Calculate dynamic height with a maximum limit
            const maxHeight = 800; // Maximum height in pixels
            const baseHeight = 300; // Minimum height
            const itemHeight = 50; // Height per student
            const dynamicHeight = Math.min(maxHeight, baseHeight + Math.min(studentsData.length, 10) * itemHeight); // Limit to 10 students for height

            // Create new chart with dynamic colors based on dark mode
            const isDarkMode = document.body.classList.contains('dark-mode');
            window.attendanceChart = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: studentsData.map(s => s.name),
                    datasets: [
                        {
                            label: 'Present',
                            data: studentsData.map(s => s.presentCount),
                            backgroundColor: '#2ecc71',
                            stack: 'Stack 0',
                            borderWidth: 1,
                            borderColor: '#27ae60'
                        },
                        {
                            label: 'Absent',
                            data: studentsData.map(s => s.absentCount),
                            backgroundColor: '#e74c3c',
                            stack: 'Stack 0',
                            borderWidth: 1,
                            borderColor: '#c0392b'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                color: isDarkMode ? '#e0e0e0' : '#333'
                            },
                            grid: {
                                color: isDarkMode ? '#444' : '#ddd'
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: { display: true, text: 'Count', color: isDarkMode ? '#e0e0e0' : '#333' },
                            ticks: {
                                color: isDarkMode ? '#e0e0e0' : '#333'
                            },
                            grid: {
                                color: isDarkMode ? '#444' : '#ddd'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: isDarkMode ? '#e0e0e0' : '#333'
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const student = studentsData[context.dataIndex];
                                    return [
                                        `${context.dataset.label}: ${context.raw}`,
                                        `Details: ${student.details}`
                                    ];
                                }
                            },
                            backgroundColor: isDarkMode ? '#333' : '#fff',
                            titleColor: isDarkMode ? '#e0e0e0' : '#333',
                            bodyColor: isDarkMode ? '#e0e0e0' : '#333',
                            borderColor: isDarkMode ? '#555' : '#ccc',
                            borderWidth: 1
                        }
                    },
                    height: dynamicHeight
                }
            });

            // Set canvas height after chart creation to ensure proper rendering
            canvas.height = dynamicHeight;
            canvas.style.height = `${dynamicHeight}px`;
            showToast('Graph updated successfully', 'success');
        } catch (error) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText('Error loading graph', canvas.width / 2, canvas.height / 2);
            showToast(`Error loading graph: ${error.message}`, 'error');
            console.error('Error loading graph:', error);
        }
    }

    // Export graph as PNG with improved error handling
    function exportGraph() {
        try {
            const canvas = document.getElementById('attendanceChart');
            if (!canvas) {
                showToast('Canvas element not found', 'error');
                return;
            }
            
            if (window.attendanceChart && typeof window.attendanceChart !== 'undefined') {
                const link = document.createElement('a');
                link.download = `attendance_graph_${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('Graph exported successfully', 'success');
            } else {
                showToast('No graph data available to export', 'error');
            }
        } catch (error) {
            console.error('Error exporting graph:', error);
            showToast(`Failed to export graph: ${error.message}`, 'error');
        }
    }

    // Placeholder for token refresh
    async function refreshToken() {
        try {
            const response = await fetch(`${API_URL}/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: localStorage.getItem('token') })
            });
            if (!response.ok) throw new Error('Failed to refresh token');
            const data = await response.json();
            localStorage.setItem('token', data.token);
            return data.token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }
});