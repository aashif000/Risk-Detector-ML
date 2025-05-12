import * as tf from '@tensorflow/tfjs';
// No need for separate WebGL import as it's included in the main package
import { DefaultData, HistoryData } from './csvParser';
import { ScoringResult } from '@/components/ResultsDisplay';

export class ModelProcessor {
  private model: tf.Sequential | null = null;
  
  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      // Set the backend to WebGL for GPU acceleration
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('Using TensorFlow.js backend:', tf.getBackend());
      
      // Create a sequential model
      const model = tf.sequential();
      
      // Add first hidden layer
      model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        inputShape: [14], // Expected features after preprocessing
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      // Add dropout for regularization
      model.add(tf.layers.dropout({ rate: 0.2 }));
      
      // Add second hidden layer
      model.add(tf.layers.dense({
        units: 32,
        activation: 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
      }));
      
      // Output layer with sigmoid activation for binary classification
      model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      // Compile the model
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      this.model = model;
      
      // Warm up the model with dummy data
      this.warmupModel();
    } catch (error) {
      console.error('Error initializing model:', error);
      throw error;
    }
  }
  
  private async warmupModel() {
    if (!this.model) return;
    
    try {
      // Create dummy tensor for model warmup
      const dummyInput = tf.zeros([1, 14]);
      
      // Run prediction on dummy data
      const warmupResult = this.model.predict(dummyInput);
      
      // Dispose tensors
      if (Array.isArray(warmupResult)) {
        warmupResult.forEach(tensor => tensor.dispose());
      } else {
        warmupResult.dispose();
      }
      dummyInput.dispose();
      
      console.log('Model warmup complete');
    } catch (error) {
      console.error('Model warmup failed:', error);
    }
  }

  private createFeatures(defaultData: DefaultData[], historyData: HistoryData[]): any[] {
    // Group history data by client_id - use Map for better performance
    const historyByClient = new Map<number, HistoryData[]>();
    
    historyData.forEach(row => {
      if (!historyByClient.has(row.client_id)) {
        historyByClient.set(row.client_id, []);
      }
      historyByClient.get(row.client_id)!.push(row);
    });
    
    return defaultData.map(clientData => {
      const clientHistory = historyByClient.get(clientData.client_id) || [];
      
      // Calculate payment status aggregations
      const paymentStatuses = clientHistory.map(h => h.payment_status);
      const maxDelay = paymentStatuses.length ? Math.max(...paymentStatuses, -1) : -1;
      const avgDelay = paymentStatuses.length > 0 
        ? paymentStatuses.reduce((sum, val) => sum + val, 0) / paymentStatuses.length 
        : 0;
      const totalDelayed = paymentStatuses.filter(s => s >= 1).length;
      const totalOnTime = paymentStatuses.filter(s => s === -1).length;
      
      // Calculate paid ratio - optimize division
      let paidRatio = 0;
      for (const h of clientHistory) {
        if (h.bill_amt !== 0) {
          // Use multiplication instead of division when possible
          const invBillAmt = 1 / h.bill_amt;
          paidRatio += h.paid_amt * invBillAmt;
        }
      }
      paidRatio = paidRatio / (clientHistory.length || 1);
      
      // Calculate payment volatility
      let paymentVolatility = 0;
      if (paymentStatuses.length > 1) {
        const mean = avgDelay;
        let sumSquaredDiff = 0;
        // Manual unrolled loop for performance
        for (let i = 0; i < paymentStatuses.length; i++) {
          const diff = paymentStatuses[i] - mean;
          sumSquaredDiff += diff * diff;
        }
        paymentVolatility = Math.sqrt(sumSquaredDiff / paymentStatuses.length);
      }
      
      // Create binned credit - precompute bin thresholds
      const creditBins = defaultData.length >= 4 
        ? this.assignCreditBin(clientData.credit_given, defaultData.map(d => d.credit_given))
        : 0;
      
      // Determine high credit risk - use bitwise operations for boolean values
      const highCreditRisk = (clientData.credit_given > 200000 && avgDelay > 2) ? 1 : 0;
      
      // Create features following the Python model's structure
      return {
        client_id: clientData.client_id,
        default: clientData.default,
        credit_given: clientData.credit_given,
        gender: clientData.gender,
        education: clientData.education,
        marital_status: clientData.marital_status,
        max_delay: maxDelay,
        avg_delay: avgDelay,
        total_delayed: totalDelayed,
        total_on_time: totalOnTime,
        avg_paid_ratio: paidRatio,
        payment_volatility: paymentVolatility,
        credit_bins: creditBins,
        high_credit_risk: highCreditRisk
      };
    });
  }

  private assignCreditBin(creditValue: number, allCredits: number[]): number {
    // Sort credits and divide into 4 bins (quantiles)
    const sortedCredits = [...allCredits].sort((a, b) => a - b);
    const binSize = Math.ceil(sortedCredits.length / 4);
    
    // Find which bin the value belongs to
    for (let i = 0; i < 4; i++) {
      const upperBound = sortedCredits[Math.min((i + 1) * binSize - 1, sortedCredits.length - 1)];
      if (creditValue <= upperBound) {
        return i;
      }
    }
    return 3; // Highest bin
  }

  private encodeCategories(data: any[]): any[] {
    // Create one-hot encodings for categorical features
    // Use regular for loop for better performance
    const encoded = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      encoded[i] = {
        ...row,
        // Gender encoding (1, 2)
        gender_2: row.gender === 2 ? 1 : 0,
        
        // Education encoding (1, 2, 3)
        education_2: row.education === 2 ? 1 : 0,
        education_3: row.education === 3 ? 1 : 0,
        
        // Marital status encoding (1, 2)
        marital_status_2: row.marital_status === 2 ? 1 : 0,
        
        // Credit bins encoding (0, 1, 2, 3)
        credit_bins_1: row.credit_bins === 1 ? 1 : 0,
        credit_bins_2: row.credit_bins === 2 ? 1 : 0,
        credit_bins_3: row.credit_bins === 3 ? 1 : 0,
      };
    }
    
    return encoded;
  }

  private normalizeFeatures(data: any[]): any[] {
    // Simple min-max scaling for numerical features
    const numericFeatures = [
      'credit_given', 'max_delay', 'avg_delay', 'total_delayed', 
      'total_on_time', 'avg_paid_ratio', 'payment_volatility'
    ];
    
    // Find min and max for each feature in a single pass
    const mins: {[key: string]: number} = {};
    const maxs: {[key: string]: number} = {};
    const ranges: {[key: string]: number} = {};
    
    numericFeatures.forEach(feature => {
      mins[feature] = Number.MAX_VALUE;
      maxs[feature] = Number.MIN_VALUE;
    });
    
    // First pass - find min and max
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const feature of numericFeatures) {
        if (row[feature] < mins[feature]) mins[feature] = row[feature];
        if (row[feature] > maxs[feature]) maxs[feature] = row[feature];
      }
    }
    
    // Calculate ranges once
    for (const feature of numericFeatures) {
      ranges[feature] = maxs[feature] - mins[feature];
    }
    
    // Second pass - normalize
    const normalizedData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const normalizedRow = { ...row };
      
      for (const feature of numericFeatures) {
        const range = ranges[feature];
        normalizedRow[feature] = range === 0 
          ? 0 
          : (row[feature] - mins[feature]) / range;
      }
      
      normalizedData[i] = normalizedRow;
    }
    
    return normalizedData;
  }

  private preprocessData(defaultData: any[], historyData: any[]): { 
    features: any[][], 
    clientIds: number[], 
    defaults: number[] 
  } {
    return tf.tidy(() => {
      // Create aggregated features
      const featuresWithId = this.createFeatures(defaultData, historyData);
      
      // Store client IDs and default values separately
      const clientIds = featuresWithId.map(row => row.client_id);
      const defaults = featuresWithId.map(row => row.default);
      
      // Encode categorical features
      const encodedFeatures = this.encodeCategories(featuresWithId);
      
      // Normalize numerical features
      const normalizedFeatures = this.normalizeFeatures(encodedFeatures);
      
      // Convert to numerical array for model input
      // Using the features that match our model's expected input
      const modelFeatures = normalizedFeatures.map(row => [
        row.credit_given,
        row.max_delay,
        row.avg_delay, 
        row.total_delayed,
        row.total_on_time,
        row.avg_paid_ratio,
        row.payment_volatility,
        row.high_credit_risk,
        row.gender_2,
        row.education_2,
        row.education_3,
        row.marital_status_2,
        row.credit_bins_1,
        row.credit_bins_2,
      ]);
      
      return { features: modelFeatures, clientIds, defaults };
    });
  }

  async trainModel(defaultData: any[], historyData: any[]): Promise<void> {
    try {
      if (!this.model) {
        await this.initializeModel();
      }
      
      // Use a correct tidy approach that doesn't return the fit promise
      const { features, defaults } = this.preprocessData(defaultData, historyData);
      
      // Convert to tensors
      const xTrain = tf.tensor2d(features);
      const yTrain = tf.tensor2d(defaults.map(d => [d]));
      
      // Train the model outside tidy since it's an async operation
      await this.model!.fit(xTrain, yTrain, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}, accuracy = ${logs?.acc.toFixed(4)}`);
            }
          }
        }
      });
      
      // Clean up tensors after training
      xTrain.dispose();
      yTrain.dispose();
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  async generatePredictions(defaultData: any[], historyData: any[]): Promise<any[]> {
    try {
      if (!this.model) {
        await this.initializeModel();
      }
      
      return tf.tidy(() => {
        const { features, clientIds } = this.preprocessData(defaultData, historyData);
        
        // Convert to tensor
        const xTest = tf.tensor2d(features);
        
        // Generate predictions
        const predictions = this.model!.predict(xTest) as tf.Tensor;
        
        // Get probabilities as array
        const probabilities = predictions.arraySync() as number[][];
        
        // Format results
        return clientIds.map((clientId, i) => ({
          client_id: clientId,
          probability_default: probabilities[i][0],
          default_indicator: probabilities[i][0] >= 0.5 ? 1 : 0
        }));
      });
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }
}
