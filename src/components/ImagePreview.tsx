'use client'

import { useState } from 'react'

interface ImagePreviewProps {
  originalImage: string | null
  enhancedImage: string | null
  isProcessing: boolean
}

export default function ImagePreview({ originalImage, enhancedImage, isProcessing }: ImagePreviewProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'slider' | 'enhanced-only'>('side-by-side')
  const [sliderPosition, setSliderPosition] = useState(50)

  const handleDownload = async (imageData: string, filename: string) => {
    try {
      let downloadUrl = imageData;
      
      // If it's a URL (not base64), we need to fetch it and convert to blob
      if (imageData.startsWith('http')) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        downloadUrl = URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL if we created one
      if (imageData.startsWith('http')) {
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      }
      
      // Show success message
      const event = new CustomEvent('download-success', { 
        detail: { filename } 
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Fallback: try to open in new tab
      try {
        const newWindow = window.open(imageData, '_blank');
        if (newWindow) {
          alert('Download failed, but image opened in new tab. Right-click and "Save As" to download.');
        } else {
          alert('Download failed and popup blocked. Please allow popups and try again.');
        }
      } catch (fallbackError) {
        alert('Download failed. Please try right-clicking the image and selecting "Save As".');
      }
    }
  }

  if (!originalImage && !enhancedImage) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* View Mode Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setViewMode('side-by-side')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'side-by-side'
              ? 'bg-black text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Side by Side
        </button>
        <button
          onClick={() => setViewMode('slider')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'slider'
              ? 'bg-black text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          disabled={!enhancedImage}
        >
          Before/After Slider
        </button>
        <button
          onClick={() => setViewMode('enhanced-only')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            viewMode === 'enhanced-only'
              ? 'bg-black text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          disabled={!enhancedImage}
        >
          Enhanced Only
        </button>
      </div>

      {/* Image Display */}
      <div className="relative">
        {viewMode === 'side-by-side' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Original
                </h3>
                {originalImage && (
                  <button
                    onClick={() => handleDownload(originalImage, 'original-image.jpg')}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Download
                  </button>
                )}
              </div>
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square">
                {originalImage ? (
                  <img
                    src={originalImage}
                    alt="Original image"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/098c2715-d81c-4bdf-8057-ee565b7ef9a7.png"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No original image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Image */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Enhanced
                </h3>
                {enhancedImage && (
                  <button
                    onClick={() => handleDownload(enhancedImage, 'enhanced-image.jpg')}
                    className="px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Download
                  </button>
                )}
              </div>
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-square">
                {isProcessing ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500 dark:text-gray-400">Enhancing...</p>
                    </div>
                  </div>
                ) : enhancedImage ? (
                  <img
                    src={enhancedImage}
                    alt="Enhanced image"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/bbf00ff7-4686-48d3-8a71-d15d586664be.png"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Enhancement in progress...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'slider' && originalImage && enhancedImage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Before/After Comparison
              </h3>
              <button
                onClick={() => handleDownload(enhancedImage, 'enhanced-image.jpg')}
                className="px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Download Enhanced
              </button>
            </div>
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden aspect-video max-w-4xl mx-auto">
              {/* Background (Enhanced) Image */}
              <img
                src={enhancedImage}
                alt="Enhanced image"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/603e610b-40ea-459a-825f-9cc8d2599505.png"
                }}
              />
              
              {/* Overlay (Original) Image */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={originalImage}
                  alt="Original image"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/3ad07d94-ab1c-4555-87f9-f4cb57de706c.png"
                  }}
                />
              </div>
              
              {/* Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>
                </div>
              </div>
              
              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 max-w-4xl mx-auto">
              <span>Original</span>
              <span>Enhanced</span>
            </div>
          </div>
        )}

        {viewMode === 'enhanced-only' && enhancedImage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Enhanced Result
              </h3>
              <button
                onClick={() => handleDownload(enhancedImage, 'enhanced-image.jpg')}
                className="px-3 py-1 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden max-w-4xl mx-auto">
              <img
                src={enhancedImage}
                alt="Enhanced image"
                className="w-full h-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/be0fb7f7-dc85-4daa-b45d-fa305e087f33.png"
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Info */}
      {(originalImage || enhancedImage) && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enhancement Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Model:</span>
              <p className="font-medium text-gray-900 dark:text-white">Real-ESRGAN</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Scale:</span>
              <p className="font-medium text-gray-900 dark:text-white">4x</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Face Enhancement:</span>
              <p className="font-medium text-gray-900 dark:text-white">Enabled</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <p className="font-medium text-green-600 dark:text-green-400">
                {isProcessing ? 'Processing...' : 'Complete'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
