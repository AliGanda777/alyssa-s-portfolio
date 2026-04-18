import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const container = document.getElementById('robot-3d');
if (container) {
  const W = () => container.clientWidth;
  const H = () => container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, W() / H(), 0.1, 2000);
  camera.position.set(0, 0, 5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(4, 8, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd6e0, 0.6);
  fill.position.set(-4, 2, -3);
  scene.add(fill);

  const texLoader = new THREE.TextureLoader();
  const diffuse = texLoader.load('robo-ap-x1/textures/APX1_diffuse.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
  });
  const emission = texLoader.load('robo-ap-x1/textures/APX1_emission.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.flipY = false;
  });

  let model = null;
  let rightArm = null;
  let modelBaseY = 0;
  const boneNames = [];

  const loader = new FBXLoader();
  loader.load('robo-ap-x1/source/RoboAPX1.fbx', (fbx) => {
    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3 / maxDim;
    fbx.scale.setScalar(scale);

    fbx.traverse((c) => {
      if (c.isMesh) {
        c.material = new THREE.MeshStandardMaterial({
          map: diffuse,
          emissiveMap: emission,
          emissive: new THREE.Color(0x4da6ff),
          emissiveIntensity: 2.4,
          roughness: 0.5,
          metalness: 0.35,
        });
      }
      if (c.isBone) boneNames.push(c.name);

      const n = (c.name || '').toLowerCase();
      if (!rightArm && (
        n.includes('rightarm') || n.includes('right_arm') ||
        n.includes('r_arm') || n.includes('arm_r') ||
        n.includes('rightupperarm') || n.includes('rightshoulder') ||
        n.includes('shoulder_r') || n.includes('shoulder.r') ||
        n.includes('upperarm_r') || n.includes('upperarm.r')
      )) {
        rightArm = c;
      }
    });

    // Fallback: pick best right-side upper-body bone
    if (!rightArm) {
      const box2 = new THREE.Box3().setFromObject(fbx);
      const center = box2.getCenter(new THREE.Vector3());
      let best = null, bestScore = -Infinity;
      fbx.traverse((c) => {
        if (!c.isBone) return;
        const wp = new THREE.Vector3();
        c.getWorldPosition(wp);
        if (wp.x > center.x + 0.01 && wp.y > center.y) {
          const score = wp.x + (wp.y - center.y);
          if (score > bestScore) { bestScore = score; best = c; }
        }
      });
      rightArm = best;
    }

    console.log('[Robot] Bones found:', boneNames.length ? boneNames : '(none — rigid mesh)');
    console.log('[Robot] Right arm selected:', rightArm ? rightArm.name : '(none — wave will use body tilt fallback)');

    const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    fbx.position.sub(center);

    modelBaseY = fbx.position.y;
    scene.add(fbx);
    model = fbx;
  }, undefined, (err) => console.error('FBX load error', err));

  // Very subtle mouse tracking (no full rotation – just aware of cursor)
  let targetY = 0, targetX = 0;
  let curY = 0, curX = 0;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetY = nx * 0.28;
    targetX = ny * 0.10;
  });

  const clock = new THREE.Clock();
  let initialArmRot = null;

  function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();

    if (model) {
      // subtle mouse awareness (no spinning, no sideways sway)
      curY += (targetY - curY) * 0.05;
      curX += (targetX - curX) * 0.05;

      model.rotation.y = curY;
      model.rotation.x = curX;
      model.rotation.z = 0;
      model.position.y = modelBaseY;

      // Right-hand wave
      if (rightArm) {
        if (!initialArmRot) initialArmRot = rightArm.rotation.clone();

        const cycle = 4.5;
        const phase = (t % cycle) / cycle;

        let lift = 0, wave = 0;
        if (phase < 0.15) {
          lift = phase / 0.15;
        } else if (phase < 0.75) {
          lift = 1;
          wave = Math.sin((phase - 0.15) / 0.6 * Math.PI * 4) * 0.4;
        } else if (phase < 0.9) {
          lift = 1 - (phase - 0.75) / 0.15;
        }

        rightArm.rotation.x = initialArmRot.x - lift * 2.0;
        rightArm.rotation.z = initialArmRot.z - lift * 0.35 + wave;
      }
    }

    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}
