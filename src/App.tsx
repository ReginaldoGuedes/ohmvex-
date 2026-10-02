/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Sistema CAD Elétrico Desktop Offline NBR 5410
 * Componente Principal Integrador com Interface Fiel WOCA
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DimensionMeasurement,
  DoorWindow,
  DoorWindowType,
  Point2D,
  ProjectData,
  RoomDefinition,
  RoomPresetType,
  SymbolType,
  Wall,
  getRoomPresetGeometry
} from './types/cad';
import { createApartmentSampleProject, createBlankProject } from './engine/sampleProjects';
import { WocaToolbar, ActiveCadMode } from './components/WocaToolbar';
import { AppViewMode } from './components/DesktopHeader';
import { Canvas2D } from './components/Canvas2D';
import { UnifilarView } from './components/UnifilarView';
import { Canvas3D } from './components/Canvas3D';
import { BillOfMaterials } from './components/BillOfMaterials';
import { NbrAuditor } from './components/NbrAuditor';
import { Nbr5410Engine } from './engine/nbr5410Engine';
import { ConduitRoutingEngine } from './engine/conduitRouting';
import { DxfExporter } from './engine/dxfExporter';
import { DxfImporter } from './engine/dxfImporter';
import { CalculationReportModal } from './components/modals/CalculationReportModal';
import { AbntSheetModal } from './components/modals/AbntSheetModal';
import { LegendModal } from './components/modals/LegendModal';
import { BudgetModal } from './components/modals/BudgetModal';
import { LoadBalanceModal } from './components/modals/LoadBalanceModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<ProjectData>(() => createApartmentSampleProject());
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectData[]>([]);

  // Estados de Modos de Visualização e Ferramentas WOCA
  const [viewMode, setViewMode] = useState<AppViewMode>('cad2d');
  const [activeCadMode, setActiveCadMode] = useState<ActiveCadMode>('select');
  const [selectedSymbolType, setSelectedSymbolType] = useState<SymbolType>('luz_teto');
  const [selectedDoorWindowType, setSelectedDoorWindowType] = useState<DoorWindowType>('porta_simples');
  const [selectedRoomPreset, setSelectedRoomPreset] = useState<RoomPresetType>('rect');
  const [gridSnapEnabled, setGridSnapEnabled] = useState<boolean>(true);

  // Estados dos Modais Técnicos WOCA
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showAbntSheetModal, setShowAbntSheetModal] = useState<boolean>(false);
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [showLoadBalanceModal, setShowLoadBalanceModal] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>({
    text: 'Ambiente OHMVEX CAD carregado. Todas as 23 ferramentas e dropdowns estão ativos.',
    type: 'info'
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Atualização com Histórico para Undo/Redo
  const updateProjectWithHistory = (newProject: ProjectData) => {
    setHistory((prev) => [...prev.slice(-20), project]);
    setRedoStack([]);
    setProject(newProject);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, project]);
    setProject(previous);
    setToastMessage({ text: 'Ação desfeita.', type: 'info' });
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setHistory((prev) => [...prev, project]);
    setProject(next);
    setToastMessage({ text: 'Ação refeita.', type: 'info' });
  };

  // Novo Projeto em Branco (Gera canvas 100% limpo imediatamente)
  const handleNewBlankProject = () => {
    const blank = createBlankProject();
    updateProjectWithHistory(blank);
    setToastMessage({
      text: 'Canvas limpo gerado. Escolha um cômodo ou ferramenta e clique no canvas para posicionar.',
      type: 'success',
    });
  };

  // Posicionar Cômodo com um clique no Canvas
  const handleAddRoomAtPosition = (presetType: RoomPresetType, pos: Point2D) => {
    const geom = getRoomPresetGeometry(presetType, pos);
    const newRoomId = `room_${Date.now()}`;
    const nextRoomNum = project.rooms.length + 1;

    const newRoom: RoomDefinition = {
      id: newRoomId,
      name: `Cômodo ${nextRoomNum} (${geom.name})`,
      type: 'quarto',
      area: Number(geom.area.toFixed(1)),
      perimeter: Number(geom.perimeter.toFixed(1)),
      points: geom.points,
    };

    updateProjectWithHistory({
      ...project,
      walls: [...project.walls, ...geom.walls],
      rooms: [...project.rooms, newRoom],
    });

    setToastMessage({
      text: `${geom.name} posicionado no canvas (${geom.area.toFixed(1)} m²).`,
      type: 'success',
    });
  };

  // Importar Arquivo DXF (AutoCAD / LibreCAD)
  const handleImportDxfFile = async (file: File) => {
    try {
      const text = await file.text();
      const result = DxfImporter.parseDxf(text);
      if (result.walls.length === 0 && result.symbols.length === 0) {
        throw new Error('Nenhuma entidade gráfica (LINE, LWPOLYLINE, CIRCLE) reconhecida no arquivo DXF.');
      }

      const importedProject: ProjectData = {
        projectName: file.name.replace(/\.[^/.]+$/, ''),
        author: 'Engenheiro Eletricista OHMVEX',
        standard: 'NBR 5410:2004',
        voltageNominal: 127,
        gridSnapSize: 0.1,
        walls: result.walls,
        doorsWindows: [],
        dimensions: [],
        rooms: result.rooms.length > 0 ? result.rooms : [
          {
            id: `room_imp_${Date.now()}`,
            name: 'Área do Projeto DXF',
            type: 'sala',
            area: 25.0,
            perimeter: 20.0,
            points: result.walls.slice(0, 4).map((w) => w.start),
          }
        ],
        symbols: result.symbols,
        conduits: [],
        panelBoard: project.panelBoard,
      };

      updateProjectWithHistory(importedProject);
      setToastMessage({
        text: `Arquivo DXF "${file.name}" importado: ${result.walls.length} paredes e ${result.symbols.length} pontos detectados.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na leitura do DXF';
      setToastMessage({
        text: `Erro ao importar DXF: ${msg}`,
        type: 'warning',
      });
    }
  };

  // Inserção de Cômodos Pré-Moldados (Retangular ou em L 1, 2, 3, 4 - Modelo 1)
  const handleAddRoomPreset = (presetType: 'rect' | 'L1' | 'L2' | 'L3' | 'L4') => {
    const offsetX = 1.0 + (project.rooms.length % 3) * 4.0;
    const offsetY = 1.0 + Math.floor(project.rooms.length / 3) * 4.0;
    const newRoomId = `room_${Date.now()}`;
    const nextRoomNum = project.rooms.length + 1;

    let newPoints = [];
    let area = 0;
    let perimeter = 0;
    let shapeName = 'Retangular';
    const newWalls: Wall[] = [];

    if (presetType === 'rect') {
      const w = 4.0;
      const h = 3.0;
      newPoints = [
        { x: offsetX, y: offsetY },
        { x: offsetX + w, y: offsetY },
        { x: offsetX + w, y: offsetY + h },
        { x: offsetX, y: offsetY + h },
      ];
      area = w * h;
      perimeter = 2 * (w + h);
      shapeName = 'Retangular (4x3m)';
    } else if (presetType === 'L1') {
      // L1: Corte no topo direito
      const w = 4.0;
      const h = 4.0;
      const cut = 2.0;
      newPoints = [
        { x: offsetX, y: offsetY },
        { x: offsetX + cut, y: offsetY },
        { x: offsetX + cut, y: offsetY + cut },
        { x: offsetX + w, y: offsetY + cut },
        { x: offsetX + w, y: offsetY + h },
        { x: offsetX, y: offsetY + h },
      ];
      area = w * h - (w - cut) * cut;
      perimeter = 2 * (w + h);
      shapeName = 'Formato em L (Topo Direito)';
    } else if (presetType === 'L2') {
      // L2: Corte no fundo esquerdo
      const w = 4.0;
      const h = 4.0;
      const cut = 2.0;
      newPoints = [
        { x: offsetX + cut, y: offsetY },
        { x: offsetX + w, y: offsetY },
        { x: offsetX + w, y: offsetY + h },
        { x: offsetX, y: offsetY + h },
        { x: offsetX, y: offsetY + cut },
        { x: offsetX + cut, y: offsetY + cut },
      ];
      area = w * h - cut * cut;
      perimeter = 2 * (w + h);
      shapeName = 'Formato em L (Inferior Esquerdo)';
    } else if (presetType === 'L3') {
      // L3: L vertical alongado
      const w1 = 3.0;
      const h1 = 5.0;
      const cutX = 1.8;
      const cutY = 2.5;
      newPoints = [
        { x: offsetX, y: offsetY },
        { x: offsetX + cutX, y: offsetY },
        { x: offsetX + cutX, y: offsetY + cutY },
        { x: offsetX + w1, y: offsetY + cutY },
        { x: offsetX + w1, y: offsetY + h1 },
        { x: offsetX, y: offsetY + h1 },
      ];
      area = w1 * h1 - (w1 - cutX) * cutY;
      perimeter = 2 * (w1 + h1);
      shapeName = 'Formato em L Vertical';
    } else {
      // L4: L invertido com rebaixo inferior direito
      const w = 4.0;
      const h = 4.0;
      const cut = 2.0;
      newPoints = [
        { x: offsetX, y: offsetY },
        { x: offsetX + w, y: offsetY },
        { x: offsetX + w, y: offsetY + (h - cut) },
        { x: offsetX + (w - cut), y: offsetY + (h - cut) },
        { x: offsetX + (w - cut), y: offsetY + h },
        { x: offsetX, y: offsetY + h },
      ];
      area = w * h - cut * cut;
      perimeter = 2 * (w + h);
      shapeName = 'Formato em L Invertido';
    }

    for (let i = 0; i < newPoints.length; i++) {
      newWalls.push({
        id: `w_preset_${Date.now()}_${i}`,
        start: newPoints[i],
        end: newPoints[(i + 1) % newPoints.length],
        thickness: 0.15,
      });
    }

    const newRoom: RoomDefinition = {
      id: newRoomId,
      name: `Cômodo ${nextRoomNum} (${shapeName})`,
      type: 'quarto',
      area: Number(area.toFixed(1)),
      perimeter: Number(perimeter.toFixed(1)),
      points: newPoints,
    };

    updateProjectWithHistory({
      ...project,
      walls: [...project.walls, ...newWalls],
      rooms: [...project.rooms, newRoom],
    });

    setToastMessage({
      text: `${shapeName} inserido com paredes (${area.toFixed(1)}m² e ${perimeter.toFixed(1)}m de perímetro).`,
      type: 'success',
    });
  };

  // Dimensionamento Automático de Cargas NBR 5410
  const handleAutoDimension = () => {
    try {
      const updatedSymbols = project.symbols.map((sym) => {
        if (sym.type === 'luz_teto' && sym.roomId) {
          const room = project.rooms.find((r) => r.id === sym.roomId);
          if (room) {
            const lightCalc = Nbr5410Engine.calculateLighting(room.name, room.area);
            return {
              ...sym,
              powerVA: lightCalc.minimumVA,
              description: `Iluminação ${room.name} (${lightCalc.minimumVA} VA)`,
            };
          }
        }
        return sym;
      });

      const updatedCircuits = project.panelBoard.circuits.map((circ) => {
        const circSymbols = updatedSymbols.filter((s) => s.circuitId === circ.id);
        const totalVA = circSymbols.reduce((sum, s) => sum + s.powerVA, 0) || circ.powerVA;

        try {
          const sizing = Nbr5410Engine.sizeCircuitBreakerAndCable(
            totalVA,
            circ.voltage,
            circ.type,
            2,
            16
          );
          return {
            ...circ,
            powerVA: totalVA,
            powerW: totalVA,
            currentIb: sizing.currentIb,
            breakerAmps: sizing.breakerIn,
            conductorGauge: sizing.conductorGauge,
            cableAmpacityIz: sizing.ampacityIz,
            voltageDropPercent: sizing.voltageDropPercent,
            isCompliant: sizing.isCompliant,
          };
        } catch {
          return circ;
        }
      });

      updateProjectWithHistory({
        ...project,
        symbols: updatedSymbols,
        panelBoard: {
          ...project.panelBoard,
          circuits: updatedCircuits,
        },
      });

      setToastMessage({
        text: 'Auto-Dimensionamento NBR 5410 executado com sucesso!',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao dimensionar';
      setToastMessage({ text: msg, type: 'warning' });
    }
  };

  // Roteamento e Fiação Automática (Dijkstra + NBR 5410)
  const handleAutoRoute = () => {
    try {
      const circuitGauges: Record<number, number> = {};
      project.panelBoard.circuits.forEach((c) => {
        circuitGauges[c.id] = c.conductorGauge;
      });

      const summary = ConduitRoutingEngine.routeConductors(
        project.symbols,
        project.conduits,
        circuitGauges
      );

      updateProjectWithHistory({
        ...project,
        conduits: summary.updatedConduits,
      });

      const totalWires = summary.updatedConduits.reduce(
        (acc, c) => acc + (c.wires ? c.wires.length : 0),
        0
      );

      setToastMessage({
        text: `Roteamento concluído! ${totalWires} condutores e ${summary.updatedConduits.length} eletrodutos calculados.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro no roteamento';
      setToastMessage({ text: msg, type: 'warning' });
    }
  };

  // Exportar Planta para DXF (AutoCAD / LibreCAD)
  const handleExportDxf = () => {
    try {
      const dxfContent = DxfExporter.exportToDxf(
        project.projectName,
        project.walls,
        project.symbols,
        project.conduits
      );

      const blob = new Blob([dxfContent], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.projectName.replace(/\s+/g, '_')}_OHMVEX.dxf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage({
        text: 'Arquivo DXF exportado com sucesso para AutoCAD, LibreCAD e QCAD.',
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao exportar DXF';
      setToastMessage({ text: msg, type: 'warning' });
    }
  };

  // Salvar Projeto em JSON
  const handleSaveJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${project.projectName.replace(/\s+/g, '_')}.ohmvex.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({
      text: 'Arquivo do projeto salvo localmente com sucesso.',
      type: 'success',
    });
  };

  // Carregar Projeto de JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.walls && parsed.symbols && parsed.conduits && parsed.panelBoard) {
          updateProjectWithHistory(parsed);
          setToastMessage({
            text: `Projeto "${parsed.projectName || 'Sem título'}" aberto com sucesso.`,
            type: 'success',
          });
        } else {
          throw new Error('Formato inválido.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Arquivo corrompido';
        setToastMessage({ text: `Falha ao carregar: ${msg}`, type: 'warning' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Limpar Projeto / Canvas Limpo
  const handleClearProject = () => {
    const blank = createBlankProject();
    updateProjectWithHistory(blank);
    setActiveCadMode('room_preset');
    setToastMessage({ text: 'Canvas limpo gerado. Escolha uma ferramenta para começar.', type: 'info' });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0e14] text-slate-100 font-sans">
      {/* Input oculto para upload de arquivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.woca"
        className="hidden"
      />

      {/* Barra de Ferramentas e Ribbon OHMVEX (Reprodução Fiel aos Screenshots) */}
      <WocaToolbar
        projectName={project.projectName}
        onProjectNameChange={(name) => setProject({ ...project, projectName: name })}
        activeMode={activeCadMode}
        onActiveModeChange={setActiveCadMode}
        selectedSymbolType={selectedSymbolType}
        onSelectSymbolType={setSelectedSymbolType}
        selectedDoorWindowType={selectedDoorWindowType}
        onSelectDoorWindowType={setSelectedDoorWindowType}
        selectedRoomPreset={selectedRoomPreset}
        onSelectRoomPreset={setSelectedRoomPreset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddRoomPreset={handleAddRoomPreset}
        onNewBlankProject={handleNewBlankProject}
        onImportDxfFile={handleImportDxfFile}
        onAutoDimensionNbr={handleAutoDimension}
        onAutoRouteConduits={handleAutoRoute}
        onAutoWiringNbr={handleAutoRoute}
        onExportDxf={handleExportDxf}
        onOpenPdfSheet={() => setShowAbntSheetModal(true)}
        onOpenReportModal={() => setShowReportModal(true)}
        onOpenLegendModal={() => setShowLegendModal(true)}
        onOpenBudgetModal={() => setShowBudgetModal(true)}
        onOpenLoadBalanceModal={() => setShowLoadBalanceModal(true)}
        onSaveJson={handleSaveJson}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearProject={handleClearProject}
        gridSnapEnabled={gridSnapEnabled}
        onToggleGridSnap={() => setGridSnapEnabled((g) => !g)}
      />

      {/* Toast Notification Flutuante */}
      {toastMessage && (
        <div className="absolute bottom-10 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-2xl backdrop-blur-md text-xs transition-all bg-[#131924]/95 border-slate-700">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span className="text-slate-200">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Área Central Conforme o Modo Ativo */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'cad2d' && (
          <Canvas2D
            walls={project.walls}
            doorsWindows={project.doorsWindows}
            dimensions={project.dimensions}
            rooms={project.rooms}
            symbols={project.symbols}
            conduits={project.conduits}
            onWallsChange={(walls) => updateProjectWithHistory({ ...project, walls })}
            onDoorsWindowsChange={(doorsWindows) => updateProjectWithHistory({ ...project, doorsWindows })}
            onDimensionsChange={(dimensions) => updateProjectWithHistory({ ...project, dimensions })}
            onSymbolsChange={(symbols) => updateProjectWithHistory({ ...project, symbols })}
            onConduitsChange={(conduits) => updateProjectWithHistory({ ...project, conduits })}
            activeMode={activeCadMode}
            onActiveModeChange={setActiveCadMode}
            selectedSymbolType={selectedSymbolType}
            selectedDoorWindowType={selectedDoorWindowType}
            selectedRoomPreset={selectedRoomPreset}
            onAddRoomAtPosition={handleAddRoomAtPosition}
            gridSnapEnabled={gridSnapEnabled}
          />
        )}

        {viewMode === 'unifilar' && (
          <UnifilarView
            panelBoard={project.panelBoard}
            onPanelBoardChange={(panelBoard) => updateProjectWithHistory({ ...project, panelBoard })}
          />
        )}

        {viewMode === 'bim3d' && (
          <Canvas3D
            walls={project.walls}
            doorsWindows={project.doorsWindows}
            rooms={project.rooms}
            symbols={project.symbols}
            conduits={project.conduits}
          />
        )}

        {viewMode === 'materiais' && (
          <BillOfMaterials
            symbols={project.symbols}
            conduits={project.conduits}
            panelBoard={project.panelBoard}
            projectName={project.projectName}
          />
        )}

        {viewMode === 'auditoria' && (
          <NbrAuditor
            rooms={project.rooms}
            symbols={project.symbols}
            panelBoard={project.panelBoard}
            onApplyAutoCompliance={() => {
              handleAutoDimension();
              handleAutoRoute();
            }}
          />
        )}
      </main>

      {/* Modais Técnicos da Barra WOCA */}
      {showReportModal && (
        <CalculationReportModal
          project={project}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showAbntSheetModal && (
        <AbntSheetModal
          project={project}
          onClose={() => setShowAbntSheetModal(false)}
        />
      )}

      {showLegendModal && (
        <LegendModal
          onClose={() => setShowLegendModal(false)}
        />
      )}

      {showBudgetModal && (
        <BudgetModal
          project={project}
          onClose={() => setShowBudgetModal(false)}
        />
      )}

      {showLoadBalanceModal && (
        <LoadBalanceModal
          project={project}
          onClose={() => setShowLoadBalanceModal(false)}
        />
      )}
    </div>
  );
}
