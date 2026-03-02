// Base de datos de billetes sospechosos, falsificados o invalidados (Blacklist)
// En producción, esto sería PostgreSQL con permisos SELECT únicamente

import type { BillData } from '@/types';

// Generar billetes de ejemplo con diferentes estados
export const billDatabase: BillData[] = [
  // Billetes válidos
  {
    id: 'B001',
    serialNumber: 'AB1234567890',
    denomination: 100,
    currency: 'USD',
    issueDate: '2023-01-15',
    status: 'valid'
  },
  {
    id: 'B002',
    serialNumber: 'CD9876543210',
    denomination: 50,
    currency: 'USD',
    issueDate: '2023-03-20',
    status: 'valid'
  },
  {
    id: 'B003',
    serialNumber: 'EF5556667778',
    denomination: 20,
    currency: 'USD',
    issueDate: '2023-06-10',
    status: 'valid'
  },
  {
    id: 'B004',
    serialNumber: 'GH1112223334',
    denomination: 100,
    currency: 'USD',
    issueDate: '2023-08-05',
    status: 'valid'
  },
  {
    id: 'B005',
    serialNumber: 'IJ9998887776',
    denomination: 200,
    currency: 'USD',
    issueDate: '2023-11-12',
    status: 'valid'
  },
  // Billetes falsificados
  {
    id: 'B006',
    serialNumber: 'XX1234567890',
    denomination: 100,
    currency: 'USD',
    issueDate: '2023-01-15',
    status: 'counterfeit'
  },
  {
    id: 'B007',
    serialNumber: 'YY9876543210',
    denomination: 50,
    currency: 'USD',
    issueDate: '2023-03-20',
    status: 'counterfeit'
  },
  // Billetes robados
  {
    id: 'B008',
    serialNumber: 'ZZ5556667778',
    denomination: 100,
    currency: 'USD',
    issueDate: '2023-06-10',
    status: 'stolen'
  },
  {
    id: 'B009',
    serialNumber: 'WW1112223334',
    denomination: 20,
    currency: 'USD',
    issueDate: '2023-08-05',
    status: 'stolen'
  },
  // Más billetes válidos para pruebas
  {
    id: 'B010',
    serialNumber: 'KL4445556667',
    denomination: 500,
    currency: 'USD',
    issueDate: '2024-01-10',
    status: 'valid'
  },
  {
    id: 'B011',
    serialNumber: 'MN7778889990',
    denomination: 1000,
    currency: 'USD',
    issueDate: '2024-02-15',
    status: 'valid'
  },
  {
    id: 'B012',
    serialNumber: 'OP1231231234',
    denomination: 100,
    currency: 'USD',
    issueDate: '2024-03-01',
    status: 'valid'
  }
];

// Interface para rangos de billetes (usado para Bolivianos)
export interface BillRange {
  from: number;
  to: number;
  denomination: number;
}

// Datos de comparación de billetes de Bolivianos
export const bolivianBillRanges: BillRange[] = [
  // Billetes de Bs 50
  { from: 67250001, to: 67700000, denomination: 50 },
  { from: 69050001, to: 69500000, denomination: 50 },
  { from: 69500001, to: 69950000, denomination: 50 },
  { from: 69950001, to: 70400000, denomination: 50 },
  { from: 70400001, to: 70850000, denomination: 50 },
  { from: 70850001, to: 71300000, denomination: 50 },
  { from: 76310012, to: 85139995, denomination: 50 },
  { from: 86400001, to: 86850000, denomination: 50 },
  { from: 90900001, to: 91350000, denomination: 50 },
  { from: 91800001, to: 92250000, denomination: 50 },
  // Billetes de Bs 20
  { from: 87280145, to: 91646549, denomination: 20 },
  { from: 96650001, to: 97100000, denomination: 20 },
  { from: 99800001, to: 100250000, denomination: 20 },
  { from: 100250001, to: 100700000, denomination: 20 },
  { from: 109250001, to: 109700000, denomination: 20 },
  { from: 110600001, to: 111050000, denomination: 20 },
  { from: 111050001, to: 111500000, denomination: 20 },
  { from: 111950001, to: 112400000, denomination: 20 },
  { from: 112400001, to: 112850000, denomination: 20 },
  { from: 112850001, to: 113300000, denomination: 20 },
  { from: 114200001, to: 114650000, denomination: 20 },
  { from: 114650001, to: 115100000, denomination: 20 },
  { from: 115100001, to: 115550000, denomination: 20 },
  { from: 118700001, to: 119150000, denomination: 20 },
  { from: 119150001, to: 119600000, denomination: 20 },
  { from: 120500001, to: 120950000, denomination: 20 },
  // Billetes de Bs 10
  { from: 77100001, to: 77550000, denomination: 10 },
  { from: 78000001, to: 78450000, denomination: 10 },
  { from: 78900001, to: 96350000, denomination: 10 },
  { from: 96350001, to: 96800000, denomination: 10 },
  { from: 96800001, to: 97250000, denomination: 10 },
  { from: 98150001, to: 98600000, denomination: 10 },
  { from: 104900001, to: 105350000, denomination: 10 },
  { from: 105350001, to: 105800000, denomination: 10 },
  { from: 106700001, to: 107150000, denomination: 10 },
  { from: 107600001, to: 108050000, denomination: 10 },
  { from: 108050001, to: 108500000, denomination: 10 },
  { from: 109400001, to: 109850000, denomination: 10 },
];

// Función de consulta mejorada
export function queryBillBySerialNumber(serialNumber: string): BillData | null {
  // Normalizar el número de serie (eliminar espacios, mayúsculas)
  const normalizedSerial = serialNumber.toUpperCase().replace(/\s/g, '');

  // 1. Buscar en la base de datos fija (ej. USD)
  const fixedBill = billDatabase.find(b =>
    b.serialNumber.toUpperCase() === normalizedSerial
  );

  if (fixedBill) return fixedBill;

  // 2. Intentar buscar en los rangos de Bolivianos
  // Extraer solo la parte numérica para el chequeo de rangos (ej. de "181733528A" a 181733528)
  const numericPart = normalizedSerial.match(/\d+/);
  if (numericPart) {
    const serialNum = parseInt(numericPart[0], 10);
    const rangeMatch = bolivianBillRanges.find(r =>
      serialNum >= r.from && serialNum <= r.to
    );

    if (rangeMatch) {
      return {
        id: `BOB-${normalizedSerial}`,
        serialNumber: normalizedSerial,
        denomination: rangeMatch.denomination,
        currency: 'BOB',
        issueDate: 'N/A',
        status: 'valid'
      };
    }
  }

  return null;
}

// Función para verificar si un número de serie tiene formato válido
export function isValidSerialFormat(serialNumber: string): boolean {
  const cleanSerial = serialNumber.toUpperCase().replace(/\s/g, '');

  // Formato USD: 2 letras seguidas de 8-10 dígitos
  const usdPattern = /^[A-Z]{2}\d{8,10}$/;

  // Formato BOB: 8-9 dígitos seguidos opcionalmente por una letra (ej. 181733528A)
  const bobPattern = /^\d{8,9}[A-Z]?$/;

  return usdPattern.test(cleanSerial) || bobPattern.test(cleanSerial);
}

// Cache en memoria para simular Redis
const verificationCache = new Map<string, { result: BillData | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function getCachedVerification(serialNumber: string): BillData | null | undefined {
  const normalizedSerial = serialNumber.toUpperCase().replace(/\s/g, '');
  const cached = verificationCache.get(normalizedSerial);

  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    // Cache expirado
    verificationCache.delete(normalizedSerial);
  }

  return undefined;
}

export function setCachedVerification(serialNumber: string, result: BillData | null): void {
  const normalizedSerial = serialNumber.toUpperCase().replace(/\s/g, '');
  verificationCache.set(normalizedSerial, {
    result,
    timestamp: Date.now()
  });
}
