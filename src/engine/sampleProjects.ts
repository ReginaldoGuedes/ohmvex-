/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Projetos Residenciais Padrão NBR 5410 para Testes e Demonstração
 */

import {
  CircuitInfo,
  ConduitSegment,
  DimensionMeasurement,
  DoorWindow,
  ElectricalSymbol,
  PanelBoard,
  ProjectData,
  RoomDefinition,
  Wall
} from '../types/cad';

export function createApartmentSampleProject(): ProjectData {
  // Coordenadas métricas reais (origem 0,0)
  // Paredes perimetrais e internas
  const walls: Wall[] = [
    // Perímetro Externo
    { id: 'w1', start: { x: 0, y: 0 }, end: { x: 8.5, y: 0 }, thickness: 0.15 },
    { id: 'w2', start: { x: 8.5, y: 0 }, end: { x: 8.5, y: 7.0 }, thickness: 0.15 },
    { id: 'w3', start: { x: 8.5, y: 7.0 }, end: { x: 0, y: 7.0 }, thickness: 0.15 },
    { id: 'w4', start: { x: 0, y: 7.0 }, end: { x: 0, y: 0 }, thickness: 0.15 },

    // Divisória Sala / Cozinha
    { id: 'w5', start: { x: 4.5, y: 0 }, end: { x: 4.5, y: 4.0 }, thickness: 0.15 },
    // Divisória Cozinha / Área de Serviço
    { id: 'w6', start: { x: 4.5, y: 2.2 }, end: { x: 8.5, y: 2.2 }, thickness: 0.15 },

    // Corredor / Divisória Quartos
    { id: 'w7', start: { x: 0, y: 4.0 }, end: { x: 8.5, y: 4.0 }, thickness: 0.15 },
    // Divisória Quarto 1 / Quarto 2
    { id: 'w8', start: { x: 4.0, y: 4.0 }, end: { x: 4.0, y: 7.0 }, thickness: 0.15 },
    // Divisória Banheiro
    { id: 'w9', start: { x: 6.2, y: 4.0 }, end: { x: 6.2, y: 7.0 }, thickness: 0.15 },
  ];

  // Cômodos delimitados
  const rooms: RoomDefinition[] = [
    {
      id: 'room_sala',
      name: 'Sala de Estar / Jantar',
      type: 'sala',
      area: 18.0,
      perimeter: 17.0,
      points: [
        { x: 0, y: 0 },
        { x: 4.5, y: 0 },
        { x: 4.5, y: 4.0 },
        { x: 0, y: 4.0 }
      ]
    },
    {
      id: 'room_cozinha',
      name: 'Cozinha',
      type: 'copa_cozinha',
      area: 9.9,
      perimeter: 12.8,
      points: [
        { x: 4.5, y: 2.2 },
        { x: 8.5, y: 2.2 },
        { x: 8.5, y: 4.0 },
        { x: 4.5, y: 4.0 }
      ]
    },
    {
      id: 'room_servico',
      name: 'Área de Serviço',
      type: 'area_servico',
      area: 8.8,
      perimeter: 12.0,
      points: [
        { x: 4.5, y: 0 },
        { x: 8.5, y: 0 },
        { x: 8.5, y: 2.2 },
        { x: 4.5, y: 2.2 }
      ]
    },
    {
      id: 'room_quarto1',
      name: 'Dormitório Casal',
      type: 'quarto',
      area: 12.0,
      perimeter: 14.0,
      points: [
        { x: 0, y: 4.0 },
        { x: 4.0, y: 4.0 },
        { x: 4.0, y: 7.0 },
        { x: 0, y: 7.0 }
      ]
    },
    {
      id: 'room_quarto2',
      name: 'Dormitório 2 / Home Office',
      type: 'quarto',
      area: 6.6,
      perimeter: 10.4,
      points: [
        { x: 4.0, y: 4.0 },
        { x: 6.2, y: 4.0 },
        { x: 6.2, y: 7.0 },
        { x: 4.0, y: 7.0 }
      ]
    },
    {
      id: 'room_banheiro',
      name: 'Banheiro Social',
      type: 'banheiro',
      area: 6.9,
      perimeter: 10.6,
      points: [
        { x: 6.2, y: 4.0 },
        { x: 8.5, y: 4.0 },
        { x: 8.5, y: 7.0 },
        { x: 6.2, y: 7.0 }
      ]
    }
  ];

  // Símbolos elétricos posicionados conforme NBR 5410 e NBR 5261
  const symbols: ElectricalSymbol[] = [
    // 1. Quadro de Distribuição Geral no centro geométrico (Corredor / Divisória Sala)
    {
      id: 'sym_qdc',
      type: 'qdc',
      x: 4.35,
      y: 3.9,
      circuitId: 0,
      powerVA: 0,
      voltage: 220,
      description: 'Quadro de Distribuição de Circuitos (QDC Embutido)',
      height: 'parede_media',
      roomId: 'room_sala'
    },

    // 2. Pontos de Iluminação no teto
    {
      id: 'luz_sala',
      type: 'luz_teto',
      x: 2.25,
      y: 2.0,
      circuitId: 1,
      commandLetter: 'a',
      powerVA: 160, // 100 + 60 VA (18m²)
      voltage: 127,
      description: 'Luminária Plafonier LED Sala',
      height: 'teto',
      roomId: 'room_sala'
    },
    {
      id: 'int_sala',
      type: 'interruptor_simples',
      x: 0.3,
      y: 3.8,
      circuitId: 1,
      commandLetter: 'a',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Simples da Sala',
      height: 'parede_media',
      roomId: 'room_sala'
    },
    {
      id: 'luz_cozinha',
      type: 'luz_teto',
      x: 6.5,
      y: 3.1,
      circuitId: 1,
      commandLetter: 'b',
      powerVA: 100,
      voltage: 127,
      description: 'Luminária Linear LED Cozinha',
      height: 'teto',
      roomId: 'room_cozinha'
    },
    {
      id: 'int_cozinha',
      type: 'interruptor_simples',
      x: 4.7,
      y: 3.8,
      circuitId: 1,
      commandLetter: 'b',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Cozinha',
      height: 'parede_media',
      roomId: 'room_cozinha'
    },
    {
      id: 'luz_servico',
      type: 'luz_teto',
      x: 6.5,
      y: 1.1,
      circuitId: 1,
      commandLetter: 'c',
      powerVA: 100,
      voltage: 127,
      description: 'Luminária Área de Serviço',
      height: 'teto',
      roomId: 'room_servico'
    },
    {
      id: 'int_servico',
      type: 'interruptor_simples',
      x: 4.7,
      y: 2.0,
      circuitId: 1,
      commandLetter: 'c',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Área de Serviço',
      height: 'parede_media',
      roomId: 'room_servico'
    },
    {
      id: 'luz_quarto1',
      type: 'luz_teto',
      x: 2.0,
      y: 5.5,
      circuitId: 2,
      commandLetter: 'd',
      powerVA: 160,
      voltage: 127,
      description: 'Ponto Luz Dormitório Casal',
      height: 'teto',
      roomId: 'room_quarto1'
    },
    {
      id: 'int_quarto1',
      type: 'interruptor_simples',
      x: 3.8,
      y: 4.3,
      circuitId: 2,
      commandLetter: 'd',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Dormitório Casal',
      height: 'parede_media',
      roomId: 'room_quarto1'
    },
    {
      id: 'luz_quarto2',
      type: 'luz_teto',
      x: 5.1,
      y: 5.5,
      circuitId: 2,
      commandLetter: 'e',
      powerVA: 100,
      voltage: 127,
      description: 'Ponto Luz Quarto 2',
      height: 'teto',
      roomId: 'room_quarto2'
    },
    {
      id: 'int_quarto2',
      type: 'interruptor_simples',
      x: 4.3,
      y: 4.3,
      circuitId: 2,
      commandLetter: 'e',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Quarto 2',
      height: 'parede_media',
      roomId: 'room_quarto2'
    },
    {
      id: 'luz_banheiro',
      type: 'luz_teto',
      x: 7.35,
      y: 5.5,
      circuitId: 2,
      commandLetter: 'f',
      powerVA: 100,
      voltage: 127,
      description: 'Ponto Luz Banheiro',
      height: 'teto',
      roomId: 'room_banheiro'
    },
    {
      id: 'int_banheiro',
      type: 'interruptor_simples',
      x: 6.4,
      y: 4.3,
      circuitId: 2,
      commandLetter: 'f',
      powerVA: 0,
      voltage: 127,
      description: 'Interruptor Banheiro',
      height: 'parede_media',
      roomId: 'room_banheiro'
    },

    // 3. Tomadas TUGs da Cozinha (Circuito 3) - 3x 600VA + 1x 100VA
    {
      id: 'tug_coz1',
      type: 'tug_media',
      x: 5.0,
      y: 2.3,
      circuitId: 3,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Bancada Cozinha (600VA)',
      height: 'parede_media',
      roomId: 'room_cozinha'
    },
    {
      id: 'tug_coz2',
      type: 'tug_media',
      x: 7.0,
      y: 2.3,
      circuitId: 3,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Eletrodomésticos Cozinha (600VA)',
      height: 'parede_media',
      roomId: 'room_cozinha'
    },
    {
      id: 'tug_coz3',
      type: 'tug_media',
      x: 8.3,
      y: 3.5,
      circuitId: 3,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Pia Cozinha (600VA)',
      height: 'parede_media',
      roomId: 'room_cozinha'
    },
    {
      id: 'tug_coz4',
      type: 'tug_baixa',
      x: 5.5,
      y: 3.85,
      circuitId: 3,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada Geral Cozinha (100VA)',
      height: 'parede_baixa',
      roomId: 'room_cozinha'
    },

    // 4. Tomadas TUGs da Área de Serviço (Circuito 4)
    {
      id: 'tug_serv1',
      type: 'tug_media',
      x: 5.5,
      y: 0.2,
      circuitId: 4,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Máquina de Lavar (600VA)',
      height: 'parede_media',
      roomId: 'room_servico'
    },
    {
      id: 'tug_serv2',
      type: 'tug_media',
      x: 8.2,
      y: 1.0,
      circuitId: 4,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Ferro de Passar (600VA)',
      height: 'parede_media',
      roomId: 'room_servico'
    },

    // 5. Tomadas TUGs da Sala e Quartos (Circuito 5)
    {
      id: 'tug_sala1',
      type: 'tug_baixa',
      x: 0.2,
      y: 1.5,
      circuitId: 5,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada TV / Som Sala',
      height: 'parede_baixa',
      roomId: 'room_sala'
    },
    {
      id: 'tug_sala2',
      type: 'tug_baixa',
      x: 2.2,
      y: 0.2,
      circuitId: 5,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada Sofá Sala',
      height: 'parede_baixa',
      roomId: 'room_sala'
    },
    {
      id: 'tug_sala3',
      type: 'tug_baixa',
      x: 4.3,
      y: 1.5,
      circuitId: 5,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada Sala Jantar',
      height: 'parede_baixa',
      roomId: 'room_sala'
    },
    {
      id: 'tug_quarto1_a',
      type: 'tug_baixa',
      x: 0.2,
      y: 5.5,
      circuitId: 5,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada Cabeceira Casal',
      height: 'parede_baixa',
      roomId: 'room_quarto1'
    },
    {
      id: 'tug_quarto2_a',
      type: 'tug_baixa',
      x: 4.2,
      y: 6.8,
      circuitId: 5,
      powerVA: 100,
      voltage: 127,
      description: 'Tomada Computador Quarto 2',
      height: 'parede_baixa',
      roomId: 'room_quarto2'
    },
    {
      id: 'tug_banheiro',
      type: 'tug_media',
      x: 6.4,
      y: 6.0,
      circuitId: 5,
      powerVA: 600,
      voltage: 127,
      description: 'Tomada Lavatório Banheiro (600VA)',
      height: 'parede_media',
      roomId: 'room_banheiro'
    },

    // 6. Tomadas de Uso Específico - TUE (Circuitos Independentes 220V)
    {
      id: 'tue_chuveiro',
      type: 'tue_alta',
      x: 8.2,
      y: 6.5,
      circuitId: 6,
      powerVA: 5500,
      powerW: 5500,
      voltage: 220,
      description: 'Chuveiro Elétrico Blindado 5500W',
      height: 'parede_alta',
      roomId: 'room_banheiro'
    },
    {
      id: 'tue_ar',
      type: 'tue_alta',
      x: 0.3,
      y: 6.7,
      circuitId: 7,
      powerVA: 1800,
      powerW: 1800,
      voltage: 220,
      description: 'Ar Condicionado Split 12.000 BTU',
      height: 'parede_alta',
      roomId: 'room_quarto1'
    }
  ];

  // Eletrodutos interligando o QDC aos pontos de luz no teto e descidas de parede
  const conduits: ConduitSegment[] = [
    // Tronco principal do QDC até as caixas de teto centrais
    { id: 'c_qdc_sala', startSymbolId: 'sym_qdc', endSymbolId: 'luz_sala', diameterNominal: 25, location: 'laje', lengthMeters: 2.8, wires: [] },
    { id: 'c_qdc_coz', startSymbolId: 'sym_qdc', endSymbolId: 'luz_cozinha', diameterNominal: 25, location: 'laje', lengthMeters: 2.4, wires: [] },
    { id: 'c_qdc_q1', startSymbolId: 'sym_qdc', endSymbolId: 'luz_quarto1', diameterNominal: 25, location: 'laje', lengthMeters: 3.1, wires: [] },
    { id: 'c_qdc_q2', startSymbolId: 'sym_qdc', endSymbolId: 'luz_quarto2', diameterNominal: 25, location: 'laje', lengthMeters: 2.2, wires: [] },
    { id: 'c_qdc_banho', startSymbolId: 'sym_qdc', endSymbolId: 'luz_banheiro', diameterNominal: 25, location: 'laje', lengthMeters: 3.4, wires: [] },

    // Da luz da cozinha para a luz do serviço
    { id: 'c_coz_serv', startSymbolId: 'luz_cozinha', endSymbolId: 'luz_servico', diameterNominal: 20, location: 'laje', lengthMeters: 2.2, wires: [] },

    // Descidas de interruptores
    { id: 'c_luz_sala_int', startSymbolId: 'luz_sala', endSymbolId: 'int_sala', diameterNominal: 20, location: 'parede', lengthMeters: 2.5, wires: [] },
    { id: 'c_luz_coz_int', startSymbolId: 'luz_cozinha', endSymbolId: 'int_cozinha', diameterNominal: 20, location: 'parede', lengthMeters: 2.1, wires: [] },
    { id: 'c_luz_serv_int', startSymbolId: 'luz_servico', endSymbolId: 'int_servico', diameterNominal: 20, location: 'parede', lengthMeters: 2.1, wires: [] },
    { id: 'c_luz_q1_int', startSymbolId: 'luz_quarto1', endSymbolId: 'int_quarto1', diameterNominal: 20, location: 'parede', lengthMeters: 2.3, wires: [] },
    { id: 'c_luz_q2_int', startSymbolId: 'luz_quarto2', endSymbolId: 'int_quarto2', diameterNominal: 20, location: 'parede', lengthMeters: 2.0, wires: [] },
    { id: 'c_luz_banho_int', startSymbolId: 'luz_banheiro', endSymbolId: 'int_banheiro', diameterNominal: 20, location: 'parede', lengthMeters: 2.2, wires: [] },

    // Descidas para tomadas
    { id: 'c_coz_tug1', startSymbolId: 'luz_cozinha', endSymbolId: 'tug_coz1', diameterNominal: 20, location: 'parede', lengthMeters: 2.3, wires: [] },
    { id: 'c_coz_tug2', startSymbolId: 'tug_coz1', endSymbolId: 'tug_coz2', diameterNominal: 20, location: 'parede', lengthMeters: 2.1, wires: [] },
    { id: 'c_coz_tug3', startSymbolId: 'tug_coz2', endSymbolId: 'tug_coz3', diameterNominal: 20, location: 'parede', lengthMeters: 1.8, wires: [] },
    { id: 'c_coz_tug4', startSymbolId: 'luz_cozinha', endSymbolId: 'tug_coz4', diameterNominal: 20, location: 'parede', lengthMeters: 2.1, wires: [] },

    { id: 'c_serv_tug1', startSymbolId: 'luz_servico', endSymbolId: 'tug_serv1', diameterNominal: 20, location: 'parede', lengthMeters: 2.2, wires: [] },
    { id: 'c_serv_tug2', startSymbolId: 'tug_serv1', endSymbolId: 'tug_serv2', diameterNominal: 20, location: 'parede', lengthMeters: 2.8, wires: [] },

    { id: 'c_sala_tug1', startSymbolId: 'luz_sala', endSymbolId: 'tug_sala1', diameterNominal: 20, location: 'parede', lengthMeters: 2.7, wires: [] },
    { id: 'c_sala_tug2', startSymbolId: 'luz_sala', endSymbolId: 'tug_sala2', diameterNominal: 20, location: 'parede', lengthMeters: 2.4, wires: [] },
    { id: 'c_sala_tug3', startSymbolId: 'luz_sala', endSymbolId: 'tug_sala3', diameterNominal: 20, location: 'parede', lengthMeters: 2.6, wires: [] },

    { id: 'c_q1_tug', startSymbolId: 'luz_quarto1', endSymbolId: 'tug_quarto1_a', diameterNominal: 20, location: 'parede', lengthMeters: 2.4, wires: [] },
    { id: 'c_q2_tug', startSymbolId: 'luz_quarto2', endSymbolId: 'tug_quarto2_a', diameterNominal: 20, location: 'parede', lengthMeters: 2.2, wires: [] },
    { id: 'c_banho_tug', startSymbolId: 'luz_banheiro', endSymbolId: 'tug_banheiro', diameterNominal: 20, location: 'parede', lengthMeters: 2.1, wires: [] },

    // Alimentação direta de TUEs
    { id: 'c_qdc_chuveiro', startSymbolId: 'luz_banheiro', endSymbolId: 'tue_chuveiro', diameterNominal: 25, location: 'parede', lengthMeters: 2.0, wires: [] },
    { id: 'c_qdc_ar', startSymbolId: 'luz_quarto1', endSymbolId: 'tue_ar', diameterNominal: 20, location: 'parede', lengthMeters: 2.2, wires: [] },
  ];

  // Quadro de Distribuição inicial configurado
  const circuits: CircuitInfo[] = [
    {
      id: 1,
      name: 'Iluminação Social e Serviços',
      type: 'iluminacao',
      voltage: 127,
      phase: 'F+N',
      powerVA: 360,
      powerW: 360,
      currentIb: 2.83,
      conductorGauge: 1.5,
      breakerAmps: 10,
      cableAmpacityIz: 14.0,
      voltageDropPercent: 0.95,
      isCompliant: true,
      notes: 'Sala, Cozinha e Área de Serviço'
    },
    {
      id: 2,
      name: 'Iluminação Área Íntima',
      type: 'iluminacao',
      voltage: 127,
      phase: 'F+N',
      powerVA: 360,
      powerW: 360,
      currentIb: 2.83,
      conductorGauge: 1.5,
      breakerAmps: 10,
      cableAmpacityIz: 14.0,
      voltageDropPercent: 0.98,
      isCompliant: true,
      notes: 'Quarto 1, Quarto 2 e Banheiro'
    },
    {
      id: 3,
      name: 'TUGs Cozinha',
      type: 'tug',
      voltage: 127,
      phase: 'F+N',
      powerVA: 1900,
      powerW: 1900,
      currentIb: 14.96,
      conductorGauge: 2.5,
      breakerAmps: 20,
      cableAmpacityIz: 21.6,
      voltageDropPercent: 2.1,
      isCompliant: true,
      notes: '3x 600VA + 1x 100VA'
    },
    {
      id: 4,
      name: 'TUGs Área de Serviço',
      type: 'tug',
      voltage: 127,
      phase: 'F+N',
      powerVA: 1200,
      powerW: 1200,
      currentIb: 9.45,
      conductorGauge: 2.5,
      breakerAmps: 16,
      cableAmpacityIz: 21.6,
      voltageDropPercent: 1.6,
      isCompliant: true,
      notes: '2x 600VA (Máquina e ferro)'
    },
    {
      id: 5,
      name: 'TUGs Sala, Quartos e Banheiro',
      type: 'tug',
      voltage: 127,
      phase: 'F+N',
      powerVA: 1100,
      powerW: 1100,
      currentIb: 8.66,
      conductorGauge: 2.5,
      breakerAmps: 16,
      cableAmpacityIz: 21.6,
      voltageDropPercent: 1.5,
      isCompliant: true,
      notes: 'Geral 100VA e Lavatório 600VA'
    },
    {
      id: 6,
      name: 'TUE Chuveiro Social',
      type: 'tue',
      voltage: 220,
      phase: 'F+F',
      powerVA: 5500,
      powerW: 5500,
      currentIb: 25.0,
      conductorGauge: 6.0,
      breakerAmps: 32,
      cableAmpacityIz: 36.9,
      voltageDropPercent: 1.4,
      isCompliant: true,
      notes: 'Chuveiro 5500W 220V - Circuito Exclusivo'
    },
    {
      id: 7,
      name: 'TUE Ar Condicionado Quarto Casal',
      type: 'tue',
      voltage: 220,
      phase: 'F+F',
      powerVA: 1800,
      powerW: 1800,
      currentIb: 8.18,
      conductorGauge: 2.5,
      breakerAmps: 16,
      cableAmpacityIz: 21.6,
      voltageDropPercent: 1.1,
      isCompliant: true,
      notes: 'Split 12000 BTU 220V - Circuito Exclusivo'
    }
  ];

  const doorsWindows: DoorWindow[] = [
    { id: 'dw_porta_entrada', type: 'porta_simples', x: 0.8, y: 0.0, rotation: 0, width: 0.80, height: 2.10, description: 'Porta de Entrada Social 80x210cm' },
    { id: 'dw_janela_sala', type: 'janela', x: 2.8, y: 0.0, rotation: 0, width: 1.50, height: 1.20, peitoril: 1.00, description: 'Janela Sala Estar 150x120cm' },
    { id: 'dw_porta_coz', type: 'porta_correr', x: 4.5, y: 1.2, rotation: 90, width: 0.80, height: 2.10, description: 'Porta Cozinha / Sala' },
    { id: 'dw_janela_coz', type: 'janela', x: 8.5, y: 3.1, rotation: 90, width: 1.20, height: 1.00, peitoril: 1.20, description: 'Janela Cozinha' },
    { id: 'dw_janela_serv', type: 'janela', x: 8.5, y: 1.1, rotation: 90, width: 1.00, height: 1.00, peitoril: 1.20, description: 'Janela Área de Serviço' },
    { id: 'dw_porta_q1', type: 'porta_simples', x: 1.5, y: 4.0, rotation: 0, width: 0.80, height: 2.10, description: 'Porta Quarto Casal' },
    { id: 'dw_porta_q2', type: 'porta_simples', x: 4.8, y: 4.0, rotation: 0, width: 0.70, height: 2.10, description: 'Porta Quarto 2' },
    { id: 'dw_porta_banho', type: 'porta_simples', x: 6.8, y: 4.0, rotation: 0, width: 0.70, height: 2.10, description: 'Porta Banheiro Social' },
    { id: 'dw_janela_q1', type: 'janela', x: 2.0, y: 7.0, rotation: 0, width: 1.40, height: 1.20, peitoril: 1.00, description: 'Janela Quarto Casal' },
    { id: 'dw_janela_q2', type: 'janela', x: 5.1, y: 7.0, rotation: 0, width: 1.20, height: 1.20, peitoril: 1.00, description: 'Janela Quarto 2' },
  ];

  const dimensions: DimensionMeasurement[] = [
    { id: 'dim_total_x', p1: { x: 0, y: -0.6 }, p2: { x: 8.5, y: -0.6 }, offset: 0.4, label: '8.50 m (Fachada)' },
    { id: 'dim_total_y', p1: { x: -0.6, y: 0 }, p2: { x: -0.6, y: 7.0 }, offset: 0.4, label: '7.00 m (Lateral)' },
  ];

  const panelBoard: PanelBoard = {
    id: 'panel_principal',
    name: 'Quadro de Distribuição QDC-01',
    voltageSystem: '127/220V',
    inletType: 'Bifásico',
    mainBreakerAmps: 50,
    dpsRatingKA: 20,
    idrSensitivityMA: 30,
    circuits
  };

  return {
    projectName: 'Residência Modelo 2 Quartos - NBR 5410',
    author: 'Eng. Eletricista OHMVEX',
    standard: 'NBR 5410:2004',
    voltageNominal: 127,
    gridSnapSize: 0.1,
    walls,
    doorsWindows,
    dimensions,
    rooms,
    symbols,
    conduits,
    panelBoard
  };
}

export function createBlankProject(): ProjectData {
  const circuits: CircuitInfo[] = [
    {
      id: 1,
      name: 'Circuito 1 - Iluminação Geral',
      type: 'iluminacao',
      voltage: 127,
      phase: 'F+N',
      powerVA: 600,
      powerW: 600,
      currentIb: 4.72,
      conductorGauge: 1.5,
      breakerAmps: 10,
      cableAmpacityIz: 17.5,
      voltageDropPercent: 0.8,
      isCompliant: true,
      notes: 'Iluminação Geral'
    },
    {
      id: 2,
      name: 'Circuito 2 - TUGs Tomadas Gerais',
      type: 'tug',
      voltage: 127,
      phase: 'F+N',
      powerVA: 1200,
      powerW: 1200,
      currentIb: 9.45,
      conductorGauge: 2.5,
      breakerAmps: 16,
      cableAmpacityIz: 24.0,
      voltageDropPercent: 1.1,
      isCompliant: true,
      notes: 'Tomadas de Uso Geral'
    }
  ];

  const panelBoard: PanelBoard = {
    id: 'panel_principal',
    name: 'Quadro de Distribuição QDC-01',
    voltageSystem: '127/220V',
    inletType: 'Bifásico',
    mainBreakerAmps: 40,
    dpsRatingKA: 20,
    idrSensitivityMA: 30,
    circuits
  };

  return {
    projectName: 'Novo Projeto Elétrico',
    author: 'Engenheiro Eletricista OHMVEX',
    standard: 'NBR 5410:2004',
    voltageNominal: 127,
    gridSnapSize: 0.1,
    walls: [],
    doorsWindows: [],
    dimensions: [],
    rooms: [],
    symbols: [],
    conduits: [],
    panelBoard
  };
}
