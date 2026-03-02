import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { VerificationResult } from '@/types';

interface ResultViewProps {
  result: VerificationResult;
  onReset: () => void;
}

export function ResultView({ result, onReset }: ResultViewProps) {
  const { status, serialNumber, billData, message, errorCode } = result;

  // Configuración según el estado
  const config: Record<'valid' | 'invalid' | 'error', {
    icon: typeof CheckCircle;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    buttonVariant: 'default' | 'outline';
    buttonClass: string;
  }> = {
    valid: {
      icon: CheckCircle,
      title: 'BILLETE VÁLIDO',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      gradient: 'from-green-900/50 via-slate-900 to-slate-900',
      buttonVariant: 'default',
      buttonClass: 'bg-green-600 hover:bg-green-700'
    },
    invalid: {
      icon: XCircle,
      title: '¡BILLETE NO VÁLIDO!',
      color: 'text-red-500',
      bgColor: 'bg-red-500/30',
      borderColor: 'border-red-500',
      gradient: 'from-red-950 via-slate-950 to-red-950',
      buttonVariant: 'default',
      buttonClass: 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50 animate-pulse'
    },
    error: {
      icon: AlertTriangle,
      title: 'Error de Verificación',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      gradient: 'from-yellow-900/50 via-slate-900 to-slate-900',
      buttonVariant: 'outline',
      buttonClass: 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20'
    }
  };

  const currentConfig = config[status] ?? config.error;
  const Icon = currentConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-gradient-to-br ${currentConfig.gradient} z-50 flex flex-col items-center justify-center p-6`}
    >
      {/* Animación de éxito/error */}
      <div className="relative mb-8">
        {/* Círculos de celebración para válido */}
        {status === 'valid' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 2, 3],
                  opacity: [1, 0.5, 0],
                  rotate: i * 60
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2"
              >
                <div className="w-full h-full bg-green-400 rounded-full" />
              </motion.div>
            ))}
          </>
        )}

        {/* Icono principal */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
          className={`w-32 h-32 rounded-full ${currentConfig.bgColor} flex items-center justify-center border-4 ${currentConfig.borderColor}`}
        >
          <Icon className={`w-16 h-16 ${currentConfig.color}`} />
        </motion.div>
      </div>

      {/* Título */}
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [1, 1.1, 1], opacity: 1 }}
        transition={{
          duration: 0.5,
          times: [0, 0.5, 1],
          repeat: status === 'invalid' ? Infinity : 0,
          repeatDelay: 2
        }}
        className={`text-5xl font-black ${currentConfig.color} mb-4 text-center tracking-tighter`}
      >
        {currentConfig.title}
      </motion.h1>

      {/* Mensaje */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${status === 'invalid' ? 'text-red-200 text-xl font-bold' : 'text-gray-300'} text-center max-w-md mb-8 px-4`}
      >
        {message}
      </motion.p>

      {/* Detalles del billete (solo si es válido o inválido con datos) */}
      {(status === 'valid' || (status === 'invalid' && billData)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-md mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Detalles del Billete</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Número de Serie:</span>
                  <span className="text-white font-mono">{serialNumber}</span>
                </div>

                {billData && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Denominación:</span>
                      <span className="text-white">${billData.denomination} {billData.currency}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha de Emisión:</span>
                      <span className="text-white">
                        {billData.issueDate === 'N/A' ? 'S/N' : new Date(billData.issueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Estado:</span>
                      <span className={`font-medium ${billData.status === 'valid' ? 'text-green-400' :
                        billData.status === 'counterfeit' ? 'text-red-400' :
                          'text-orange-400'
                        }`}>
                        {billData.status === 'valid' ? 'Válido' :
                          billData.status === 'counterfeit' ? 'Falsificado' :
                            'Robado'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Código de error (solo en errores) */}
      {status === 'error' && errorCode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <span className="text-gray-500 text-sm">
            Código: {errorCode}
          </span>
        </motion.div>
      )}

      {/* Botón de reinicio */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={onReset}
          size="lg"
          variant={currentConfig.buttonVariant}
          className={`gap-2 ${currentConfig.buttonClass}`}
        >
          <RefreshCw className="w-5 h-5" />
          Verificar otro billete
        </Button>
      </motion.div>

      {/* Advertencia de seguridad para billetes robados */}
      {status === 'invalid' && billData?.status === 'stolen' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 max-w-md text-center"
        >
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4">
            <p className="text-orange-300 text-sm">
              <strong>Advertencia:</strong> Este billete ha sido reportado como robado.
              Se recomienda contactar a las autoridades correspondientes.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
