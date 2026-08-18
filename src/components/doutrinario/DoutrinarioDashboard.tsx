import React, { useState, useEffect } from 'react';
import { 
  DoutrinarioHeader, 
  DoutrinarioTabType 
} from './DoutrinarioHeader';
import { MesaDirigenteTab } from './MesaDirigenteTab';
import { CronogramaTab } from './CronogramaTab';
import { ExpositoresTab } from './ExpositoresTab';
import { BibliotecaTab } from './BibliotecaTab';
import { PerguntasTab } from './PerguntasTab';
import { RoteirosTab } from './RoteirosTab';
import { 
  DoutrinarioPalestra, 
  DoutrinarioExpositor, 
  DoutrinarioMaterial, 
  DoutrinarioEmprestimoLivro, 
  DoutrinarioPergunta, 
  DoutrinarioRoteiro 
} from '../../types';
import { dataService } from '../../services/dataService';

// Default initial starter seed if collections are empty
const INITIAL_PALESTRAS: Omit<DoutrinarioPalestra, 'id'>[] = [
  {
    title: 'O Consolador Prometido e a Esperança Cristã',
    bookReference: 'O Evangelho Segundo o Espiritismo - Cap. VI, itens 1 a 8',
    speakerName: 'Dr. Carlos Alberto',
    speakerIsGuest: false,
    date: new Date().toISOString().split('T')[0],
    time: '19:30',
    status: 'CONFIRMADA',
    attendanceCount: 42,
    themeCategory: 'EVANGELHO',
    createdAt: Date.now()
  },
  {
    title: 'Causas Atuais e Anteriores das Aflições',
    bookReference: 'O Evangelho Segundo o Espiritismo - Cap. V, itens 1 a 10',
    speakerName: 'Maria Helena Santos',
    speakerIsGuest: true,
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '19:30',
    status: 'PREVISTA',
    attendanceCount: 0,
    themeCategory: 'EVANGELHO',
    createdAt: Date.now()
  }
];

const INITIAL_EXPOSITORES: Omit<DoutrinarioExpositor, 'id'>[] = [
  {
    name: 'Dr. Carlos Alberto',
    email: 'carlos.alberto@espirita.org.br',
    phone: '(11) 98888-1111',
    type: 'INTERNO',
    centerOrigin: 'Centro Espírita Atual',
    status: 'ATIVO',
    specialtyThemes: ['O Evangelho Segundo o Espiritismo', 'O Livro dos Espíritos', 'Reforma Íntima'],
    availabilities: ['Quarta-feira 19h30', 'Domingo 09h'],
    termAccepted: true,
    termAcceptedDate: '2025-01-10'
  },
  {
    name: 'Maria Helena Santos',
    email: 'maria.helena@alianca.org.br',
    phone: '(11) 97777-2222',
    type: 'CONVIDADO_EXTERNO',
    centerOrigin: 'Sociedade Espírita Caminho da Luz',
    status: 'ATIVO',
    specialtyThemes: ['Família e Reencarnação', 'Educação dos Sentimentos', 'Perdão'],
    availabilities: ['Sexta-feira 20h', 'Domingo 18h'],
    termAccepted: true,
    termAcceptedDate: '2025-01-15'
  },
  {
    name: 'Roberto Guimarães (Plantão)',
    email: 'roberto.plantao@espirita.org.br',
    phone: '(11) 96666-3333',
    type: 'INTERNO',
    centerOrigin: 'Centro Espírita Atual',
    status: 'PLANTAO_EMERGENCIA',
    specialtyThemes: ['Temas Gerais do Evangelho', 'Leis Morais', 'Prece e Fluidoterapia'],
    availabilities: ['Disponibilidade Imediata'],
    termAccepted: true,
    termAcceptedDate: '2025-01-05'
  }
];

const INITIAL_MATERIAIS: Omit<DoutrinarioMaterial, 'id'>[] = [
  {
    name: 'O Evangelho Segundo o Espiritismo',
    author: 'Allan Kardec',
    type: 'LIVRO',
    category: 'OBRAS_BASICAS',
    totalCopies: 6,
    availableCopies: 5,
    observations: 'Edição FEB - Tradução Guillon Ribeiro'
  },
  {
    name: 'O Livro dos Espíritos',
    author: 'Allan Kardec',
    type: 'LIVRO',
    category: 'OBRAS_BASICAS',
    totalCopies: 5,
    availableCopies: 4,
    observations: 'Filosofia e Princípios Fundamentais'
  },
  {
    name: 'O Livro dos Médiuns',
    author: 'Allan Kardec',
    type: 'LIVRO',
    category: 'MEDIUNIDADE',
    totalCopies: 4,
    availableCopies: 3,
    observations: 'Guia dos Médiuns e dos Evocadores'
  },
  {
    name: 'Nosso Lar',
    author: 'Francisco Cândido Xavier / André Luiz',
    type: 'LIVRO',
    category: 'REFORMA_INTIMA',
    totalCopies: 4,
    availableCopies: 3,
    observations: 'Série A Vida no Mundo Espiritual'
  }
];

const INITIAL_PERGUNTAS: Omit<DoutrinarioPergunta, 'id'>[] = [
  {
    meetingDate: new Date().toISOString().split('T')[0],
    palestraTitle: 'O Consolador Prometido e a Esperança Cristã',
    questionText: 'Como o Espiritismo explica a dor e o sofrimento nas crianças pequenas?',
    askerName: 'Frequentador da Reunião',
    answerText: 'O Espiritismo esclarece através da reencarnação e da pluralidade das existências (O Livro dos Espíritos, q. 197 a 202) que a alma não é criada no nascimento do corpo físico; traz consigo experiências e necessidades de aprendizado de vidas pretéritas.',
    answeredBy: 'Dr. Carlos Alberto',
    doctrinalRef: 'O Evangelho Segundo o Espiritismo - Cap. V, item 6',
    status: 'RESPONDIDA',
    createdAt: Date.now()
  }
];

export const DoutrinarioDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DoutrinarioTabType>('MESA_AO_VIVO');
  const [isProjectorOpen, setIsProjectorOpen] = useState<boolean>(false);

  // Firestore Real-time States
  const [palestras, setPalestras] = useState<DoutrinarioPalestra[]>([]);
  const [expositores, setExpositores] = useState<DoutrinarioExpositor[]>([]);
  const [materiais, setMateriais] = useState<DoutrinarioMaterial[]>([]);
  const [emprestimos, setEmprestimos] = useState<DoutrinarioEmprestimoLivro[]>([]);
  const [perguntas, setPerguntas] = useState<DoutrinarioPergunta[]>([]);
  const [roteiros, setRoteiros] = useState<DoutrinarioRoteiro[]>([]);

  // Subscriptions
  useEffect(() => {
    const unsubPal = dataService.subscribeDoutrinarioPalestras((data) => {
      setPalestras(data);
      if (data.length === 0) {
        INITIAL_PALESTRAS.forEach(p => dataService.addDoutrinarioPalestra(p));
      }
    });

    const unsubExp = dataService.subscribeDoutrinarioExpositores((data) => {
      setExpositores(data);
      if (data.length === 0) {
        INITIAL_EXPOSITORES.forEach(e => dataService.addDoutrinarioExpositor(e));
      }
    });

    const unsubMat = dataService.subscribeDoutrinarioMateriais((data) => {
      setMateriais(data);
      if (data.length === 0) {
        INITIAL_MATERIAIS.forEach(m => dataService.addDoutrinarioMaterial(m));
      }
    });

    const unsubEmp = dataService.subscribeDoutrinarioEmprestimos((data) => {
      setEmprestimos(data);
    });

    const unsubPerg = dataService.subscribeDoutrinarioPerguntas((data) => {
      setPerguntas(data);
      if (data.length === 0) {
        INITIAL_PERGUNTAS.forEach(p => dataService.addDoutrinarioPergunta(p));
      }
    });

    const unsubRot = dataService.subscribeDoutrinarioRoteiros((data) => {
      setRoteiros(data);
    });

    return () => {
      unsubPal();
      unsubExp();
      unsubMat();
      unsubEmp();
      unsubPerg();
      unsubRot();
    };
  }, []);

  // Handlers for Palestras
  const handleSavePalestra = async (item: Omit<DoutrinarioPalestra, 'id'> | DoutrinarioPalestra) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioPalestra(item.id, item);
    } else {
      await dataService.addDoutrinarioPalestra(item);
    }
  };

  const handleDeletePalestra = async (id: string) => {
    await dataService.deleteDoutrinarioPalestra(id);
  };

  const handleUpdateStatus = async (id: string, status: DoutrinarioPalestra['status'], substituteName?: string) => {
    const updatePayload: Partial<DoutrinarioPalestra> = { status };
    if (substituteName) {
      updatePayload.substituteSpeakerName = substituteName;
    }
    await dataService.updateDoutrinarioPalestra(id, updatePayload);
  };

  // Handlers for Expositores
  const handleSaveExpositor = async (item: Omit<DoutrinarioExpositor, 'id'> | DoutrinarioExpositor) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioExpositor(item.id, item);
    } else {
      await dataService.addDoutrinarioExpositor(item);
    }
  };

  const handleDeleteExpositor = async (id: string) => {
    await dataService.deleteDoutrinarioExpositor(id);
  };

  // Handlers for Materiais / Biblioteca
  const handleSaveMaterial = async (item: Omit<DoutrinarioMaterial, 'id'> | DoutrinarioMaterial) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioMaterial(item.id, item);
    } else {
      await dataService.addDoutrinarioMaterial(item);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    await dataService.deleteDoutrinarioMaterial(id);
  };

  // Handlers for Emprestimos
  const handleSaveEmprestimo = async (item: Omit<DoutrinarioEmprestimoLivro, 'id'> | DoutrinarioEmprestimoLivro) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioEmprestimo(item.id, item);
    } else {
      await dataService.addDoutrinarioEmprestimo(item);
      // Decrement available copies
      const mat = materiais.find(m => m.id === item.bookId);
      if (mat && (mat.availableCopies || 0) > 0) {
        await dataService.updateDoutrinarioMaterial(mat.id, {
          availableCopies: (mat.availableCopies || 1) - 1
        });
      }
    }
  };

  const handleReturnEmprestimo = async (loanId: string, bookId: string) => {
    await dataService.updateDoutrinarioEmprestimo(loanId, {
      status: 'DEVOLVIDO',
      returnDate: new Date().toISOString().split('T')[0]
    });
    const mat = materiais.find(m => m.id === bookId);
    if (mat) {
      await dataService.updateDoutrinarioMaterial(mat.id, {
        availableCopies: Math.min((mat.totalCopies || 1), (mat.availableCopies || 0) + 1)
      });
    }
  };

  const handleRenewEmprestimo = async (loanId: string) => {
    const loan = emprestimos.find(e => e.id === loanId);
    if (!loan) return;
    const currentDue = new Date(loan.dueDate);
    const newDue = new Date(currentDue.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await dataService.updateDoutrinarioEmprestimo(loanId, {
      dueDate: newDue,
      status: 'RENOVADO'
    });
  };

  const handleDeleteEmprestimo = async (id: string) => {
    await dataService.deleteDoutrinarioEmprestimo(id);
  };

  // Handlers for Perguntas
  const handleSavePergunta = async (item: Omit<DoutrinarioPergunta, 'id'> | DoutrinarioPergunta) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioPergunta(item.id, item);
    } else {
      await dataService.addDoutrinarioPergunta(item);
    }
  };

  const handleDeletePergunta = async (id: string) => {
    await dataService.deleteDoutrinarioPergunta(id);
  };

  // Handlers for Roteiros
  const handleSaveRoteiro = async (item: Omit<DoutrinarioRoteiro, 'id'> | DoutrinarioRoteiro) => {
    if ('id' in item && item.id) {
      await dataService.updateDoutrinarioRoteiro(item.id, item);
    } else {
      await dataService.addDoutrinarioRoteiro(item);
    }
  };

  const handleDeleteRoteiro = async (id: string) => {
    await dataService.deleteDoutrinarioRoteiro(id);
  };

  // Current Palestra (Next or Today's)
  const currentPalestra = palestras.find(p => p.status === 'EM_ANDAMENTO') || palestras.find(p => p.status === 'CONFIRMADA') || palestras[0];

  // Counters
  const activeLoansCount = emprestimos.filter(e => e.status !== 'DEVOLVIDO').length;
  const overdueLoansCount = emprestimos.filter(e => e.status === 'ATRASADO').length;
  const pendingQuestionsCount = perguntas.filter(p => p.status === 'RECEBIDA').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-20">
      {/* 1. SECTOR HEADER & STATS */}
      <DoutrinarioHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        nextMeeting={currentPalestra}
        activeLoansCount={activeLoansCount}
        overdueLoansCount={overdueLoansCount}
        pendingQuestionsCount={pendingQuestionsCount}
        onOpenProjector={() => setIsProjectorOpen(true)}
      />

      {/* 2. TAB VIEWS */}
      {activeTab === 'MESA_AO_VIVO' && (
        <MesaDirigenteTab
          currentPalestra={currentPalestra}
          isProjectorOpen={isProjectorOpen}
          onCloseProjector={() => setIsProjectorOpen(false)}
          onOpenProjector={() => setIsProjectorOpen(true)}
        />
      )}

      {activeTab === 'CRONOGRAMA' && (
        <CronogramaTab
          palestras={palestras}
          expositores={expositores}
          onSavePalestra={handleSavePalestra}
          onDeletePalestra={handleDeletePalestra}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {activeTab === 'EXPOSITORES' && (
        <ExpositoresTab
          expositores={expositores}
          onSaveExpositor={handleSaveExpositor}
          onDeleteExpositor={handleDeleteExpositor}
        />
      )}

      {activeTab === 'BIBLIOTECA' && (
        <BibliotecaTab
          materiais={materiais}
          emprestimos={emprestimos}
          onSaveMaterial={handleSaveMaterial}
          onDeleteMaterial={handleDeleteMaterial}
          onSaveEmprestimo={handleSaveEmprestimo}
          onReturnEmprestimo={handleReturnEmprestimo}
          onRenewEmprestimo={handleRenewEmprestimo}
          onDeleteEmprestimo={handleDeleteEmprestimo}
        />
      )}

      {activeTab === 'PERGUNTAS' && (
        <PerguntasTab
          perguntas={perguntas}
          onSavePergunta={handleSavePergunta}
          onDeletePergunta={handleDeletePergunta}
        />
      )}

      {activeTab === 'ROTEIROS_DIRETRIZES' && (
        <RoteirosTab
          roteiros={roteiros}
          onSaveRoteiro={handleSaveRoteiro}
          onDeleteRoteiro={handleDeleteRoteiro}
        />
      )}
    </div>
  );
};
