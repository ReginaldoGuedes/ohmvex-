/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Modal de Legenda Oficial NBR 5261 / NBR 5410
 * Símbolos elétricos, convenções gráficas de condutores e cotas de instalação
 */

import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface LegendModalProps {
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-300">
        {/* Topo */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-100 text-amber-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 font-mono">
                Legenda e Simbologia Elétrica NBR 5261 & NBR 5410
              </h2>
              <p className="text-xs text-slate-500">
                Padrão oficial brasileiro de simbologia gráfica para projetos elétricos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo da Legenda */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs font-sans">
          {/* Seção 1: Condutores e Fiação em Eletrodutos */}
          <div>
            <h3 className="font-bold font-mono text-sm text-slate-900 border-b pb-1 mb-3 text-cyan-800 uppercase">
              1. Representação Gráfica dos Condutores (Fiação)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-3 bg-slate-50 rounded border flex items-center gap-4">
                <div className="w-16 h-8 flex items-center justify-center border-b-2 border-slate-800 relative">
                  <div className="w-[2px] h-6 bg-amber-500 absolute" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Condutor de Fase (F)</span>
                  <span className="text-slate-500 text-[10px]">Traço transversal contínuo · Cor: Preto / Vermelho</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border flex items-center gap-4">
                <div className="w-16 h-8 flex items-center justify-center border-b-2 border-slate-800 relative">
                  <div className="w-[2px] h-4 bg-blue-600 absolute bottom-0" />
                  <div className="w-2 h-[2px] bg-blue-600 absolute bottom-4 right-6" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Condutor Neutro (N)</span>
                  <span className="text-slate-500 text-[10px]">Traço em &quot;L&quot; invertido · Cor: Azul Claro (Item 6.1.5.3.1)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border flex items-center gap-4">
                <div className="w-16 h-8 flex items-center justify-center border-b-2 border-slate-800 relative">
                  <div className="w-[2px] h-4 bg-emerald-600 absolute bottom-0" />
                  <div className="w-3 h-[2px] bg-emerald-600 absolute bottom-4" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Condutor de Proteção / Terra (PE)</span>
                  <span className="text-slate-500 text-[10px]">Traço em &quot;T&quot; invertido · Cor: Verde / Verde-Amarelo</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border flex items-center gap-4">
                <div className="w-16 h-8 flex items-center justify-center border-b-2 border-slate-800 relative">
                  <div className="w-[2px] h-3.5 bg-amber-600 absolute top-0" />
                </div>
                <div>
                  <span className="font-bold block text-slate-900">Condutor de Retorno (R)</span>
                  <span className="text-slate-500 text-[10px]">Meio traço para um só lado · Cor: Amarelo (ou Branco)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Iluminação */}
          <div>
            <h3 className="font-bold font-mono text-sm text-slate-900 border-b pb-1 mb-3 text-amber-800 uppercase">
              2. Símbolos de Iluminação (NBR 5261)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold font-mono">
                  a
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ponto de Luz no Teto</span>
                  <span className="text-slate-500 text-[10px]">Círculo com diâmetro, potência VA, nº do circuito e tecla</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-800 rounded-r-full border-l-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Ponto de Luz na Parede (Arandela)</span>
                  <span className="text-slate-500 text-[10px]">Instalação a 2,00m ou 2,20m do piso acabado</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-7 h-7 border-2 border-slate-800 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full border border-teal-600" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Spot Embutido / Painel LED</span>
                  <span className="text-slate-500 text-[10px]">Instalação em forro de gesso ou laje rebaixada</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-10 h-3 border-2 border-slate-800 rounded flex items-center justify-center font-mono text-[7px]">
                  LED
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Luminária Linear Tubular</span>
                  <span className="text-slate-500 text-[10px]">Tubular LED linear para cozinhas e áreas de serviço</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Tomadas de Uso Geral e Específico */}
          <div>
            <h3 className="font-bold font-mono text-sm text-slate-900 border-b pb-1 mb-3 text-cyan-800 uppercase">
              3. Tomadas e Alturas Padronizadas (NBR 5410)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <polygon points="2,18 18,18 10,2" className="stroke-slate-900 fill-none" strokeWidth="2" />
                  <span className="text-lg">△</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Tomada Baixa</span>
                  <span className="text-slate-500 text-[10px]">Altura: 30 cm do piso</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-lg font-bold">▲</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Tomada Média</span>
                  <span className="text-slate-500 text-[10px]">Altura: 120 cm (bancadas)</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-lg text-red-600 font-bold">▲</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Tomada Alta / TUE</span>
                  <span className="text-slate-500 text-[10px]">Altura: 200 a 220 cm (Chuveiro/AC)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Infraestrutura & Quadro de Distribuição */}
          <div>
            <h3 className="font-bold font-mono text-sm text-slate-900 border-b pb-1 mb-3 text-emerald-800 uppercase">
              4. Quadro de Distribuição & Infraestrutura
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-8 h-5 border-2 border-red-600 relative overflow-hidden">
                  <div className="w-8 h-5 bg-red-600 rotate-45 transform origin-top-left" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Quadro de Distribuição (QDC)</span>
                  <span className="text-slate-500 text-[10px]">Embutido na parede no centro de carga</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border flex items-center gap-3">
                <div className="w-8 h-2 border-b-2 border-dashed border-amber-500" />
                <div>
                  <span className="font-bold text-slate-900 block">Eletroduto Embutido na Laje</span>
                  <span className="text-slate-500 text-[10px]">PVC rígido ou corrugado reforçado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
