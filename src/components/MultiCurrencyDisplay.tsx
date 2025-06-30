import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-config';

interface Currency {
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

interface MultiCurrencyDisplayProps {
  valueCLP: number;
  currency?: string;
  rate?: number;
  showSelector?: boolean;
  onCurrencyChange?: (currency: Currency) => void;
  className?: string;
}

export default function MultiCurrencyDisplay({ valueCLP, currency, rate, showSelector = false, onCurrencyChange, className = '' }: MultiCurrencyDisplayProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selected, setSelected] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showSelector) return;
    async function fetchCurrencies() {
      setLoading(true);
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('target_currency', 'CLP')
        .order('base_currency', { ascending: true });
      if (!error && data) {
        setCurrencies(data);
        setSelected(data[0] || null);
        if (onCurrencyChange && data[0]) onCurrencyChange(data[0]);
      }
      setLoading(false);
    }
    fetchCurrencies();
  }, [showSelector]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = currencies.find(c => c.base_currency === e.target.value);
    setSelected(currency || null);
    if (currency && onCurrencyChange) onCurrencyChange(currency);
  };

  if (showSelector) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">Moneda</label>
        <select
          className="border rounded px-2 py-1"
          value={selected?.base_currency || ''}
          onChange={handleChange}
          disabled={loading}
        >
          {currencies.map((c) => (
            <option key={c.base_currency} value={c.base_currency}>
              {c.base_currency}
            </option>
          ))}
        </select>
        {selected && (
          <div className="text-xs text-gray-500 mt-1">
            1 {selected.base_currency} = {selected.rate.toLocaleString('es-CL')} CLP
          </div>
        )}
        <div className="mt-2 text-lg font-bold">
          {selected
            ? `${(valueCLP / selected.rate).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${selected.base_currency}`
            : `${valueCLP.toLocaleString('es-CL')} CLP`}
        </div>
      </div>
    );
  }

  // Solo display
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="text-lg font-bold">
        {currency && rate
          ? `${(valueCLP / rate).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${currency}`
          : `${valueCLP.toLocaleString('es-CL')} CLP`}
      </div>
      {currency && rate && (
        <div className="text-xs text-gray-500 mt-1">
          1 {currency} = {rate.toLocaleString('es-CL')} CLP
        </div>
      )}
    </div>
  );
} 