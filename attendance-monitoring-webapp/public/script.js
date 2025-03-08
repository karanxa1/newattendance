document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const usernameDisplay = document.getElementById('username-display');
    const roleDisplay = document.getElementById('role-display');
    const logoutBtn = document.getElementById('logout-btn');
    const adminPanel = document.getElementById('admin-panel');
    const facultyPanel = document.getElementById('faculty-panel');

    const API_URL = 'http://localhost:3000/api';
    document.getElementById('attendance-date').valueAsDate = new Date();

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    if (token && role) showApp(username, role);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (!username || !password) return alert('Please fill in all fields');
        if (password.length < 6) return alert('Password must be at least 6 characters');
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) throw new Error('Invalid credentials');
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);
            showApp(username, data.role);
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        showLogin();
    });

    function showApp(username, role) {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        usernameDisplay.textContent = username;
        roleDisplay.textContent = `(${role})`;
        if (role === 'admin') {
            adminPanel.classList.remove('hidden');
            loadUsers();
            loadClasses('admin');
            setupTabNavigation();
        } else if (role === 'faculty') {
            facultyPanel.classList.remove('hidden');
            loadClasses('faculty');
        }
    }

    function showLogin() {
        appContainer.classList.add('hidden');
        adminPanel.classList.add('hidden');
        facultyPanel.classList.add('hidden');
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

    async function loadUsers() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const users = await response.json();
            usersList.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="edit-user-btn" data-id="${user.id}">Edit</button>
                        <button class="delete-user-btn" data-id="${user.id}">Delete</button>
                    </td>
                `;
                row.querySelector('.edit-user-btn').addEventListener('click', () => editUser(user));
                row.querySelector('.delete-user-btn').addEventListener('click', () => deleteUser(user.id));
                usersList.appendChild(row);
            });
        } catch (error) {
            usersList.innerHTML = '<tr><td colspan="4">Error loading users</td></tr>';
            console.error('Error loading users:', error);
        }
    }

    async function loadClasses(userRole) {
        const classesList = document.getElementById('classes-list');
        if (userRole === 'admin') classesList.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
        try {
            const response = await fetch(`${API_URL}/classes`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch classes');
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
                            <button class="edit-class-btn" data-id="${cls.id}">Edit</button>
                            <button class="delete-class-btn" data-id="${cls.id}">Delete</button>
                        </td>
                    `;
                    // Placeholder for edit/delete class functionality
                    classesList.appendChild(row);
                });
                const reportClassSelect = document.getElementById('report-class');
                reportClassSelect.innerHTML = '<option value="">Select a class</option>';
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    reportClassSelect.appendChild(option);
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
        }
    }

    async function loadClassStudents(classId) {
        const attendanceButtons = document.getElementById('attendance-buttons');
        attendanceButtons.innerHTML = 'Loading students...';
        try {
            const response = await fetch(`${API_URL}/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch students');
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
        }
    }

    async function saveAttendance(classId) {
        try {
            const buttons = document.querySelectorAll('.student-btn');
            const presentStudents = Array.from(buttons)
                .filter(btn => btn.dataset.present === 'true')
                .map(btn => btn.dataset.id);
            const date = document.getElementById('attendance-date').value;
            if (!date) return alert('Please select a date');
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ classId, date, presentStudents })
            });
            if (!response.ok) throw new Error('Failed to save attendance');
            alert('Attendance saved successfully');
        } catch (error) {
            alert('Error saving attendance: ' + error.message);
            console.error('Error saving attendance:', error);
        }
    }

    document.getElementById('add-user-btn').addEventListener('click', () => {
        document.getElementById('user-form-container').classList.remove('hidden');
        document.getElementById('user-form').reset();
        document.getElementById('new-password').required = true; // For new user
    });

    document.getElementById('cancel-user-btn').addEventListener('click', () => {
        document.getElementById('user-form-container').classList.add('hidden');
    });

    document.getElementById('user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('role').value;
        if (!username || (password && password.length < 6)) {
            return alert('Username is required and password must be at least 6 characters');
        }
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });
            if (!response.ok) throw new Error('Failed to create user');
            document.getElementById('user-form-container').classList.add('hidden');
            loadUsers();
            alert('User created successfully');
        } catch (error) {
            alert('Error creating user: ' + error.message);
            console.error('Error creating user:', error);
        }
    });

    function editUser(user) {
        const formContainer = document.getElementById('user-form-container');
        formContainer.classList.remove('hidden');
        document.getElementById('new-username').value = user.username;
        document.getElementById('new-password').value = '';
        document.getElementById('new-password').required = false; // Optional for edit
        document.getElementById('role').value = user.role;
        document.getElementById('user-form').onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            const role = document.getElementById('role').value;
            if (!username) return alert('Username is required');
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
                alert('User updated successfully');
            } catch (error) {
                alert('Error updating user: ' + error.message);
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
            alert('User deleted successfully');
        } catch (error) {
            alert('Error deleting user: ' + error.message);
            console.error('Error deleting user:', error);
        }
    }

    document.getElementById('add-class-btn').addEventListener('click', () => {
        document.getElementById('class-form-container').classList.remove('hidden');
        document.getElementById('class-form').reset();
    });

    document.getElementById('cancel-class-btn').addEventListener('click', () => {
        document.getElementById('class-form-container').classList.add('hidden');
    });

    document.getElementById('class-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('class-name').value;
        const strength = document.getElementById('class-strength').value;
        if (!name || strength < 1) return alert('Please provide a valid class name and strength');
        try {
            const response = await fetch(`${API_URL}/admin/classes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, strength })
            });
            if (!response.ok) throw new Error('Failed to add class');
            document.getElementById('class-form-container').classList.add('hidden');
            loadClasses('admin');
            alert('Class added successfully');
        } catch (error) {
            alert('Error adding class: ' + error.message);
            console.error('Error adding class:', error);
        }
    });

    document.getElementById('generate-report-btn').addEventListener('click', async () => {
        const classId = document.getElementById('report-class').value;
        const fromDate = document.getElementById('report-date-from').value;
        const toDate = document.getElementById('report-date-to').value;
        if (!classId || !fromDate || !toDate) return alert('Please select class and date range');
        const resultDiv = document.getElementById('report-result');
        resultDiv.innerHTML = 'Generating report...';
        try {
            const response = await fetch(`${API_URL}/admin/attendance/${classId}?fromDate=${fromDate}&toDate=${toDate}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to generate report');
            const data = await response.json();
            resultDiv.innerHTML = '<h4>Attendance Report</h4>';
            const table = document.createElement('table');
            table.innerHTML = `
                <thead><tr><th>Date</th><th>Attendance</th></tr></thead>
                <tbody>${data.map(row => `<tr><td>${row.date}</td><td>${row.attendance.join(', ')}</td></tr>`).join('')}</tbody>
            `;
            resultDiv.appendChild(table);
        } catch (error) {
            resultDiv.innerHTML = 'Error generating report';
            alert('Error generating report: ' + error.message);
            console.error('Error generating report:', error);
        }
    });
});