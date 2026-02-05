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
// ✅ CORREGIDO: Import de componentes de alerta
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
  const [bolsas, setBolsas] = useState({ vacaciones: 0, administrativos: 0, sinGoce: 0, devolucionHoras: 0 });
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
        vacaciones: data.vacaciones || 0,
        administrativos: Number(data.administrativos || 0),
        sinGoce: Number(data.sin_goce || 0),
        devolucionHoras: Number(data.devolucion || 0)
      });
    } catch (error) { console.error(error); }
  }, [user?.id]);

  useEffect(() => { cargarSaldos(); }, [cargarSaldos]);

  // ✅ CORREGIDO: Cálculo de días mediante useEffect para evitar crash (pantalla blanca)
  useEffect(() => {
    if (formData.esMedioDia) {
      setFormData(prev => ({ ...prev, cantidadDias: 0.5, fechaTermino: prev.fechaInicio }));
    } else if (formData.fechaInicio && formData.fechaTermino) {
      if (formData.tipoSolicitud !== 'devolucion_tiempo') {
        const dias = solicitudService.calcularDiasHabiles(formData.fechaInicio, formData.fechaTermino);
        // Solo actualizamos si el valor cambió para evitar bucles
        setFormData(prev => prev.cantidadDias !== dias ? { ...prev, cantidadDias: dias } : prev);
      }
    }
  }, [formData.fechaInicio, formData.fechaTermino, formData.esMedioDia, formData.tipoSolicitud]);

  const handleChange = (field: keyof SolicitudFormData, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'tipoSolicitud') {
        newState.esMedioDia = false;
        newState.nombreOtroPermiso = '';
      }
      return newState;
    });
    if (errors[field]) setErrors({});
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fechaInicio) newErrors.fechaInicio = 'Requerido';
    if (!formData.esMedioDia && !formData.fechaTermino) newErrors.fechaTermino = 'Requerido';
    if (formData.tipoSolicitud === 'vacaciones' && formData.cantidadDias > bolsas.vacaciones) {
        newErrors.submit = 'Días insuficientes.';
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
        motivo: `Solicitud de ${formData.tipoSolicitud.replace('_', ' ')}`,
        telefono_contacto: user?.telefono || 'N/A'
      });
      setSubmitSuccess(true);
      setFormData({ tipoSolicitud: 'vacaciones', nombreOtroPermiso: '', fechaInicio: '', fechaTermino: '', cantidadDias: 0, esMedioDia: false });
      cargarSaldos();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error: any) {
      setErrors({ submit: 'Error al procesar la solicitud' });
    } finally { setIsSubmitting(false); }
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
               <AlertDescription>Solicitud enviada con éxito.</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="text-blue-500" /> Nueva Solicitud
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selector de tipo */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input type="date" value={formData.fechaInicio} onChange={(e) => handleChange('fechaInicio', e.target.value)} />
                    </div>
                    {!formData.esMedioDia && (
                      <div className="space-y-2">
                        <Label>Fecha Término</Label>
                        <Input type="date" min={formData.fechaInicio} value={formData.fechaTermino} onChange={(e) => handleChange('fechaTermino', e.target.value)} />
                      </div>
                    )}
                  </div>

                  {formData.tipoSolicitud === 'dia_administrativo' && (
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-dashed">
                      <Checkbox id="medio-dia" checked={formData.esMedioDia} onCheckedChange={(checked) => handleChange('esMedioDia', checked)} />
                      <Label htmlFor="medio-dia" className="cursor-pointer">Solicitar medio día</Label>
                    </div>
                  )}

                  <div className="bg-slate-900 text-white rounded-2xl p-6">
                    <p className="text-xs opacity-70">Total a descontar:</p>
                    <h3 className="text-3xl font-black">{formData.cantidadDias} Días</h3>
                  </div>

                  {errors.submit && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.submit}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold">
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Enviando..." : "Confirmar Solicitud"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Panel de Saldos */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500"/> Saldos Disponibles
                </h3>
                <div className="space-y-3">
                    <div className="p-4 rounded-xl border bg-blue-50 border-blue-100 text-blue-700">
                        <p className="text-[10px] font-bold uppercase opacity-70">Vacaciones</p>
                        <p className="text-2xl font-black">{bolsas.vacaciones} Días</p>
                    </div>
                    <div className="p-4 rounded-xl border bg-purple-50 border-purple-100 text-purple-700">
                        <p className="text-[10px] font-bold uppercase opacity-70">Administrativos</p>
                        <p className="text-2xl font-black">{bolsas.administrativos} Días</p>
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