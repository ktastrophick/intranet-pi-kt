'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface FileUploaderProps {
  onOpenModal: () => void;
  // Quitamos hasFiles si no se usa para lógica de renderizado condicional aquí
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onOpenModal }) => {
  return (
    <div className="flex justify-start mb-8">
      <Button
        onClick={onOpenModal}
        className="
          group relative overflow-hidden
          px-8 py-7 text-lg font-bold
          bg-gradient-to-r from-[#009DDC] to-[#007bb0]
          text-white rounded-2xl shadow-lg
          hover:shadow-blue-200 hover:scale-[1.02]
          active:scale-95 transition-all duration-300
          flex items-center gap-4
        "
      >
        <div className="p-2 bg-white/20 rounded-xl group-hover:rotate-90 transition-transform duration-300">
          <Plus className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-start">
          <span>Subir Licencia Médica</span>
          <span className="text-xs font-normal opacity-80 text-blue-50">Registro digital personal</span>
        </div>
        <FileText className="w-6 h-6 ml-2 opacity-50" />
      </Button>
    </div>
  );
};

export default FileUploader;