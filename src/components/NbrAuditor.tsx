/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Auditor de Conformidade e Dimensionamento NBR 5410
 * Verificação automatizada cômodo a cômodo (Iluminação 9.5.2.1, TUGs 9.5.2.2 e Separação 9.5.3)
 */

import React from 'react';
import {
  ElectricalSymbol,
  PanelBoard,
  ProjectData,
  RoomDefinition
} from '../types/cad';
import { Nbr5410Engine } from '../engine/nbr5410Engine';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Sparkles,
  Info,
  Layers,
  Activity
} from 'lucide-react';

interface NbrAuditorProps {
  rooms: RoomDefinition[];
  symbols: ElectricalSymbol[];
  panelBoard: PanelBoard;
  onApplyAutoCompliance: () => void;
}

export const NbrAuditor: React.FC<NbrAuditorProps> = ({
  rooms,
  symbols,
  panelBoard,
  onApplyAutoCompliance
}) => {
  // Análise cômodo por cômodo
  const roomReports = rooms.map((room) => {
    // 1. Cálculos teóricos normativos
    const lightReq = Nbr5410Engine.calculateLighting(room.name, room.area);
    const tugReq = Nbr5410Engine.calculateTugs(room.name, room.type, room.perimeter, room.area);

    // 2. Aparelhos realmente instalados no cômodo
    const roomSymbols = symbols.filter((s) => s.roomId === room.id);
    const installedLightVA = roomSymbols
      .filter((s) => s.type === 'luz_teto' || s.type === 'luz_arandela')
      .reduce((sum, s) => sum + s.powerVA, 0);

    const installedTugs = roomSymbols.filter(
      (s) => s.type === 'tug_baixa' || s.type === 'tug_media' || s.type === 'tug_alta'
    );
    const installedTugCount = installedTugs.length;
    const installedTugVA = installedTugs.reduce((sum, s) => sum + s.powerVA, 0);

    // 3. Verificações de conformidade
    const isLightingOk = installedLightVA >= lightReq.minimumVA;
    const isTugCountOk = installedTugCount >= tugReq.minimumTugs;
    const isTugPowerOk = installedTugVA >= tugReq.totalVA;

    return {
      room,
      lightReq,
      tugReq,
      installedLightVA,
      installedTugCount,
      installedTugVA,
      isLightingOk,
      isTugCountOk,
      isTugPowerOk,
      isFullyCompliant: isLightingOk && isTugCountOk && isTugPowerOk,
    };
  });

  const totalRooms = roomReports.length;
  const compliantRooms = roomReports.filter((r) => r.isFullyCompliant).length;
  const overallPercentage = totalRooms > 0 ? Math.round((compliantRooms / totalRooms) * 100) : 100;

  // Verificação de Separação de Circuitos (Item 9.5.3)
  const circuitsWithBoth = panelBoard.circuits.filter((c) => {
    const circSymbols = symbols.filter((s) => s.circuitId === c.id);
    const hasLight = circSymbols.some((s) => s.type === 'luz_teto' || s.type === 'luz_arandela');
    const hasTug = circSymbols.some(
      (s) => s.type === 'tug_baixa' || s.type === 'tug_media' || s.type === 'tug_alta'
    );
    return hasLight && hasTug;
  });

  const isCircuitSeparationOk = circuitsWithBoth.length === 0;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden text-slate-100">
      {/* Topo: Scorecard de Conformidade */}
      <div className="h-16 px-6 border-b border-slate-800 bg-[#0f141f] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-lg border ${
              overallPercentage === 100 && isCircuitSeparationOk
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              Auditoria de Conformidade Técnica NBR 5410
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono ${
                  overallPercentage === 100 && isCircuitSeparationOk
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {overallPercentage}% dos Cômodos Adequados
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo automatizado de cargas mínimas, quantidades de pontos e limites de segurança
            </p>
          </div>
        </div>

        {/* Botão de Auto-Adequação */}
        <button
          onClick={onApplyAutoCompliance}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10"
          title="Inserir e adequar todos os pontos de iluminação e tomadas para 100% de conformidade"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Adequar Automaticamente à Norma</span>
        </button>
      </div>

      {/* Checklist Normativo Rápido */}
      <div className="p-6 border-b border-slate-800 bg-[#0c1018] grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 text-xs">
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Item 9.5.2.1 - Iluminação</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Mínimo 100VA até 6m² + 60VA por acréscimo de 4m² completos.
          </p>
        </div>

        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Item 9.5.2.2 - TUGs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400">
            Cozinhas: 1 tomada / 3.5m (3x 600VA). Salas/Quartos: 1 tomada / 5.0m (100VA). Banheiro: 600VA.
          </p>
        </div>

        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200">Item 9.5.3 - Separação</span>
            {isCircuitSeparationOk ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Circuitos de iluminação devem ser independentes dos circuitos de tomadas (TUG).
          </p>
        </div>
      </div>

      {/* Relatório Detalhado Cômodo por Cômodo */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {roomReports.map(({ room, lightReq, tugReq, installedLightVA, installedTugCount, installedTugVA, isLightingOk, isTugCountOk, isTugPowerOk, isFullyCompliant }) => (
          <div
            key={room.id}
            className={`p-4 rounded-xl border transition-all ${
              isFullyCompliant
                ? 'bg-[#101622] border-slate-800'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-100 text-sm">{room.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {room.area.toFixed(1)} m² · 2P: {room.perimeter.toFixed(1)} m
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                  {room.type}
                </span>
              </div>

              {isFullyCompliant ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Conforme</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Requer Adequação</span>
                </div>
              )}
            </div>

            {/* Comparativos de Iluminação e TUG */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
              {/* Iluminação */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400 font-sans">Iluminação Mínima:</span>
                  <span className={isLightingOk ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    Instalado: {installedLightVA} VA / Exigido: {lightReq.minimumVA} VA
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {lightReq.formulaDescription}
                </div>
              </div>

              {/* TUGs */}
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-400 font-sans">Tomadas (TUGs):</span>
                  <span
                    className={
                      isTugCountOk && isTugPowerOk
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    Instalado: {installedTugCount} pts ({installedTugVA}VA) / Exigido: {tugReq.minimumTugs} pts ({tugReq.totalVA}VA)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {tugReq.formulaDescription}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
