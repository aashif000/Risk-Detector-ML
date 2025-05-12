
import Papa from 'papaparse';

export interface DefaultData {
  client_id: number;
  credit_given: number;
  gender: number;
  education: number;
  marital_status: number;
  month: number;
  default: number;
}

export interface HistoryData {
  client_id: number;
  payment_status: number;
  bill_amt: number;
  paid_amt: number;
  month: number;
}

// Create a worker instance
let csvWorker: Worker | null = null;

// Function to initialize worker
const getWorker = () => {
  if (!csvWorker && typeof Worker !== 'undefined') {
    csvWorker = new Worker(new URL('../workers/csvWorker.ts', import.meta.url), { type: 'module' });
  }
  return csvWorker;
};

export const parseCSV = async (file: File): Promise<any[]> => {
  // Try to use worker first
  const worker = getWorker();
  
  if (worker) {
    return new Promise((resolve, reject) => {
      const messageHandler = (e: MessageEvent) => {
        if (e.data.status === 'success') {
          worker.removeEventListener('message', messageHandler);
          resolve(e.data.data);
        } else if (e.data.status === 'error') {
          worker.removeEventListener('message', messageHandler);
          reject(new Error(e.data.error));
        }
      };
      
      worker.addEventListener('message', messageHandler);
      worker.postMessage({ file, fileType: 'generic' });
    });
  }
  
  // Fallback to synchronous parsing if worker is not available
  return new Promise((resolve, reject) => {
    // Try different delimiters if the default one fails
    const delimiters = [',', ';', '\t', '|'];
    let currentDelimiterIndex = 0;
    let lastError: any = null;
    
    const tryParse = () => {
      const currentDelimiter = delimiters[currentDelimiterIndex];
      console.log(`Trying delimiter: ${currentDelimiter}`);
      
      Papa.parse(file, {
        header: true,
        delimiter: currentDelimiter,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: header => header.trim(),
        transform: value => typeof value === 'string' ? value.trim() : value,
        complete: (results) => {
          console.log(`Parse results with delimiter ${currentDelimiter}:`, results);
          
          // Check if we got a valid parse (more than one field)
          if (results.errors && results.errors.length > 0 && 
              (results.data.length === 0 || Object.keys(results.data[0]).length <= 1)) {
            console.warn(`Parsing with delimiter ${currentDelimiter} failed:`, results.errors);
            // Try next delimiter
            currentDelimiterIndex++;
            if (currentDelimiterIndex < delimiters.length) {
              tryParse();
            } else {
              // All delimiters failed
              reject(new Error(`CSV parsing failed with all delimiters. Last error: ${lastError || 'Could not determine CSV format'}`));
            }
          } else if (!results.data || results.data.length === 0) {
            reject(new Error('CSV file appears to be empty or invalid'));
          } else {
            // Successful parse
            console.log(`Successfully parsed with delimiter: ${currentDelimiter}`);
            resolve(results.data as any[]);
          }
        },
        error: (error) => {
          console.error(`CSV parse error with delimiter ${currentDelimiter}:`, error);
          lastError = error.message;
          currentDelimiterIndex++;
          if (currentDelimiterIndex < delimiters.length) {
            tryParse();
          } else {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        }
      });
    };
    
    // Start parsing with the first delimiter
    tryParse();
  });
};

export const validateDefaultCSV = (data: any[]): DefaultData[] => {
  if (!data || data.length === 0) {
    throw new Error('No data found in payment_default.csv');
  }

  console.log("Default CSV data sample:", data[0]);
  
  const requiredColumns = ['client_id', 'credit_given', 'gender', 'education', 'marital_status', 'month', 'default'];
  
  // Check if all required columns exist
  const headers = Object.keys(data[0] || {});
  console.log("Found headers:", headers);
  
  const missingColumns = requiredColumns.filter(column => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Invalid payment_default.csv format. Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  return data as DefaultData[];
};

export const validateHistoryCSV = (data: any[]): HistoryData[] => {
  if (!data || data.length === 0) {
    throw new Error('No data found in payment_history.csv');
  }

  console.log("History CSV data sample:", data[0]);
  
  const requiredColumns = ['client_id', 'payment_status', 'bill_amt', 'paid_amt', 'month'];
  
  // Check if all required columns exist
  const headers = Object.keys(data[0] || {});
  console.log("Found headers:", headers);
  
  const missingColumns = requiredColumns.filter(column => !headers.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Invalid payment_history.csv format. Missing required columns: ${missingColumns.join(', ')}`);
  }
  
  return data as HistoryData[];
};
