import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Shield, History, Info, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CameraView } from '@/components/CameraView';
import { ProcessingView } from '@/components/ProcessingView';
import { ResultView } from '@/components/ResultView';
import { useOCR } from '@/hooks/useOCR';
import type { VerificationStatus, AuditLog } from '@/types';
import './App.css';

// Simulación de logs de auditoría
const generateAuditLog = (serialNumber: string, result: VerificationStatus): AuditLog => ({
  id: Math.random().toString(36).substr(2, 9),
  ip: '192.168.1.' + Math.floor(Math.random() * 255),
  timestamp: new Date(),
  serialNumber,
  result,
  userAgent: navigator.userAgent
});

function App() {
  const [showCamera, setShowCamera] = useState(false);
  const [stability, setStability] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const stabilityRef = useRef(0);

  const {
    isProcessing,
    progress,
    result,
    processImage,
    reset
  } = useOCR({
    language: 'eng',
    confidenceThreshold: 35,
    preprocessImage: true
  });

  // Simular detección de estabilidad de la cámara
  useEffect(() => {
    if (!showCamera || isProcessing) return;

    const interval = setInterval(() => {
      // Simular variación de estabilidad
      const variation = (Math.random() - 0.5) * 0.3;
      stabilityRef.current = Math.max(0, Math.min(1, stabilityRef.current + variation));

      // Tendencia hacia la estabilidad cuando la cámara está activa
      if (Math.random() > 0.6) {
        stabilityRef.current = Math.min(1, stabilityRef.current + 0.15);
      }

      setStability(stabilityRef.current);
    }, 200);

    return () => clearInterval(interval);
  }, [showCamera, isProcessing]);

  const handleStartScan = () => {
    setShowCamera(true);
    stabilityRef.current = 0;
    setStability(0);
  };

  const handleCapture = useCallback(async (imageData: string) => {
    await processImage(imageData);
    setShowCamera(false);
  }, [processImage]);

  const handleCancel = () => {
    setShowCamera(false);
    stabilityRef.current = 0;
    setStability(0);
  };

  const handleReset = () => {
    if (result?.serialNumber) {
      // Guardar en logs de auditoría
      const log = generateAuditLog(result.serialNumber, result.status);
      setAuditLogs(prev => [log, ...prev].slice(0, 50)); // Mantener últimos 50
    }
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Fondo animado */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-cyan-500/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">BillVerify</h1>
            <p className="text-xs text-gray-400">Sistema de Verificación OCR</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showLogs} onOpenChange={setShowLogs}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <History className="w-5 h-5" />
                {auditLogs.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    {auditLogs.length}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <History className="w-5 h-5" />
                  Logs de Auditoría
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {auditLogs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No hay registros de auditoría</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-800 rounded-lg p-3 text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-300 font-mono">{log.serialNumber}</p>
                          <p className="text-gray-500 text-xs">{log.timestamp.toLocaleString()}</p>
                        </div>
                        <Badge
                          variant={log.result === 'valid' ? 'default' : 'destructive'}
                          className={log.result === 'valid' ? 'bg-green-600' : ''}
                        >
                          {log.result === 'valid' ? 'Válido' :
                            log.result === 'invalid' ? 'Inválido' : 'Error'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Acerca del Sistema</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-gray-300">
                <p>
                  Este sistema utiliza tecnología OCR (Reconocimiento Óptico de Caracteres)
                  para verificar la autenticidad de billetes.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Características
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    <li>Verificación en tiempo real</li>
                    <li>Soporte para Bolivianos (BOB/Bs.)</li>
                    <li>Base de datos inmutable (solo lectura)</li>
                    <li>Procesamiento de imagen con IA</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Billetes de Prueba
                  </h4>
                  <ul className="text-sm space-y-1 ml-2">
                    <li><span className="font-mono text-red-400">AB1234567890</span> - Reportado (No Válido)</li>
                    <li><span className="font-mono text-red-400">67250005</span> - Sospechoso (No Válido)</li>
                    <li><span className="font-mono text-green-400">181733528 A</span> - No Reportado (Válido)</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6">
        <AnimatePresence mode="wait">
          {!showCamera && !isProcessing && !result && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-lg"
            >
              {/* Hero Illustration */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 2, 0, -2, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="relative">
                    {/* Billete animado */}
                    <div className="flex flex-col gap-2">
                      <div className="w-48 h-20 bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-lg shadow-2xl flex items-center justify-center border-2 border-green-400">
                        <span className="text-3xl font-bold text-white">Bs. 50</span>
                      </div>
                      <div className="w-44 h-18 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-lg shadow-2xl flex items-center justify-center border-2 border-blue-400 -mt-10 ml-4 rotate-2">
                        <span className="text-2xl font-bold text-white">Bs. 20</span>
                      </div>
                      <div className="w-40 h-16 bg-gradient-to-r from-red-600 via-red-500 to-red-600 rounded-lg shadow-2xl flex items-center justify-center border-2 border-red-400 -mt-10 ml-8 -rotate-2">
                        <span className="text-xl font-bold text-white">Bs. 10</span>
                      </div>
                    </div>
                    {/* Brillo */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                  </div>
                </motion.div>

                {/* Elementos decorativos */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 right-0 w-16 h-16 border-2 border-dashed border-blue-400/30 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute bottom-0 left-0 w-12 h-12 border-2 border-dotted border-cyan-400/30 rounded-full"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
              >
                Verifica tu Billete
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 mb-8 text-lg"
              >
                Escanea el número de serie de tu billete para verificar su autenticidad
                en nuestra base de datos segura.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleStartScan}
                  size="lg"
                  className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
                >
                  <Camera className="w-6 h-6" />
                  Verificar Billete
                </Button>
              </motion.div>

              {/* Características */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-3 gap-4 mt-12"
              >
                {[
                  { icon: Shield, label: 'Seguro' },
                  { icon: Database, label: 'Inmutable' },
                  { icon: CheckCircle, label: 'Confiable' }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-500">{item.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vista de cámara */}
        <AnimatePresence>
          {showCamera && (
            <CameraView
              onCapture={handleCapture}
              onCancel={handleCancel}
              isProcessing={isProcessing}
              stability={stability}
            />
          )}
        </AnimatePresence>

        {/* Vista de procesamiento */}
        <AnimatePresence>
          {isProcessing && (
            <ProcessingView progress={progress} />
          )}
        </AnimatePresence>

        {/* Vista de resultado */}
        <AnimatePresence>
          {result && (
            <ResultView
              result={result}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-gray-500 text-sm">
        <p>Sistema de Verificación de Billetes v1.0 • Base de Datos Inmutable</p>
      </footer>
    </div>
  );
}

export default App;
