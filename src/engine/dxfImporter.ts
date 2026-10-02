/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Importador Nativo de Arquivos DXF ASCII (AutoCAD / LibreCAD)
 * Converte entidades LINE, LWPOLYLINE, CIRCLE e TEXT em elementos do projeto elétrico.
 */

import {
  ElectricalSymbol,
  Point2D,
  RoomDefinition,
  Wall
} from '../types/cad';

export interface DxfImportResult {
  walls: Wall[];
  symbols: ElectricalSymbol[];
  rooms: RoomDefinition[];
  importedLayers: string[];
  entityCount: number;
}

export class DxfImporter {
  public static parseDxf(dxfText: string): DxfImportResult {
    const rawLines = dxfText.split(/\r?\n/);
    const walls: Wall[] = [];
    const symbols: ElectricalSymbol[] = [];
    const rooms: RoomDefinition[] = [];
    const layers = new Set<string>();

    let i = 0;
    let inEntities = false;

    // Estruturas temporárias
    let currentEntity: string | null = null;
    let currentLayer = '0';
    let p1: Partial<Point2D> = {};
    let p2: Partial<Point2D> = {};
    let lwVertices: Point2D[] = [];
    let circleCenter: Partial<Point2D> = {};
    let circleRadius = 0;
    let textPos: Partial<Point2D> = {};
    let textString = '';

    const flushCurrentEntity = () => {
      if (!currentEntity) return;

      if (currentEntity === 'LINE' && p1.x !== undefined && p1.y !== undefined && p2.x !== undefined && p2.y !== undefined) {
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (len > 0.05) {
          walls.push({
            id: `wall_dxf_${Date.now()}_${walls.length}`,
            start: { x: p1.x, y: p1.y },
            end: { x: p2.x, y: p2.y },
            thickness: 0.15,
          });
        }
      } else if (currentEntity === 'LWPOLYLINE' && lwVertices.length >= 2) {
        for (let j = 0; j < lwVertices.length - 1; j++) {
          const v1 = lwVertices[j];
          const v2 = lwVertices[j + 1];
          const len = Math.hypot(v2.x - v1.x, v2.y - v1.y);
          if (len > 0.05) {
            walls.push({
              id: `wall_dxf_${Date.now()}_${walls.length}`,
              start: { ...v1 },
              end: { ...v2 },
              thickness: 0.15,
            });
          }
        }
      } else if (currentEntity === 'CIRCLE' && circleCenter.x !== undefined && circleCenter.y !== undefined) {
        symbols.push({
          id: `sym_dxf_${Date.now()}_${symbols.length}`,
          type: 'luz_teto',
          x: circleCenter.x,
          y: circleCenter.y,
          circuitId: 1,
          powerVA: 100,
          voltage: 127,
          description: 'Ponto Importado do DXF',
          height: 'teto',
        });
      } else if ((currentEntity === 'TEXT' || currentEntity === 'MTEXT') && textPos.x !== undefined && textPos.y !== undefined && textString) {
        // Se for rótulo de cômodo (ex: Quarto, Sala, Cozinha)
        if (textString.length > 2 && !textString.startsWith('$')) {
          rooms.push({
            id: `room_dxf_${Date.now()}_${rooms.length}`,
            name: textString.trim(),
            type: 'quarto',
            area: 12.0,
            perimeter: 14.0,
            points: [
              { x: textPos.x - 1.5, y: textPos.y - 1.5 },
              { x: textPos.x + 1.5, y: textPos.y - 1.5 },
              { x: textPos.x + 1.5, y: textPos.y + 1.5 },
              { x: textPos.x - 1.5, y: textPos.y + 1.5 },
            ],
          });
        }
      }

      currentEntity = null;
      p1 = {};
      p2 = {};
      lwVertices = [];
      circleCenter = {};
      circleRadius = 0;
      textPos = {};
      textString = '';
    };

    while (i < rawLines.length - 1) {
      const code = rawLines[i].trim();
      const val = rawLines[i + 1]?.trim() || '';

      if (code === '2' && val === 'ENTITIES') {
        inEntities = true;
        i += 2;
        continue;
      }
      if (code === '0' && val === 'ENDSEC') {
        flushCurrentEntity();
        inEntities = false;
        i += 2;
        continue;
      }

      if (inEntities) {
        if (code === '0') {
          flushCurrentEntity();
          currentEntity = val;
          currentLayer = '0';
        } else if (code === '8') {
          currentLayer = val;
          layers.add(val);
        } else if (currentEntity === 'LINE') {
          if (code === '10') p1.x = parseFloat(val);
          else if (code === '20') p1.y = parseFloat(val);
          else if (code === '11') p2.x = parseFloat(val);
          else if (code === '21') p2.y = parseFloat(val);
        } else if (currentEntity === 'LWPOLYLINE') {
          if (code === '10') {
            const nextCode = rawLines[i + 2]?.trim();
            const nextVal = rawLines[i + 3]?.trim();
            if (nextCode === '20') {
              lwVertices.push({ x: parseFloat(val), y: parseFloat(nextVal) });
              i += 2;
            }
          }
        } else if (currentEntity === 'CIRCLE') {
          if (code === '10') circleCenter.x = parseFloat(val);
          else if (code === '20') circleCenter.y = parseFloat(val);
          else if (code === '40') circleRadius = parseFloat(val);
        } else if (currentEntity === 'TEXT' || currentEntity === 'MTEXT') {
          if (code === '10') textPos.x = parseFloat(val);
          else if (code === '20') textPos.y = parseFloat(val);
          else if (code === '1') textString = val;
        }
      }

      i += 2;
    }

    flushCurrentEntity();

    // Auto-ajuste de escala (se o desenho estiver em milímetros, converte para metros)
    let maxX = 0;
    let maxY = 0;
    walls.forEach((w) => {
      maxX = Math.max(maxX, Math.abs(w.start.x), Math.abs(w.end.x));
      maxY = Math.max(maxY, Math.abs(w.start.y), Math.abs(w.end.y));
    });

    const isMillimeters = maxX > 500 || maxY > 500;
    const scaleFactor = isMillimeters ? 0.001 : 1.0;

    if (scaleFactor !== 1.0) {
      walls.forEach((w) => {
        w.start.x = Number((w.start.x * scaleFactor).toFixed(2));
        w.start.y = Number((w.start.y * scaleFactor).toFixed(2));
        w.end.x = Number((w.end.x * scaleFactor).toFixed(2));
        w.end.y = Number((w.end.y * scaleFactor).toFixed(2));
      });
      symbols.forEach((s) => {
        s.x = Number((s.x * scaleFactor).toFixed(2));
        s.y = Number((s.y * scaleFactor).toFixed(2));
      });
    }

    return {
      walls,
      symbols,
      rooms,
      importedLayers: Array.from(layers),
      entityCount: walls.length + symbols.length + rooms.length,
    };
  }
}
