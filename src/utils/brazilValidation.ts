/**
 * Módulo de Validação e Formatação de Documentos, Telefones e Endereços Brasileiros
 * Padrões: CPF (com validação oficial), RG, CEP (com consulta ViaCEP) e Telefone (com DDD e normas Anatel)
 */

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade
  uf: string;         // Estado
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export interface CepLookupResult {
  valid: boolean;
  error?: string;
  data?: {
    cep: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    fullCityState: string;
    ddd?: string;
  };
}

// Tabela oficial de DDDs do Brasil por Estado
export interface DddStateInfo {
  ddd: string;
  state: string;
  stateName: string;
  region: string;
}

export const BRAZIL_DDDS: DddStateInfo[] = [
  // São Paulo
  { ddd: '11', state: 'SP', stateName: 'São Paulo (Capital/Região Metrop.)', region: 'Sudeste' },
  { ddd: '12', state: 'SP', stateName: 'São Paulo (Vale do Paraíba/Litoral Norte)', region: 'Sudeste' },
  { ddd: '13', state: 'SP', stateName: 'São Paulo (Baixada Santista/Litoral Sul)', region: 'Sudeste' },
  { ddd: '14', state: 'SP', stateName: 'São Paulo (Bauru/Marília/Jaú/Botucatu)', region: 'Sudeste' },
  { ddd: '15', state: 'SP', stateName: 'São Paulo (Sorocaba/Itapetininga)', region: 'Sudeste' },
  { ddd: '16', state: 'SP', stateName: 'São Paulo (Ribeirão Preto/Franca/São Carlos)', region: 'Sudeste' },
  { ddd: '17', state: 'SP', stateName: 'São Paulo (São José do Rio Preto/Barretos)', region: 'Sudeste' },
  { ddd: '18', state: 'SP', stateName: 'São Paulo (Presidente Prudente/Araçatuba)', region: 'Sudeste' },
  { ddd: '19', state: 'SP', stateName: 'São Paulo (Campinas/Piracicaba/Limeira)', region: 'Sudeste' },

  // Rio de Janeiro
  { ddd: '21', state: 'RJ', stateName: 'Rio de Janeiro (Capital e Grande Rio)', region: 'Sudeste' },
  { ddd: '22', state: 'RJ', stateName: 'Rio de Janeiro (Campos/Cabo Frio/Macaé)', region: 'Sudeste' },
  { ddd: '24', state: 'RJ', stateName: 'Rio de Janeiro (Petrópolis/Volta Redonda/Angra)', region: 'Sudeste' },

  // Espírito Santo
  { ddd: '27', state: 'ES', stateName: 'Espírito Santo (Vitória/Vila Velha/Norte)', region: 'Sudeste' },
  { ddd: '28', state: 'ES', stateName: 'Espírito Santo (Cachoeiro de Itapemirim/Sul)', region: 'Sudeste' },

  // Minas Gerais
  { ddd: '31', state: 'MG', stateName: 'Minas Gerais (Belo Horizonte/Região Metrop.)', region: 'Sudeste' },
  { ddd: '32', state: 'MG', stateName: 'Minas Gerais (Juiz de Fora/Zona da Mata)', region: 'Sudeste' },
  { ddd: '33', state: 'MG', stateName: 'Minas Gerais (Governador Valadares/Teófilo Otoni)', region: 'Sudeste' },
  { ddd: '34', state: 'MG', stateName: 'Minas Gerais (Uberlândia/Uberaba/Triângulo)', region: 'Sudeste' },
  { ddd: '35', state: 'MG', stateName: 'Minas Gerais (Poços de Caldas/Pouso Alegre/Sul)', region: 'Sudeste' },
  { ddd: '37', state: 'MG', stateName: 'Minas Gerais (Divinópolis/Itaúna/Centro-Oeste)', region: 'Sudeste' },
  { ddd: '38', state: 'MG', stateName: 'Minas Gerais (Montes Claros/Norte)', region: 'Sudeste' },

  // Paraná
  { ddd: '41', state: 'PR', stateName: 'Paraná (Curitiba e Região Metropolitana)', region: 'Sul' },
  { ddd: '42', state: 'PR', stateName: 'Paraná (Ponta Grossa/Guarapuava)', region: 'Sul' },
  { ddd: '43', state: 'PR', stateName: 'Paraná (Londrina/Apucarana)', region: 'Sul' },
  { ddd: '44', state: 'PR', stateName: 'Paraná (Maringá/Campo Mourão/Umuarama)', region: 'Sul' },
  { ddd: '45', state: 'PR', stateName: 'Paraná (Foz do Iguaçu/Cascavel)', region: 'Sul' },
  { ddd: '46', state: 'PR', stateName: 'Paraná (Francisco Beltrão/Pato Branco)', region: 'Sul' },

  // Santa Catarina
  { ddd: '47', state: 'SC', stateName: 'Santa Catarina (Joinville/Blumenau/Itajaí)', region: 'Sul' },
  { ddd: '48', state: 'SC', stateName: 'Santa Catarina (Florianópolis e Criciúma)', region: 'Sul' },
  { ddd: '49', state: 'SC', stateName: 'Santa Catarina (Chapecó/Lages/Oeste)', region: 'Sul' },

  // Rio Grande do Sul
  { ddd: '51', state: 'RS', stateName: 'Rio Grande do Sul (Porto Alegre e Região Metrop.)', region: 'Sul' },
  { ddd: '53', state: 'RS', stateName: 'Rio Grande do Sul (Pelotas/Rio Grande)', region: 'Sul' },
  { ddd: '54', state: 'RS', stateName: 'Rio Grande do Sul (Caxias do Sul/Passo Fundo)', region: 'Sul' },
  { ddd: '55', state: 'RS', stateName: 'Rio Grande do Sul (Santa Maria/Uruguaiana)', region: 'Sul' },

  // Centro-Oeste / DF / TO
  { ddd: '61', state: 'DF/GO', stateName: 'Distrito Federal e Entorno', region: 'Centro-Oeste' },
  { ddd: '62', state: 'GO', stateName: 'Goiás (Goiânia e Região Metropolitana)', region: 'Centro-Oeste' },
  { ddd: '63', state: 'TO', stateName: 'Tocantins (Palmas e Interior)', region: 'Norte' },
  { ddd: '64', state: 'GO', stateName: 'Goiás (Rio Verde/Itumbiara/Caldas Novas)', region: 'Centro-Oeste' },
  { ddd: '65', state: 'MT', stateName: 'Mato Grosso (Cuiabá e Região)', region: 'Centro-Oeste' },
  { ddd: '66', state: 'MT', stateName: 'Mato Grosso (Rondonópolis/Sinop/Interior)', region: 'Centro-Oeste' },
  { ddd: '67', state: 'MS', stateName: 'Mato Grosso do Sul (Campo Grande/Dourados)', region: 'Centro-Oeste' },

  // Norte
  { ddd: '68', state: 'AC', stateName: 'Acre (Rio Branco e Interior)', region: 'Norte' },
  { ddd: '69', state: 'RO', stateName: 'Rondônia (Porto Velho e Interior)', region: 'Norte' },
  { ddd: '91', state: 'PA', stateName: 'Pará (Belém e Região Metropolitana)', region: 'Norte' },
  { ddd: '92', state: 'AM', stateName: 'Amazonas (Manaus e Região Metropolitana)', region: 'Norte' },
  { ddd: '93', state: 'PA', stateName: 'Pará (Santarém e Oeste)', region: 'Norte' },
  { ddd: '94', state: 'PA', stateName: 'Pará (Marabá/Carajás/Sul)', region: 'Norte' },
  { ddd: '95', state: 'RR', stateName: 'Roraima (Boa Vista e Interior)', region: 'Norte' },
  { ddd: '96', state: 'AP', stateName: 'Amapá (Macapá e Interior)', region: 'Norte' },
  { ddd: '97', state: 'AM', stateName: 'Amazonas (Interior/Tefé)', region: 'Norte' },

  // Nordeste - Bahia e Sergipe
  { ddd: '71', state: 'BA', stateName: 'Bahia (Salvador e Região Metropolitana)', region: 'Nordeste' },
  { ddd: '73', state: 'BA', stateName: 'Bahia (Ilhéus/Itabuna/Porto Seguro/Sul)', region: 'Nordeste' },
  { ddd: '74', state: 'BA', stateName: 'Bahia (Juazeiro/Irecê/Senhor do Bonfim)', region: 'Nordeste' },
  { ddd: '75', state: 'BA', stateName: 'Bahia (Feira de Santana/Alagoinhas/Nordeste)', region: 'Nordeste' },
  { ddd: '77', state: 'BA', stateName: 'Bahia (Vitória da Conquista/Barreiras/Oeste)', region: 'Nordeste' },
  { ddd: '79', state: 'SE', stateName: 'Sergipe (Aracaju e Interior)', region: 'Nordeste' },

  // Nordeste - Pernambuco e Alagoas
  { ddd: '81', state: 'PE', stateName: 'Pernambuco (Recife e Região Metropolitana)', region: 'Nordeste' },
  { ddd: '82', state: 'AL', stateName: 'Alagoas (Maceió e Interior)', region: 'Nordeste' },
  { ddd: '87', state: 'PE', stateName: 'Pernambuco (Petrolina/Caruaru/Sertão)', region: 'Nordeste' },

  // Nordeste - Paraíba e Rio Grande do Norte
  { ddd: '83', state: 'PB', stateName: 'Paraíba (João Pessoa/Campina Grande)', region: 'Nordeste' },
  { ddd: '84', state: 'RN', stateName: 'Rio Grande do Norte (Natal e Mossoró)', region: 'Nordeste' },

  // Nordeste - Ceará, Piauí e Maranhão
  { ddd: '85', state: 'CE', stateName: 'Ceará (Fortaleza e Região Metropolitana)', region: 'Nordeste' },
  { ddd: '86', state: 'PI', stateName: 'Piauí (Teresina e Parnaíba/Norte)', region: 'Nordeste' },
  { ddd: '88', state: 'CE', stateName: 'Ceará (Juazeiro do Norte/Sobral/Interior)', region: 'Nordeste' },
  { ddd: '89', state: 'PI', stateName: 'Piauí (Picos/Floriano/Sul)', region: 'Nordeste' },
  { ddd: '98', state: 'MA', stateName: 'Maranhão (São Luís e Região Metropolitana)', region: 'Nordeste' },
  { ddd: '99', state: 'MA', stateName: 'Maranhão (Imperatriz/Caxias/Sul)', region: 'Nordeste' }
];

const VALID_DDD_SET = new Set(BRAZIL_DDDS.map(d => d.ddd));

// ----------------------------------------------------
// CEP: Formatação, Validação e Busca na API ViaCEP
// ----------------------------------------------------

/**
 * Formata CEP no padrão 00000-000 limitando a 8 dígitos
 */
export function formatCEP(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Valida a quantidade de dígitos do CEP (deve ter exatamente 8 dígitos numéricos)
 */
export function isValidCEPFormat(cep: string): boolean {
  const digits = (cep || '').replace(/\D/g, '');
  return digits.length === 8;
}

/**
 * Consulta CEP em tempo real na API oficial ViaCEP
 * Retorna dados completos do logradouro ou mensagem de erro clara ("CEP inválido")
 */
export async function lookupCEP(cep: string): Promise<CepLookupResult> {
  const cleanDigits = (cep || '').replace(/\D/g, '');

  if (cleanDigits.length === 0) {
    return { valid: false, error: 'Informe o CEP' };
  }

  if (cleanDigits.length !== 8) {
    return { 
      valid: false, 
      error: `CEP incompleto (${cleanDigits.length}/8 dígitos). O CEP precisa ter exatamente 8 números.` 
    };
  }

  // Checa se não é CEP genérico inválido como 00000000
  if (/^(\d)\1{7}$/.test(cleanDigits)) {
    return { valid: false, error: 'CEP inválido (sequência repetida)' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`https://viacep.com.br/ws/${cleanDigits}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { valid: false, error: 'CEP inválido ou serviço dos Correios indisponível' };
    }

    const data: ViaCepResponse = await response.json();

    if (data.erro) {
      return { 
        valid: false, 
        error: 'CEP inválido. Esse código postal não existe na base oficial dos Correios.' 
      };
    }

    const city = data.localidade || '';
    const state = data.uf || '';
    const fullCityState = city && state ? `${city} / ${state}` : (city || state || '');

    return {
      valid: true,
      data: {
        cep: data.cep || formatCEP(cleanDigits),
        address: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: city,
        state: state,
        fullCityState: fullCityState,
        ddd: data.ddd
      }
    };
  } catch (err: any) {
    console.error('Erro na consulta do CEP:', err);
    if (err.name === 'AbortError') {
      return { valid: false, error: 'Tempo esgotado ao consultar CEP. Verifique sua conexão.' };
    }
    return { valid: false, error: 'Não foi possível consultar o CEP no momento' };
  }
}

// ----------------------------------------------------
// CPF: Formatação e Validação Oficial dos 11 Dígitos
// ----------------------------------------------------

/**
 * Formata CPF no padrão 000.000.000-00 limitando a 11 dígitos
 */
export function formatCPF(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Validação do algoritmo oficial da Receita Federal para CPF (Módulo 11)
 */
export function validateCPF(cpf: string): { valid: boolean; error?: string } {
  const clean = (cpf || '').replace(/\D/g, '');

  if (!clean) {
    return { valid: false, error: 'CPF é obrigatório' };
  }

  if (clean.length !== 11) {
    return { 
      valid: false, 
      error: `CPF incompleto (${clean.length}/11 dígitos). Deve conter exatamente 11 números.` 
    };
  }

  // Rejeita sequências de dígitos iguais (00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(clean)) {
    return { valid: false, error: 'CPF inválido (dígitos repetidos)' };
  }

  // Validação do 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) {
    return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' };
  }

  // Validação do 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) {
    return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' };
  }

  return { valid: true };
}

// ----------------------------------------------------
// RG: Formatação e Validação
// ----------------------------------------------------

/**
 * Formata RG no padrão de documento de identidade 00.000.000-0 ou padrão com dígito
 */
export function formatRG(value: string): string {
  // Limpa mantendo números e letra X / x
  let clean = (value || '').replace(/[^0-9xX]/g, '').toUpperCase().slice(0, 12);
  
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}-${clean.slice(8)}`;
}

/**
 * Validação de tamanho numérico de RG brasileiro (geralmente entre 7 e 12 caracteres)
 */
export function validateRG(rg: string): { valid: boolean; error?: string } {
  const clean = (rg || '').replace(/[^0-9xX]/g, '');

  if (!clean) {
    return { valid: false, error: 'RG é obrigatório' };
  }

  if (clean.length < 7) {
    return { 
      valid: false, 
      error: `RG incompleto (${clean.length} dígitos). Deve conter no mínimo 7 dígitos.` 
    };
  }

  if (clean.length > 12) {
    return { 
      valid: false, 
      error: 'RG ultrapassa o limite de 12 caracteres numéricos.' 
    };
  }

  return { valid: true };
}

// ----------------------------------------------------
// TELEFONE E DDD: Formatação, Normativa Anatel e DDD
// ----------------------------------------------------

/**
 * Formata Telefone no padrão brasileiro (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Valida o Telefone brasileiro verificando DDD real e tamanho (10 ou 11 dígitos)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string; ddd?: string } {
  const clean = (phone || '').replace(/\D/g, '');

  if (!clean) {
    return { valid: false, error: 'Telefone é obrigatório' };
  }

  if (clean.length < 10) {
    return { 
      valid: false, 
      error: `Telefone incompleto (${clean.length} dígitos). Informe o DDD + número (10 ou 11 dígitos).` 
    };
  }

  if (clean.length > 11) {
    return { valid: false, error: 'Telefone não pode ter mais de 11 dígitos' };
  }

  const ddd = clean.slice(0, 2);
  if (!VALID_DDD_SET.has(ddd)) {
    return { 
      valid: false, 
      error: `DDD "${ddd}" não é válido no Brasil. Verifique o código de área informado.`,
      ddd
    };
  }

  // Se tiver 11 dígitos (celular), o nono dígito (posição 2) deve ser 9
  if (clean.length === 11 && clean.charAt(2) !== '9') {
    return { 
      valid: false, 
      error: `Celular com 11 dígitos deve iniciar com o dígito 9 após o DDD (${ddd} 9...).`,
      ddd
    };
  }

  return { valid: true, ddd };
}

/**
 * Retorna informações do DDD selecionado
 */
export function getDddInfo(ddd: string): DddStateInfo | undefined {
  const cleanDdd = (ddd || '').replace(/\D/g, '').slice(0, 2);
  return BRAZIL_DDDS.find(d => d.ddd === cleanDdd);
}
