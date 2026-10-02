/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Modal de Orçamento e Custos da Instalação ($)
 * Planilha quantitativa precificada com base em tabelas SINAPI e preços médios de mercado
 */

import React, { useState } from 'react';
import { ProjectData } from '../../types/cad';
import { X, DollarSign, Download, Printer, FileSpreadsheet } from 'lucide-react';

interface BudgetModalProps {
  project: ProjectData;
  onClose: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ project, onClose }) => {
  const [laborPercent, setLaborPercent] = useState<number>(45); // 45% do custo de material em mão de obra especializada

  // Quantitativo estimado
  let cable15Meters = 0;
  let cable25Meters = 0;
  let cable40Meters = 0;
  let cable60Meters = 0;
  let conduitDn20Meters = 0;
  let conduitDn25Meters = 0;

  for (const c of project.conduits) {
    const len = c.lengthMeters + 0.6;
    if (c.diameterNominal === 25) conduitDn25Meters += c.lengthMeters;
    else conduitDn20Meters += c.lengthMeters;

    for (const w of c.wires || []) {
      if (w.wireGauge <= 1.5) cable15Meters += len;
      else if (w.wireGauge <= 2.5) cable25Meters += len;
      else if (w.wireGauge <= 4.0) cable40Meters += len;
      else cable60Meters += len;
    }
  }

  // Se não foi roteado ainda, estima pelas cargas
  if (cable15Meters === 0) cable15Meters = 120;
  if (cable25Meters === 0) cable25Meters = 180;
  if (cable60Meters === 0) cable60Meters = 40;
  if (conduitDn20Meters === 0) conduitDn20Meters = 85;
  if (conduitDn25Meters === 0) conduitDn25Meters = 45;

  const lightPoints = project.symbols.filter((s) => s.type.startsWith('luz')).length || 6;
  const tugPoints = project.symbols.filter((s) => s.type.startsWith('tug')).length || 12;
  const tuePoints = project.symbols.filter((s) => s.type.startsWith('tue')).length || 2;
  const switchPoints = project.symbols.filter((s) => s.type.startsWith('inter')).length || 6;

  // Itens do orçamento com preços médios em BRL
  const budgetItems = [
    { desc: 'Cabo Cobre Flexível 1,5mm² 750V (Fase/Neutro/Retorno)', qtd: Math.ceil(cable15Meters), unit: 'm', unitPrice: 2.20 },
    { desc: 'Cabo Cobre Flexível 2,5mm² 750V (Fase/Neutro/Terra)', qtd: Math.ceil(cable25Meters), unit: 'm', unitPrice: 3.80 },
    { desc: 'Cabo Cobre Flexível 6,0mm² 750V (Chuveiro / TUE)', qtd: Math.ceil(cable60Meters), unit: 'm', unitPrice: 8.90 },
    { desc: 'Eletroduto Flexível Corrugado PVC DN 20 (1/2")', qtd: Math.ceil(conduitDn20Meters), unit: 'm', unitPrice: 2.70 },
    { desc: 'Eletroduto Flexível Corrugado PVC DN 25 (3/4")', qtd: Math.ceil(conduitDn25Meters), unit: 'm', unitPrice: 3.90 },
    { desc: `Quadro de Distribuição Embutido (${project.panelBoard.circuits.length + 6} DIN) c/ Barramento`, qtd: 1, unit: 'un', unitPrice: 195.00 },
    { desc: `Disjuntor Termomagnético Geral Bipolar ${project.panelBoard.mainBreakerAmps}A Curva C`, qtd: 1, unit: 'un', unitPrice: 52.00 },
    { desc: `Interruptor Diferencial Residual (IDR) ${project.panelBoard.idrSensitivityMA}mA Proteção Choque`, qtd: 1, unit: 'un', unitPrice: 145.00 },
    { desc: `Dispositivo Protetor contra Surtos (DPS) Classe II ${project.panelBoard.dpsRatingKA}kA`, qtd: 3, unit: 'un', unitPrice: 68.00 },
    { desc: 'Disjuntores DIN Unipolares Curva C (10A a 32A)', qtd: project.panelBoard.circuits.length, unit: 'un', unitPrice: 19.50 },
    { desc: 'Caixa de Passagem Octogonal 4x4 Fundo Móvel PVC Teto', qtd: lightPoints, unit: 'un', unitPrice: 5.60 },
    { desc: 'Caixa de Embutir 4x2 Retangular Parede Alvenaria', qtd: tugPoints + switchPoints + tuePoints, unit: 'un', unitPrice: 3.40 },
    { desc: 'Conjunto Tomada 2P+T 10A 250V com Placa 4x2', qtd: tugPoints, unit: 'un', unitPrice: 14.50 },
    { desc: 'Conjunto Tomada 2P+T 20A / Conector Porcelana (TUE)', qtd: tuePoints, unit: 'un', unitPrice: 22.00 },
    { desc: 'Conjunto Interruptor Simples/Paralelo com Placa 4x2', qtd: switchPoints, unit: 'un', unitPrice: 15.80 },
    { desc: 'Luminárias Plafonier LED Embutir/Sobrepor', qtd: lightPoints, unit: 'un', unitPrice: 42.00 },
  ];

  const totalMaterial = budgetItems.reduce((acc, item) => acc + item.qtd * item.unitPrice, 0);
  const totalLabor = (totalMaterial * laborPercent) / 100;
  const totalGeneral = totalMaterial + totalLabor;

  const handleExportCsv = () => {
    const headers = ['Descricao', 'Quantidade', 'Unidade', 'Preco_Unitario_BRL', 'Total_BRL'];
    const rows = budgetItems.map((i) => [
      `"${i.desc}"`,
      i.qtd,
      `"${i.unit}"`,
      i.unitPrice.toFixed(2),
      (i.qtd * i.unitPrice).toFixed(2),
    ]);
    rows.push(['"SUBTOTAL MATERIAIS"', 1, '"un"', totalMaterial.toFixed(2), totalMaterial.toFixed(2)]);
    rows.push([`"MAO DE OBRA ESPECIALIZADA (${laborPercent}%)"`, 1, '"un"', totalLabor.toFixed(2), totalLabor.toFixed(2)]);
    rows.push(['"TOTAL GERAL ESTIMADO"', 1, '"un"', totalGeneral.toFixed(2), totalGeneral.toFixed(2)]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Orcamento_${project.projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Topo */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-200 text-amber-900">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 font-mono">
                Orçamento Estimado & Quantitativo de Custos ($)
              </h2>
              <p className="text-xs text-slate-500">
                Preços médios praticados no mercado nacional / SINAPI para instalações elétricas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabela de Preços */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          <table className="w-full border-collapse border border-slate-300 text-left font-sans">
            <thead className="bg-slate-100 font-mono text-[11px] uppercase text-slate-700">
              <tr>
                <th className="border border-slate-300 p-2.5">Descrição do Item</th>
                <th className="border border-slate-300 p-2.5 text-right">Qtd</th>
                <th className="border border-slate-300 p-2.5 text-center">Unid.</th>
                <th className="border border-slate-300 p-2.5 text-right">Preço Unit. (R$)</th>
                <th className="border border-slate-300 p-2.5 text-right">Total (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {budgetItems.map((item, idx) => {
                const totalItem = item.qtd * item.unitPrice;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 font-medium text-slate-900">{item.desc}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">{item.qtd}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-slate-500">{item.unit}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-900">
                      {totalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Resumo Final de Valores e Mão de Obra */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-300 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-600">Subtotal de Materiais e Equipamentos:</span>
              <span className="font-bold text-sm text-slate-900">
                R$ {totalMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Mão de Obra de Instalação e Montagem:</span>
                <select
                  value={laborPercent}
                  onChange={(e) => setLaborPercent(parseInt(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
                >
                  <option value="35">35% do material</option>
                  <option value="45">45% (Padrão médio)</option>
                  <option value="60">60% (Alto padrão)</option>
                </select>
              </div>
              <span className="font-bold text-sm text-amber-800">
                R$ {totalLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm font-mono pt-2 border-t-2 border-slate-900 font-extrabold">
              <span className="text-slate-900 text-base">CUSTO TOTAL ESTIMADO DA OBRA:</span>
              <span className="text-lg text-emerald-800">
                R$ {totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
