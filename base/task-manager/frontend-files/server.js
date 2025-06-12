const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    const path = require('url').parse(req.url, true).pathname;
    
    if (path === '/' || path === '/index.html') {
        res.setHeader('Content-Type', 'text/html');
        res.writeHead(200);
        res.end(fs.readFileSync('/app/static/index.html'));
    } else if (path === '/styles.css') {
        res.setHeader('Content-Type', 'text/css');
        res.writeHead(200);
        res.end(fs.readFileSync('/app/static/styles.css'));
    } else if (path === '/app.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.writeHead(200);
        res.end(fs.readFileSync('/app/static/app.js'));
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
    console.log('Static file server running on port 3000');
});
