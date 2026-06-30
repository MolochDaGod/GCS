import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CharacterManager } from "./characterManager";

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

export function sceneInitializer(canvasId) {
    const scene = new THREE.Scene()

    
    new RGBELoader().load("./hdr/studio_small_09_2k.hdr", (hdr_) => {
        hdr_.mapping = THREE.EquirectangularReflectionMapping;
        hdr_.colorSpace = THREE.LinearSRGBColorSpace
        scene.environment = hdr_;
    })
    scene.environmentIntensity = 0.5

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);

    // rotate the directional light to be a key light
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    const sceneElements = new THREE.Object3D();
    scene.add(sceneElements);

    const gcsViewer = {
        fov: 30,
        cameraPosition: [-2.2367993753934425, 1.1512971720174363, 2.2612065299409223],
        cameraTarget: [0, 0.8, 0],
        minDistance: 1,
        maxDistance: 4,
    };

    const camera = new THREE.PerspectiveCamera(
        gcsViewer.fov,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(...gcsViewer.cameraPosition);


    const characterManager = new CharacterManager({parentModel: scene, createAnimationManager : true, renderCamera:camera})
    characterManager.addLookAtMouse(80,canvasId, camera, true);
   
    //"editor-scene"
    const canvasRef = document.getElementById(canvasId);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = gcsViewer.minDistance;
    controls.maxDistance = gcsViewer.maxDistance;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = true;
    controls.target = new THREE.Vector3(...gcsViewer.cameraTarget);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const minPan = new THREE.Vector3(-0.5, 0, -0.5);
    const maxPan = new THREE.Vector3(0.5, 1.7, 0.5);

    const handleResize = () => {
        const w = canvasRef?.clientWidth || window.innerWidth;
        const h = canvasRef?.clientHeight || window.innerHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        controls.target.clamp(minPan, maxPan);
        controls?.update();
        characterManager.update(delta);
        renderer.render(scene, camera);
    };


    animate();

    const handleMouseClick = (event) => {
        const isCtrlPressed = event.ctrlKey;
        const rect = canvasRef.getBoundingClientRect();
        const mousex = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mousey = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        characterManager.cameraRaycastCulling(mousex,mousey,isCtrlPressed);
    };


    async function fetchScene() {
        // // load environment
        // const modelPath = "./3d/Platform.glb"
      
        // const loader = new GLTFLoader()
        // // load the modelPath
        // const gltf = await loader.loadAsync(modelPath)
        // sceneElements.add(gltf.scene);
    }
    fetchScene();

    
    canvasRef.addEventListener("click", handleMouseClick);

    return {
        scene,
        camera,
        controls,
        characterManager,
        sceneElements,
        clock
    };
}
