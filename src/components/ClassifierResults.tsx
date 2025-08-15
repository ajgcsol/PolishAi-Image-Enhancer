'use client'

interface ClassificationResult {
  overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
  brightness: 'too_bright' | 'too_dark' | 'optimal';
  sharpness: 'too_sharp' | 'too_blurry' | 'optimal';
  contrast: 'too_high' | 'too_low' | 'optimal';
  saturation: 'oversaturated' | 'undersaturated' | 'optimal';
  noise: 'high' | 'medium' | 'low';
  artifacts: 'present' | 'minimal' | 'none';
  resolution_quality: 'pixelated' | 'soft' | 'crisp';
  color_balance: 'warm_bias' | 'cool_bias' | 'neutral';
  recommendations: string[];
  confidence_score: number;
}

interface ClassifierResultsProps {
  classification: ClassificationResult;
}

export default function ClassifierResults({ classification }: ClassifierResultsProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'good':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'fair':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'poor':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'optimal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'low':
      case 'none':
      case 'minimal':
      case 'crisp':
      case 'neutral':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'high':
      case 'present':
      case 'too_bright':
      case 'too_dark':
      case 'too_sharp':
      case 'too_blurry':
      case 'too_high':
      case 'too_low':
      case 'oversaturated':
      case 'undersaturated':
      case 'pixelated':
      case 'soft':
      case 'warm_bias':
      case 'cool_bias':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatValue = (value: string) => {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const analysisItems = [
    { key: 'overall_quality', label: 'Overall Quality', value: classification.overall_quality },
    { key: 'brightness', label: 'Brightness', value: classification.brightness },
    { key: 'sharpness', label: 'Sharpness', value: classification.sharpness },
    { key: 'contrast', label: 'Contrast', value: classification.contrast },
    { key: 'saturation', label: 'Saturation', value: classification.saturation },
    { key: 'noise', label: 'Noise Level', value: classification.noise },
    { key: 'artifacts', label: 'Artifacts', value: classification.artifacts },
    { key: 'resolution_quality', label: 'Resolution Quality', value: classification.resolution_quality },
    { key: 'color_balance', label: 'Color Balance', value: classification.color_balance },
  ]

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div className="inline-flex items-center space-x-3">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(classification.confidence_score * 100)}%
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Confidence Score</p>
            <p className={`text-sm font-medium ${getConfidenceColor(classification.confidence_score)}`}>
              {classification.confidence_score >= 0.8 ? 'High Confidence' : 
               classification.confidence_score >= 0.6 ? 'Medium Confidence' : 'Low Confidence'}
            </p>
          </div>
        </div>
      </div>

      {/* Quality Analysis Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analysisItems.map((item) => (
          <div
            key={item.key}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </h4>
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(item.value)}`}>
              {formatValue(item.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {classification.recommendations && classification.recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
              !
            </span>
            Recommendations for Further Improvement
          </h4>
          <ul className="space-y-2">
            {classification.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2 text-blue-800 dark:text-blue-200">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quality Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quality Breakdown</h4>
        <div className="space-y-3">
          {/* Positive Aspects */}
          <div>
            <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              ✓ Positive Aspects
            </h5>
            <div className="flex flex-wrap gap-2">
              {analysisItems
                .filter(item => ['optimal', 'excellent', 'good', 'low', 'none', 'minimal', 'crisp', 'neutral'].includes(item.value))
                .map(item => (
                  <span
                    key={item.key}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-md"
                  >
                    {item.label}
                  </span>
                ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div>
            <h5 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
              ⚠ Areas for Improvement
            </h5>
            <div className="flex flex-wrap gap-2">
              {analysisItems
                .filter(item => !['optimal', 'excellent', 'good', 'low', 'none', 'minimal', 'crisp', 'neutral'].includes(item.value))
                .map(item => (
                  <span
                    key={item.key}
                    className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-md"
                  >
                    {item.label}: {formatValue(item.value)}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <details className="bg-gray-50 dark:bg-gray-700 rounded-lg">
        <summary className="p-4 cursor-pointer font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
          Technical Analysis Details
        </summary>
        <div className="p-4 pt-0 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Analysis Model:</span>
              <p className="font-medium text-gray-900 dark:text-white">Claude 3.5 Sonnet</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Processing Time:</span>
              <p className="font-medium text-gray-900 dark:text-white">~2-3 seconds</p>
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Analysis Criteria:</span>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              Multi-dimensional quality assessment including brightness, contrast, sharpness, noise levels, 
              artifact detection, color balance, and resolution quality using advanced computer vision techniques.
            </p>
          </div>
        </div>
      </details>
    </div>
  )
}
