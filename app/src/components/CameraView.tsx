import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Scan, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  stability: number;
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment'
};

export function CameraView({ onCapture, onCancel, isProcessing, stability }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStable, setIsStable] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Verificar permisos de cámara
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);
  
  // Detectar estabilidad
  useEffect(() => {
    setIsStable(stability > 0.8);
  }, [stability]);
  
  // Captura manual
  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);
  
  // Captura automática cuando está estable
  useEffect(() => {
    if (isStable && !isProcessing && !countdown) {
      setCountdown(3);
    }
    
    if (!isStable && countdown) {
      setCountdown(null);
    }
  }, [isStable, isProcessing, countdown]);
  
  // Cuenta regresiva para captura automática
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    if (countdown === 1) {
      handleCapture();
    }
    
    return () => clearTimeout(timer);
  }, [countdown, handleCapture]);
  
  const handleUserMediaError = useCallback(() => {
    setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
    setHasPermission(false);
  }, []);
  
  if (hasPermission === false || cameraError) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-50"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Error de Cámara
          </h3>
          <p className="text-gray-300 mb-6">
            {cameraError || 'No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en tu navegador.'}
          </p>
          <Button onClick={onCancel} variant="outline" className="w-full">
            Volver
          </Button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
        <button 
          onClick={onCancel}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">Escanea tu billete</span>
        <div className="w-10" />
      </div>
      
      {/* Vista de cámara */}
      <div className="relative flex-1 flex items-center justify-center bg-black">
        {hasPermission && (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            onUserMediaError={handleUserMediaError}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Overlay de guía */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Fondo oscuro con recorte */}
          <svg className="w-full h-full">
            <defs>
              <mask id="billMask">
                <rect width="100%" height="100%" fill="white" />
                <rect 
                  x="10%" 
                  y="25%" 
                  width="80%" 
                  height="50%" 
                  rx="8" 
                  fill="black"
                />
              </mask>
            </defs>
            <rect 
              width="100%" 
              height="100%" 
              fill="rgba(0,0,0,0.6)" 
              mask="url(#billMask)"
            />
          </svg>
          
          {/* Marco guía */}
          <div 
            className={`absolute left-[10%] right-[10%] top-[25%] bottom-[25%] border-2 rounded-lg transition-colors duration-300 ${
              isStable 
                ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]' 
                : 'border-white/60'
            }`}
          >
            {/* Esquinas del marco */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white" />
            
            {/* Indicador de estabilidad */}
            <AnimatePresence>
              {isStable && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  <Scan className="w-4 h-4" />
                  ¡Perfecto!
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Cuenta regresiva */}
            <AnimatePresence>
              {countdown && countdown > 0 && (
                <motion.div
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-24 h-24 bg-white/90 rounded-full flex items-center justify-center">
                    <span className="text-5xl font-bold text-gray-900">{countdown}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Indicadores de estabilidad */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors ${
              stability > 0.3 ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${
              stability > 0.6 ? 'bg-green-400' : 'bg-gray-500'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${
              stability > 0.8 ? 'bg-green-400' : 'bg-gray-500'
            }`} />
          </div>
        </div>
        
        {/* Instrucciones */}
        <div className="absolute bottom-24 left-0 right-0 text-center px-6">
          <p className="text-white/80 text-sm">
            Coloca el billete dentro del marco y mantén la cámara estable
          </p>
        </div>
      </div>
      
      {/* Controles inferiores */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-4">
        <Button
          onClick={handleCapture}
          disabled={isProcessing}
          size="lg"
          className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
        >
          <Camera className="w-8 h-8 text-gray-900" />
        </Button>
      </div>
    </motion.div>
  );
}
