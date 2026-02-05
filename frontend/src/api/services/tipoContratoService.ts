// ======================================================
// SERVICIO: TipoContratoService
// Ubicación: frontend/src/api/services/tipoContratoService.ts
// ======================================================
import axios from '../axios';
import type { TipoContrato } from '@/types/usuario';

class TipoContratoService {
  private readonly baseURL = '/tipos-contrato';

  async getAll(): Promise<TipoContrato[]> {
    const response = await axios.get(`${this.baseURL}/`);
    return response.data;
  }
}

export const tipoContratoService = new TipoContratoService();
export default tipoContratoService;