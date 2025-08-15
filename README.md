# Advanced Image Enhancement App

🚀 **AI-powered image enhancement that removes blur and enhances pictures better than any tool on the market**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.6-38B2AC)](https://tailwindcss.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-green)](https://replicate.com/)

## ✨ Features

- 🎯 **Superior Image Enhancement**: Powered by state-of-the-art AI models (Real-ESRGAN, GFPGAN, CodeFormer)
- 🔍 **Intelligent Quality Analysis**: AI-powered classification with actionable recommendations
- ⚡ **Lightning Fast Processing**: Optimized pipeline with local model caching
- 📦 **Batch Processing**: Handle up to 1000 images with intelligent chunking
- 🎨 **Modern UI**: Clean, responsive interface with dark/light themes
- 🛠️ **CLI Tools**: Command-line installer and automation scripts
- 💾 **Local Model Storage**: Cache models locally for faster processing
- 📊 **Detailed Analytics**: Processing time tracking and quality metrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm/bun
- API keys for Replicate and OpenRouter

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd advanced-image-enhancement
   npm install
   ```

2. **Run the CLI installer:**
   ```bash
   npm run cli
   # or
   node cli-installer.js
   ```

3. **Configure API keys:**
   Create `.env.local` file:
   ```env
   REPLICATE_API_KEY=your_replicate_key_here
   OPENROUTER_API_KEY=your_openrouter_key_here
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:8000](http://localhost:8000)

## 🎮 Usage

### Web Interface

1. **Single Image Enhancement:**
   - Upload an image via drag-and-drop or file picker
   - Choose enhancement options (model, scale, face enhancement)
   - View before/after comparison with slider
   - Download enhanced result
   - Review AI quality analysis

2. **Batch Processing:**
   - Upload multiple images (up to 1000)
   - Automatic chunking for large batches (>100 images)
   - Real-time progress tracking with chunk indicators
   - Configure global settings
   - Monitor processing progress
   - Download all enhanced images
   - View comprehensive batch statistics

### CLI Commands

```bash
# Start development server
npm run dev

# Start production server
npm run build && npm start

# Run CLI installer
npm run cli

# Batch processing mode
npm run batch

# Clean model cache
npm run clean-models
```

## 🔧 API Endpoints

### Image Enhancement
```http
POST /api/enhance
Content-Type: application/json

{
  "image": "base64_encoded_image_or_url",
  "model": "nightmareai/real-esrgan",
  "options": {
    "scale": 4,
    "faceEnhance": true
  }
}
```

### Quality Classification
```http
POST /api/classify
Content-Type: application/json

{
  "image": "enhanced_image_url",
  "originalImage": "original_image_url",
  "enhancementDetails": {
    "model": "nightmareai/real-esrgan",
    "processingTime": 5000
  }
}
```

### Batch Processing
```http
POST /api/batch/enhance
Content-Type: application/json

{
  "images": [
    {
      "id": "unique_id",
      "image": "base64_encoded_image",
      "filename": "image.jpg",
      "options": {
        "scale": 4,
        "faceEnhance": true
      }
