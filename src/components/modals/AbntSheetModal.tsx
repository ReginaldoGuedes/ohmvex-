/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Modal de Prancha Técnica ABNT (Formatos A0, A1, A2, A3) & Exportação PDF Direta
 * Desenho técnico normatizado conforme ABNT NBR 10068, NBR 10582 e NBR 5410.
 */

import React, { useState, useMemo, useRef } from 'react';
import { ProjectData } from '../../types/cad';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Settings2,
  Zap,
  Building
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export type PaperSize = 'A0' | 'A1' | 'A2' | 'A3';

interface PaperDimensions {
  name: PaperSize;
  widthMm: number;
  heightMm: number;
  description: string;
  marginBorderMm: number;
  marginLeftMm: number;
}

const PAPER_CONFIGS: Record<PaperSize, PaperDimensions> = {
  A0: {
    name: 'A0',
    widthMm: 1189,
    heightMm: 841,
    description: '1189 x 841 mm (Prancha Master / Grande Porte)',
    marginBorderMm: 10,
    marginLeftMm: 25,
  },
  A1: {
    name: 'A1',
    widthMm: 841,
    heightMm: 594,
    description: '841 x 594 mm (Prancha Executiva Elétrica)',
    marginBorderMm: 10,
    marginLeftMm: 25,
  },
  A2: {
    name: 'A2',
    widthMm: 594,
    heightMm: 420,
    description: '594 x 420 mm (Prancha Média de Instalações)',
    marginBorderMm: 10,
    marginLeftMm: 25,
  },
  A3: {
    name: 'A3',
    widthMm: 420,
    heightMm: 297,
    description: '420 x 297 mm (Prancha Padrão ABNT)',
    marginBorderMm: 7,
    marginLeftMm: 25,
  },
};

interface AbntSheetModalProps {
  project: ProjectData;
  onClose: () => void;
}

export const AbntSheetModal: React.FC<AbntSheetModalProps> = ({
  project,
  onClose,
}) => {
  const [paperSize, setPaperSize] = useState<PaperSize>('A1');
  const [scaleFactor, setScaleFactor] = useState<string>('1:50');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showUnifilar, setShowUnifilar] = useState<boolean>(true);
  const [showLoadTable, setShowLoadTable] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(true);

  const paper = PAPER_CONFIGS[paperSize];
  const totalVA = useMemo(() => {
    return project.panelBoard.circuits.reduce((acc, c) => acc + (c.powerVA || 0), 0);
  }, [project.panelBoard.circuits]);

  const totalWatts = useMemo(() => {
    return project.panelBoard.circuits.reduce((acc, c) => acc + (c.powerW || c.powerVA || 0), 0);
  }, [project.panelBoard.circuits]);

  // Bounding box da planta real do usuário para enquadramento perfeito
  const projectBounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (project.walls && project.walls.length > 0) {
      project.walls.forEach((w) => {
        minX = Math.min(minX, w.start.x, w.end.x);
        minY = Math.min(minY, w.start.y, w.end.y);
        maxX = Math.max(maxX, w.start.x, w.end.x);
        maxY = Math.max(maxY, w.start.y, w.end.y);
      });
    }

    if (project.rooms && project.rooms.length > 0) {
      project.rooms.forEach((r) => {
        r.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      });
    }

    if (project.symbols && project.symbols.length > 0) {
      project.symbols.forEach((s) => {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x);
        maxY = Math.max(maxY, s.y);
      });
    }

    if (!isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 10;
      maxY = 8;
    }

    const pad = 1.0;
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: Math.max(maxX - minX + 2 * pad, 6),
      height: Math.max(maxY - minY + 2 * pad, 4),
    };
  }, [project.walls, project.rooms, project.symbols]);

  // Impressão nativa do navegador com estilo ABNT
  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'print-page-style';
    style.innerHTML = `
      @media print {
        @page {
          size: ${paper.widthMm}mm ${paper.heightMm}mm landscape;
          margin: 0;
        }
        body * {
          visibility: hidden;
        }
        #abnt-sheet-printable, #abnt-sheet-printable * {
          visibility: visible;
        }
        #abnt-sheet-printable {
          position: fixed;
          left: 0;
          top: 0;
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-page-style');
      if (el) el.remove();
    }, 1000);
  };

  // Geração Direta do Arquivo PDF com jsPDF (Vetorial de Alta Precisão)
  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [paper.widthMm, paper.heightMm],
      });

      const w = paper.widthMm;
      const h = paper.heightMm;
      const leftM = paper.marginLeftMm; // 25mm
      const borderM = paper.marginBorderMm; // 10mm ou 7mm

      // 1. Margem Externa e Interna ABNT
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.8);
      // Borda Externa (Linha de Corte da Folha)
      doc.rect(2, 2, w - 4, h - 4);

      // Borda Interna Regulamentar (25mm esquerda, 10mm outras)
      doc.setLineWidth(0.5);
      doc.rect(leftM, borderM, w - leftM - borderM, h - 2 * borderM);

      // Marcações de Coordenadas da Prancha (A B C D... / 1 2 3 4...)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const cols = 8;
      const colStep = (w - leftM - borderM) / cols;
      for (let i = 0; i < cols; i++) {
        const xPos = leftM + i * colStep + colStep / 2;
        doc.text(`${i + 1}`, xPos, borderM - 1.5, { align: 'center' });
        doc.text(`${i + 1}`, xPos, h - borderM + 3.5, { align: 'center' });
      }

      // 2. SELO / CARIMBO TÉCNICO ABNT (Canto Inferior Direito: 178mm x 45mm)
      const carimboW = 178;
      const carimboH = 46;
      const carimboX = w - borderM - carimboW;
      const carimboY = h - borderM - carimboH;

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.setFillColor(255, 255, 255);
      doc.rect(carimboX, carimboY, carimboW, carimboH, 'FD');

      // Linhas internas do carimbo
      doc.setLineWidth(0.3);
      doc.line(carimboX, carimboY + 12, carimboX + carimboW, carimboY + 12);
      doc.line(carimboX, carimboY + 24, carimboX + carimboW, carimboY + 24);
      doc.line(carimboX, carimboY + 36, carimboX + carimboW, carimboY + 36);
      doc.line(carimboX + 85, carimboY, carimboX + 85, carimboY + 36);
      doc.line(carimboX + 130, carimboY + 24, carimboX + 130, carimboY + 46);

      // Conteúdo do Carimbo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('OHMVEX ENGENHARIA ELÉTRICA', carimboX + 4, carimboY + 6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('CAD & BIM NBR 5410 / NBR 5261', carimboX + 4, carimboY + 10);

      // Empreendimento / Obra
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('OBRA / EMPREENDIMENTO:', carimboX + 89, carimboY + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const projNameTrunc = project.projectName.length > 32 ? project.projectName.slice(0, 32) + '...' : project.projectName;
      doc.text(projNameTrunc, carimboX + 89, carimboY + 8.5);

      // Título do Projeto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('CONTEÚDO DA PRANCHA:', carimboX + 4, carimboY + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Planta Elétrica, QDC, Quadro de Cargas e Legenda', carimboX + 4, carimboY + 21);

      // Responsável Técnico
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('RESPONSÁVEL TÉCNICO:', carimboX + 89, carimboY + 16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(project.author, carimboX + 89, carimboY + 21);

      // Norma Técnica
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NORMA TÉCNICA:', carimboX + 4, carimboY + 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('ABNT NBR 5410:2004 / NBR 5261', carimboX + 4, carimboY + 33);

      // Data e Escala
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`ESCALA: ${scaleFactor}`, carimboX + 89, carimboY + 28);
      doc.text(`DATA: ${new Date().toLocaleDateString('pt-BR')}`, carimboX + 89, carimboY + 33);

      // Prancha e Formato
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`FORMATO: ${paper.name} (${paper.widthMm}x${paper.heightMm}mm)`, carimboX + 4, carimboY + 41);

      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('PRANCHA:', carimboX + 134, carimboY + 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(13, 148, 136);
      doc.text('EL-01/01', carimboX + 134, carimboY + 41);

      // 3. TÍTULO DO QUADRANTE 1: PLANTA BAIXA DE INSTALAÇÕES ELÉTRICAS
      const planX = leftM + 4;
      const planY = borderM + 6;
      const planW = w - leftM - borderM - (showLoadTable ? 190 : 10);
      const planH = h - 2 * borderM - 12;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.rect(planX, planY, planW, planH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`01. PLANTA BAIXA DE INSTALAÇÕES ELÉTRICAS RESIDENCIAIS (ESCALA ${scaleFactor})`, planX + 3, planY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Condutores de cobre eletrolítico PVC 70°C 750V antichama · Eletrodutos embutidos em laje e alvenaria`, planX + 3, planY + 10);

      // Desenho esquemático das paredes no PDF
      if (project.walls && project.walls.length > 0) {
        doc.setDrawColor(51, 65, 85);
        doc.setLineWidth(0.6);
        const mapX = (x: number) => planX + 15 + ((x - projectBounds.minX) / projectBounds.width) * (planW - 30);
        const mapY = (y: number) => planY + 18 + ((y - projectBounds.minY) / projectBounds.height) * (planH - 36);

        project.walls.forEach((wall) => {
          doc.line(mapX(wall.start.x), mapY(wall.start.y), mapX(wall.end.x), mapY(wall.end.y));
        });

        // Nomes dos cômodos
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        project.rooms.forEach((r) => {
          if (r.points && r.points.length > 0) {
            const cx = r.points.reduce((acc, p) => acc + p.x, 0) / r.points.length;
            const cy = r.points.reduce((acc, p) => acc + p.y, 0) / r.points.length;
            doc.text(`${r.name} (${r.area.toFixed(1)} m²)`, mapX(cx), mapY(cy), { align: 'center' });
          }
        });

        // Símbolos elétricos
        project.symbols.forEach((sym) => {
          const sx = mapX(sym.x);
          const sy = mapY(sym.y);
          if (sym.type.startsWith('luz')) {
            doc.setDrawColor(217, 119, 6);
            doc.setFillColor(254, 243, 199);
            doc.circle(sx, sy, 2, 'FD');
            doc.setFontSize(4.5);
            doc.setTextColor(180, 83, 9);
            doc.text('L', sx, sy + 0.8, { align: 'center' });
          } else if (sym.type.startsWith('tu')) {
            doc.setDrawColor(2, 132, 199);
            doc.setFillColor(224, 242, 254);
            doc.rect(sx - 1.5, sy - 1.5, 3, 3, 'FD');
          } else if (sym.type.startsWith('inter')) {
            doc.setDrawColor(15, 23, 42);
            doc.circle(sx, sy, 1.8, 'S');
            doc.line(sx, sy + 1.8, sx, sy + 3.2);
          }
        });

        // Tubulações / Eletrodutos
        if (project.conduits && project.conduits.length > 0) {
          doc.setDrawColor(5, 150, 105);
          doc.setLineWidth(0.4);
          project.conduits.forEach((c) => {
            const s1 = project.symbols.find((s) => s.id === c.startSymbolId);
            const s2 = project.symbols.find((s) => s.id === c.endSymbolId);
            if (s1 && s2) {
              doc.line(mapX(s1.x), mapY(s1.y), mapX(s2.x), mapY(s2.y));
            }
          });
        }
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('Área de trabalho limpa pronta para inserção de novas instalações.', planX + planW / 2, planY + planH / 2, { align: 'center' });
      }

      // 4. QUADRANTE 2 & 3: QUADRO DE CARGAS & DIAGRAMA UNIFILAR (LADO DIREITO)
      if (showLoadTable) {
        const sideX = planX + planW + 3;
        const sideY = borderM + 6;
        const sideW = w - borderM - sideX;
        const tableH = carimboY - sideY - 4;

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.rect(sideX, sideY, sideW, tableH);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text('02. QUADRO DE CARGAS & DISJUNTORES (NBR 5410)', sideX + 3, sideY + 5);

        // Cabeçalho da Tabela
        let rowY = sideY + 9;
        doc.setFillColor(241, 245, 249);
        doc.rect(sideX + 2, rowY, sideW - 4, 5, 'F');
        doc.setFontSize(6);
        doc.setTextColor(71, 85, 105);
        doc.text('Circ.', sideX + 4, rowY + 3.5);
        doc.text('Tipo/Uso', sideX + 16, rowY + 3.5);
        doc.text('Pot (VA)', sideX + 50, rowY + 3.5, { align: 'right' });
        doc.text('Tens.', sideX + 66, rowY + 3.5, { align: 'right' });
        doc.text('Disj.', sideX + 80, rowY + 3.5, { align: 'right' });
        doc.text('Cabo', sideX + 96, rowY + 3.5, { align: 'right' });
        doc.text('Queda', sideX + 112, rowY + 3.5, { align: 'right' });

        rowY += 6;
        doc.setFont('helvetica', 'normal');
        project.panelBoard.circuits.slice(0, 10).forEach((circ) => {
          doc.setFontSize(6);
          doc.setTextColor(15, 23, 42);
          doc.text(`C-${circ.id}`, sideX + 4, rowY + 3);
          const typeName = circ.type.slice(0, 7).toUpperCase();
          doc.text(typeName, sideX + 16, rowY + 3);
          doc.text(`${circ.powerVA} VA`, sideX + 50, rowY + 3, { align: 'right' });
          doc.text(`${circ.voltage}V`, sideX + 66, rowY + 3, { align: 'right' });
          doc.text(`${circ.breakerAmps}A`, sideX + 80, rowY + 3, { align: 'right' });
          doc.text(`${circ.conductorGauge}mm²`, sideX + 96, rowY + 3, { align: 'right' });
          doc.text(`${(circ.voltageDropPercent || 1.1).toFixed(1)}%`, sideX + 112, rowY + 3, { align: 'right' });
          rowY += 4.5;
        });

        // Resumo de Potência
        rowY += 3;
        doc.setFillColor(248, 250, 252);
        doc.rect(sideX + 2, rowY, sideW - 4, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Potência Instalada: ${(totalVA / 1000).toFixed(2)} kVA (${(totalWatts / 1000).toFixed(2)} kW)`, sideX + 4, rowY + 4);
        doc.text(`Disjuntor Geral QDC: ${project.panelBoard.mainBreakerAmps} A (${project.panelBoard.inletType})`, sideX + 4, rowY + 8);
        doc.text(`Proteção Diferencial Residual: IDR ${project.panelBoard.idrSensitivityMA} mA`, sideX + 4, rowY + 12);
        doc.text(`Proteção Surtos: DPS Classe II ${project.panelBoard.dpsRatingKA} kA / 275V`, sideX + 4, rowY + 15);

        // 5. LEGENDA DE SÍMBOLOS NBR 5261
        if (showLegend && rowY + 22 < tableH + sideY) {
          const legY = rowY + 19;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text('03. LEGENDA DE CONVENÇÕES NBR 5261', sideX + 3, legY + 4);

          let itemY = legY + 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.text('● Luz no Teto (Potência VA / Nº Circuito)', sideX + 4, itemY);
          doc.text('△ Tomada Baixa 30cm (100VA / 600VA)', sideX + 4, itemY + 4);
          doc.text('▲ Tomada Média 120cm TUG', sideX + 4, itemY + 8);
          doc.text('○ Interruptor Simples na Parede', sideX + 4, itemY + 12);
          doc.text('─ Eletroduto Embutido na Laje (Contínuo)', sideX + 4, itemY + 16);
          doc.text('--- Eletroduto Embutido no Piso (Tracejado)', sideX + 4, itemY + 20);
        }
      }

      // Salva o arquivo PDF no computador
      const filename = `${project.projectName.replace(/\s+/g, '_')}_Prancha_${paper.name}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Falha ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 text-slate-900 font-sans select-none">
      <div className="bg-slate-100 w-full max-w-7xl h-[96vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        
        {/* ============================================================== */}
        {/* BARRA SUPERIOR: CONFIGURAÇÃO DE FOLHA, ESCALA E AÇÕES          */}
        {/* ============================================================== */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Esquerda: Título da Prancha & Logotipo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-800 tracking-tight font-mono">
                  Prancha Técnica ABNT NBR 10068 / NBR 5410
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full font-mono">
                  Folha {paper.name} ({paper.widthMm} x {paper.heightMm} mm)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {project.projectName} · {project.author}
              </span>
            </div>
          </div>

          {/* Centro: Seletores de Formato da Folha (A0, A1, A2, A3) e Escala */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-1.5 font-mono">
              Formato:
            </span>
            {(['A0', 'A1', 'A2', 'A3'] as PaperSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setPaperSize(size)}
                className={`px-3 py-1 rounded font-mono font-bold text-xs transition-colors ${
                  paperSize === size
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
                title={PAPER_CONFIGS[size].description}
              >
                {size}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-300 mx-1" />

            <span className="text-[11px] font-bold text-slate-500 uppercase px-1 font-mono">
              Escala:
            </span>
            <select
              value={scaleFactor}
              onChange={(e) => setScaleFactor(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-teal-600"
            >
              <option value="1:50">1:50 (Padrão)</option>
              <option value="1:75">1:75</option>
              <option value="1:100">1:100</option>
              <option value="1:25">1:25 (Detalhe)</option>
            </select>
          </div>

          {/* Direita: Botões de Ação (Gerar PDF, Imprimir, Fechar) */}
          <div className="flex items-center gap-2">
            {/* Controles de Zoom do Preview */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 mr-1 text-slate-600">
              <button
                onClick={() => setPreviewZoom((z) => Math.max(z - 15, 50))}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-semibold">{previewZoom}%</span>
              <button
                onClick={() => setPreviewZoom((z) => Math.min(z + 15, 180))}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botão Baixar PDF com jsPDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title={`Baixar arquivo PDF vetorial no formato ${paper.name}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Gerando...' : `Baixar PDF (${paper.name})`}</span>
            </button>

            {/* Botão Imprimir / Salvar Navegador */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Abrir diálogo de impressão do navegador ou salvar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Fechar Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
              title="Fechar Prancha"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ÁREA DE VISUALIZAÇÃO DA PRANCHA COM ZOOM E PROPORÇÃO REAL      */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-auto p-6 bg-slate-300/80 flex justify-center items-start">
          <div
            id="abnt-sheet-printable"
            style={{
              width: `${(paper.widthMm / 1.189) * (previewZoom / 100)}px`,
              aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
              minHeight: '620px',
            }}
            className="bg-white border-2 border-slate-900 p-3 shadow-2xl flex flex-col justify-between font-sans text-xs relative transition-all duration-150"
          >
            {/* Margens ABNT Internas: 25mm na esquerda, 10mm nas outras */}
            <div className="w-full h-full border border-slate-900 p-2.5 flex flex-col justify-between flex-1 relative bg-white">
              
              {/* Marcações alfanuméricas de coordenadas no perímetro (1 a 8 / A a D) */}
              <div className="absolute top-0.5 left-8 right-2 flex justify-between text-[7px] text-slate-400 font-mono pointer-events-none">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>
              </div>
              <div className="absolute left-1 top-8 bottom-8 flex flex-col justify-between text-[7px] text-slate-400 font-mono pointer-events-none">
                <span>A</span><span>B</span><span>C</span><span>D</span>
              </div>

              {/* CORPO DA PRANCHA: PLANTA BAIXA + QUADRO DE CARGAS + UNIFILAR */}
              <div className="grid grid-cols-12 gap-2 flex-1 mt-2 mb-2">
                
                {/* ÁREA PRINCIPAL (8 a 9 Colunas): Planta Baixa Elétrica */}
                <div className="col-span-8 border border-slate-400 p-2 flex flex-col justify-between bg-slate-50/50 relative">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                      <span className="font-mono font-bold text-[11px] text-slate-800 uppercase tracking-tight">
                        01. Planta Baixa de Instalações Elétricas (Escala {scaleFactor})
                      </span>
                      <span className="font-mono text-[9px] text-slate-500">
                        {project.walls.length} Paredes · {project.symbols.length} Pontos Elétricos · {project.conduits.length} Eletrodutos
                      </span>
                    </div>
                  </div>

                  {/* Renderização Vetorial da Planta Atual do Projeto */}
                  <div className="flex-1 flex items-center justify-center p-2 relative min-h-[300px]">
                    <svg
                      viewBox={`${projectBounds.minX} ${projectBounds.minY} ${projectBounds.width} ${projectBounds.height}`}
                      className="w-full h-full max-h-[460px] border border-slate-200 bg-white shadow-xs rounded"
                    >
                      {/* Grid de fundo técnico milimetrado */}
                      <defs>
                        <pattern id="grid-pattern" width="1" height="1" patternUnits="userSpaceOnUse">
                          <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#f1f5f9" strokeWidth="0.04" />
                        </pattern>
                      </defs>
                      <rect
                        x={projectBounds.minX}
                        y={projectBounds.minY}
                        width={projectBounds.width}
                        height={projectBounds.height}
                        fill="url(#grid-pattern)"
                      />

                      {/* Cômodos */}
                      {project.rooms.map((room) => {
                        const pathData = room.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '') + ' Z';
                        const cx = room.points.reduce((acc, p) => acc + p.x, 0) / room.points.length;
                        const cy = room.points.reduce((acc, p) => acc + p.y, 0) / room.points.length;
                        return (
                          <g key={room.id}>
                            <path d={pathData} fill="rgba(240, 253, 250, 0.6)" stroke="#cbd5e1" strokeWidth="0.05" />
                            <text
                              x={cx}
                              y={cy}
                              fontSize="0.28"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                              fill="#334155"
                              textAnchor="middle"
                            >
                              {room.name}
                            </text>
                            <text
                              x={cx}
                              y={cy + 0.35}
                              fontSize="0.22"
                              fontFamily="monospace"
                              fill="#64748b"
                              textAnchor="middle"
                            >
                              {room.area.toFixed(1)} m²
                            </text>
                          </g>
                        );
                      })}

                      {/* Paredes */}
                      {project.walls.map((wall) => (
                        <line
                          key={wall.id}
                          x1={wall.start.x}
                          y1={wall.start.y}
                          x2={wall.end.x}
                          y2={wall.end.y}
                          stroke="#1e293b"
                          strokeWidth="0.15"
                          strokeLinecap="round"
                        />
                      ))}

                      {/* Esquadrias / Portas e Janelas */}
                      {project.doorsWindows && project.doorsWindows.map((dw) => (
                        <rect
                          key={dw.id}
                          x={dw.x - 0.3}
                          y={dw.y - 0.08}
                          width="0.6"
                          height="0.16"
                          fill="#f8fafc"
                          stroke="#0284c7"
                          strokeWidth="0.04"
                        />
                      ))}

                      {/* Eletrodutos */}
                      {project.conduits.map((c) => {
                        const s1 = project.symbols.find((s) => s.id === c.startSymbolId);
                        const s2 = project.symbols.find((s) => s.id === c.endSymbolId);
                        if (!s1 || !s2) return null;
                        return (
                          <line
                            key={c.id}
                            x1={s1.x}
                            y1={s1.y}
                            x2={s2.x}
                            y2={s2.y}
                            stroke="#059669"
                            strokeWidth="0.06"
                            strokeDasharray={c.location === 'piso' ? '0.15, 0.1' : undefined}
                          />
                        );
                      })}

                      {/* Símbolos Elétricos */}
                      {project.symbols.map((sym) => {
                        if (sym.type.startsWith('luz')) {
                          return (
                            <g key={sym.id}>
                              <circle cx={sym.x} cy={sym.y} r="0.25" fill="#fef3c7" stroke="#d97706" strokeWidth="0.05" />
                              <text x={sym.x} y={sym.y + 0.08} fontSize="0.18" fontWeight="bold" fontFamily="monospace" fill="#b45309" textAnchor="middle">
                                L
                              </text>
                            </g>
                          );
                        } else if (sym.type.startsWith('tu')) {
                          return (
                            <g key={sym.id}>
                              <polygon
                                points={`${sym.x - 0.2},${sym.y + 0.2} ${sym.x + 0.2},${sym.y + 0.2} ${sym.x},${sym.y - 0.2}`}
                                fill="#0284c7"
                                stroke="#0369a1"
                                strokeWidth="0.04"
                              />
                            </g>
                          );
                        } else if (sym.type.startsWith('inter')) {
                          return (
                            <g key={sym.id}>
                              <circle cx={sym.x} cy={sym.y} r="0.18" fill="white" stroke="#0f172a" strokeWidth="0.05" />
                              <line x1={sym.x} y1={sym.y + 0.18} x2={sym.x} y2={sym.y + 0.35} stroke="#0f172a" strokeWidth="0.05" />
                            </g>
                          );
                        } else {
                          return (
                            <rect
                              key={sym.id}
                              x={sym.x - 0.2}
                              y={sym.y - 0.15}
                              width="0.4"
                              height="0.3"
                              fill="#dc2626"
                              stroke="#991b1b"
                              strokeWidth="0.04"
                            />
                          );
                        }
                      })}
                    </svg>

                    {/* Mensagem caso a planta esteja limpa */}
                    {project.walls.length === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 rounded backdrop-blur-xs">
                        <CheckCircle2 className="w-8 h-8 text-teal-600 mb-1" />
                        <span className="font-bold text-slate-800 text-xs">Área de Trabalho em Branco</span>
                        <span className="text-[10px] text-slate-500">Pronta para novos cômodos e projeto elétrico.</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé da Planta Baixa */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                    <span>Projeção Ortogonal Horizontal · Cotas em metros · Método de Instalação B1</span>
                    <span>Tensão Nominal: {project.voltageNominal} V · Frequência: 60 Hz</span>
                  </div>
                </div>

                {/* COLUNA LATERAL (4 Colunas): Quadro de Cargas, Diagrama Unifilar e Legenda */}
                <div className="col-span-4 flex flex-col gap-2 justify-between">
                  
                  {/* Bloco 1: Quadro de Cargas & DTMs */}
                  <div className="border border-slate-400 p-2 bg-white rounded-xs">
                    <span className="font-mono font-bold text-[10px] text-slate-800 block uppercase border-b border-slate-300 pb-1 mb-1.5">
                      02. Quadro de Cargas & DTMs
                    </span>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300 text-left text-[8px] font-mono">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="border p-0.5">Circ.</th>
                            <th className="border p-0.5">Tipo</th>
                            <th className="border p-0.5 text-right">Pot (VA)</th>
                            <th className="border p-0.5 text-right">Disj.</th>
                            <th className="border p-0.5 text-right">Cabo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.panelBoard.circuits.slice(0, 7).map((c) => (
                            <tr key={c.id}>
                              <td className="border p-0.5 font-bold text-cyan-800">C-{c.id}</td>
                              <td className="border p-0.5">{c.type.slice(0, 5).toUpperCase()}</td>
                              <td className="border p-0.5 text-right">{c.powerVA}</td>
                              <td className="border p-0.5 text-right font-bold text-amber-800">{c.breakerAmps}A</td>
                              <td className="border p-0.5 text-right text-emerald-800 font-bold">{c.conductorGauge}mm²</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Resumo do Quadro */}
                    <div className="mt-1.5 p-1 bg-slate-50 rounded border border-slate-200 text-[8px] space-y-0.5 font-mono">
                      <div className="flex justify-between">
                        <span>Potência Instalada:</span>
                        <span className="font-bold">{(totalVA / 1000).toFixed(2)} kVA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disjuntor Geral QDC:</span>
                        <span className="font-bold">{project.panelBoard.mainBreakerAmps} A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sensibilidade IDR:</span>
                        <span className="font-bold">{project.panelBoard.idrSensitivityMA} mA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DPS Surtos Classe II:</span>
                        <span className="font-bold">{project.panelBoard.dpsRatingKA} kA</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Diagrama Unifilar Esquematizado */}
                  <div className="border border-slate-400 p-2 bg-slate-50/60 rounded-xs">
                    <span className="font-mono font-bold text-[10px] text-slate-800 block uppercase border-b border-slate-300 pb-1 mb-1.5">
                      03. Diagrama Unifilar QDC
                    </span>
                    <div className="p-1 bg-white border border-slate-200 rounded font-mono text-[8px] space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="font-bold text-red-600">Alimentador Geral:</span>
                        <span>{project.panelBoard.inletType} · 2# 10.0mm² + N 10.0mm²</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold">DTM Geral {project.panelBoard.mainBreakerAmps}A</span>
                        <span>➔</span>
                        <span className="px-1 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-bold">IDR 30mA</span>
                        <span>➔</span>
                        <span className="px-1 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 rounded font-bold">DPS {project.panelBoard.dpsRatingKA}kA</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Legenda Oficial NBR 5261 */}
                  <div className="border border-slate-400 p-2 bg-white rounded-xs">
                    <span className="font-mono font-bold text-[9px] text-slate-800 block uppercase border-b border-slate-300 pb-1 mb-1">
                      04. Legenda Oficial NBR 5261
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[7.5px] font-mono text-slate-700">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-amber-600 bg-amber-100 flex items-center justify-center font-bold text-[6px]">L</span>
                        <span>Ponto Luz Teto</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-cyan-700 font-bold">▲</span>
                        <span>Tomada Média 120cm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">─ | ─</span>
                        <span>Condutor Fase</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">─ ┘ ─</span>
                        <span>Condutor Neutro</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">─ ┴ ─</span>
                        <span>Condutor Terra</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">─ ⌡ ─</span>
                        <span>Condutor Retorno</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ============================================================== */}
              {/* SELO / CARIMBO TÉCNICO ABNT (Canto Inferior Direito)           */}
              {/* ============================================================== */}
              <div className="mt-1 border-2 border-slate-900 grid grid-cols-12 font-mono text-[9px] divide-x-2 divide-slate-900 bg-white">
                {/* Logo e Identificação da Empresa */}
                <div className="col-span-3 p-2 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 font-bold tracking-wider text-slate-900">
                    <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="font-extrabold text-xs">OHMVEX</span>
                    <span className="text-[8px] text-teal-800 font-normal">Engenharia Elétrica</span>
                  </div>
                  <span className="text-[7.5px] text-slate-500 block">
                    Software CAD Elétrico Profissional · NBR 5410:2004
                  </span>
                </div>

                {/* Empreendimento */}
                <div className="col-span-3 p-2 space-y-0.5">
                  <span className="text-[7.5px] text-slate-500 block uppercase">Obra / Empreendimento:</span>
                  <span className="font-bold text-slate-900 block text-[10px] truncate">{project.projectName}</span>
                  <span className="text-[8px] text-slate-600 block">Projeto Elétrico de Baixa Tensão</span>
                </div>

                {/* Responsável Técnico */}
                <div className="col-span-3 p-2 space-y-0.5">
                  <span className="text-[7.5px] text-slate-500 block uppercase">Responsável Técnico / ART:</span>
                  <span className="font-bold text-slate-900 block truncate">{project.author}</span>
                  <span className="text-[8px] text-slate-600 block">CREA-SP / CFT - Registro Profissional</span>
                </div>

                {/* Dados da Folha, Escala e Prancha */}
                <div className="col-span-3 p-2 bg-slate-50 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="font-bold text-teal-900">FOLHA: {paper.name}</span>
                    <span className="text-slate-600">ESCALA: {scaleFactor}</span>
                    <span className="text-slate-500">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-300 pt-0.5">
                    <span className="font-bold text-slate-700 text-[10px]">PRANCHA</span>
                    <span className="text-sm font-extrabold text-teal-800">EL-01/01</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
