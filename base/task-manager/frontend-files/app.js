let taskCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadPodInfo();
    loadTasks();
    setupEventListeners();
});

async function loadPodInfo() {
    try {
        const response = await fetch('/api/health');
        const health = await response.json();
        document.getElementById('podInfo').textContent = 'Pod: ' + (health.hostname || 'unknown');
    } catch (error) {
        document.getElementById('podInfo').textContent = 'Pod info unavailable';
    }
}

function showMessage(text, type = 'error') {
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message ' + type;
    messageDiv.textContent = text;
    
    setTimeout(() => {
        messageDiv.className = '';
        messageDiv.textContent = '';
    }, 4000);
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        const tasks = await response.json();
        taskCount = tasks.length;
        
        const tasksContainer = document.getElementById('tasks');
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = '<div class="empty-state">No tasks yet. Add your first task above!</div>';
        } else {
            const tasksHtml = tasks.map(task => 
                '<div class="task">' +
                    '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
                    '<div class="task-meta">ID: ' + task.id + ' • ' + formatDate(task.created_at) + '</div>' +
                '</div>'
            ).join('');
            tasksContainer.innerHTML = tasksHtml;
        }
        
        showMessage('Loaded ' + tasks.length + ' tasks', 'success');
    } catch (error) {
        document.getElementById('tasks').innerHTML = 
            '<div class="empty-state">Error loading tasks: ' + error.message + '</div>';
        showMessage('Failed to load tasks: ' + error.message, 'error');
    }
}

async function addTask() {
    const input = document.getElementById('taskInput');
    const title = input.value.trim();
    
    if (!title) {
        showMessage('Please enter a task description', 'error');
        input.focus();
        return;
    }
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, completed: false })
        });
        
        if (response.ok) {
            input.value = '';
            showMessage('Task added successfully!', 'success');
            setTimeout(loadTasks, 300);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'HTTP ' + response.status);
        }
    } catch (error) {
        showMessage('Failed to add task: ' + error.message, 'error');
    }
}

async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const health = await response.json();
        showMessage(
            'Status: ' + health.status + ' • ' +
            'Pod: ' + health.hostname + ' • ' +
            'Requests: ' + (health.requests || 0),
            'success'
        );
    } catch (error) {
        showMessage('Health check failed: ' + error.message, 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'Just now';
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Just now';
    }
}

function setupEventListeners() {
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadTasks();
        }
    }, 30000);
}
