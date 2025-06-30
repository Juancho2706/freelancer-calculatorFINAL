import { useState, useEffect } from 'react';
import { obtenerTipoCambio, obtenerImpuestos, obtenerTarifasMercado, obtenerTarifaEspecifica } from '@/lib/apis';

interface ExternalDataState {
  tipoCambio: {
    clp_usd: number;
    usd_clp: number;
    fecha: string;
    fuente: string;
  } | null;
  impuestos: {
    iva: number;
    retencion_boleta: number;
    cotizacion_salud: number;
    fecha_actualizacion: string;
  } | null;
  tarifasMercado: Array<{
    rubro: string;
    experiencia: string;
    min: number;
    promedio: number;
    max: number;
    fecha_actualizacion: string;
  }> | null;
  isLoading: boolean;
  error: string | null;
}

export function useExternalData() {
  const [state, setState] = useState<ExternalDataState>({
    tipoCambio: null,
    impuestos: null,
    tarifasMercado: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const [tipoCambio, impuestos, tarifasMercado] = await Promise.all([
          obtenerTipoCambio(),
          obtenerImpuestos(),
          obtenerTarifasMercado(),
        ]);

        setState({
          tipoCambio,
          impuestos,
          tarifasMercado,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error cargando datos externos:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error al cargar datos externos',
        }));
      }
    };

    cargarDatos();
  }, []);

  const obtenerTarifaEspecifica = async (rubro: string, experiencia: string) => {
    if (!state.tarifasMercado) return null;
    
    return state.tarifasMercado.find(
      t => t.rubro === rubro && t.experiencia === experiencia
    ) || null;
  };

  const convertirCLPaUSD = (clp: number) => {
    if (!state.tipoCambio) return 0;
    return clp * state.tipoCambio.usd_clp;
  };

  const convertirUSDaCLP = (usd: number) => {
    if (!state.tipoCambio) return 0;
    return usd * state.tipoCambio.clp_usd;
  };

  return {
    ...state,
    obtenerTarifaEspecifica,
    convertirCLPaUSD,
    convertirUSDaCLP,
  };
} 