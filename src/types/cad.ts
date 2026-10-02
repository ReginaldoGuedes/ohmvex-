/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Tipos de Dados Estruturados para CAD Elétrico NBR 5410
 * Suporte completo a todas as ferramentas da barra WOCA: Cômodos, Esquadrias,
 * Iluminação NBR 5261, Tomadas, Interruptores, Telecom/Dados, Eletrodutos, Eletrocalhas e Orçamento.
 */

export type Point2D = {
  x: number;
  y: number;
};

export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type RoomType =
  | 'sala'
  | 'quarto'
  | 'copa_cozinha'
  | 'banheiro'
  | 'area_servico'
  | 'corredor'
  | 'varanda'
  | 'garagem'
  | 'outro';

export interface RoomDefinition {
  id: string;
  name: string;
  type: RoomType;
  points: Point2D[]; // Polígono do cômodo
  area: number; // m²
  perimeter: number; // m
}

export interface Wall {
  id: string;
  start: Point2D;
  end: Point2D;
  thickness: number; // metros (padrão 0.15m)
}

export type DoorWindowType =
  | 'porta_simples'
  | 'janela'
  | 'vao_livre'
  | 'porta_correr'
  | 'porta_dupla'
  | 'escada';

export interface DoorWindow {
  id: string;
  type: DoorWindowType;
  x: number;
  y: number;
  rotation: number; // graus
  width: number; // metros (ex: 0.80m porta, 1.20m janela)
  height: number; // metros (ex: 2.10m porta, 1.00m janela)
  peitoril?: number; // metros (ex: 1.10m para janela)
  wallId?: string;
  description: string;
}

export interface DimensionMeasurement {
  id: string;
  p1: Point2D;
  p2: Point2D;
  offset: number; // deslocamento da linha de cota
  label: string; // ex: "3.50 m"
}

export type ActiveCadMode =
  | 'select'
  | 'pan'
  | 'room_preset'
  | 'wall_free'
  | 'door_window'
  | 'dimension'
  | 'symbol'
  | 'conduit_manual'
  | 'disconnect_conduit';

export type SymbolType =
  // Iluminação (NBR 5261)
  | 'luz_teto'
  | 'luz_arandela'
  | 'luz_spot'
  | 'luz_bulbo'
  | 'luz_tubular'
  | 'luz_fita_driver'
  | 'luz_fita'
  // Tomadas TUG / TUE
  | 'tug_baixa'
  | 'tug_media'
  | 'tug_alta'
  | 'tug_piso'
  | 'tug_dupla'
  | 'tue_alta' // chuveiro, ar condicionado
  // Interruptores
  | 'interruptor_simples'
  | 'interruptor_preto_1t'
  | 'interruptor_paralelo'
  | 'interruptor_intermediario'
  | 'interruptor_bipolar'
  | 'interruptor_triplo'
  | 'interruptor_sensor'
  | 'interruptor_tomada'
  | 'interruptor_paralelo_duplo'
  | 'interruptor_pulsador'
  // Telecom, Dados e Segurança
  | 'telecom_telefone'
  | 'telecom_sensor'
  | 'telecom_pulsador'
  | 'telecom_dados'
  | 'telecom_camera'
  // Infraestrutura e Distribuição
  | 'qdc' // Quadro de Distribuição
  | 'medidor_padrao' // Padrão da Concessionária
  | 'caixa_passagem' // Caixa de derivação
  | 'sobe_eletroduto' // Sobe tubulação
  | 'desce_eletroduto' // Desce tubulação
  | 'eletrocalha' // Eletrocalha suspensa
  | 'eletrocalha_derivacao'; // Eletrocalha com saída

export type MountingHeight = 'teto' | 'parede_baixa' | 'parede_media' | 'parede_alta' | 'piso';

export interface ElectricalSymbol {
  id: string;
  type: SymbolType;
  x: number; // metros
  y: number; // metros
  rotation?: number; // graus
  circuitId?: number; // Número do circuito elétrico (ex: 1, 2, 3...)
  commandLetter?: string; // Letra do comando/interruptor (ex: 'a', 'b', 'c')
  powerVA: number; // Potência aparente em VA
  powerW?: number; // Potência ativa em W
  voltage: number; // 127V ou 220V
  roomId?: string; // Cômodo onde está inserido
  description: string;
  height: MountingHeight;
}

export type WireType = 'fase' | 'neutro' | 'terra' | 'retorno';

export interface WireConductor {
  type: WireType;
  circuitId: number;
  wireGauge: number; // mm² (ex: 1.5, 2.5, 4.0, 6.0)
  returnLetter?: string; // 'a', 'b', etc para retorno
  color: string; // Ex: 'preto', 'azul', 'verde', 'amarelo'
}

export interface ConduitSegment {
  id: string;
  startSymbolId: string; // id do símbolo ou nó
  endSymbolId: string;   // id do símbolo ou nó
  controlPoint?: Point2D; // Para curvatura de eletroduto (arco)
  diameterNominal: number; // DN 20, 25, 32, 40 mm
  location: 'laje' | 'parede' | 'piso';
  lengthMeters: number; // comprimento 3D calculado
  wires: WireConductor[]; // Condutores que passam pelo eletroduto
  occupancyRate?: number; // Taxa de ocupação (%)
  maxAllowedRate?: number; // 53%, 31% ou 40%
}

export type CircuitType = 'iluminacao' | 'tug' | 'tue';
export type PhaseDistribution = 'F+N' | 'F+F' | 'F+F+N' | '3F+N';

export interface CircuitInfo {
  id: number;
  name: string;
  type: CircuitType;
  voltage: number; // 127 ou 220
  phase: PhaseDistribution;
  powerVA: number;
  powerW: number;
  currentIb: number; // A (Corrente de projeto)
  conductorGauge: number; // mm²
  breakerAmps: number; // In nominal (A)
  cableAmpacityIz: number; // Iz corrigida (A)
  voltageDropPercent: number; // Queda de tensão calculada (%)
  isCompliant: boolean;
  notes?: string;
}

export interface PanelBoard {
  id: string;
  name: string;
  voltageSystem: '127/220V' | '220/380V';
  inletType: 'Monofásico' | 'Bifásico' | 'Trifásico';
  mainBreakerAmps: number; // Disjuntor geral (ex: 50A)
  dpsRatingKA: number; // Ex: 20kA / 45kA Classe II
  idrSensitivityMA: number; // 30mA proteção humana
  circuits: CircuitInfo[];
}

export interface ProjectData {
  projectName: string;
  author: string;
  standard: 'NBR 5410:2004';
  voltageNominal: 127 | 220;
  gridSnapSize: number; // metros (padrão 0.1m)
  walls: Wall[];
  doorsWindows?: DoorWindow[];
  dimensions?: DimensionMeasurement[];
  rooms: RoomDefinition[];
  symbols: ElectricalSymbol[];
  conduits: ConduitSegment[];
  panelBoard: PanelBoard;
}

export interface NbrLightingCalc {
  roomName: string;
  area: number;
  minimumVA: number;
  suggestedPoints: number;
  formulaDescription: string;
}

export interface NbrTugCalc {
  roomName: string;
  roomType: RoomType;
  perimeter: number;
  area: number;
  minimumTugs: number;
  tugPowerBreakdown: { powerVA: number; count: number }[];
  totalVA: number;
  formulaDescription: string;
}

export interface MaterialItem {
  id: string;
  category: 'Cabos' | 'Eletrodutos' | 'Dispositivos' | 'Caixas' | 'Acessórios';
  description: string;
  quantity: number;
  unit: string;
  specification: string;
  unitPrice?: number; // Preço unitário em R$
}

export type RoomPresetType = 'rect' | 'L1' | 'L2' | 'L3' | 'L4';

export function getRoomPresetGeometry(presetType: RoomPresetType, origin: Point2D) {
  let relativePoints: Point2D[] = [];
  let area = 0;
  let perimeter = 0;
  let name = 'Retangular';

  if (presetType === 'rect') {
    const w = 4.0;
    const h = 3.0;
    relativePoints = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    area = w * h;
    perimeter = 2 * (w + h);
    name = 'Retangular (4x3m)';
  } else if (presetType === 'L1') {
    const w = 4.0;
    const h = 4.0;
    const cut = 2.0;
    relativePoints = [
      { x: 0, y: 0 },
      { x: cut, y: 0 },
      { x: cut, y: cut },
      { x: w, y: cut },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    area = w * h - (w - cut) * cut;
    perimeter = 2 * (w + h);
    name = 'Formato em L 1';
  } else if (presetType === 'L2') {
    const w = 4.0;
    const h = 4.0;
    const cut = 2.0;
    relativePoints = [
      { x: cut, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
      { x: 0, y: cut },
      { x: cut, y: cut },
    ];
    area = w * h - cut * cut;
    perimeter = 2 * (w + h);
    name = 'Formato em L 2';
  } else if (presetType === 'L3') {
    const w = 3.0;
    const h = 5.0;
    const cutX = 1.8;
    const cutY = 2.5;
    relativePoints = [
      { x: 0, y: 0 },
      { x: cutX, y: 0 },
      { x: cutX, y: cutY },
      { x: w, y: cutY },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    area = w * h - (w - cutX) * cutY;
    perimeter = 2 * (w + h);
    name = 'Formato em L 3';
  } else {
    const w = 4.0;
    const h = 4.0;
    const cut = 2.0;
    relativePoints = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h - cut },
      { x: w - cut, y: h - cut },
      { x: w - cut, y: h },
      { x: 0, y: h },
    ];
    area = w * h - cut * cut;
    perimeter = 2 * (w + h);
    name = 'Formato em L 4';
  }

  const absolutePoints = relativePoints.map((p) => ({
    x: Number((origin.x + p.x).toFixed(2)),
    y: Number((origin.y + p.y).toFixed(2)),
  }));

  const walls: Wall[] = [];
  for (let i = 0; i < absolutePoints.length; i++) {
    walls.push({
      id: `w_preset_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      start: absolutePoints[i],
      end: absolutePoints[(i + 1) % absolutePoints.length],
      thickness: 0.15,
    });
  }

  return { points: absolutePoints, walls, area, perimeter, name };
}
