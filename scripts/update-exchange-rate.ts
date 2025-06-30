const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'NO');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Lista de monedas relevantes de mindicador.cl
const monedas = [
  { nombre: 'dolar', base: 'USD', target: 'CLP' },
  { nombre: 'euro', base: 'EUR', target: 'CLP' },
  { nombre: 'uf', base: 'UF', target: 'CLP' },
  { nombre: 'utm', base: 'UTM', target: 'CLP' },
  { nombre: 'bitcoin', base: 'BTC', target: 'CLP' },
];

async function actualizarMonedas() {
  try {
    const now = new Date().toISOString();
    const upserts = [];
    for (const moneda of monedas) {
      const url = `https://mindicador.cl/api/${moneda.nombre}`;
      console.log(`🔄 Obteniendo tipo de cambio desde ${url}...`);
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`⚠️ Error HTTP ${response.status} para ${moneda.nombre}. Se usará valor fijo.`);
        upserts.push({
          base_currency: moneda.base,
          target_currency: moneda.target,
          rate: 950,
          fetched_at: now,
        });
        continue;
      }
      const data = await response.json();
      let rate = null;
      if (data && data.serie && Array.isArray(data.serie) && data.serie.length > 0) {
        rate = data.serie[0].valor;
      } else {
        console.warn(`⚠️ No se pudo obtener el valor de ${moneda.nombre}. Se usará valor fijo.`);
        rate = 950;
      }
      upserts.push({
        base_currency: moneda.base,
        target_currency: moneda.target,
        rate,
        fetched_at: now,
      });
      console.log(`📊 ${moneda.base}/CLP = ${rate}`);
    }
    // Guardar todos los valores en Supabase
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(upserts, { onConflict: 'base_currency,target_currency', ignoreDuplicates: false });
    if (error) {
      console.error('❌ Error guardando en Supabase:', error);
      throw error;
    }
    console.log('✅ Monedas actualizadas exitosamente en Supabase');
    return { success: true, upserts };
  } catch (error) {
    console.error('❌ Error actualizando monedas:', error);
    throw error;
  }
}

if (require.main === module) {
  actualizarMonedas()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Proceso falló:', error);
      process.exit(1);
    });
}

module.exports = { actualizarMonedas }; 