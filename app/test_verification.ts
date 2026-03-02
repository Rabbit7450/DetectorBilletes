
import { queryBillBySerialNumber, isValidSerialFormat } from './src/data/billDatabase.ts';

function test() {
    const testCases = [
        // Billetes en formato 9 dígitos + Letra (Ejemplo de la foto)
        { serial: '181733528 A', expectedStatus: 'VALID', description: '9 dígitos + Letra espacio' },
        { serial: '181733528A', expectedStatus: 'VALID', description: '9 dígitos + Letra pegada' },

        // Billetes en la base de datos con el nuevo formato (Deberían ser reportados como NO VÁLIDOS)
        // Usamos el número de serie base 67250005 que está en el rango de Bs 50
        { serial: '67250005 A', expectedStatus: 'INVALID', description: 'En rango + Letra' },
        { serial: '67250001Z', expectedStatus: 'INVALID', description: 'Borde rango + Letra' },

        // USD (Debería seguir funcionando igual)
        { serial: 'AB1234567890', expectedStatus: 'INVALID', description: 'USD (en lista)' },

        // Fuera de formato o fuera de rango
        { serial: '123 A', expectedStatus: 'VALID', description: 'Formato corto' }, // Corto pero no en lista = Válido
        { serial: '50000000', expectedStatus: 'VALID', description: 'Fuera de rango' },
    ];

    console.log('--- Iniciando Pruebas de Formato Refinado (9 dígitos + Letra) ---');

    testCases.forEach(({ serial, expectedStatus, description }) => {
        const isValid = isValidSerialFormat(serial);
        const result = queryBillBySerialNumber(serial);

        const status = result ? 'INVALID' : 'VALID';
        const pass = status === expectedStatus;

        console.log(`Serie: ${serial.padEnd(15)} | ${description.padEnd(20)} | Formato: ${isValid ? 'OK' : 'FAIL'} | Status: ${status.padEnd(8)} | Resultado: ${pass ? 'PASSED' : 'FAILED'}`);
    });
}

test();
