/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Modal de Tabela de Cargas e Balanceamento de Fases (R-S-T)
 * Distribuição percentual de potência entre fases e verificação de desequilíbrio NBR 5410
 */

import React from 'react';
import { ProjectData } from '../../types/cad';
import { X, GitBranch, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface LoadBalanceModalProps {
  project: ProjectData;
  onClose: () => void;
}

export const LoadBalanceModal: React.FC<LoadBalanceModalProps> = ({ project, onClose }) => {
  // Cálculo de potência por fase R e S
  let phaseR_VA = 0;
  let phaseS_VA = 0;

  project.panelBoard.circuits.forEach((c, index) => {
    if (c.phase === 'F+F') {
      phaseR_VA += c.powerVA / 2;
      phaseS_VA += c.powerVA / 2;
    } else {
      // Distribui circuitos alternadamente entre as fases R e S
      if (index % 2 === 0) phaseR_VA += c.powerVA;
      else phaseS_VA += c.powerVA;
    }
  });

  const totalVA = phaseR_VA + phaseS_VA;
  const maxPhase = Math.max(phaseR_VA, phaseS_VA);
  const minPhase = Math.min(phaseR_VA, phaseS_VA);
  const imbalancePercent = totalVA > 0 ? Number((((maxPhase - minPhase) / totalVA) * 100).toFixed(1)) : 0;
  const isBalanced = imbalancePercent <= 10.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Topo */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-100 text-cyan-800">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 font-mono">
                Tabela de Cargas & Balanceamento de Fases (R-S-T)
              </h2>
              <p className="text-xs text-slate-500">
                Alocação equilibrada de potências no barramento principal conforme NBR 5410
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {/* Indicadores de Fase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
              <span className="text-[11px] font-mono text-red-700 font-bold block uppercase">Fase R</span>
              <div className="text-2xl font-bold font-mono text-slate-900">{phaseR_VA.toFixed(0)} VA</div>
              <span className="text-[10px] text-slate-500 font-mono">
                {totalVA > 0 ? ((phaseR_VA / totalVA) * 100).toFixed(1) : 0}% da carga total
              </span>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
              <span className="text-[11px] font-mono text-blue-700 font-bold block uppercase">Fase S</span>
              <div className="text-2xl font-bold font-mono text-slate-900">{phaseS_VA.toFixed(0)} VA</div>
              <span className="text-[10px] text-slate-500 font-mono">
                {totalVA > 0 ? ((phaseS_VA / totalVA) * 100).toFixed(1) : 0}% da carga total
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${isBalanced ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold block uppercase text-slate-700">Desequilíbrio</span>
                {isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">{imbalancePercent}%</div>
              <span className="text-[10px] text-slate-500 font-mono">
                {isBalanced ? 'Equilibrado (≤ 10% tolerância NBR)' : 'Desbalanceado (> 10%)'}
              </span>
            </div>
          </div>

          {/* Tabela de Circuitos e Alocação de Fases */}
          <div>
            <h3 className="font-bold text-sm text-slate-900 border-b pb-1 font-mono uppercase text-slate-700 mb-3">
              Mapeamento de Circuitos por Fase
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
              <thead className="bg-slate-100 font-mono text-slate-700 uppercase">
                <tr>
                  <th className="border p-2">Circ.</th>
                  <th className="border p-2">Descrição</th>
                  <th className="border p-2">Tipo</th>
                  <th className="border p-2 text-right">Potência (VA)</th>
                  <th className="border p-2 text-center">Fase(s)</th>
                  <th className="border p-2 text-right">Carga Fase R (VA)</th>
                  <th className="border p-2 text-right">Carga Fase S (VA)</th>
                </tr>
              </thead>
              <tbody>
                {project.panelBoard.circuits.map((c, idx) => {
                  const isFF = c.phase === 'F+F';
                  const rVal = isFF ? c.powerVA / 2 : idx % 2 === 0 ? c.powerVA : 0;
                  const sVal = isFF ? c.powerVA / 2 : idx % 2 !== 0 ? c.powerVA : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="border p-2 font-mono font-bold text-cyan-800">C-{c.id}</td>
                      <td className="border p-2 font-medium">{c.name}</td>
                      <td className="border p-2 uppercase font-mono text-[10px] text-slate-500">{c.type}</td>
                      <td className="border p-2 text-right font-mono">{c.powerVA}</td>
                      <td className="border p-2 text-center font-mono font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {isFF ? 'R + S' : idx % 2 === 0 ? 'R' : 'S'}
                        </span>
                      </td>
                      <td className="border p-2 text-right font-mono text-red-700 font-semibold">{rVal > 0 ? rVal.toFixed(0) : '-'}</td>
                      <td className="border p-2 text-right font-mono text-blue-700 font-semibold">{sVal > 0 ? sVal.toFixed(0) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
