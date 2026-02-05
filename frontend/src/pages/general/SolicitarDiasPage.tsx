// ======================================================
// PÁGINA: Solicitar Días/Horas Libres
// Ubicación: src/pages/general/SolicitarDiasPage.tsx
// ======================================================

'use client';

import React, { useState, useEffect } from 'react';
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

import { useAuth } from '@/api/contexts/AuthContext';
import { solicitudService, usuarioService } from '@/api';
import type { TipoSolicitud } from '@/api/services/solicitudService';

// ======================================================
// INTERFACES
// ======================================================

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

  useEffect(() => {
    if (user?.id) {
      cargarSaldos();
    }
  }, [user]);

  const cargarSaldos = async () => {
    try {
      const data = await usuarioService.getDiasDisponibles(user!.id) as any;
      setBolsas({
        vacaciones: data.vacaciones || 0,
        administrativos: Number(data.administrativos || 0),
        sinGoce: Number(data.sin_goce || 0),
        devolucionHoras: Number(data.devolucion || 0)
      });
    } catch (error) {
      console.error('Error al cargar saldos:', error);
    }
  };

  const handleChange = (field: keyof SolicitudFormData, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };

      if (field === 'tipoSolicitud') {
        newState.esMedioDia = false;
        newState.cantidadDias = 0;
        newState.nombreOtroPermiso = '';
      }

      if (field === 'fechaInicio' || field === 'fechaTermino' || field === 'esMedioDia' || field === 'tipoSolicitud') {
        if (newState.esMedioDia) {
          newState.cantidadDias = 0.5;
          newState.fechaTermino = newState.fechaInicio;
        } else if (newState.fechaInicio && newState.fechaTermino && newState.tipoSolicitud !== 'devolucion_tiempo') {
          newState.cantidadDias = solicitudService.calcularDiasHabiles(newState.fechaInicio, newState.fechaTermino);
        }
      }

      return newState;
    });

    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.fechaInicio) newErrors.fechaInicio = 'Fecha de inicio requerida';
    
    if (formData.tipoSolicitud === 'otro_permiso' && !formData.nombreOtroPermiso) {
        newErrors.nombreOtroPermiso = 'Especifique el tipo de permiso';
    }

    // Validaciones de saldo
    if (formData.tipoSolicitud === 'vacaciones' && formData.cantidadDias > bolsas.vacaciones) {
      newErrors.cantidadDias = `Saldo insuficiente (${bolsas.vacaciones} días)`;
    }
    if (formData.tipoSolicitud === 'dia_administrativo' && formData.cantidadDias > bolsas.administrativos) {
      newErrors.cantidadDias = `Saldo insuficiente (${bolsas.administrativos} días)`;
    }
    if (formData.tipoSolicitud === 'devolucion_tiempo' && formData.cantidadDias > bolsas.devolucionHoras) {
      newErrors.cantidadDias = `No tienes suficientes horas acumuladas (${bolsas.devolucionHoras} hrs)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setIsSubmitting(true);
    try {
      // Datos automáticos para cumplir con el modelo de Django
      const motivoAuto = `Solicitud de ${formData.tipoSolicitud.replace('_', ' ')}`;
      const telefonoAuto = user?.telefono || 'No registrado';

      await solicitudService.create({
        tipo: formData.tipoSolicitud,
        nombre_otro_permiso: formData.nombreOtroPermiso,
        fecha_inicio: formData.fechaInicio,
        fecha_termino: formData.fechaTermino,
        cantidad_dias: formData.cantidadDias,
        es_medio_dia: formData.esMedioDia,
        motivo: motivoAuto,
        telefono_contacto: telefonoAuto
      });

      setSubmitSuccess(true);
      cargarSaldos();
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData(prev => ({ ...prev, fechaInicio: '', fechaTermino: '', cantidadDias: 0 }));
      }, 3000);
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.error || 'Error al procesar la solicitud' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <UnifiedNavbar />
      <div className="h-16" />
      <BannerVacaciones />

      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          
          {submitSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="text-green-600" />
               <p className="text-green-800 font-bold">Solicitud enviada con éxito.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FileText className="text-blue-500" /> Nueva Solicitud
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Selección de Tipo */}
                  <div className="space-y-4">
                    <Label className="text-base font-bold">¿Qué deseas solicitar?</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { id: 'vacaciones', label: 'Vacaciones', icon: CalendarDays },
                        { id: 'dia_administrativo', label: 'Día Admin.', icon: Briefcase },
                        { id: 'devolucion_tiempo', label: 'Horas x Tiempo', icon: Clock },
                        { id: 'permiso_sin_goce', label: 'Sin Goce', icon: MinusCircle },
                        { id: 'otro_permiso', label: 'Otros', icon: HelpCircle },
                      ].map((tipo) => (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => handleChange('tipoSolicitud', tipo.id as TipoSolicitud)}
                          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                            formData.tipoSolicitud === tipo.id 
                            ? `border-blue-500 bg-blue-50 text-blue-700 shadow-sm` 
                            : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <tipo.icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-bold text-center">{tipo.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.tipoSolicitud === 'otro_permiso' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <Label>Especifique el motivo brevemente *</Label>
                      <Input 
                        placeholder="Ej: Mudanza, Trámite legal..."
                        value={formData.nombreOtroPermiso}
                        onChange={(e) => handleChange('nombreOtroPermiso', e.target.value)}
                        className={errors.nombreOtroPermiso ? "border-red-500" : ""}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input 
                        type="date" 
                        value={formData.fechaInicio}
                        onChange={(e) => handleChange('fechaInicio', e.target.value)}
                        className={errors.fechaInicio ? "border-red-500" : ""}
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

                  {(formData.tipoSolicitud === 'dia_administrativo' || formData.tipoSolicitud === 'otro_permiso') && (
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-dashed">
                      <Checkbox 
                        id="medio-dia" 
                        checked={formData.esMedioDia}
                        onCheckedChange={(checked) => handleChange('esMedioDia', checked)}
                      />
                      <label htmlFor="medio-dia" className="text-sm font-medium leading-none cursor-pointer">
                        Solicitar solo <strong>medio día</strong>
                      </label>
                    </div>
                  )}

                  {/* Resumen Final */}
                  <div className="bg-slate-900 text-white rounded-2xl p-6 flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Total a descontar:</p>
                      <h3 className="text-4xl font-black">
                        {formData.cantidadDias} {formData.tipoSolicitud === 'devolucion_tiempo' ? 'Horas' : 'Días'}
                      </h3>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full">
                       <FileText size={32} className="text-blue-400" />
                    </div>
                  </div>

                  {errors.submit && (
                    <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-200">
                      {errors.submit}
                    </p>
                  )}

                  <div className="pt-4">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-bold shadow-md">
                      {isSubmitting ? "Procesando..." : <><Send className="mr-2 w-5 h-5" /> Confirmar y Enviar Solicitud</>}
                    </Button>
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                      Al enviar, tu jefatura recibirá una notificación para su revisión.
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24">
                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                  <Briefcase size={18} className="text-slate-400"/> Tus Saldos
                </h3>
                <div className="space-y-3">
                  <SaldoItem label="Vacaciones" valor={bolsas.vacaciones} color="blue" icon={<CalendarDays size={16}/>} />
                  <SaldoItem label="Admin. Disponibles" valor={bolsas.administrativos} color="purple" icon={<Briefcase size={16}/>} />
                  <SaldoItem label="Horas a Devolver" valor={bolsas.devolucionHoras} color="emerald" icon={<Clock size={16}/>} />
                  <SaldoItem label="Días Sin Goce" valor={bolsas.sinGoce} color="orange" icon={<MinusCircle size={16}/>} />
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

// Componente auxiliar para los items de saldo
const SaldoItem = ({ label, valor, color, icon }: { label: string, valor: number, color: string, icon: React.ReactNode }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl border border-${color}-100 bg-${color}-50/50`}>
    <div className="flex items-center gap-2">
      <span className={`text-${color}-600`}>{icon}</span>
      <span className={`text-xs font-bold text-${color}-900`}>{label}</span>
    </div>
    <span className={`text-lg font-black text-${color}-700`}>{valor}</span>
  </div>
);

export default SolicitarDiasPage;