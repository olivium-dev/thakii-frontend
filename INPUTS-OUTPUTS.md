# Thakii Frontend - Inputs and Outputs

This document describes the data flow, dependencies, and interfaces for the Thakii Frontend application.

## 📥 INPUTS

### 1. User Interactions
**Source**: End users through web browser
**Format**: UI events, form submissions, file selections
**Examples**:
- Video file uploads (MP4, AVI, MOV, WMV, MKV up to 2GB)
- Authentication credentials (email/password)
- Admin actions (user management, server configuration)
- UI interactions (clicks, form submissions, navigation)

### 2. Backend API Responses
**Source**: thakii-backend-api via HTTP/HTTPS
**Format**: JSON responses
**Endpoints Consumed**:
```
GET /health
Response: {"service": "...", "status": "healthy", "timestamp": "..."}

POST /upload
Request: FormData with video file
Response: {"video_id": "...", "message": "...", "s3_key": "..."}

GET /list
Response: [{"video_id": "...", "filename": "...", "status": "...", "upload_date": "..."}]

GET /download/{video_id}
Response: {"download_url": "https://...", "filename": "..."}

GET /admin/stats
Response: {"total_videos": 123, "processing": 5, "failed": 2}
```

### 3. Firebase Real-time Data
**Source**: Firebase Firestore
**Format**: Real-time document updates
**Collections Monitored**:
```
video_tasks/{video_id}
- status: "in_queue" | "in_progress" | "done" | "failed"
- filename: string
- upload_date: timestamp
- user_id: string

notifications/{notification_id}
- message: string
- type: "success" | "error" | "info"
- timestamp: timestamp
- read: boolean

system/stats
- total_processing: number
- server_health: object
- last_updated: timestamp
```

### 4. Firebase Authentication
**Source**: Firebase Auth service
**Format**: JWT tokens and user objects
**Data Received**:
```
User Object:
{
  uid: "user-unique-id",
  email: "user@example.com",
  emailVerified: boolean,
  displayName: string,
  customClaims: {
    role: "user" | "admin" | "super_admin"
  }
}

ID Token: JWT string for API authentication
```

### 5. Environment Configuration
**Source**: Environment variables (.env file)
**Format**: Key-value pairs
**Required Variables**:
```
VITE_API_BASE_URL=http://localhost:5001
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

## 📤 OUTPUTS

### 1. HTTP API Requests
**Destination**: thakii-backend-api (via thakii-lambda-router)
**Format**: HTTP requests with JSON payloads
**Requests Sent**:
```
POST /upload
Headers: Authorization: Bearer <jwt_token>
Body: FormData with video file
Content-Type: multipart/form-data

GET /list
Headers: Authorization: Bearer <jwt_token>

GET /download/{video_id}
Headers: Authorization: Bearer <jwt_token>

GET /admin/users
Headers: Authorization: Bearer <jwt_token>
```

### 2. User Interface Rendering
**Destination**: Web browser
**Format**: HTML/CSS/JavaScript
**Components Rendered**:
- Video upload interface with drag & drop
- Processing status dashboard with real-time updates
- Authentication forms (login/signup)
- Admin management panels
- Error and success notifications
- Responsive mobile-friendly layouts

### 3. Browser Downloads
**Destination**: User's local file system
**Format**: PDF files
**Trigger**: User clicks download button for completed videos
**Process**:
1. Request presigned S3 URL from backend
2. Create temporary anchor element
3. Trigger browser download with suggested filename

### 4. Firebase Authentication Requests
**Destination**: Firebase Auth service
**Format**: Firebase SDK calls
**Operations**:
```
signInWithEmailAndPassword(email, password)
createUserWithEmailAndPassword(email, password)
signOut()
onAuthStateChanged(callback)
user.getIdToken() // For API authentication
```

### 5. Real-time Subscriptions
**Destination**: Firebase Firestore
**Format**: Firestore listener subscriptions
**Subscriptions Created**:
```
// Video status updates
firestore.collection('video_tasks')
  .where('user_id', '==', currentUser.uid)
  .onSnapshot(callback)

// System notifications
firestore.collection('notifications')
  .where('user_id', '==', currentUser.uid)
  .onSnapshot(callback)

// Admin data (admin users only)
firestore.collection('processing_servers')
  .onSnapshot(callback)
```

### 6. Console Logging
**Destination**: Browser developer console
**Format**: Structured log messages
**Log Levels**:
- `console.log()` - General information
- `console.error()` - Error conditions
- `console.warn()` - Warning messages
- `console.debug()` - Debug information

### 7. User Notifications
**Destination**: Browser UI (toast notifications)
**Format**: Toast messages with different types
**Examples**:
```
toast.success('Video uploaded successfully!')
toast.error('Upload failed. Please try again.')
toast.info('Processing your video...')
toast.loading('Uploading...', {id: 'upload'})
```

## 🔄 DATA FLOW PATTERNS

### Upload Flow
```
User selects file → FileUpload component → API request → Backend → S3 upload → 
Firestore task creation → Real-time update → UI status update
```

### Authentication Flow
```
User credentials → Firebase Auth → JWT token → Stored in context → 
Added to API requests → Backend verification
```

### Real-time Updates Flow
```
Backend updates Firestore → Firestore triggers listener → Frontend receives update → 
UI re-renders with new status
```

### Download Flow
```
User clicks download → API request for presigned URL → Backend generates S3 URL → 
Frontend receives URL → Browser download triggered
```

## 🔗 DEPENDENCIES

### External Services
- **Firebase Auth**: User authentication and authorization
- **Firebase Firestore**: Real-time database for status updates
- **thakii-backend-api**: REST API for core functionality
- **thakii-lambda-router**: Load balancer and API gateway

### Internal Dependencies
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **Firebase SDK**: Firebase service integration
- **Tailwind CSS**: Styling framework

### Browser APIs
- **File API**: For video file handling
- **Fetch API**: HTTP requests (via Axios)
- **Local Storage**: Caching user preferences
- **WebSocket**: Real-time Firestore connections

## 🎯 ROLE IN SYSTEM

The frontend serves as the **primary user interface** for the Thakii Lecture2PDF Service:

1. **User Portal**: Provides access to video upload and management
2. **Status Dashboard**: Shows real-time processing updates
3. **Admin Interface**: Manages system configuration and users
4. **Authentication Gateway**: Handles user login and authorization
5. **File Manager**: Facilitates video uploads and PDF downloads
6. **Notification Center**: Displays system messages and alerts

## 🔒 SECURITY CONSIDERATIONS

### Input Validation
- File type and size validation before upload
- Form input sanitization
- XSS prevention through React's built-in protection

### Authentication
- JWT token management
- Automatic token refresh
- Secure token storage

### API Security
- HTTPS-only communication in production
- Authorization headers on all API requests
- CORS policy compliance

## 📊 PERFORMANCE CHARACTERISTICS

### Load Patterns
- **Peak Usage**: During video upload operations
- **Real-time Updates**: Continuous Firestore connections
- **File Operations**: Large file uploads (up to 2GB)

### Optimization Strategies
- Code splitting and lazy loading
- Image optimization and compression
- Efficient re-rendering with React hooks
- Caching of API responses where appropriate
