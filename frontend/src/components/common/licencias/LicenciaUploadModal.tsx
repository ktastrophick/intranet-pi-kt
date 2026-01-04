'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Calendar
} from 'lucide-react';
// Importante: Asegúrate que estas constantes existan en tu archivo de types
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/types/licencia';

// Formato de visualización de tamaño (puedes mover esto a un utils)
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ======================================================
// INTERFACES (Actualizada: sin empleadoId)
// ======================================================

export interface LicenciaFormData {
  fechaInicio: string;
  fechaTermino: string;
  archivo: File | null;
}

interface LicenciaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LicenciaFormData) => void;
  // Ya no necesitamos la prop 'empleados'
}

export const LicenciaUploadModal: React.FC<LicenciaUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<LicenciaFormData>({
    fechaInicio: '',
    fechaTermino: '',
    archivo: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ======================================================
  // VALIDACIONES
  // ======================================================

  const validateFile = (file: File): string | null => {
    // Acepta PDF e Imágenes (JPG, PNG) según lo definido en el Backend
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return 'Formato no válido. Use PDF, JPG o PNG.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Archivo muy pesado. Máximo ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fechaInicio) newErrors.fechaInicio = 'Requerido';
    if (!formData.fechaTermino) newErrors.fechaTermino = 'Requerido';
    
    if (formData.fechaInicio && formData.fechaTermino) {
      if (new Date(formData.fechaTermino) < new Date(formData.fechaInicio)) {
        newErrors.fechaTermino = 'No puede ser anterior al inicio';
      }
    }
    if (!formData.archivo) newErrors.archivo = 'Debe subir el documento';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ======================================================
  // MANEJADORES
  // ======================================================

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }
    setFormData({ ...formData, archivo: file });
    setFileError(null);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({ fechaInicio: '', fechaTermino: '', archivo: null });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="text-blue-600" />
            Subir Mi Licencia Médica
          </DialogTitle>
          <DialogDescription>
            Cargue el documento oficial de su licencia. La información será revisada por Subdirección.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Input 
                type="date" 
                value={formData.fechaInicio}
                onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                className={errors.fechaInicio ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Término</Label>
              <Input 
                type="date" 
                value={formData.fechaTermino}
                onChange={(e) => setFormData({...formData, fechaTermino: e.target.value})}
                className={errors.fechaTermino ? 'border-red-500' : ''}
              />
            </div>
          </div>

          <div 
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${formData.archivo ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'}
              ${errors.archivo ? 'border-red-500 bg-red-50' : ''}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            
            {formData.archivo ? (
              <div className="flex flex-col items-center gap-2 text-green-700">
                <CheckCircle2 className="w-8 h-8" />
                <span className="text-sm font-medium">{formData.archivo.name}</span>
                <Button variant="ghost" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  setFormData({...formData, archivo: null});
                }}>Cambiar archivo</Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <UploadCloud className="w-10 h-10" />
                <p className="text-sm">Haga clic o arrastre su licencia aquí</p>
                <p className="text-xs text-gray-400 italic">PDF o Imágenes (Máx 5MB)</p>
              </div>
            )}
          </div>
          {errors.archivo && <p className="text-xs text-red-500">{errors.archivo}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleSubmit}
          >
            Enviar a Revisión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};