'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UnifiedNavbar } from '@/components/common/layout/UnifiedNavbar';
import Footer from '@/components/common/layout/Footer';
import BannerVacaciones from '@/components/images/banners_finales/BannerVacaciones';
import { 
  CalendarDays, Briefcase, 
  FileText, AlertCircle, Send,
  Clock, HelpCircle, MinusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/api/contexts/AuthContext';
import { solicitudService, usuarioService } from '@/api';
import type { TipoSolicitud } from '@/api/services/solicitudService';

interface SolicitudFormData {
  tipoSolicitud: TipoSolicitud;
  nombreOtroPermiso: string;
  fechaInicio: string;
  fechaTermino: string;
  cantidadDias: number; 
  esMedioDia: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const SolicitarDiasPage: React.FC = () => {
  const { user } = useAuth();
  
  const [bolsas, setBolsas] = useState({ 
    vacaciones: 0, 
    administrativos: 0, 
    sinGoce: 0, 
    devolucionHoras: 0 
  });

  const [formData, setFormData] = useState<SolicitudFormData>({
    tipoSolicitud: 'vacaciones',
    nombreOtroPermiso: '',
    fechaInicio: '',
    fechaTermino: '',
    cantidadDias: 0,
    esMedioDia: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const cargarSaldos = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await usuarioService.getDiasDisponibles(user.id) as any;
      setBolsas({
        vacaciones: Number(data.vacaciones || 0),
        administrativos: Number(data.administrativos || 0),
        sinGoce: Number(data.sin_goce || 0),
        devolucionHoras: Number(data.devolucion || 0)
      });
    } catch (error) { 
      console.error("Error cargando saldos:", error); 
    }
  }, [user?.id]);

  useEffect(() => { 
    cargarSaldos(); 
  }, [cargarSaldos]);

  useEffect(() => {
    if (formData.esMedioDia) {
      setFormData(prev => ({ ...prev, cantidadDias: 0.5, fechaTermino: prev.fechaInicio }));
    } else if (formData.fechaInicio && formData.fechaTermino) {
      if (formData.tipoSolicitud !== 'devolucion_tiempo') {
        const dias = solicitudService.calcularDiasHabiles(formData.fechaInicio, formData.fechaTermino);
        if (formData.cantidadDias !== dias) {
          setFormData(prev => ({ ...prev, cantidadDias: dias }));
        }
      }
    }
  }, [formData.fechaInicio, formData.fechaTermino, formData.esMedioDia, formData.tipoSolicitud, formData.cantidadDias]);

  const handleChange = (field: keyof SolicitudFormData, value: any) => {
    setFormData(prev => {
      let finalValue = value;
      
      // ✅ PROTECCIÓN: Si el campo es cantidadDias, no permitir valores menores a 0
      if (field === 'cantidadDias' && value < 0) {
        finalValue = 0;
      }

      const newState = { ...prev, [field]: finalValue };
      if (field === 'tipoSolicitud') {
        newState.esMedioDia = false;
        newState.nombreOtroPermiso = '';
        newState.cantidadDias = 0;
      }
      return newState;
    });
    if (Object.keys(errors).length > 0) setErrors({});
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
    if (!formData.esMedioDia && !formData.fechaTermino) newErrors.fechaTermino = 'La fecha de término es requerida';
    
    const total = formData.cantidadDias;

    // ✅ VALIDACIÓN UNIVERSAL: No permitir 0 o negativos
    if (total <= 0) {
      newErrors.submit = 'La cantidad solicitada debe ser mayor a 0.';
      setErrors(newErrors);
      return false;
    }

    if (formData.tipoSolicitud === 'vacaciones') {
      if (total > bolsas.vacaciones) {
        newErrors.submit = `Días de vacaciones insuficientes. Disponibles: ${bolsas.vacaciones}`;
      }
    }

    if (formData.tipoSolicitud === 'dia_administrativo') {
      if (total > bolsas.administrativos) {
        newErrors.submit = `Días administrativos insuficientes. Disponibles: ${bolsas.administrativos}`;
      }
    }

    if (formData.tipoSolicitud === 'devolucion_tiempo') {
      if (total > bolsas.devolucionHoras) {
        newErrors.submit = `Horas de devolución insuficientes. Disponibles: ${bolsas.devolucionHoras}`;
      }
    }

    if (formData.tipoSolicitud === 'otro_permiso' && !formData.nombreOtroPermiso.trim()) {
      newErrors.nombreOtroPermiso = 'Especifique el tipo de permiso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    setIsSubmitting(true);
    try {
      await solicitudService.create({
        tipo: formData.tipoSolicitud,
        nombre_otro_permiso: formData.nombreOtroPermiso,
        fecha_inicio: formData.fechaInicio,
        fecha_termino: formData.esMedioDia ? formData.fechaInicio : formData.fechaTermino,
        cantidad_dias: formData.cantidadDias,
        es_medio_dia: formData.esMedioDia,
        motivo: formData.tipoSolicitud === 'otro_permiso' 
                ? `Solicitud: ${formData.nombreOtroPermiso}` 
                : `Solicitud de ${formData.tipoSolicitud.replace('_', ' ')}`,
        telefono_contacto: user?.telefono || 'N/A'
      });

      setSubmitSuccess(true);
      setFormData({ 
        tipoSolicitud: 'vacaciones', 
        nombreOtroPermiso: '', 
        fechaInicio: '', 
        fechaTermino: '', 
        cantidadDias: 0, 
        esMedioDia: false 
      });
      
      cargarSaldos();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      const backendError = error.response?.data?.cantidad_dias?.[0] || 
                           error.response?.data?.non_field_errors?.[0] ||
                           'Error al procesar la solicitud en el servidor.';
      setErrors({ submit: backendError });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!user) return null;

  return (
    <>
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerVacaciones />
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {submitSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
               <AlertCircle className="h-4 w-4 text-green-600" />
               <AlertDescription>Solicitud enviada con éxito. Pendiente de aprobación.</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="text-blue-500" /> Nueva Solicitud
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { id: 'vacaciones', label: 'Vacaciones', icon: CalendarDays },
                      { id: 'dia_administrativo', label: 'Admin.', icon: Briefcase },
                      { id: 'devolucion_tiempo', label: 'Tiempo', icon: Clock },
                      { id: 'permiso_sin_goce', label: 'Sin Goce', icon: MinusCircle },
                      { id: 'otro_permiso', label: 'Otros', icon: HelpCircle },
                    ].map((tipo) => (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => handleChange('tipoSolicitud', tipo.id as TipoSolicitud)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                          formData.tipoSolicitud === tipo.id 
                          ? `border-blue-500 bg-blue-50 text-blue-700` 
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <tipo.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold uppercase">{tipo.label}</span>
                      </button>
                    ))}
                  </div>

                  {formData.tipoSolicitud === 'otro_permiso' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label>Nombre del Permiso</Label>
                      <Input 
                        placeholder="Ej: Permiso por fallecimiento..."
                        value={formData.nombreOtroPermiso}
                        onChange={(e) => handleChange('nombreOtroPermiso', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input 
                        type="date" 
                        value={formData.fechaInicio} 
                        onChange={(e) => handleChange('fechaInicio', e.target.value)} 
                      />
                    </div>
                    {!formData.esMedioDia && (
                      <div className="space-y-2">
                        <Label>Fecha Término</Label>
                        <Input 
                          type="date" 
                          min={formData.fechaInicio} 
                          value={formData.fechaTermino} 
                          onChange={(e) => handleChange('fechaTermino', e.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  {formData.tipoSolicitud === 'dia_administrativo' && (
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-dashed">
                      <Checkbox 
                        id="medio-dia" 
                        checked={formData.esMedioDia} 
                        onCheckedChange={(checked) => handleChange('esMedioDia', checked)} 
                      />
                      <Label htmlFor="medio-dia" className="cursor-pointer">Solicitar solo medio día</Label>
                    </div>
                  )}

                  {formData.tipoSolicitud === 'devolucion_tiempo' && (
                    <div className="space-y-2">
                      <Label>Cantidad de Horas a devolver</Label>
                      <Input 
                        type="number" 
                        step="0.5"
                        min="0.5" // ✅ Bloquea negativos en los selectores del navegador
                        placeholder="0.0"
                        value={formData.cantidadDias}
                        onChange={(e) => handleChange('cantidadDias', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="bg-slate-900 text-white rounded-2xl p-6">
                    <p className="text-xs opacity-70">
                      Total a {formData.tipoSolicitud === 'devolucion_tiempo' ? 'descontar horas' : 'solicitar días'}:
                    </p>
                    <h3 className="text-3xl font-black">
                      {formData.cantidadDias} {formData.tipoSolicitud === 'devolucion_tiempo' ? 'Horas' : 'Días'}
                    </h3>
                  </div>

                  {errors.submit && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.submit}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isSubmitting || formData.cantidadDias <= 0} 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Enviando..." : "Confirmar Solicitud"}
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500"/> Mis Saldos Actuales
                </h3>
                <div className="space-y-3">
                    <div className={`p-4 rounded-xl border ${formData.tipoSolicitud === 'vacaciones' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                        <p className="text-[10px] font-bold uppercase opacity-70">Vacaciones</p>
                        <p className="text-2xl font-black text-blue-700">{bolsas.vacaciones} Días</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${formData.tipoSolicitud === 'dia_administrativo' ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100'}`}>
                        <p className="text-[10px] font-bold uppercase opacity-70">Administrativos</p>
                        <p className="text-2xl font-black text-purple-700">{bolsas.administrativos} Días</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${formData.tipoSolicitud === 'devolucion_tiempo' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                        <p className="text-[10px] font-bold uppercase opacity-70">Horas a Devolver</p>
                        <p className="text-2xl font-black text-orange-700">{bolsas.devolucionHoras} Horas</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SolicitarDiasPage;