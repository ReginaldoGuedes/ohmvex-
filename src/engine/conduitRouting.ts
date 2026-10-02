/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Módulo 2 - Roteamento de Fios e Taxa de Ocupação
 * Grafo Elétrico, Dijkstra Shortest Path, Passagem Automática de Condutores e Ocupação NBR 5410
 */

import {
  ConduitSegment,
  ElectricalSymbol,
  WireConductor,
  WireType
} from '../types/cad';
import { Nbr5410Engine } from './nbr5410Engine';

export interface GraphEdge {
  conduitId: string;
  targetId: string;
  weight: number;
}

export interface WireRoutingSummary {
  updatedConduits: ConduitSegment[];
  totalWireLengthsByGaugeAndType: Record<string, number>;
  totalConduitLengthsByDn: Record<number, number>;
  occupancyWarnings: string[];
}

export class ConduitRoutingEngine {
  /**
   * Constrói grafo de adjacência a partir dos símbolos e eletrodutos
   */
  public static buildAdjacencyGraph(
    symbols: ElectricalSymbol[],
    conduits: ConduitSegment[]
  ): Map<string, GraphEdge[]> {
    const symbolMap = new Map<string, ElectricalSymbol>();
    symbols.forEach(s => symbolMap.set(s.id, s));

    const graph = new Map<string, GraphEdge[]>();
    symbols.forEach(s => graph.set(s.id, []));

    for (const conduit of conduits) {
      const s1 = symbolMap.get(conduit.startSymbolId);
      const s2 = symbolMap.get(conduit.endSymbolId);

      if (!s1 || !s2) continue;

      // Distância Euclidiana 2D + altura 3D (diferença de cota entre aparelhos)
      const dx = s1.x - s2.x;
      const dy = s1.y - s2.y;
      const h1 = this.getHeightInMeters(s1.height);
      const h2 = this.getHeightInMeters(s2.height);
      const dz = Math.abs(h1 - h2);

      // Comprimento do tubo considerando curvas e subidas/descidas na parede
      const length2D = Math.sqrt(dx * dx + dy * dy);
      const length3D = Math.sqrt(length2D * length2D + dz * dz) * 1.05; // 5% folga de montagem
      const weight = Number(length3D.toFixed(2));

      conduit.lengthMeters = weight;

      if (!graph.has(s1.id)) graph.set(s1.id, []);
      if (!graph.has(s2.id)) graph.set(s2.id, []);

      graph.get(s1.id)!.push({ conduitId: conduit.id, targetId: s2.id, weight });
      graph.get(s2.id)!.push({ conduitId: conduit.id, targetId: s1.id, weight });
    }

    return graph;
  }

  /**
   * Altura física de montagem em metros segundo a NBR 5410
   */
  public static getHeightInMeters(height: string): number {
    switch (height) {
      case 'teto': return 2.80; // Na laje / teto
      case 'parede_alta': return 2.10; // Chuveiro, ar condicionado
      case 'parede_media': return 1.20; // Interruptores e tomadas médias
      case 'parede_baixa': return 0.30; // Tomadas baixas
      case 'piso': return 0.00;
      default: return 1.20;
    }
  }

  /**
   * Algoritmo de Dijkstra para encontrar o menor caminho entre a origem e o destino no grafo
   */
  public static findShortestPath(
    graph: Map<string, GraphEdge[]>,
    sourceId: string,
    targetId: string
  ): { path: string[]; conduitIds: string[]; distance: number } | null {
    if (sourceId === targetId) {
      return { path: [sourceId], conduitIds: [], distance: 0 };
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, { nodeId: string; conduitId: string } | null>();
    const unvisited = new Set<string>();

    for (const nodeId of graph.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    distances.set(sourceId, 0);

    while (unvisited.size > 0) {
      // Nó não visitado com menor distância
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const d = distances.get(nodeId)!;
        if (d < minDistance) {
          minDistance = d;
          currentId = nodeId;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break;
      }

      if (currentId === targetId) {
        break;
      }

      unvisited.delete(currentId);

      const neighbors = graph.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.targetId)) continue;

        const alt = distances.get(currentId)! + edge.weight;
        if (alt < distances.get(edge.targetId)!) {
          distances.set(edge.targetId, alt);
          previous.set(edge.targetId, { nodeId: currentId, conduitId: edge.conduitId });
        }
      }
    }

    if (distances.get(targetId) === Infinity) {
      return null; // Sem caminho
    }

    // Reconstrução do caminho
    const path: string[] = [];
    const conduitIds: string[] = [];
    let curr: string | null = targetId;

    while (curr) {
      path.unshift(curr);
      const prev = previous.get(curr);
      if (prev) {
        conduitIds.unshift(prev.conduitId);
        curr = prev.nodeId;
      } else {
        curr = null;
      }
    }

    return {
      path,
      conduitIds,
      distance: distances.get(targetId)!,
    };
  }

  /**
   * Distribuição automática de condutores por todos os trechos de eletroduto
   * Regras de fiação:
   * - Circuito de Tomadas (TUG/TUE): Fase, Neutro, Terra do QDC até cada tomada.
   * - Circuito de Iluminação:
   *     * Neutro e Terra do QDC até a Caixa de Teto (Luminária)
   *     * Fase do QDC até o Interruptor
   *     * Retorno do Interruptor até a Caixa de Teto
   *     * Se for interruptor paralelo: 2 Retornos entre os dois interruptores
   */
  public static routeConductors(
    symbols: ElectricalSymbol[],
    conduits: ConduitSegment[],
    circuitGauges: Record<number, number> = {}
  ): WireRoutingSummary {
    const symbolMap = new Map<string, ElectricalSymbol>();
    symbols.forEach(s => symbolMap.set(s.id, s));

    const qdc = symbols.find(s => s.type === 'qdc');
    const graph = this.buildAdjacencyGraph(symbols, conduits);

    // Mapeamento de fios adicionados a cada eletroduto: Map<conduitId, WireConductor[]>
    const conduitWiresMap = new Map<string, WireConductor[]>();
    conduits.forEach(c => conduitWiresMap.set(c.id, []));

    const addWireToConduit = (conduitId: string, wire: WireConductor) => {
      const wires = conduitWiresMap.get(conduitId);
      if (!wires) return;

      // Evita duplicatas idênticas no mesmo trecho
      const exists = wires.some(
        w =>
          w.circuitId === wire.circuitId &&
          w.type === wire.type &&
          w.returnLetter === wire.returnLetter
      );
      if (!exists) {
        wires.push(wire);
      }
    };

    if (qdc) {
      // 1. Roteamento de tomadas (TUG / TUE)
      const outletSymbols = symbols.filter(
        s => s.type === 'tug_baixa' || s.type === 'tug_media' || s.type === 'tug_alta' || s.type === 'tue_alta'
      );

      for (const outlet of outletSymbols) {
        const cId = outlet.circuitId || 1;
        const gauge = circuitGauges[cId] || (outlet.type === 'tue_alta' ? 4.0 : 2.5);

        const route = this.findShortestPath(graph, qdc.id, outlet.id);
        if (route) {
          for (const conduitId of route.conduitIds) {
            // Fase (Preto / Vermelho)
            addWireToConduit(conduitId, {
              type: 'fase',
              circuitId: cId,
              wireGauge: gauge,
              color: 'preto',
            });
            // Neutro (Azul claro - NBR 5410 item 6.1.5.3.1)
            addWireToConduit(conduitId, {
              type: 'neutro',
              circuitId: cId,
              wireGauge: gauge,
              color: 'azul_claro',
            });
            // Terra / PE (Verde / Verde-Amarelo - NBR 5410 item 6.1.5.3.2)
            addWireToConduit(conduitId, {
              type: 'terra',
              circuitId: cId,
              wireGauge: gauge,
              color: 'verde_amarelo',
            });
          }
        }
      }

      // 2. Roteamento de Iluminação
      const lightSymbols = symbols.filter(s => s.type === 'luz_teto' || s.type === 'luz_arandela');
      const switchSymbols = symbols.filter(
        s => s.type === 'interruptor_simples' || s.type === 'interruptor_paralelo' || s.type === 'interruptor_intermediario'
      );

      for (const light of lightSymbols) {
        const cId = light.circuitId || 1;
        const gauge = circuitGauges[cId] || 1.5;

        // Neutro e Terra vão do QDC até a luminária
        const routeQdcToLight = this.findShortestPath(graph, qdc.id, light.id);
        if (routeQdcToLight) {
          for (const conduitId of routeQdcToLight.conduitIds) {
            addWireToConduit(conduitId, {
              type: 'neutro',
              circuitId: cId,
              wireGauge: gauge,
              color: 'azul_claro',
            });
            addWireToConduit(conduitId, {
              type: 'terra',
              circuitId: cId,
              wireGauge: gauge,
              color: 'verde_amarelo',
            });
          }
        }

        // Interruptor correspondente ao ponto de luz (mesmo comando 'commandLetter' ou mesmo cômodo)
        const matchedSwitches = switchSymbols.filter(
          sw => (light.commandLetter && sw.commandLetter === light.commandLetter) ||
                (sw.roomId && sw.roomId === light.roomId)
        );

        if (matchedSwitches.length === 1) {
          const singleSwitch = matchedSwitches[0];
          // Fase vai do QDC até o interruptor
          const routeQdcToSwitch = this.findShortestPath(graph, qdc.id, singleSwitch.id);
          if (routeQdcToSwitch) {
            for (const conduitId of routeQdcToSwitch.conduitIds) {
              addWireToConduit(conduitId, {
                type: 'fase',
                circuitId: cId,
                wireGauge: gauge,
                color: 'preto',
              });
            }
          }

          // Retorno vai do Interruptor até o Ponto de Luz
          const routeSwitchToLight = this.findShortestPath(graph, singleSwitch.id, light.id);
          if (routeSwitchToLight) {
            for (const conduitId of routeSwitchToLight.conduitIds) {
              addWireToConduit(conduitId, {
                type: 'retorno',
                circuitId: cId,
                wireGauge: gauge,
                returnLetter: light.commandLetter || 'a',
                color: 'amarelo',
              });
            }
          }
        } else if (matchedSwitches.length >= 2) {
          // Interruptores paralelos (Three-Way)
          const sw1 = matchedSwitches[0];
          const sw2 = matchedSwitches[1];

          // Fase no primeiro interruptor
          const routeQdcToSw1 = this.findShortestPath(graph, qdc.id, sw1.id);
          if (routeQdcToSw1) {
            for (const conduitId of routeQdcToSw1.conduitIds) {
              addWireToConduit(conduitId, {
                type: 'fase',
                circuitId: cId,
                wireGauge: gauge,
                color: 'preto',
              });
            }
          }

          // 2 Retornos entre sw1 e sw2
          const routeBetweenSwitches = this.findShortestPath(graph, sw1.id, sw2.id);
          if (routeBetweenSwitches) {
            for (const conduitId of routeBetweenSwitches.conduitIds) {
              addWireToConduit(conduitId, {
                type: 'retorno',
                circuitId: cId,
                wireGauge: gauge,
                returnLetter: `${light.commandLetter || 'a'}1`,
                color: 'amarelo',
              });
              addWireToConduit(conduitId, {
                type: 'retorno',
                circuitId: cId,
                wireGauge: gauge,
                returnLetter: `${light.commandLetter || 'a'}2`,
                color: 'amarelo',
              });
            }
          }

          // Retorno de sw2 até o ponto de luz
          const routeSw2ToLight = this.findShortestPath(graph, sw2.id, light.id);
          if (routeSw2ToLight) {
            for (const conduitId of routeSw2ToLight.conduitIds) {
              addWireToConduit(conduitId, {
                type: 'retorno',
                circuitId: cId,
                wireGauge: gauge,
                returnLetter: light.commandLetter || 'a',
                color: 'amarelo',
              });
            }
          }
        }
      }
    }

    // 3. Atualização dos eletrodutos com os fios e cálculo da taxa de ocupação
    const updatedConduits: ConduitSegment[] = [];
    const occupancyWarnings: string[] = [];
    const totalWireLengthsByGaugeAndType: Record<string, number> = {};
    const totalConduitLengthsByDn: Record<number, number> = {};

    for (const conduit of conduits) {
      const wires = conduitWiresMap.get(conduit.id) || [];
      const cableGrouping: { gaugeMm2: number; count: number }[] = [];

      for (const wire of wires) {
        const found = cableGrouping.find(g => g.gaugeMm2 === wire.wireGauge);
        if (found) {
          found.count++;
        } else {
          cableGrouping.push({ gaugeMm2: wire.wireGauge, count: 1 });
        }

        // Acumula metragem do fio (comprimento do eletroduto + 0.30m de ponta para ligação em cada caixa)
        const wireLength = conduit.lengthMeters + 0.60;
        const key = `${wire.wireGauge}mm²_${wire.type}`;
        totalWireLengthsByGaugeAndType[key] = (totalWireLengthsByGaugeAndType[key] || 0) + wireLength;
      }

      // Dimensionamento do diâmetro do eletroduto
      const sizing = Nbr5410Engine.sizeConduit(cableGrouping);
      const chosenDn = Math.max(conduit.diameterNominal || 20, sizing.recommendedDn);

      conduit.wires = wires;
      conduit.diameterNominal = chosenDn;
      conduit.occupancyRate = sizing.occupancyRate;
      conduit.maxAllowedRate = sizing.maxAllowedRate;

      // Acumula metragem do eletroduto
      totalConduitLengthsByDn[chosenDn] = (totalConduitLengthsByDn[chosenDn] || 0) + conduit.lengthMeters;

      if (sizing.occupancyRate > sizing.maxAllowedRate) {
        occupancyWarnings.push(
          `Eletroduto entre ${conduit.startSymbolId} e ${conduit.endSymbolId} excede taxa máxima da NBR 5410: ` +
          `${sizing.occupancyRate}% > ${sizing.maxAllowedRate}% (${wires.length} condutores). Recomendado DN ${sizing.recommendedDn}.`
        );
      }

      updatedConduits.push({ ...conduit });
    }

    return {
      updatedConduits,
      totalWireLengthsByGaugeAndType,
      totalConduitLengthsByDn,
      occupancyWarnings,
    };
  }
}
