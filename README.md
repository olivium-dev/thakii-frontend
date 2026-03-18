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

### Server diagnostics (white page / 404s)

To check nginx and server logs on the deployment host:

**From your machine (SSH and run in one go):**
```bash
# Use the same host as in .github/workflows/deploy.yml (e.g. Cloudflare SSH alias or direct)
ssh ec2-user@thakii-02.fds-1.com 'bash -s' < scripts/check-server.sh
```

**On the server (after SSH):**
```bash
cd /path/to/thakii-frontend
bash scripts/check-server.sh
```

The script prints: contents of `WEB_ROOT` and `assets/`, nginx config for the site, last 50 nginx error log lines, and recent 404s from the access log. Fix any missing `assets/`, wrong `root`, or missing `try_files $uri $uri/ /index.html;` for the frontend.

**Quick manual checks on the server:**
```bash
# Nginx config and test
sudo nginx -t
sudo grep -R "thakii\|fanusdigital" /etc/nginx/

# Recent errors and 404s
sudo tail -100 /var/log/nginx/error.log
sudo grep " 404 " /var/log/nginx/access.log | tail -20

# Frontend files
ls -la /var/www/thakii-frontend/
ls /var/www/thakii-frontend/assets/ | head -20
```

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

See **[STRUCTURE.md](./STRUCTURE.md)** for the full layout and conventions. Summary:

```
thakii-frontend/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Root component
│   ├── index.css           # Global styles (Tailwind)
│   ├── config/             # Firebase and app config
│   ├── contexts/           # Auth context + authAdapter (mock/real)
│   ├── services/           # API, websocket + adapters
│   ├── mocks/              # Mock auth, API, WebSocket + fixtures
│   └── components/        # UI (Header, FileUpload, VideoList, Auth/, …)
├── e2e/                    # Playwright E2E tests
├── scripts/                # Server check / deployment helpers
├── vite.config.js
├── tailwind.config.js
└── STRUCTURE.md            # Layout and naming conventions
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
- Supports multiple video formats (MP4, AVI, MOV, WMV, MKV, TS)
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


<!-- GitHub Actions fix: Changed tunnel protocol from ssh:// to tcp:// for IPv4 compatibility -->
