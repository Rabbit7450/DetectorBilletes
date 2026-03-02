// Tipos para la aplicación de verificación de billetes

export type VerificationStatus = 'valid' | 'invalid' | 'error';

export interface BillData {
  id: string;
  serialNumber: string;
  denomination: number;
  currency: string;
  issueDate: string;
  status: 'valid' | 'counterfeit' | 'stolen';
}

export interface VerificationResult {
  status: VerificationStatus;
  serialNumber?: string;
  billData?: BillData;
  message?: string;
  errorCode?: string;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  ip: string;
  timestamp: Date;
  serialNumber: string;
  result: VerificationStatus;
  userAgent: string;
}

export interface CameraFrame {
  imageData: string;
  timestamp: number;
  stability: number;
}

export interface OCROptions {
  language?: string;
  confidenceThreshold?: number;
  preprocessImage?: boolean;
}
