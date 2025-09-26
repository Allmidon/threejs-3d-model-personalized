import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// --- Variables Globales ---
let camera, scene, renderer, stats;
let model, mixer, activeAction;
const clock = new THREE.Clock();

// --- Nombres de los assets ---
const modelName = 'Paladin J Nordstrom';
const animationAssets = [
    'Texting While Standing',
    'Swimming',
    'Chapa-Giratoria',
    'Kneeling Pointing',
    'Taunt',
    'Silly Dancing',
];
const actions = {}; // Objeto para guardar las acciones de animación

init();

function init() {
    // --- Contenedor y Mensaje de Instrucciones ---
    const container = document.createElement('div');
    document.body.appendChild(container);

    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.top = '10px';
    instructions.style.left = '10px';
    instructions.style.padding = '10px';
    instructions.style.backgroundColor = 'rgba(92, 0, 0, 0.7)';
    instructions.style.color = 'white';
    instructions.style.fontFamily = 'Arial, sans-serif';
    instructions.style.borderRadius = '5px';
    instructions.innerHTML = `
        <strong>Controles de Animación:</strong><br>
        1: Texting While Standing<br>
        2: Swimming<br>
        3: Chapa-Giratoria<br>
        4: Kneeling Pointing<br>
        5: Taunt<br>
        6: Silly Dancing
    `;
    document.body.appendChild(instructions);


    // --- Configuración básica de la escena ---
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    // --- Luces ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    // --- Suelo ---
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // --- Carga del modelo y animaciones ---
    const loader = new FBXLoader();
    loader.load(`models/fbx/${modelName}.fbx`, function (object) {
        model = object;
        model.scale.setScalar(1.0); // Ajusta la escala si es necesario
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model);

        // Inicializar el mixer después de cargar el modelo
        mixer = new THREE.AnimationMixer(model);

        // Cargar todas las animaciones
        loadAnimations(loader);
    });


    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // --- Controles de cámara ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);

    // --- Stats ---
    stats = new Stats();
    container.appendChild(stats.dom);
}

function loadAnimations(loader) {
    let loadedCount = 0;
    // Carga cada animación del array
    animationAssets.forEach((assetName, index) => {
        loader.load(`models/fbx/${assetName}.fbx`, (fbx) => {
            const clip = fbx.animations[0];
            const action = mixer.clipAction(clip);
            actions[assetName] = action;

            // Si es la primera animación, la reproducimos por defecto
            if (index === 0) {
                activeAction = actions[assetName];
                activeAction.play();
            }
        });
    });
}

function fadeToAction(name, duration) {
    if (!actions[name] || activeAction === actions[name]) return;

    const previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction) {
        previousAction.fadeOut(duration);
    }

    activeAction
        .reset()
        .setEffectiveTimeScale(1)
        .setEffectiveWeight(1)
        .fadeIn(duration)
        .play();
}


function onKeyDown(event) {
    const key = parseInt(event.key);
    if (key >= 1 && key <= animationAssets.length) {
        const animationName = animationAssets[key - 1];
        fadeToAction(animationName, 0.25); // 0.25 segundos de transición
    }
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    stats.update();
}