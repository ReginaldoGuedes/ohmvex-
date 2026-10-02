/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OHMVEX: Módulo 3 - Editor CAD 2D com Canvas Nativo Context2D
 * Snap-to-grid, Paredes Vetoriais, Esquadrias (Portas/Janelas), Símbolos NBR 5261,
 * Eletrodutos, Eletrocalhas e Cotas de Medição.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ConduitSegment,
  DimensionMeasurement,
  DoorWindow,
  DoorWindowType,
  ElectricalSymbol,
  MountingHeight,
  Point2D,
  RoomDefinition,
  RoomPresetType,
  SymbolType,
  Wall,
  getRoomPresetGeometry
} from '../types/cad';
import { ActiveCadMode } from './WocaToolbar';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Settings2
} from 'lucide-react';

interface Canvas2DProps {
  walls: Wall[];
  doorsWindows?: DoorWindow[];
  dimensions?: DimensionMeasurement[];
  rooms: RoomDefinition[];
  symbols: ElectricalSymbol[];
  conduits: ConduitSegment[];
  onWallsChange: (walls: Wall[]) => void;
  onDoorsWindowsChange?: (dw: DoorWindow[]) => void;
  onDimensionsChange?: (dims: DimensionMeasurement[]) => void;
  onSymbolsChange: (symbols: ElectricalSymbol[]) => void;
  onConduitsChange: (conduits: ConduitSegment[]) => void;
  activeMode: ActiveCadMode;
  onActiveModeChange: (mode: ActiveCadMode) => void;
  selectedSymbolType: SymbolType;
  selectedDoorWindowType: DoorWindowType;
  selectedRoomPreset?: RoomPresetType;
  onAddRoomAtPosition?: (presetType: RoomPresetType, pos: Point2D) => void;
  gridSnapEnabled: boolean;
  onSelectElement?: (elem: { type: 'wall' | 'symbol' | 'conduit' | 'door_window'; id: string } | null) => void;
}

export const Canvas2D: React.FC<Canvas2DProps> = ({
  walls,
  doorsWindows = [],
  dimensions = [],
  rooms,
  symbols,
  conduits,
  onWallsChange,
  onDoorsWindowsChange,
  onDimensionsChange,
  onSymbolsChange,
  onConduitsChange,
  activeMode,
  onActiveModeChange,
  selectedSymbolType,
  selectedDoorWindowType,
  selectedRoomPreset = 'rect',
  onAddRoomAtPosition,
  gridSnapEnabled,
  onSelectElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados de navegação (Pan & Zoom)
  const [scale, setScale] = useState<number>(60); // pixels por metro
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 220, y: 160 });
  const [gridSnap, setGridSnap] = useState<number>(0.1); // metros (10cm)
  const [orthoMode, setOrthoMode] = useState<boolean>(false); // trava 90 graus

  // Seleção e Interação
  const [selectedItem, setSelectedItem] = useState<{
    type: 'wall' | 'symbol' | 'conduit' | 'door_window';
    id: string;
  } | null>(null);

  // Estados de desenho em andamento
  const [wallStartPoint, setWallStartPoint] = useState<Point2D | null>(null);
  const [dimensionStartPoint, setDimensionStartPoint] = useState<Point2D | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point2D>({ x: 0, y: 0 });
  const [conduitStartSymbolId, setConduitStartSymbolId] = useState<string | null>(null);
  const [draggingSymbolId, setDraggingSymbolId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Notifica elemento selecionado ao componente pai
  useEffect(() => {
    if (onSelectElement) {
      onSelectElement(selectedItem);
    }
  }, [selectedItem, onSelectElement]);

  // Conversão de Coordenadas: Tela (Pixels) <-> Mundo (Metros)
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point2D => {
      return {
        x: (screenX - panOffset.x) / scale,
        y: (screenY - panOffset.y) / scale,
      };
    },
    [panOffset, scale]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point2D => {
      return {
        x: worldX * scale + panOffset.x,
        y: worldY * scale + panOffset.y,
      };
    },
    [panOffset, scale]
  );

  // Snap-to-Grid e Snap-to-Vertex
  const snapCoordinate = useCallback(
    (pt: Point2D, ignoreVertex: boolean = false): Point2D => {
      if (!gridSnapEnabled) return pt;

      // 1. Snap para vértices de paredes existentes (precisão de 15cm)
      if (!ignoreVertex) {
        for (const wall of walls) {
          const dStart = Math.hypot(pt.x - wall.start.x, pt.y - wall.start.y);
          if (dStart < 0.18) return { ...wall.start };

          const dEnd = Math.hypot(pt.x - wall.end.x, pt.y - wall.end.y);
          if (dEnd < 0.18) return { ...wall.end };
        }
      }

      // 2. Snap para a grelha métrica
      const snapX = Math.round(pt.x / gridSnap) * gridSnap;
      const snapY = Math.round(pt.y / gridSnap) * gridSnap;
      return {
        x: Number(snapX.toFixed(2)),
        y: Number(snapY.toFixed(2)),
      };
    },
    [gridSnap, gridSnapEnabled, walls]
  );

  // Redimensionamento responsivo do Canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loop de Renderização no Canvas (High Precision Context2D)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Fundo Blueprint escuro clássico WOCA CAD
    ctx.fillStyle = '#0f141c';
    ctx.fillRect(0, 0, width, height);

    // 1. Desenho da Grelha Métrica (Grid CAD)
    if (gridSnapEnabled) {
      drawGrid(ctx, width, height, panOffset, scale, gridSnap);
    }

    // 2. Desenho de Cômodos (Áreas e Perímetros preenchidos)
    drawRooms(ctx, rooms, worldToScreen, scale);

    // 3. Desenho de Paredes
    drawWalls(ctx, walls, worldToScreen, scale, selectedItem);

    // 4. Desenho de Esquadrias (Portas, Janelas, Escadas)
    drawDoorsWindows(ctx, doorsWindows, worldToScreen, scale, selectedItem);

    // 5. Desenho de Cotas e Medições
    drawDimensions(ctx, dimensions, worldToScreen);

    // 6. Desenho de Eletrodutos e Condutores
    drawConduits(ctx, conduits, symbols, worldToScreen, selectedItem);

    // 7. Desenho de Símbolos Elétricos NBR 5261 & Telecom
    drawSymbols(ctx, symbols, worldToScreen, scale, selectedItem);

    // 8. Rascunhos de Ferramentas Ativas em Andamento
    if (activeMode === 'room_preset' && currentMousePos) {
      const snapped = snapCoordinate(currentMousePos);
      const preview = getRoomPresetGeometry(selectedRoomPreset, snapped);
      ctx.save();
      ctx.beginPath();
      const p0 = worldToScreen(preview.points[0].x, preview.points[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < preview.points.length; i++) {
        const pi = worldToScreen(preview.points[i].x, preview.points[i].y);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();

      // Cantos em vermelho idênticos ao exemplo do usuário
      ctx.fillStyle = '#ef4444';
      for (const pt of preview.points) {
        const scr = worldToScreen(pt.x, pt.y);
        ctx.beginPath();
        ctx.arc(scr.x, scr.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rótulo centralizado
      const center = worldToScreen(snapped.x + 1.5, snapped.y + 1.5);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Clique para posicionar ${preview.name} (${preview.area.toFixed(1)} m²)`, center.x, center.y);
      ctx.restore();
    } else if (activeMode === 'symbol' && currentMousePos) {
      const snapped = snapCoordinate(currentMousePos);
      const scr = worldToScreen(snapped.x, snapped.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(scr.x, scr.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.restore();
    } else if (activeMode === 'wall_free' && wallStartPoint) {
      drawWallDraft(ctx, wallStartPoint, currentMousePos, worldToScreen, scale, orthoMode);
    } else if (activeMode === 'conduit_manual' && conduitStartSymbolId) {
      drawConduitDraft(ctx, conduitStartSymbolId, symbols, currentMousePos, worldToScreen);
    } else if (activeMode === 'dimension' && dimensionStartPoint) {
      drawDimensionDraft(ctx, dimensionStartPoint, currentMousePos, worldToScreen);
    }

    ctx.restore();
  }, [
    walls,
    doorsWindows,
    dimensions,
    rooms,
    symbols,
    conduits,
    scale,
    panOffset,
    gridSnap,
    gridSnapEnabled,
    selectedItem,
    activeMode,
    selectedRoomPreset,
    wallStartPoint,
    dimensionStartPoint,
    currentMousePos,
    conduitStartSymbolId,
    orthoMode,
    worldToScreen
  ]);

  // Eventos de Mouse no Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Pan com Botão do Meio ou ferramenta Pan
    if (e.button === 1 || activeMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: screenX - panOffset.x, y: screenY - panOffset.y });
      return;
    }

    if (e.button !== 0) return; // Apenas botão esquerdo

    const rawWorld = screenToWorld(screenX, screenY);
    const snappedWorld = snapCoordinate(rawWorld);

    // Inserir Cômodo Pré-moldado com um clique no canvas
    if (activeMode === 'room_preset') {
      if (onAddRoomAtPosition) {
        onAddRoomAtPosition(selectedRoomPreset, snappedWorld);
      }
      return;
    }

    // A. Modo Seleção / Mover
    if (activeMode === 'select') {
      // 1. Verifica clique em símbolo elétrico
      const clickedSymbol = symbols.find((s) => {
        const d = Math.hypot(s.x - rawWorld.x, s.y - rawWorld.y);
        return d <= 0.35;
      });

      if (clickedSymbol) {
        setSelectedItem({ type: 'symbol', id: clickedSymbol.id });
        setDraggingSymbolId(clickedSymbol.id);
        return;
      }

      // 2. Verifica clique em esquadria (porta/janela)
      const clickedDoor = doorsWindows.find((dw) => {
        const d = Math.hypot(dw.x - rawWorld.x, dw.y - rawWorld.y);
        return d <= 0.45;
      });

      if (clickedDoor) {
        setSelectedItem({ type: 'door_window', id: clickedDoor.id });
        return;
      }

      // 3. Verifica clique em eletroduto
      const clickedConduit = conduits.find((c) => {
        const s1 = symbols.find((s) => s.id === c.startSymbolId);
        const s2 = symbols.find((s) => s.id === c.endSymbolId);
        if (!s1 || !s2) return false;
        return distanceToSegment(rawWorld, { x: s1.x, y: s1.y }, { x: s2.x, y: s2.y }) <= 0.25;
      });

      if (clickedConduit) {
        setSelectedItem({ type: 'conduit', id: clickedConduit.id });
        return;
      }

      // 4. Verifica clique em parede
      const clickedWall = walls.find((w) => {
        return distanceToSegment(rawWorld, w.start, w.end) <= 0.20;
      });

      if (clickedWall) {
        setSelectedItem({ type: 'wall', id: clickedWall.id });
        return;
      }

      setSelectedItem(null);
    }

    // B. Modo Paredes Livres
    else if (activeMode === 'wall_free') {
      if (!wallStartPoint) {
        setWallStartPoint(snappedWorld);
      } else {
        let finalPoint = snappedWorld;
        if (orthoMode || e.shiftKey) {
          const dx = Math.abs(snappedWorld.x - wallStartPoint.x);
          const dy = Math.abs(snappedWorld.y - wallStartPoint.y);
          if (dx > dy) {
            finalPoint = { x: snappedWorld.x, y: wallStartPoint.y };
          } else {
            finalPoint = { x: wallStartPoint.x, y: snappedWorld.y };
          }
        }

        const len = Math.hypot(finalPoint.x - wallStartPoint.x, finalPoint.y - wallStartPoint.y);
        if (len >= 0.2) {
          const newWall: Wall = {
            id: `wall_${Date.now()}`,
            start: wallStartPoint,
            end: finalPoint,
            thickness: 0.15,
          };
          onWallsChange([...walls, newWall]);
          setWallStartPoint(finalPoint);
        }
      }
    }

    // C. Inserir Esquadria (Porta, Janela, etc.)
    else if (activeMode === 'door_window') {
      // Encontra a parede mais próxima sob o clique
      let closestWall: Wall | null = null;
      let minDistance = 0.5;

      for (const w of walls) {
        const d = distanceToSegment(rawWorld, w.start, w.end);
        if (d < minDistance) {
          minDistance = d;
          closestWall = w;
        }
      }

      const angle = closestWall
        ? Math.atan2(closestWall.end.y - closestWall.start.y, closestWall.end.x - closestWall.start.x) * (180 / Math.PI)
        : 0;

      const newDoor: DoorWindow = {
        id: `dw_${Date.now()}`,
        type: selectedDoorWindowType,
        x: snappedWorld.x,
        y: snappedWorld.y,
        rotation: angle,
        width: selectedDoorWindowType.startsWith('janela') ? 1.20 : 0.80,
        height: 2.10,
        description: getDoorWindowDefaultName(selectedDoorWindowType),
      };

      if (onDoorsWindowsChange) {
        onDoorsWindowsChange([...doorsWindows, newDoor]);
      }
      setSelectedItem({ type: 'door_window', id: newDoor.id });
    }

    // D. Adicionar Cota / Medição
    else if (activeMode === 'dimension') {
      if (!dimensionStartPoint) {
        setDimensionStartPoint(snappedWorld);
      } else {
        const dist = Math.hypot(snappedWorld.x - dimensionStartPoint.x, snappedWorld.y - dimensionStartPoint.y);
        if (dist >= 0.1 && onDimensionsChange) {
          const newDim: DimensionMeasurement = {
            id: `dim_${Date.now()}`,
            p1: dimensionStartPoint,
            p2: snappedWorld,
            offset: 0.35,
            label: `${dist.toFixed(2)} m`,
          };
          onDimensionsChange([...dimensions, newDim]);
          setDimensionStartPoint(null);
        }
      }
    }

    // E. Inserir Símbolo Elétrico / Telecom / Infra
    else if (activeMode === 'symbol') {
      const newSymbol: ElectricalSymbol = {
        id: `sym_${Date.now()}`,
        type: selectedSymbolType,
        x: snappedWorld.x,
        y: snappedWorld.y,
        circuitId: selectedSymbolType.startsWith('luz') ? 1 : selectedSymbolType.startsWith('tue') ? 6 : 3,
        commandLetter: selectedSymbolType.startsWith('luz') ? 'a' : undefined,
        powerVA: getSymbolDefaultPower(selectedSymbolType),
        voltage: selectedSymbolType.startsWith('tue') ? 220 : 127,
        description: getSymbolDefaultName(selectedSymbolType),
        height: getSymbolDefaultHeight(selectedSymbolType),
      };

      onSymbolsChange([...symbols, newSymbol]);
      setSelectedItem({ type: 'symbol', id: newSymbol.id });
    }

    // F. Eletroduto Manual
    else if (activeMode === 'conduit_manual') {
      const targetSymbol = symbols.find((s) => Math.hypot(s.x - rawWorld.x, s.y - rawWorld.y) <= 0.4);

      if (targetSymbol) {
        if (!conduitStartSymbolId) {
          setConduitStartSymbolId(targetSymbol.id);
        } else if (conduitStartSymbolId !== targetSymbol.id) {
          const startSym = symbols.find((s) => s.id === conduitStartSymbolId)!;
          const endSym = targetSymbol;
          const dist = Math.hypot(startSym.x - endSym.x, startSym.y - endSym.y);

          const newConduit: ConduitSegment = {
            id: `c_${Date.now()}`,
            startSymbolId: conduitStartSymbolId,
            endSymbolId: targetSymbol.id,
            diameterNominal: 20,
            location: startSym.height === 'teto' && endSym.height === 'teto' ? 'laje' : 'parede',
            lengthMeters: Number((dist * 1.05).toFixed(2)),
            wires: [],
          };

          onConduitsChange([...conduits, newConduit]);
          setConduitStartSymbolId(null);
        }
      }
    }

    // G. Desconectar / Quebrar Eletroduto
    else if (activeMode === 'disconnect_conduit') {
      const clickedConduit = conduits.find((c) => {
        const s1 = symbols.find((s) => s.id === c.startSymbolId);
        const s2 = symbols.find((s) => s.id === c.endSymbolId);
        if (!s1 || !s2) return false;
        return distanceToSegment(rawWorld, { x: s1.x, y: s1.y }, { x: s2.x, y: s2.y }) <= 0.35;
      });

      if (clickedConduit) {
        onConduitsChange(conduits.filter((c) => c.id !== clickedConduit.id));
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPanOffset({
        x: screenX - panStart.x,
        y: screenY - panStart.y,
      });
      return;
    }

    const rawWorld = screenToWorld(screenX, screenY);
    const snappedWorld = snapCoordinate(rawWorld);
    setCurrentMousePos(snappedWorld);

    // Arrasto de símbolo
    if (draggingSymbolId) {
      onSymbolsChange(
        symbols.map((s) => {
          if (s.id === draggingSymbolId) {
            return { ...s, x: snappedWorld.x, y: snappedWorld.y };
          }
          return s;
        })
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingSymbolId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(250, Math.max(15, scale * zoomFactor));

    const worldPoint = screenToWorld(mouseX, mouseY);
    const newOffsetX = mouseX - worldPoint.x * newScale;
    const newOffsetY = mouseY - worldPoint.y * newScale;

    setScale(newScale);
    setPanOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWallStartPoint(null);
        setDimensionStartPoint(null);
        setConduitStartSymbolId(null);
        setSelectedItem(null);
        onActiveModeChange('select');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItem) {
          if (selectedItem.type === 'symbol') {
            onSymbolsChange(symbols.filter((s) => s.id !== selectedItem.id));
            onConduitsChange(
              conduits.filter(
                (c) => c.startSymbolId !== selectedItem.id && c.endSymbolId !== selectedItem.id
              )
            );
          } else if (selectedItem.type === 'conduit') {
            onConduitsChange(conduits.filter((c) => c.id !== selectedItem.id));
          } else if (selectedItem.type === 'wall') {
            onWallsChange(walls.filter((w) => w.id !== selectedItem.id));
          } else if (selectedItem.type === 'door_window' && onDoorsWindowsChange) {
            onDoorsWindowsChange(doorsWindows.filter((dw) => dw.id !== selectedItem.id));
          }
          setSelectedItem(null);
        }
      } else if (e.key === 'F8') {
        setOrthoMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, symbols, conduits, walls, doorsWindows, onSymbolsChange, onConduitsChange, onWallsChange, onDoorsWindowsChange, onActiveModeChange]);

  const handleFitExtents = () => {
    setScale(55);
    setPanOffset({ x: 120, y: 80 });
  };

  const selectedSymbol =
    selectedItem?.type === 'symbol' ? symbols.find((s) => s.id === selectedItem.id) : null;
  const selectedConduit =
    selectedItem?.type === 'conduit' ? conduits.find((c) => c.id === selectedItem.id) : null;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none">
      {/* Controles Flutuantes de Zoom no Canto Inferior Esquerdo */}
      <div className="absolute bottom-10 left-4 z-10 flex items-center gap-1 bg-[#131924]/90 p-1 rounded-lg border border-slate-700 backdrop-blur-sm shadow-xl text-xs">
        <button
          onClick={() => setScale((s) => Math.min(250, s * 1.2))}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Aproximar (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(15, s * 0.8))}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Afastar (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitExtents}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Ajustar Extensão (Fit)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Painel Flutuante de Propriedades do Símbolo Selecionado */}
      {selectedSymbol && (
        <div className="absolute top-4 right-4 z-20 w-72 bg-[#131924]/95 border border-slate-700 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              Propriedades do Ponto
            </span>
            <button
              onClick={() => {
                onSymbolsChange(symbols.filter((s) => s.id !== selectedSymbol.id));
                setSelectedItem(null);
              }}
              className="text-rose-400 hover:text-rose-300 p-1"
              title="Excluir ponto elétrico"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <label className="text-slate-400 text-[10px] uppercase font-mono">Descrição:</label>
            <input
              type="text"
              value={selectedSymbol.description}
              onChange={(e) => {
                const val = e.target.value;
                onSymbolsChange(
                  symbols.map((s) => (s.id === selectedSymbol.id ? { ...s, description: val } : s))
                );
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-0.5 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-mono">Circuito:</label>
              <input
                type="number"
                min="1"
                max="32"
                value={selectedSymbol.circuitId || 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  onSymbolsChange(
                    symbols.map((s) => (s.id === selectedSymbol.id ? { ...s, circuitId: val } : s))
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-0.5 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-mono">Potência (VA):</label>
              <input
                type="number"
                min="0"
                step="50"
                value={selectedSymbol.powerVA}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onSymbolsChange(
                    symbols.map((s) => (s.id === selectedSymbol.id ? { ...s, powerVA: val } : s))
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-0.5 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-[10px] uppercase font-mono">Tensão:</label>
              <select
                value={selectedSymbol.voltage}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 127;
                  onSymbolsChange(
                    symbols.map((s) => (s.id === selectedSymbol.id ? { ...s, voltage: val } : s))
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-0.5 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="127">127 V</option>
                <option value="220">220 V</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] uppercase font-mono">Comando / Tecla:</label>
              <input
                type="text"
                maxLength={2}
                value={selectedSymbol.commandLetter || 'a'}
                onChange={(e) => {
                  const val = e.target.value;
                  onSymbolsChange(
                    symbols.map((s) => (s.id === selectedSymbol.id ? { ...s, commandLetter: val } : s))
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 mt-0.5 focus:border-cyan-500 focus:outline-none uppercase font-mono text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-crosshair"
      />

      {/* Barra de Status Inferior do CAD */}
      <div className="h-6 px-3 bg-[#0a0d14] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">X:</span>
            <span className="text-slate-200">{currentMousePos.x.toFixed(2)}m</span>
            <span className="text-slate-500 ml-1">Y:</span>
            <span className="text-slate-200">{currentMousePos.y.toFixed(2)}m</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800" />

          <button
            onClick={() => setOrthoMode((o) => !o)}
            className={`px-1.5 py-0.2 rounded transition-colors ${
              orthoMode ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ORTHO (F8)
          </button>

          <div className="flex items-center gap-1">
            <span className="text-slate-500">SNAP:</span>
            <select
              value={gridSnap}
              onChange={(e) => setGridSnap(parseFloat(e.target.value))}
              className="bg-transparent text-slate-300 focus:outline-none"
            >
              <option value="0.05">0.05 m</option>
              <option value="0.10">0.10 m</option>
              <option value="0.25">0.25 m</option>
              <option value="0.50">0.50 m</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>Modo: {activeMode.toUpperCase()}</span>
          <span className="text-slate-500">·</span>
          <span>{symbols.length} Pontos Elétricos</span>
          <span className="text-slate-500">·</span>
          <span>{conduits.length} Eletrodutos</span>
        </div>
      </div>
    </div>
  );
};

// Funções de Renderização em Context2D Puro

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pan: Point2D,
  scale: number,
  snap: number
) {
  const stepMeters = snap < 0.2 ? 0.5 : 1.0;
  const stepPx = stepMeters * scale;

  ctx.strokeStyle = '#182130';
  ctx.lineWidth = 1;
  ctx.beginPath();

  const startX = (pan.x % stepPx) - stepPx;
  for (let x = startX; x < width + stepPx; x += stepPx) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  const startY = (pan.y % stepPx) - stepPx;
  for (let y = startY; y < height + stepPx; y += stepPx) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // Eixos Principais
  ctx.strokeStyle = '#2b394f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pan.x, 0);
  ctx.lineTo(pan.x, height);
  ctx.moveTo(0, pan.y);
  ctx.lineTo(width, pan.y);
  ctx.stroke();
}

function drawRooms(
  ctx: CanvasRenderingContext2D,
  rooms: RoomDefinition[],
  w2s: (x: number, y: number) => Point2D,
  scale: number
) {
  for (const room of rooms) {
    if (room.points.length < 3) continue;

    ctx.fillStyle = 'rgba(30, 58, 138, 0.08)';
    ctx.beginPath();
    const p0 = w2s(room.points[0].x, room.points[0].y);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < room.points.length; i++) {
      const p = w2s(room.points[i].x, room.points[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fill();

    const centroidX = room.points.reduce((acc, p) => acc + p.x, 0) / room.points.length;
    const centroidY = room.points.reduce((acc, p) => acc + p.y, 0) / room.points.length;
    const centerScreen = w2s(centroidX, centroidY);

    if (scale > 25) {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, centerScreen.x, centerScreen.y - 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '400 10px monospace';
      ctx.fillText(
        `${room.area.toFixed(1)} m²  |  2P: ${room.perimeter.toFixed(1)} m`,
        centerScreen.x,
        centerScreen.y + 7
      );
    }
  }
}

function drawWalls(
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  w2s: (x: number, y: number) => Point2D,
  scale: number,
  selectedItem: { type: string; id: string } | null
) {
  for (const wall of walls) {
    const isSelected = selectedItem?.type === 'wall' && selectedItem.id === wall.id;
    const s = w2s(wall.start.x, wall.start.y);
    const e = w2s(wall.end.x, wall.end.y);

    const thicknessPx = Math.max(2, wall.thickness * scale);

    ctx.strokeStyle = isSelected ? '#38bdf8' : '#cbd5e1';
    ctx.lineWidth = thicknessPx;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    if (scale > 40) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawDoorsWindows(
  ctx: CanvasRenderingContext2D,
  doorsWindows: DoorWindow[],
  w2s: (x: number, y: number) => Point2D,
  scale: number,
  selectedItem: { type: string; id: string } | null
) {
  for (const dw of doorsWindows) {
    const p = w2s(dw.x, dw.y);
    const wPx = dw.width * scale;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((dw.rotation * Math.PI) / 180);

    const isSelected = selectedItem?.type === 'door_window' && selectedItem.id === dw.id;
    ctx.strokeStyle = isSelected ? '#38bdf8' : '#ea580c';
    ctx.lineWidth = 1.8;

    if (dw.type === 'porta_simples') {
      // Vão de abertura com arco de 90 graus
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.lineTo(wPx / 2, 0);
      ctx.stroke();

      // Folha da porta
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.lineTo(-wPx / 2, -wPx);
      ctx.stroke();

      // Arco de giro da folha
      ctx.strokeStyle = '#f97316';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(-wPx / 2, 0, wPx, -Math.PI / 2, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (dw.type === 'janela') {
      // Esquadria de janela de 4 folhas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-wPx / 2, -4, wPx, 8);
      ctx.strokeRect(-wPx / 2, -4, wPx, 8);
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(-wPx / 2, 0);
      ctx.lineTo(wPx / 2, 0);
      ctx.stroke();
    } else if (dw.type === 'escada') {
      // Degraus paralelos
      const stepCount = 6;
      const stepW = wPx / stepCount;
      ctx.strokeRect(-wPx / 2, -15, wPx, 30);
      for (let i = 1; i < stepCount; i++) {
        ctx.beginPath();
        ctx.moveTo(-wPx / 2 + i * stepW, -15);
        ctx.lineTo(-wPx / 2 + i * stepW, 15);
        ctx.stroke();
      }
    } else {
      // Abertura ou vão livre
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-wPx / 2, -5, wPx, 10);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

function drawDimensions(
  ctx: CanvasRenderingContext2D,
  dimensions: DimensionMeasurement[],
  w2s: (x: number, y: number) => Point2D
) {
  for (const dim of dimensions) {
    const p1 = w2s(dim.p1.x, dim.p1.y);
    const p2 = w2s(dim.p2.x, dim.p2.y);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Setas nos extremos
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(midX - 22, midY - 8, 44, 16);
    ctx.strokeRect(midX - 22, midY - 8, 44, 16);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dim.label, midX, midY);
  }
}

function drawConduits(
  ctx: CanvasRenderingContext2D,
  conduits: ConduitSegment[],
  symbols: ElectricalSymbol[],
  w2s: (x: number, y: number) => Point2D,
  selectedItem: { type: string; id: string } | null
) {
  const symMap = new Map<string, ElectricalSymbol>();
  symbols.forEach((s) => symMap.set(s.id, s));

  for (const conduit of conduits) {
    const s1 = symMap.get(conduit.startSymbolId);
    const s2 = symMap.get(conduit.endSymbolId);
    if (!s1 || !s2) continue;

    const isSelected = selectedItem?.type === 'conduit' && selectedItem.id === conduit.id;
    const p1 = w2s(s1.x, s1.y);
    const p2 = w2s(s2.x, s2.y);

    ctx.strokeStyle = isSelected
      ? '#38bdf8'
      : conduit.location === 'laje'
      ? '#f59e0b'
      : '#38bdf8';
    ctx.lineWidth = isSelected ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Traços de Condutores
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    if (len > 30 && conduit.wires && conduit.wires.length > 0) {
      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;

      const tickSpacing = 6;
      const tickH = 8;
      const totalWidth = (conduit.wires.length - 1) * tickSpacing;
      const startX = midX - (ux * totalWidth) / 2;
      const startY = midY - (uy * totalWidth) / 2;

      conduit.wires.forEach((wire, i) => {
        const tx = startX + ux * i * tickSpacing;
        const ty = startY + uy * i * tickSpacing;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;

        switch (wire.type) {
          case 'fase': {
            ctx.beginPath();
            ctx.moveTo(tx - nx * tickH, ty - ny * tickH);
            ctx.lineTo(tx + nx * tickH, ty + ny * tickH);
            ctx.stroke();
            break;
          }
          case 'neutro': {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + nx * tickH, ty + ny * tickH);
            ctx.lineTo(tx + nx * tickH + ux * 4, ty + ny * tickH + uy * 4);
            ctx.stroke();
            break;
          }
          case 'terra': {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + nx * tickH, ty + ny * tickH);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(tx + nx * tickH - ux * 3.5, ty + ny * tickH - uy * 3.5);
            ctx.lineTo(tx + nx * tickH + ux * 3.5, ty + ny * tickH + uy * 3.5);
            ctx.stroke();
            break;
          }
          case 'retorno': {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + nx * tickH, ty + ny * tickH);
            ctx.stroke();
            break;
          }
        }
      });
    }
  }
}

function drawSymbols(
  ctx: CanvasRenderingContext2D,
  symbols: ElectricalSymbol[],
  w2s: (x: number, y: number) => Point2D,
  scale: number,
  selectedItem: { type: string; id: string } | null
) {
  for (const sym of symbols) {
    const isSelected = selectedItem?.type === 'symbol' && selectedItem.id === sym.id;
    const p = w2s(sym.x, sym.y);

    ctx.save();
    ctx.translate(p.x, p.y);

    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -18, 36, 36);
    }

    switch (sym.type) {
      case 'luz_teto': {
        const radius = 12;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-radius, 0);
        ctx.lineTo(radius, 0);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym.commandLetter || 'a', 0, -5);

        ctx.font = '7px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${sym.circuitId || 1}`, 0, 6);

        ctx.font = '9px monospace';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`${sym.powerVA}VA`, 0, 20);
        break;
      }

      case 'luz_spot': {
        // Spot quadrado com círculo concêntrico
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(-9, -9, 18, 18);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'luz_arandela': {
        // Arandela semicircular na parede
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 10, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'luz_tubular': {
        // Luminária tubular linear
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -4, 32, 8);
        break;
      }

      case 'tug_baixa':
      case 'tug_media':
      case 'tug_alta':
      case 'tue_alta':
      case 'tug_dupla': {
        const h = 12;
        const b = 10;
        ctx.beginPath();
        ctx.moveTo(-b, h);
        ctx.lineTo(b, h);
        ctx.lineTo(0, -h);
        ctx.closePath();

        ctx.strokeStyle = sym.type === 'tue_alta' ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.5;

        if (sym.type === 'tug_baixa') {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
        } else if (sym.type === 'tug_media') {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(0, h);
          ctx.lineTo(b, h);
          ctx.lineTo(0, -h);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = sym.type === 'tue_alta' ? '#ef4444' : '#38bdf8';
          ctx.fill();
        }
        ctx.stroke();

        ctx.font = '8px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.fillText(`C${sym.circuitId || 1}`, 0, h + 10);
        break;
      }

      case 'interruptor_simples':
      case 'interruptor_paralelo':
      case 'interruptor_intermediario': {
        const r = 7;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (sym.type === 'interruptor_paralelo') {
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        } else if (sym.type === 'interruptor_intermediario') {
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
        }

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(sym.commandLetter || 'a', r + 4, 3);
        break;
      }

      case 'qdc': {
        const w = 24;
        const h = 14;
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        ctx.fill();

        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#f43f5e';
        ctx.textAlign = 'center';
        ctx.fillText('QDC', 0, -h / 2 - 4);
        break;
      }

      case 'medidor_padrao': {
        // Medidor de Concessionária
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.strokeRect(-12, -14, 24, 28);
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#059669';
        ctx.textAlign = 'center';
        ctx.fillText('kWh', 0, -2);
        break;
      }

      case 'caixa_passagem': {
        // Caixa de derivação
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'sobe_eletroduto': {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('▲', -4, 4);
        break;
      }

      case 'desce_eletroduto': {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText('▼', -4, 4);
        break;
      }

      case 'eletrocalha': {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-18, -6, 36, 12);
        break;
      }

      default: {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}

function drawWallDraft(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  current: Point2D,
  w2s: (x: number, y: number) => Point2D,
  scale: number,
  ortho: boolean
) {
  let end = current;
  if (ortho) {
    const dx = Math.abs(current.x - start.x);
    const dy = Math.abs(current.y - start.y);
    if (dx > dy) end = { x: current.x, y: start.y };
    else end = { x: start.x, y: current.y };
  }

  const s = w2s(start.x, start.y);
  const e = w2s(end.x, end.y);
  const len = Math.hypot(end.x - start.x, end.y - start.y);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 0.15 * scale;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();

  const midX = (s.x + e.x) / 2;
  const midY = (s.y + e.y) / 2;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(midX - 25, midY - 10, 50, 18);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(midX - 25, midY - 10, 50, 18);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${len.toFixed(2)} m`, midX, midY + 3);
}

function drawConduitDraft(
  ctx: CanvasRenderingContext2D,
  startSymbolId: string,
  symbols: ElectricalSymbol[],
  current: Point2D,
  w2s: (x: number, y: number) => Point2D
) {
  const sym = symbols.find((s) => s.id === startSymbolId);
  if (!sym) return;

  const s = w2s(sym.x, sym.y);
  const e = w2s(current.x, current.y);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDimensionDraft(
  ctx: CanvasRenderingContext2D,
  start: Point2D,
  current: Point2D,
  w2s: (x: number, y: number) => Point2D
) {
  const s = w2s(start.x, start.y);
  const e = w2s(current.x, current.y);
  const dist = Math.hypot(current.x - start.x, current.y - start.y);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const midX = (s.x + e.x) / 2;
  const midY = (s.y + e.y) / 2;
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${dist.toFixed(2)} m`, midX, midY - 6);
}

function distanceToSegment(p: Point2D, v: Point2D, w: Point2D): number {
  const l2 = Math.hypot(v.x - w.x, v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function getSymbolDefaultName(type: SymbolType): string {
  switch (type) {
    case 'luz_teto': return 'Ponto de Luz no Teto';
    case 'luz_spot': return 'Spot / Plafon LED';
    case 'luz_arandela': return 'Arandela de Parede';
    case 'luz_tubular': return 'Luminária Linear Tubular';
    case 'luz_bulbo': return 'Lâmpada Bulbo LED';
    case 'luz_fita_driver': return 'Fita LED com Driver';
    case 'luz_fita': return 'Fita de LED';
    case 'tug_baixa': return 'Tomada Baixa 30cm';
    case 'tug_media': return 'Tomada Média 120cm';
    case 'tug_alta': return 'Tomada Alta 200cm';
    case 'tug_dupla': return 'Tomada Dupla 4x2';
    case 'tug_piso': return 'Tomada de Piso';
    case 'tue_alta': return 'TUE Chuveiro / AC (Carga Especial)';
    case 'interruptor_simples': return 'Interruptor Simples';
    case 'interruptor_paralelo': return 'Interruptor Paralelo (Three-Way)';
    case 'interruptor_intermediario': return 'Interruptor Four-Way';
    case 'interruptor_bipolar': return 'Interruptor Bipolar';
    case 'interruptor_tomada': return 'Interruptor + Tomada';
    case 'interruptor_pulsador': return 'Pulsador de Campainha';
    case 'telecom_telefone': return 'Tomada Telefone / TV';
    case 'telecom_sensor': return 'Sensor de Presença';
    case 'telecom_pulsador': return 'Botão de Campainha';
    case 'telecom_dados': return 'Tomada Rede Dados RJ45';
    case 'telecom_camera': return 'Câmera Segurança CFTV';
    case 'qdc': return 'Quadro de Distribuição (QDC)';
    case 'medidor_padrao': return 'Padrão Entrada Medidor';
    case 'caixa_passagem': return 'Caixa de Passagem / Derivação';
    case 'sobe_eletroduto': return 'Sobe Eletroduto (Laje)';
    case 'desce_eletroduto': return 'Desce Eletroduto (Laje)';
    case 'eletrocalha': return 'Eletrocalha Perfurada';
    case 'eletrocalha_derivacao': return 'Eletrocalha com Saída';
    default: return 'Dispositivo Elétrico';
  }
}

function getSymbolDefaultPower(type: SymbolType): number {
  switch (type) {
    case 'luz_teto': return 100;
    case 'luz_spot': return 50;
    case 'luz_arandela': return 60;
    case 'luz_tubular': return 100;
    case 'tug_baixa': return 100;
    case 'tug_media': return 600;
    case 'tug_alta': return 600;
    case 'tug_dupla': return 200;
    case 'tue_alta': return 5500;
    default: return 0;
  }
}

function getSymbolDefaultHeight(type: SymbolType): MountingHeight {
  switch (type) {
    case 'luz_teto':
    case 'luz_spot':
    case 'luz_tubular':
    case 'luz_bulbo':
    case 'luz_fita':
    case 'luz_fita_driver':
    case 'sobe_eletroduto':
    case 'desce_eletroduto':
    case 'eletrocalha':
    case 'eletrocalha_derivacao':
      return 'teto';
    case 'tug_baixa':
      return 'parede_baixa';
    case 'tug_media':
    case 'tug_dupla':
    case 'interruptor_simples':
    case 'interruptor_paralelo':
    case 'interruptor_intermediario':
    case 'interruptor_bipolar':
    case 'interruptor_tomada':
    case 'interruptor_pulsador':
    case 'telecom_telefone':
    case 'telecom_dados':
    case 'qdc':
    case 'caixa_passagem':
      return 'parede_media';
    case 'tug_alta':
    case 'tue_alta':
    case 'luz_arandela':
    case 'telecom_sensor':
    case 'telecom_camera':
      return 'parede_alta';
    case 'tug_piso':
      return 'piso';
    default:
      return 'parede_media';
  }
}

function getDoorWindowDefaultName(type: DoorWindowType): string {
  switch (type) {
    case 'porta_simples': return 'Porta de Giro Simples 80x210cm';
    case 'janela': return 'Janela 4 Folhas 120x100cm';
    case 'vao_livre': return 'Vão Livre / Passagem';
    case 'porta_correr': return 'Porta de Correr';
    case 'porta_dupla': return 'Porta Dupla Pivotante';
    case 'escada': return 'Escada Retilínea';
    default: return 'Esquadria';
  }
}
