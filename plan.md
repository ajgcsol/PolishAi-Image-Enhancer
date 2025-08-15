```markdown
# Detailed Implementation Plan for the Advanced Image Enhancement App

This plan outlines the step-by-step changes and file dependencies to build a Next.js web application paired with a CLI installer. The app leverages Replicate and OpenRouter APIs (with provided API keys) for image enhancement and intelligent classification. It will also support local model storage for batch processing and future custom model integration.

---

## 1. Environment & Configuration Setup

- **Create .env.local**  
  - **File:** `.env.local` (in project root)  
  - **Content:**
  ```
  OPENROUTER_API_KEY=your_openrouter_api_key_here
  REPLICATE_API_KEY=your_replicate_api_key_here
  ```
  - **Purpose:** Securely store API keys and load them in server-side code.

- **Update next.config.ts**  
  - **Location:** `next.config.ts`  
  - **Changes:** Ensure environment variables are not exposed to the client. No public key exposure; use server runtime config if needed.

---

## 2. Local Model Storage & Management

- **Create Models Directory**  
  - **Directory:** `/models`  
  - **Files:**  
    - `README.md` – Explain that this folder holds locally stored AI models.
    - (Optional) A helper module `src/lib/localModelManager.ts` with functions such as `loadLocalModels()` and `downloadModel(url: string)` to manage model files.
    
- **Future Custom Model Integration:**  
  - Document in README.md that the system can later integrate a sophisticated custom model by placing it within `/models` and updating configuration flags.

---

## 3. API Endpoints Implementation

- **Enhancement Endpoint**  
  - **File:** `src/app/api/enhance/route.ts`  
  - **Functionality:**  
    - Accepts a POST request with an image file (as base64 string or multipart data).  
    - Uses the Replicate API (via a secure fetch call with `REPLICATE_API_KEY`) to remove blur and enhance the image.  
    - Returns the enhanced image (as a URL or base64 data).  
    - Implements try-catch error handling and returns HTTP error statuses with descriptive messages.

- **Classification Endpoint**  
  - **File:** `src/app/api/classify/route.ts`  
  - **Functionality:**  
    - Accepts the enhanced image data, sends a request to the OpenRouter endpoint (`https://openrouter.ai/api/v1/chat/completions`) with a query to analyze the image quality (brightness, darkness, pixelation, etc.).  
    - Uses model default `anthropic/claude-sonnet-4` unless later reconfigured.  
    - Returns a JSON object with classification/diagnostic details.
  
- **Batch Processing Endpoint (Optional)**  
  - **File:** `src/app/api/batch/enhance/route.ts`  
  - **Functionality:**  
    - Similar to single enhancement endpoint but accepts an array of images.  
    - Iterates over images and calls the enhancement + classification endpoints sequentially or in parallel.  
    - Returns an aggregated result summary with progress status.

---

## 4. UI Component Development & Integration

- **Main Landing Page**  
  - **File:** `src/app/page.tsx`  
  - **Features:**  
    - A modern, clean interface with a prominent file upload area and clear call-to-action buttons (e.g., "Enhance", "Batch Process").  
    - Displays both the original and enhanced images, along with diagnostic results.  
    - Uses responsive layout with ample typography, spacing, and color contrast for clarity.

- **File Upload Component**  
  - **File:** `src/components/FileUpload.tsx`  
  - **Features:**  
    - Implements drag-and-drop and standard file selection.  
    - Validates file type and size and displays error messages on failure.

- **Image Preview Component**  
  - **File:** `src/components/ImagePreview.tsx`  
  - **Features:**  
    - Renders `<img>` elements using a placeholder if the image fails to load:
      ```html
      <img src="https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/109dbcf0-431c-45e5-9c13-22fe980845b2.png" alt="Enhanced image display with modern layout" onerror="this.onerror=null;this.src='https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/ef9002b2-979d-4c71-b359-f14bf81f3440.png'" />
      ```
    - Maintains responsive sizing and visual hierarchy.

- **Classifier Results Component**  
  - **File:** `src/components/ClassifierResults.tsx`  
  - **Features:**  
    - Displays diagnostic messages (e.g., "Too bright", "Too dark", etc.) in a card or list format with subtle background colors and clear typography.

- **Batch Processing UI**  
  - **File:** `src/components/BatchProcessing.tsx`  
  - **Features:**  
    - Allows multiple image uploads.
    - Shows a progress bar per image and aggregates results.
    - Provides error feedback on a per-image basis.

- **Styling Considerations:**  
  - Modern, minimalist design using CSS in `src/app/globals.css`; ensure consistency in spacing, font sizing, and color palette.
  - Avoid using external icon libraries; use basic HTML elements and CSS for visuals.

---

## 5. CLI Installer Implementation

- **CLI Installer Script**  
  - **File:** `cli-installer.js` (in project root)  
  - **Features:**  
    - Displays an ASCII art banner on startup.
      - Example ASCII art (printed using `console.log`).
    - Checks for existence of required directories (e.g., `/models`) and creates them if missing.
    - Verifies that project dependencies are installed (optionally runs `npm install` if needed).
    - Provides friendly error messages and installation success confirmation.
  - **Sample Code Snippet:**
    ```javascript
    #!/usr/bin/env node
    const fs = require('fs');
    const { execSync } = require('child_process');
    
    console.log(`
      ##################################################
      #  Advanced Image Enhancement Installer (CLI)  #
      ##################################################
    `);
    
    if (!fs.existsSync('./models')) {
      fs.mkdirSync('./models');
      console.log('Created models directory.');
    }
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Error installing dependencies:', error);
      process.exit(1);
    }
    console.log('Installation complete.');
    ```
  - **Update package.json Scripts:**  
    - Add a script entry `"cli": "node cli-installer.js"` for easy CLI invocation.

---

## 6. Integration of AI Providers

- **Replicate Integration (Enhancement):**
  - In `src/app/api/enhance/route.ts`, implement a fetch call to `https://api.replicate.com/v1/predictions`.  
  - Include `Authorization: Token ${process.env.REPLICATE_API_KEY}` in the request headers.
  
- **OpenRouter Integration (Classification):**
  - In `src/app/api/classify/route.ts`, send a request to `https://openrouter.ai/api/v1/chat/completions` using the provided API key.
  - Use a JSON body with an array of messages, e.g.:
    ```json
    {
      "model": "anthropic/claude-sonnet-4",
      "messages": [
        {"role": "user", "content": [{"type": "text", "text": "Classify the image quality. Identify if it is too bright, too dark, too blurry, etc."}]}
      ]
    }
    ```
  - Parse and relay the response as classification results.

---

## 7. Testing, Error Handling, and Documentation

- **Error Handling:**  
  - Add comprehensive try-catch blocks in all API endpoints and CLI installer.
  - Validate request bodies and image file integrity; return standardized error responses.
  
- **Testing:**  
  - Use curl commands to test each API endpoint. For example:
    ```bash
    curl -X POST http://localhost:3000/api/enhance -H "Content-Type: application/json" -d '{"image": "base64EncodedData"}'
    ```
  - Validate HTTP status codes and JSON responses.

- **Documentation:**  
  - Update `README.md` with instructions on starting the Next.js app, using the CLI installer, and adding/modifying local models.
  - Include sample usage examples for both the web UI and CLI tool.

---

## Summary

- Environment variables and directories are set up via a new `.env.local` and `/models` folder.
- API endpoints for image enhancement and classification are created at `src/app/api/enhance/route.ts` and `src/app/api/classify/route.ts`, with robust error handling.
- A modern UI is built in `src/app/page.tsx` with components for file upload, image preview, diagnostic results, and batch processing.
- A CLI installer (`cli-installer.js`) is implemented to display ASCII art and set up local dependencies and model storage.
- The app integrates Replicate and OpenRouter APIs using provided keys and defaults to `anthropic/claude-sonnet-4` for classification.
- Comprehensive testing, detailed error management, and clear documentation are included to ensure production-level quality.
