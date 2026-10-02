/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Módulo 4 - Exportador DXF Nativo ASCII
 * Geração de arquivos DXF compatíveis com AutoCAD R2000 (AC1015), LibreCAD e QCAD.
 */

import {
  ConduitSegment,
  ElectricalSymbol,
  Point2D,
  Wall
} from '../types/cad';

export class DxfExporter {
  /**
   * Converte o projeto CAD elétrico para uma string ASCII no formato DXF
   */
  public static exportToDxf(
    projectName: string,
    walls: Wall[],
    symbols: ElectricalSymbol[],
    conduits: ConduitSegment[]
  ): string {
    const lines: string[] = [];

    // 1. HEADER SECTION
    lines.push('0', 'SECTION');
    lines.push('2', 'HEADER');
    lines.push('9', '$ACADVER');
    lines.push('1', 'AC1015'); // AutoCAD 2000 format - broadly compatible
    lines.push('9', '$INSUNITS');
    lines.push('70', '6'); // 6 = Metros
    lines.push('0', 'ENDSEC');

    // 2. TABLES SECTION (Layers and Linetypes)
    lines.push('0', 'SECTION');
    lines.push('2', 'TABLES');

    // Linetype table
    lines.push('0', 'TABLE');
    lines.push('2', 'LTYPE');
    lines.push('70', '1');
    lines.push('0', 'LTYPE');
    lines.push('2', 'CONTINUOUS');
    lines.push('70', '0');
    lines.push('3', 'Solid line');
    lines.push('72', '65');
    lines.push('73', '0');
    lines.push('40', '0.0');
    lines.push('0', 'ENDTAB');

    // Layer table
    lines.push('0', 'TABLE');
    lines.push('2', 'LAYER');
    lines.push('70', '7');

    const addLayer = (name: string, color: number) => {
      lines.push('0', 'LAYER');
      lines.push('2', name);
      lines.push('70', '0');
      lines.push('62', color.toString()); // ACI Color
      lines.push('6', 'CONTINUOUS');
    };

    addLayer('PAREDES', 7);           // Branco / Preto
    addLayer('ELETRICO_PONTOS', 1);   // Vermelho
    addLayer('ELETRODUTOS', 4);       // Ciano
    addLayer('FIACAO_CONDUTORES', 2); // Amarelo
    addLayer('TEXTOS_CIRCUITOS', 3);  // Verde
    addLayer('QUADRO_QDC', 6);        // Magenta
    addLayer('COTAS_DIMENSOES', 8);   // Cinza

    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');

    // 3. ENTITIES SECTION
    lines.push('0', 'SECTION');
    lines.push('2', 'ENTITIES');

    // A. Exportação de Paredes
    for (const wall of walls) {
      this.exportWall(lines, wall);
    }

    // B. Exportação de Símbolos Elétricos NBR 5261
    const symbolMap = new Map<string, ElectricalSymbol>();
    for (const symbol of symbols) {
      symbolMap.set(symbol.id, symbol);
      this.exportSymbol(lines, symbol);
    }

    // C. Exportação de Eletrodutos e Condutores
    for (const conduit of conduits) {
      this.exportConduit(lines, conduit, symbolMap);
    }

    lines.push('0', 'ENDSEC');
    lines.push('0', 'EOF');

    return lines.join('\n');
  }

  /**
   * Exporta uma parede com sua espessura como retângulo fechado (LWPOLYLINE)
   */
  private static exportWall(lines: string[], wall: Wall): void {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return;

    const halfThick = wall.thickness / 2;
    const perpX = (-dy / len) * halfThick;
    const perpY = (dx / len) * halfThick;

    const p1: Point2D = { x: wall.start.x + perpX, y: wall.start.y + perpY };
    const p2: Point2D = { x: wall.end.x + perpX, y: wall.end.y + perpY };
    const p3: Point2D = { x: wall.end.x - perpX, y: wall.end.y - perpY };
    const p4: Point2D = { x: wall.start.x - perpX, y: wall.start.y - perpY };

    lines.push('0', 'LWPOLYLINE');
    lines.push('8', 'PAREDES');
    lines.push('90', '4'); // 4 vertices
    lines.push('70', '1'); // 1 = Closed polygon
    lines.push('43', '0.0');

    for (const p of [p1, p2, p3, p4]) {
      lines.push('10', p.x.toFixed(4));
      lines.push('20', p.y.toFixed(4));
    }
  }

  /**
   * Exporta os símbolos elétricos conforme NBR 5261
   */
  private static exportSymbol(lines: string[], sym: ElectricalSymbol): void {
    const x = sym.x;
    const y = sym.y;
    const layer = sym.type === 'qdc' ? 'QUADRO_QDC' : 'ELETRICO_PONTOS';

    switch (sym.type) {
      case 'luz_teto': {
        // Círculo com diâmetro 0.35m
        lines.push('0', 'CIRCLE');
        lines.push('8', layer);
        lines.push('10', x.toFixed(4));
        lines.push('20', y.toFixed(4));
        lines.push('40', '0.18'); // Raio 0.18m

        // Linha diametral horizontal
        lines.push('0', 'LINE');
        lines.push('8', layer);
        lines.push('10', (x - 0.18).toFixed(4));
        lines.push('20', y.toFixed(4));
        lines.push('11', (x + 0.18).toFixed(4));
        lines.push('21', y.toFixed(4));

        // Texto com potência VA
        this.addText(lines, 'TEXTOS_CIRCUITOS', `${sym.powerVA}VA`, x, y - 0.30, 0.12);
        // Texto com número do circuito e comando
        const circuitText = sym.commandLetter ? `C${sym.circuitId || 1}-${sym.commandLetter}` : `C${sym.circuitId || 1}`;
        this.addText(lines, 'TEXTOS_CIRCUITOS', circuitText, x, y + 0.22, 0.12);
        break;
      }

      case 'tug_baixa':
      case 'tug_media':
      case 'tug_alta':
      case 'tue_alta': {
        // Triângulo apontando para fora da parede (base de 0.20m, altura 0.18m)
        const size = 0.14;
        const p1 = { x: x - size, y: y - size };
        const p2 = { x: x + size, y: y - size };
        const p3 = { x: x, y: y + size };

        lines.push('0', 'LWPOLYLINE');
        lines.push('8', layer);
        lines.push('90', '3');
        lines.push('70', '1');
        lines.push('10', p1.x.toFixed(4), '20', p1.y.toFixed(4));
        lines.push('10', p2.x.toFixed(4), '20', p2.y.toFixed(4));
        lines.push('10', p3.x.toFixed(4), '20', p3.y.toFixed(4));

        if (sym.type === 'tug_media') {
          // Metade preenchida (linha no meio)
          lines.push('0', 'LINE');
          lines.push('8', layer);
          lines.push('10', x.toFixed(4));
          lines.push('20', (y - size).toFixed(4));
          lines.push('11', (x + size / 2).toFixed(4));
          lines.push('21', y.toFixed(4));
        } else if (sym.type === 'tug_alta' || sym.type === 'tue_alta') {
          // Tomada alta / TUE toda preenchida
          lines.push('0', 'SOLID');
          lines.push('8', layer);
          lines.push('10', p1.x.toFixed(4), '20', p1.y.toFixed(4));
          lines.push('11', p2.x.toFixed(4), '20', p2.y.toFixed(4));
          lines.push('12', p3.x.toFixed(4), '20', p3.y.toFixed(4));
          lines.push('13', p3.x.toFixed(4), '20', p3.y.toFixed(4));
        }

        // Texto do circuito e potência
        const label = sym.type === 'tue_alta' ? `TUE ${sym.powerVA}W (C${sym.circuitId || 1})` : `${sym.powerVA}VA (C${sym.circuitId || 1})`;
        this.addText(lines, 'TEXTOS_CIRCUITOS', label, x, y - 0.28, 0.10);
        break;
      }

      case 'interruptor_simples':
      case 'interruptor_paralelo': {
        // Círculo menor com haste
        lines.push('0', 'CIRCLE');
        lines.push('8', layer);
        lines.push('10', x.toFixed(4));
        lines.push('20', y.toFixed(4));
        lines.push('40', '0.10');

        if (sym.type === 'interruptor_paralelo') {
          // Metade preenchida
          lines.push('0', 'LINE');
          lines.push('8', layer);
          lines.push('10', (x - 0.10).toFixed(4));
          lines.push('20', y.toFixed(4));
          lines.push('11', (x + 0.10).toFixed(4));
          lines.push('21', y.toFixed(4));
        }

        // Letra do interruptor
        this.addText(lines, 'TEXTOS_CIRCUITOS', sym.commandLetter || 'a', x + 0.15, y, 0.12);
        break;
      }

      case 'qdc': {
        // Quadro de Distribuição: Retângulo bipartido diagonalmente
        const w = 0.40;
        const h = 0.25;
        const p1 = { x: x - w / 2, y: y - h / 2 };
        const p2 = { x: x + w / 2, y: y - h / 2 };
        const p3 = { x: x + w / 2, y: y + h / 2 };
        const p4 = { x: x - w / 2, y: y + h / 2 };

        lines.push('0', 'LWPOLYLINE');
        lines.push('8', layer);
        lines.push('90', '4');
        lines.push('70', '1');
        lines.push('10', p1.x.toFixed(4), '20', p1.y.toFixed(4));
        lines.push('10', p2.x.toFixed(4), '20', p2.y.toFixed(4));
        lines.push('10', p3.x.toFixed(4), '20', p3.y.toFixed(4));
        lines.push('10', p4.x.toFixed(4), '20', p4.y.toFixed(4));

        // Metade preenchida (triângulo sólido)
        lines.push('0', 'SOLID');
        lines.push('8', layer);
        lines.push('10', p1.x.toFixed(4), '20', p1.y.toFixed(4));
        lines.push('11', p2.x.toFixed(4), '20', p2.y.toFixed(4));
        lines.push('12', p3.x.toFixed(4), '20', p3.y.toFixed(4));
        lines.push('13', p3.x.toFixed(4), '20', p3.y.toFixed(4));

        this.addText(lines, 'TEXTOS_CIRCUITOS', 'QDC', x, y + 0.22, 0.14);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Exporta os eletrodutos com indicação de traços de condutores (Fase, Neutro, Terra, Retorno)
   */
  private static exportConduit(
    lines: string[],
    conduit: ConduitSegment,
    symbolMap: Map<string, ElectricalSymbol>
  ): void {
    const s1 = symbolMap.get(conduit.startSymbolId);
    const s2 = symbolMap.get(conduit.endSymbolId);
    if (!s1 || !s2) return;

    // Linha do eletroduto
    lines.push('0', 'LINE');
    lines.push('8', 'ELETRODUTOS');
    lines.push('10', s1.x.toFixed(4));
    lines.push('20', s1.y.toFixed(4));
    lines.push('11', s2.x.toFixed(4));
    lines.push('21', s2.y.toFixed(4));

    // Traços de fiação no ponto médio
    const midX = (s1.x + s2.x) / 2;
    const midY = (s1.y + s2.y) / 2;
    const dx = s2.x - s1.x;
    const dy = s2.y - s1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.2) return;

    // Vetores normal e tangente
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    const tickSpacing = 0.08;
    const tickLen = 0.10;
    const wires = conduit.wires || [];
    const startOffset = -((wires.length - 1) * tickSpacing) / 2;

    wires.forEach((wire, idx) => {
      const offsetX = midX + ux * (startOffset + idx * tickSpacing);
      const offsetY = midY + uy * (startOffset + idx * tickSpacing);

      switch (wire.type) {
        case 'fase': {
          // Traço contínuo perpendicular (corta os dois lados do eletroduto)
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', (offsetX - nx * tickLen).toFixed(4));
          lines.push('20', (offsetY - ny * tickLen).toFixed(4));
          lines.push('11', (offsetX + nx * tickLen).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen).toFixed(4));
          break;
        }

        case 'neutro': {
          // Traço em "L" invertido (perpendicular + horizontal no topo)
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', offsetX.toFixed(4));
          lines.push('20', offsetY.toFixed(4));
          lines.push('11', (offsetX + nx * tickLen).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen).toFixed(4));

          // Aba do L
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', (offsetX + nx * tickLen).toFixed(4));
          lines.push('20', (offsetY + ny * tickLen).toFixed(4));
          lines.push('11', (offsetX + nx * tickLen + ux * 0.05).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen + uy * 0.05).toFixed(4));
          break;
        }

        case 'terra': {
          // Traço em "T" invertido
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', offsetX.toFixed(4));
          lines.push('20', offsetY.toFixed(4));
          lines.push('11', (offsetX + nx * tickLen).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen).toFixed(4));

          // Barra horizontal no topo
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', (offsetX + nx * tickLen - ux * 0.04).toFixed(4));
          lines.push('20', (offsetY + ny * tickLen - uy * 0.04).toFixed(4));
          lines.push('11', (offsetX + nx * tickLen + ux * 0.04).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen + uy * 0.04).toFixed(4));
          break;
        }

        case 'retorno': {
          // Traço curto para apenas um lado (metade do traço de fase)
          lines.push('0', 'LINE');
          lines.push('8', 'FIACAO_CONDUTORES');
          lines.push('10', offsetX.toFixed(4));
          lines.push('20', offsetY.toFixed(4));
          lines.push('11', (offsetX + nx * tickLen).toFixed(4));
          lines.push('21', (offsetY + ny * tickLen).toFixed(4));
          break;
        }
      }
    });

    // Identificação do diâmetro do eletroduto se for >= DN 25
    if (conduit.diameterNominal && conduit.diameterNominal >= 25) {
      this.addText(
        lines,
        'TEXTOS_CIRCUITOS',
        `DN${conduit.diameterNominal}`,
        midX - nx * 0.20,
        midY - ny * 0.20,
        0.09
      );
    }
  }

  /**
   * Utilitário para adicionar entidade TEXT no DXF
   */
  private static addText(
    lines: string[],
    layer: string,
    text: string,
    x: number,
    y: number,
    height: number
  ): void {
    lines.push('0', 'TEXT');
    lines.push('8', layer);
    lines.push('10', x.toFixed(4));
    lines.push('20', y.toFixed(4));
    lines.push('40', height.toFixed(4));
    lines.push('1', text);
    lines.push('72', '1'); // Centro alinhado
    lines.push('11', x.toFixed(4));
    lines.push('21', y.toFixed(4));
  }
}
