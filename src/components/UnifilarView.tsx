/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Módulo 4 - Diagrama Unifilar do Quadro de Distribuição (QDC)
 * Barramentos R-S-T/N/PE, Disjuntor Geral, IDR, DPS, Circuitos Terminais e Validação NBR 5410
 */

import React, { useState } from 'react';
import { CircuitInfo, CircuitType, PanelBoard } from '../types/cad';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  Plus,
  Trash2,
  HelpCircle,
  TrendingDown,
  Activity,
  Layers
} from 'lucide-react';
import { Nbr5410Engine } from '../engine/nbr5410Engine';

interface UnifilarViewProps {
  panelBoard: PanelBoard;
  onPanelBoardChange: (panel: PanelBoard) => void;
}

export const UnifilarView: React.FC<UnifilarViewProps> = ({
  panelBoard,
  onPanelBoardChange
}) => {
  const [selectedCircuitId, setSelectedCircuitId] = useState<number | null>(
    panelBoard.circuits[0]?.id || null
  );

  // Totais do Quadro
  const totalPowerVA = panelBoard.circuits.reduce((acc, c) => acc + c.powerVA, 0);
  const totalPowerW = panelBoard.circuits.reduce((acc, c) => acc + c.powerW, 0);
  const maxCurrentCircuit = Math.max(...panelBoard.circuits.map((c) => c.currentIb), 0);

  // Adicionar novo circuito terminal
  const handleAddCircuit = () => {
    const nextId =
      panelBoard.circuits.length > 0
        ? Math.max(...panelBoard.circuits.map((c) => c.id)) + 1
        : 1;

    const newCircuit: CircuitInfo = {
      id: nextId,
      name: `Circuito ${nextId} - Geral`,
      type: 'tug',
      voltage: 127,
      phase: 'F+N',
      powerVA: 1000,
      powerW: 1000,
      currentIb: 7.87,
      conductorGauge: 2.5,
      breakerAmps: 16,
      cableAmpacityIz: 21.6,
      voltageDropPercent: 1.2,
      isCompliant: true,
      notes: 'Tomadas adicionais',
    };

    onPanelBoardChange({
      ...panelBoard,
      circuits: [...panelBoard.circuits, newCircuit],
    });
    setSelectedCircuitId(nextId);
  };

  // Remover circuito
  const handleDeleteCircuit = (id: number) => {
    onPanelBoardChange({
      ...panelBoard,
      circuits: panelBoard.circuits.filter((c) => c.id !== id),
    });
    if (selectedCircuitId === id) {
      setSelectedCircuitId(panelBoard.circuits[0]?.id || null);
    }
  };

  // Recalcular circuito ao editar potência ou tensão
  const handleUpdateCircuit = (id: number, updates: Partial<CircuitInfo>) => {
    const updated = panelBoard.circuits.map((c) => {
      if (c.id === id) {
        const merged = { ...c, ...updates };
        try {
          const sizing = Nbr5410Engine.sizeCircuitBreakerAndCable(
            merged.powerVA,
            merged.voltage,
            merged.type,
            2,
            18
          );
          return {
            ...merged,
            currentIb: sizing.currentIb,
            breakerAmps: sizing.breakerIn,
            conductorGauge: sizing.conductorGauge,
            cableAmpacityIz: sizing.ampacityIz,
            voltageDropPercent: sizing.voltageDropPercent,
            isCompliant: sizing.isCompliant,
          };
        } catch {
          return merged;
        }
      }
      return c;
    });

    onPanelBoardChange({ ...panelBoard, circuits: updated });
  };

  const selectedCircuit = panelBoard.circuits.find((c) => c.id === selectedCircuitId);

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden text-slate-100">
      {/* Barra de Título e Métricas do QDC */}
      <div className="h-14 px-6 border-b border-slate-800 bg-[#0f141f] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              {panelBoard.name}
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                {panelBoard.voltageSystem} ({panelBoard.inletType})
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Disjuntor Geral {panelBoard.mainBreakerAmps}A Curva C · DPS {panelBoard.dpsRatingKA}kA · IDR {panelBoard.idrSensitivityMA}mA
            </p>
          </div>
        </div>

        {/* Resumo de Carga */}
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Potência Total</span>
            <span className="font-semibold text-slate-200 font-mono">
              {(totalPowerVA / 1000).toFixed(2)} kVA / {(totalPowerW / 1000).toFixed(2)} kW
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Circuitos</span>
            <span className="font-semibold text-cyan-400 font-mono">
              {panelBoard.circuits.length} Terminais
            </span>
          </div>

          <button
            onClick={handleAddCircuit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-cyan-50 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Circuito</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Central: Diagrama Gráfico Unifilar + Painel Lateral */}
      <div className="flex-1 flex overflow-hidden">
        {/* Diagrama Esquemático Gráfico (Área Principal) */}
        <div className="flex-1 overflow-auto p-6 bg-[#0a0d14] relative">
          {/* Caixa do QDC Unifilar */}
          <div className="min-w-[900px] bg-[#101520] border-2 border-slate-700 rounded-xl p-6 shadow-2xl space-y-8">
            {/* 1. SEÇÃO DE ENTRADA: Ramal Concessionária -> Geral -> DPS -> IDR */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
              {/* Ramal de Entrada */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entrada Concessionária</span>
                  <div className="flex items-center gap-2 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" title="Fase R" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" title="Fase S" />
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Neutro N" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Proteção PE" />
                    <span className="font-semibold">{panelBoard.voltageSystem}</span>
                  </div>
                </div>

                {/* Seta para Disjuntor Geral */}
                <div className="w-8 h-[2px] bg-slate-700 relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45" />
                </div>

                {/* Disjuntor Geral DTM */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-center min-w-[140px]">
                  <span className="text-[10px] text-amber-300 font-mono font-bold block uppercase">
                    Disjuntor Geral DTM
                  </span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {panelBoard.mainBreakerAmps} A
                  </span>
                  <span className="text-[10px] text-amber-200/70 block">Bipolar / Curva C</span>
                </div>

                {/* Seta para IDR */}
                <div className="w-8 h-[2px] bg-slate-700 relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-700 rotate-45" />
                </div>

                {/* IDR Diferencial Residual 30mA */}
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-center min-w-[140px]">
                  <span className="text-[10px] text-cyan-300 font-mono font-bold block uppercase">
                    IDR Residual
                  </span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">
                    {panelBoard.idrSensitivityMA} mA
                  </span>
                  <span className="text-[10px] text-cyan-200/70 block">Proteção Humana NBR</span>
                </div>

                {/* Bloco de DPS contra Surtos */}
                <div className="ml-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/40 text-center min-w-[130px]">
                  <span className="text-[10px] text-purple-300 font-mono font-bold block uppercase">
                    DPS Classe II
                  </span>
                  <span className="text-lg font-bold text-purple-400 font-mono">
                    {panelBoard.dpsRatingKA} kA
                  </span>
                  <span className="text-[10px] text-purple-200/70 block">Descarregador Surtos</span>
                </div>
              </div>

              {/* Legenda dos Barramentos */}
              <div className="flex flex-col gap-1 text-[11px] font-mono p-2 bg-slate-900 rounded border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-red-500 rounded" />
                  <span className="text-slate-300">Barramento FASE (R/S)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-blue-500 rounded" />
                  <span className="text-slate-300">Barramento NEUTRO (N)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-1 bg-emerald-500 rounded" />
                  <span className="text-slate-300">Barramento PROTEÇÃO (PE)</span>
                </div>
              </div>
            </div>

            {/* 2. BARRAMENTOS HORIZONTAIS DE DISTRIBUIÇÃO */}
            <div className="space-y-1.5 py-1">
              {/* Barra Fase */}
              <div className="h-2 w-full bg-red-600 rounded-sm shadow-sm relative flex items-center">
                <span className="absolute right-2 text-[9px] font-mono text-white/80 font-bold">
                  BARRA DE FASE R/S
                </span>
              </div>
              {/* Barra Neutro */}
              <div className="h-2 w-full bg-blue-600 rounded-sm shadow-sm relative flex items-center">
                <span className="absolute right-2 text-[9px] font-mono text-white/80 font-bold">
                  BARRA DE NEUTRO ISOLADO N
                </span>
              </div>
              {/* Barra Terra PE */}
              <div className="h-2 w-full bg-emerald-600 rounded-sm shadow-sm relative flex items-center">
                <span className="absolute right-2 text-[9px] font-mono text-white/80 font-bold">
                  BARRA DE PROTEÇÃO TERRA PE
                </span>
              </div>
            </div>

            {/* 3. COLUNAS DE CIRCUITOS TERMINAIS DERIVADOS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-4">
              {panelBoard.circuits.map((circuit) => {
                const isSelected = selectedCircuitId === circuit.id;
                return (
                  <div
                    key={circuit.id}
                    onClick={() => setSelectedCircuitId(circuit.id)}
                    className={`cursor-pointer rounded-lg p-3 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Topo: Número e Tipo */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-cyan-400">
                          C-{circuit.id}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            circuit.type === 'iluminacao'
                              ? 'bg-amber-500/20 text-amber-300'
                              : circuit.type === 'tue'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {circuit.type.toUpperCase()}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-200 line-clamp-1" title={circuit.name}>
                        {circuit.name}
                      </h4>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {circuit.powerVA} VA · {circuit.voltage}V ({circuit.phase})
                      </div>
                    </div>

                    {/* Símbolo do Disjuntor DTM */}
                    <div className="my-3 py-2 px-2 bg-slate-950/80 rounded border border-slate-800/90 text-center">
                      <div className="text-[10px] text-slate-400 font-mono">DISJUNTOR DTM</div>
                      <div className="text-base font-bold font-mono text-amber-400">
                        {circuit.breakerAmps} A
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">Curva C</div>
                    </div>

                    {/* Bitola do Condutor */}
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Fiação:</span>
                        <span className="font-bold text-emerald-400">
                          {circuit.conductorGauge} mm²
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>Ib / Iz:</span>
                        <span>
                          {circuit.currentIb}A / {circuit.cableAmpacityIz}A
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>Queda ΔV:</span>
                        <span className={circuit.voltageDropPercent > 4.0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {circuit.voltageDropPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Status de Conformidade */}
                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      {circuit.isCompliant ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Ib ≤ In ≤ Iz</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Não Conforme</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel Lateral Direito: Auditoria e Detalhes do Circuito Selecionado */}
        {selectedCircuit && (
          <div className="w-84 border-l border-slate-800 bg-[#0f141f] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Detalhes do Circuito</span>
                  <h3 className="font-bold text-slate-100 text-sm">
                    Circuito {selectedCircuit.id}
                  </h3>
                </div>
                <button
                  onClick={() => handleDeleteCircuit(selectedCircuit.id)}
                  className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  title="Excluir este circuito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Edição de Nome e Tipo */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono">Nome / Descrição:</label>
                  <input
                    type="text"
                    value={selectedCircuit.name}
                    onChange={(e) => handleUpdateCircuit(selectedCircuit.id, { name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 mt-1 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono">Tipo NBR:</label>
                    <select
                      value={selectedCircuit.type}
                      onChange={(e) =>
                        handleUpdateCircuit(selectedCircuit.id, {
                          type: e.target.value as CircuitType,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 mt-1 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="iluminacao">Iluminação</option>
                      <option value="tug">TUG (Geral)</option>
                      <option value="tue">TUE (Específico)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono">Tensão Nominal:</label>
                    <select
                      value={selectedCircuit.voltage}
                      onChange={(e) =>
                        handleUpdateCircuit(selectedCircuit.id, {
                          voltage: parseInt(e.target.value),
                          phase: parseInt(e.target.value) === 220 ? 'F+F' : 'F+N',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 mt-1 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="127">127 V (F+N)</option>
                      <option value="220">220 V (F+F)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono">Potência (VA):</label>
                    <input
                      type="number"
                      step="50"
                      value={selectedCircuit.powerVA}
                      onChange={(e) =>
                        handleUpdateCircuit(selectedCircuit.id, {
                          powerVA: parseFloat(e.target.value) || 100,
                          powerW: parseFloat(e.target.value) || 100,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 mt-1 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] uppercase font-mono">Disjuntor In (A):</label>
                    <select
                      value={selectedCircuit.breakerAmps}
                      onChange={(e) =>
                        handleUpdateCircuit(selectedCircuit.id, {
                          breakerAmps: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-slate-200 mt-1 focus:border-cyan-500 focus:outline-none font-mono"
                    >
                      {[10, 16, 20, 25, 32, 40, 50, 63].map((amp) => (
                        <option key={amp} value={amp}>
                          {amp} A
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Caixa de Verificação da NBR 5410 */}
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Critério de Proteção NBR 5410
                </span>

                <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Corrente de Projeto (Ib):</span>
                    <span className="text-cyan-400 font-bold">{selectedCircuit.currentIb} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Disjuntor Nominal (In):</span>
                    <span className="text-amber-400 font-bold">{selectedCircuit.breakerAmps} A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacidade Cabo (Iz):</span>
                    <span className="text-emerald-400 font-bold">{selectedCircuit.cableAmpacityIz} A</span>
                  </div>
                </div>

                {/* Fórmula e Veredito */}
                <div className="text-[11px] font-mono text-center p-2 rounded bg-slate-800/50">
                  {selectedCircuit.currentIb} A (Ib) ≤ {selectedCircuit.breakerAmps} A (In) ≤ {selectedCircuit.cableAmpacityIz} A (Iz)
                </div>

                {selectedCircuit.isCompliant ? (
                  <div className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Condutores e disjuntor 100% protegidos contra sobrecargas.</span>
                  </div>
                ) : (
                  <div className="text-rose-400 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Incompatível: In deve ser maior ou igual a Ib e menor ou igual a Iz.</span>
                  </div>
                )}
              </div>

              {/* Queda de Tensão */}
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                    Queda de Tensão Estimada:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {selectedCircuit.voltageDropPercent}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Limite máximo da NBR 5410 item 6.2.7 a partir do QDC: 4.0%.
                </div>
              </div>
            </div>

            {/* Nota de Rodapé */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Dimensionado segundo NBR 5410 Método B1 (PVC 70°C).</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
