import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';


class Website3DDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.physicallyCorrectLights = true;
    this._threejs.toneMapping = THREE.ACESFilmicToneMapping;
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._autoRotate = true;
    this._lastInteractionTime = performance.now();

    const modelDiv = document.getElementById('model');
    const bookImg = document.getElementById('book');
    const closeBtn = document.getElementById('close3D');

    modelDiv.appendChild(this._threejs.domElement);

    this._threejs.setSize(modelDiv.offsetWidth, modelDiv.offsetHeight);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = modelDiv.offsetWidth / modelDiv.offsetHeight;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(4, 6, 7);
    let appInstance = null;
    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    bookImg.addEventListener('click', () => {
      modelDiv.style.display = 'block';
      if (!appInstance) {
        appInstance = new Website3DDemo(); // load the 3D model
      }
    });

    closeBtn.addEventListener('click', () => {
      modelDiv.style.display = 'none';
      this._ResetModel();
    });

    light = new THREE.AmbientLight(0xFFFFFF);
    this._scene.add(light);

    this._controls = new OrbitControls(
        this._camera, this._threejs.domElement);
    this._controls.target.set(0, 5, 0);
    this._controls.update();

    this._LoadAnimatedModelAndPlay(
      './model/', 'AlianzaPerdida.fbx',
        '', new THREE.Vector3(0, 10, 0));

    this._controls = new OrbitControls(this._camera, this._threejs.domElement);
    this._controls.target.set(0, 0, 0);
    this._controls.update();

    this._controls.addEventListener('start', () => {
      this._autoRotate = false;
      this._lastInteractionTime = performance.now();
    });

    this._controls.addEventListener('end', () => {
      this._lastInteractionTime = performance.now();
    });
  
    this._mixers = [];
    this._previousRAF = null;

    this._scrollAmount = 0.0;
    this._RAF();
  }

  _LoadAnimatedModelAndPlay(path, modelFile, animFile, offset) {
    const loader = new FBXLoader();
    loader.setPath(path);
    loader.load(modelFile, (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse(c => {
        c.castShadow = true;
        if (c.isMesh) {
          c.geometry.center();
        }
      });
      this._model = fbx;
      fbx.position.copy(offset);
      fbx.lookAt(this._camera.position);
      this._camera.lookAt(fbx.position);
      this._controls.target.copy(fbx.position);
      fbx.position.set(0, 0, 0);
      this._controls.target.set(0, 0, 0);
      this._controls.update();
      this._camera.lookAt(0, 0, 0);
      fbx.rotation.y += Math.PI / 2;
      // const axesHelper = new THREE.AxesHelper(10);
      // fbx.add(axesHelper);
      fbx.rotation.x = THREE.MathUtils.degToRad(-5);
      fbx.rotation.y += THREE.MathUtils.degToRad(2);

      const anim = new FBXLoader();
      anim.setPath(path);
      anim.load(animFile, (anim) => {
        const m = new THREE.AnimationMixer(fbx);
        this._mixers.push(m);
        const idle = m.clipAction(anim.animations[0]);
        idle.play();
      });
      this._scene.add(fbx);
      this._controls.target.copy(fbx.position);
      this._controls.update();
    });
  }

  OnScroll(pos) {
    const a = 15;
    const b = -15;
    const amount = Math.min(pos / 500.0, 1.0);
    this._camera.position.set(a + amount * (b - a), 15, 20);
    this._controls.update();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }
  }

  _ResetModel() {
    if (this._model) {
      this._model.rotation.set(0, 2, 0);
      this._model.position.set(0, 0, 0);
    }

    this._autoRotate = false;
    this._lastInteractionTime = performance.now();
    this._controls.reset(); // resets camera + orbit controls
    this._controls.target.set(0, 0, 0);
    this._camera.position.set(4, 6, 7);
    this._controls.update();
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      const now = performance.now();
      const idleTime = now - this._lastInteractionTime;
      const delta = t - this._previousRAF;
      this._previousRAF = t;

      this._Step(delta);

      if (idleTime > 3000) {
        this._autoRotate = true;
      }

      if (this._autoRotate && this._model) {
        this._model.rotation.y += 0.0025;
      }

      this._controls.update();
      this._threejs.render(this._scene, this._camera);

      this._RAF();
    });
  }

}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Website3DDemo();
});

window.addEventListener('scroll', (e) => {
  // _APP.OnScroll(window.scrollY);
});