import React from 'react';
import {
  HeartHandshake,
  Sparkles,
  BookOpen,
  Baby,
  Handshake,
  Shield,
  Building2,
  Package,
  Laptop,
  Wrench,
  Music,
  Megaphone,
  Layers,
  LucideIcon
} from 'lucide-react';
import { SectorType } from '../types';

export interface SectorTheme {
  id: string;
  name: string;
  icon: LucideIcon;
  badgeLabel: string;
  // Colors for styling
  bgLight: string;
  bgActive: string;
  text: string;
  textDark: string;
  border: string;
  borderHover: string;
  badgeBg: string;
  badgeText: string;
  gradient: string;
  gradientLight: string;
  shadow: string;
  accentColor: string;
  ring: string;
}

export const SECTOR_THEMES: Record<string, SectorTheme> = {
  FRATERNO: {
    id: 'FRATERNO',
    name: 'Atendimento Fraterno',
    icon: HeartHandshake,
    badgeLabel: 'Acolhimento & Fraterno',
    bgLight: 'bg-violet-50',
    bgActive: 'bg-violet-600 text-white',
    text: 'text-violet-600',
    textDark: 'text-violet-900',
    border: 'border-violet-150',
    borderHover: 'hover:border-violet-300',
    badgeBg: 'bg-violet-100/90 text-violet-800 border-violet-200',
    badgeText: 'text-violet-800',
    gradient: 'from-violet-600 to-indigo-600',
    gradientLight: 'from-violet-50/70 to-indigo-50/30',
    shadow: 'shadow-violet-500/10',
    accentColor: '#7c3aed',
    ring: 'focus:ring-violet-400'
  },
  PASSE: {
    id: 'PASSE',
    name: 'Passe & Fluidoterapia',
    icon: Sparkles,
    badgeLabel: 'Passe & Fluido',
    bgLight: 'bg-emerald-50',
    bgActive: 'bg-emerald-600 text-white',
    text: 'text-emerald-600',
    textDark: 'text-emerald-900',
    border: 'border-emerald-150',
    borderHover: 'hover:border-emerald-300',
    badgeBg: 'bg-emerald-100/90 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    gradient: 'from-emerald-600 to-teal-600',
    gradientLight: 'from-emerald-50/70 to-teal-50/30',
    shadow: 'shadow-emerald-500/10',
    accentColor: '#059669',
    ring: 'focus:ring-emerald-400'
  },
  ESTUDO: {
    id: 'ESTUDO',
    name: 'Estudos Doutrinários',
    icon: BookOpen,
    badgeLabel: 'Estudos & ESDE',
    bgLight: 'bg-sky-50',
    bgActive: 'bg-sky-600 text-white',
    text: 'text-sky-600',
    textDark: 'text-sky-900',
    border: 'border-sky-150',
    borderHover: 'hover:border-sky-300',
    badgeBg: 'bg-sky-100/90 text-sky-800 border-sky-200',
    badgeText: 'text-sky-800',
    gradient: 'from-sky-600 to-blue-600',
    gradientLight: 'from-sky-50/70 to-blue-50/30',
    shadow: 'shadow-sky-500/10',
    accentColor: '#0284c7',
    ring: 'focus:ring-sky-400'
  },
  DOUTRINARIA: {
    id: 'DOUTRINARIA',
    name: 'Doutrinária & Palestras',
    icon: BookOpen,
    badgeLabel: 'Palestras & Doutrina',
    bgLight: 'bg-blue-50',
    bgActive: 'bg-blue-600 text-white',
    text: 'text-blue-600',
    textDark: 'text-blue-900',
    border: 'border-blue-150',
    borderHover: 'hover:border-blue-300',
    badgeBg: 'bg-blue-100/90 text-blue-800 border-blue-200',
    badgeText: 'text-blue-800',
    gradient: 'from-blue-600 to-indigo-700',
    gradientLight: 'from-blue-50/70 to-indigo-50/30',
    shadow: 'shadow-blue-500/10',
    accentColor: '#2563eb',
    ring: 'focus:ring-blue-400'
  },
  INFANCIA: {
    id: 'INFANCIA',
    name: 'Infância & Juventude',
    icon: Baby,
    badgeLabel: 'Evangelização & Mocidade',
    bgLight: 'bg-amber-50',
    bgActive: 'bg-amber-500 text-white',
    text: 'text-amber-600',
    textDark: 'text-amber-900',
    border: 'border-amber-150',
    borderHover: 'hover:border-amber-300',
    badgeBg: 'bg-amber-100/90 text-amber-800 border-amber-200',
    badgeText: 'text-amber-800',
    gradient: 'from-amber-500 to-orange-500',
    gradientLight: 'from-amber-50/70 to-orange-50/30',
    shadow: 'shadow-amber-500/10',
    accentColor: '#d97706',
    ring: 'focus:ring-amber-400'
  },
  SOCIAL: {
    id: 'SOCIAL',
    name: 'Ação Social Espírita (SAPSE)',
    icon: Handshake,
    badgeLabel: 'Ação Social & SAPSE',
    bgLight: 'bg-rose-50',
    bgActive: 'bg-rose-600 text-white',
    text: 'text-rose-600',
    textDark: 'text-rose-900',
    border: 'border-rose-150',
    borderHover: 'hover:border-rose-300',
    badgeBg: 'bg-rose-100/90 text-rose-800 border-rose-200',
    badgeText: 'text-rose-800',
    gradient: 'from-rose-500 to-pink-600',
    gradientLight: 'from-rose-50/70 to-pink-50/30',
    shadow: 'shadow-rose-500/10',
    accentColor: '#e11d48',
    ring: 'focus:ring-rose-400'
  },
  MEDIUNICO: {
    id: 'MEDIUNICO',
    name: 'Coordenação Mediúnica',
    icon: Shield,
    badgeLabel: 'Mediúnico Privativo',
    bgLight: 'bg-purple-50',
    bgActive: 'bg-purple-600 text-white',
    text: 'text-purple-600',
    textDark: 'text-purple-900',
    border: 'border-purple-150',
    borderHover: 'hover:border-purple-300',
    badgeBg: 'bg-purple-100/90 text-purple-800 border-purple-200',
    badgeText: 'text-purple-800',
    gradient: 'from-purple-600 to-indigo-800',
    gradientLight: 'from-purple-50/70 to-indigo-50/30',
    shadow: 'shadow-purple-500/10',
    accentColor: '#9333ea',
    ring: 'focus:ring-purple-400'
  },
  ADMINISTRATIVO: {
    id: 'ADMINISTRATIVO',
    name: 'Administrativo & Diretoria',
    icon: Building2,
    badgeLabel: 'Administrativo & Finanças',
    bgLight: 'bg-slate-100',
    bgActive: 'bg-slate-800 text-white',
    text: 'text-slate-700',
    textDark: 'text-slate-900',
    border: 'border-slate-200',
    borderHover: 'hover:border-slate-400',
    badgeBg: 'bg-slate-200/90 text-slate-800 border-slate-300',
    badgeText: 'text-slate-800',
    gradient: 'from-slate-700 to-slate-900',
    gradientLight: 'from-slate-100 to-slate-200/50',
    shadow: 'shadow-slate-500/10',
    accentColor: '#334155',
    ring: 'focus:ring-slate-400'
  },
  PATRIMONIO: {
    id: 'PATRIMONIO',
    name: 'Patrimônio & Material',
    icon: Package,
    badgeLabel: 'Patrimônio & Estoque',
    bgLight: 'bg-orange-50',
    bgActive: 'bg-orange-600 text-white',
    text: 'text-orange-600',
    textDark: 'text-orange-900',
    border: 'border-orange-150',
    borderHover: 'hover:border-orange-300',
    badgeBg: 'bg-orange-100/90 text-orange-800 border-orange-200',
    badgeText: 'text-orange-800',
    gradient: 'from-orange-500 to-amber-600',
    gradientLight: 'from-orange-50/70 to-amber-50/30',
    shadow: 'shadow-orange-500/10',
    accentColor: '#ea580c',
    ring: 'focus:ring-orange-400'
  },
  TECNOLOGIA: {
    id: 'TECNOLOGIA',
    name: 'Tecnologia & Informática',
    icon: Laptop,
    badgeLabel: 'TI & Transmissão',
    bgLight: 'bg-indigo-50',
    bgActive: 'bg-indigo-600 text-white',
    text: 'text-indigo-600',
    textDark: 'text-indigo-900',
    border: 'border-indigo-150',
    borderHover: 'hover:border-indigo-300',
    badgeBg: 'bg-indigo-100/90 text-indigo-800 border-indigo-200',
    badgeText: 'text-indigo-800',
    gradient: 'from-indigo-600 to-blue-600',
    gradientLight: 'from-indigo-50/70 to-blue-50/30',
    shadow: 'shadow-indigo-500/10',
    accentColor: '#4f46e5',
    ring: 'focus:ring-indigo-400'
  },
  OBRAS: {
    id: 'OBRAS',
    name: 'Manutenções, Reformas & Obras',
    icon: Wrench,
    badgeLabel: 'Manutenções & Reformas',
    bgLight: 'bg-stone-100',
    bgActive: 'bg-stone-700 text-white',
    text: 'text-stone-700',
    textDark: 'text-stone-900',
    border: 'border-stone-200',
    borderHover: 'hover:border-stone-400',
    badgeBg: 'bg-stone-200/90 text-stone-800 border-stone-300',
    badgeText: 'text-stone-800',
    gradient: 'from-stone-600 to-stone-800',
    gradientLight: 'from-stone-100 to-stone-200/50',
    shadow: 'shadow-stone-500/10',
    accentColor: '#57534e',
    ring: 'focus:ring-stone-400'
  },
  ARTE: {
    id: 'ARTE',
    name: 'Arte Espírita (Coral & Música)',
    icon: Music,
    badgeLabel: 'Arte & Música',
    bgLight: 'bg-fuchsia-50',
    bgActive: 'bg-fuchsia-600 text-white',
    text: 'text-fuchsia-600',
    textDark: 'text-fuchsia-900',
    border: 'border-fuchsia-150',
    borderHover: 'hover:border-fuchsia-300',
    badgeBg: 'bg-fuchsia-100/90 text-fuchsia-800 border-fuchsia-200',
    badgeText: 'text-fuchsia-800',
    gradient: 'from-fuchsia-500 to-pink-600',
    gradientLight: 'from-fuchsia-50/70 to-pink-50/30',
    shadow: 'shadow-fuchsia-500/10',
    accentColor: '#c026d3',
    ring: 'focus:ring-fuchsia-400'
  },
  COMUNICACAO: {
    id: 'COMUNICACAO',
    name: 'Comunicação Social',
    icon: Megaphone,
    badgeLabel: 'Comunicação & Mídias',
    bgLight: 'bg-cyan-50',
    bgActive: 'bg-cyan-600 text-white',
    text: 'text-cyan-600',
    textDark: 'text-cyan-900',
    border: 'border-cyan-150',
    borderHover: 'hover:border-cyan-300',
    badgeBg: 'bg-cyan-100/90 text-cyan-800 border-cyan-200',
    badgeText: 'text-cyan-800',
    gradient: 'from-cyan-600 to-blue-600',
    gradientLight: 'from-cyan-50/70 to-blue-50/30',
    shadow: 'shadow-cyan-500/10',
    accentColor: '#0891b2',
    ring: 'focus:ring-cyan-400'
  },
  OUTROS: {
    id: 'OUTROS',
    name: 'Outros Setores',
    icon: Layers,
    badgeLabel: 'Geral',
    bgLight: 'bg-gray-100',
    bgActive: 'bg-gray-700 text-white',
    text: 'text-gray-600',
    textDark: 'text-gray-900',
    border: 'border-gray-200',
    borderHover: 'hover:border-gray-400',
    badgeBg: 'bg-gray-200 text-gray-700 border-gray-300',
    badgeText: 'text-gray-700',
    gradient: 'from-gray-600 to-gray-800',
    gradientLight: 'from-gray-50 to-gray-150',
    shadow: 'shadow-gray-500/10',
    accentColor: '#4b5563',
    ring: 'focus:ring-gray-400'
  }
};

/**
 * Resolves the theme for a sector based on its type or name.
 */
export function getSectorTheme(sectorType?: SectorType | string, sectorName?: string): SectorTheme {
  const normName = (sectorName || '').toLowerCase();
  const normType = (sectorType || '').toUpperCase();

  // 1. Direct match by specific sub-sector keywords
  if (normName.includes('fraterno') || normName.includes('acolhimento') || normType === 'FRATERNO') {
    return SECTOR_THEMES.FRATERNO;
  }
  if (normName.includes('passe') || normName.includes('fluido') || normType === 'PASSE') {
    return SECTOR_THEMES.PASSE;
  }
  if (normName.includes('doutrin') || normName.includes('palestra')) {
    return SECTOR_THEMES.DOUTRINARIA;
  }
  if (normName.includes('estudo') || normName.includes('esde') || normName.includes('eade') || normType === 'ESTUDO') {
    return SECTOR_THEMES.ESTUDO;
  }
  if (normName.includes('infânc') || normName.includes('mocidade') || normName.includes('evangeliz') || normType === 'INFANCIA') {
    return SECTOR_THEMES.INFANCIA;
  }
  if (normName.includes('social') || normName.includes('sapse') || normName.includes('cesta') || normName.includes('assistênc') || normType === 'SOCIAL') {
    return SECTOR_THEMES.SOCIAL;
  }
  if (normName.includes('mediun') || normName.includes('desobsess') || normType === 'MEDIUNICO') {
    return SECTOR_THEMES.MEDIUNICO;
  }
  if (normName.includes('arte') || normName.includes('música') || normName.includes('coral') || normName.includes('teatro')) {
    return SECTOR_THEMES.ARTE;
  }
  if (normName.includes('comunica') || normName.includes('mídia') || normName.includes('imprensa') || normName.includes('divulga')) {
    return SECTOR_THEMES.COMUNICACAO;
  }
  if (normName.includes('patrimôn') || normName.includes('material') || normName.includes('almoxarif')) {
    return SECTOR_THEMES.PATRIMONIO;
  }
  if (normName.includes('tecnolog') || normName.includes('informát') || normName.includes('ti') || normName.includes('transmiss')) {
    return SECTOR_THEMES.TECNOLOGIA;
  }
  if (normName.includes('obra') || normName.includes('reforma') || normName.includes('manuten')) {
    return SECTOR_THEMES.OBRAS;
  }
  if (normName.includes('admin') || normName.includes('secretar') || normName.includes('financeir') || normType === 'ADMINISTRATIVO') {
    return SECTOR_THEMES.ADMINISTRATIVO;
  }

  // 2. Match by SectorType key
  if (normType && SECTOR_THEMES[normType]) {
    return SECTOR_THEMES[normType];
  }

  // 3. Fallback
  return SECTOR_THEMES.OUTROS;
}
