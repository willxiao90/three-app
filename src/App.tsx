import {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  Suspense,
} from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { Mesh } from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  useGLTF,
  MotionPathControls,
  useMotion,
  KeyboardControls,
  useKeyboardControls,
  Loader,
  Sky,
} from "@react-three/drei";
import type { KeyboardControlsEntry, MotionPathRef } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Leva, useControls } from "leva";
import "./App.css";

function IndustrialPark(props: ThreeElements["mesh"]) {
  const { children, ...rest } = props;
  const obj = useGLTF("./models/industrial_park/scene.gltf");
  // console.log(obj);
  const modelRef = useRef<Mesh>(null!);

  useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      // console.log({ box }, { center });
      modelRef.current.position.sub(center); // 移动到原点
      modelRef.current.position.add(new THREE.Vector3(0, 3.5, 0)); // 纠正高度偏差
    }
  }, [obj.scene]);

  return (
    <primitive ref={modelRef} object={obj.scene} {...rest}>
      {children}
    </primitive>
  );
}

const Truck = forwardRef<Mesh, ThreeElements["group"]>((props, ref) => {
  const { children, ...rest } = props;
  const obj = useGLTF("./models/work_truck/scene.gltf");

  return (
    <group ref={ref} {...rest}>
      <primitive object={obj.scene} rotation={[0, -0.1, 0]} scale={0.05}>
        {children}
      </primitive>
      <PerspectiveCamera
        fov={75}
        position={[0, 10, -20]}
        rotation={[0, -Math.PI, 0]}
      />
    </group>
  );
});

function MotionControl(props: { target: RefObject<Mesh> }) {
  const { target } = props;
  const motion = useMotion();

  useFrame((_, delta) => {
    // console.log({ motion });
    motion.current += delta * 0.02;

    motion.object.current.lookAt(motion.next); // 相机看向目标

    target.current.lookAt(motion.next); // 车头改变方向
  });

  return null;
}

function TruckController({
  truckRef,
  active,
}: {
  truckRef: RefObject<Mesh>;
  active: boolean;
}) {
  const [subKeyboard] = useKeyboardControls<Controls>();
  const keys = useRef({
    forward: false,
    back: false,
    left: false,
    right: false,
  });
  const SPEED = 20;
  const ROTATION_SPEED = 2;

  useEffect(() => {
    return subKeyboard(
      (state) => state,
      (state) => {
        keys.current = state;
      },
    );
  }, [subKeyboard]);

  useFrame((_, delta) => {
    if (!active || !truckRef.current) return;

    const truck = truckRef.current;

    if (keys.current.left) {
      truck.rotation.y += ROTATION_SPEED * delta;
    }
    if (keys.current.right) {
      truck.rotation.y -= ROTATION_SPEED * delta;
    }

    if (keys.current.forward || keys.current.back) {
      const direction = keys.current.forward ? 1 : -1;
      const angle = truck.rotation.y;

      const moveX = Math.sin(angle) * SPEED * delta * direction;
      const moveZ = Math.cos(angle) * SPEED * delta * direction;

      truck.position.x += moveX;
      truck.position.z += moveZ;
    }
  });

  return null;
}

const Sence = forwardRef<any, { isRemoteMode: boolean }>((props, ref) => {
  const { isRemoteMode } = props;
  const motionPathRef = useRef<MotionPathRef>(null!);
  const truckRef = useRef<Mesh>(null!);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);

  const { set, get } = useThree();

  const curves = useMemo(() => {
    const points = [
      new THREE.Vector3(-20, 0, 0),
      new THREE.Vector3(-16, 0, 15),
      new THREE.Vector3(-26, 0, 49),
      new THREE.Vector3(-97, 0, 40),
      new THREE.Vector3(-121, 0, 70),
      new THREE.Vector3(-132, 0, 108),
      new THREE.Vector3(-64, 0, 134),
      new THREE.Vector3(-4, 0, 183),
      new THREE.Vector3(14, 0, 231),
      new THREE.Vector3(42, 0, 245),
      new THREE.Vector3(186, 0, 267),
      new THREE.Vector3(207, 0, 190),
      new THREE.Vector3(228, 0, 99),
      new THREE.Vector3(240, 0, -124),
      new THREE.Vector3(12, 0, -128),
      new THREE.Vector3(-8, 0, -48),
      new THREE.Vector3(-20, 0, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = "catmullrom";
    curve.tension = 0.3;
    return [curve];
  }, []);

  useEffect(() => {
    cameraRef.current = get().camera as THREE.PerspectiveCamera;
  }, []);

  useImperativeHandle(ref, () => {
    return {
      switchToTruckCamera() {
        set({
          camera: truckRef.current.children[1] as THREE.PerspectiveCamera,
        });
        // setTimeout(() => {
        //   truckRef.current.children[1].rotation.set(0, -Math.PI, 0); // 重置相机旋转角度
        // }, 0);
      },
      switchToDefaultCamera() {
        set({ camera: cameraRef.current });
      },
    };
  }, [set]);

  return (
    <>
      <ambientLight intensity={2} />
      <directionalLight position={[1, 1, 0]} />

      <Sky distance={450000} sunPosition={[1, 1, 0]} />
      <fog attach="fog" args={["#c9d4d8", 200, 800]} />

      <IndustrialPark onClick={(e) => console.log(e.point)} />
      <Truck ref={truckRef} position={[-20, 0, 0]} scale={1} />

      <TruckController truckRef={truckRef} active={isRemoteMode} />

      {!isRemoteMode && (
        <MotionPathControls
          ref={motionPathRef}
          object={truckRef}
          curves={curves}
        >
          {/* <MotionControl target={truckRef} /> */}
        </MotionPathControls>
      )}
    </>
  );
});

const Controls = {
  forward: "forward",
  back: "back",
  left: "left",
  right: "right",
  jump: "jump",
} as const;

type Controls = (typeof Controls)[keyof typeof Controls];

export default function App() {
  const senceRef = useRef<any>(null);

  const { isTruckView, isRemoteMode } = useControls({
    isTruckView: {
      value: false,
      label: "车辆视角",
      onChange: (v) => toggleCamera(v),
      transient: false,
    },
    isRemoteMode: {
      value: false,
      label: "遥控模式",
    },
  });

  const toggleCamera = (val: boolean) => {
    if (val) {
      senceRef.current?.switchToTruckCamera();
    } else {
      senceRef.current?.switchToDefaultCamera();
    }
  };

  const keyMap = useMemo<KeyboardControlsEntry<Controls>[]>(
    () => [
      { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
      { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
      { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
      { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
      { name: Controls.jump, keys: ["Space"] },
    ],
    [],
  );

  return (
    <>
      <Canvas camera={{ position: [-200, 50, 100] }}>
        <OrbitControls enabled={false} maxPolarAngle={Math.PI / 2} />
        <Perf position="top-left" />

        <KeyboardControls map={keyMap}>
          <Suspense fallback={null}>
            <Sence ref={senceRef} isRemoteMode={isRemoteMode} />
          </Suspense>
        </KeyboardControls>
      </Canvas>

      <Leva />
      <Loader />
    </>
  );
}
