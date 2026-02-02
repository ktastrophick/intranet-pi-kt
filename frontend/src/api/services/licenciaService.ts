// src/api/services/licenciaService.ts
import api from '../axios'; // Tu instancia de axios configurada
import type { LicenciaMedica } from '@/types/licencia';

export const licenciaService = {
  // Obtener todas las licencias
  getLicencias: async () => {
    const { data } = await api.get<LicenciaMedica[]>('/licencias/');
    return data;
  },

  // Crear una nueva (usando FormData para el archivo)
  createLicencia: async (formData: FormData) => {
    const { data } = await api.post<LicenciaMedica>('/licencias/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  // Eliminar
  deleteLicencia: async (id: string) => {
    await api.delete(`/licencias/${id}/`);
  }
};