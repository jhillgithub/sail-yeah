import './style.css';

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controls, water, sun;

const loader = new GLTFLoader();



class Raft {
  constructor() {
    /**
     * "Raft" (https://skfb.ly/6GATS) by _SeF_ is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
     */
    loader.load('assets/raft/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.05, 0.05, 0.05);
      gltf.scene.rotation.y = -1.5;

      this.raft = gltf.scene;
      this.speed = {
        vel: 0.0,
        rot: 0.0
      };
    });
  }

  update() {
    if (this.raft) {
      this.raft.rotation.y += this.speed.rot;
      this.raft.translateX(this.speed.vel);
    }
  }

  stop() {
    this.speed.vel = 0.0;
    this.speed.rot = 0.0;
  }

  stopVelocity() {
    this.speed.vel = 0.0;
  }

  stopRotation() {
    this.speed.rot = 0.0;
  }

}

const raft = new Raft();

class Shark {
  constructor() {
    loader.load('assets/shark/scene.gltf', (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.075, 0.075, 0.075);
      gltf.scene.position.set(30, -3, -30);
      gltf.scene.rotation.y = 1;
      gltf.scene.rotation.z = -.2;

      this.shark = gltf.scene;
    });
  }
}

const shark = new Shark();

init();
animate();

function init() {

  //

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.gammaOutput = true;
  document.body.appendChild(renderer.domElement);

  //

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

  //

  sun = new THREE.Vector3();


  // Water

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('assets/waternormals.jpg', function (texture) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add(water);

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

  }

  updateSun();

  const waterUniforms = water.material.uniforms;


  //

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  //

  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', function (e) {

    if (e.key === "ArrowUp") {
      raft.speed.vel = -1;
    }

    if (e.key === "ArrowDown") {
      raft.speed.vel = 1;
    }

    if (e.key === "ArrowLeft") {
      raft.speed.rot = 0.025;
    }

    if (e.key === "ArrowRight") {
      raft.speed.rot = -0.025;
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      raft.stopVelocity();
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      raft.stopRotation();
    }

    if (e.key === "q") {
      raft.stop();
    }
  });

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function isColliding(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 15 &&
    Math.abs(obj1.position.z - obj2.position.z) < 15
  );
}

function animate() {

  requestAnimationFrame(animate);
  render();
  raft.update();
  if (raft.raft && shark.shark) {
    if (isColliding(raft.raft, shark.shark)) {
      console.log("Boom! Shark Exploded!");
      scene.remove(shark.shark);
    }
  }

}

function render() {

  water.material.uniforms['time'].value += 1.0 / 60.0;

  renderer.render(scene, camera);

}
