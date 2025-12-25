# 🚀 AI Verse Platform - Quick Start Guide

## ✅ What's Been Built

Your complete AI Verse platform is ready! Here's what you have:

- ✅ **Backend API** - Running on `http://localhost:5000`
- ✅ **Frontend** - Running on `http://localhost:5173` 
- ✅ **Database** - SQLite with all tables
- ✅ **Authentication** - JWT-based with RBAC
- ✅ **All Modules** - Events, Gallery, Team, Live Events, etc.

##⚠️ Current Issue & Fix

The login is failing with "Account is deactivated" because the backend is using an old database file that was created during testing with `is_active=0`.

### 🔧 **Quick Fix - Follow These Steps:**

1. **Stop the Backend Server**:
   ```powershell
   # Press Ctrl+C in the backend terminal window
   # (or close the terminal)
   ```

2. **Delete the Old Database**:
   ```powershell
   cd "d:\AI VERSE\backend"
   Remove-Item database\aiverse.db -Force
   ```

3. **Restart Backend** (this will create fresh database with active admin):
   ```powershell
   npm start
   ```

4. **Access the Website**:
   - Frontend: http://localhost:5173
   - Admin Login: http://localhost:5173/admin/login
   - Credentials: `admin` / `Admin@123`

---

## 📋 Full Manual Setup (If Above Doesn't Work)

### Step 1: Install Backend Dependencies
```powershell
cd "d:\AI VERSE\backend"
npm install
```

### Step 2: Start Backend
```powershell
cd "d:\AI VERSE\backend"
npm start
```

You should see:
```
🚀 AI Verse Backend Server Started
📍 Server running on: http://localhost:5000
✅ Database tables initialized successfully
✅ Default super admin created (username: admin, password: Admin@123)
```

### Step 3: Install Frontend Dependencies (If Not Done)
```powershell
cd "d:\AI VERSE\frontend"
npm install
```

### Step 4: Start Frontend
```powershell
cd "d:\AI VERSE\frontend"
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 🌐 Access Your Website

### Public Website
- **Home**: http://localhost:5173
- **About**: http://localhost:5173/about
- **Events**: http://localhost:5173/events  
- **Gallery**: http://localhost:5173/gallery
- **Team**: http://localhost:5173/team

### Admin Panel  
- **Login**: http://localhost:5173/admin/login
- **Credentials**: 
  - Username: `admin`
  - Password: `Admin@123`

**⚠️ CHANGE PASSWORD AFTER FIRST LOGIN!**

---

## 🎯 After Successful Login

You'll land on the **Dashboard** at `/admin/dashboard` where you can:

1. View statistics (events, gallery items, team members)
2. Navigate to different modules via the sidebar:
   - 🏠 Home Page Manager
   - ℹ️ About Page Manager
   - 📅 Events Manager
   - 🔴 Live Events Controller
   - 🖼️ Gallery Manager
   - 👥 Team Manager
   - 🔐 Admin Management (Super Admin only)

---

## 🐛 Troubleshooting

### Issue: "Account is deactivated" error

**Solution**: The old database file is being used. Follow these steps:

1. Stop backend server (Ctrl+C)
2. Delete database:
   ```powershell
   Remove-Item "d:\AI VERSE\backend\database\aiverse.db" -Force
   ```
3. Restart backend: `npm start`
4. Try login again

### Issue: Port already in use

**Backend (Port 5000)**:
```powershell
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Frontend (Port 5173)**:
```powershell
# Vite will automatically use next available port (5174, 5175, etc.)
# Just use whatever port it shows in the terminal
```

### Issue: Cannot delete database - file in use

```powershell
# Stop all Node processes
taskkill /IM node.exe /F

# Then delete database
Remove-Item "d:\AI VERSE\backend\database\aiverse.db" -Force

# Restart backend
cd "d:\AI VERSE\backend"
npm start
```

---

## 🎨 Admin Panel Features

Once logged in, you can:

### Create Team Admins
1. Go to **Admin Management**
2. Click **Create Team Admin**
3. Assign specific permissions:
   - `home` - Can edit home page
   - `about` - Can edit about page
   - `events` - Can manage events
   - `live_events` - Can control live streams
   - `gallery` - Can manage gallery
   - `team` - Can manage team members

### Manage Content
- **Home**: Edit hero title, subtitle, upload banner image, manage announcements
- **About**: Edit description, vision, mission, add faculty coordinators
- **Events**: Create events with posters, dates, registration links
- **Live Events**: Start/stop live streams, add YouTube/Zoom links
- **Gallery**: Upload images/videos, approve/reject submissions
- **Team**: Add team members with profiles, assign roles

---

## 📁 Project Structure

```
d:\AI VERSE\
├── backend/              # Express.js API
│   ├── database/         # SQLite database
│   ├── uploads/          # Uploaded files
│   └── src/
│       ├── config/       # Database, JWT config
│       ├── middleware/   # Auth, RBAC, upload
│       └── routes/       # API endpoints
│
├── frontend/             # React app
│   └── src/
│       ├── admin/        # Admin panel pages
│       ├── pages/        # Public website pages
│       ├── components/   # Reusable components
│       ├── contexts/     # Auth context
│       ├── services/     # API services
│       └── styles/       # CSS files
│
└── README.md            # Full documentation
```

---

## 🔗 Important Links

- **README**: `d:\AI VERSE\README.md` - Complete documentation
- **Walkthrough**: Check artifacts for detailed implementation docs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Health**: http://localhost:5000/api/health

---

## ✨ Next Steps

1. ✅ **Login and change password**
2. ✅ **Explore the admin panel**
3. ✅ **Create your first event**
4. ✅ **Upload gallery images**
5. ✅ **Add team members**
6. ✅ **Customize home and about pages**
7. 🚀 **Deploy to production** (see README.md)

---

## 🆘 Need Help?

1. Check `README.md` for detailed API documentation
2. Check `QUICK_FIX.md` for dependency issues
3. Check browser console for frontend errors
4. Check backend terminal for API errors

---

**Built with ❤️ for AI Verse CSE Club**

🎉 **Your platform is ready to use! Just fix the database issue and start managing your club content!**
