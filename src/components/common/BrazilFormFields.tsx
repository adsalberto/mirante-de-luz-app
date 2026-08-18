import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, Phone, MapPin, Globe } from 'lucide-react';
import { 
  formatCEP, 
  lookupCEP, 
  formatCPF, 
  validateCPF, 
  formatRG, 
  validateRG, 
  formatPhone, 
  validatePhone, 
  BRAZIL_DDDS, 
  getDddInfo,
  CepLookupResult
} from '../../utils/brazilValidation';

// ----------------------------------------------------
// CEP INPUT FIELD COM CONSULTA VIACEP E AUTO-COMPLETE
// ----------------------------------------------------
interface CepFieldProps {
  value: string;
  onChange: (cep: string) => void;
  onAddressFound?: (addressData: {
    cep: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    fullCityState: string;
  }) => void;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export const CepField: React.FC<CepFieldProps> = ({
  value,
  onChange,
  onAddressFound,
  className = '',
  required = false,
  label = 'CEP (Código Postal)',
  id = 'cep-input-field'
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLookup = async (cepToLookup: string) => {
    const clean = cepToLookup.replace(/\D/g, '');
    if (clean.length !== 8) {
      if (clean.length > 0) {
        setErrorMsg('CEP inválido: deve conter 8 dígitos numéricos.');
        setSuccessMsg(null);
      }
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result: CepLookupResult = await lookupCEP(clean);
    setLoading(false);

    if (!result.valid || !result.data) {
      setErrorMsg(result.error || 'CEP inválido');
      setSuccessMsg(null);
    } else {
      setErrorMsg(null);
      setSuccessMsg(`✓ ${result.data.city} / ${result.data.state}`);
      if (onAddressFound) {
        onAddressFound(result.data);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    onChange(formatted);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Se atingir 8 dígitos (ex: 41250-100), busca automaticamente
    const clean = formatted.replace(/\D/g, '');
    if (clean.length === 8) {
      handleLookup(formatted);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {loading && (
          <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 animate-pulse">
            <Loader2 size={10} className="animate-spin" /> Consultando Correios...
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={() => {
            if (value && value.replace(/\D/g, '').length === 8 && !successMsg && !loading) {
              handleLookup(value);
            }
          }}
          placeholder="00000-000"
          maxLength={9}
          required={required}
          className={`w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none transition-all ${
            errorMsg 
              ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-400' 
              : successMsg 
                ? 'border-emerald-400 bg-emerald-50/30 text-emerald-900 focus:ring-2 focus:ring-emerald-400'
                : 'border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500'
          }`}
        />
        <button
          type="button"
          onClick={() => handleLookup(value)}
          disabled={loading || !value}
          title="Consultar CEP nos Correios"
          className="absolute right-2 p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
        >
          {loading ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <Search size={14} />}
        </button>
      </div>

      {errorMsg && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5 animate-in fade-in">
          <AlertCircle size={11} className="shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}

      {successMsg && (
        <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5 animate-in fade-in">
          <CheckCircle2 size={11} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// TELEFONE INPUT FIELD COM DDD & TABELA RÁPIDA
// ----------------------------------------------------
interface PhoneFieldProps {
  value: string;
  onChange: (phone: string) => void;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  label = 'Telefone / WhatsApp',
  id = 'phone-input-field'
}) => {
  const [showDddPicker, setShowDddPicker] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('TODAS');

  const clean = (value || '').replace(/\D/g, '');
  const currentDdd = clean.slice(0, 2);
  const dddInfo = getDddInfo(currentDdd);
  const validation = value ? validatePhone(value) : { valid: true };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
  };

  const handleSelectDdd = (ddd: string) => {
    const numberPart = clean.length > 2 ? clean.slice(2) : '';
    const newRaw = `${ddd}${numberPart}`;
    onChange(formatPhone(newRaw));
    setShowDddPicker(false);
  };

  const filteredDdds = selectedRegion === 'TODAS' 
    ? BRAZIL_DDDS 
    : BRAZIL_DDDS.filter(d => d.region === selectedRegion);

  return (
    <div className={`space-y-1 relative ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowDddPicker(!showDddPicker)}
          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Globe size={11} />
          <span>Tabela de DDDs {dddInfo ? `(${dddInfo.state})` : ''}</span>
        </button>
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-1 text-gray-400 pointer-events-none">
          <Phone size={14} />
        </div>

        <input
          id={id}
          type="text"
          value={value}
          onChange={handlePhoneChange}
          placeholder="(00) 00000-0000"
          maxLength={15}
          required={required}
          className={`w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none transition-all ${
            !validation.valid && value
              ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400'
              : validation.valid && clean.length >= 10
                ? 'border-emerald-300 bg-emerald-50/20 text-emerald-950 focus:ring-2 focus:ring-emerald-400'
                : 'border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500'
          }`}
        />
      </div>

      {!validation.valid && value && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5 animate-in fade-in">
          <AlertCircle size={11} className="shrink-0" />
          <span>{validation.error}</span>
        </p>
      )}

      {/* DROPDOWN / TABELA DE DDDS */}
      {showDddPicker && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 space-y-2.5 max-h-64 overflow-y-auto animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-[11px] font-black text-gray-800">
              Selecione o DDD do Estado
            </span>
            <button
              type="button"
              onClick={() => setShowDddPicker(false)}
              className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
            >
              Fechar ✕
            </button>
          </div>

          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold">
            {['TODAS', 'Nordeste', 'Sudeste', 'Sul', 'Centro-Oeste', 'Norte'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-2 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedRegion === reg
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* DDD Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {filteredDdds.map((d) => (
              <button
                key={d.ddd}
                type="button"
                onClick={() => handleSelectDdd(d.ddd)}
                className={`p-2 rounded-xl text-left text-xs border transition-all flex items-center justify-between cursor-pointer ${
                  currentDdd === d.ddd
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-black'
                    : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-indigo-50/50 hover:border-indigo-200'
                }`}
              >
                <div className="truncate">
                  <span className="font-mono font-black text-indigo-700 mr-1.5">({d.ddd})</span>
                  <span className="text-[11px] text-gray-600">{d.stateName}</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 ml-1">
                  {d.state}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// CPF INPUT FIELD COM VALIDAÇÃO OFICIAL
// ----------------------------------------------------
interface CpfFieldProps {
  value: string;
  onChange: (cpf: string) => void;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export const CpfField: React.FC<CpfFieldProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  label = 'CPF (11 dígitos)',
  id = 'cpf-input-field'
}) => {
  const clean = (value || '').replace(/\D/g, '');
  const validation = value ? validateCPF(value) : { valid: true };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    onChange(formatted);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {clean.length === 11 && validation.valid && (
          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
            <CheckCircle2 size={10} /> CPF Válido
          </span>
        )}
      </div>

      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="000.000.000-00"
        maxLength={14}
        required={required}
        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none transition-all ${
          !validation.valid && value && clean.length >= 11
            ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400'
            : validation.valid && clean.length === 11
              ? 'border-emerald-300 bg-emerald-50/20 text-emerald-950 focus:ring-2 focus:ring-emerald-400'
              : 'border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500'
        }`}
      />

      {!validation.valid && value && clean.length >= 11 && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5 animate-in fade-in">
          <AlertCircle size={11} className="shrink-0" />
          <span>{validation.error}</span>
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// RG INPUT FIELD COM VALIDAÇÃO DE TAMANHO
// ----------------------------------------------------
interface RgFieldProps {
  value: string;
  onChange: (rg: string) => void;
  className?: string;
  required?: boolean;
  label?: string;
  id?: string;
}

export const RgField: React.FC<RgFieldProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  label = 'RG / Documento Oficial',
  id = 'rg-input-field'
}) => {
  const validation = value ? validateRG(value) : { valid: true };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    onChange(formatted);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <input
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="00.000.000-0"
        maxLength={15}
        required={required}
        className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none transition-all ${
          !validation.valid && value
            ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-400'
            : 'border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500'
        }`}
      />

      {!validation.valid && value && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5 animate-in fade-in">
          <AlertCircle size={11} className="shrink-0" />
          <span>{validation.error}</span>
        </p>
      )}
    </div>
  );
};
