//  ----- 📖 Library 📖 -----
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  // APP_NAME
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const appName =
      this.configService.get<string>('APP_NAME') || 'Template Web Stack 2025';

    // Create a beautiful HTML welcome page
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName} - API Server</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background: linear-gradient(135deg, #0f172a, #1e293b);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        .container {
            max-width: 800px;
            text-align: center;
            padding: 2rem;
            background-color: rgba(30, 41, 59, 0.7);
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 700;
        }
        .logo {
            font-size: 5rem;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }
        .status {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-weight: 600;
            margin: 1rem 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .info {
            margin-top: 2rem;
            padding: 1rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 0.5rem;
            display: inline-block;
        }
        .powered-by {
            margin-top: 3rem;
            opacity: 0.7;
            font-size: 0.8rem;
        }
        .date-time {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
            font-size: 0.8rem;
            opacity: 0.7;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
            }
        }
        
        @media (max-width: 600px) {
            h1 {
                font-size: 2rem;
            }
            .logo {
                font-size: 3rem;
            }
            .container {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>${appName}</h1>
        <div class="status">API Server Running</div>
        
        <div class="info">
            Server Time: <span id="datetime"></span>
        </div>
        
        <div class="powered-by">
            Powered by IT Section/LSD
        </div>
    </div>
    
    <div class="date-time" id="current-time"></div>
    
    <script>
        // Update the datetime
        function updateDateTime() {
            const now = new Date();
            document.getElementById('datetime').textContent = now.toLocaleString();
            document.getElementById('current-time').textContent = now.toLocaleString();
        }
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
    </script>
</body>
</html>
    `;
  }
}
