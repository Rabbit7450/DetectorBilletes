import { motion } from 'framer-motion';
import { Loader2, Scan, Cpu, Database, Search } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProcessingViewProps {
  progress: number;
}

const steps = [
  { icon: Scan, label: 'Capturando imagen', minProgress: 0 },
  { icon: Cpu, label: 'Procesando OCR', minProgress: 25 },
  { icon: Database, label: 'Verificando base de datos', minProgress: 75 },
  { icon: Search, label: 'Validando resultado', minProgress: 90 },
];

export function ProcessingView({ progress }: ProcessingViewProps) {
  const currentStep = steps.findIndex((step, index) => {
    const nextStep = steps[index + 1];
    return progress >= step.minProgress && (!nextStep || progress < nextStep.minProgress);
  });
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex flex-col items-center justify-center p-6"
    >
      {/* Animación de escaneo */}
      <div className="relative w-48 h-48 mb-8">
        {/* Círculos concéntricos animados */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="absolute inset-0 rounded-full border-4 border-dashed border-blue-400/30"
        />
        <motion.div
          animate={{ 
            rotate: -360 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          className="absolute inset-4 rounded-full border-4 border-dotted border-cyan-400/40"
        />
        
        {/* Icono central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          >
            <Scan className="w-16 h-16 text-blue-400" />
          </motion.div>
        </div>
        
        {/* Línea de escaneo */}
        <motion.div
          animate={{ 
            top: ['0%', '100%', '0%']
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
        />
      </div>
      
      {/* Título */}
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white mb-2"
      >
        Verificando billete
      </motion.h2>
      
      {/* Progreso */}
      <div className="w-full max-w-md mb-6">
        <Progress value={progress} className="h-2 bg-slate-700" />
        <p className="text-center text-gray-400 mt-2 text-sm">
          {progress}%
        </p>
      </div>
      
      {/* Pasos */}
      <div className="flex gap-4 flex-wrap justify-center max-w-md">
        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isActive ? 1 : 0.3,
                scale: isCurrent ? 1.1 : 1
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                isActive 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-slate-700/50 text-gray-500'
              }`}
            >
              {isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center"
      >
        <p className="text-gray-400 text-sm">
          Esto solo tomará unos segundos...
        </p>
      </motion.div>
    </motion.div>
  );
}
