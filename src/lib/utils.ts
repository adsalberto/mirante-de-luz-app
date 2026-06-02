import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um ID bruto do banco em um número de registro/matrícula profissional e elegante.
 * Exemplo: 'vsWAtwbhE' -> 'Nº 26.482'
 */
export function formatRegistrationCode(id: string, registrationDate?: number): string {
  if (!id) return "Nº 00.000";
  
  // Se já estiver no formato correto, retorna
  if (/^Nº \d{2}\.\d{3}$/.test(id) || /^Nº \d{4}\.\d{3}$/.test(id)) {
    return id;
  }

  // Extrai dígitos se houver
  const digitsOnly = id.replace(/\D/g, '');
  
  // Define o ano como base (ex: 2026 -> "26")
  let yearPrefix = "26";
  if (registrationDate) {
    try {
      const date = new Date(registrationDate);
      yearPrefix = String(date.getFullYear()).substring(2);
    } catch (_) {}
  } else {
    yearPrefix = String(new Date().getFullYear()).substring(2);
  }

  let codeNum = 0;
  if (digitsOnly.length >= 3) {
    codeNum = parseInt(digitsOnly.substring(0, 3), 10);
  } else {
    // Hash determinístico baseado nos caracteres do ID para produzir um número estável de 3 de dígitos
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    codeNum = (Math.abs(hash) % 900) + 100; // Gera entre 100 e 999 estável
  }
  
  const paddedCode = String(codeNum).padStart(3, '0');
  return `Nº ${yearPrefix}.${paddedCode}`;
}

