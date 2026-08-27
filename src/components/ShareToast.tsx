import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface ShareToastProps {
  isOpen: boolean;
  message?: string;
}

export const ShareToast: React.FC<ShareToastProps> = ({ isOpen, message = 'Ссылка скопирована' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-zinc-100 rounded-full shadow-lg border border-zinc-800 text-sm font-medium tracking-tight"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
