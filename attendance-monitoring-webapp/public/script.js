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

    // Config and global variables
    const API_URL = 'http://localhost:3000/api';
    document.getElementById('attendance-date').valueAsDate = new Date();

    // Check stored authentication
    init();

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Admin event listeners
    document.getElementById('add-user-btn').addEventListener('click', showUserForm);
    document.getElementById('cancel-user-btn').addEventListener('click', hideUserForm);
    document.getElementById('user-form').addEventListener('submit', createUser);
    
    document.getElementById('add-class-btn').addEventListener('click', showClassForm);
    document.getElementById('cancel-class-btn').addEventListener('click', hideClassForm);
    document.getElementById('class-form').addEventListener('submit', createClass);
    
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);

    // Initialize the application
    function init() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username');
        if (token && role && username) showApp(username, role);

        // Setup tab navigation for admin panel
        setupTabNavigation();
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
            
            if (!response.ok) throw new Error('Invalid credentials');
            
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', username);
            
            showApp(username, data.role);
            showToast(`Welcome, ${username}!`, 'success');
        } catch (error) {
            showToast(`Login failed: ${error.message}`, 'error');
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
            
            if (!response.ok) throw new Error('Failed to fetch users');
            
            const users = await response.json();
            
            if (users.length === 0) {
                usersList.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
                return;
            }
            
            usersList.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td><span class="badge badge-${user.role}">${user.role}</span></td>
                    <td>
                        <button class="edit-user-btn" data-id="${user.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="delete-user-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                    </td>
                `;
                
                row.querySelector('.edit-user-btn').addEventListener('click', () => editUser(user));
                row.querySelector('.delete-user-btn').addEventListener('click', () => deleteUser(user.id));
                
                usersList.appendChild(row);
            });
        } catch (error) {
            usersList.innerHTML = '<tr><td colspan="4">Error loading users</td></tr>';
            console.error('Error loading users:', error);
            showToast('Error loading users', 'error');
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
        
        if (!username || !role) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (password && password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
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
            
            hideUserForm();
            loadUsers();
            showToast('User created successfully', 'success');
        } catch (error) {
            showToast(`Error creating user: ${error.message}`, 'error');
            console.error('Error creating user:', error);
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
                            <button class="edit-class-btn" data-id="${cls.id}"><i class="fas fa-edit"></i> Edit</button>
                            <button class="delete-class-btn" data-id="${cls.id}"><i class="fas fa-trash-alt"></i> Delete</button>
                        </td>
                    `;
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
            showToast('Error loading classes', 'error');
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

        // DOM elements
        const form = document.getElementById('class-form');
        const nameInput = document.getElementById('class-name');
        const strengthInput = document.getElementById('class-strength');
        const submitButton = form.querySelector('button[type="submit"]');
        const name = nameInput.value.trim();
        const strength = parseInt(strengthInput.value);

        // Validation with immediate feedback
        let isValid = true;

        if (!name) {
            showToast('Class name is required', 'error');
            nameInput.classList.add('error');
            nameInput.focus();
            isValid = false;
        } else if (name.length > 50) {
            showToast('Class name must be 50 characters or less', 'error');
            nameInput.classList.add('error');
            isValid = false;
        } else if (!/^[a-zA-Z0-9\s-]+$/.test(name)) {
            showToast('Class name can only contain letters, numbers, spaces, or hyphens', 'error');
            nameInput.classList.add('error');
            isValid = false;
        } else {
            nameInput.classList.remove('error');
        }

        if (isNaN(strength) || strength < 1 || strength > 1000) {
            showToast('Strength must be a number between 1 and 1000', 'error');
            strengthInput.classList.add('error');
            if (isValid) strengthInput.focus();
            isValid = false;
        } else {
            strengthInput.classList.remove('error');
        }

        if (!isValid) return;

        // Lock form and show progress
        const originalButtonContent = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        form.classList.add('submitting');
        
        let lastAddedClass = null;
        let response;
        let data;

        try {
            // Make API request
            response = await fetch(`${API_URL}/admin/classes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, strength })
            });

            // Parse response
            data = await response.json();

            // Check for errors
            if (!response.ok) {
                const errorMsg = data.message || 'Failed to add class';
                throw new Error(`${errorMsg}${data.details ? ` - ${data.details}` : ''}`);
            }

            // Success handling
            lastAddedClass = { id: data.id, name, strength };
            hideClassForm();
            loadClasses('admin');
            showToastWithUndo(
                `Class "${name}" added successfully with ${strength} students`,
                'success',
                async () => await undoClassCreation(lastAddedClass.id)
            );
            form.reset();
        } catch (error) {
            // Enhanced error handling
            const statusCode = response?.status || 'Unknown';
            showToast(`Error adding class: ${error.message}`, 'error');
            console.error('Class creation failed:', {
                message: error.message,
                status: statusCode,
                responseData: data || 'No response data',
                request: { name, strength },
                timestamp: new Date().toISOString()
            });
        } finally {
            // Reset form state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            form.classList.remove('submitting');
        }
    }

    // Undo class creation
    async function undoClassCreation(classId) {
        try {
            const response = await fetch(`${API_URL}/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to undo class creation');
        } catch (error) {
            showToast(`Error undoing class creation: ${error.message}`, 'error');
            console.error('Undo error:', error);
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
            showToast('Error loading students', 'error');
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
            
            if (!response.ok) throw new Error('Failed to save attendance');
            
            showToast('Attendance saved successfully', 'success');
        } catch (error) {
            showToast(`Error saving attendance: ${error.message}`, 'error');
            console.error('Error saving attendance:', error);
        }
    }

    // Report functions
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
            showToast('Report generated successfully', 'success');
        } catch (error) {
            resultDiv.innerHTML = 'Error generating report';
            showToast(`Error generating report: ${error.message}`, 'error');
            console.error('Error generating report:', error);
        }
    }
});