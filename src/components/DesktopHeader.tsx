/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Barra Superior Estilo Desktop / Tauri
 */

import React from 'react';
import {
  Download,
  FolderOpen,
  Save,
  Zap,
  RotateCcw,
  CheckCircle2,
  FileCode2,
  Layers,
  Box,
  ClipboardList,
  GitBranch,
  Play,
  FilePlus
} from 'lucide-react';

export type AppViewMode = 'cad2d' | 'unifilar' | 'bim3d' | 'materiais' | 'auditoria';

interface DesktopHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  viewMode: AppViewMode;
  onViewModeChange: (mode: AppViewMode) => void;
  onAutoDimension: () => void;
  onAutoRoute: () => void;
  onExportDxf: () => void;
  onSaveJson: () => void;
  onLoadJson: () => void;
  onResetSample: () => void;
  onNewBlankProject: () => void;
  isAuditedCompliant: boolean;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  projectName,
  onProjectNameChange,
  viewMode,
  onViewModeChange,
  onAutoDimension,
  onAutoRoute,
  onExportDxf,
  onSaveJson,
  onLoadJson,
  onResetSample,
  onNewBlankProject,
  isAuditedCompliant
}) => {
  return (
    <header className="bg-[#0b0f17] border-b border-slate-800 select-none flex flex-col shrink-0">
      {/* Linha 1: Barra de Título Desktop & Ações de Arquivo */}
      <div className="h-10 px-3 flex items-center justify-between text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-amber-400">
            <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-mono text-sm text-slate-100 font-extrabold">OHMVEX</span>
            <span className="text-[10px] font-mono text-orange-400 font-normal">v1.2 NBR 5410</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-700" />

          {/* Nome do Projeto Editável */}
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 px-2 py-0.5 rounded text-slate-200 font-medium border border-transparent focus:border-cyan-500 focus:outline-none transition-colors w-64 text-xs"
            title="Clique para renomear o projeto"
          />

          <span className="text-slate-500 text-[11px] hidden md:inline">
            Offline CAD Engine
          </span>
        </div>

        {/* Status e Ações Rápidas */}
        <div className="flex items-center gap-2">
          {/* Status NBR 5410 */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
            {isAuditedCompliant ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">NBR 5410 Conforme</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">Requer Adequação</span>
              </>
            )}
          </div>

          <div className="h-3 w-[1px] bg-slate-700" />

          {/* Arquivo / Salvar / Carregar */}
          <button
            onClick={onNewBlankProject}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-colors font-semibold"
            title="Criar novo projeto limpo em branco (Zerar área de trabalho)"
          >
            <FilePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo</span>
          </button>

          <button
            onClick={onLoadJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Abrir projeto do disco (.json)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Abrir</span>
          </button>

          <button
            onClick={onSaveJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Salvar projeto localmente (.json)"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>Salvar</span>
          </button>

          <button
            onClick={onExportDxf}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-cyan-50 font-medium transition-colors shadow-sm"
            title="Exportar planta baixa para AutoCAD DXF R2000"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar DXF</span>
          </button>

          <button
            onClick={onResetSample}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Recarregar planta residencial modelo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exemplo</span>
          </button>
        </div>
      </div>

      {/* Linha 2: Modos de Visualização & Gatilhos de Engenharia */}
      <div className="h-11 px-3 flex items-center justify-between text-xs bg-[#0f141c]">
        {/* Modos de Trabalho */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onViewModeChange('cad2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'cad2d'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Planta Baixa CAD 2D</span>
          </button>

          <button
            onClick={() => onViewModeChange('unifilar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'unifilar'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Diagrama Unifilar</span>
          </button>

          <button
            onClick={() => onViewModeChange('bim3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'bim3d'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Visualizador 3D BIM</span>
          </button>

          <button
            onClick={() => onViewModeChange('materiais')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'materiais'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Lista de Materiais (BOM)</span>
          </button>

          <button
            onClick={() => onViewModeChange('auditoria')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              viewMode === 'auditoria'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Auditoria NBR 5410</span>
          </button>
        </div>

        {/* Botões de Ação da Engine de Engenharia */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAutoDimension}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-medium transition-colors"
            title="Dimensionar Iluminação e TUGs por área/perímetro de cada cômodo"
          >
            <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Auto-Dimensionar NBR 5410</span>
          </button>

          <button
            onClick={onAutoRoute}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-medium transition-colors"
            title="Roteamento automático via Dijkstra (Fase, Neutro, Terra, Retornos e Ocupação)"
          >
            <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>Roteamento de Fios & Tubos</span>
          </button>
        </div>
      </div>
    </header>
  );
};
