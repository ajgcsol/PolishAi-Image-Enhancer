'use client'

import { useState, useEffect } from 'react'
import FileUpload from '@/components/FileUpload'
import ImagePreview from '@/components/ImagePreview'
import ClassifierResults from '@/components/ClassifierResults'
import BatchProcessing from '@/components/BatchProcessing'
import QualitySettings, { QualityPreset, QUALITY_PRESETS } from '@/components/QualitySettings'
import { clientProcessor } from '@/lib/clientImageProcessor'
import { modelTrainer } from '@/lib/customModelTrainer'
import { useToast } from '@/components/Toast'

interface ErrorDetails {
  message: string
  details?: string
  troubleshooting?: {
    steps: string[]
    fallback: string
  }
  status?: number
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)
  const [classification, setClassification] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<ErrorDetails | null>(null)
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>(QUALITY_PRESETS[1]) // Default to High Quality
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [useFallback, setUseFallback] = useState(false)
  const [processingMethod, setProcessingMethod] = useState<'replicate' | 'fallback' | 'auto'>('auto')
  const { showToast, ToastContainer } = useToast()

  // Listen for download success events
  useEffect(() => {
    const handleDownloadSuccess = (event: CustomEvent) => {
      showToast(`${event.detail.filename} downloaded successfully!`, 'success')
    }

    window.addEventListener('download-success', handleDownloadSuccess as EventListener)
    return () => {
      window.removeEventListener('download-success', handleDownloadSuccess as EventListener)
    }
  }, [showToast])

  const handleImageUpload = async (imageData: string, file?: File) => {
    setOriginalImage(imageData)
    setEnhancedImage(null)
    setClassification(null)
    setError(null)
    setIsProcessing(true)
    if (file) setOriginalFile(file)

    try {
      let shouldUseFallback = useFallback || processingMethod === 'fallback'
      
      // Try Replicate first if not explicitly using fallback
      if (!shouldUseFallback && processingMethod !== 'fallback') {
        try {
          const enhanceResponse = await fetch('/api/enhance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: imageData,
              model: 'nightmareai/real-esrgan',
              useFallback: false,
              options: {
                scale: qualityPreset.scale,
                faceEnhance: true,
                outputFormat: qualityPreset.format,
                quality: qualityPreset.quality
              }
            })
          })

          if (enhanceResponse.ok) {
            const enhanceData = await enhanceResponse.json()
            setEnhancedImage(enhanceData.enhancedImage)
            setProcessingMethod('replicate')

            // Classify the enhanced image
            const classifyResponse = await fetch('/api/classify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: enhanceData.enhancedImage,
                originalImage: imageData,
                enhancementDetails: {
                  model: enhanceData.model,
                  processingTime: enhanceData.processingTime
                }
              })
            })

            if (classifyResponse.ok) {
              const classifyData = await classifyResponse.json()
              setClassification(classifyData.classification)
            }
            return
          } else {
            // Replicate failed, try fallback
            const errorData = await enhanceResponse.json()
            console.warn('Replicate failed, switching to fallback:', errorData.error)
            shouldUseFallback = true
            
            if (errorData.troubleshooting) {
              setError({
                message: `${errorData.error} - Switching to fallback processing`,
                details: errorData.details,
                troubleshooting: errorData.troubleshooting,
                status: enhanceResponse.status
              })
            }
          }
        } catch (replicateError) {
          console.warn('Replicate error, switching to fallback:', replicateError)
          shouldUseFallback = true
        }
      }

      // Use client-side fallback processing
      if (shouldUseFallback) {
        setProcessingMethod('fallback')
        
        // Analyze image characteristics for optimal parameters
        const imageCharacteristics = await modelTrainer.analyzeImageCharacteristics(imageData)
        const optimizedParams = modelTrainer.getOptimizedParams(imageCharacteristics)
        
        // Apply client-side enhancement
        const enhancedImageData = await clientProcessor.enhanceImage(imageData, {
          sharpen: optimizedParams.sharpen,
          contrast: optimizedParams.contrast,
          brightness: optimizedParams.brightness,
          saturation: optimizedParams.saturation,
          denoise: optimizedParams.denoise,
          scale: optimizedParams.scale
        })
        
        setEnhancedImage(enhancedImageData)
        
        // Get quality metrics
        const qualityMetrics = await clientProcessor.getQualityMetrics(imageData, enhancedImageData)
        
        setClassification({
          overall_quality: qualityMetrics.overallQuality,
          sharpness_improvement: qualityMetrics.sharpnessImprovement,
          contrast_improvement: qualityMetrics.contrastImprovement,
          noise_reduction: qualityMetrics.noiseReduction,
          processing_method: 'Client-side Advanced Deblurring',
          recommendations: [
            'Image processed using advanced client-side algorithms',
            'Wiener filter and Lucy-Richardson deconvolution applied',
            'Edge-preserving sharpening used to maintain detail'
          ]
        })
        
        // Clear any previous errors since fallback worked
        setError(null)
      }

    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        details: 'Both cloud and local processing failed. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUseFallback = async () => {
    if (originalImage) {
      setUseFallback(true)
      setProcessingMethod('fallback')
      await handleImageUpload(originalImage, originalFile || undefined)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Advanced Image Enhancement
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          AI-powered image enhancement that removes blur and enhances pictures better than any tool on the market. 
          Get professional-quality results with intelligent quality analysis and customizable output settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'single'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Single Image
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-3 rounded-md font-medium transition-all ${
              activeTab === 'batch'
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Batch Processing
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'single' ? (
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Upload Your Image
            </h2>
            <FileUpload onImageUpload={handleImageUpload} isProcessing={isProcessing} />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error.message}
                    </h3>
                    {error.details && (
                      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                        {error.details}
                      </p>
                    )}
                    {error.troubleshooting && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                          Troubleshooting Steps:
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                          {error.troubleshooting.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {error.troubleshooting.fallback}
                        </p>
                      </div>
                    )}
                    {error.status === 402 && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Quick Fix:</strong> If you just made a payment, please wait 5-10 minutes and try again. 
                          Replicate credits can take a few minutes to process after payment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quality Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <QualitySettings
              selectedPreset={qualityPreset}
              onPresetChange={setQualityPreset}
              originalFileSize={originalFile?.size}
            />
          </div>

          {/* Results Section */}
          {(originalImage || enhancedImage) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Enhancement Results
                {qualityPreset && (
                  <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({qualityPreset.name} - {qualityPreset.format.toUpperCase()})
                  </span>
                )}
              </h2>
              <ImagePreview
                originalImage={originalImage}
                enhancedImage={enhancedImage}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Classification Results */}
          {classification && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Quality Analysis
              </h2>
              <ClassifierResults classification={classification} />
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Batch Processing
            </h2>
            <BatchProcessing />
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Advanced AI Models
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Powered by state-of-the-art AI models including Real-ESRGAN, GFPGAN, and CodeFormer for superior results.
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">⚡</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lightning Fast
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Optimized processing pipeline with local model caching for rapid batch processing and enhanced performance.
          </p>
        </div>

        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">🎯</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Quality Control
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Customizable output formats and quality settings. Choose from web-optimized to print-ready quality levels.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
        <p>Advanced Image Enhancement - Powered by cutting-edge AI technology</p>
      </footer>
    </div>
  )
}
