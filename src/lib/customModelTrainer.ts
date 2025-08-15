export interface TrainingData {
  id: string;
  originalImage: string;
  enhancedImage: string;
  userRating: number; // 1-5 scale
  userFeedback: {
    tooBlurry: boolean;
    tooSharp: boolean;
    tooBright: boolean;
    tooDark: boolean;
    artifacts: boolean;
    goodQuality: boolean;
  };
  processingParams: {
    sharpen: number;
    contrast: number;
    brightness: number;
    saturation: number;
    denoise: boolean;
    scale: number;
  };
  imageMetrics: {
    originalSharpness: number;
    enhancedSharpness: number;
    originalContrast: number;
    enhancedContrast: number;
    noiseLevel: number;
  };
  timestamp: number;
}

export interface ModelPerformance {
  averageRating: number;
  totalProcessed: number;
  successRate: number;
  commonIssues: string[];
  bestParams: {
    sharpen: number;
    contrast: number;
    brightness: number;
    saturation: number;
  };
  improvementTrend: number[];
}

export class CustomModelTrainer {
  private trainingData: TrainingData[] = [];
  private modelVersion: string = '1.0.0';
  private performance: ModelPerformance;

  constructor() {
    this.performance = {
      averageRating: 0,
      totalProcessed: 0,
      successRate: 0,
      commonIssues: [],
      bestParams: {
        sharpen: 0.8,
        contrast: 1.2,
        brightness: 1.1,
        saturation: 1.1
      },
      improvementTrend: []
    };
    this.loadTrainingData();
  }

  /**
   * Add new training data from user feedback
   */
  async addTrainingData(data: Omit<TrainingData, 'id' | 'timestamp'>): Promise<void> {
    const trainingEntry: TrainingData = {
      ...data,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.trainingData.push(trainingEntry);
    await this.saveTrainingData();
    this.updatePerformanceMetrics();
    
    // Trigger model retraining if we have enough new data
    if (this.trainingData.length % 50 === 0) {
      await this.retrainModel();
    }
  }

  /**
   * Get optimized parameters based on training data
   */
  getOptimizedParams(imageCharacteristics: {
    brightness: number;
    contrast: number;
    sharpness: number;
    noiseLevel: number;
  }): {
    sharpen: number;
    contrast: number;
    brightness: number;
    saturation: number;
    denoise: boolean;
    scale: number;
  } {
    // Find similar images in training data
    const similarImages = this.findSimilarImages(imageCharacteristics);
    
    if (similarImages.length === 0) {
      return {
        sharpen: this.performance.bestParams.sharpen,
        contrast: this.performance.bestParams.contrast,
        brightness: this.performance.bestParams.brightness,
        saturation: this.performance.bestParams.saturation,
        denoise: imageCharacteristics.noiseLevel > 0.3,
        scale: 2
      };
    }

    // Weight parameters by user ratings
    let totalWeight = 0;
    const weightedParams = {
      sharpen: 0,
      contrast: 0,
      brightness: 0,
      saturation: 0,
      denoise: 0,
      scale: 0
    };

    similarImages.forEach(data => {
      const weight = data.userRating / 5; // Normalize to 0-1
      totalWeight += weight;
      
      weightedParams.sharpen += data.processingParams.sharpen * weight;
      weightedParams.contrast += data.processingParams.contrast * weight;
      weightedParams.brightness += data.processingParams.brightness * weight;
      weightedParams.saturation += data.processingParams.saturation * weight;
      weightedParams.denoise += (data.processingParams.denoise ? 1 : 0) * weight;
      weightedParams.scale += data.processingParams.scale * weight;
    });

    if (totalWeight > 0) {
      return {
        sharpen: weightedParams.sharpen / totalWeight,
        contrast: weightedParams.contrast / totalWeight,
        brightness: weightedParams.brightness / totalWeight,
        saturation: weightedParams.saturation / totalWeight,
        denoise: (weightedParams.denoise / totalWeight) > 0.5,
        scale: Math.round(weightedParams.scale / totalWeight)
      };
    }

    return {
      sharpen: this.performance.bestParams.sharpen,
      contrast: this.performance.bestParams.contrast,
      brightness: this.performance.bestParams.brightness,
      saturation: this.performance.bestParams.saturation,
      denoise: imageCharacteristics.noiseLevel > 0.3,
      scale: 2
    };
  }

  /**
   * Analyze image characteristics for parameter optimization
   */
  analyzeImageCharacteristics(imageData: string): Promise<{
    brightness: number;
    contrast: number;
    sharpness: number;
    noiseLevel: number;
  }> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Return default values during SSR
        resolve({
          brightness: 0.5,
          contrast: 0.5,
          sharpness: 0.5,
          noiseLevel: 0.3
        });
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate brightness
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          totalBrightness += brightness;
        }
        const avgBrightness = totalBrightness / (data.length / 4) / 255;
        
        // Calculate contrast (standard deviation of brightness)
        let contrastSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
          contrastSum += Math.pow(brightness - avgBrightness, 2);
        }
        const contrast = Math.sqrt(contrastSum / (data.length / 4));
        
        // Calculate sharpness (edge detection)
        const sharpness = this.calculateSharpness(data, canvas.width, canvas.height);
        
        // Calculate noise level
        const noiseLevel = this.calculateNoiseLevel(data, canvas.width, canvas.height);
        
        resolve({
          brightness: avgBrightness,
          contrast: contrast,
          sharpness: sharpness,
          noiseLevel: noiseLevel
        });
      };
      
      img.onerror = () => reject(new Error('Failed to analyze image'));
      img.src = imageData;
    });
  }

  /**
   * Get current model performance metrics
   */
  getPerformanceMetrics(): ModelPerformance {
    return { ...this.performance };
  }

  /**
   * Export training data for backup or analysis
   */
  exportTrainingData(): string {
    return JSON.stringify({
      version: this.modelVersion,
      trainingData: this.trainingData,
      performance: this.performance,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Import training data from backup
   */
  async importTrainingData(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData);
      this.trainingData = imported.trainingData || [];
      this.performance = imported.performance || this.performance;
      this.modelVersion = imported.version || this.modelVersion;
      
      await this.saveTrainingData();
      this.updatePerformanceMetrics();
    } catch (error) {
      throw new Error('Invalid training data format');
    }
  }

  // Private methods

  private findSimilarImages(characteristics: {
    brightness: number;
    contrast: number;
    sharpness: number;
    noiseLevel: number;
  }): TrainingData[] {
    const threshold = 0.2; // Similarity threshold
    
    return this.trainingData.filter(data => {
      const brightnessDiff = Math.abs(data.imageMetrics.originalContrast - characteristics.brightness);
      const contrastDiff = Math.abs(data.imageMetrics.originalContrast - characteristics.contrast);
      const sharpnessDiff = Math.abs(data.imageMetrics.originalSharpness - characteristics.sharpness);
      const noiseDiff = Math.abs(data.imageMetrics.noiseLevel - characteristics.noiseLevel);
      
      const totalDiff = (brightnessDiff + contrastDiff + sharpnessDiff + noiseDiff) / 4;
      return totalDiff < threshold;
    });
  }

  private calculateSharpness(data: Uint8ClampedArray, width: number, height: number): number {
    let sharpnessSum = 0;
    let count = 0;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const center = data[(y * width + x) * 4 + c];
          const right = data[(y * width + x + 1) * 4 + c];
          const bottom = data[((y + 1) * width + x) * 4 + c];
          
          const gradientX = Math.abs(right - center);
          const gradientY = Math.abs(bottom - center);
          const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
          
          sharpnessSum += gradient;
          count++;
        }
      }
    }
    
    return count > 0 ? sharpnessSum / count / 255 : 0;
  }

  private calculateNoiseLevel(data: Uint8ClampedArray, width: number, height: number): number {
    let noiseSum = 0;
    let count = 0;
    
    // Sample random pixels to estimate noise
    const sampleSize = Math.min(1000, (width * height) / 4);
    
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      
      for (let c = 0; c < 3; c++) {
        const center = data[(y * width + x) * 4 + c];
        let neighborSum = 0;
        let neighborCount = 0;
        
        // Average of 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            neighborSum += data[((y + dy) * width + (x + dx)) * 4 + c];
            neighborCount++;
          }
        }
        
        const neighborAvg = neighborSum / neighborCount;
        const deviation = Math.abs(center - neighborAvg);
        noiseSum += deviation;
        count++;
      }
    }
    
    return count > 0 ? noiseSum / count / 255 : 0;
  }

  private updatePerformanceMetrics(): void {
    if (this.trainingData.length === 0) return;
    
    const ratings = this.trainingData.map(d => d.userRating);
    this.performance.averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    this.performance.totalProcessed = this.trainingData.length;
    this.performance.successRate = this.trainingData.filter(d => d.userRating >= 4).length / this.trainingData.length;
    
    // Update best parameters based on highest-rated results
    const highRatedData = this.trainingData.filter(d => d.userRating >= 4);
    if (highRatedData.length > 0) {
      const avgParams = {
        sharpen: 0,
        contrast: 0,
        brightness: 0,
        saturation: 0
      };
      
      highRatedData.forEach(d => {
        avgParams.sharpen += d.processingParams.sharpen;
        avgParams.contrast += d.processingParams.contrast;
        avgParams.brightness += d.processingParams.brightness;
        avgParams.saturation += d.processingParams.saturation;
      });
      
      const count = highRatedData.length;
      this.performance.bestParams = {
        sharpen: avgParams.sharpen / count,
        contrast: avgParams.contrast / count,
        brightness: avgParams.brightness / count,
        saturation: avgParams.saturation / count
      };
    }
    
    // Update improvement trend
    const recentData = this.trainingData.slice(-10);
    if (recentData.length > 0) {
      const recentAvg = recentData.reduce((sum, d) => sum + d.userRating, 0) / recentData.length;
      this.performance.improvementTrend.push(recentAvg);
      
      // Keep only last 20 trend points
      if (this.performance.improvementTrend.length > 20) {
        this.performance.improvementTrend = this.performance.improvementTrend.slice(-20);
      }
    }
    
    // Identify common issues
    const issues: string[] = [];
    const issueCount = {
      tooBlurry: 0,
      tooSharp: 0,
      tooBright: 0,
      tooDark: 0,
      artifacts: 0
    };
    
    this.trainingData.forEach(d => {
      if (d.userFeedback.tooBlurry) issueCount.tooBlurry++;
      if (d.userFeedback.tooSharp) issueCount.tooSharp++;
      if (d.userFeedback.tooBright) issueCount.tooBright++;
      if (d.userFeedback.tooDark) issueCount.tooDark++;
      if (d.userFeedback.artifacts) issueCount.artifacts++;
    });
    
    const threshold = this.trainingData.length * 0.1; // 10% threshold
    Object.entries(issueCount).forEach(([issue, count]) => {
      if (count > threshold) {
        issues.push(issue);
      }
    });
    
    this.performance.commonIssues = issues;
  }

  private async retrainModel(): Promise<void> {
    console.log('Retraining model with', this.trainingData.length, 'samples');
    
    // Increment model version
    const [major, minor, patch] = this.modelVersion.split('.').map(Number);
    this.modelVersion = `${major}.${minor}.${patch + 1}`;
    
    // Update performance metrics
    this.updatePerformanceMetrics();
    
    // Save updated model
    await this.saveTrainingData();
    
    console.log('Model retrained to version', this.modelVersion);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async loadTrainingData(): Promise<void> {
    try {
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const stored = localStorage.getItem('customModelTrainingData');
      if (stored) {
        const data = JSON.parse(stored);
        this.trainingData = data.trainingData || [];
        this.performance = data.performance || this.performance;
        this.modelVersion = data.modelVersion || this.modelVersion;
      }
    } catch (error) {
      console.warn('Failed to load training data:', error);
    }
  }

  private async saveTrainingData(): Promise<void> {
    try {
      if (typeof window === 'undefined') return; // Skip during SSR
      
      const data = {
        trainingData: this.trainingData,
        performance: this.performance,
        modelVersion: this.modelVersion,
        lastUpdated: Date.now()
      };
      localStorage.setItem('customModelTrainingData', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save training data:', error);
    }
  }
}

// Export factory function to avoid SSR issues
export const getModelTrainer = () => {
  if (typeof window === 'undefined') {
    // Return a mock during SSR
    return {
      analyzeImageCharacteristics: async () => ({
        brightness: 0.5,
        contrast: 0.5,
        sharpness: 0.5,
        noiseLevel: 0.3
      }),
      getOptimizedParams: () => ({
        sharpen: 0.8,
        contrast: 1.2,
        brightness: 1.1,
        saturation: 1.1,
        denoise: true,
        scale: 2
      })
    };
  }
  return new CustomModelTrainer();
};

// Export lazy-loaded singleton
let _modelTrainer: CustomModelTrainer | null = null;
export const modelTrainer = {
  analyzeImageCharacteristics: async (imageData: string) => {
    if (!_modelTrainer) {
      _modelTrainer = getModelTrainer() as CustomModelTrainer;
    }
    return _modelTrainer.analyzeImageCharacteristics(imageData);
  },
  getOptimizedParams: (imageCharacteristics: any) => {
    if (!_modelTrainer) {
      _modelTrainer = getModelTrainer() as CustomModelTrainer;
    }
    return _modelTrainer.getOptimizedParams(imageCharacteristics);
  }
};
