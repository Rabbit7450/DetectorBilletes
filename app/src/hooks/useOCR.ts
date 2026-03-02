import { useState, useCallback, useRef } from 'react';
import Tesseract from 'tesseract.js';
import type { OCROptions, VerificationResult } from '@/types';
import {
  queryBillBySerialNumber,
  getCachedVerification,
  setCachedVerification
} from '@/data/billDatabase';

interface UseOCRReturn {
  isProcessing: boolean;
  progress: number;
  result: VerificationResult | null;
  error: string | null;
  processImage: (imageData: string) => Promise<void>;
  reset: () => void;
}

// Preprocesamiento de imagen para mejorar OCR
async function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear contexto de canvas'));
        return;
      }

      // Redimensionar para optimizar (max 1280x720)
      const maxWidth = 1280;
      const maxHeight = 720;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen
      ctx.drawImage(img, 0, 0, width, height);

      // Aplicar mejoras: escala de grises y contraste
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Convertir a escala de grises
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Aumentar contraste
        const contrast = 1.5;
        const adjusted = ((gray - 128) * contrast) + 128;

        // Aplicar umbral (threshold)
        const threshold = adjusted > 150 ? 255 : 0;

        data[i] = threshold;     // R
        data[i + 1] = threshold; // G
        data[i + 2] = threshold; // B
        // data[i + 3] es el canal alpha, no lo modificamos
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => reject(new Error('Error al cargar imagen'));
    img.src = imageData;
  });
}

// Extraer número de serie del texto OCR
function extractSerialNumber(text: string): string | null {
  // Patrones comunes de números de serie en billetes
  const patterns = [
    /\d{8,9}\s*[A-Z]/i,      // Formato BOB: 8-9 dígitos + Letra
    /[A-Z]{2}\s*\d{8,10}/i,  // 2 letras + 8-10 dígitos (USD)
    /[A-Z]\s*\d{9,11}/i,      // 1 letra + 9-11 dígitos
    /\d{2}[A-Z]{2}\d{6,8}/i,  // 2 dígitos + 2 letras + 6-8 dígitos
    /SERIAL\s*:?\s*([A-Z0-9\s]{10,14})/i,  // Etiqueta "SERIAL"
    /NO\s*:?\s*([A-Z0-9\s]{10,14})/i,      // Etiqueta "NO"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Limpiar el resultado
      const serial = match[0]
        .toUpperCase()
        .replace(/\s/g, '')
        .replace(/[^A-Z0-9]/g, '');

      if (serial.length >= 8 && serial.length <= 14) {
        return serial;
      }
    }
  }

  // Si no encontramos con patrones, buscar secuencias largas de alfanuméricos
  const alphanumericMatches = text.match(/[A-Z0-9]{10,14}/gi);
  if (alphanumericMatches && alphanumericMatches.length > 0) {
    // Filtrar los que tengan al menos 2 letras (más probable que sean números de serie)
    const withLetters = alphanumericMatches.filter(m => /[A-Z]{2,}/i.test(m));
    if (withLetters.length > 0) {
      return withLetters[0].toUpperCase().replace(/\s/g, '');
    }
    return alphanumericMatches[0].toUpperCase().replace(/\s/g, '');
  }

  return null;
}

export function useOCR(options: OCROptions = {}): UseOCRReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const processImage = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Crear abort controller para poder cancelar
    abortControllerRef.current = new AbortController();

    try {
      // Paso 1: Preprocesar imagen
      setProgress(10);
      let processedImage = imageData;

      if (options.preprocessImage !== false) {
        try {
          processedImage = await preprocessImage(imageData);
          setProgress(25);
        } catch (err) {
          console.warn('Error en preprocesamiento, usando imagen original:', err);
        }
      }

      // Paso 2: OCR con Tesseract
      setProgress(30);

      const { data: { text, confidence } } = await Tesseract.recognize(
        processedImage,
        options.language || 'eng',
        {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setProgress(30 + Math.round(m.progress * 50));
            }
          }
        }
      );

      console.log('OCR Texto detectado:', text);
      console.log('OCR Confianza:', confidence);

      // Verificar confianza mínima
      const minConfidence = options.confidenceThreshold || 40;
      if (confidence < minConfidence) {
        setResult({
          status: 'error',
          message: 'No se pudo leer claramente el billete. Intenta con mejor iluminación o acércate más.',
          errorCode: 'LOW_CONFIDENCE',
          timestamp: new Date()
        });
        setProgress(100);
        setIsProcessing(false);
        return;
      }

      // Paso 3: Extraer número de serie
      setProgress(85);
      const serialNumber = extractSerialNumber(text);

      if (!serialNumber) {
        setResult({
          status: 'error',
          message: 'No se detectó un número de serie válido. Asegúrate de que el número de serie sea visible.',
          errorCode: 'NO_SERIAL_DETECTED',
          timestamp: new Date()
        });
        setProgress(100);
        setIsProcessing(false);
        return;
      }

      console.log('Número de serie extraído:', serialNumber);

      // Paso 4: Verificar en caché primero (simulando Redis)
      const cachedResult = getCachedVerification(serialNumber);

      if (cachedResult !== undefined) {
        if (cachedResult) {
          // Si está en caché y tiene datos, significa que ES sospechoso/inválido
          setResult({
            status: 'invalid', // Siempre inválido si se encontró
            serialNumber,
            billData: cachedResult,
            message: 'ALERTA: Billete identificado en base de datos de billetes no válidos',
            timestamp: new Date()
          });
        } else {
          // Si está en el caché como null, significa que NO se encontró
          setResult({
            status: 'valid',
            serialNumber,
            message: 'Billete Válido: No se encontraron registros de irregularidad.',
            timestamp: new Date()
          });
        }
        setProgress(100);
        setIsProcessing(false);
        return;
      }

      // Paso 5: Verificar en base de datos (simulando PostgreSQL)
      setProgress(95);
      const billData = queryBillBySerialNumber(serialNumber);

      // Guardar en caché
      setCachedVerification(serialNumber, billData);

      if (billData) {
        // Si se encontró en la base de datos, es INVÁLIDO (según nuevo requisito)
        setResult({
          status: 'invalid',
          serialNumber,
          billData,
          message: 'BILLETE NO VÁLIDO: Se encuentra en la lista de billetes sospechosos o reportados.',
          timestamp: new Date()
        });
      } else {
        // Si NO se encontró, se considera VÁLIDO
        setResult({
          status: 'valid',
          serialNumber,
          message: 'BILLETE VÁLIDO: El número de serie no presenta reportes de irregularidad.',
          timestamp: new Date()
        });
      }

      setProgress(100);

    } catch (err) {
      console.error('Error en OCR:', err);
      setError('Error al procesar la imagen. Por favor, intenta de nuevo.');
      setResult({
        status: 'error',
        message: 'Error interno del sistema de reconocimiento.',
        errorCode: 'OCR_ERROR',
        timestamp: new Date()
      });
    } finally {
      setIsProcessing(false);
    }
  }, [options.language, options.confidenceThreshold, options.preprocessImage]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isProcessing,
    progress,
    result,
    error,
    processImage,
    reset
  };
}
