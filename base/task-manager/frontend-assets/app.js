let currentStats = { tasks: 0, requests: 0 };

// Initialize pod info
document.addEventListener('DOMContentLoaded', function() {
  fetch('/api/health')
    .then(r => r.json())
    .then(data => {
      document.getElementById('podInfo').textContent = 'Running on Pod: ' + (data.hostname || 'unknown');
    })
    .catch(() => {
      document.getElementById('podInfo').textContent = 'Pod info unavailable';
    });
});

function showMessage(text, type = 'error') {
  const messageDiv = document.getElementById('message');
  messageDiv.className = type;
  messageDiv.innerHTML = text;
  setTimeout(() => {
    messageDiv.innerHTML = '';
    messageDiv.className = '';
  }, 4000);
}

function updateStats() {
  document.getElementById('taskCount').textContent = currentStats.tasks;
  document.getElementById('requestCount').textContent = currentStats.requests;
}

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    
    const tasks = await response.json();
    currentStats.tasks = tasks.length;
    
    const tasksHtml = tasks.map(task => 
      '<div class="task">' +
        '<div class="task-title">' + escapeHtml(task.title) + '</div>' +
        '<div class="task-meta">ID: ' + task.id + ' • Created: ' + formatDate(task.created_at) + '</div>' +
      '</div>'
    ).join('');
    
    document.getElementById('tasks').innerHTML = tasksHtml || '<div class="loading">No tasks yet. Create your first task above!</div>';
    updateStats();
    showMessage('Tasks loaded successfully (' + tasks.length + ' items)', 'success');
  } catch(error) {
    document.getElementById('tasks').innerHTML = '<div class="error">Error loading tasks: ' + error.message + '</div>';
    showMessage('Error loading tasks: ' + error.message, 'error');
  }
}

async function addTask() {
  const input = document.getElementById('taskInput');
  const title = input.value.trim();
  if (!title) { 
    showMessage('Please enter a task title', 'error'); 
    input.focus();
    return; 
  }
  
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title: title, completed: false})
    });
    
    if (response.ok) {
      input.value = '';
      showMessage('Task "' + title + '" added successfully!', 'success');
      setTimeout(loadTasks, 500);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'HTTP ' + response.status);
    }
  } catch(error) {
    showMessage('Error adding task: ' + error.message, 'error');
  }
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const health = await response.json();
    currentStats.requests = health.requests || 0;
    updateStats();
    
    showMessage(
      'Health Check: ' + health.status + 
      ' • DB: ' + health.database + 
      ' • Pod: ' + health.hostname + 
      ' • Requests: ' + health.requests, 
      'success'
    );
  } catch(error) {
    showMessage('Health check failed: ' + error.message, 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch(e) {
    return 'Unknown';
  }
}

// Enter key support
document.getElementById('taskInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') addTask();
});

// Auto-load on startup
loadTasks();

// Auto-refresh every 30 seconds
setInterval(checkHealth, 30000);
