'use client'

import { useState, useRef } from 'react'

interface BatchItem {
  id: string
  file: File
  originalImage: string
  enhancedImage?: string
  classification?: any
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  processingTime?: number
}

interface BatchResult {
  id: string
  filename?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  originalImage?: string
  enhancedImage?: string
  classification?: any
  error?: string
  processingTime?: number
}

export default function BatchProcessing() {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchResults, setBatchResults] = useState<any>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [currentlyProcessing, setCurrentlyProcessing] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }

  const addFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Please select valid image files')
      return
    }

    if (batchItems.length + imageFiles.length > 1000) {
      alert('Maximum 1000 images allowed per batch')
      return
    }

    const newItems: BatchItem[] = []

    for (const file of imageFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large (max 10MB)`)
        continue
      }

      try {
        const reader = new FileReader()
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        newItems.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          originalImage: imageData,
          status: 'pending'
        })
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error)
      }
    }

    setBatchItems(prev => [...prev, ...newItems])
  }

  const removeItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id))
  }

  const clearAll = () => {
    setBatchItems([])
    setBatchResults(null)
  }

  const processBatch = async () => {
    if (batchItems.length === 0) return

    setIsProcessing(true)
    setBatchResults(null)
    setProcessingProgress(0)
    setCurrentlyProcessing(0)

    try {
      // For large batches (>100 images), process in chunks to avoid timeout
      const CHUNK_SIZE = batchItems.length > 100 ? 50 : batchItems.length
      const chunks = []
      
      for (let i = 0; i < batchItems.length; i += CHUNK_SIZE) {
        chunks.push(batchItems.slice(i, i + CHUNK_SIZE))
      }

      let allResults: any[] = []
      let completedCount = 0

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex]
        
        // Prepare chunk data
        const chunkData = {
          images: chunk.map(item => ({
            id: item.id,
            image: item.originalImage,
            filename: item.file.name,
            options: {
              scale: 4,
              faceEnhance: true
            }
          })),
          globalOptions: {
            model: 'nightmareai/real-esrgan'
          }
        }

        // Update chunk items to processing status
        setBatchItems(prev => prev.map(item => {
          if (chunk.find(chunkItem => chunkItem.id === item.id)) {
            return { ...item, status: 'processing' as const }
          }
          return item
        }))

        setCurrentlyProcessing(chunkIndex + 1)

        const response = await fetch('/api/batch/enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunkData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Batch processing failed')
        }

        const chunkResult = await response.json()
        allResults = [...allResults, ...chunkResult.results]
        completedCount += chunk.length

        // Update progress
        setProcessingProgress((completedCount / batchItems.length) * 100)

        // Update items with chunk results
        setBatchItems(prev => prev.map(item => {
          const resultItem = chunkResult.results.find((r: BatchResult) => r.id === item.id)
          if (resultItem) {
            return {
              ...item,
              status: resultItem.status,
              enhancedImage: resultItem.enhancedImage,
              classification: resultItem.classification,
              error: resultItem.error,
              processingTime: resultItem.processingTime
            }
          }
          return item
        }))
      }

      // Create combined results
      const combinedResults = {
        success: true,
        batchId: `batch_${Date.now()}`,
        summary: {
          total: batchItems.length,
          completed: allResults.filter(r => r.status === 'completed').length,
          failed: allResults.filter(r => r.status === 'failed').length,
          successRate: (allResults.filter(r => r.status === 'completed').length / batchItems.length) * 100,
          totalProcessingTime: allResults.reduce((sum, r) => sum + (r.processingTime || 0), 0),
          averageProcessingTime: allResults.reduce((sum, r) => sum + (r.processingTime || 0), 0) / batchItems.length
        },
        results: allResults
      }

      setBatchResults(combinedResults)

    } catch (error) {
      console.error('Batch processing error:', error)
      alert(error instanceof Error ? error.message : 'Batch processing failed')
      
      // Reset items to pending status
      setBatchItems(prev => prev.map(item => ({ ...item, status: 'pending' as const })))
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
      setCurrentlyProcessing(0)
    }
  }

  const downloadAll = () => {
    const completedItems = batchItems.filter(item => item.status === 'completed' && item.enhancedImage)
    
    completedItems.forEach((item, index) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = item.enhancedImage!
        link.download = `enhanced_${item.file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, index * 500) // Stagger downloads
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'processing':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop multiple images here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Up to 1000 images, max 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Batch Controls */}
      {batchItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {batchItems.length} image{batchItems.length !== 1 ? 's' : ''} selected
              {batchItems.length > 100 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-md">
                  Large Batch - Will process in chunks
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                disabled={isProcessing}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
              <button
                onClick={processBatch}
                disabled={isProcessing || batchItems.length === 0}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Enhance All'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Processing Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(processingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              {batchItems.length > 100 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Processing chunk {currentlyProcessing} of {Math.ceil(batchItems.length / 50)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batch Results Summary */}
      {batchResults && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Batch Results
            </h3>
            {batchResults.summary.completed > 0 && (
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Download All Enhanced
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Total:</span>
              <p className="font-medium text-gray-900 dark:text-white">{batchResults.summary.total}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Completed:</span>
              <p className="font-medium text-green-600 dark:text-green-400">{batchResults.summary.completed}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Failed:</span>
              <p className="font-medium text-red-600 dark:text-red-400">{batchResults.summary.failed}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {Math.round(batchResults.summary.successRate)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Batch Items List */}
      {batchItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Processing Queue
          </h3>
          <div className="space-y-3">
            {batchItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.originalImage}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/f1ae42d1-625c-4cb6-a9b0-6ebdefad7671.png"
                        }}
                      />
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {item.file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {item.processingTime && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Processed in {(item.processingTime / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status === 'processing' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing</span>
                        </div>
                      )}
                      {item.status !== 'processing' && (
                        <span className="capitalize">{item.status}</span>
                      )}
                    </div>

                    {/* Actions */}
                    {item.status === 'completed' && item.enhancedImage && (
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = item.enhancedImage!
                          link.download = `enhanced_${item.file.name}`
                          link.click()
                        }}
                        className="px-3 py-1 text-xs bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                      >
                        Download
                      </button>
                    )}

                    {!isProcessing && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {item.error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-300">{item.error}</p>
                  </div>
                )}

                {/* Enhanced Preview */}
                {item.status === 'completed' && item.enhancedImage && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Original</p>
                      <img
                        src={item.originalImage}
                        alt="Original"
                        className="w-full h-24 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/a27c518d-0bce-4a90-aba0-9cac330979fb.png"
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Enhanced</p>
                      <img
                        src={item.enhancedImage}
                        alt="Enhanced"
                        className="w-full h-24 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/6516e0c9-5e30-4588-b7c4-78ac27d4f3ae.png"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
