# Thakii Frontend - External Communication Architecture

## 🏗️ System Overview

The Thakii frontend implements a sophisticated multi-layered communication architecture that integrates with several external services to provide a complete video-to-PDF conversion platform.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   React Web     │    │   AWS Lambda     │    │   Backend API       │
│   Frontend      │◄──►│   Router         │◄──►│   (Flask)           │
│   (Port 3000)   │    │   (Load Balancer)│    │   (Port 5001)       │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                              ┌─────────────────────┐
│   Firebase      │                              │   AWS S3 Storage    │
│   Auth + DB     │                              │   (Videos/PDFs)     │
└─────────────────┘                              └─────────────────────┘
```

## 🔐 Authentication System

### Dual-Token Architecture

The application uses a sophisticated dual-token authentication system:

#### 1. Firebase Authentication (Primary Identity)
- **Service**: Firebase Auth (`thakii-973e3.firebaseapp.com`)
- **Configuration File**: `src/config/firebase.js`
- **Methods Supported**:
  - Email/password authentication
  - Google OAuth integration
- **Token Type**: Firebase JWT ID token
- **Purpose**: User identity verification and session management

#### 2. Backend Token Exchange (API Authorization)
- **Process**: Firebase JWT → Backend Custom JWT
- **Endpoint**: `POST /auth/login`
- **Implementation**: `src/contexts/AuthContext.jsx` (lines 32-103)
- **Storage**: `localStorage` key: `thakii_backend_token`
- **Duration**: 30-day expiry
- **Purpose**: Backend API authorization and user ownership validation

### Authentication Flow
```javascript
// Step-by-step authentication process
1. User Login (Firebase) → Firebase JWT Token
2. Token Exchange Request → POST /auth/login with Firebase JWT
3. Backend Validation → Custom Backend JWT (30-day)
4. Token Storage → localStorage.setItem('thakii_backend_token', jwt)
5. API Requests → Authorization: Bearer <backend_jwt>
```

### Token Management Implementation
```javascript
// Location: src/services/api.js (lines 15-120)
const getBackendToken = async () => {
  // Priority 1: Check stored backend token
  const authContextToken = localStorage.getItem('thakii_backend_token');
  if (authContextToken && isTokenValid(authContextToken)) {
    return authContextToken;
  }
  
  // Priority 2: Exchange fresh Firebase token
  const firebaseToken = await auth.currentUser.getIdToken();
  const backendToken = await exchangeWithBackend(firebaseToken);
  localStorage.setItem('thakii_backend_token', backendToken);
  return backendToken;
};
```

## 🌐 Backend API Communication

### Service Configuration
- **Primary Endpoint**: `https://thakii-02.fanusdigital.site/thakii-be`
- **Environment Override**: `VITE_API_BASE_URL`
- **HTTP Client**: Axios with comprehensive interceptors
- **Timeout**: 300 seconds (5 minutes) for large file uploads
- **Implementation**: `src/services/api.js`

### API Endpoint Mapping

#### Core Video Operations
```javascript
// Video Management
GET  /health                    // Service health monitoring
POST /upload                    // Standard video upload (<90MB)
POST /upload-chunk              // Chunked upload for large files
POST /assemble-file             // Assemble chunked file parts
GET  /list                      // User's video collection
GET  /status/{video_id}         // Individual video processing status
GET  /download/{video_id}       // Generate S3 presigned download URLs
```

#### Administrative Operations
```javascript
// System Administration
GET  /admin/videos              // All videos (admin view)
GET  /admin/stats               // System statistics and metrics
POST /admin/test-notification   // Test notification system

// Server Management
GET  /admin/servers             // Processing server list
POST /admin/servers             // Add new processing server
PUT  /admin/servers/{id}        // Update server configuration
DELETE /admin/servers/{id}      // Remove processing server
POST /admin/servers/health-check // Trigger server health checks

// User Administration
GET  /admin/admins              // Admin user management
POST /admin/admins              // Create new admin user
PUT  /admin/admins/{id}         // Update admin permissions
DELETE /admin/admins/{id}       // Remove admin access
GET  /admin/admins/stats        // Admin user statistics
```

### Intelligent Upload Strategy

The application implements smart file upload routing based on file size:

#### Small File Upload (<90MB)
```javascript
// Implementation: src/services/api.js (lines 201-229)
async uploadVideoStandard(file, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  
  return await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 1800000, // 30 minutes
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onUploadProgress(percentCompleted);
    }
  });
}
```

#### Large File Chunked Upload (>90MB)
```javascript
// Implementation: src/services/api.js (lines 231-308)
async uploadVideoChunked(file, onUploadProgress) {
  const chunkSize = 50 * 1024 * 1024; // 50MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = `chunked-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Upload chunks sequentially
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunk = file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize);
    
    const formData = new FormData();
    formData.append('chunk', chunk, `chunk_${chunkIndex}`);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('file_id', fileId);
    formData.append('original_filename', file.name);
    
    await api.post('/upload-chunk', formData);
  }
  
  // Assemble final file
  return await api.post('/assemble-file', {
    file_id: fileId,
    total_chunks: totalChunks,
    original_filename: file.name
  });
}
```

## 🔥 Firebase Integration

### Services Utilized

#### Firebase Authentication
- **Purpose**: User identity management and JWT token generation
- **Configuration**: `src/config/firebase.js`
- **Integration**: `src/contexts/AuthContext.jsx`
- **Features**:
  - Email/password authentication
  - Google OAuth integration
  - Session persistence across browser sessions
  - Automatic token refresh

#### Firebase Firestore (Real-time Database)
- **Current Status**: Real-time listeners disabled, manual refresh enabled
- **Collections Structure**:
  ```javascript
  video_tasks/{video_id}
  ├── filename: string
  ├── user_id: string
  ├── user_email: string
  ├── status: "in_queue" | "in_progress" | "done" | "failed"
  ├── upload_date: timestamp
  ├── created_at: timestamp
  └── updated_at: timestamp

  notifications/{notification_id}
  ├── user_id: string
  ├── type: "success" | "error" | "info"
  ├── message: string
  ├── read: boolean
  └── created_at: timestamp

  processing_servers/{server_id}
  ├── name: string
  ├── url: string
  ├── status: "healthy" | "unhealthy"
  ├── last_health_check: timestamp
  └── load_metrics: object

  admin_users/{user_id}
  ├── email: string
  ├── role: "admin" | "super_admin"
  ├── status: "active" | "inactive"
  └── permissions: object
  ```

### Real-time Communication (Currently Disabled)
```javascript
// Location: src/App.jsx (lines 275-292) - COMMENTED OUT
// Real-time listeners were implemented but disabled for manual refresh approach

// Example of disabled real-time video updates
// unsubscribeVideos = firestoreService.subscribeToUserVideos(currentUser.uid, (updatedVideos) => {
//   console.log(`Received ${updatedVideos.length} videos via push notification`);
//   setVideos(updatedVideos);
//   toast.success('Video list updated in real-time');
// });
```

## 📊 Data Flow Patterns

### 1. Video Upload and Processing Flow
```
User File Selection → File Size Analysis → Upload Strategy Decision
                                        ↓
Small File (<90MB): Standard Upload → Backend → S3 Storage
Large File (>90MB): Chunked Upload → Assembly → S3 Storage
                                        ↓
Backend Creates Firestore Task → Worker Picks Up → Processing
                                        ↓
Status Updates: in_queue → in_progress → done/failed
                                        ↓
Frontend Manual Refresh → UI Status Update → Download Available
```

### 2. Authentication and Authorization Flow
```
User Credentials → Firebase Authentication → Firebase JWT Token
                                          ↓
Token Exchange Request → Backend Validation → Custom Backend JWT
                                          ↓
30-day Token Storage → API Request Authorization → Resource Access
```

### 3. Admin Management Flow
```
Super Admin Login → Role Verification → Admin Dashboard Access
                                     ↓
Server Management → API Calls → Backend Server Registry → Health Monitoring
User Management → Admin CRUD → Firebase Custom Claims → Permission Updates
```

### 4. File Download Flow
```
User Download Request → Video Ownership Verification → S3 Presigned URL Generation
                                                    ↓
Temporary Download Link → Browser Download Trigger → File Download
```

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Backend API Configuration
VITE_API_BASE_URL=https://thakii-02.fanusdigital.site/thakii-be

# Firebase Service Configuration
VITE_FIREBASE_API_KEY=AIzaSyBBPh9nAptY_J8i0z87YUCIXEEUc8GbVpg
VITE_FIREBASE_AUTH_DOMAIN=thakii-973e3.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=thakii-973e3
VITE_FIREBASE_STORAGE_BUCKET=thakii-973e3.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=258632915594
VITE_FIREBASE_APP_ID=1:258632915594:web:0910d1ad68ea361e912b73
```

### Configuration Implementation
```javascript
// Location: src/config/firebase.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBPh9nAptY_J8i0z87YUCIXEEUc8GbVpg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thakii-973e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thakii-973e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thakii-973e3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "258632915594",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:258632915594:web:0910d1ad68ea361e912b73"
};
```

## 🛡️ Security Implementation

### Token Security
- **JWT Validation**: Automatic token expiry checking and refresh
- **Payload Verification**: User ID and permissions validation
- **Secure Storage**: localStorage with validation checks
- **Automatic Cleanup**: Token removal on logout

### API Security
- **Request Interceptors**: Automatic token attachment to all requests
- **Response Interceptors**: Error handling and token refresh triggers
- **CORS Configuration**: Proper cross-origin request handling
- **User Authorization**: Role-based access control for admin features

### Admin Access Control
```javascript
// Super Admin Configuration (src/contexts/AuthContext.jsx)
const SUPER_ADMINS = ['ouday.khaled@gmail.com', 'appsaawt@gmail.com'];

// Role-based UI rendering
const isAdmin = (email) => SUPER_ADMINS.includes(email);
```

## 🔄 Current Communication State

### Active Communication Patterns
1. **HTTP REST API**: All backend communication via authenticated requests
2. **Firebase Authentication**: Real-time user session management
3. **Manual Data Refresh**: User-triggered and auto-refresh (30s intervals)
4. **Token Management**: Automatic refresh and validation
5. **Error Handling**: Comprehensive logging and user feedback
6. **File Upload**: Intelligent routing based on file size

### Disabled Communication Patterns
1. **Real-time Firestore Listeners**: Commented out for manual refresh approach
2. **Push Notifications**: Real-time status updates disabled
3. **Automatic Polling**: Replaced with manual refresh controls

### Performance Optimizations
- **Chunked Uploads**: Bypass Cloudflare 100MB limit with 50MB chunks
- **Request Caching**: Token reuse and validation
- **Error Recovery**: Automatic retry mechanisms
- **Progress Tracking**: Real-time upload progress feedback

## 📋 Integration Testing Requirements

### Authentication Testing
- [ ] Firebase login/logout functionality
- [ ] Google OAuth integration
- [ ] Token exchange with backend
- [ ] Token refresh and validation
- [ ] Admin role verification

### API Communication Testing
- [ ] Health check endpoint
- [ ] Video upload (small and large files)
- [ ] Video list retrieval
- [ ] Download functionality
- [ ] Admin endpoints access

### File Upload Testing
- [ ] Standard upload (<90MB files)
- [ ] Chunked upload (>90MB files)
- [ ] Upload progress tracking
- [ ] Error handling and recovery
- [ ] File type validation

### Security Testing
- [ ] Unauthorized access prevention
- [ ] Token expiry handling
- [ ] Role-based access control
- [ ] CORS policy compliance
- [ ] Input validation and sanitization

## 🚨 Critical Dependencies

### External Service Dependencies
1. **Firebase Authentication Service**: User identity and session management
2. **Backend API Service**: Core business logic and data processing
3. **AWS S3 Storage**: File storage and retrieval via presigned URLs
4. **AWS Lambda Router**: Load balancing and service routing

### Internal Code Dependencies
1. **src/services/api.js**: Core API communication layer
2. **src/config/firebase.js**: Firebase service configuration
3. **src/contexts/AuthContext.jsx**: Authentication state management
4. **Environment Variables**: Service endpoints and authentication keys

Any modifications to these components must maintain backward compatibility and preserve the integrity of external service communication.
