import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Airplanes — The beginners guide" },
      {
        name: "description",
        content:
          "A scroll-driven 3D airplane story: watch a wireframe plane fly, bank and climb through the facts and figures.",
      },
      { property: "og:title", content: "Airplanes — The beginners guide" },
      {
        property: "og:description",
        content:
          "A scroll-driven 3D airplane story: watch a wireframe plane fly, bank and climb through the facts and figures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { ScrollToPlugin }, THREE, { OBJLoader }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("gsap/ScrollToPlugin"),
          import("three"),
          import("three/examples/jsm/loaders/OBJLoader.js"),
        ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      class Scene {
        views: Array<{ bottom: number; height: number; camera: any }>;
        renderer: any;
        scene: any;
        light: any;
        softLight: any;
        modelGroup: any;
        w = 0;
        h = 0;

        constructor(model: any) {
          this.views = [
            { bottom: 0, height: 1, camera: null },
            { bottom: 0, height: 0, camera: null },
          ];

          this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          this.renderer.shadowMap.enabled = true;
          this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
          this.renderer.setPixelRatio(window.devicePixelRatio);
          document.body.appendChild(this.renderer.domElement);

          this.scene = new THREE.Scene();

          for (let ii = 0; ii < this.views.length; ++ii) {
            const view = this.views[ii]!;
            const camera = new THREE.PerspectiveCamera(
              45,
              window.innerWidth / window.innerHeight,
              1,
              2000,
            );
            camera.position.fromArray([0, 0, 180]);
            camera.layers.disableAll();
            camera.layers.enable(ii);
            view.camera = camera;
            camera.lookAt(new THREE.Vector3(0, 5, 0));
          }

          this.light = new THREE.PointLight(0xffffff, 0.75);
          this.light.position.z = 150;
          this.light.position.x = 70;
          this.light.position.y = -20;
          this.scene.add(this.light);

          this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
          this.scene.add(this.softLight);

          this.onResize();
          window.addEventListener("resize", this.onResize, false);

          let raf = 0;
          const animate = () => {
            this.render();
            raf = requestAnimationFrame(animate);
          };
          animate();

          cleanups.push(() => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", this.onResize);
            this.renderer.domElement.remove();
            this.renderer.dispose();
          });

          try {
            const edges = new THREE.EdgesGeometry(model.children[0].geometry);
            const line = new THREE.LineSegments(edges);
            (line.material as any).depthTest = false;
            (line.material as any).opacity = 0.5;
            (line.material as any).transparent = true;
            line.position.x = 0.5;
            line.position.z = -1;
            line.position.y = 0.2;

            this.modelGroup = new THREE.Group();
            model.layers.set(0);
            line.layers.set(1);
            this.modelGroup.add(model);
            this.modelGroup.add(line);
          } catch (e) {
            console.error("Model geometry error:", e);
            this.modelGroup = new THREE.Group();
            this.modelGroup.add(
              new THREE.Mesh(
                new THREE.PlaneGeometry(10, 10),
                new THREE.MeshBasicMaterial({ color: 0xff0000 }),
              ),
            );
          }
          this.scene.add(this.modelGroup);
        }

        render = () => {
          for (let ii = 0; ii < this.views.length; ++ii) {
            const view = this.views[ii]!;
            const camera = view.camera;
            const bottom = Math.floor(this.h * view.bottom);
            const height = Math.floor(this.h * view.height);

            this.renderer.setViewport(0, 0, this.w, this.h);
            this.renderer.setScissor(0, bottom, this.w, height);
            this.renderer.setScissorTest(true);

            camera.aspect = this.w / this.h;
            camera.updateProjectionMatrix();
            this.renderer.render(this.scene, camera);
          }
        };

        onResize = () => {
          this.w = window.innerWidth;
          this.h = window.innerHeight;
          for (let ii = 0; ii < this.views.length; ++ii) {
            const camera = this.views[ii]!.camera;
            camera.aspect = this.w / this.h;
            const camZ = (window.screen.width - this.w) / 3;
            camera.position.z = camZ < 180 ? 180 : camZ;
            camera.updateProjectionMatrix();
          }
          this.renderer.setSize(this.w, this.h);
          this.render();
        };
      }

      function setupAnimation(model: any) {
        if (disposed) return;
        const scene = new Scene(model);
        const plane = scene.modelGroup;

        const ctx = gsap.context(() => {
          gsap.fromTo(
            "canvas",
            { x: "50%", autoAlpha: 0 },
            { duration: 1, x: "0%", autoAlpha: 1, delay: 0.5 },
          );
          gsap.to(".loading", { autoAlpha: 0, delay: 3 });
          gsap.to(".scroll-cta", { opacity: 1 });
          gsap.set("svg", { autoAlpha: 1 });

          const tau = Math.PI * 2;
          gsap.set(plane.rotation, { y: tau * -0.25 });
          gsap.set(plane.position, { x: 80, y: -32, z: -60 });
          scene.render();

          const sectionDuration = 1;

          gsap.to("#line-length", {
            strokeDashoffset: 0,
            scrollTrigger: { trigger: ".length", scrub: true, start: "top bottom", end: "top top" },
          });
          gsap.to("#line-wingspan", {
            strokeDashoffset: 0,
            scrollTrigger: {
              trigger: ".wingspan",
              scrub: true,
              start: "top 25%",
              end: "bottom 50%",
            },
          });
          gsap.to("#circle-phalange", {
            strokeDashoffset: 0,
            scrollTrigger: {
              trigger: ".phalange",
              scrub: true,
              start: "top 50%",
              end: "bottom 100%",
            },
          });
          gsap.to("#line-length", {
            opacity: 0,
            strokeDashoffset: 80,
            scrollTrigger: { trigger: ".length", scrub: true, start: "top top", end: "bottom top" },
          });
          gsap.to("#line-wingspan", {
            opacity: 0,
            strokeDashoffset: 110,
            scrollTrigger: {
              trigger: ".wingspan",
              scrub: true,
              start: "top top",
              end: "bottom top",
            },
          });
          gsap.to("#circle-phalange", {
            opacity: 0,
            strokeDashoffset: 94,
            scrollTrigger: {
              trigger: ".phalange",
              scrub: true,
              start: "top top",
              end: "bottom top",
            },
          });

          const tl = gsap.timeline({
            onUpdate: scene.render,
            scrollTrigger: {
              trigger: ".content",
              scrub: true,
              start: "top top",
              end: "bottom bottom",
            },
            defaults: { duration: sectionDuration, ease: "power2.inOut" },
          });

          let delay = 0;
          tl.to(".scroll-cta", { duration: 0.25, opacity: 0 }, delay);
          tl.to(plane.position, { x: -10, ease: "power1.in" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: tau * 0.25, y: 0, z: -tau * 0.05, ease: "power1.inOut" }, delay);
          tl.to(plane.position, { x: -40, y: 0, z: -60, ease: "power1.inOut" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: tau * 0.25, y: 0, z: tau * 0.05, ease: "power3.inOut" }, delay);
          tl.to(plane.position, { x: 40, y: 0, z: -60, ease: "power2.inOut" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: tau * 0.2, y: 0, z: -tau * 0.1, ease: "power3.inOut" }, delay);
          tl.to(plane.position, { x: -40, y: 0, z: -30, ease: "power2.inOut" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: 0, z: 0, y: tau * 0.25 }, delay);
          tl.to(plane.position, { x: 0, y: -10, z: 50 }, delay);

          delay += sectionDuration * 2;
          tl.to(plane.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: "power4.inOut" }, delay);
          tl.to(plane.position, { z: 30, ease: "power4.inOut" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: tau * 0.25, y: tau * 0.5, z: 0, ease: "power4.inOut" }, delay);
          tl.to(plane.position, { z: 60, x: 30, ease: "power4.inOut" }, delay);

          delay += sectionDuration;
          tl.to(
            plane.rotation,
            { x: tau * 0.35, y: tau * 0.75, z: tau * 0.6, ease: "power4.inOut" },
            delay,
          );
          tl.to(plane.position, { z: 100, x: 20, y: 0, ease: "power4.inOut" }, delay);

          delay += sectionDuration;
          tl.to(plane.rotation, { x: tau * 0.15, y: tau * 0.85, z: 0, ease: "power1.in" }, delay);
          tl.to(plane.position, { z: -150, x: 0, y: 0, ease: "power1.inOut" }, delay);

          delay += sectionDuration;
          tl.to(
            plane.rotation,
            { duration: sectionDuration, x: -tau * 0.05, y: tau, z: -tau * 0.1, ease: "none" },
            delay,
          );
          tl.to(
            plane.position,
            { duration: sectionDuration, x: 0, y: 30, z: 320, ease: "power1.in" },
            delay,
          );
          tl.to(scene.light.position, { duration: sectionDuration, x: 0, y: 0, z: 0 }, delay);
        });

        cleanups.push(() => ctx.revert());
      }

      gsap.set("#line-length", { strokeDasharray: 80, strokeDashoffset: 80 });
      gsap.set("#line-wingspan", { strokeDasharray: 110, strokeDashoffset: 110 });
      gsap.set("#circle-phalange", { strokeDasharray: 94, strokeDashoffset: 94 });

      // Build a detailed passenger airliner (nose points +Z)
      const buildAirliner = () => {
        const group = new THREE.Group();
        const body = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, metalness: 0.35, roughness: 0.35 });
        const accent = new THREE.MeshStandardMaterial({ color: 0x1f4e8c, metalness: 0.3, roughness: 0.4 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.6, roughness: 0.3 });
        const glass = new THREE.MeshStandardMaterial({ color: 0x0d1b2a, metalness: 0.9, roughness: 0.1 });
        const add = (g: any, m: any, p: [number, number, number] = [0, 0, 0], r?: [number, number, number]) => {
          const mesh = new THREE.Mesh(g, m);
          mesh.position.set(...p);
          if (r) mesh.rotation.set(...r);
          group.add(mesh);
          return mesh;
        };

        // Fuselage via lathe profile (radius, length)
        const L = 64;
        const prof: any[] = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40;
          let r: number;
          if (t < 0.12) r = 4 * Math.sqrt(t / 0.12) ** 0.9; // rounded nose
          else if (t < 0.72) r = 4;
          else r = 4 * (1 - ((t - 0.72) / 0.28) ** 1.6) + 0.5 * ((t - 0.72) / 0.28);
          prof.push(new THREE.Vector2(Math.max(r, 0.01), t * L));
        }
        const fus = new THREE.LatheGeometry(prof, 40);
        fus.rotateX(-Math.PI / 2); // length along -Z
        fus.translate(0, 0, L / 2); // nose at +32
        add(fus, body);

        // Tail upsweep hint & belly stripe
        add(new THREE.CylinderGeometry(4.05, 4.05, 40, 40, 1, true, Math.PI * 0.55, Math.PI * 0.9), accent, [0, 0, 2], [Math.PI / 2, 0, 0]);

        // Cockpit windows
        add(new THREE.SphereGeometry(2.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 5), glass, [0, 1.6, 26.5], [Math.PI / 2.6, 0, 0]);
        // Cabin windows
        const win = new THREE.BoxGeometry(0.25, 0.7, 0.55);
        for (let z = 22; z > -14; z -= 1.6) {
          add(win, glass, [4.0, 1.2, z]);
          add(win, glass, [-4.0, 1.2, z]);
        }
        // Doors
        const door = new THREE.BoxGeometry(0.25, 2.4, 1.3);
        [23.5, -12].forEach((z) => {
          add(door, accent, [4.02, 0.4, z]);
          add(door, accent, [-4.02, 0.4, z]);
        });

        // Swept wing helper (side = 1 right, -1 left)
        const wing = (side: number, rootZ: number, span: number, rootChord: number, tipChord: number, sweep: number, thick: number, y: number, dihedral: number, mat: any) => {
          const s = new THREE.Shape();
          s.moveTo(0, rootZ);
          s.lineTo(side * span, rootZ - sweep);
          s.lineTo(side * span, rootZ - sweep - tipChord);
          s.lineTo(0, rootZ - rootChord);
          s.lineTo(0, rootZ);
          const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: 0.3, bevelSegments: 2 });
          g.rotateX(Math.PI / 2);
          g.rotateZ(side * dihedral);
          g.translate(0, y + thick / 2, 0);
          add(g, mat);
          return { tipX: side * span * Math.cos(dihedral), tipY: y + span * Math.sin(dihedral), tipZ: rootZ - sweep };
        };

        // Main wings + winglets
        [1, -1].forEach((side) => {
          const tip = wing(side, 8, 34, 14, 3.5, 17, 0.8, -1.8, 0.08, body);
          const wl = new THREE.Shape();
          wl.moveTo(0, 0); wl.lineTo(-1.5, 4.5); wl.lineTo(-3, 4.5); wl.lineTo(-3.5, 0); wl.lineTo(0, 0);
          const wg = new THREE.ExtrudeGeometry(wl, { depth: 0.3, bevelEnabled: false });
          wg.rotateY(Math.PI / 2);
          const m = add(wg, accent, [tip.tipX, tip.tipY, tip.tipZ]);
          m.rotation.z = -side * 0.15;

          // Engine under wing
          const ex = side * 11;
          const ez = 7;
          add(new THREE.CylinderGeometry(2.3, 1.9, 9, 28), body, [ex, -4.8, ez], [Math.PI / 2, 0, 0]);
          add(new THREE.TorusGeometry(2.1, 0.3, 10, 28), accent, [ex, -4.8, ez + 4.5]);
          add(new THREE.CircleGeometry(1.9, 28), dark, [ex, -4.8, ez + 4.3]);
          add(new THREE.ConeGeometry(0.6, 1.6, 16), dark, [ex, -4.8, ez + 4.9], [Math.PI / 2, 0, 0]);
          add(new THREE.ConeGeometry(1.4, 3, 20), dark, [ex, -4.8, ez - 5.8], [-Math.PI / 2, 0, 0]);
          add(new THREE.BoxGeometry(0.6, 2.6, 6), body, [ex, -2.6, ez - 1]);

          // Horizontal stabilizer
          wing(side, -21, 12, 7, 2.5, 6, 0.5, 0.8, 0.12, body);
        });

        // Vertical fin
        const fin = new THREE.Shape();
        fin.moveTo(0, 0); fin.lineTo(-9, 12); fin.lineTo(-13, 12); fin.lineTo(-12, 0); fin.lineTo(0, 0);
        const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2, bevelSegments: 2 });
        fg.rotateY(Math.PI / 2);
        add(fg, accent, [-0.3, 2.5, -17]);

        // Landing gear fairing
        add(new THREE.BoxGeometry(6, 1.6, 10), body, [0, -3.6, 0]);

        return group;
      };

      setupAnimation(buildAirliner());
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const scrollToBottom = async () => {
    const { gsap } = await import("gsap");
    gsap.to(window, {
      duration: 1.5,
      scrollTo: { y: document.body.scrollHeight, autoKill: false },
      ease: "power2.inOut",
    });
  };

  return (
    <div ref={rootRef} className="plane-app">
      <button id="contact-btn" className="contact-btn" onClick={scrollToBottom}>
        Contact
      </button>
      <div className="content">
        <div className="loading">Loading</div>
        <div className="trigger" />
        <div className="section">
          <h1>Airplanes.</h1>
          <h3>The beginners guide.</h3>
          <p>You've probably forgotten what these are.</p>
          <div className="scroll-cta">Scroll</div>
        </div>
        <div className="section right">
          <h2>They're kinda like buses...</h2>
        </div>
        <div className="ground-container">
          <div className="section right">
            <h2>..except they leave the ground.</h2>
            <p>Saaay what!?.</p>
          </div>
          <div className="section">
            <h2>They fly through the sky.</h2>
            <p>For realsies!</p>
          </div>
          <div className="section right">
            <h2>Defying all known physical laws.</h2>
            <p>It's actual magic!</p>
          </div>
        </div>

        <div className="blueprint">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            <line
              id="line-length"
              x1="10"
              y1="80"
              x2="90"
              y2="80"
              strokeWidth="0.5"
              stroke="white"
            />
            <path
              id="line-wingspan"
              d="M10 50, L40 35, M60 35 L90 50"
              strokeWidth="0.5"
              stroke="white"
              fill="none"
            />
            <circle
              id="circle-phalange"
              cx="60"
              cy="60"
              r="15"
              fill="transparent"
              strokeWidth="0.5"
              stroke="white"
            />
          </svg>
          <div className="section dark">
            <h2>The facts and figures.</h2>
            <p>Lets get into the nitty gritty...</p>
          </div>
          <div className="section dark length">
            <h2>Length.</h2>
            <p>Long.</p>
          </div>
          <div className="section dark wingspan">
            <h2>Wing Span.</h2>
            <p>I dunno, longer than a cat probably.</p>
          </div>
          <div className="section dark phalange">
            <h2>Left Phalange</h2>
            <p>Missing</p>
          </div>
          <div className="section dark">
            <h2>Engines</h2>
            <p>Turbine funtime</p>
          </div>
        </div>
      </div>
    </div>
  );
}
