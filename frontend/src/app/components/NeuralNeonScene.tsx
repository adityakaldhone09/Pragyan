import React, { useEffect, useRef } from 'react';
import { useAdaptiveAI } from '../context/adaptiveAI';

type Props = {
  confidence?: number; // 0..1
};

function loadThree(): Promise<any> {
  // Load UMD build from CDN if THREE not present
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).THREE) return resolve((window as any).THREE);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/three@0.161.0/build/three.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      resolve((window as any).THREE);
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export default function NeuralNeonScene({ confidence = 0.7 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(true);

  const adaptiveAI = useAdaptiveAI();
  const lastUpdated = adaptiveAI?.lastUpdated ?? null;

  useEffect(() => {
    let THREE: any;
    let renderer: any, scene: any, camera: any;
    let container: HTMLDivElement | null = mountRef.current;
    let particleSystem: any, orb: any, rings: any[] = [], lines: any;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 200 : 800;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;

    let stopped = false;

    function handleVisibility() {
      if (document.hidden) {
        stopped = true;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else {
        if (stopped) {
          stopped = false;
          animate();
        }
      }
    }

    function onMouseMove(e: MouseEvent) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      mouseX = (e.clientX - w / 2) / w;
      mouseY = (e.clientY - h / 2) / h;
    }

    function onScroll() {
      scrollY = window.scrollY || window.pageYOffset || 0;
    }

    function triggerRecalculationPulse(reason = 'recalc') {
      // quick cinematic pulse that increases emissive and wave opacity
      if (!orb) return;
      const start = Date.now();
      const dur = 1200;
      const baseEmissive = orb.core.material.emissiveIntensity || 0.6;
      const baseWave = orb.wave.material.opacity || 0.03;

      function pulseFrame() {
        const now = Date.now();
        const t = Math.min(1, (now - start) / dur);
        // ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        try {
          orb.core.material.emissiveIntensity = baseEmissive + 1.6 * (1 - Math.abs(0.5 - ease));
          orb.wave.material.opacity = baseWave + 0.12 * ease;
          // small ring flash
          rings.forEach((r: any, i: number) => { r.material.opacity = Math.min(0.18, (r.material.opacity || 0.06) + 0.06 * ease); });
        } catch (e) {}

        if (t < 1) requestAnimationFrame(pulseFrame);
        else {
          // revert gracefully
          const revStart = Date.now();
          const revDur = 700;
          function rev() {
            const now2 = Date.now();
            const tt = Math.min(1, (now2 - revStart) / revDur);
            const rease = 1 - Math.pow(tt, 2);
            try {
              orb.core.material.emissiveIntensity = baseEmissive * rease + 0.02 * (1 - rease);
              orb.wave.material.opacity = baseWave * rease + 0.0 * (1 - rease);
            } catch (e) {}
            if (tt < 1) requestAnimationFrame(rev);
          }
          requestAnimationFrame(rev);
        }
      }

      // status and insight during recalculation
      try { window.dispatchEvent(new CustomEvent('ai:status', { detail: { message: 'Recalibrating learning pathways…', level: 'processing' } })); } catch {}
      setTimeout(() => { try { window.dispatchEvent(new CustomEvent('ai:status', { detail: { message: 'Optimizing adaptive intelligence map…', level: 'processing' } })); } catch {} }, 500);
      setTimeout(() => { try { window.dispatchEvent(new CustomEvent('ai:status', { detail: { message: 'Analyzing behavioral evolution…', level: 'processing' } })); } catch {} }, 1000);

      requestAnimationFrame(pulseFrame);
    }

    // cinematic boot sequence timings (seconds)
    const SEQ = {
      ambientDelay: 0.2,
      particlesFadeIn: 0.8,
      orbPowerOn: 1.4,
      ringsEmerge: 2.2,
      pulseSpread: 2.8,
      radarReveal: 3.6,
      metricsReveal: 4.4,
      mentorAppear: 5.2,
    };

    function dispatchStatus(msg: string, level = 'info') {
      try { window.dispatchEvent(new CustomEvent('ai:status', { detail: { message: msg, level } })); } catch {}
    }

    function init(th: any) {
      THREE = th;
      if (!container) return;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.zIndex = '0';
      renderer.domElement.style.pointerEvents = 'none';
      container.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x02050a, 0.0025);

      camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 2000);
      camera.position.set(0, 0, 120);

      // ambient + holographic rim light
      const ambient = new THREE.AmbientLight(0x223344, 0.8);
      scene.add(ambient);

      const rim = new THREE.PointLight(0x6b47ff, 1.2, 400);
      rim.position.set(60, 40, 80);
      scene.add(rim);

      // Orb: layered spheres for glow
      const orbGroup = new THREE.Group();
      const orbGeom = new THREE.SphereGeometry(10, 32, 32);

      const coreMat = new THREE.MeshPhongMaterial({ color: 0x6ea8ff, emissive: 0x3344ff, emissiveIntensity: 0.6, shininess: 30, transparent: true, opacity: 0.95 });
      const core = new THREE.Mesh(orbGeom, coreMat);
      core.scale.set(1, 1, 1);
      orbGroup.add(core);

      const shellMat = new THREE.MeshBasicMaterial({ color: 0x8b6bff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending });
      const shell = new THREE.Mesh(new THREE.SphereGeometry(13, 32, 32), shellMat);
      orbGroup.add(shell);

      // soft energy wave: larger transparent sphere
      const waveMat = new THREE.MeshBasicMaterial({ color: 0x6b47ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending });
      const wave = new THREE.Mesh(new THREE.SphereGeometry(26, 32, 32), waveMat);
      orbGroup.add(wave);

      orbGroup.position.set(0, -6, 0);
      scene.add(orbGroup);
      orb = { core, shell, wave, group: orbGroup };

      // rotating neural rings
      for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.TorusGeometry(20 + i * 6, 0.7, 8, 120);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x6b47ff, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, -6, 0);
        scene.add(ring);
        rings.push(ring);
      }

      // particles
      const particlesGeom = new THREE.BufferGeometry();
      const positions = new Float32Array(PARTICLE_COUNT * 3);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const r = 60 + Math.random() * 220;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.3;
        positions[i * 3 + 2] = Math.cos(phi) * r * 0.6;
      }
      particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMat = new THREE.PointsMaterial({ color: 0x89a7ff, size: isMobile ? 0.8 : 1.6, transparent: true, opacity: 0.6, depthWrite: false });
      particleSystem = new THREE.Points(particlesGeom, particlesMat);
      scene.add(particleSystem);

      // connecting lines (sparse)
      const lineGeom = new THREE.BufferGeometry();
      const maxLines = Math.min(120, Math.floor(PARTICLE_COUNT / 6));
      const linePos = new Float32Array(maxLines * 2 * 3);
      for (let i = 0; i < maxLines * 2; i++) {
        const idx = Math.floor(Math.random() * PARTICLE_COUNT) * 3;
        linePos[i * 3] = positions[idx];
        linePos[i * 3 + 1] = positions[idx + 1];
        linePos[i * 3 + 2] = positions[idx + 2];
      }
      lineGeom.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
      const lineMat = new THREE.LineBasicMaterial({ color: 0x7a6bff, transparent: true, opacity: 0.06 });
      lines = new THREE.LineSegments(lineGeom, lineMat);
      scene.add(lines);

      // subtle background gradient via large plane
      const bgMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), bgMat);
      bg.position.set(0, 0, -400);
      scene.add(bg);

      // initial visibility for boot sequence
      particleSystem.material.opacity = 0.0;
      rings.forEach((r: any) => (r.material.opacity = 0.0));
      orb.core.material.emissiveIntensity = 0.02;
      orb.shell.material.opacity = 0.0;
      orb.wave.material.opacity = 0.0;

      // Boot sequence orchestration
      setTimeout(() => {
        // ambient becomes deeper
        dispatchStatus('Initializing neural substrate...');
      }, SEQ.ambientDelay * 1000);

      setTimeout(() => {
        // particles fade in
        particleSystem.material.opacity = isMobile ? 0.35 : 0.6;
        dispatchStatus('Activating neural mesh...');
      }, SEQ.particlesFadeIn * 1000);

      setTimeout(() => {
        // orb powers on
        orb.core.material.emissiveIntensity = 0.6 + (confidence || 0.6);
        orb.shell.material.opacity = 0.06 + (confidence || 0.6) * 0.06;
        dispatchStatus('Powering AI core...');
        window.dispatchEvent(new CustomEvent('ai:boot:orb'));
      }, SEQ.orbPowerOn * 1000);

      setTimeout(() => {
        // rings emerge
        rings.forEach((r: any, i: number) => {
          r.material.opacity = 0.06 + i * 0.02;
        });
        dispatchStatus('Establishing neural rings...');
        window.dispatchEvent(new CustomEvent('ai:boot:rings'));
      }, SEQ.ringsEmerge * 1000);

      setTimeout(() => {
        // pulse spread
        orb.wave.material.opacity = 0.02 + (confidence || 0.6) * 0.05;
        dispatchStatus('Propagating adaptive pulse...');
        window.dispatchEvent(new CustomEvent('ai:boot:pulse'));
      }, SEQ.pulseSpread * 1000);

      setTimeout(() => {
        // signal other UI to draw radar and metrics
        dispatchStatus('Rendering intelligence overlays...');
        window.dispatchEvent(new CustomEvent('ai:boot:reveal', { detail: { radar: true, metrics: true } }));
      }, SEQ.radarReveal * 1000);

      setTimeout(() => {
        dispatchStatus('Bringing mentor hologram online...');
        window.dispatchEvent(new CustomEvent('ai:boot:mentor'));
      }, SEQ.mentorAppear * 1000);

      // responsive resize
      function onResize() {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }

      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('scroll', onScroll);

      // listen for recalculation / thinking triggers from adaptive AI
      function onRecalc(e: any) {
        const reason = e?.detail?.reason || 'recalculation';
        triggerRecalculationPulse(reason);
      }
      window.addEventListener('ai:recalculate', onRecalc as EventListener);
      window.addEventListener('ai:decision:updated', onRecalc as EventListener);

      // when requesting insights, emit an insight message
      function emitInsight(detail: any) {
        const messages = [
          'Your learning behavior indicates strong systems thinking.',
          'Your adaptive growth curve is accelerating rapidly.',
          'Your profile suggests leadership-oriented intelligence.',
        ];
        const pick = messages[Math.floor(Math.random() * messages.length)];
        try { window.dispatchEvent(new CustomEvent('ai:insight', { detail: { text: pick, source: 'neural' } })); } catch {}
      }
      window.addEventListener('ai:request:insight', () => emitInsight(null));

      // animation loop
      const start = Date.now();

      function animate() {
        if (stopped) return;
        const t = (Date.now() - start) * 0.001;

        // gentle particle rotation
        particleSystem.rotation.y = t * 0.02;
        particleSystem.rotation.x = Math.sin(t * 0.05) * 0.02;

        // slow ring rotation
        rings.forEach((r: any, i: number) => r.rotation.z = t * (0.04 + i * 0.01) * (i % 2 ? -1 : 1));

        // orb breathing and adaptive glow
        const breath = 0.6 + Math.sin(t * 1.2) * 0.08;
        orb.core.scale.set(1 * breath, 1 * breath, 1 * breath);
        const glow = 0.4 + Math.abs(Math.sin(t * 0.8)) * 0.5 + confidence * 0.8;
        orb.core.material.emissiveIntensity = Math.min(2.2, glow);
        orb.shell.material.opacity = 0.06 + confidence * 0.08;
        orb.wave.material.opacity = 0.02 + confidence * 0.06;

        // parallax following mouse
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        orb.group.rotation.y = targetX * 0.3;
        orb.group.rotation.x = targetY * 0.3;

        // subtle camera dolly based on confidence
        camera.position.z = 110 - confidence * 20 + Math.sin(t * 0.2) * 1.5 - scrollY * 0.08;

        renderer.render(scene, camera);
        rafRef.current = requestAnimationFrame(animate);
      }

      // start
      animate();

      // trigger initial insight after boot
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('ai:insight', { detail: { text: 'Welcome — the AI is observing your growth.', source: 'boot' } })); } catch {}
      }, (SEQ.metricsReveal + 0.3) * 1000);

      // cleanup
      const cleanup = () => {
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('ai:recalculate', onRecalc as EventListener);
        window.removeEventListener('ai:decision:updated', onRecalc as EventListener);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (renderer) {
          renderer.dispose();
          if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        stopped = true;
      };

      // store cleanup for outer effect
      (init as any).cleanup = cleanup;
    }

    let mounted = true;
    loadThree().then((THREE) => {
      if (!mounted) return;
      init(THREE);
    }).catch((err) => {
      // silently fail — leave fallback visuals
      console.warn('Three.js failed to load for NeuralNeonScene', err);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      } else if (!stopped) {
        // resume by reinitializing loop if needed
        // no-op: animate created a new loop
      }
    });

    return () => {
      mounted = false;
      // call attached cleanup if present
      try {
        if ((init as any).cleanup) (init as any).cleanup();
      } catch (e) {
        // ignore
      }
    };
  }, [confidence]);

  // when AdaptiveAI decision updates, nudge a recalculation pulse
  useEffect(() => {
    if (lastUpdated) {
      try { window.dispatchEvent(new CustomEvent('ai:recalculate', { detail: { reason: 'decision-update' } })); } catch {}
    }
  }, [lastUpdated]);

  return (
    <div ref={mountRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden>
      {/* WebGL canvas will be mounted here. */}
    </div>
  );
}
