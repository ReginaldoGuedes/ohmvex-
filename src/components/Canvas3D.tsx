/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * OPEN-WOCA: Renderização 3D com Three.js
 * Visualização BIM tridimensional de paredes, eletrodutos, caixas e luminárias
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  ConduitSegment,
  DoorWindow,
  ElectricalSymbol,
  RoomDefinition,
  Wall
} from '../types/cad';
import { ConduitRoutingEngine } from '../engine/conduitRouting';
import {
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Compass
} from 'lucide-react';

interface Canvas3DProps {
  walls: Wall[];
  doorsWindows?: DoorWindow[];
  rooms: RoomDefinition[];
  symbols: ElectricalSymbol[];
  conduits: ConduitSegment[];
}

export const Canvas3D: React.FC<Canvas3DProps> = ({
  walls,
  doorsWindows = [],
  rooms,
  symbols,
  conduits
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showCeiling, setShowCeiling] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(false);
  const [lightsOn, setLightsOn] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const wallsGroupRef = useRef<THREE.Group | null>(null);
  const ceilingGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Cena
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0a0d14');
    scene.fog = new THREE.FogExp2('#0a0d14', 0.035);

    // 2. Câmera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, -8, 9);
    camera.up.set(0, 0, 1); // Z para cima (padrão arquitetura)
    camera.lookAt(4, 3.5, 1.2);
    cameraRef.current = camera;

    // 3. Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    sunLight.position.set(10, -10, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Luz de preenchimento azulada suave
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    fillLight.position.set(-10, 10, 8);
    scene.add(fillLight);

    // 5. Piso e Grade
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111726,
      roughness: 0.9,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(4, 3.5, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
    grid.rotation.x = Math.PI / 2;
    grid.position.set(4, 3.5, 0.01);
    scene.add(grid);

    // 6. Grupo de Paredes
    const wallsGroup = new THREE.Group();
    scene.add(wallsGroup);
    wallsGroupRef.current = wallsGroup;

    // 7. Grupo de Lajes de Teto
    const ceilingGroup = new THREE.Group();
    scene.add(ceilingGroup);
    ceilingGroupRef.current = ceilingGroup;

    // 8. Controles Orbitais Próprios (Smooth Mouse Rotate, Pan, Zoom)
    let isMouseDown = false;
    let buttonClicked = 0;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 14, theta: 0.8, phi: 0.7 };
    const target = new THREE.Vector3(4, 3.5, 1.2);

    const updateCameraPos = () => {
      spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = target.y - spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.position.z = target.z + spherical.radius * Math.cos(spherical.phi);
      camera.lookAt(target);
    };
    updateCameraPos();

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      buttonClicked = e.button;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      if (buttonClicked === 0) {
        // Rotação orbital
        spherical.theta -= dx * 0.008;
        spherical.phi -= dy * 0.008;
        updateCameraPos();
      } else if (buttonClicked === 2 || buttonClicked === 1) {
        // Pan lateral
        const factor = spherical.radius * 0.001;
        target.x -= dx * factor * Math.cos(spherical.theta);
        target.y -= dx * factor * Math.sin(spherical.theta);
        target.z += dy * factor;
        updateCameraPos();
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(2, Math.min(40, spherical.radius + e.deltaY * 0.015));
      updateCameraPos();
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', onContextMenu);

    // Loop de Animação
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Atualização dos Objetos 3D na Cena (Paredes, Eletrodutos, Caixas e Aparelhos)
  useEffect(() => {
    const scene = sceneRef.current;
    const wallsGroup = wallsGroupRef.current;
    const ceilingGroup = ceilingGroupRef.current;
    if (!scene || !wallsGroup || !ceilingGroup) return;

    // Limpa objetos anteriores
    while (wallsGroup.children.length > 0) {
      const obj = wallsGroup.children[0];
      wallsGroup.remove(obj);
    }
    while (ceilingGroup.children.length > 0) {
      const obj = ceilingGroup.children[0];
      ceilingGroup.remove(obj);
    }

    const wallHeight = 2.80; // Altura do pé-direito em metros

    // Materiais
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: showWireframe,
    });

    const conduitMaterialLaje = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amarelo PVC corrugado
      roughness: 0.4,
      metalness: 0.2,
    });

    const conduitMaterialParede = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Ciano PVC embutido
      roughness: 0.4,
      metalness: 0.2,
    });

    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
    });

    const lampOnMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: lightsOn ? 1.0 : 0.0,
      roughness: 0.2,
    });

    // 1. CONSTRUÇÃO DAS PAREDES 3D
    for (const wall of walls) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const length = Math.hypot(dx, dy);
      if (length < 0.1) continue;

      const angle = Math.atan2(dy, dx);
      const wallGeo = new THREE.BoxGeometry(length, wall.thickness, wallHeight);
      const wallMesh = new THREE.Mesh(wallGeo, wallMaterial);

      wallMesh.position.set(
        (wall.start.x + wall.end.x) / 2,
        (wall.start.y + wall.end.y) / 2,
        wallHeight / 2
      );
      wallMesh.rotation.z = angle;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallsGroup.add(wallMesh);
    }

    // 1.5 CONSTRUÇÃO DE ESQUADRIAS 3D (Portas e Janelas)
    const doorWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5, roughness: 0.1 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    for (const dw of doorsWindows) {
      const angle = (dw.rotation * Math.PI) / 180;
      if (dw.type.startsWith('porta')) {
        // Folha da porta de madeira
        const doorGeo = new THREE.BoxGeometry(dw.width, 0.05, dw.height);
        const doorMesh = new THREE.Mesh(doorGeo, doorWoodMat);
        doorMesh.position.set(dw.x, dw.y, dw.height / 2);
        doorMesh.rotation.z = angle;
        wallsGroup.add(doorMesh);
      } else if (dw.type === 'janela') {
        // Vidro com esquadria
        const peitoril = dw.peitoril || 1.0;
        const winGeo = new THREE.BoxGeometry(dw.width, 0.04, dw.height);
        const winMesh = new THREE.Mesh(winGeo, glassMat);
        winMesh.position.set(dw.x, dw.y, peitoril + dw.height / 2);
        winMesh.rotation.z = angle;
        wallsGroup.add(winMesh);

        // Marco
        const frameGeo = new THREE.BoxGeometry(dw.width + 0.06, 0.08, dw.height + 0.06);
        const frameMesh = new THREE.Mesh(frameGeo, frameMat);
        frameMesh.position.set(dw.x, dw.y, peitoril + dw.height / 2);
        frameMesh.rotation.z = angle;
        wallsGroup.add(frameMesh);
      }
    }

    // 2. CONSTRUÇÃO DA LAJE DE TETO
    if (showCeiling) {
      for (const room of rooms) {
        if (room.points.length < 3) continue;

        const shape = new THREE.Shape();
        shape.moveTo(room.points[0].x, room.points[0].y);
        for (let i = 1; i < room.points.length; i++) {
          shape.lineTo(room.points[i].x, room.points[i].y);
        }
        shape.closePath();

        const ceilingGeo = new THREE.ShapeGeometry(shape);
        const ceilingMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });

        const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceilingMesh.position.z = wallHeight;
        ceilingGroup.add(ceilingMesh);
      }
    }

    // 3. CONSTRUÇÃO DAS CAIXAS E PONTOS ELÉTRICOS 3D
    const symbolMap = new Map<string, ElectricalSymbol>();
    for (const sym of symbols) {
      symbolMap.set(sym.id, sym);
      const zHeight = ConduitRoutingEngine.getHeightInMeters(sym.height);

      if (sym.type === 'luz_teto') {
        // Caixa octogonal amarela no teto
        const octGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8);
        const octMesh = new THREE.Mesh(octGeo, boxMaterial);
        octMesh.rotation.x = Math.PI / 2;
        octMesh.position.set(sym.x, sym.y, wallHeight - 0.04);
        wallsGroup.add(octMesh);

        // Plafonier / Lâmpada
        const lampGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const lampMesh = new THREE.Mesh(lampGeo, lampOnMaterial);
        lampMesh.position.set(sym.x, sym.y, wallHeight - 0.14);
        wallsGroup.add(lampMesh);

        if (lightsOn) {
          const ptLight = new THREE.PointLight(0xfef9c3, 0.8, 6);
          ptLight.position.set(sym.x, sym.y, wallHeight - 0.25);
          wallsGroup.add(ptLight);
        }
      } else if (sym.type === 'qdc') {
        // Quadro de Distribuição embutido na parede
        const qdcGeo = new THREE.BoxGeometry(0.40, 0.12, 0.50);
        const qdcMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.5 });
        const qdcMesh = new THREE.Mesh(qdcGeo, qdcMat);
        qdcMesh.position.set(sym.x, sym.y, zHeight);
        wallsGroup.add(qdcMesh);
      } else {
        // Caixas 4x2 de tomadas e interruptores
        const boxGeo = new THREE.BoxGeometry(0.12, 0.08, 0.14);
        const boxMesh = new THREE.Mesh(boxGeo, boxMaterial);
        boxMesh.position.set(sym.x, sym.y, zHeight);
        wallsGroup.add(boxMesh);

        // Placa frontal (espelho)
        const plateGeo = new THREE.BoxGeometry(0.08, 0.02, 0.12);
        const plateMat = new THREE.MeshStandardMaterial({
          color: sym.type.startsWith('tue') ? 0xef4444 : 0xffffff,
          roughness: 0.3,
        });
        const plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.position.set(sym.x, sym.y, zHeight);
        wallsGroup.add(plateMesh);
      }
    }

    // 4. CONSTRUÇÃO DOS ELETRODUTOS 3D (Tubos em curva na laje e descidas nas paredes)
    for (const conduit of conduits) {
      const s1 = symbolMap.get(conduit.startSymbolId);
      const s2 = symbolMap.get(conduit.endSymbolId);
      if (!s1 || !s2) continue;

      const z1 = ConduitRoutingEngine.getHeightInMeters(s1.height);
      const z2 = ConduitRoutingEngine.getHeightInMeters(s2.height);

      // Trajetória do eletroduto com descida vertical na parede
      const points: THREE.Vector3[] = [];
      const pStart = new THREE.Vector3(s1.x, s1.y, z1);
      const pEnd = new THREE.Vector3(s2.x, s2.y, z2);

      points.push(pStart);

      // Se ambos não estão no teto, sobe até a laje (2.80m), percorre a laje e desce até o segundo ponto
      if (s1.height !== 'teto') {
        points.push(new THREE.Vector3(s1.x, s1.y, wallHeight - 0.05));
      }
      if (s2.height !== 'teto') {
        points.push(new THREE.Vector3(s2.x, s2.y, wallHeight - 0.05));
      }

      points.push(pEnd);

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.15);
      const tubeRadius = Math.max(0.015, (conduit.diameterNominal || 20) / 2000);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, tubeRadius, 8, false);
      const tubeMat = conduit.location === 'laje' ? conduitMaterialLaje : conduitMaterialParede;
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      wallsGroup.add(tubeMesh);
    }
  }, [walls, rooms, symbols, conduits, showCeiling, showWireframe, lightsOn]);

  return (
    <div className="relative w-full h-full bg-[#0a0d14] overflow-hidden select-none">
      {/* Container Three.js */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Controles Flutuantes da Câmera 3D */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-[#131924]/90 p-2 rounded-lg border border-slate-700 backdrop-blur-md shadow-xl text-xs">
        <button
          onClick={() => setShowCeiling((c) => !c)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            showCeiling ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Alternar visibilidade da laje de teto"
        >
          {showCeiling ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Laje de Teto</span>
        </button>

        <button
          onClick={() => setShowWireframe((w) => !w)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            showWireframe ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Modo Aramado (Wireframe)"
        >
          <Layers className="w-4 h-4" />
          <span>Wireframe</span>
        </button>

        <button
          onClick={() => setLightsOn((l) => !l)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            lightsOn ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Ligar / Desligar Luminárias"
        >
          <Sparkles className="w-4 h-4" />
          <span>{lightsOn ? 'Luzes Acesas' : 'Luzes Apagadas'}</span>
        </button>
      </div>

      {/* Legenda 3D Inferior */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#131924]/90 px-3 py-2 rounded-lg border border-slate-700/80 backdrop-blur-md shadow-xl text-[11px] font-mono text-slate-300 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Eletroduto na Laje (DN20/25)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span>Descida na Parede</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>Quadro QDC / TUE</span>
        </div>
      </div>

      {/* Instruções de Navegação */}
      <div className="absolute bottom-4 right-4 z-10 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Botão Esquerdo: Órbita · Botão Direito: Pan · Scroll: Zoom</span>
      </div>
    </div>
  );
};
