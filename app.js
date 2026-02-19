const scene = new THREE.Scene();
const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.3, 3); 

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const videoElement = document.getElementById('video-input');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');

let currentVrm = null;
const loader = new THREE.GLTFLoader();
loader.load('./models/sanhua.vrm', (gltf) => {
    THREE.VRM.from(gltf).then((vrm) => {
        scene.add(vrm.scene);
        currentVrm = vrm;
        vrm.scene.rotation.y = Math.PI; 
        console.log("Model Sanhua SIAP. Memulai sinkronisasi AI...");
    });
});

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    if (currentVrm) currentVrm.update(clock.getDelta());
    renderer.render(scene, camera);
}
animate();

const { Face, Pose, Hand } = Kalidokit;
const holistic = new Holistic({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`
});

holistic.setOptions({
    modelComplexity: 1, // Diubah kembali ke 1 agar deteksi lengan lebih akurat
    smoothLandmarks: true,
    minDetectionConfidence: 0.5, 
    minTrackingConfidence: 0.5,
    refineFaceLandmarks: true
});

const setBone = (boneName, rotation, weight = 1) => {
    if (!currentVrm || !rotation) return;
    const bone = currentVrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName[boneName]);
    if (bone) {
        bone.rotation.x = rotation.x * weight;
        bone.rotation.y = rotation.y * weight;
        bone.rotation.z = rotation.z * weight;
    }
};

holistic.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Status Monitoring
    canvasCtx.font = "14px Arial";
    canvasCtx.fillStyle = "yellow";
    if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 1 });
        const hasArm = results.poseLandmarks[11] && results.poseLandmarks[13] && results.poseLandmarks[15];
        canvasCtx.fillText(hasArm ? "LENGAN: AKTIF" : "LENGAN: POSISI BELUM PAS", 10, 20);
    }
    canvasCtx.restore();

    if (!currentVrm) return;

    // 1. WAJAH, MATA, & MULUT (FIXED)
    if (results.faceLandmarks) {
        try {
            const riggedFace = Face.solve(results.faceLandmarks, { runtime: "mediapipe", video: videoElement });
            if (riggedFace) {
                setBone('Neck', riggedFace.head, 0.5);
                setBone('Head', riggedFace.head, 0.5);
                
                if (currentVrm.blendShapeProxy) {
                    // Mata: 1 - Blink (Karena VRM menggunakan nilai 0-1)
                    currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkL, Math.max(0, 1 - riggedFace.eye.l));
                    currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.BlinkR, Math.max(0, 1 - riggedFace.eye.r));
                    // Mulut: Mengikuti gerakan rahang (A, I, U, E, O)
                    currentVrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.A, riggedFace.mouth.y);
                }
            }
        } catch (e) { console.error("Wajah error"); }
    }

    // 2. LENGAN & SIKU (POSE)
    if (results.poseLandmarks && results.poseWorldLandmarks) {
        try {
            const riggedPose = Pose.solve(results.poseWorldLandmarks, results.poseLandmarks, { 
                runtime: "mediapipe", video: videoElement 
            });
            if (riggedPose) {
                setBone('RightUpperArm', riggedPose.RightUpperArm);
                setBone('RightLowerArm', riggedPose.RightLowerArm);
                setBone('LeftUpperArm', riggedPose.LeftUpperArm);
                setBone('LeftLowerArm', riggedPose.LeftLowerArm);
            }
        } catch (e) { }
    }

    // 3. JARI TANGAN
    const solveHand = (landmarks, side) => {
        if (landmarks && landmarks.length > 20) {
            try {
                const riggedHand = Hand.solve(landmarks, side);
                if (riggedHand) setBone(side + 'Hand', riggedHand[side + 'Wrist']);
            } catch (e) { }
        }
    };
    solveHand(results.leftHandLandmarks, "Left");
    solveHand(results.rightHandLandmarks, "Right");
});

async function start() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
            async function loop() {
                if (videoElement.readyState >= 2) await holistic.send({ image: videoElement });
                requestAnimationFrame(loop);
            }
            loop();
        };
    } catch (err) {
        console.error("Gagal kamera:", err);
    }
}
start();