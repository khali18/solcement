# SOL CEMENT - Deployment Guide for Beginners

This guide will walk you through deploying your SOL CEMENT construction materials management system step by step.

## 📋 Prerequisites

Before you start, make sure you have:
- A server or hosting account (VPS, cloud hosting, etc.)
- Node.js installed on your server (version 16 or higher)
- MongoDB database access (local or cloud-based)
- Basic understanding of command line
- Your project files ready for deployment

---

## 🗄️ Step 1: Backend Deployment

### 1.1 Prepare Your Server Environment

```bash
# Update your server (Ubuntu/Debian example)
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install MongoDB (if using local database)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 1.2 Upload Backend Files

```bash
# Create a directory for your application
sudo mkdir -p /var/www/sol-cement
sudo chown $USER:$USER /var/www/sol-cement
cd /var/www/sol-cement

# Upload your backend files (using SCP, FTP, or Git)
# Example using Git:
git clone <your-repo-url> .
# Or upload the backend folder manually
```

### 1.3 Configure Backend Environment

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
```

**Edit your `.env` file with your production settings:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sol-cement-prod
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
```

### 1.4 Test Backend Locally

```bash
# Start the backend server
npm start

# Test if it's working (in another terminal)
curl http://localhost:5000/api/auth/login
# Should return a JSON response
```

### 1.5 Set Up Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 configuration file
nano ecosystem.config.js
```

**Add this to your `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'sol-cement-backend',
    script: 'server.js',
    cwd: '/var/www/sol-cement/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/sol-cement/backend-error.log',
    out_file: '/var/log/sol-cement/backend-out.log',
    log_file: '/var/log/sol-cement/backend-combined.log',
    time: true
  }]
};
```

### 1.6 Start Backend with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/sol-cement
sudo chown $USER:$USER /var/log/sol-cement

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

---

## 🌐 Step 2: Frontend Deployment

### 2.1 Build Frontend for Production

```bash
# Navigate to frontend directory
cd /var/www/sol-cement/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

### 2.2 Set Up Web Server (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration for your app
sudo nano /etc/nginx/sites-available/sol-cement
```

**Add this Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend static files
    location / {
        root /var/www/sol-cement/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### 2.3 Enable the Site

```bash
# Enable your site
sudo ln -s /etc/nginx/sites-available/sol-cement /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 3: SSL Certificate (HTTPS)

### 3.1 Install Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### 3.2 Get SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts to configure HTTPS
```

### 3.3 Auto-Renew SSL

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 Step 4: Database Setup

### 4.1 Create Production Database

```bash
# Connect to MongoDB
mongo

# Create database and user
use sol-cement-prod
db.createUser({
  user: "solcement",
  pwd: "your-secure-password",
  roles: [
    { role: "readWrite", db: "sol-cement-prod" }
  ]
})

# Exit MongoDB
exit
```

### 4.2 Update Backend Environment

```bash
# Update your .env file with new database credentials
nano /var/www/sol-cement/backend/.env
```

**Update MongoDB URI:**
```env
MONGODB_URI=mongodb://solcement:your-secure-password@localhost:27017/sol-cement-prod
```

### 4.3 Restart Backend

```bash
pm2 restart sol-cement-backend
```

---

## 📊 Step 5: Monitor Your Application

### 5.1 Check PM2 Status

```bash
# Check running processes
pm2 status

# View logs
pm2 logs sol-cement-backend

# Monitor performance
pm2 monit
```

### 5.2 Check Nginx Status

```bash
# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 5.3 Check Database

```bash
# Check MongoDB status
sudo systemctl status mongod

# Connect and verify data
mongo sol-cement-prod -u solcement -p
```

---

## 🚨 Step 6: Security Best Practices

### 6.1 Firewall Setup

```bash
# Install UFW firewall
sudo apt install ufw -y

# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

### 6.2 Update System Regularly

```bash
# Set up automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 6.3 Backup Your Data

```bash
# Create backup script
sudo nano /usr/local/bin/backup-sol-cement.sh
```

**Add this backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/sol-cement"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --host localhost --port 27017 --db sol-cement-prod --out $BACKUP_DIR/mongodb_$DATE

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/sol-cement

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make script executable
sudo chmod +x /usr/local/bin/backup-sol-cement.sh

# Add to cron for daily backups at 2 AM
sudo crontab -e
# Add this line:
# 0 2 * * * /usr/local/bin/backup-sol-cement.sh
```

---

## ✅ Step 7: Final Verification

### 7.1 Test Your Application

1. **Visit your website**: `https://your-domain.com`
2. **Test login**: Use your admin credentials
3. **Test all features**: Create sales, add customers, etc.
4. **Check mobile responsiveness**: Test on phone/tablet

### 7.2 Performance Check

```bash
# Check server resources
free -h
df -h
top

# Check application logs for errors
pm2 logs sol-cement-backend --err
```

---

## 🆘 Troubleshooting Common Issues

### Backend Not Starting
```bash
# Check logs
pm2 logs sol-cement-backend

# Check MongoDB connection
mongo sol-cement-prod -u solcement -p

# Restart services
pm2 restart sol-cement-backend
sudo systemctl restart mongod
```

### Frontend Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongo --host localhost --port 27017 -u solcement -p sol-cement-prod
```

---

## 📞 Support & Maintenance

### Regular Tasks (Weekly)
- Check application logs for errors
- Monitor server performance
- Update security patches
- Verify backups are working

### Regular Tasks (Monthly)
- Update Node.js and npm packages
- Review and rotate SSL certificates
- Clean up old logs and temporary files
- Performance optimization

### Emergency Contacts
- Your hosting provider support
- Domain registrar (for DNS issues)
- SSL certificate provider

---

## 🎉 Congratulations!

Your SOL CEMENT system is now deployed and running in production! 

**What you have:**
- ✅ Backend API running on port 5000
- ✅ Frontend accessible via HTTPS
- ✅ Database secured with authentication
- ✅ Process management with PM2
- ✅ SSL certificate for security
- ✅ Automated backups
- ✅ Monitoring and logging

**Next Steps:**
1. Share the URL with your team
2. Train users on the system
3. Monitor performance regularly
4. Keep software updated

Your construction materials management system is ready for business! 🏗️
