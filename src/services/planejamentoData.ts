// Planning Secretariat Types & Service
export interface StrategicPlan {
  id: string;
  title: string;
  year: string;
  type: 'Anual' | 'Plurianual';
  objective: string;
  description: string;
  responsible: string;
  deadline: string;
  status: 'Planejado' | 'Em andamento' | 'Concluído' | 'Suspenso' | 'Cancelado';
  obs?: string;
}

export interface Goal {
  id: string;
  name: string;
  coordination: string;
  description: string;
  startDate: string;
  endDate: string;
  successIndicator: string;
  progress: number; // 0 to 100
  status: 'Planejada' | 'Em Execuição' | 'Concluída' | 'Atrasada' | 'Cancelada';
}

export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
  assignedTo: string;
  deadline: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coordinator: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'Planejamento' | 'Em Execuição' | 'Concluído' | 'Cancelado';
  team: string[];
  tasks: ProjectTask[];
}

export interface CoordActivity {
  id: string;
  coordination: string;
  description: string;
  responsible: string;
  date: string;
  status: 'Pendente' | 'Em andamento' | 'Realizado' | 'Cancelado';
  resultado?: string;
}

export interface PlanningEvent {
  id: string;
  name: string;
  type: 'Reunião' | 'Curso' | 'Palestra' | 'Campanha' | 'Evento';
  date: string; // YYYY-MM-DD
  time: string;
  coordination: string;
  location: string;
  obs?: string;
}

export interface MeetingMinutes {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  agenda: string;
  decisions: string;
  actions: {
    id: string;
    text: string;
    responsible: string;
    deadline: string;
    done: boolean;
  }[];
}

export interface PlanningDocument {
  id: string;
  name: string;
  category: 'Plano Anual' | 'Planejamento Estratégico' | 'Cronograma' | 'Projeto' | 'Relatório' | 'Diretrizes';
  date: string;
  responsible: string;
  size: string;
}

export interface IntersectorDemand {
  id: string;
  title: string;
  fromCoord: string;
  toCoord: string;
  description: string;
  deadline: string;
  status: 'Aberta' | 'Aceita' | 'Recusada' | 'Concluída';
  answer?: string;
  date: string;
}

export const COORDINATIONS = [
  'Estudos',
  'Doutrinária',
  'Comunicação',
  'Arte Espírita',
  'Mediúnica',
  'Passe / Fluidoterapia',
  'Ação Social',
  'Evangelização Infantil',
  'Mocidade / Juventude',
  'Patrimônio',
  'Presidência',
  'Financeiro'
];

// Initial pre-seeded data for a highly professional feel
const initialPlans: StrategicPlan[] = [
  {
    id: 'pl_1',
    title: 'Plano Anual 2026: Consolidação e Fraternidade',
    year: '2026',
    type: 'Anual',
    objective: 'Fortalecer a integração entre todos os setores e consolidar as fichas cadastrais fraternas.',
    description: 'Foco na unificação digital dos cadastros, formação pedagógica contínua de evangelizadores e expansão do passe domiciliar.',
    responsible: 'Secretaria de Planejamento',
    deadline: '2026-12-31',
    status: 'Em andamento',
    obs: 'Revisado bimestralmente com a coordenação de Ação Social e Estudos.'
  },
  {
    id: 'pl_2',
    title: 'Plano Plurianual Centenário: 210 Anos de Kardec',
    year: '2024-2027',
    type: 'Plurianual',
    objective: 'Reforma de estruturas físicas básicas e ampliação de mídias digitais.',
    description: 'Adaptação do telhado principal para energia fotovoltaica e reestruturação do anexo infantil da casa.',
    responsible: 'Patrimônio / Comunicação',
    deadline: '2027-06-30',
    status: 'Planejado',
    obs: 'Dependente de campanhas adicionais de caridade para captação de recursos.'
  },
  {
    id: 'pl_3',
    title: 'Campanha Permanente de Acolhimento Fraterno',
    year: '2026',
    type: 'Anual',
    objective: 'Otimizar o fluxo de triagem e encaminhamento espiritual da casa.',
    description: 'Alinhamento metodológico das equipes de passe, fluidoterapia e reuniões de desobsessão.',
    responsible: 'Doutrinária / Passe',
    deadline: '2026-10-31',
    status: 'Concluído',
    obs: 'Fluxo implementado com sucesso na recepção principal.'
  }
];

const initialGoals: Goal[] = [
  {
    id: 'go_1',
    name: 'Unificar Cadastro Social no Sistema',
    coordination: 'Ação Social',
    description: 'Migrar as fichas físicas de 150 famílias assistidas para o cadastro eletrônico.',
    startDate: '2026-01-10',
    endDate: '2026-07-31',
    successIndicator: '100% das famílias com prontuário digital e carteirinha emitida.',
    progress: 75,
    status: 'Em Execuição'
  },
  {
    id: 'go_2',
    name: 'Atualização do Livro Digital de Atas',
    coordination: 'Estudos',
    description: 'Implementar e registrar todas as atas de planejamento pedagógico de forma digital na biblioteca.',
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    successIndicator: 'Atas mensais arquivadas eletronicamente na pasta compartilhada.',
    progress: 100,
    status: 'Concluída'
  },
  {
    id: 'go_3',
    name: 'Formação Pedagógica de Evangelizadores',
    coordination: 'Evangelização Infantil',
    description: 'Promover encontros de reciclagem para 15 novos voluntários sobre dinâmicas lúdicas kardequianas.',
    startDate: '2026-03-05',
    endDate: '2026-08-20',
    successIndicator: 'Mínimo de 80% de presença nas oficinas registradas.',
    progress: 45,
    status: 'Em Execuição'
  },
  {
    id: 'go_4',
    name: 'Cobertura Integral do Telhado Principal',
    coordination: 'Patrimônio',
    description: 'Conserto dos vazamentos crônicos nas salas de passe e fluidoterapia.',
    startDate: '2026-05-15',
    endDate: '2026-06-30',
    successIndicator: 'Obra concluída e testada sob chuvas pesadas.',
    progress: 90,
    status: 'Em Execuição'
  },
  {
    id: 'go_5',
    name: 'Ampliação Audiovisual de Estudos Doutrinários',
    coordination: 'Comunicação',
    description: 'Criar e publicar 12 novos podcasts e estudos em áudio sobre "O Livro dos Espíritos".',
    startDate: '2026-02-15',
    endDate: '2026-11-30',
    successIndicator: '12 episódios disponíveis nas redes da Comunicação.',
    progress: 30,
    status: 'Em Execuição'
  }
];

const initialProjects: Project[] = [
  {
    id: 'pr_1',
    name: 'Feira do Livro Espírita 2026',
    description: 'Grande feira integrada no saguão externo para divulgação de obras doutrinárias e livros infantis rústicos, com renda 100% voltada ao Bazar Solidário.',
    coordinator: 'Comunicação',
    startDate: '2026-06-05',
    endDate: '2026-06-25',
    budget: 4500.00,
    status: 'Em Execuição',
    team: ['Ana Paula (Mídias)', 'Jorge S. (Logística)', 'Clara M. (Vendas)'],
    tasks: [
      { id: 't_1', text: 'Selecionar catálogo de obras com desconto da editora espírita', done: true, assignedTo: 'Clara M.', deadline: '2026-06-10' },
      { id: 't_2', text: 'Montar banners de divulgação física e criar cards virtuais', done: true, assignedTo: 'Ana Paula', deadline: '2026-06-12' },
      { id: 't_3', text: 'Montagem dos estandes físicos no Mirante externo', done: false, assignedTo: 'Jorge S.', deadline: '2026-06-18' },
      { id: 't_4', text: 'Coordenar escala de voluntários plantonistas para vendas', done: false, assignedTo: 'Clara M.', deadline: '2026-06-22' }
    ]
  },
  {
    id: 'pr_2',
    name: 'Congresso Espírita de Inverno de Junho',
    description: 'Simpósio acolhedor com expositores renomados sobre "Espiritismo Prático e a Saúde Emocional no Século XXI".',
    coordinator: 'Doutrinária',
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    budget: 3200.00,
    status: 'Em Execuição',
    team: ['Haroldo D. (Orador)', 'Maria Helena (Secretaria)', 'Roberto T. (Som)'],
    tasks: [
      { id: 'tc_1', text: 'Confirmação do roteiro e temas dos palestrantes convidados', done: true, assignedTo: 'Maria Helena', deadline: '2026-06-08' },
      { id: 'tc_2', text: 'Verificar acústica e testes de áudio dos microfones do palco', done: true, assignedTo: 'Roberto T.', deadline: '2026-06-12' },
      { id: 'tc_3', text: 'Preparar lembrancinhas artesanais infantis e kit de boas-vindas', done: false, assignedTo: 'Maria Helena', deadline: '2026-06-14' },
      { id: 'tc_4', text: 'Reunião geral com a equipe de passistas apoiadores do evento', done: false, assignedTo: 'Haroldo D.', deadline: '2026-06-16' }
    ]
  },
  {
    id: 'pr_3',
    name: 'Mutirão Reforma e Acessibilidade rústica das Salas',
    description: 'Renovação do assoalho de madeira e rampa de acessibilidade fraterna na área de atendimentos da Ação Social.',
    coordinator: 'Patrimônio',
    startDate: '2026-07-01',
    endDate: '2026-07-25',
    budget: 15000.00,
    status: 'Planejamento',
    team: ['Maurício K. (Mestre Obras)', 'Fabrício (Apoio)', 'Elena R. (Compras)'],
    tasks: [
      { id: 'tr_1', text: 'Licitação e cotação de madeiras tratadas e cimento', done: true, assignedTo: 'Elena R.', deadline: '2026-06-15' },
      { id: 'tr_2', text: 'Definição da escala de trabalhadores voluntários para o mutirão', done: false, assignedTo: 'Maurício K.', deadline: '2026-06-28' },
      { id: 'tr_3', text: 'Execução e nivelamento da rampa frontal', done: false, assignedTo: 'Fabrício', deadline: '2026-07-10' }
    ]
  }
];

const initialActivities: CoordActivity[] = [
  {
    id: 'ac_1',
    coordination: 'Ação Social',
    description: 'Organizar arrecadação extraordinária de cobertores e mantas de inverno devido à frente fria.',
    responsible: 'Jorge Solano',
    date: '2026-06-12',
    status: 'Realizado',
    resultado: '450 peças coletadas e em triagem para entrega rápida nas comunidades próximas.'
  },
  {
    id: 'ac_2',
    coordination: 'Estudos',
    description: 'Encontro integrado de encerramento do primeiro ciclo sobre "O Livro dos Médiuns".',
    responsible: 'Profa. Cecília Brandão',
    date: '2026-06-28',
    status: 'Em andamento'
  },
  {
    id: 'ac_3',
    coordination: 'Arte Espírita',
    description: 'Ensaiar Coro e Peça Teatral Rápida de Boas-vindas para o Congresso de Inverno.',
    responsible: 'Renato Mendes',
    date: '2026-06-14',
    status: 'Em andamento'
  },
  {
    id: 'ac_4',
    coordination: 'Passe / Fluidoterapia',
    description: 'Mutirão de palestras rápidas no saguão sobre a água fluidificada e bem-estar do magnetismo.',
    responsible: 'Dra. Sandra Torres',
    date: '2026-07-05',
    status: 'Pendente'
  }
];

const initialEvents: PlanningEvent[] = [
  {
    id: 'ev_1',
    name: 'Congresso Espírita 2026 - Abertura Oficial',
    type: 'Evento',
    date: '2026-06-15',
    time: '19:30',
    coordination: 'Doutrinária',
    location: 'Salão Principal (Estrela da Manhã)',
    obs: 'Capacidade máxima para 250 convidados. Transmissão online.'
  },
  {
    id: 'ev_2',
    name: 'Reunião Geral da Secretaria de Planejamento',
    type: 'Reunião',
    date: '2026-06-18',
    time: '15:00',
    coordination: 'Presidência',
    location: 'Sala de Conferências 1',
    obs: 'Pauta principal: Avaliação do andamento das metas do primeiro semestre.'
  },
  {
    id: 'ev_3',
    name: 'Curso de Treinamento Geral LGPD & Fichas Sociais',
    type: 'Curso',
    date: '2026-06-22',
    time: '14:00',
    coordination: 'Estudos',
    location: 'Sala Vermelha (Kardec)',
    obs: 'Obrigatório para todos os digitadores e voluntários da Ação Social.'
  },
  {
    id: 'ev_4',
    name: 'Feira do Livro Espírita - Dia de Autores Locais',
    type: 'Campanha',
    date: '2026-06-25',
    time: '09:00',
    coordination: 'Comunicação',
    location: 'Saguão Externo',
    obs: 'Arrecadação voltada à compra de cestas básicas.'
  }
];

const initialMeetings: MeetingMinutes[] = [
  {
    id: 'me_1',
    title: 'Ata de Planejamento Integrado do 1º Trimestre',
    date: '2026-06-05',
    time: '14:30',
    participants: ['Carlos Almeida (Presidente)', 'Helena Santos (Planejamento)', 'Jorge Solano (Ação Social)', 'Sandra Torres (Passe)'],
    agenda: 'Pauta da reunião: 1) Balanço das famílias atendidas; 2) Orçamento da Feira do Livro; 3) Escala de passistas para o Congresso de Inverno.',
    decisions: 'Decisões tomadas: 1) Aprovado teto de R$ 4.500 para a Feira do Livro sob supervisão direta da Comunicação; 2) Ampliar o mutirão de cobertores para Junho devido ao inverno intenso; 3) Registrar as atas na nuvem do sistema.',
    actions: [
      { id: 'act_1', text: 'Obter cotação final de cobertores com fornecedores locais', responsible: 'Jorge Solano', deadline: '2026-06-10', done: true },
      { id: 'act_2', text: 'Criar escala dos plantões dos passistas para o Congresso', responsible: 'Sandra Torres', deadline: '2026-06-12', done: true },
      { id: 'act_3', text: 'Publicar folders promocionais da Feira do Livro', responsible: 'Helena Santos', deadline: '2026-06-14', done: false }
    ]
  }
];

const initialDocuments: PlanningDocument[] = [
  {
    id: 'doc_1',
    name: 'Diretrizes_Planejamento_Estrategico_2026.pdf',
    category: 'Planejamento Estratégico',
    date: '2026-01-05',
    responsible: 'Secretaria de Planejamento',
    size: '1.4 MB'
  },
  {
    id: 'doc_2',
    name: 'Plano_Diretor_Reformas_Estruturais_Cemil.pdf',
    category: 'Cronograma',
    date: '2026-03-12',
    responsible: 'Patrimônio',
    size: '2.8 MB'
  },
  {
    id: 'doc_3',
    name: 'Manual_Boas_Praticas_Acao_Social.pdf',
    category: 'Diretrizes',
    date: '2026-05-18',
    responsible: 'Ação Social',
    size: '850 KB'
  }
];

const initialDemands: IntersectorDemand[] = [
  {
    id: 'dem_1',
    title: 'Artes no Congresso Espírita de Inverno',
    fromCoord: 'Juventude',
    toCoord: 'Arte Espírita',
    description: 'Solicitação de uma apresentação musical de coral de jovens para a abertura da conferência de Haroldo Dutra.',
    deadline: '2026-06-15',
    status: 'Aceita',
    answer: 'Já iniciamos o ensaio de duas músicas de harmonia espírita. Teremos 12 jovens no palco.',
    date: '2026-06-05'
  },
  {
    id: 'dem_2',
    title: 'Design de Post de Mídias Sociais para Doações',
    fromCoord: 'Ação Social',
    toCoord: 'Comunicação',
    description: 'Confecção de artes rústicas de apelo visual para a campanha de agasalhos e cobertores de inverno.',
    deadline: '2026-06-11',
    status: 'Concluída',
    answer: 'Postagens publicadas dia 09/06. Curtidas e engajamento acima da média.',
    date: '2026-06-08'
  },
  {
    id: 'dem_3',
    title: 'Adequação da Sala de Estudos Vermelha para Crianças',
    fromCoord: 'Evangelização Infantil',
    toCoord: 'Patrimônio',
    description: 'Solicitação de lousa móvel e tapetes de Eva macios para dinâmicas infantis de domingo.',
    deadline: '2026-06-25',
    status: 'Aberta',
    date: '2026-06-10'
  }
];

class PlanejamentoDataService {
  private getStorage<T>(key: string, initial: T[]): T[] {
    const data = localStorage.getItem(`plan_${key}`);
    if (!data) {
      localStorage.setItem(`plan_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  private saveStorage<T>(key: string, data: T[]) {
    localStorage.setItem(`plan_${key}`, JSON.stringify(data));
  }

  // Strategic Plans
  getPlans(): StrategicPlan[] {
    return this.getStorage('plans', initialPlans);
  }
  savePlans(data: StrategicPlan[]) {
    this.saveStorage('plans', data);
  }

  // Goals
  getGoals(): Goal[] {
    return this.getStorage('goals', initialGoals);
  }
  saveGoals(data: Goal[]) {
    this.saveStorage('goals', data);
  }

  // Projects
  getProjects(): Project[] {
    return this.getStorage('projects', initialProjects);
  }
  saveProjects(data: Project[]) {
    this.saveStorage('projects', data);
  }

  // Activities
  getActivities(): CoordActivity[] {
    return this.getStorage('activities', initialActivities);
  }
  saveActivities(data: CoordActivity[]) {
    this.saveStorage('activities', data);
  }

  // Events
  getEvents(): PlanningEvent[] {
    return this.getStorage('events', initialEvents);
  }
  saveEvents(data: PlanningEvent[]) {
    this.saveStorage('events', data);
  }

  // Meetings
  getMeetings(): MeetingMinutes[] {
    return this.getStorage('meetings', initialMeetings);
  }
  saveMeetings(data: MeetingMinutes[]) {
    this.saveStorage('meetings', data);
  }

  // Documents
  getDocuments(): PlanningDocument[] {
    return this.getStorage('documents', initialDocuments);
  }
  saveDocuments(data: PlanningDocument[]) {
    this.saveStorage('documents', data);
  }

  // Demands
  getDemands(): IntersectorDemand[] {
    return this.getStorage('demands', initialDemands);
  }
  saveDemands(data: IntersectorDemand[]) {
    this.saveStorage('demands', data);
  }
}

export const planejamentoService = new PlanejamentoDataService();
