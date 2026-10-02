/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Módulo 4 - Lista de Materiais Consolidada (BOM)
 * Quantificação exata de condutores por bitola/cor, eletrodutos, disjuntores, caixas e dispositivos
 */

import React, { useState } from 'react';
import {
  ConduitSegment,
  ElectricalSymbol,
  MaterialItem,
  PanelBoard
} from '../types/cad';
import {
  Download,
  Printer,
  Package,
  Layers,
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface BillOfMaterialsProps {
  symbols: ElectricalSymbol[];
  conduits: ConduitSegment[];
  panelBoard: PanelBoard;
  projectName: string;
}

export const BillOfMaterials: React.FC<BillOfMaterialsProps> = ({
  symbols,
  conduits,
  panelBoard,
  projectName
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. CÁLCULO DE CONDUTORES (Metragem linear por bitola e cor)
  const wireTotals: Record<string, { gauge: number; type: string; color: string; meters: number }> = {};

  for (const conduit of conduits) {
    const wireLength = conduit.lengthMeters + 0.60; // 30cm de sobra em cada ponta para ligação
    for (const wire of conduit.wires || []) {
      const key = `${wire.wireGauge}_${wire.type}`;
      if (!wireTotals[key]) {
        let colorName = 'Preto / Vermelho';
        if (wire.type === 'neutro') colorName = 'Azul Claro (NBR 5410 6.1.5.3.1)';
        else if (wire.type === 'terra') colorName = 'Verde / Verde-Amarelo (PE)';
        else if (wire.type === 'retorno') colorName = 'Amarelo';

        wireTotals[key] = {
          gauge: wire.wireGauge,
          type: wire.type,
          color: colorName,
          meters: 0,
        };
      }
      wireTotals[key].meters += wireLength;
    }
  }

  // 2. CÁLCULO DE ELETRODUTOS
  const conduitTotals: Record<number, number> = {};
  for (const conduit of conduits) {
    const dn = conduit.diameterNominal || 20;
    conduitTotals[dn] = (conduitTotals[dn] || 0) + conduit.lengthMeters * 1.10; // 10% perda de corte
  }

  // 3. CONSOLIDAÇÃO DA LISTA DE ITENS
  const items: MaterialItem[] = [];

  // Cabos
  Object.values(wireTotals).forEach((wt) => {
    items.push({
      id: `cabo_${wt.gauge}_${wt.type}`,
      category: 'Cabos',
      description: `Cabo de Cobre Unipolar Flexível 750V/1kV - ${wt.type.toUpperCase()}`,
      quantity: Math.ceil(wt.meters),
      unit: 'metros',
      specification: `Seção ${wt.gauge} mm² · Isolação PVC 70°C · Cor: ${wt.color}`,
    });
  });

  // Eletrodutos
  Object.entries(conduitTotals).forEach(([dnStr, meters]) => {
    const dn = Number(dnStr);
    items.push({
      id: `eletroduto_${dn}`,
      category: 'Eletrodutos',
      description: `Eletroduto Corrugado Flexível / Rígido PVC - DN ${dn}`,
      quantity: Math.ceil(meters),
      unit: 'metros',
      specification: `Norma NBR 15465 · Diâmetro Nominal ${dn}mm (${dn === 20 ? '1/2"' : dn === 25 ? '3/4"' : '1"'})`,
    });
  });

  // Disjuntores e Proteção
  items.push({
    id: 'dtm_geral',
    category: 'Dispositivos',
    description: `Disjuntor Termomagnético Geral (DTM)`,
    quantity: 1,
    unit: 'peça',
    specification: `Corrente Nominal ${panelBoard.mainBreakerAmps}A · Bipolar / Tripolar · Curva C 3kA`,
  });

  items.push({
    id: 'idr_geral',
    category: 'Dispositivos',
    description: `Interruptor Diferencial Residual (IDR)`,
    quantity: 1,
    unit: 'peça',
    specification: `Sensibilidade ${panelBoard.idrSensitivityMA}mA · Proteção Humana Contra Choques NBR 5410`,
  });

  items.push({
    id: 'dps_geral',
    category: 'Dispositivos',
    description: `Dispositivo Protetor Contra Surtos Atmosféricos (DPS)`,
    quantity: panelBoard.inletType === 'Trifásico' ? 4 : panelBoard.inletType === 'Bifásico' ? 3 : 2,
    unit: 'peças',
    specification: `Classe II · Tensão 275V · Capacidade de Descarga ${panelBoard.dpsRatingKA}kA`,
  });

  // Disjuntores dos circuitos derivados agrupados por amperagem
  const breakerCounts: Record<number, number> = {};
  for (const circ of panelBoard.circuits) {
    breakerCounts[circ.breakerAmps] = (breakerCounts[circ.breakerAmps] || 0) + 1;
  }
  Object.entries(breakerCounts).forEach(([amps, count]) => {
    items.push({
      id: `dtm_${amps}`,
      category: 'Dispositivos',
      description: `Disjuntor Termomagnético DIN Unipolar (DTM) ${amps}A`,
      quantity: count,
      unit: 'peças',
      specification: `Norma NBR NM 60898 · Curva C · ${amps}A`,
    });
  });

  // Caixas de Passagem
  const octoBoxes = symbols.filter((s) => s.type === 'luz_teto').length;
  const wallBoxes4x2 = symbols.filter(
    (s) =>
      s.type === 'tug_baixa' ||
      s.type === 'tug_media' ||
      s.type === 'tug_alta' ||
      s.type === 'tue_alta' ||
      s.type === 'interruptor_simples' ||
      s.type === 'interruptor_paralelo'
  ).length;

  if (octoBoxes > 0) {
    items.push({
      id: 'cx_octo',
      category: 'Caixas',
      description: 'Caixa Octogonal de Fundo Móvel 4x4 em PVC para Laje',
      quantity: octoBoxes,
      unit: 'peças',
      specification: 'Fixação em laje/teto com saídas de 20 e 25mm para eletrodutos',
    });
  }

  if (wallBoxes4x2 > 0) {
    items.push({
      id: 'cx_4x2',
      category: 'Caixas',
      description: 'Caixa de Embutir 4x2 Retangular Amarela em PVC para Alvenaria',
      quantity: wallBoxes4x2,
      unit: 'peças',
      specification: 'Entradas para eletrodutos de 20, 25 e 32mm',
    });
  }

  items.push({
    id: 'cx_qdc',
    category: 'Caixas',
    description: `Quadro de Distribuição de Circuitos Embutido (QDC)`,
    quantity: 1,
    unit: 'unidade',
    specification: `Capacidade para no mínimo ${panelBoard.circuits.length + 6} disjuntores DIN com barramentos inclusos`,
  });

  // Tomadas e Interruptores
  const tugCount = symbols.filter(
    (s) => s.type === 'tug_baixa' || s.type === 'tug_media' || s.type === 'tug_alta'
  ).length;
  const tueCount = symbols.filter((s) => s.type === 'tue_alta').length;
  const switchSimpleCount = symbols.filter((s) => s.type === 'interruptor_simples').length;
  const switchParaleloCount = symbols.filter((s) => s.type === 'interruptor_paralelo').length;

  if (tugCount > 0) {
    items.push({
      id: 'mod_tug',
      category: 'Acessórios',
      description: 'Módulo de Tomada 2P+T 10A / 250V (Padrão Brasileiro NBR 14136)',
      quantity: tugCount,
      unit: 'peças',
      specification: 'Cor branca, proteção infantil antichoque',
    });
  }

  if (tueCount > 0) {
    items.push({
      id: 'mod_tue',
      category: 'Acessórios',
      description: 'Módulo de Tomada 2P+T 20A / 250V ou Conector de Porcelana',
      quantity: tueCount,
      unit: 'peças',
      specification: 'Cargas pesadas (Chuveiro, Ar condicionado, Forno)',
    });
  }

  if (switchSimpleCount > 0) {
    items.push({
      id: 'mod_int_simples',
      category: 'Acessórios',
      description: 'Módulo de Interruptor Simples 10A / 250V',
      quantity: switchSimpleCount,
      unit: 'peças',
      specification: 'Acionamento silencioso padrão ABNT',
    });
  }

  if (switchParaleloCount > 0) {
    items.push({
      id: 'mod_int_paralelo',
      category: 'Acessórios',
      description: 'Módulo de Interruptor Paralelo (Three-Way) 10A / 250V',
      quantity: switchParaleloCount,
      unit: 'peças',
      specification: 'Comutação de luz em dois pontos distintos',
    });
  }

  if (wallBoxes4x2 > 0) {
    items.push({
      id: 'placas_4x2',
      category: 'Acessórios',
      description: 'Placa de Acabamento 4x2 com Suporte',
      quantity: wallBoxes4x2,
      unit: 'peças',
      specification: 'Cor branca, acabamento brilhante ou fosco',
    });
  }

  // Filtragem
  const filteredItems = items.filter((item) => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Exportar para CSV
  const handleExportCsv = () => {
    const headers = ['Categoria', 'Descricao', 'Quantidade', 'Unidade', 'Especificacao'];
    const rows = items.map((i) => [
      `"${i.category}"`,
      `"${i.description}"`,
      i.quantity,
      `"${i.unit}"`,
      `"${i.specification}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lista_Materiais_${projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden text-slate-100">
      {/* Barra Superior da Lista de Materiais */}
      <div className="h-14 px-6 border-b border-slate-800 bg-[#0f141f] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm">
              Lista Quantitativa Consolidada de Materiais (BOM)
            </h2>
            <p className="text-xs text-slate-400">
              Metragem real com base na rota 3D dos eletrodutos e tabelas de carga NBR 5410
            </p>
          </div>
        </div>

        {/* Ações: Exportar CSV e Imprimir */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Planilha (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="h-12 px-6 border-b border-slate-800/80 bg-[#0d121c] flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2">
          {['all', 'Cabos', 'Eletrodutos', 'Dispositivos', 'Caixas', 'Acessórios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterCategory === cat
                  ? 'bg-cyan-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todas Categorias' : cat}
            </button>
          ))}
        </div>

        {/* Campo de Busca */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-md pl-8 pr-3 py-1 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Tabela de Materiais */}
      <div className="flex-1 overflow-auto p-6">
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#0f141f] shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#131924] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Descrição do Material</th>
                <th className="py-3 px-4">Especificação Técnica</th>
                <th className="py-3 px-4 text-right">Quantidade</th>
                <th className="py-3 px-4 text-center">Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-100">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                    {item.specification}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                    {item.quantity.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
