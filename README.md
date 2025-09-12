# Thakii Lecture2PDF Web Interface

A modern React web application for converting lecture videos to PDF documents using the Thakii Lecture2PDF service.

## Features

- **Drag & Drop Upload**: Easy video file upload with drag and drop support
- **Real-time Progress**: Upload progress tracking with visual indicators
- **Video Management**: View all uploaded videos with status tracking
- **PDF Download**: One-click PDF download when processing is complete
- **Service Monitoring**: Real-time service health and status monitoring
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Technologies Used

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Axios**: HTTP client for API communication
- **Lucide React**: Beautiful icons and illustrations
- **React Hot Toast**: Elegant toast notifications

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Thakii Lecture2PDF backend service running on `http://localhost:5001`

### Installation

1. Navigate to the web interface directory:
   ```bash
   cd web-interface
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Production Build

To create a production build:

```bash
npm run build
```

The build files will be generated in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory to configure the backend URL:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_API_TIMEOUT=300000
```

### Backend Connection

The web interface connects directly to the backend service (not Lambda) at:
- Development: `http://localhost:5001`
- Production: Configure via environment variables

## File Structure

```
web-interface/
├── src/
│   ├── components/         # React components
│   │   ├── Header.jsx     # App header with branding
│   │   ├── FileUpload.jsx # File upload component
│   │   ├── VideoList.jsx  # Video list and management
│   │   └── ServiceStatus.jsx # Service health status
│   ├── services/          # API services
│   │   └── api.js         # Backend API communication
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles and Tailwind
├── public/                # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.js         # Vite configuration
└── README.md              # This file
```

## API Integration

The web interface communicates with the backend service through the following endpoints:

- `GET /health` - Service health check
- `POST /upload` - Upload video files
- `GET /list` - Get list of all videos
- `GET /status/:id` - Get video processing status
- `GET /download/:id` - Download generated PDF

## Features in Detail

### File Upload
- Supports multiple video formats (MP4, AVI, MOV, WMV, MKV)
- Maximum file size: 2GB
- Real-time upload progress
- Drag and drop interface

### Video Processing Queue
- Real-time status updates
- Processing stages: in_queue → in_progress → done/failed
- Automatic refresh every 10 seconds

### Service Monitoring
- Backend service health status
- Database connection status
- Storage system status
- Last check timestamp

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Accessible design patterns

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

### Code Style

The project uses:
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for consistent styling
- React best practices and hooks

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure the backend service is running on `http://localhost:5001`
   - Check if the service is healthy via `/health` endpoint

2. **Upload Fails**
   - Verify file format is supported
   - Check file size (max 2GB)
   - Ensure backend has sufficient storage space

3. **PDF Download Issues**
   - Wait for processing to complete (status: "done")
   - Check browser popup blocker settings
   - Verify backend PDF generation is working

### Support

For technical support or feature requests, please refer to the main project documentation.# Version 1.0.28 - UI Status Mapping Fix
