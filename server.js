const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI CDSS BHYT - Hệ Thống Giám Định</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px; max-width: 600px; text-align: center; }
        h1 { color: #333; margin-bottom: 10px; font-size: 2.5em; }
        .subtitle { color: #666; margin-bottom: 30px; font-size: 1.1em; }
        .status { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status-item { margin: 10px 0; font-size: 1.1em; }
        .status-item strong { color: #667eea; }
        .status-item span { float: right; color: #28a745; font-weight: bold; }
        .links { margin: 30px 0; }
        a { display: inline-block; margin: 10px; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; transition: all 0.3s ease; font-weight: bold; font-size: 1em; }
        a:hover { background: #764ba2; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        .info { background: #fff8e1; padding: 15px; border-radius: 8px; margin-top: 20px; color: #333; font-size: 0.95em; border-left: 4px solid #ffc107; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 AI CDSS BHYT</h1>
        <p class="subtitle">Hệ Thống Hỗ Trợ Giám Định Bảo Hiểm Y Tế</p>

        <div class="status">
          <div class="status-item"><strong>🖥️ Server:</strong> <span>Online ✓</span></div>
          <div class="status-item"><strong>🌐 IP Address:</strong> <span>${getLocalIP()}</span></div>
          <div class="status-item"><strong>🔌 Port:</strong> <span>${PORT}</span></div>
          <div class="status-item"><strong>🐍 Python API:</strong> <span>8000 ✓</span></div>
          <div class="status-item"><strong>Hostname:</strong> <span>${os.hostname()}</span></div>
        </div>

        <div class="links">
          <h3 style="margin-bottom: 15px; color: #333;">🚀 Ứng Dụng</h3>
          <a href="/app">📱 Web Application</a>
          <a href="http://${getLocalIP()}:8000/docs" target="_blank">📡 API Docs</a>
        </div>

        <div class="info">
          <strong>💡 Hướng dẫn:</strong><br>
          ✅ Truy cập từ máy khác:<br>
          <code>http://${getLocalIP()}:${PORT}</code><br><br>
          ✅ Python API (Kiểm tra):<br>
          <code>http://${getLocalIP()}:8000</code>
        </div>

        <div class="footer">
          <p>AI CDSS BHYT v1.0 | Kiểm tra tự động hóa | © 2026</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Proxy cho Expo web (nếu cần)
app.get('/app', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI CDSS BHYT - Ứng Dụng</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
        #root { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script>
        // Redirect đến Expo dev server hoặc build
        // Nếu muốn serve ứng dụng thật, thêm build path ở đây
        document.body.innerHTML = \`
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; font-family: sans-serif;">
            <div>
              <h1>📱 CDSS BHYT - Ứng Dụng Giám Định</h1>
              <p style="font-size: 1.2em; margin: 20px 0;">
                Ứng dụng đang tải...<br>
                Nếu không tải, <a href="http://${getLocalIP()}:8000/docs" style="color: #ffd700; text-decoration: none; font-weight: bold;">vào API</a> để test
              </p>
              <p style="font-size: 0.9em; margin-top: 30px;">
                💡 Gợi ý: Sử dụng Postman để test API<br>
                📡 Endpoint: http://${getLocalIP()}:8000
              </p>
            </div>
          </div>
        \`;
      </script>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: os.hostname(),
    ip: getLocalIP(),
    port: PORT
  });
});

// API redirect
app.use('/api', (req, res) => {
  res.json({
    message: 'API is running on port 8000',
    docs: `http://${getLocalIP()}:8000/docs`,
    contact: 'AI Service on port 8000'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('❌ Trang không tìm thấy. <a href="/">← Quay lại</a>');
});

// Helper function to get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`
╔════════════════════════════════════════════════════╗
║     🏥 AI CDSS BHYT - Hệ Thống Giám Định         ║
╚════════════════════════════════════════════════════╝

✅ Server đang chạy:
   🌐 http://0.0.0.0:${PORT}
   🔗 http://${ip}:${PORT}

✅ Truy cập từ máy khác (nội bộ):
   http://${ip}:${PORT}

✅ Python API (port 8000):
   http://${ip}:8000
   http://${ip}:8000/docs (Swagger)

📝 Hostname: ${os.hostname()}

🛑 Bấm Ctrl+C để dừng server
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server đang dừng...');
  server.close(() => {
    console.log('✅ Server đã dừng');
    process.exit(0);
  });
});
