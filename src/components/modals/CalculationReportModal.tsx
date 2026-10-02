/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Modal do Memorial de Cálculo NBR 5410
 * Detalhamento matemático de Iluminação (9.5.2.1), TUGs (9.5.2.2),
 * Ampacidade (Tabela 36), Condição de Proteção Ib <= In <= Iz e Queda de Tensão.
 */

import React from 'react';
import { ProjectData } from '../../types/cad';
import { Nbr5410Engine } from '../../engine/nbr5410Engine';
import { X, Printer, Download, Calculator, CheckCircle2 } from 'lucide-react';

interface CalculationReportModalProps {
  project: ProjectData;
  onClose: () => void;
}

export const CalculationReportModal: React.FC<CalculationReportModalProps> = ({
  project,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Topo do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-100 text-emerald-800">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 font-mono">
                Memorial de Cálculo & Dimensionamento NBR 5410:2004
              </h2>
              <p className="text-xs text-slate-500">
                {project.projectName} · Responsável: {project.author} · Tensão Nominal: {project.voltageNominal}V
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Relatório */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 font-sans text-xs bg-white">
          {/* Seção 1: Dados Gerais da Obra */}
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-1 font-mono uppercase text-emerald-800">
              1. Identificação do Projeto e Premissas Normativas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Projeto:</span>
                <span className="font-bold text-slate-900">{project.projectName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Norma Regulamentadora:</span>
                <span className="font-bold text-slate-900">ABNT NBR 5410:2004</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sistema de Fornecimento:</span>
                <span className="font-bold text-slate-900">{project.panelBoard.voltageSystem} ({project.panelBoard.inletType})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Método de Instalação:</span>
                <span className="font-bold text-slate-900">B1 (Alvenaria Embutida)</span>
              </div>
            </div>
          </section>

          {/* Seção 2: Memória de Cálculo de Iluminação (Item 9.5.2.1) */}
          <section className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-1 font-mono uppercase text-emerald-800">
              2. Previsão de Cargas de Iluminação (NBR 5410 Item 9.5.2.1)
            </h3>
            <p className="text-slate-600 text-[11px]">
              Critério: Em cômodos com área até 6,0 m², atribui-se potência mínima de 100 VA.
              Em cômodos com área superior a 6,0 m², atribui-se 100 VA para os primeiros 6,0 m², acrescido de 60 VA para cada aumento completo de 4,0 m².
            </p>

            <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
              <thead className="bg-slate-100 font-mono uppercase text-slate-700">
                <tr>
                  <th className="border border-slate-300 p-2">Cômodo</th>
                  <th className="border border-slate-300 p-2 text-right">Área (m²)</th>
                  <th className="border border-slate-300 p-2">Fórmula Aplicada</th>
                  <th className="border border-slate-300 p-2 text-right">Mínimo Exigido</th>
                  <th className="border border-slate-300 p-2 text-right">Instalado</th>
                  <th className="border border-slate-300 p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {project.rooms.map((room) => {
                  const calc = Nbr5410Engine.calculateLighting(room.name, room.area);
                  const installed = project.symbols
                    .filter((s) => s.roomId === room.id && s.type.startsWith('luz'))
                    .reduce((sum, s) => sum + s.powerVA, 0);
                  const ok = installed >= calc.minimumVA;

                  return (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-medium">{room.name}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{room.area.toFixed(1)}</td>
                      <td className="border border-slate-300 p-2 text-slate-600 font-mono text-[10px]">{calc.formulaDescription}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">{calc.minimumVA} VA</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{installed} VA</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        <span className={ok ? 'text-emerald-700' : 'text-amber-700'}>
                          {ok ? 'CONFORME' : 'ADEQUAR'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Seção 3: Previsão de Cargas de Tomadas TUG (Item 9.5.2.2) */}
          <section className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-1 font-mono uppercase text-emerald-800">
              3. Previsão de Cargas de Tomadas de Uso Geral - TUG (NBR 5410 Item 9.5.2.2)
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
              <thead className="bg-slate-100 font-mono uppercase text-slate-700">
                <tr>
                  <th className="border border-slate-300 p-2">Cômodo</th>
                  <th className="border border-slate-300 p-2 text-right">Perímetro (m)</th>
                  <th className="border border-slate-300 p-2">Regra de Dimensionamento</th>
                  <th className="border border-slate-300 p-2 text-right">Pontos Mínimos</th>
                  <th className="border border-slate-300 p-2 text-right">Potência Mínima</th>
                  <th className="border border-slate-300 p-2 text-right">Instalado</th>
                </tr>
              </thead>
              <tbody>
                {project.rooms.map((room) => {
                  const calc = Nbr5410Engine.calculateTugs(room.name, room.type, room.perimeter, room.area);
                  const installedTugs = project.symbols.filter(
                    (s) => s.roomId === room.id && s.type.startsWith('tug')
                  );
                  const installedCount = installedTugs.length;
                  const installedVA = installedTugs.reduce((sum, s) => sum + s.powerVA, 0);

                  return (
                    <tr key={room.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2 font-medium">{room.name}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{room.perimeter.toFixed(1)}</td>
                      <td className="border border-slate-300 p-2 text-slate-600 font-mono text-[10px]">{calc.formulaDescription}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">{calc.minimumTugs}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-bold">{calc.totalVA} VA</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">
                        {installedCount} pts ({installedVA} VA)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Seção 4: Dimensionamento de Condutores e Disjuntores (Ib <= In <= Iz) */}
          <section className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-1 font-mono uppercase text-emerald-800">
              4. Dimensionamento e Coordenação de Disjuntores e Condutores
            </h3>
            <p className="text-slate-600 text-[11px]">
              Critério Rigoroso: $I_b \le I_n \le I_z$ e $\Delta V \le 4.0\%$, com cabos de cobre isolados em PVC 70°C Método B1.
            </p>

            <table className="w-full border-collapse border border-slate-300 text-left text-[11px]">
              <thead className="bg-slate-100 font-mono uppercase text-slate-700">
                <tr>
                  <th className="border border-slate-300 p-2">Circ.</th>
                  <th className="border border-slate-300 p-2">Descrição</th>
                  <th className="border border-slate-300 p-2 text-right">Potência</th>
                  <th className="border border-slate-300 p-2 text-right">Ib (A)</th>
                  <th className="border border-slate-300 p-2 text-right">Disjuntor In</th>
                  <th className="border border-slate-300 p-2 text-right">Cabo (mm²)</th>
                  <th className="border border-slate-300 p-2 text-right">Iz Corrigido</th>
                  <th className="border border-slate-300 p-2 text-right">Queda ΔV</th>
                  <th className="border border-slate-300 p-2 text-center">Proteção</th>
                </tr>
              </thead>
              <tbody>
                {project.panelBoard.circuits.map((circ) => (
                  <tr key={circ.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-mono font-bold text-cyan-800">C-{circ.id}</td>
                    <td className="border border-slate-300 p-2 font-medium">{circ.name}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{circ.powerVA} VA</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">{circ.currentIb} A</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-amber-700">{circ.breakerAmps} A</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-emerald-700">{circ.conductorGauge} mm²</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{circ.cableAmpacityIz} A</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{circ.voltageDropPercent}%</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      <span className={circ.isCompliant ? 'text-emerald-700' : 'text-red-700'}>
                        {circ.isCompliant ? 'OK (Ib ≤ In ≤ Iz)' : 'NÃO CONFORME'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Assinatura / Encerramento do Laudo */}
          <div className="pt-8 border-t border-slate-300 flex justify-between items-center text-slate-500 font-mono text-[10px]">
            <div>
              <span>OPEN-WOCA CAD Elétrico · Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="text-right">
              <span className="block border-t border-slate-400 w-48 mt-4 pt-1 text-center font-sans font-medium text-slate-700">
                Engenheiro Eletricista Responsável
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
