# 🏠 Local Setup Guide

Complete instructions for setting up the Advanced Image Enhancement app on your local machine.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

## 🚀 Quick Setup

### 1. Clone or Download the Repository
```bash
# If you published to GitHub:
git clone https://github.com/yourusername/advanced-image-enhancement.git
cd advanced-image-enhancement

# Or download and extract the ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
```bash
# Copy the environment file from this backup
cp /path/to/backup/.env.local .env.local

# Or copy the example and fill in your keys
cp .env.example .env.local
nano .env.local
```

### 4. Verify Setup
```bash
# Check that .env.local is ignored by Git
git check-ignore .env.local

# Should output: .env.local
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:8000` to see your app!

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run CLI installer
npm run cli

# Lint code
npm run lint
```

## 🐳 Docker Setup (Optional)

### Development with Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production Docker
```bash
# Build production image
docker build -t image-enhancer .

# Run production container
docker run -p 8000:8000 --env-file .env.local image-enhancer
```

## 🐍 Python SDK Setup

### Install Python SDK
```bash
cd python-sdk
pip install -r requirements.txt

# Make CLI executable
chmod +x image_enhancer_sdk.py
```

### Use Python CLI
```bash
# Enhance single image
python image_enhancer_sdk.py enhance input.jpg output.jpg

# Batch process
python image_enhancer_sdk.py batch-enhance ./input_folder ./output_folder

# Get help
python image_enhancer_sdk.py --help
```

## 📁 Project Structure

```
advanced-image-enhancement/
├── 🔒 .env.local                    # Your API keys (from backup)
├── 📋 .env.example                  # Template for others
├── 🛡️ .gitignore                    # Protects sensitive files
├── 📚 README.md                     # Main documentation
├── 🚀 package.json                  # Dependencies & scripts
├── 🐳 Dockerfile                    # Container definition
├── 🐳 docker-compose.yml            # Container orchestration
├── 🔧 cli-installer.js              # CLI setup tool
├── 📁 src/                          # Next.js application
│   ├── 📁 app/                      # App router
│   │   ├── 📁 api/                  # API endpoints
│   │   ├── page.tsx                 # Main page
│   │   └── layout.tsx               # Root layout
│   ├── 📁 components/               # React components
│   └── 📁 lib/                      # Utilities
├── 📁 python-sdk/                   # Python CLI & SDK
├── 📁 models/                       # Local model storage
└── 📁 public/                       # Static assets
```

## 🔍 Testing Your Setup

### 1. Test Web Interface
1. Go to `http://localhost:8000`
2. Upload a test image
3. Click "Enhance Image"
4. Verify the enhancement works

### 2. Test API Endpoints
```bash
# Test enhancement API
curl -X POST http://localhost:8000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/test-image.jpg"}'

# Test classification API
curl -X POST http://localhost:8000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"image": "https://example.com/enhanced-image.jpg"}'
```

### 3. Test Python SDK
```bash
cd python-sdk
python image_enhancer_sdk.py test-connection
```

## 🛠️ Troubleshooting

### Common Issues

#### "API Key not found"
- Verify `.env.local` exists in project root
- Check that API keys are correctly formatted
- Restart the development server

#### "Module not found" errors
- Run `npm install` to install dependencies
- Check Node.js version: `node --version` (should be 18+)

#### "Port already in use"
- Kill process on port 8000: `fuser -k 8000/tcp`
- Or use different port: `PORT=3000 npm run dev`

#### Docker issues
- Ensure Docker is running
- Check Docker Compose version: `docker-compose --version`
- View container logs: `docker-compose logs`

### Getting Help

1. Check `TROUBLESHOOTING.md` for detailed solutions
2. Review API documentation in `README.md`
3. Check the security guide in `SECURITY_GUIDE.md`
4. Review cost analysis in `COST_ANALYSIS.md`

## 🔐 Security Reminders

- ✅ Keep `.env.local` secure and never share it
- ✅ Use different API keys for production
- ✅ Regularly rotate your API keys
- ✅ Monitor API usage for unusual activity
- ✅ Never commit sensitive files to Git

## 🎯 Next Steps

1. **Customize the UI** - Modify components in `src/components/`
2. **Add new models** - Update model configurations in API routes
3. **Extend the Python SDK** - Add new features to `python-sdk/`
4. **Deploy to production** - Follow `DEPLOYMENT_GUIDE.md`
5. **Monitor costs** - Review `COST_ANALYSIS.md` regularly

---

**You're all set! Happy coding!** 🚀
