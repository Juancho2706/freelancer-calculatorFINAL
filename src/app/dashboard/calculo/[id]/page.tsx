'use client';

import { supabase } from '../../../../lib/supabase-config';
import { notFound } from 'next/navigation';
import Resultado from '../../../../components/Resultado';
import React, { useState, useEffect, use } from 'react';
import jsPDF from 'jspdf';

interface CalculoDetallePageProps {
  params: Promise<{ id: string }>;
}

export default function CalculoDetallePage({ params }: CalculoDetallePageProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('calculos')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          setError('Cálculo no encontrado');
          return;
        }

        setData(data);
      } catch (err) {
        setError('Error al cargar el cálculo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleExportPDF = () => {
    if (!data || !data.result) {
      console.error('No hay datos para exportar');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculadora de Precios para Freelancers', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Título del cálculo
    doc.setFontSize(16);
    doc.text(data.titulo || 'Detalle del cálculo', margin, yPosition);
    yPosition += 10;

    // Fecha
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date(data.created_at).toLocaleDateString('es-CL')}`, margin, yPosition);
    yPosition += 15;

    // Resultados principales
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULTADOS DEL CÁLCULO', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const resultado = data.result;
    const detalles = data;

    // Validar que los datos existan antes de usarlos
    if (resultado.tarifaHora) {
      doc.text(`Tarifa por hora: $${resultado.tarifaHora.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    if (resultado.tarifaProyecto) {
      doc.text(`Tarifa por proyecto: $${resultado.tarifaProyecto.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    if (resultado.ingresosNetos) {
      doc.text(`Ingresos netos: $${resultado.ingresosNetos.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += 15;
    }

    // Desglose de costos
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DESGLOSE DE COSTOS', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Gastos fijos
    if (detalles.gastosFijos) {
      doc.text(`Gastos fijos: $${detalles.gastosFijos.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    // IVA
    if (resultado.desglose?.iva) {
      doc.text(`IVA (19%): $${resultado.desglose.iva.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    // Retención
    if (resultado.desglose?.retencion) {
      doc.text(`Retención (13.75%): $${resultado.desglose.retencion.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    // Cotización de salud
    if (resultado.desglose?.cotizacionSalud) {
      doc.text(`Cotización de salud (7%): $${resultado.desglose.cotizacionSalud.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += 15;
    }

    // Parámetros del cálculo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PARÁMETROS UTILIZADOS', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    if (detalles.ingresosDeseados) {
      doc.text(`Ingresos deseados: $${detalles.ingresosDeseados.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    if (detalles.diasTrabajados) {
      doc.text(`Días trabajados al mes: ${detalles.diasTrabajados} días`, margin, yPosition);
      yPosition += lineHeight;
    }

    if (detalles.horasTrabajadas) {
      doc.text(`Horas trabajadas por día: ${detalles.horasTrabajadas} horas`, margin, yPosition);
      yPosition += lineHeight;
    }

    if (detalles.gastosFijos) {
      doc.text(`Gastos fijos: $${detalles.gastosFijos.toLocaleString('es-CL')} CLP`, margin, yPosition);
      yPosition += lineHeight;
    }

    // Pie de página
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Generado por Calculadora de Precios para Freelancers Chilenos', pageWidth / 2, footerY, { align: 'center' });

    // Guardar el PDF
    const fileName = `calculo_${data.titulo?.replace(/[^a-zA-Z0-9]/g, '_') || 'freelancer'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return notFound();
  }

  // Preparar datos para el componente Resultado
  const datosOriginales = {
    ingresosDeseados: data.ingresosDeseados,
    diasTrabajados: data.diasTrabajados,
    horasPorDia: data.horasTrabajadas,
    gastosFijos: data.gastosFijos
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-2">{data.titulo || 'Detalle del cálculo'}</h1>
      <p className="text-gray-500 mb-4">Realizado el: {new Date(data.created_at).toLocaleString()}</p>
      <Resultado resultado={data.result} datosOriginales={datosOriginales} />
      <div className="mt-6 flex gap-4">
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar a PDF
        </button>
      </div>
    </div>
  );
} 