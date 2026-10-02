# Ohmvex - Plataforma CAD de Automação de Projetos Elétricos (NBR 5410)

[![Live Studio](https://img.shields.io/badge/Studio-Live%20Demo-007ACC?style=for-the-badge&logo=googlechrome)](https://ohmvex.ai.studio/)
[![Licença](https://img.shields.io/badge/Licença-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC107?style=for-the-badge&logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Ohmvex** é uma plataforma CAD desktop e web projetada para automatizar o ciclo completo de desenvolvimento de projetos elétricos residenciais e prediais de baixa tensão, assegurando conformidade rigorosa com as diretrizes da **NBR 5410** e **NBR 5261**.

Acesse a versão online em: [https://ohmvex.ai.studio/](https://ohmvex.ai.studio/)

---

## 🎯 Funcionalidades Principais

* **Editor CAD 2D Vetorial:** Desenho fluido de paredes, cotação automática, definição de cômodos com cálculo instantâneo de área ($m^2$) e perímetro ($m$).
* **Motor NBR 5410 Automático:**
  * Lançamento automático da quantidade e potência mínima de Iluminação (Item 9.5.2.1).
  * Lançamento e distribuição de Tomadas de Uso Geral (TUGs) e Tomadas de Uso Específico (TUEs) conforme a destinação do ambiente (Item 9.5.2.2).
* **Roteamento de Condutores por Grafos:**
  * Algoritmo de menor caminho ($A^* / Dijkstra$) para passagem automática de fiação pelos eletrodutos.
  * Identificação dinâmica de Fase, Neutro, Terra e Retornos em cada trecho.
* **Validação de Ocupação de Conduíte:**
  * Cálculo automatizado da taxa de ocupação da seção transversal do eletroduto segundo o item 6.2.11.1 da NBR 5410 ($53\%$ para 1 cabo, $31\%$ para 2 cabos, $40\%$ para 3 ou mais cabos).
* **Dimensionamento do Quadro de Distribuição (QDC):**
  * Seleção automática de seção de cabos (Tabela 36 - Método B1) e especificação de Disjuntores Termomagnéticos (DTM Curva C) respeitando a condição $I_b \le I_n \le I_z$.
* **Visualização 3D em Tempo Real:** Extrusão automática das paredes e tubulações via Three.js.
* **Geração de Diagrama Unifilar:** Desenho automático dos barramentos, circuitos, IDR e DPS.
* **Exportação Universal:** Exportação nativa em arquivo **DXF (ASCII)** para compatibilidade com AutoCAD/QCAD e relatório de Lista de Materiais (BOM) em PDF/CSV.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Desktop Shell** | [Tauri v2](https://tauri.app/) (Rust) - Executável leve offline |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Estilização UI** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Engine CAD 2D** | HTML5 Canvas Nativo / Konva.js |
| **Engine 3D** | [Three.js](https://threejs.org/) / React Three Fiber |
| **Exportação CAD** | Gerador Nativo de Entidades DXF ASCII |

---

## 📐 Estrutura do Motor de Cálculo (NBR 5410)

[ Entrada de Dados do Cômodo ]
│
├──► 1. Cálculo de Iluminação (Mínimo 100VA p/ 6m² + 60VA a cada 4m² acrescidos)
│
├──► 2. Cálculo de TUGs (Áreas Molhadas: 1 a cada 3.5m / Outros: 1 a cada 5m)
│
├──► 3. Agrupamento em Circuitos e Cálculo de Corrente de Projeto (Ib)
│
├──► 4. Dimensionamento de Seção (Tabela 36 B1) + Seleção DTM (In)
│
└──► 5. Roteamento pelo Grafo de Eletrodutos e Validação de Ocupação (< 40%)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

* [Node.js](https://nodejs.org/) (Versão 18 ou superior)
* [pnpm](https://pnpm.io/) ou `npm`
* [Rust](https://www.rust-lang.org/) (Necessário apenas para compilação Desktop via Tauri)

### 1. Clonar o Repositório

```bash
git clone [https://github.com/seu-usuario/ohmvex.git](https://github.com/seu-usuario/ohmvex.git)
cd ohmvex

---

2. Instalar as Dependências
npm install
# ou
pnpm install

---

3. Executar em Modo Desenvolvimento (Navegador)
npm run dev

---

Acesse http://localhost:5173 no navegador.

---

4. Executar em Modo Desenvolvimento (Desktop - Tauri)
npm run tauri dev

---

Build de Produção
Compilar para Web
npm run build

Os arquivos estáticos serão gerados na pasta dist/.

Compilar Executável Desktop (Windows / Linux / macOS)
npm run tauri build

---

O instalador nativo (.msi, .exe ou .AppImage) será gerado na pasta src-tauri/target/release/bundle/

Estrutura de Diretórios

ohmvex/
├── public/                    # Assets estáticos e símbolos vetoriais (NBR 5261)
├── src/
│   ├── assets/                # Estilos e ícones
│   ├── components/
│   │   ├── Canvas2D.tsx       # Canvas interativo do Editor 2D
│   │   ├── View3D.tsx         # Renderizador 3D (Three.js)
│   │   ├── UnifilarView.tsx   # Renderizador do Diagrama Unifilar
│   │   └── Sidebar.tsx        # Painel de controle de componentes
│   ├── engine/
│   │   ├── nbr5410Engine.ts   # Motor de dimensionamento e regras NBR 5410
│   │   ├── graphRouter.ts     # Roteamento automático de fios em eletrodutos
│   │   ├── conduitChecker.ts  # Cálculo de taxa de ocupação de eletrodutos
│   │   └── dxfExporter.ts     # Gerador de arquivos DXF
│   ├── types/
│   │   └── electrical.ts      # Tipos e interfaces estritas do TypeScript
│   ├── App.tsx                # Container principal da aplicação
│   └── main.tsx               # Ponto de entrada React
├── src-tauri/                 # Backend nativo Rust (Tauri)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md

---

Licença
Este projeto está licenciado sob a licença MIT - consulte o arquivo LICENSE para obter mais detalhes.

✉️ Contato e Suporte
Plataforma: https://ohmvex.ai.studio/

Issues: Para relatar bugs ou sugerir novas funcionalidades, abra uma Issue no GitHub.
