/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Barra de Ferramentas Principal e Ribbon Completo
 * Suporte a Novo Projeto em Branco, Importação/Exportação DXF e Dropdowns Fiéis aos Modelos 1, 2, 3, 4 e 5.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AppViewMode } from './DesktopHeader';
import {
  ActiveCadMode,
  DoorWindowType,
  RoomPresetType,
  SymbolType
} from '../types/cad';
import { FilePlus, Upload, Download } from 'lucide-react';

export type { ActiveCadMode };

interface WocaToolbarProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  activeMode: ActiveCadMode;
  onActiveModeChange: (mode: ActiveCadMode) => void;
  selectedSymbolType: SymbolType;
  onSelectSymbolType: (type: SymbolType) => void;
  selectedDoorWindowType: DoorWindowType;
  onSelectDoorWindowType: (type: DoorWindowType) => void;
  selectedRoomPreset?: RoomPresetType;
  onSelectRoomPreset?: (preset: RoomPresetType) => void;
  viewMode: AppViewMode;
  onViewModeChange: (mode: AppViewMode) => void;
  onAddRoomPreset: (presetType: 'rect' | 'L1' | 'L2' | 'L3' | 'L4') => void;
  onNewBlankProject: () => void;
  onImportDxfFile: (file: File) => void;
  onAutoDimensionNbr: () => void;
  onAutoRouteConduits: () => void;
  onAutoWiringNbr: () => void;
  onExportDxf: () => void;
  onOpenPdfSheet: () => void;
  onOpenReportModal: () => void;
  onOpenLegendModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenLoadBalanceModal: () => void;
  onSaveJson: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearProject: () => void;
  gridSnapEnabled: boolean;
  onToggleGridSnap: () => void;
}

export const WocaToolbar: React.FC<WocaToolbarProps> = ({
  projectName,
  onProjectNameChange,
  activeMode,
  onActiveModeChange,
  selectedSymbolType,
  onSelectSymbolType,
  selectedDoorWindowType,
  onSelectDoorWindowType,
  selectedRoomPreset = 'rect',
  onSelectRoomPreset,
  viewMode,
  onViewModeChange,
  onAddRoomPreset,
  onNewBlankProject,
  onImportDxfFile,
  onAutoDimensionNbr,
  onAutoRouteConduits,
  onAutoWiringNbr,
  onExportDxf,
  onOpenPdfSheet,
  onOpenReportModal,
  onOpenLegendModal,
  onOpenBudgetModal,
  onOpenLoadBalanceModal,
  onSaveJson,
  onUndo,
  onRedo,
  onClearProject,
  gridSnapEnabled,
  onToggleGridSnap,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const dxfInputRef = useRef<HTMLInputElement | null>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleDxfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportDxfFile(file);
      e.target.value = '';
    }
  };

  return (
    <div ref={toolbarRef} className="w-full flex flex-col bg-[#eef1f5] text-slate-800 border-b border-slate-300 select-none shadow-sm z-30 shrink-0 font-sans">
      {/* Input oculto para importação de DXF */}
      <input
        type="file"
        ref={dxfInputRef}
        onChange={handleDxfFileSelect}
        accept=".dxf"
        className="hidden"
      />

      {/* ============================================================== */}
      {/* LINHA 1: BARRA SUPERIOR OHMVEX (Logo, Nome do Projeto, Ações)  */}
      {/* ============================================================== */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-slate-300 bg-white">
        {/* Esquerda: Logo OHMVEX + Renomear Projeto */}
        <div className="flex items-center gap-3">
          {/* Logo OHMVEX */}
          <div
            className="flex items-center gap-1.5 cursor-pointer group"
            onClick={() => onViewModeChange('cad2d')}
            title="OHMVEX CAD Elétrico NBR 5410"
          >
            <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
              {/* Símbolo Ohm Ω estilizado com eletricidade */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h4.5a3.5 3.5 0 0 0 3-1.8l.5-.7.5.7a3.5 3.5 0 0 0 3 1.8H20"/>
                <path d="M7.5 16.5A7.5 7.5 0 1 1 16.5 16.5"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-sm tracking-wider text-slate-900 font-mono">OHMVEX</span>
              <span className="text-[8px] font-mono text-orange-600 font-bold -mt-0.5 tracking-widest">CAD NBR 5410</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200" />

          {/* Campo Renomear Projeto */}
          <div className="relative group">
            <input
              type="text"
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              className="bg-transparent hover:bg-slate-50 focus:bg-white px-2 py-1 rounded text-slate-800 font-medium text-xs border border-transparent focus:border-cyan-500 focus:outline-none w-56 transition-colors"
              placeholder="Projeto sem título"
              title="Clique para renomear o projeto"
            />
            <div className="absolute left-2 -bottom-7 hidden group-hover:block z-50 bg-[#1c2331] text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
              Renomear Projeto
            </div>
          </div>
        </div>

        {/* Direita: Ações Globais da Barra Superior */}
        <div className="flex items-center gap-1.5">
          {/* Botão Novo Projeto em Branco */}
          <button
            onClick={onNewBlankProject}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold transition-colors shadow-xs"
            title="Criar Novo Projeto em Branco (Limpar área de trabalho)"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Novo em Branco</span>
          </button>

          {/* Botão Importar DXF */}
          <button
            onClick={() => dxfInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 text-xs font-semibold transition-colors shadow-xs"
            title="Importar Arquivo de Arquitetura (.DXF)"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="hidden sm:inline">Importar DXF</span>
          </button>

          {/* Botão Exportar DXF */}
          <button
            onClick={onExportDxf}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
            title="Exportar Planta Baixa em DXF (AutoCAD / LibreCAD / QCAD)"
          >
            <Download className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Exportar DXF</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

          {/* 1. Salvar JSON */}
          <button
            onClick={onSaveJson}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Salvar Projeto (.json / .ohmvex)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
              <line x1="9" y1="17" x2="15" y2="17" stroke="#dc2626" strokeWidth="2"/>
            </svg>
          </button>

          {/* 2. Exportar PDF / Prancha ABNT */}
          <button
            onClick={onOpenPdfSheet}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Gerar Prancha ABNT / Exportar PDF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#475569" strokeWidth="1.8"/>
              <rect x="6" y="13" width="12" height="6" fill="#0d9488" rx="1"/>
              <text x="7" y="17.5" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">PDF</text>
            </svg>
          </button>

          {/* 3. Pranchas / Folhas 1 2 3 */}
          <button
            onClick={onOpenPdfSheet}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Gerenciador de Folhas / Pranchas"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="6" y="2" width="13" height="16" rx="1.5" stroke="#059669"/>
              <rect x="4" y="5" width="13" height="16" rx="1.5" stroke="#475569"/>
              <text x="8" y="10" fontSize="5" fill="#059669" fontWeight="bold">1</text>
              <text x="8" y="14" fontSize="5" fill="#475569" fontWeight="bold">2</text>
            </svg>
          </button>

          {/* 4. Exportar DXF (com seta verde para cima) */}
          <button
            onClick={onExportDxf}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Exportar Planta Baixa em DXF (AutoCAD / LibreCAD)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#475569" strokeWidth="1.8"/>
              <polyline points="14 2 14 8 20 8" stroke="#475569" strokeWidth="1.8"/>
              <circle cx="17" cy="6" r="3.5" fill="#059669"/>
              <path d="M17 4.5V7.5M15.5 6L17 4.5L18.5 6" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <text x="6" y="18" fontSize="6.5" fill="#334155" fontWeight="bold" fontFamily="sans-serif">DXF</text>
            </svg>
          </button>

          {/* 5. Memorial de Cálculo (Raiz x +- com dropdown) */}
          <div className="relative">
            <button
              onClick={onOpenReportModal}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors flex items-center"
              title="Memorial de Cálculo e Fórmulas NBR 5410"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#475569"/>
                <path d="M7 14L8.5 17L12 11" stroke="#059669" strokeWidth="1.8"/>
                <text x="12" y="16" fontSize="7" fill="#059669" fontWeight="bold">√x</text>
              </svg>
              <span className="text-[9px] ml-0.5 text-slate-500">▼</span>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 mx-1" />

          {/* 6. Modo 3D BIM */}
          <button
            onClick={() => onViewModeChange(viewMode === 'bim3d' ? 'cad2d' : 'bim3d')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'bim3d' ? 'bg-cyan-100 text-cyan-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Visualizador Tridimensional 3D BIM"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#475569" strokeWidth="1.6" fill={viewMode === 'bim3d' ? '#0d9488' : '#e2e8f0'}/>
              <path d="M12 12L20 7.5M12 12V21M12 12L4 7.5" stroke="#334155" strokeWidth="1.6"/>
              <path d="M4 19C7 22 17 22 20 19" stroke="#ea580c" strokeWidth="1.8" strokeDasharray="2 2"/>
            </svg>
          </button>

          {/* 7. Lajes / Camadas */}
          <button
            onClick={() => onViewModeChange('auditoria')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'auditoria' ? 'bg-cyan-100 text-cyan-800' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Auditoria de Conformidade e Camadas NBR 5410"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#475569"/>
              <path d="M2 17L12 22L22 17" stroke="#ea580c" strokeDasharray="2 1"/>
              <path d="M2 12L12 17L22 12" stroke="#059669"/>
            </svg>
          </button>

          {/* 8. Corte / Seção de Parede */}
          <button
            onClick={() => onViewModeChange('bim3d')}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Corte / Elevação de Parede"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="13" y="4" width="7" height="16" stroke="#334155" strokeWidth="1.6" fill="#f1f5f9"/>
              <circle cx="6" cy="12" r="3" stroke="#ea580c" strokeWidth="1.5"/>
              <line x1="9" y1="12" x2="13" y2="8" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="1 1"/>
              <line x1="9" y1="12" x2="13" y2="16" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="1 1"/>
            </svg>
          </button>

          {/* 9. Grade / Snap */}
          <button
            onClick={onToggleGridSnap}
            className={`p-1.5 rounded transition-colors ${
              gridSnapEnabled ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Ativar/Desativar Snap à Grade"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 9H20M4 15H20M9 4V20M15 4V20" stroke="#059669"/>
              <path d="M3 6V3H6M18 3H21V6M21 18V21H18M6 21H3V18" stroke="#ea580c" strokeWidth="2"/>
            </svg>
          </button>

          {/* 10. LEGENDA NBR 5261 */}
          <button
            onClick={onOpenLegendModal}
            className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium"
            title="Abrir Legenda Oficial de Símbolos e Fiação NBR 5261"
          >
            <span className="text-[11px] font-sans font-bold tracking-tight text-slate-800">LEGENDA</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 text-white text-[8px] flex items-center justify-center font-sans">1</span>
            <span className="text-[10px] text-slate-600 font-sans">TUE</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-800 text-white text-[8px] flex items-center justify-center font-sans">2</span>
            <span className="text-[10px] text-slate-600 font-sans">TUG</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-300 mx-1" />

          {/* 11. Limpar / Lixeira */}
          <button
            onClick={onClearProject}
            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded transition-colors"
            title="Limpar Projeto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6L18 20H6L5 6"/>
              <path d="M10 11V17M14 11V17"/>
            </svg>
          </button>

          {/* 12. Desfazer (Undo) */}
          <button
            onClick={onUndo}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Desfazer (Ctrl+Z)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 9H15C18.3 9 21 11.7 21 15C21 18.3 18.3 21 15 21H10" stroke="#059669" strokeWidth="1.8" strokeDasharray="1.5 1.5"/>
              <path d="M9 4L4 9L9 14" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* 13. Refazer (Redo) */}
          <button
            onClick={onRedo}
            className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors"
            title="Refazer (Ctrl+Y)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 9H9C5.7 9 3 11.7 3 15C3 18.3 5.7 21 9 21H14" stroke="#059669" strokeWidth="1.8" strokeDasharray="1.5 1.5"/>
              <path d="M15 4L20 9L15 14" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LINHA 2: RIBBON DE FERRAMENTAS WOCA (DROPDOWNS MODELOS 1 A 5)   */}
      {/* ============================================================== */}
      <div className="relative min-h-12 px-2 flex items-center gap-1 bg-[#f8fafc] border-b border-slate-300 text-xs py-1 overflow-visible z-40">
        
        {/* DROPDOWN MODELO 1: CRIAR NOVO CÔMODO (5 OPÇÕES FIÉIS À IMAGEM 1) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onActiveModeChange('room_preset');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'room_preset' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Cômodo (Clique no canvas para posicionar)"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                <rect x="6" y="6" width="12" height="12" stroke="#334155" strokeWidth="1.2"/>
                <circle cx="3" cy="3" r="1.8" fill="#ef4444"/>
                <circle cx="21" cy="21" r="1.8" fill="#ef4444"/>
                <circle cx="10" cy="15" r="0.8" fill="#0d9488"/>
                <circle cx="13" cy="15" r="0.8" fill="#0d9488"/>
                <circle cx="16" cy="15" r="0.8" fill="#0d9488"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('rooms_model1')}
              className={`p-1.5 pr-2 rounded-r border border-slate-300 transition-colors ${
                openDropdown === 'rooms_model1' ? 'bg-cyan-200 border-cyan-500 text-cyan-900' : 'bg-white hover:bg-slate-50 text-slate-500'
              }`}
              title="Mais Formatos de Cômodo (Modelo 1)"
            >
              ▼
            </button>
          </div>

          {/* Menu Suspenso Modelo 1 (Vertical sobre o Canvas, idêntico à Imagem 1) */}
          {openDropdown === 'rooms_model1' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-16 flex flex-col items-center gap-1.5">
              {/* Opção 1: Cômodo Quadrado / Retangular */}
              <button
                onClick={() => {
                  if (onSelectRoomPreset) onSelectRoomPreset('rect');
                  onActiveModeChange('room_preset');
                  setOpenDropdown(null);
                }}
                className={`p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors ${
                  activeMode === 'room_preset' && selectedRoomPreset === 'rect' ? 'bg-cyan-100 ring-2 ring-cyan-500' : ''
                }`}
                title="Cômodo Retangular (4x3m) - Clique no canvas para posicionar"
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect x="4" y="4" width="20" height="20" stroke="#334155" strokeWidth="1.8"/>
                  <rect x="7" y="7" width="14" height="14" stroke="#334155" strokeWidth="1.2"/>
                  <circle cx="4" cy="4" r="2.2" fill="#ef4444"/>
                  <circle cx="24" cy="24" r="2.2" fill="#ef4444"/>
                  <circle cx="11" cy="18" r="0.9" fill="#0d9488"/>
                  <circle cx="14" cy="18" r="0.9" fill="#0d9488"/>
                  <circle cx="17" cy="18" r="0.9" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 2: L com corte no topo direito */}
              <button
                onClick={() => {
                  if (onSelectRoomPreset) onSelectRoomPreset('L1');
                  onActiveModeChange('room_preset');
                  setOpenDropdown(null);
                }}
                className={`p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors ${
                  activeMode === 'room_preset' && selectedRoomPreset === 'L1' ? 'bg-cyan-100 ring-2 ring-cyan-500' : ''
                }`}
                title="Cômodo em L (Superior Direito) - Clique no canvas para posicionar"
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M4 4H24V14H14V24H4V4Z" stroke="#334155" strokeWidth="1.8"/>
                  <path d="M7 7H21V12H12V21H7V7Z" stroke="#334155" strokeWidth="1.1"/>
                  <circle cx="4" cy="4" r="2" fill="#ef4444"/>
                  <circle cx="24" cy="14" r="2" fill="#ef4444"/>
                  <circle cx="4" cy="24" r="2" fill="#ef4444"/>
                  <circle cx="10" cy="10" r="0.8" fill="#0d9488"/>
                  <circle cx="13" cy="10" r="0.8" fill="#0d9488"/>
                  <circle cx="16" cy="10" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 3: L com corte no fundo esquerdo */}
              <button
                onClick={() => {
                  if (onSelectRoomPreset) onSelectRoomPreset('L2');
                  onActiveModeChange('room_preset');
                  setOpenDropdown(null);
                }}
                className={`p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors ${
                  activeMode === 'room_preset' && selectedRoomPreset === 'L2' ? 'bg-cyan-100 ring-2 ring-cyan-500' : ''
                }`}
                title="Cômodo em L (Inferior Esquerdo) - Clique no canvas para posicionar"
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M4 4H24V24H14V14H4V4Z" stroke="#334155" strokeWidth="1.8"/>
                  <path d="M7 7H21V21H16V12H7V7Z" stroke="#334155" strokeWidth="1.1"/>
                  <circle cx="4" cy="4" r="2" fill="#ef4444"/>
                  <circle cx="24" cy="24" r="2" fill="#ef4444"/>
                  <circle cx="10" cy="9" r="0.8" fill="#0d9488"/>
                  <circle cx="13" cy="9" r="0.8" fill="#0d9488"/>
                  <circle cx="16" cy="9" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 4: L vertical alongado */}
              <button
                onClick={() => {
                  if (onSelectRoomPreset) onSelectRoomPreset('L3');
                  onActiveModeChange('room_preset');
                  setOpenDropdown(null);
                }}
                className={`p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors ${
                  activeMode === 'room_preset' && selectedRoomPreset === 'L3' ? 'bg-cyan-100 ring-2 ring-cyan-500' : ''
                }`}
                title="Cômodo em L Vertical - Clique no canvas para posicionar"
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M4 4H14V14H24V24H4V4Z" stroke="#334155" strokeWidth="1.8"/>
                  <path d="M7 7H11V16H21V21H7V7Z" stroke="#334155" strokeWidth="1.1"/>
                  <circle cx="4" cy="4" r="2" fill="#ef4444"/>
                  <circle cx="24" cy="24" r="2" fill="#ef4444"/>
                  <circle cx="10" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="13" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="16" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 5: L invertido com rebaixo inferior */}
              <button
                onClick={() => {
                  if (onSelectRoomPreset) onSelectRoomPreset('L4');
                  onActiveModeChange('room_preset');
                  setOpenDropdown(null);
                }}
                className={`p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors ${
                  activeMode === 'room_preset' && selectedRoomPreset === 'L4' ? 'bg-cyan-100 ring-2 ring-cyan-500' : ''
                }`}
                title="Cômodo em L Invertido - Clique no canvas para posicionar"
              >
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <path d="M14 4H24V24H4V14H14V4Z" stroke="#334155" strokeWidth="1.8"/>
                  <path d="M16 7H21V21H7V16H16V7Z" stroke="#334155" strokeWidth="1.1"/>
                  <circle cx="24" cy="4" r="2" fill="#ef4444"/>
                  <circle cx="4" cy="24" r="2" fill="#ef4444"/>
                  <circle cx="10" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="13" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="16" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 2: PAREDES LIVRES */}
        <button
          onClick={() => onActiveModeChange('wall_free')}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'wall_free' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Desenhar Paredes Livres (Ponto a Ponto com Espessura 15cm)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="20" x2="10" y2="8" stroke="#334155" strokeWidth="2.5"/>
            <line x1="10" y1="8" x2="22" y2="8" stroke="#334155" strokeWidth="2.5"/>
            <circle cx="10" cy="8" r="3.5" stroke="#ef4444" strokeWidth="1.5"/>
            <path d="M10 16L10 11.5M8.5 13L10 11.5L11.5 13" stroke="#059669" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* DROPDOWN MODELO 2: ESQUADRIAS (6 OPÇÕES FIÉIS À IMAGEM 2) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => onActiveModeChange('door_window')}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'door_window' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Esquadria"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="2" width="12" height="19" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                <line x1="4" y1="21" x2="20" y2="21" stroke="#334155" strokeWidth="2"/>
                <path d="M8 12L10 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="13" cy="18" r="0.8" fill="#0d9488"/>
                <circle cx="15" cy="18" r="0.8" fill="#0d9488"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('doors_model2')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Tipos de Esquadria (Modelo 2)"
            >
              ▼
            </button>
          </div>

          {/* Menu Suspenso Modelo 2 (Vertical, idêntico à Imagem 2) */}
          {openDropdown === 'doors_model2' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-20 flex flex-col items-center gap-2">
              {/* Opção 1: Porta de abrir simples */}
              <button
                onClick={() => { onSelectDoorWindowType('porta_simples'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Porta de Giro Simples"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="2" width="12" height="19" stroke="#334155" strokeWidth="1.5" fill="#f8fafc"/>
                  <line x1="4" y1="21" x2="20" y2="21" stroke="#334155" strokeWidth="2"/>
                  <path d="M8 11L10 11L10 13" stroke="#ef4444" strokeWidth="1.8" fill="none"/>
                  <circle cx="13" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="15" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 2: Janela 4 folhas */}
              <button
                onClick={() => { onSelectDoorWindowType('janela'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Janela 4 Folhas"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="5" width="16" height="15" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                  <line x1="12" y1="5" x2="12" y2="20" stroke="#334155" strokeWidth="1.4"/>
                  <line x1="4" y1="12.5" x2="20" y2="12.5" stroke="#334155" strokeWidth="1.4"/>
                  <line x1="6" y1="7" x2="9" y2="10" stroke="#ef4444" strokeWidth="1.2"/>
                  <circle cx="14" cy="17" r="0.8" fill="#0d9488"/>
                  <circle cx="16" cy="17" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 3: Vão livre / portal */}
              <button
                onClick={() => { onSelectDoorWindowType('vao_livre'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Vão Livre / Portal Aberto"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 21V6C4 4.5 19 4.5 19 6V21" stroke="#334155" strokeWidth="2.2" strokeLinecap="square"/>
                  <circle cx="21" cy="12" r="0.8" fill="#0d9488"/>
                  <circle cx="21" cy="15" r="0.8" fill="#0d9488"/>
                  <circle cx="21" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 4: Porta de correr */}
              <button
                onClick={() => { onSelectDoorWindowType('porta_correr'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Porta de Correr Deslizante"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line x1="4" y1="3" x2="20" y2="3" stroke="#334155" strokeWidth="2"/>
                  <line x1="20" y1="3" x2="20" y2="21" stroke="#334155" strokeWidth="1.5"/>
                  <rect x="7" y="5" width="8" height="16" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <path d="M12 12L14 12" stroke="#ef4444" strokeWidth="1.8"/>
                  <circle cx="9" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="11" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 5: Porta dupla de duas folhas */}
              <button
                onClick={() => { onSelectDoorWindowType('porta_dupla'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Porta Dupla Pivotante"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="3" width="7" height="18" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <rect x="12" y="3" width="7" height="18" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <line x1="3" y1="21" x2="21" y2="21" stroke="#334155" strokeWidth="2"/>
                  <circle cx="8" cy="12" r="0.8" fill="#ef4444"/>
                  <circle cx="16" cy="12" r="0.8" fill="#ef4444"/>
                  <circle cx="7" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="14" cy="18" r="0.8" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 6: Escada */}
              <button
                onClick={() => { onSelectDoorWindowType('escada'); onActiveModeChange('door_window'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Escada com Degraus"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 20H8V15H13V10H18V5H20V20H4Z" stroke="#334155" strokeWidth="1.8" fill="#f8fafc"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 4: COTAS & MEDIÇÃO */}
        <button
          onClick={() => onActiveModeChange('dimension')}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'dimension' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Adicionar Cota / Medição Linear de Parede"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="4,20 20,4 20,20" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
            <line x1="6" y1="18" x2="18" y2="6" stroke="#ef4444" strokeWidth="1.8"/>
            <polyline points="7,15 6,18 9,17" stroke="#ef4444" strokeWidth="1.5"/>
            <polyline points="15,7 18,6 17,9" stroke="#ef4444" strokeWidth="1.5"/>
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-slate-300 mx-0.5" />

        {/* GRUPO 5: ILUMINAÇÃO NBR 5261 */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onSelectSymbolType('luz_teto');
                onActiveModeChange('symbol');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'symbol' && selectedSymbolType.startsWith('luz')
                  ? 'bg-cyan-100 border-cyan-500'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Ponto de Luz no Teto"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="12" r="6" stroke="#334155" strokeWidth="1.8"/>
                <path d="M17 7C18.5 7 20 8.5 20 10.5C20 12 19 13 18.5 14H15.5C15 13 14 12 14 10.5C14 8.5 15.5 7 17 7Z" stroke="#334155" strokeWidth="1.4"/>
                <line x1="16" y1="14" x2="18" y2="14" stroke="#ef4444" strokeWidth="1.5"/>
                <line x1="16" y1="16" x2="18" y2="16" stroke="#334155" strokeWidth="1.5"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('lights')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Opções de Iluminação"
            >
              ▼
            </button>
          </div>

          {openDropdown === 'lights' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-44 flex flex-col gap-1">
              <button
                onClick={() => { onSelectSymbolType('luz_teto'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center font-mono text-[9px] font-bold">L</div>
                <span className="text-[11px]">Ponto Luz Teto</span>
              </button>
              <button
                onClick={() => { onSelectSymbolType('luz_arandela'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <div className="w-5 h-5 border-l-2 border-slate-700 flex items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500"/>
                </div>
                <span className="text-[11px]">Arandela Parede</span>
              </button>
              <button
                onClick={() => { onSelectSymbolType('luz_spot'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <div className="w-5 h-5 border border-slate-700 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full border border-teal-600 bg-red-100"/>
                </div>
                <span className="text-[11px]">Spot / Plafon LED</span>
              </button>
              <button
                onClick={() => { onSelectSymbolType('luz_tubular'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <div className="w-8 h-2.5 rounded-sm border border-slate-700 bg-slate-100 flex items-center justify-center text-[7px]">══</div>
                <span className="text-[11px]">Luminária Linear</span>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 6: TOMADAS TUG E TUE */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onSelectSymbolType('tug_baixa');
                onActiveModeChange('symbol');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'symbol' && selectedSymbolType.startsWith('tu')
                  ? 'bg-cyan-100 border-cyan-500'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Tomadas"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polygon points="6,18 18,18 12,6" stroke="#334155" strokeWidth="1.8" fill="#f8fafc"/>
                <path d="M19 14H22M20 11V17" stroke="#ef4444" strokeWidth="1.6"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('tugs')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Opções de Tomadas"
            >
              ▼
            </button>
          </div>

          {openDropdown === 'tugs' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-44 flex flex-col gap-1">
              <button
                onClick={() => { onSelectSymbolType('tug_baixa'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <span className="text-base">△</span>
                <span className="text-[11px]">Tomada Baixa (30cm)</span>
              </button>
              <button
                onClick={() => { onSelectSymbolType('tug_media'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <span className="text-base font-bold">▲</span>
                <span className="text-[11px]">Tomada Média (120cm)</span>
              </button>
              <button
                onClick={() => { onSelectSymbolType('tue_alta'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left"
              >
                <span className="text-base text-red-600 font-bold">▲</span>
                <span className="text-[11px] font-bold text-red-700">TUE Chuveiro/AC</span>
              </button>
            </div>
          )}
        </div>

        {/* DROPDOWN MODELO 3: INTERRUPTORES (8 OPÇÕES FIÉIS À IMAGEM 3) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onSelectSymbolType('interruptor_simples');
                onActiveModeChange('symbol');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'symbol' && selectedSymbolType.startsWith('inter')
                  ? 'bg-cyan-100 border-cyan-500'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Interruptor"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="10" r="5" stroke="#334155" strokeWidth="1.8"/>
                <line x1="8" y1="15" x2="8" y2="20" stroke="#334155" strokeWidth="1.8"/>
                <rect x="15" y="6" width="6" height="12" stroke="#334155" strokeWidth="1.5" rx="1"/>
                <circle cx="18" cy="9" r="1" fill="#ef4444"/>
                <circle cx="18" cy="15" r="1" fill="#0d9488"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('switches_model3')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Tipos de Interruptores (Modelo 3)"
            >
              ▼
            </button>
          </div>

          {/* Menu Suspenso Modelo 3 (Vertical, idêntico à Imagem 3) */}
          {openDropdown === 'switches_model3' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-20 flex flex-col items-center gap-2">
              {/* Opção 1: Interruptor com placa de módulo (verde/vermelho) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_simples'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Simples com Placa"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="8" cy="10" r="5" stroke="#334155" strokeWidth="1.6"/>
                  <line x1="8" y1="15" x2="8" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <rect x="15" y="6" width="6" height="13" stroke="#334155" strokeWidth="1.3" rx="1"/>
                  <circle cx="18" cy="9.5" r="1" fill="#0d9488"/>
                  <circle cx="18" cy="15.5" r="1" fill="#ef4444"/>
                </svg>
              </button>

              {/* Opção 2: Círculo preto sólido com 3 pontinhos verdes (1 Tecla) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_preto_1t'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Simples (1 Tecla)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="9" r="6" fill="#334155"/>
                  <line x1="10" y1="15" x2="10" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <circle cx="19" cy="13" r="0.9" fill="#0d9488"/>
                  <circle cx="19" cy="16" r="0.9" fill="#0d9488"/>
                  <circle cx="19" cy="19" r="0.9" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 3: Meio preenchido com 4 pontinhos (Paralelo / Two-Way) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_paralelo'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Paralelo (Three-Way)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="9" r="6" stroke="#334155" strokeWidth="1.5"/>
                  <path d="M10 3A6 6 0 0 0 10 15Z" fill="#334155"/>
                  <line x1="10" y1="15" x2="10" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <circle cx="17" cy="16" r="0.9" fill="#0d9488"/>
                  <circle cx="20" cy="16" r="0.9" fill="#0d9488"/>
                  <circle cx="17" cy="19" r="0.9" fill="#0d9488"/>
                  <circle cx="20" cy="19" r="0.9" fill="#0d9488"/>
                </svg>
              </button>

              {/* Opção 4: Círculo com traço diametral e 2 traços vermelhos (Bipolar) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_bipolar'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Bipolar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="9" r="6" stroke="#334155" strokeWidth="1.5"/>
                  <line x1="10" y1="3" x2="10" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <line x1="16" y1="16" x2="22" y2="16" stroke="#ef4444" strokeWidth="1.6"/>
                  <line x1="16" y1="19" x2="22" y2="19" stroke="#ef4444" strokeWidth="1.6"/>
                </svg>
              </button>

              {/* Opção 5: Círculo triplo com 3 traços verde/vermelho/preto (Intermediário / Triplo) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_triplo'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Triplo / Intermediário"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="9" r="6" stroke="#334155" strokeWidth="1.5"/>
                  <line x1="10" y1="9" x2="10" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <line x1="10" y1="9" x2="5" y2="6" stroke="#334155" strokeWidth="1.5"/>
                  <line x1="10" y1="9" x2="15" y2="6" stroke="#334155" strokeWidth="1.5"/>
                  <line x1="16" y1="15" x2="22" y2="15" stroke="#059669" strokeWidth="1.4"/>
                  <line x1="16" y1="18" x2="22" y2="18" stroke="#ef4444" strokeWidth="1.4"/>
                  <line x1="16" y1="21" x2="22" y2="21" stroke="#334155" strokeWidth="1.4"/>
                </svg>
              </button>

              {/* Opção 6: Sensor de presença no teto com figura humana caminhando */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_sensor'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Sensor de Presença no Teto (PIR)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="3" rx="1.5" stroke="#334155" strokeWidth="1.5"/>
                  <path d="M8 6C8 9 16 9 16 6" stroke="#334155" strokeWidth="1.5"/>
                  <path d="M6 10C8 12 16 12 18 10" stroke="#ef4444" strokeWidth="1.2"/>
                  <path d="M8 12C9.5 13.5 14.5 13.5 16 12" stroke="#ef4444" strokeWidth="1.2"/>
                  <circle cx="12" cy="15" r="1.5" fill="#334155"/>
                  <path d="M12 16.5V20M12 20L9 23M12 20L15 23" stroke="#334155" strokeWidth="1.4"/>
                </svg>
              </button>

              {/* Opção 7: Círculo com entalhe V e tomada conjugada */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_tomada'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor + Tomada Conjugada"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="9" r="6" fill="#334155"/>
                  <polygon points="9,9 5,4 13,4" fill="white"/>
                  <line x1="9" y1="15" x2="9" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <rect x="15" y="14" width="7" height="8" stroke="#334155" strokeWidth="1.2" rx="1"/>
                  <circle cx="18.5" cy="16.5" r="0.8" fill="#0d9488"/>
                  <line x1="17.5" y1="19.5" x2="19.5" y2="19.5" stroke="#ef4444" strokeWidth="1"/>
                </svg>
              </button>

              {/* Opção 8: Ampulheta bipartida com 6 pontinhos verdes (Paralelo Duplo) */}
              <button
                onClick={() => { onSelectSymbolType('interruptor_paralelo_duplo'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Interruptor Paralelo Duplo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="9" r="6" stroke="#334155" strokeWidth="1.5"/>
                  <path d="M6 5C10 9 10 9 6 13Z" fill="#334155"/>
                  <path d="M14 5C10 9 10 9 14 13Z" fill="#334155"/>
                  <line x1="10" y1="15" x2="10" y2="21" stroke="#334155" strokeWidth="1.6"/>
                  <circle cx="17" cy="15" r="0.8" fill="#0d9488"/>
                  <circle cx="20" cy="15" r="0.8" fill="#0d9488"/>
                  <circle cx="17" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="20" cy="18" r="0.8" fill="#0d9488"/>
                  <circle cx="17" cy="21" r="0.8" fill="#0d9488"/>
                  <circle cx="20" cy="21" r="0.8" fill="#0d9488"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 8: TELECOM, DADOS E SEGURANÇA */}
        <button
          onClick={() => {
            onSelectSymbolType('telecom_dados');
            onActiveModeChange('symbol');
          }}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'symbol' && selectedSymbolType.startsWith('telecom')
              ? 'bg-cyan-100 border-cyan-500'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Telecom, Dados e Segurança"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <polygon points="4,5 12,5 8,17" stroke="#334155" strokeWidth="1.6"/>
            <line x1="8" y1="17" x2="8" y2="21" stroke="#334155" strokeWidth="1.6"/>
            <path d="M15 11C15 9 18 9 18 11C18 14 14 17 14 17C14 17 17 17 19 15" stroke="#ef4444" strokeWidth="1.4"/>
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-slate-300 mx-0.5" />

        {/* GRUPO 9: AUTO-DIMENSIONAMENTO NBR 5410 */}
        <button
          onClick={onAutoDimensionNbr}
          className="p-1.5 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded transition-colors flex items-center"
          title="Auto-Dimensionamento NBR 5410: Cargas Mínimas de Luz e TUGs por Cômodo"
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 18C4 12 12 12 12 6" stroke="#ef4444" strokeWidth="1.6"/>
              <path d="M12 6C12 12 20 12 20 18" stroke="#ef4444" strokeWidth="1.6"/>
              <circle cx="12" cy="5" r="2.5" fill="#334155"/>
              <polygon points="18,17 22,17 20,21" fill="#334155"/>
            </svg>
            <span className="absolute -top-1.5 -left-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1 rounded-full">A</span>
          </div>
        </button>

        {/* GRUPO 10: QUADRO DE DISTRIBUIÇÃO QDC */}
        <button
          onClick={() => {
            onSelectSymbolType('qdc');
            onActiveModeChange('symbol');
          }}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'symbol' && selectedSymbolType === 'qdc'
              ? 'bg-cyan-100 border-cyan-500'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Inserir / Posicionar QDC"
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
              <line x1="12" y1="3" x2="12" y2="21" stroke="#334155" strokeWidth="1.2"/>
              <line x1="7" y1="7" x2="17" y2="7" stroke="#ef4444" strokeWidth="1.4"/>
              <line x1="7" y1="12" x2="17" y2="12" stroke="#ef4444" strokeWidth="1.4"/>
              <line x1="7" y1="17" x2="17" y2="17" stroke="#ef4444" strokeWidth="1.4"/>
            </svg>
            <span className="absolute -top-1.5 -left-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1 rounded-full">A</span>
          </div>
        </button>

        {/* GRUPO 11: ÁRVORE DE CIRCUITOS */}
        <button
          onClick={onOpenLoadBalanceModal}
          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
          title="Árvore Hierárquica de Circuitos e Balanceamento R-S-T"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="7" height="6" stroke="#334155" strokeWidth="1.4"/>
            <rect x="14" y="2" width="7" height="5" stroke="#059669" strokeWidth="1.4"/>
            <rect x="14" y="9" width="7" height="5" stroke="#059669" strokeWidth="1.4"/>
            <rect x="14" y="16" width="7" height="5" stroke="#059669" strokeWidth="1.4"/>
            <path d="M10 7H12V18H14" stroke="#059669" strokeWidth="1.4"/>
            <path d="M12 4.5H14" stroke="#059669" strokeWidth="1.4"/>
            <path d="M12 11.5H14" stroke="#059669" strokeWidth="1.4"/>
          </svg>
        </button>

        {/* GRUPO 12: MEMORIAL DE CARGAS */}
        <button
          onClick={onOpenReportModal}
          className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded transition-colors"
          title="Memorial Descritivo e Quadro de Cargas"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="3" width="16" height="18" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
            <line x1="4" y1="8" x2="20" y2="8" stroke="#ef4444" strokeWidth="1.5"/>
            <line x1="10" y1="8" x2="10" y2="21" stroke="#334155" strokeWidth="1.2"/>
            <circle cx="15" cy="15" r="3" fill="#0d9488"/>
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-slate-300 mx-0.5" />

        {/* GRUPO 13: QUEBRAR ELETRODUTO */}
        <button
          onClick={() => onActiveModeChange('disconnect_conduit')}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'disconnect_conduit' ? 'bg-rose-100 border-rose-500' : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Quebrar / Desconectar Eletroduto"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" stroke="#334155" strokeWidth="1.5" fill="#f8fafc"/>
            <line x1="2" y1="2" x2="22" y2="22" stroke="#ef4444" strokeWidth="2.2"/>
            <line x1="22" y1="2" x2="2" y2="22" stroke="#ef4444" strokeWidth="2.2"/>
          </svg>
        </button>

        {/* GRUPO 14: CAIXA DE DERIVAÇÃO */}
        <button
          onClick={() => {
            onSelectSymbolType('caixa_passagem');
            onActiveModeChange('symbol');
          }}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'symbol' && selectedSymbolType === 'caixa_passagem'
              ? 'bg-cyan-100 border-cyan-500'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Caixa de Passagem / Derivação"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="12" x2="21" y2="12" stroke="#334155" strokeWidth="2"/>
            <line x1="12" y1="12" x2="20" y2="20" stroke="#334155" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3.5" fill="#ef4444"/>
          </svg>
        </button>

        {/* DROPDOWN MODELO 4: SUBIDA / DESCIDA DE ELETRODUTO (FIEL À IMAGEM 4) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onSelectSymbolType('sobe_eletroduto');
                onActiveModeChange('symbol');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'symbol' && (selectedSymbolType === 'sobe_eletroduto' || selectedSymbolType === 'desce_eletroduto')
                  ? 'bg-cyan-100 border-cyan-500'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Subida / Descida de Tubulação"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="2" x2="12" y2="22" stroke="#059669" strokeWidth="2"/>
                <rect x="8" y="9" width="8" height="6" stroke="#334155" strokeWidth="1.5" fill="#f8fafc"/>
                <path d="M5 8L5 3M3 5L5 3L7 5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('conduit_model4')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Subida / Descida de Eletroduto (Modelo 4)"
            >
              ▼
            </button>
          </div>

          {/* Menu Suspenso Modelo 4 (Vertical, idêntico à Imagem 4) */}
          {openDropdown === 'conduit_model4' && (
            <div className="absolute top-11 left-0 z-50 bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-16 flex flex-col items-center gap-2">
              {/* Opção 1: Sobe eletroduto (seta vermelha para cima) */}
              <button
                onClick={() => { onSelectSymbolType('sobe_eletroduto'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Sobe Eletroduto (Laje Superior)"
              >
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                  <line x1="14" y1="2" x2="14" y2="26" stroke="#059669" strokeWidth="2.2"/>
                  <rect x="10" y="11" width="8" height="7" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                  <path d="M5 19L5 5M2 8L5 5L8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Opção 2: Desce eletroduto (seta vermelha para baixo) */}
              <button
                onClick={() => { onSelectSymbolType('desce_eletroduto'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Desce Eletroduto (Laje Inferior / Piso)"
              >
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                  <line x1="14" y1="2" x2="14" y2="26" stroke="#059669" strokeWidth="2.2"/>
                  <rect x="10" y="11" width="8" height="7" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                  <path d="M5 9L5 23M2 20L5 23L8 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 16: PADRÃO DE ENTRADA MEDIDOR */}
        <button
          onClick={() => {
            onSelectSymbolType('medidor_padrao');
            onActiveModeChange('symbol');
          }}
          className={`p-1.5 rounded border transition-colors ${
            activeMode === 'symbol' && selectedSymbolType === 'medidor_padrao'
              ? 'bg-cyan-100 border-cyan-500'
              : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Padrão de Entrada / Medidor Concessionária"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="4" width="14" height="16" stroke="#334155" strokeWidth="1.6" rx="2" fill="#f8fafc"/>
            <rect x="8" y="7" width="8" height="5" stroke="#334155" strokeWidth="1.2"/>
            <path d="M12 14L10 17H13L11 19" stroke="#ef4444" strokeWidth="1.4"/>
            <line x1="7" y1="20" x2="7" y2="23" stroke="#334155" strokeWidth="1.6"/>
            <line x1="12" y1="20" x2="12" y2="23" stroke="#334155" strokeWidth="1.6"/>
            <line x1="17" y1="20" x2="17" y2="23" stroke="#334155" strokeWidth="1.6"/>
          </svg>
        </button>

        <div className="h-6 w-[1px] bg-slate-300 mx-0.5" />

        {/* GRUPO 17: ROTEAMENTO AUTOMÁTICO DE ELETRODUTOS */}
        <button
          onClick={onAutoRouteConduits}
          className="p-1.5 bg-white border border-slate-300 hover:bg-emerald-50 hover:border-emerald-400 rounded transition-colors flex items-center"
          title="Roteamento Automático de Eletrodutos via Dijkstra"
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 18C10 18 10 6 20 6" stroke="#334155" strokeWidth="2.5" strokeDasharray="1.5 1.5"/>
              <path d="M18 4L22 6L18 8" stroke="#ef4444" strokeWidth="1.6"/>
            </svg>
            <span className="absolute -top-1.5 -left-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1 rounded-full">A</span>
          </div>
        </button>

        {/* GRUPO 18: ELETRODUTO MANUAL (COM DROPDOWN MODELO 4) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => onActiveModeChange('conduit_manual')}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'conduit_manual' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Desenhar Eletroduto Manualmente (Traçado Livre)"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 18C10 18 10 6 20 6" stroke="#334155" strokeWidth="2.5" strokeDasharray="1.5 1.5"/>
                <path d="M18 4L22 6L18 8" stroke="#ef4444" strokeWidth="1.6"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('conduit_manual_model4')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Opções de Eletroduto (Modelo 4)"
            >
              ▼
            </button>
          </div>

          {openDropdown === 'conduit_manual_model4' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-48 flex flex-col gap-1.5">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 pb-1 border-b border-slate-200 flex justify-between items-center">
                <span>Eletroduto / Tubulação</span>
                <span className="text-[9px] text-cyan-700 bg-cyan-50 px-1 py-0.5 rounded font-mono">Modelo 4</span>
              </div>
              <button
                onClick={() => { onActiveModeChange('conduit_manual'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left transition-colors w-full"
                title="Eletroduto Embutido na Laje ou Teto"
              >
                <div className="w-6 h-6 rounded border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <line x1="2" y1="12" x2="22" y2="12" stroke="#059669" strokeWidth="2.5"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-slate-800">Eletroduto Teto/Laje</span>
                  <span className="text-[9px] text-slate-500">Linha Contínua</span>
                </div>
              </button>

              <button
                onClick={() => { onActiveModeChange('conduit_manual'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left transition-colors w-full"
                title="Eletroduto Embutido no Piso"
              >
                <div className="w-6 h-6 rounded border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <line x1="2" y1="12" x2="22" y2="12" stroke="#ea580c" strokeWidth="2.2" strokeDasharray="3 2"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-slate-800">Eletroduto no Piso</span>
                  <span className="text-[9px] text-slate-500">Linha Tracejada</span>
                </div>
              </button>

              <button
                onClick={() => { onSelectSymbolType('sobe_eletroduto'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left transition-colors w-full"
                title="Sobe Eletroduto (Laje Superior)"
              >
                <div className="w-6 h-6 rounded border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                  <svg width="16" height="20" viewBox="0 0 24 28" fill="none">
                    <line x1="14" y1="2" x2="14" y2="26" stroke="#059669" strokeWidth="2.2"/>
                    <rect x="10" y="11" width="8" height="7" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                    <path d="M5 19L5 5M2 8L5 5L8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-slate-800">Sobe Eletroduto</span>
                  <span className="text-[9px] text-slate-500">Para Laje Superior</span>
                </div>
              </button>

              <button
                onClick={() => { onSelectSymbolType('desce_eletroduto'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1.5 hover:bg-slate-100 rounded flex items-center gap-2 text-left transition-colors w-full"
                title="Desce Eletroduto (Piso)"
              >
                <div className="w-6 h-6 rounded border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                  <svg width="16" height="20" viewBox="0 0 24 28" fill="none">
                    <line x1="14" y1="2" x2="14" y2="26" stroke="#059669" strokeWidth="2.2"/>
                    <rect x="10" y="11" width="8" height="7" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                    <path d="M5 9L5 23M2 20L5 23L8 20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium text-slate-800">Desce Eletroduto</span>
                  <span className="text-[9px] text-slate-500">Para Piso / Laje Inferior</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* DROPDOWN MODELO 5: ELETROCALHA / PERFILADO (FIEL À IMAGEM 5) */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                onSelectSymbolType('eletrocalha');
                onActiveModeChange('symbol');
              }}
              className={`p-1.5 rounded-l border border-r-0 transition-colors ${
                activeMode === 'symbol' && selectedSymbolType.startsWith('eletrocalha')
                  ? 'bg-cyan-100 border-cyan-500'
                  : 'bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="Inserir Eletrocalha Perfurada ou Perfilado"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="8" width="16" height="8" stroke="#334155" strokeWidth="1.6" fill="#f8fafc"/>
                <line x1="7" y1="12" x2="9" y2="12" stroke="#334155" strokeWidth="1.5"/>
                <line x1="11" y1="12" x2="13" y2="12" stroke="#334155" strokeWidth="1.5"/>
                <line x1="15" y1="12" x2="17" y2="12" stroke="#334155" strokeWidth="1.5"/>
              </svg>
            </button>
            <button
              onClick={() => toggleDropdown('conduit_model5')}
              className="p-1.5 pr-2 rounded-r border border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
              title="Tipos de Eletrocalha (Modelo 5)"
            >
              ▼
            </button>
          </div>

          {/* Menu Suspenso Modelo 5 (Vertical, idêntico à Imagem 5) */}
          {openDropdown === 'conduit_model5' && (
            <div className="absolute top-full mt-1 left-0 z-[100] bg-white border border-slate-300 rounded shadow-2xl p-1.5 w-24 flex flex-col items-center gap-2">
              {/* Opção 1: Eletrocalha perfilada perfurada sem cabo */}
              <button
                onClick={() => { onSelectSymbolType('eletrocalha'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Eletrocalha Suspensa Perfurada"
              >
                <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
                  {/* Vista axonométrica isométrica da eletrocalha como na Imagem 5 */}
                  <path d="M4 8L10 3H30L24 8H4Z" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <path d="M4 8H24V16H4V8Z" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <path d="M24 8L30 3V11L24 16V8Z" stroke="#334155" strokeWidth="1.4" fill="#f1f5f9"/>
                  {/* Furos da calha */}
                  <line x1="7" y1="11" x2="10" y2="11" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="13" y1="11" x2="16" y2="11" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="19" y1="11" x2="22" y2="11" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="7" y1="13.5" x2="10" y2="13.5" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="13" y1="13.5" x2="16" y2="13.5" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="19" y1="13.5" x2="22" y2="13.5" stroke="#334155" strokeWidth="1.2"/>
                </svg>
              </button>

              {/* Opção 2: Eletrocalha com derivação de cabo vermelho saindo */}
              <button
                onClick={() => { onSelectSymbolType('eletrocalha_derivacao'); onActiveModeChange('symbol'); setOpenDropdown(null); }}
                className="p-1 hover:bg-slate-100 rounded w-full flex justify-center items-center transition-colors"
                title="Eletrocalha com Saída de Cabo"
              >
                <svg width="34" height="20" viewBox="0 0 34 20" fill="none">
                  {/* Vista isométrica com cabo vermelho */}
                  <path d="M8 8L14 3H32L26 8H8Z" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <path d="M8 8H26V16H8V8Z" stroke="#334155" strokeWidth="1.4" fill="#f8fafc"/>
                  <path d="M26 8L32 3V11L26 16V8Z" stroke="#334155" strokeWidth="1.4" fill="#f1f5f9"/>
                  {/* Cabo vermelho saindo para o lado esquerdo */}
                  <line x1="14" y1="12" x2="2" y2="15" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
                  {/* Furos da calha */}
                  <line x1="16" y1="11" x2="19" y2="11" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="21" y1="11" x2="24" y2="11" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="16" y1="13.5" x2="19" y2="13.5" stroke="#334155" strokeWidth="1.2"/>
                  <line x1="21" y1="13.5" x2="24" y2="13.5" stroke="#334155" strokeWidth="1.2"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* GRUPO 20: FIAÇÃO AUTOMÁTICA NBR 5410 */}
        <button
          onClick={onAutoWiringNbr}
          className="p-1.5 bg-white border border-slate-300 hover:bg-cyan-50 hover:border-cyan-400 rounded transition-colors flex items-center"
          title="Fiação Automática NBR 5410"
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 16C8 16 9 8 16 8" stroke="#334155" strokeWidth="2.2"/>
              <line x1="16" y1="5" x2="20" y2="5" stroke="#ef4444" strokeWidth="1.5"/>
              <line x1="16" y1="8" x2="21" y2="8" stroke="#0284c7" strokeWidth="1.5"/>
              <line x1="16" y1="11" x2="20" y2="11" stroke="#059669" strokeWidth="1.5"/>
            </svg>
            <span className="absolute -top-1.5 -left-1 text-[9px] font-extrabold text-emerald-600 bg-emerald-100 px-1 rounded-full">A</span>
          </div>
        </button>

        {/* GRUPO 21: TABELA DE MATERIAIS */}
        <button
          onClick={() => onViewModeChange('materiais')}
          className={`p-1.5 rounded border transition-colors ${
            viewMode === 'materiais' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Tabela Quantitativa Consolidada de Materiais"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" stroke="#334155" strokeWidth="1.6" rx="1.5" fill="#f8fafc"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="#ef4444" strokeWidth="1.6"/>
            <line x1="3" y1="14" x2="21" y2="14" stroke="#334155" strokeWidth="1.2"/>
            <line x1="10" y1="9" x2="10" y2="20" stroke="#334155" strokeWidth="1.2"/>
          </svg>
        </button>

        {/* GRUPO 22: DIAGRAMA UNIFILAR */}
        <button
          onClick={() => onViewModeChange('unifilar')}
          className={`p-1.5 rounded border transition-colors ${
            viewMode === 'unifilar' ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-slate-300 hover:bg-slate-50'
          }`}
          title="Diagrama Unifilar do QDC"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="12" x2="8" y2="12" stroke="#334155" strokeWidth="2"/>
            <path d="M8 12C9 9 11 9 12 12" stroke="#ef4444" strokeWidth="1.8"/>
            <path d="M12 12H15V6H21M15 12V18H21" stroke="#059669" strokeWidth="1.8"/>
          </svg>
        </button>

        {/* GRUPO 23: ORÇAMENTO E CUSTOS ($) */}
        <button
          onClick={onOpenBudgetModal}
          className="p-1.5 bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-400 rounded transition-colors text-amber-600 font-bold"
          title="Orçamento e Custos Estimados da Instalação ($)"
        >
          <div className="w-5 h-5 rounded-full border-2 border-amber-600 flex items-center justify-center font-bold text-xs text-amber-700">
            $
          </div>
        </button>

      </div>
    </div>
  );
};
