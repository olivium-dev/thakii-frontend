# Thakii Frontend

React-based web application for the Thakii Lecture2PDF Service. Provides a modern, responsive interface for video upload, processing status tracking, and administrative management.

## 🚀 Features

- **Video Upload Interface**: Drag & drop video upload with progress tracking
- **Real-time Status Updates**: Live processing status via Firebase Firestore
- **User Authentication**: Firebase Auth integration with role-based access
- **Admin Dashboard**: Server management and user administration
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Error Handling**: Comprehensive error states and user feedback
- **File Validation**: Size (2GB max) and type checking for videos

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Firebase SDK**: Authentication and real-time database
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API communication
- **React Hot Toast**: User notifications and feedback
- **Lucide React**: Modern icon library

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   │   ├── AuthPage.jsx      # Main auth interface
│   │   ├── DevAuthPage.jsx   # Development auth bypass
│   │   ├── LoginForm.jsx     # Login form component
│   │   └── SignupForm.jsx    # Registration form
│   ├── FileUpload.jsx        # Video upload interface
│   ├── VideoList.jsx         # Processing status display
│   ├── AdminDashboard.jsx    # Admin management interface
│   ├── Header.jsx            # Navigation header
│   └── ServiceStatus.jsx     # Backend health display
├── contexts/
│   └── AuthContext.jsx       # Global authentication state
├── services/
│   ├── api.js               # Backend API communication
│   ├── firestore.js         # Real-time data synchronization
│   └── notifications.js     # Push notification handling
├── config/
│   └── firebase.js          # Firebase configuration
├── App.jsx                  # Main application component
└── main.jsx                 # Application entry point
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:5001

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/oudaykhaled/thakii-frontend.git
   cd thakii-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   Open http://localhost:3000 in your browser

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## 📡 API Integration

The frontend communicates with the backend API through the following endpoints:

- `GET /health` - Backend health check
- `POST /upload` - Video file upload
- `GET /list` - User's video list
- `GET /download/{video_id}` - PDF download URLs
- `GET /admin/*` - Admin management endpoints

## 🔥 Firebase Integration

### Authentication
- Email/password authentication
- JWT token management
- Role-based access control (user/admin)

### Firestore Real-time Updates
- Video processing status updates
- System notifications
- Admin dashboard data

## 🎨 UI Components

### File Upload
- Drag & drop interface
- Upload progress tracking
- File type and size validation
- Error handling and feedback

### Video List
- Real-time status updates
- Processing progress indicators
- Download buttons for completed videos
- Filtering and sorting options

### Admin Dashboard
- Server health monitoring
- User management interface
- System statistics and metrics
- Admin user creation and management

## 🔒 Security Features

- Firebase Authentication integration
- JWT token validation
- CORS configuration
- Input validation and sanitization
- Role-based route protection

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS utility classes
- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for various screen sizes

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

### AWS S3 + CloudFront
1. Build the application: `npm run build`
2. Upload `dist/` contents to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain (optional)

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📈 Performance Optimization

- Code splitting with Vite
- Lazy loading of components
- Image optimization
- Bundle size monitoring
- Caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

## 🔗 Related Repositories

- [thakii-backend-api](https://github.com/oudaykhaled/thakii-backend-api) - Backend REST API
- [thakii-lambda-router](https://github.com/oudaykhaled/thakii-lambda-router) - Load balancer
- [thakii-infrastructure](https://github.com/oudaykhaled/thakii-infrastructure) - Infrastructure as Code
