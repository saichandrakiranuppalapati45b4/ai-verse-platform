# AI Verse - CSE Club Platform

A comprehensive full-stack web application for AI Verse, the CSE (Artificial Intelligence & Data Science) club platform. Features a role-based admin panel for managing content and a public-facing website for showcasing events, gallery, and team information.

## 🎯 Features

### Public Website
- **Home Page**: Hero section with dynamic content and announcements
- **About Page**: Club description, vision, mission, and faculty coordinators
- **Events Page**: Browse upcoming and completed events
- **Live Events Page**: Watch live streaming events with countdown
- **Gallery**: Image and video gallery with event filtering
- **Team Page**: Meet the club team members
- **Contact Page**: Get in touch with the club

### Admin Panel
- **Dashboard**: Overview statistics and recent events
- **Home Page Manager**: Edit hero content, announcements, section visibility
- **About Page Manager**: Manage club information and faculty list
- **Events Manager**: Full CRUD for events with poster uploads
- **Live Events Controller**: Start/stop live streams, manage countdowns
- **Gallery Manager**: Upload, approve, and manage media files
- **Team Manager**: Add team members with profiles and social links
- **Admin Management**: Create/manage team admins (Super Admin only)

### Security & Authentication
- JWT-based authentication
- Role-based access control (Super Admin vs Team Admin)
- Module-level permissions for team admins
- Protected routes and API endpoints
- Password hashing with bcrypt

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Password Hashing**: bcrypt
- **Validation**: express-validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS with CSS Variables
- **State Management**: React Context API

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update values if needed (default values work for development)

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - The `.env` file is already configured for development

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔐 Default Credentials

**Super Admin Account:**
- Username: `admin`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change this password immediately after first login!

## 📁 Project Structure

```
ai-verse/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # Database setup and initialization
│   │   │   └── jwt.js            # JWT configuration
│   │   ├── middleware/
│   │   │   ├── auth.js           # Authentication middleware
│   │   │   ├── rbac.js           # Role-based access control
│   │   │   └── upload.js         # File upload configuration
│   │   └── routes/
│   │       ├── auth.routes.js    # Authentication endpoints
│   │       ├── admin.routes.js   # Admin management
│   │       ├── home.routes.js    # Home page content
│   │       ├── about.routes.js   # About page content
│   │       ├── events.routes.js  # Events management
│   │       ├── live-events.routes.js  # Live events control
│   │       ├── gallery.routes.js # Gallery management
│   │       ├── team.routes.js    # Team management
│   │       └── dashboard.routes.js  # Dashboard stats
│   ├── uploads/                  # Uploaded files storage
│   ├── database/                 # SQLite database files
│   ├── server.js                 # Express server entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── admin/               # Admin panel pages
│   │   │   ├── Login.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── HomeManager.jsx
│   │   │   ├── AboutManager.jsx
│   │   │   ├── EventsManager.jsx
│   │   │   ├── LiveEventsController.jsx
│   │   │   ├── GalleryManager.jsx
│   │   │   ├── TeamManager.jsx
│   │   │   └── AdminManagement.jsx
│   │   ├── pages/               # Public website pages
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── LiveEvents.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Contact.jsx
│   │   ├── components/          # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Loader.jsx
│   │   ├── contexts/            # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── services/            # API services
│   │   │   ├── api.js
│   │   │   └── auth.service.js
│   │   ├── styles/              # Global styles
│   │   │   ├── index.css
│   │   │   └── theme.css
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## 🚀 Usage

### Accessing the Application

1. **Public Website**: http://localhost:5173
2. **Admin Login**: http://localhost:5173/admin/login
3. **Backend API**: http://localhost:5000/api

### Admin Workflow

1. **Login** with super admin credentials
2. **Change Password** (recommended on first login)
3. **Create Team Admins** (optional) with specific module permissions
4. **Manage Content**: 
   - Update home page hero and announcements
   - Edit about page information
   - Create and manage events
   - Upload gallery images/videos
   - Add team members
5. **Go Live**: Start live events when needed

### Creating Team Admins

Super Admins can create team admins with limited permissions:

1. Go to **Admin Management**
2. Click **Create Team Admin**
3. Fill in username, email, password
4. Select permissions (modules the admin can access):
   - `home`: Home Page Manager
   - `about`: About Page Manager
   - `events`: Events Manager
   - `live_events`: Live Events Controller
   - `gallery`: Gallery Manager
   - `team`: Team Manager

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin Management (Super Admin Only)
- `GET /api/admins` - List all admins
- `POST /api/admins` - Create team admin
- `PUT /api/admins/:id` - Update admin permissions
- `DELETE /api/admins/:id` - Delete admin
- `POST /api/admins/:id/reset-password` - Reset password

### Home Content
- `GET /api/home` - Get home content (public)
- `PUT /api/home` - Update home content (auth)
- `POST /api/home/upload-hero` - Upload hero image (auth)

### About Content
- `GET /api/about` - Get about content (public)
- `PUT /api/about` - Update about content (auth)

### Events
- `GET /api/events` - Get all events (public)
- `GET /api/events/:id` - Get single event (public)
- `POST /api/events` - Create event (auth)
- `PUT /api/events/:id` - Update event (auth)
- `DELETE /api/events/:id` - Delete event (auth)
- `POST /api/events/:id/upload-poster` - Upload poster (auth)

### Live Events
- `GET /api/live-events` - Get current live event (public)
- `POST /api/live-events/start` - Start live event (auth)
- `POST /api/live-events/stop` - Stop live event (auth)
- `PUT /api/live-events/:id` - Update live event (auth)

### Gallery
- `GET /api/gallery` - Get approved gallery (public)
- `GET /api/gallery/all` - Get all (auth)
- `POST /api/gallery/upload` - Upload file (auth)
- `PUT /api/gallery/:id/approve` - Approve item (auth)
- `DELETE /api/gallery/:id` - Delete item (auth)

### Team
- `GET /api/team` - Get visible team (public)
- `GET /api/team/all` - Get all (auth)
- `POST /api/team` - Add member (auth)
- `PUT /api/team/:id` - Update member (auth)
- `DELETE /api/team/:id` - Delete member (auth)
- `POST /api/team/:id/upload-image` - Upload profile (auth)

### Dashboard
- `GET /api/dashboard/stats` - Get statistics (auth)

## 🎨 Design System

The application uses a custom dark theme with futuristic AI aesthetics:

### Colors
- **Primary**: Cyan/Blue gradient (#00D4FF → #0066FF)
- **Secondary**: Purple (#8B5CF6)
- **Accent**: Pink (#EC4899)
- **Background**: Dark (#0A0E27, #151932)

### Animations
- Fade in
- Slide up/down
- Scale in
- Glow effects
- Smooth transitions

## 📝 Database Schema

### users
- Authentication and authorization
- Stores admins with roles and permissions

### home_content
- Hero section content
- Announcements
- Section visibility config

### about_content
- Club description
- Vision, mission
- Department info
- Faculty coordinators

### events
- Event details
- Posters
- Registration links
- Status (upcoming/live/completed)

### live_events
- Live streaming info
- Stream URLs
- Countdown timers
- Live notices

### gallery
- Images and videos
- Event associations
- Approval status

### team_members
- Member profiles
- Roles and bios
- Social links
- Display order

## 🔧 Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 🚢 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in `.env`
2. Update `JWT_SECRET` with a strong secret key
3. Configure database path for production
4. Set up CORS for production frontend URL

### Frontend Deployment
1. Update `VITE_API_URL` to production backend URL
2. Run `npm run build`
3. Deploy the `dist` folder to your hosting service

### Recommended Hosting
- **Backend**: Heroku, Railway, Render, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: For production, consider PostgreSQL instead of SQLite

## 🔒 Security Best Practices

1. **Change default admin password immediately**
2. Use strong JWT secrets in production
3. Enable HTTPS in production
4. Regularly update dependencies
5. Implement rate limiting for APIs
6. Validate all user inputs
7. Use environment variables for sensitive data
8. Regular security audits

## 🎯 Future Enhancements

- [ ] Hackathon registration system
- [ ] Certificate generation
- [ ] Email notifications
- [ ] AI chatbot assistant
- [ ] Analytics dashboard
- [ ] Social media integration
- [ ] Mobile app
- [ ] Advanced search and filters
- [ ] Real-time notifications
- [ ] Content versioning

## 📄 License

MIT License

## 🤝 Support

For issues or questions, please contact the AI Verse admin team.

---

**Built with ❤️ by AI Verse Team**
