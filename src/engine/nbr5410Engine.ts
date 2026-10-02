/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Módulo 1 - Engine de Regras NBR 5410
 * Implementação matemática e normativa pura (sem dependências externas)
 */

import {
  CircuitType,
  NbrLightingCalc,
  NbrTugCalc,
  RoomType
} from '../types/cad';

export interface AmpacityEntry {
  gaugeMm2: number;
  ampacityB1_2cond: number; // 2 condutores carregados (F+N ou F+F)
  ampacityB1_3cond: number; // 3 condutores carregados (3F ou 3F+N)
  minForApplication: 'iluminacao' | 'forca' | 'geral';
}

export interface BreakerSizingResult {
  currentIb: number;              // Corrente de projeto (A)
  breakerIn: number;              // Corrente nominal do disjuntor (A)
  conductorGauge: number;         // Seção transversal do condutor (mm²)
  ampacityIz: number;             // Capacidade de condução de corrente corrigida (A)
  isCompliant: boolean;           // Ib <= In <= Iz
  voltageDropPercent: number;     // Queda de tensão estimada (%)
  correctionFactor: number;       // Fator total (temperatura * agrupamento)
  log: string[];
}

export class Nbr5410Engine {
  /**
   * Tabela 36 da NBR 5410: Condutores de cobre, isolação de PVC 70°C, Método B1 (em eletroduto embutido em alvenaria)
   */
  public static readonly AMPACITY_TABLE_B1: AmpacityEntry[] = [
    { gaugeMm2: 1.5, ampacityB1_2cond: 17.5, ampacityB1_3cond: 15.5, minForApplication: 'iluminacao' },
    { gaugeMm2: 2.5, ampacityB1_2cond: 24.0, ampacityB1_3cond: 21.0, minForApplication: 'forca' },
    { gaugeMm2: 4.0, ampacityB1_2cond: 32.0, ampacityB1_3cond: 28.0, minForApplication: 'geral' },
    { gaugeMm2: 6.0, ampacityB1_2cond: 41.0, ampacityB1_3cond: 36.0, minForApplication: 'geral' },
    { gaugeMm2: 10.0, ampacityB1_2cond: 57.0, ampacityB1_3cond: 50.0, minForApplication: 'geral' },
    { gaugeMm2: 16.0, ampacityB1_2cond: 76.0, ampacityB1_3cond: 68.0, minForApplication: 'geral' },
    { gaugeMm2: 25.0, ampacityB1_2cond: 101.0, ampacityB1_3cond: 89.0, minForApplication: 'geral' },
    { gaugeMm2: 35.0, ampacityB1_2cond: 125.0, ampacityB1_3cond: 110.0, minForApplication: 'geral' },
    { gaugeMm2: 50.0, ampacityB1_2cond: 151.0, ampacityB1_3cond: 134.0, minForApplication: 'geral' },
  ];

  /**
   * Valores comerciais nominais de Disjuntores Termomagnéticos padrão DIN (Curva C)
   */
  public static readonly COMMERCIAL_BREAKERS_AMPS: number[] = [
    10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125
  ];

  /**
   * Tabela 42 da NBR 5410: Fatores de correção para agrupamento de circuitos (Fator Fg)
   * Número de circuitos ou cabos multipolares no mesmo eletroduto
   */
  public static getGroupingFactor(circuitCount: number): number {
    if (circuitCount <= 1) return 1.00;
    if (circuitCount === 2) return 0.80;
    if (circuitCount === 3) return 0.70;
    if (circuitCount === 4) return 0.65;
    if (circuitCount === 5) return 0.60;
    if (circuitCount === 6) return 0.57;
    if (circuitCount <= 8) return 0.52;
    return 0.48; // 9 ou mais circuitos
  }

  /**
   * Tabela 40 da NBR 5410: Fator de correção de temperatura ambiente para isolação PVC (Fator Ft)
   */
  public static getTemperatureFactor(ambientTempCelsius: number = 30): number {
    if (ambientTempCelsius <= 30) return 1.00;
    if (ambientTempCelsius <= 35) return 0.94;
    if (ambientTempCelsius <= 40) return 0.87;
    if (ambientTempCelsius <= 45) return 0.79;
    if (ambientTempCelsius <= 50) return 0.71;
    return 0.61;
  }

  /**
   * Item 9.5.2.1: Dimensionamento da Carga Mínima de Iluminação
   * - Área <= 6m²: 100 VA
   * - Área > 6m²: 100 VA para os primeiros 6m² + 60 VA para cada aumento completo de 4m²
   */
  public static calculateLighting(roomName: string, area: number): NbrLightingCalc {
    const safeArea = Math.max(0.1, Number(area.toFixed(2)));
    let minimumVA = 100;
    let formulaDescription = 'Área ≤ 6.0m² ⟹ Mínimo 100 VA';

    if (safeArea > 6.0) {
      const extraArea = safeArea - 6.0;
      const fullIncrementsOf4 = Math.floor(extraArea / 4.0);
      minimumVA = 100 + fullIncrementsOf4 * 60;
      formulaDescription = `Área > 6.0m² ⟹ 100 VA (6m²) + ${fullIncrementsOf4} × 60 VA = ${minimumVA} VA`;
    }

    // Sugestão de distribuição de pontos (ex: para salas ou quartos grandes, mais de 1 ponto de luz no teto)
    let suggestedPoints = 1;
    if (safeArea >= 18.0) {
      suggestedPoints = Math.ceil(safeArea / 12.0);
    }

    return {
      roomName,
      area: safeArea,
      minimumVA,
      suggestedPoints,
      formulaDescription,
    };
  }

  /**
   * Item 9.5.2.2: Dimensionamento de Tomadas de Uso Geral (TUGs)
   */
  public static calculateTugs(
    roomName: string,
    roomType: RoomType,
    perimeter: number,
    area: number
  ): NbrTugCalc {
    const safePerimeter = Math.max(0.5, Number(perimeter.toFixed(2)));
    const safeArea = Math.max(0.1, Number(area.toFixed(2)));

    let minimumTugs = 1;
    const tugPowerBreakdown: { powerVA: number; count: number }[] = [];
    let totalVA = 0;
    let formulaDescription = '';

    switch (roomType) {
      case 'banheiro': {
        // NBR 5410 item 9.5.2.2.1 a): No mínimo 1 tomada junto ao lavatório, potência mínima de 600 VA
        minimumTugs = 1;
        tugPowerBreakdown.push({ powerVA: 600, count: 1 });
        totalVA = 600;
        formulaDescription = 'Banheiro: Mínimo 1 TUG junto ao lavatório de 600 VA (Item 9.5.2.2.1-a)';
        break;
      }

      case 'copa_cozinha':
      case 'area_servico': {
        // NBR 5410 item 9.5.2.2.1 b): 1 tomada para cada 3,5m ou fração de perímetro
        // Potência: 600 VA por ponto até 3 pontos; 100 VA para os demais
        minimumTugs = Math.max(1, Math.ceil(safePerimeter / 3.5));
        const count600VA = Math.min(3, minimumTugs);
        const count100VA = Math.max(0, minimumTugs - 3);

        if (count600VA > 0) tugPowerBreakdown.push({ powerVA: 600, count: count600VA });
        if (count100VA > 0) tugPowerBreakdown.push({ powerVA: 100, count: count100VA });

        totalVA = count600VA * 600 + count100VA * 100;
        formulaDescription = `Cozinha/Área de Serviço: 1 TUG a cada 3,5m de perímetro (${safePerimeter}m ⟹ ${minimumTugs} tomadas: ${count600VA}×600VA + ${count100VA}×100VA = ${totalVA} VA)`;
        break;
      }

      case 'corredor': {
        // Corredores < 6m²: pelo menos 1 tomada; se >= 6m²: 1 a cada 5m
        if (safeArea < 6.0) {
          minimumTugs = 1;
          formulaDescription = 'Corredor com área < 6m² ⟹ Mínimo 1 TUG de 100 VA';
        } else {
          minimumTugs = Math.max(1, Math.ceil(safePerimeter / 5.0));
          formulaDescription = `Corredor com área ≥ 6m² ⟹ 1 TUG a cada 5m (${safePerimeter}m ⟹ ${minimumTugs} tomadas de 100 VA)`;
        }
        tugPowerBreakdown.push({ powerVA: 100, count: minimumTugs });
        totalVA = minimumTugs * 100;
        break;
      }

      case 'varanda': {
        // Pelo menos 1 tomada de 100 VA
        minimumTugs = 1;
        tugPowerBreakdown.push({ powerVA: 100, count: 1 });
        totalVA = 100;
        formulaDescription = 'Varanda/Sacada ⟹ Mínimo 1 TUG de 100 VA';
        break;
      }

      case 'sala':
      case 'quarto':
      case 'garagem':
      case 'outro':
      default: {
        // Salas e dormitórios: 1 tomada para cada 5m ou fração de perímetro (100 VA cada)
        // Se área <= 6m²: no mínimo 1 tomada
        if (safeArea <= 6.0) {
          minimumTugs = 1;
          formulaDescription = `Cômodo ≤ 6m² (${safeArea}m²) ⟹ Mínimo 1 TUG de 100 VA`;
        } else {
          minimumTugs = Math.max(1, Math.ceil(safePerimeter / 5.0));
          formulaDescription = `Salas/Quartos: 1 TUG a cada 5m de perímetro (${safePerimeter}m ⟹ ${minimumTugs} tomadas de 100 VA)`;
        }
        tugPowerBreakdown.push({ powerVA: 100, count: minimumTugs });
        totalVA = minimumTugs * 100;
        break;
      }
    }

    return {
      roomName,
      roomType,
      perimeter: safePerimeter,
      area: safeArea,
      minimumTugs,
      tugPowerBreakdown,
      totalVA,
      formulaDescription,
    };
  }

  /**
   * Dimensionamento de Condutores e Disjuntores Termomagnéticos
   * Critério estrito da NBR 5410: Ib <= In <= Iz
   * 
   * @param powerVA Potência aparente em VA
   * @param voltage Tensão nominal (127V ou 220V)
   * @param type Tipo de circuito ('iluminacao' | 'tug' | 'tue')
   * @param circuitsInConduit Número de circuitos agrupados no eletroduto
   * @param circuitLengthMeters Comprimento médio do circuito para verificação de queda de tensão
   * @param ambientTemp Temperatura ambiente em °C
   */
  public static sizeCircuitBreakerAndCable(
    powerVA: number,
    voltage: number,
    type: CircuitType,
    circuitsInConduit: number = 2,
    circuitLengthMeters: number = 15,
    ambientTemp: number = 30
  ): BreakerSizingResult {
    const log: string[] = [];

    if (powerVA <= 0) {
      throw new Error(`Potência do circuito deve ser superior a zero (recebido: ${powerVA} VA)`);
    }
    if (voltage <= 0) {
      throw new Error(`Tensão do circuito inválida (recebido: ${voltage} V)`);
    }

    // 1. Cálculo da Corrente de Projeto Ib: Ib = S / V (monofásico)
    const currentIb = Number((powerVA / voltage).toFixed(2));
    log.push(`Cálculo da corrente de projeto Ib: ${powerVA} VA / ${voltage} V = ${currentIb} A`);

    // 2. Fatores de Correção
    const fg = this.getGroupingFactor(circuitsInConduit);
    const ft = this.getTemperatureFactor(ambientTemp);
    const totalCorrectionFactor = Number((fg * ft).toFixed(3));
    log.push(`Fator de agrupamento (Fg): ${fg} (${circuitsInConduit} circuitos agrupados)`);
    log.push(`Fator de temperatura (Ft): ${ft} (${ambientTemp}°C)`);
    log.push(`Fator de correção total (F = Fg × Ft): ${totalCorrectionFactor}`);

    // 3. Seção Mínima Normativa (NBR 5410 Item 6.2.6.1.1, Tabela 47):
    // Iluminação: mínimo 1.5 mm²
    // Força (TUG/TUE): mínimo 2.5 mm²
    const minGaugeNormative = type === 'iluminacao' ? 1.5 : 2.5;
    log.push(`Seção mínima por critério mecânico/normativo: ${minGaugeNormative} mm² (${type})`);

    // 4. Busca iterativa do condutor e do disjuntor adequado atendendo a Ib <= In <= Iz
    let selectedGauge: number | null = null;
    let selectedBreaker: number | null = null;
    let selectedIz: number = 0;
    let selectedVoltageDrop = 0;

    for (const entry of this.AMPACITY_TABLE_B1) {
      if (entry.gaugeMm2 < minGaugeNormative) {
        continue;
      }

      // Capacidade de corrente corrigida Iz = Iz_tab * (Fg * Ft)
      const izBase = entry.ampacityB1_2cond;
      const izCorrected = Number((izBase * totalCorrectionFactor).toFixed(2));

      // Deve existir algum In comercial tal que: Ib <= In <= IzCorrected
      const viableBreakers = this.COMMERCIAL_BREAKERS_AMPS.filter(
        (inAmps) => inAmps >= currentIb && inAmps <= izCorrected
      );

      if (viableBreakers.length > 0) {
        // Escolhe o menor disjuntor que satisfaz Ib <= In <= Iz
        const candidateIn = viableBreakers[0];

        // Queda de tensão percentual: DeltaV% = (200 * L * I) / (gamma * S * V)
        // Cobre a 70°C: condutividade gamma ≈ 45.4 m/(Ohm.mm²)
        const gammaCopper70 = 45.4;
        const deltaV = (200 * circuitLengthMeters * currentIb) / (gammaCopper70 * entry.gaugeMm2 * voltage);
        const deltaVPercent = Number(deltaV.toFixed(2));

        // NBR 5410 Item 6.2.7: Queda de tensão máxima admissível a partir do QDC é 4%
        if (deltaVPercent <= 4.0 || entry.gaugeMm2 >= 10.0) {
          selectedGauge = entry.gaugeMm2;
          selectedBreaker = candidateIn;
          selectedIz = izCorrected;
          selectedVoltageDrop = deltaVPercent;
          log.push(
            `Bitola encontrada: ${selectedGauge} mm² | Disjuntor In: ${selectedBreaker} A | Iz corrigido: ${selectedIz} A`
          );
          log.push(
            `Condição satisfeita: ${currentIb} A (Ib) ≤ ${selectedBreaker} A (In) ≤ ${selectedIz} A (Iz)`
          );
          log.push(`Queda de tensão estimada (${circuitLengthMeters}m): ${deltaVPercent}% (limite máx 4.0%)`);
          break;
        }
      }
    }

    if (!selectedGauge || !selectedBreaker) {
      // Se não encontrou par viável nas bitolas usuais, dispara erro técnico descritivo
      throw new Error(
        `Incompatibilidade NBR 5410: Não foi possível dimensionar condutor e disjuntor para a corrente Ib = ${currentIb} A ` +
        `com fator de agrupamento ${totalCorrectionFactor}. Aumente a bitola, diminua os circuitos agrupados ou divida a carga.`
      );
    }

    return {
      currentIb,
      breakerIn: selectedBreaker,
      conductorGauge: selectedGauge,
      ampacityIz: selectedIz,
      isCompliant: currentIb <= selectedBreaker && selectedBreaker <= selectedIz,
      voltageDropPercent: selectedVoltageDrop,
      correctionFactor: totalCorrectionFactor,
      log,
    };
  }

  /**
   * Calcula o diâmetro externo médio aproximado de cabos unipolares de cobre isolados em PVC 70°C / 750V
   * Conforme catálogo técnico de fabricantes nacionais (NBR 247-3)
   */
  public static getCableExternalDiameterMm(gaugeMm2: number): number {
    switch (gaugeMm2) {
      case 1.5: return 3.0; // mm
      case 2.5: return 3.6; // mm
      case 4.0: return 4.2; // mm
      case 6.0: return 4.8; // mm
      case 10.0: return 6.3; // mm
      case 16.0: return 7.6; // mm
      case 25.0: return 9.5; // mm
      case 35.0: return 11.0; // mm
      case 50.0: return 13.0; // mm
      default: return Math.sqrt(gaugeMm2) * 2.2;
    }
  }

  /**
   * Retorna a área da seção transversal externa total de um condutor (mm²)
   */
  public static getCableExternalAreaMm2(gaugeMm2: number): number {
    const d = this.getCableExternalDiameterMm(gaugeMm2);
    return (Math.PI * Math.pow(d, 2)) / 4.0;
  }

  /**
   * Diâmetro interno útil de eletrodutos comerciais em PVC rígido/corrugado (NBR 15465)
   */
  public static getConduitInternalDiameterMm(nominalDiameterMm: number): number {
    switch (nominalDiameterMm) {
      case 20: return 16.0; // DN 20 (1/2")
      case 25: return 20.4; // DN 25 (3/4")
      case 32: return 26.0; // DN 32 (1")
      case 40: return 34.0; // DN 40 (1 1/4")
      case 50: return 44.0; // DN 50 (1 1/2")
      default: return nominalDiameterMm * 0.82;
    }
  }

  /**
   * Área interna útil do eletroduto (mm²)
   */
  public static getConduitInternalAreaMm2(nominalDiameterMm: number): number {
    const dInt = this.getConduitInternalDiameterMm(nominalDiameterMm);
    return (Math.PI * Math.pow(dInt, 2)) / 4.0;
  }

  /**
   * Taxa de ocupação máxima permitida por NBR 5410 item 6.2.11.1
   */
  public static getMaxAllowedOccupancyRate(wireCount: number): number {
    if (wireCount === 1) return 53.0; // 53% para 1 cabo
    if (wireCount === 2) return 31.0; // 31% para 2 cabos
    return 40.0; // 40% para 3 ou mais cabos
  }

  /**
   * Cálculo da taxa de ocupação real e seleção do eletroduto mínimo compatível
   */
  public static sizeConduit(cables: { gaugeMm2: number; count: number }[]): {
    totalCableAreaMm2: number;
    recommendedDn: number;
    occupancyRate: number;
    maxAllowedRate: number;
    isCompliant: boolean;
  } {
    let totalCableAreaMm2 = 0;
    let totalWireCount = 0;

    for (const cable of cables) {
      const singleCableArea = this.getCableExternalAreaMm2(cable.gaugeMm2);
      totalCableAreaMm2 += singleCableArea * cable.count;
      totalWireCount += cable.count;
    }

    const maxAllowedRate = this.getMaxAllowedOccupancyRate(totalWireCount);
    const standardDNs = [20, 25, 32, 40, 50];

    for (const dn of standardDNs) {
      const conduitArea = this.getConduitInternalAreaMm2(dn);
      const rate = (totalCableAreaMm2 / conduitArea) * 100;
      if (rate <= maxAllowedRate) {
        return {
          totalCableAreaMm2: Number(totalCableAreaMm2.toFixed(2)),
          recommendedDn: dn,
          occupancyRate: Number(rate.toFixed(1)),
          maxAllowedRate,
          isCompliant: true,
        };
      }
    }

    // Se passou de DN 50
    const fallbackDn = 50;
    const conduitArea = this.getConduitInternalAreaMm2(fallbackDn);
    const rate = (totalCableAreaMm2 / conduitArea) * 100;
    return {
      totalCableAreaMm2: Number(totalCableAreaMm2.toFixed(2)),
      recommendedDn: fallbackDn,
      occupancyRate: Number(rate.toFixed(1)),
      maxAllowedRate,
      isCompliant: rate <= maxAllowedRate,
    };
  }
}
