// Ubicación: src/components/common/usuarios/FormularioUsuarioCompleto.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ✅ IMPORTACIONES DESDE TUS SERVICIOS Y TIPOS REALES
import { rolService, areaService, tipoContratoService } from '@/api';
import { formatearRUT } from '@/types/usuario';
import type { Rol, Area, TipoContrato, CrearUsuarioDTO } from '@/types/usuario';

import { 
  UserPlus, Loader2, Building2, 
   Users,  FileText 
} from 'lucide-react';

interface FormularioUsuarioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (usuario: any) => Promise<void>;
  usuarioEditar?: any;
  modo?: 'crear' | 'editar';
}

export const FormularioUsuarioCompleto: React.FC<FormularioUsuarioProps> = ({
  open,
  onOpenChange,
  onSubmit,
  usuarioEditar,
  modo = 'crear',
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Estados para los datos maestros
  const [roles, setRoles] = useState<Rol[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
  
  const [formData, setFormData] = useState<CrearUsuarioDTO>({
    rut: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    password: '',
    password_confirm: '',
    cargo: '',
    area: '',
    rol: '',
    tipo_contrato: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    es_jefe_de_area: false,
    telefono: '',
    direccion: ''
  });

  // ✅ CARGA DE DATOS USANDO TUS MÉTODOS REALES
  useEffect(() => {
    if (open) {
      const cargarDatosMaestros = async () => {
        setLoadingData(true);
        try {
          const [dataRoles, dataAreas, dataContratos] = await Promise.all([
            rolService.getAll(),
            areaService.getActivas(), // Tu método getActivas()
            tipoContratoService.getAll()
          ]);
          
          setRoles(dataRoles);
          setAreas(dataAreas);
          setTiposContrato(dataContratos);

          if (usuarioEditar) {
            setFormData({
              ...usuarioEditar,
              password: '',
              password_confirm: '',
              area: usuarioEditar.area?.id || usuarioEditar.area,
              rol: usuarioEditar.rol?.id || usuarioEditar.rol,
              tipo_contrato: usuarioEditar.tipo_contrato?.id || usuarioEditar.tipo_contrato,
            });
          }
        } catch (error) {
          console.error("Error al cargar datos para el formulario:", error);
        } finally {
          setLoadingData(false);
        }
      };
      cargarDatosMaestros();
    }
  }, [open, usuarioEditar]);

  const handleInputChange = (field: string, value: any) => {
    if (field === 'rut') value = formatearRUT(value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Tu backend pide password_confirm en UsuarioCreateSerializer, se envía tal cual
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error en submit:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="text-blue-600" />
            {modo === 'crear' ? 'Registrar Funcionario' : 'Editar Funcionario'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            
            {/* IDENTIFICACIÓN */}
            <div className="space-y-2">
              <Label>RUT *</Label>
              <Input 
                value={formData.rut} 
                onChange={e => handleInputChange('rut', e.target.value)} 
                placeholder="12.345.678-9"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => handleInputChange('email', e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input value={formData.nombre} onChange={e => handleInputChange('nombre', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Apellido Paterno *</Label>
              <Input value={formData.apellido_paterno} onChange={e => handleInputChange('apellido_paterno', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Apellido Materno *</Label>
              <Input value={formData.apellido_materno} onChange={e => handleInputChange('apellido_materno', e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input value={formData.cargo} onChange={e => handleInputChange('cargo', e.target.value)} required />
            </div>

            {/* SEGURIDAD (Obligatorio en CreateSerializer) */}
            <div className="space-y-2">
              <Label>Contraseña *</Label>
              <Input 
                type="password" 
                value={formData.password} 
                onChange={e => handleInputChange('password', e.target.value)} 
                required={modo === 'crear'} 
              />
            </div>

            <div className="space-y-2">
              <Label>Confirmar Contraseña *</Label>
              <Input 
                type="password" 
                value={formData.password_confirm} 
                onChange={e => handleInputChange('password_confirm', e.target.value)} 
                required={modo === 'crear'} 
              />
            </div>

            {/* SELECCIÓN DE DATOS MAESTROS (UUIDs) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Building2 size={14}/> Área *</Label>
              <Select value={formData.area} onValueChange={v => handleInputChange('area', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users size={14}/> Rol *</Label>
              <Select value={formData.rol} onValueChange={v => handleInputChange('rol', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(rol => (
                    <SelectItem key={rol.id} value={rol.id}>{rol.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText size={14}/> Tipo de Contrato *</Label>
              <Select value={formData.tipo_contrato} onValueChange={v => handleInputChange('tipo_contrato', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Contrato" />
                </SelectTrigger>
                <SelectContent>
                  {tiposContrato.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Ingreso *</Label>
              <Input 
                type="date" 
                value={formData.fecha_ingreso} 
                onChange={e => handleInputChange('fecha_ingreso', e.target.value)} 
                required 
              />
            </div>

            <div className="col-span-2 pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading && <Loader2 className="mr-2 animate-spin" />}
                {modo === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormularioUsuarioCompleto;