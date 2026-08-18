/**
 * Utilitários padronizados para formatação de datas em padrão brasileiro (DD/MM/AAAA)
 * Exemplo: 14/08/2026
 */

/**
 * Formata qualquer entrada de data (Date, timestamp numérico, string YYYY-MM-DD ou ISO)
 * para o formato estrito brasileiro "DD/MM/AAAA" (ex: 14/08/2026).
 */
export function formatDateBR(dateInput?: string | number | Date | null, fallback: string = '-'): string {
  if (!dateInput && dateInput !== 0) return fallback;

  // Se já for uma string no formato DD/MM/AAAA
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Se for string no formato YYYY-MM-DD simples (evita bug de timezone UTC ao instanciar Date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Se começar com YYYY-MM-DDTHH...
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (_) {}
    }
  }

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (_) {
    return fallback;
  }
}

/**
 * Retorna a data e hora formatada em padrão brasileiro (ex: 14/08/2026 15:30)
 */
export function formatDateTimeBR(dateInput?: string | number | Date | null, fallback: string = '-'): string {
  if (!dateInput && dateInput !== 0) return fallback;
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return fallback;

    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} às ${timeStr}`;
  } catch (_) {
    return fallback;
  }
}

/**
 * Retorna a data atual no formato DD/MM/AAAA (ex: 14/08/2026)
 */
export function getTodayBR(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Retorna a data atual no formato YYYY-MM-DD para preencher inputs type="date"
 */
export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
