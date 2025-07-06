
// ML Model Types
export interface ModelConfig {
  id: string
  version: string
  type: 'classification' | 'regression' | 'clustering' | 'nlp'
  isActive: boolean
}

export interface PredictionRequest {
  modelId: string
  features: Record<string, any>
  userId?: string
}

export interface PredictionResponse {
  modelId: string
  modelVersion: string
  prediction: any
  confidence: number
  metadata: Record<string, any>
}

export interface TrainingData {
  features: Record<string, any>[]
  labels: any[]
  samples: number
  metadata?: Record<string, any>
}

export interface PredictionResult {
  prediction: any
  confidence: number
  metadata?: Record<string, any>
}

export interface MLModel {
  id: string
  version: string
  type: string
  predict(features: any): Promise<PredictionResult>
  train(data: TrainingData): Promise<void>
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  confusionMatrix?: number[][]
}
