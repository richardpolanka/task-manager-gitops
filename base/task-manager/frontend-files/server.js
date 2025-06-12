const http = require('http');

const server = http.createServer((req, res) => {
  const path = require('url').parse(req.url, true).pathname;
  
  if (path === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
    <html>
    <head>
      <title>GitOps Task Manager v3.0</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          margin: 0; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          max-width: 900px; 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          margin: 20px;
        }
        h1 { 
          color: #333; 
          text-align: center; 
          margin-bottom: 10px;
          font-size: 2.5em;
          font-weight: 300;
        }
        .pod { 
          text-align: center; 
          color: #888; 
          margin-bottom: 30px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          font-family: monospace;
        }
        .controls { 
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        input { 
          padding: 12px 16px; 
          border: 2px solid #e1e5e9; 
          border-radius: 8px; 
          width: 350px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 16px;
          font-weight: 500;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .task { 
          padding: 20px; 
          margin: 15px 0; 
          background: #f8f9fa; 
          border-left: 5px solid #667eea; 
          border-radius: 8px;
          transition: transform 0.2s;
        }
        .task:hover {
          transform: translateX(5px);
        }
        .error { 
          color: #e74c3c; 
          background: #fadbd8; 
          padding: 15px; 
          border-radius: 8px;
          border-left: 5px solid #e74c3c;
          margin: 15px 0;
        }
        .success { 
          color: #27ae60; 
          background: #d5f4e6; 
          padding: 15px; 
          border-radius: 8px;
          border-left: 5px solid #27ae60;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>íº€ GitOps Task Manager</h1>
        <div class="pod">Pod: ${process.env.HOSTNAME || 'unknown'}</div>
        
        <div class="controls">
          <input type="text" id="taskInput" placeholder="Enter your new task...">
          <button onclick="addTask()">Add Task</button>
          <button onclick="loadTasks()">Refresh</button>
          <button onclick="checkHealth()">Health Check</button>
        </div>
        
        <div id="message"></div>
        <div id="tasks">Loading tasks...</div>
      </div>
      
      <script>
        function showMessage(text, type) {
          const messageDiv = document.getElementById('message');
          messageDiv.className = type;
          messageDiv.innerHTML = text;
          setTimeout(() => {
            messageDiv.innerHTML = '';
            messageDiv.className = '';
          }, 4000);
        }
        
        async function loadTasks() {
          try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            const html = tasks.map(t => 
              '<div class="task"><strong>' + t.title + '</strong> <small>(ID: ' + t.id + ')</small></div>'
            ).join('');
            document.getElementById('tasks').innerHTML = html || '<p>No tasks yet</p>';
            showMessage('Tasks loaded (' + tasks.length + ' items)', 'success');
          } catch(error) {
            showMessage('Error: ' + error.message, 'error');
          }
        }
        
        async function addTask() {
          const input = document.getElementById('taskInput');
          const title = input.value.trim();
          if (!title) return;
          
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({title: title, completed: false})
            });
            
            if (response.ok) {
              input.value = '';
              showMessage('Task added!', 'success');
              setTimeout(loadTasks, 500);
            } else {
              throw new Error('HTTP ' + response.status);
            }
          } catch(error) {
            showMessage('Error: ' + error.message, 'error');
          }
        }
        
        async function checkHealth() {
          try {
            const response = await fetch('/api/health');
            const health = await response.json();
            showMessage('Health: ' + health.status + ', Pod: ' + health.hostname + ', Requests: ' + health.requests, 'success');
          } catch(error) {
            showMessage('Health failed: ' + error.message, 'error');
          }
        }
        
        document.getElementById('taskInput').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') addTask();
        });
        
        loadTasks();
      </script>
    </body>
    </html>
    `);
  } else if (path.startsWith('/api/')) {
    const options = {
      hostname: 'task-api-service',
      port: 3001,
      path: path.replace('/api', ''),
      method: req.method,
      headers: req.headers
    };
    
    const apiReq = http.request(options, (apiRes) => {
      res.writeHead(apiRes.statusCode, apiRes.headers);
      apiRes.pipe(res);
    });
    
    apiReq.on('error', () => {
      res.writeHead(500);
      res.end('API Error');
    });
    
    req.pipe(apiReq);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Frontend v3.0 running on port 3000');
});
