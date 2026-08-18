import { dataService } from './dataService';
import { Audiobook, AudioPurchase, AudiobookProgress, AudioTrack } from '../types';

export type { Audiobook, AudioPurchase, AudiobookProgress, AudioTrack };

// Initial high-quality pre-seeded audiobooks
export const DEFAULT_AUDIOBOOKS: Audiobook[] = [
  {
    id: 'ab_01',
    title: 'O Caminho do Autoconhecimento e Reforma Íntima',
    author: 'Equipe de Ensino Cemil',
    narrator: 'Francisco Xavier (In memoriam / Sintetizado)',
    description: 'Um guia prático sobre passos diários para autoconsciência, tolerância e elevação da alma. Dividido em capítulos com meditações guiadas e ensinamentos fraternos.',
    coverUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    price: 34.90,
    category: 'Autoconhecimento',
    duration: '2h 10m',
    rating: 4.9,
    tracks: [
      { id: 'ab_01_tr01', title: 'Introdução e Sintonização', duration: '03:15', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
      { id: 'ab_01_tr02', title: 'Capítulo 1: Identificando nossas fraquezas', duration: '12:40', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
      { id: 'ab_01_tr03', title: 'Capítulo 2: Paciência ativa no lar', duration: '15:20', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
      { id: 'ab_01_tr04', title: 'Meditação: Banho de Luz e Cura', duration: '20:00', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
    ]
  },
  {
    id: 'ab_02',
    title: 'Evangelho no Lar: Áudios e Sintonizações Fraternas',
    author: 'Mirante de Luz',
    narrator: 'Maria de Souza',
    description: 'Leituras comentadas do evangelho com preces de abertura e encerramento para iluminar seu ambiente doméstico. Ideal para sintonizar a casa semanalmente.',
    coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    price: 19.90,
    category: 'Espiritualidade',
    duration: '3h 40m',
    rating: 4.8,
    tracks: [
      { id: 'ab_02_tr01', title: 'Prece de Abertura e Proteção', duration: '05:10', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
      { id: 'ab_02_tr02', title: 'Evangelho: Capítulo 5 - Bem-aventurados os Aflitos', duration: '22:30', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
      { id: 'ab_02_tr03', title: 'Mensagem de Emanuel: No Portal da Esperança', duration: '18:50', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
      { id: 'ab_02_tr04', title: 'Vibração Fraterna e Fluidificação da Água', duration: '11:45', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' }
    ]
  },
  {
    id: 'ab_03',
    title: 'Meditações Diárias para Sintonização de Paz',
    author: 'Coletânea Mirante',
    narrator: 'Carlos Oliveira',
    description: 'Série de 7 áudios (um para cada dia da semana) de respiração consciente, ancoramento emocional e renovação de energias após jornadas de trabalho desafiadoras.',
    coverUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80',
    price: 24.90,
    category: 'Meditação',
    duration: '1h 45m',
    rating: 5.0,
    tracks: [
      { id: 'ab_03_tr01', title: 'Segunda-Feira: Renovação Mental', duration: '15:00', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
      { id: 'ab_03_tr02', title: 'Terça-Feira: Expansão da Categoria de Amor', duration: '15:00', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
      { id: 'ab_03_tr03', title: 'Quarta-Feira: Liberação de Vínculos Pesados', duration: '15:00', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
      { id: 'ab_03_tr04', title: 'Quinta-Feira: Fluidificação e Sopro de Vida', duration: '15:00', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' }
    ]
  },
  {
    id: 'ab_04',
    title: 'Parábolas e Histórias Infantis com Moral Cristã',
    author: 'Departamento da Infância Cemil',
    narrator: 'Tia Clarice',
    description: 'Lindo acervo de curtas narrativas teatrais em áudio que ensinam virtudes como caridade, fraternidade, perdão e cooperação mútuas para os pequeninos.',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    price: 29.90,
    category: 'Infantil',
    duration: '2h 15m',
    rating: 4.7,
    tracks: [
      { id: 'ab_04_tr01', title: 'O Pequeno Cego e a Luz da Estrela', duration: '12:10', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
      { id: 'ab_04_tr02', title: 'O Segredo da Fonte de Água Viva', duration: '14:40', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
      { id: 'ab_04_tr03', title: 'Fraternityópolis: Uma Cidade Unida', duration: '18:15', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' }
    ]
  }
];

class AudiobooksService {
  getAudiobooks(): Audiobook[] {
    const saved = localStorage.getItem('cemil_audiobooks');
    if (!saved) {
      localStorage.setItem('cemil_audiobooks', JSON.stringify(DEFAULT_AUDIOBOOKS));
      return DEFAULT_AUDIOBOOKS;
    }
    return JSON.parse(saved);
  }

  saveAudiobooks(list: Audiobook[]) {
    localStorage.setItem('cemil_audiobooks', JSON.stringify(list));
  }

  getPurchases(): AudioPurchase[] {
    const saved = localStorage.getItem('cemil_audio_purchases');
    return saved ? JSON.parse(saved) : [];
  }

  savePurchases(list: AudioPurchase[]) {
    localStorage.setItem('cemil_audio_purchases', JSON.stringify(list));
  }

  // Check if a user has purchased an audiobook
  isPurchased(userEmail: string, audiobookId: string, purchasesList?: AudioPurchase[]): boolean {
    const list = purchasesList || this.getPurchases();
    return list.some(p => p.userEmail === userEmail && p.audiobookId === audiobookId && p.status === 'APROVADO');
  }

  // Create a pending purchase
  createPurchase(userEmail: string, audiobookId: string, amount: number, method: 'PIX' | 'CREDIT_CARD'): AudioPurchase {
    const list = this.getPurchases();
    
    // Generate Pix Code & simulate QR Code
    let pixCode = '';
    let pixQrCode = '';
    if (method === 'PIX') {
      pixCode = `00020101021226850014br.gov.pix0143carlostecal35@gmail.com5204000053039865405${amount.toFixed(2)}5802BR5913MIRANTELUZ6009SAOPAULO62070503***6304`;
      pixQrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(pixCode);
    }

    const purchase: AudioPurchase = {
      id: `pur_${Date.now()}`,
      audiobookId,
      userEmail,
      purchaseDate: new Date().toISOString(),
      amountPaid: amount,
      paymentMethod: method,
      status: 'PENDENTE',
      pixCode,
      pixQrCode
    };

    list.push(purchase);
    this.savePurchases(list);

    // Save to Firestore asynchronously
    dataService.createAudioPurchase(purchase).catch(err => {
      console.warn('Failed to sync audio purchase to Firestore:', err);
    });

    return purchase;
  }

  // Approve a payment (Simulates webhook or real-time check)
  approvePurchase(purchaseId: string, purchasesList?: AudioPurchase[], audiobooksList?: Audiobook[]) {
    const list = purchasesList || this.getPurchases();
    const purchase = list.find(p => p.id === purchaseId);
    if (purchase) {
      purchase.status = 'APROVADO';
      this.savePurchases(list);

      const book = (audiobooksList || DEFAULT_AUDIOBOOKS).find(b => b.id === purchase.audiobookId);

      // Sync to Firestore and register Financial Entry
      dataService.updateAudioPurchaseStatus(purchaseId, 'APROVADO', purchase, book?.title).catch(err => {
        console.warn('Failed to update purchase status in Firestore:', err);
      });
    }
  }

  // Delete/Cancel purchase
  cancelPurchase(purchaseId: string, purchasesList?: AudioPurchase[]) {
    const list = purchasesList || this.getPurchases();
    const purchase = list.find(p => p.id === purchaseId);
    if (purchase) {
      purchase.status = 'CANCELADO';
      this.savePurchases(list);

      dataService.updateAudioPurchaseStatus(purchaseId, 'CANCELADO').catch(err => {
        console.warn('Failed to cancel purchase in Firestore:', err);
      });
    }
  }
}

export const audiobooksService = new AudiobooksService();
