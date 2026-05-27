# Deployment Guide - Nurse Room System

**Target:** Production deployment on port 3019  
**Database:** 10.182.1.208:1433  
**Last Updated:** 2026-05-27

---

## Step 1: Prepare Code

```bash
# Clone or pull latest code
git clone https://github.com/LSD-Team/nurse_room_system.git
cd nurse_room_system

# Verify on main branch
git checkout main
git pull origin main
```

## Step 2: Verify Environment Configuration

### Server (.env.production)
Location: `server/.env.production`

**Current Configuration:**
```
NODE_ENV=production
TZ=Asia/Bangkok

DATABASE_SERVER=10.182.1.208
DATABASE_PORT=1433
DATABASE_NAME=NURSE_ROOM
DATABASE_USER=sa
DATABASE_PASSWORD=Admin@2130

DATABASE_AUTH_SERVER=10.182.1.208
DATABASE_AUTH_PORT=1433
DATABASE_AUTH_NAME=NURSE_ROOM
DATABASE_AUTH_USER=sa
DATABASE_AUTH_PASSWORD=Admin@2130

EMAIL_SERVICE_URL=http://10.182.1.198/apis/lsd-smtp-service

APP_PORT=3019

JWT_SECRET=lsd@lkilogmL
JWT_EXP=10h

APP_ID=N/A
APP_NAME=NURSE_ROOM
APP_DESCRIPTION=Nurse Room Management System
APP_VERSION=1.0.0

JWT_SECRET_KEY=lsd@lkilogmL
```

### Client (.env.production)
Location: `client/.env.production`

**Verify API URL points to deployment server:**
```
VITE_APP_API_URL=http://<YOUR_SERVER_IP>:3019/
```

---

## Step 3: Build Application

```bash
# Navigate to server
cd server
pnpm install
pnpm build

# Navigate to client
cd ../client
pnpm install
pnpm build

# Outputs:
# - server/dist/     (NestJS production build)
# - client/dist/     (Vue static files)
```

---

## Step 4: Choose Deployment Method

### Option A: Direct Node.js (Simple)
```bash
cd server
APP_PORT=3019 node dist/src/main
```

### Option B: PM2 (Recommended - Background Process)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js at root
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nurse-room-api',
    script: './server/dist/src/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      APP_PORT: 3019
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option C: Nginx + Node.js (Production + Static Files)
```nginx
# /etc/nginx/sites-available/nurse-room-system
upstream nurse_room_api {
    server localhost:3019;
}

server {
    listen 80;
    server_name <YOUR_DOMAIN_OR_IP>;
    
    # Serve static files from client/dist
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests
    location /api {
        proxy_pass http://nurse_room_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 5: Verify Database Connection

```bash
# Health check endpoint
curl http://localhost:3019/api/health

# Swagger documentation
http://localhost:3019/api
```

---

## Step 6: Open Firewall (If Required)

### Windows
```powershell
netsh advfirewall firewall add rule name="NurseRoom" dir=in action=allow protocol=tcp localport=3019
```

### Linux
```bash
sudo ufw allow 3019/tcp
```

---

## Step 7: Monitor & Maintenance

### PM2 Commands
```bash
pm2 list                    # View all processes
pm2 logs nurse-room-api     # View logs in real-time
pm2 stop nurse-room-api     # Stop application
pm2 restart nurse-room-api  # Restart application
pm2 delete nurse-room-api   # Remove from PM2
pm2 monit                   # Monitor resources
```

---

## Deployment Checklist

- [ ] Code on main branch
- [ ] Database configuration verified (10.182.1.208:1433)
- [ ] APP_PORT set to 3019 in server/.env.production
- [ ] VITE_APP_API_URL updated in client/.env.production
- [ ] `pnpm build` successful for both server & client
- [ ] Firewall port 3019 opened
- [ ] PM2 or Node.js process started
- [ ] Health check endpoint responds
- [ ] Swagger API docs accessible
- [ ] Database connection working
- [ ] Email service integration verified

---

## Troubleshooting

### Port Already in Use
```bash
# Windows - Find process on port 3019
netstat -ano | findstr :3019
taskkill /PID <PID> /F

# Linux
lsof -i :3019
kill -9 <PID>
```

### Database Connection Failed
- Verify database server is running
- Check credentials in .env.production
- Verify firewall allows connection to 10.182.1.208:1433

### PM2 Process Exits
```bash
pm2 logs nurse-room-api    # Check error logs
```

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Port** | 3019 |
| **Database Server** | 10.182.1.208:1433 |
| **Build Command** | `pnpm build` |
| **Start Command** | `APP_PORT=3019 node dist/src/main` |
| **Swagger** | `http://localhost:3019/api` |
| **Health Check** | `http://localhost:3019/api/health` |

---

**Deploy Date:** [TO BE FILLED]  
**Deployed By:** [TO BE FILLED]  
**Status:** [TO BE FILLED]
