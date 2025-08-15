'use client'

import { useState } from 'react'

export interface QualityPreset {
  id: string
  name: string
  description: string
  format: 'png' | 'jpeg' | 'webp'
  quality: number
  scale: number
  estimatedSizeMultiplier: number
  processingTime: 'fast' | 'medium' | 'slow'
}

const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Balanced quality and file size for web use',
    format: 'webp',
    quality: 85,
    scale: 2,
    estimatedSizeMultiplier: 1.2,
    processingTime: 'fast'
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Better quality with moderate file size',
    format: 'jpeg',
    quality: 95,
    scale: 4,
    estimatedSizeMultiplier: 2.5,
    processingTime: 'medium'
  },
  {
    id: 'maximum-quality',
    name: 'Maximum Quality',
    description: 'Best possible quality, larger file size',
    format: 'png',
    quality: 100,
    scale: 4,
    estimatedSizeMultiplier: 4.0,
    processingTime: 'slow'
  },
  {
    id: 'print-ready',
    name: 'Print Ready',
    description: 'Ultra-high quality for printing',
    format: 'png',
    quality: 100,
    scale: 8,
    estimatedSizeMultiplier: 8.0,
    processingTime: 'slow'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Configure your own settings',
    format: 'jpeg',
    quality: 90,
    scale: 4,
    estimatedSizeMultiplier: 2.0,
    processingTime: 'medium'
  }
]

interface QualitySettingsProps {
  selectedPreset: QualityPreset
  onPresetChange: (preset: QualityPreset) => void
  originalFileSize?: number
  showAdvanced?: boolean
}

export default function QualitySettings({ 
  selectedPreset, 
  onPresetChange, 
  originalFileSize,
  showAdvanced = false 
}: QualitySettingsProps) {
  const [customSettings, setCustomSettings] = useState(selectedPreset)
  const [showCustomOptions, setShowCustomOptions] = useState(selectedPreset.id === 'custom')

  const handlePresetSelect = (preset: QualityPreset) => {
    setShowCustomOptions(preset.id === 'custom')
    if (preset.id === 'custom') {
      onPresetChange(customSettings)
    } else {
      onPresetChange(preset)
    }
  }

  const handleCustomChange = (field: keyof QualityPreset, value: any) => {
    const updated = { ...customSettings, [field]: value }
    setCustomSettings(updated)
    if (selectedPreset.id === 'custom') {
      onPresetChange(updated)
    }
  }

  const getEstimatedFileSize = (preset: QualityPreset) => {
    if (!originalFileSize) return null
    const estimatedSize = originalFileSize * preset.estimatedSizeMultiplier
    return formatFileSize(estimatedSize)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getProcessingTimeColor = (time: string) => {
    switch (time) {
      case 'fast': return 'text-green-600 dark:text-green-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'slow': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quality & Output Settings
        </h3>
        
        {/* Quality Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {QUALITY_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedPreset.id === preset.id
                  ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handlePresetSelect(preset)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {preset.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {preset.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-xs">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {preset.format.toUpperCase()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {preset.scale}x scale
                    </span>
                    <span className={`${getProcessingTimeColor(preset.processingTime)} capitalize`}>
                      {preset.processingTime}
                    </span>
                  </div>

                  {originalFileSize && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Est. size: {getEstimatedFileSize(preset)}
                    </div>
                  )}
                </div>
                
                <div className="ml-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedPreset.id === preset.id
                      ? 'border-black dark:border-white bg-black dark:bg-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Settings */}
        {showCustomOptions && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Custom Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Output Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Output Format
                </label>
                <select
                  value={customSettings.format}
                  onChange={(e) => handleCustomChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="jpeg">JPEG (Smaller size)</option>
                  <option value="png">PNG (Lossless)</option>
                  <option value="webp">WebP (Modern format)</option>
                </select>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality: {customSettings.quality}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={customSettings.quality}
                  onChange={(e) => handleCustomChange('quality', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Smaller</span>
                  <span>Larger</span>
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upscale Factor: {customSettings.scale}x
                </label>
                <select
                  value={customSettings.scale}
                  onChange={(e) => handleCustomChange('scale', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={1}>1x (No upscaling)</option>
                  <option value={2}>2x (4x pixels)</option>
                  <option value={4}>4x (16x pixels)</option>
                  <option value={8}>8x (64x pixels)</option>
                </select>
              </div>

              {/* Estimated Size Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size Impact: {customSettings.estimatedSizeMultiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={customSettings.estimatedSizeMultiplier}
                  onChange={(e) => handleCustomChange('estimatedSizeMultiplier', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0.5x</span>
                  <span>10x</span>
                </div>
              </div>
            </div>

            {originalFileSize && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Original size: {formatFileSize(originalFileSize)}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Estimated output: {getEstimatedFileSize(customSettings)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quality Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Quality Guide
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div><strong>Web Optimized:</strong> Best for websites and social media</div>
            <div><strong>High Quality:</strong> Good balance for most use cases</div>
            <div><strong>Maximum Quality:</strong> For professional work and archival</div>
            <div><strong>Print Ready:</strong> Ultra-high resolution for printing</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { QUALITY_PRESETS }
