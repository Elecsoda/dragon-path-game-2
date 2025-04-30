import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import DirectionArrows from "./DirectionArrows";
import CubeFrame from "./CubeFrame";
import {
  generatePath,
  createPathAnimation,
  createPathLineGeometry,
} from "./pathUtils";

// 常量
const CUBE_SIZE = 0.8;
const GRID_SPACING = 2.0; // 增加格子间距，原来是默认的1.0

// 辅助函数 - 生成立方体网格点
const generateGridPoints = (gridSize) => {
  const points = [];
  const offset = ((gridSize - 1) / 2) * GRID_SPACING; // 调整偏移量计算

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        points.push({
          index: { x, y, z },
          position: new THREE.Vector3(
            x * GRID_SPACING - offset,
            y * GRID_SPACING - offset,
            z * GRID_SPACING - offset
          ),
        });
      }
    }
  }

  return points;
};

// 检查两点是否相邻（上下左右前后）
const areAdjacent = (point1, point2) => {
  if (!point1 || !point2) return false;

  const { x: x1, y: y1, z: z1 } = point1.index;
  const { x: x2, y: y2, z: z2 } = point2.index;

  // 检查是否只有一个维度相差1，其他维度相同
  const xDiff = Math.abs(x1 - x2);
  const yDiff = Math.abs(y1 - y2);
  const zDiff = Math.abs(z1 - z2);

  return (
    (xDiff === 1 && yDiff === 0 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 1 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 0 && zDiff === 1)
  );
};

const CubeNavigation = forwardRef((props, ref) => {
  const {
    manualMode,
    selectedStartPoint,
    currentPath,
    onPathUpdate,
    selectingStartPoint,
    onStartPointSelect,
    tempSelectedPoint,
    gridSize = 3, // 新增属性，默认值为3
    onDirectPathPoint,
  } = props;

  const groupRef = useRef();
  const controlsRef = useRef();
  const gridPoints = useRef(generateGridPoints(gridSize));
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [pathLine, setPathLine] = useState(null);
  const { camera, raycaster, mouse, scene, gl } = useThree();

  // 方向箭头功能
  const [enabledDirections, setEnabledDirections] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const meshRefs = useRef({});

  // 动画状态
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [animationSphere, setAnimationSphere] = useState(null);
  const pathAnimation = useRef(null);

  // 路径生成动画
  const [generatingPath, setGeneratingPath] = useState(false);
  const [generatedPath, setGeneratedPath] = useState([]);
  const [pathAnimationTimer, setPathAnimationTimer] = useState(null);
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0);

  // 手动模式下可点击的点
  const [clickablePoints, setClickablePoints] = useState([]);

  // OrbitControls状态
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  // 当gridSize变化时重新生成网格点
  useEffect(() => {
    gridPoints.current = generateGridPoints(gridSize);
    // 重置路径和其他状态
    resetPath();
  }, [gridSize]);

  // 存储所有点的mesh引用
  const storeMeshRef = (index, ref) => {
    if (ref) {
      meshRefs.current[`${index.x}-${index.y}-${index.z}`] = ref;
    }
  };

  // 重置方块颜色
  const resetCubeColors = () => {
    // 实现重置颜色的逻辑
  };

  // 检查可用方向和可点击点
  const updateEnabledDirections = (currentPos) => {
    if (!currentPos) {
      setEnabledDirections([]);
      setClickablePoints([]);
      return;
    }

    const directions = [];
    const clickable = [];
    const { x, y, z } = currentPos.index;

    // 检查六个方向，注意使用gridSize变量
    // 右
    if (x < gridSize - 1) {
      const nextPoint = findPointByIndex(x + 1, y, z);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("x+");
        clickable.push(nextPoint);
      }
    }
    // 左
    if (x > 0) {
      const nextPoint = findPointByIndex(x - 1, y, z);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("x-");
        clickable.push(nextPoint);
      }
    }
    // 上
    if (y < gridSize - 1) {
      const nextPoint = findPointByIndex(x, y + 1, z);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("y+");
        clickable.push(nextPoint);
      }
    }
    // 下
    if (y > 0) {
      const nextPoint = findPointByIndex(x, y - 1, z);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("y-");
        clickable.push(nextPoint);
      }
    }
    // 前
    if (z < gridSize - 1) {
      const nextPoint = findPointByIndex(x, y, z + 1);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("z+");
        clickable.push(nextPoint);
      }
    }
    // 后
    if (z > 0) {
      const nextPoint = findPointByIndex(x, y, z - 1);
      if (nextPoint && !isPointInPath(nextPoint)) {
        directions.push("z-");
        clickable.push(nextPoint);
      }
    }

    setEnabledDirections(directions);
    setClickablePoints(clickable);
  };

  // 检查点是否在路径上
  const isPointInPath = (point) => {
    return currentPath.some(
      (p) =>
        p.index.x === point.index.x &&
        p.index.y === point.index.y &&
        p.index.z === point.index.z
    );
  };

  // 检查点是否可点击（必须是相邻的未访问点）
  const isPointClickable = (point) => {
    if (!manualMode || !currentPosition || !point) return false;

    // 如果是第一个点，允许点击
    if (currentPath.length === 0) return true;

    // 必须是相邻的未访问点
    return areAdjacent(currentPosition, point) && !isPointInPath(point);
  };

  // 处理方向箭头点击
  const handleDirectionClick = (direction) => {
    if (!currentPosition || !manualMode) return;

    const { x, y, z } = currentPosition.index;
    let nextPoint;

    // 计算下一个点的索引
    switch (direction) {
      case "x+":
        nextPoint = findPointByIndex(x + 1, y, z);
        break;
      case "x-":
        nextPoint = findPointByIndex(x - 1, y, z);
        break;
      case "y+":
        nextPoint = findPointByIndex(x, y + 1, z);
        break;
      case "y-":
        nextPoint = findPointByIndex(x, y - 1, z);
        break;
      case "z+":
        nextPoint = findPointByIndex(x, y, z + 1);
        break;
      case "z-":
        nextPoint = findPointByIndex(x, y, z - 1);
        break;
      default:
        return;
    }

    if (nextPoint && !isPointInPath(nextPoint)) {
      handlePointSelection(nextPoint);
    }
  };

  // 通过索引查找点
  const findPointByIndex = (x, y, z) => {
    if (
      x < 0 ||
      x >= gridSize ||
      y < 0 ||
      y >= gridSize ||
      z < 0 ||
      z >= gridSize
    ) {
      return null;
    }
    return gridPoints.current.find(
      (p) => p.index.x === x && p.index.y === y && p.index.z === z
    );
  };

  // 处理点选择
  const handlePointSelection = (point) => {
    if (!point) return;

    // 在手动模式下，如果已经有超过一个点的路径，不允许切换起点
    if (manualMode && currentPath.length > 1) {
      console.log("绘制路线时不能更换起点，请先清空路线");
      return;
    }

    handleNewStartPoint(point);
  };

  // 处理点击事件，实现点击立方体而不影响视角控制
  const handleCubeClick = (event) => {
    // 检查是否点击到立方体
    raycaster.setFromCamera(mouse, camera);
    const allMeshes = Object.values(meshRefs.current);
    const intersects = raycaster.intersectObjects(allMeshes);

    if (intersects.length === 0) {
      // 没有点击到立方体
      return;
    }

    // 临时禁用OrbitControls，以便处理点击事件
    setOrbitEnabled(false);

    // 创建一个定时器，在短时间后重新启用OrbitControls
    setTimeout(() => {
      setOrbitEnabled(true);
    }, 10);

    const clickedObject = intersects[0].object;
    const pointKey = Object.keys(meshRefs.current).find(
      (key) => meshRefs.current[key] === clickedObject
    );

    if (!pointKey) return;

    const [x, y, z] = pointKey.split("-").map(Number);
    const clickedPoint = findPointByIndex(x, y, z);

    if (!clickedPoint) return;

    // 处理有效点击
    if (selectingStartPoint) {
      // 选择起点时
      event.stopPropagation();
      onStartPointSelect(clickedPoint);
    } else if (manualMode) {
      // 手动模式下
      if (isPointClickable(clickedPoint)) {
        // 如果是可点击的点（相邻且未访问），则添加到路径
        event.stopPropagation();
        handleAddPoint(clickedPoint);
      }
    } else {
      // 自动模式下，点击任何点都视为选择新起点
      event.stopPropagation();
      handleNewStartPoint(clickedPoint);
    }
  };

  // 处理选择新起点
  const handleNewStartPoint = (point) => {
    if (!point) return;

    // 新起点，重置路径
    const newPath = [point];
    setCurrentPosition(point);

    // 更新可用方向
    updateEnabledDirections(point);

    // 更新路径
    onPathUpdate(newPath);

    // 清空路径线
    setPathLine(null);

    // 停止可能的动画
    stopPathAnimation();

    console.log("新起点已选择:", point.index);
  };

  // 处理添加点到路径（手动模式）
  const handleAddPoint = (point) => {
    if (!point || !manualMode) return;

    let newPath = [...currentPath];

    // 添加到路径
    newPath.push(point);
    setCurrentPosition(point);

    // 更新可用方向
    updateEnabledDirections(point);

    // 更新路径
    onPathUpdate(newPath);

    // 更新路径线
    updatePathLine(newPath);
  };

  // 更新路径线
  const updatePathLine = (path) => {
    if (path.length < 2) {
      setPathLine(null);
      return;
    }

    const points = path.map((p) => p.position);
    setPathLine(points);
  };

  // 处理层级选择器选择的点
  useEffect(() => {
    if (selectedStartPoint) {
      // 查找完整的点对象
      const fullPoint = findPointByIndex(
        selectedStartPoint.index.x,
        selectedStartPoint.index.y,
        selectedStartPoint.index.z
      );

      if (fullPoint) {
        // 设置为起点
        const newPath = [fullPoint];
        onPathUpdate(newPath);
        setCurrentPosition(fullPoint);
        updateEnabledDirections(fullPoint);
      }
    }
  }, [selectedStartPoint]);

  // 生成自动路径
  const handleGeneratePath = (useRandomPath = true) => {
    if (!selectedStartPoint && currentPath.length === 0) return;

    // 停止可能正在运行的动画
    if (pathAnimation.current) {
      pathAnimation.current.stop();
      pathAnimation.current = null;
    }

    // 获取起点 - 无论是从selectedStartPoint还是从currentPath
    const startPoint =
      selectedStartPoint || (currentPath.length > 0 ? currentPath[0] : null);
    if (!startPoint) return;

    // 如果当前路径为空，先将起点添加到路径中
    if (currentPath.length === 0) {
      onPathUpdate([startPoint]);
    }

    // 设置生成路径的状态
    setGeneratingPath(true);
    setGeneratedPath([startPoint]);
    setCurrentAnimationStep(0);

    // 计算所有点数量
    const totalPoints = gridSize * gridSize * gridSize;

    // 使用路径生成算法
    setTimeout(() => {
      // 使用路径生成函数，传入gridSize参数
      const path = generatePath(
        gridPoints.current,
        startPoint,
        useRandomPath,
        gridSize
      );

      if (path && path.length > 0) {
        // 提示生成的路径长度
        console.log(`生成了包含 ${path.length}/${totalPoints} 个点的路径`);

        // 设置生成的路径
        setGeneratedPath(path);

        // 开始路径动画展示
        animatePathGeneration(path);
      } else {
        setGeneratingPath(false);
        console.error("路径生成失败");
      }
    }, 10);
  };

  // 添加animatePathGeneration函数
  const animatePathGeneration = (path) => {
    if (!path || path.length <= 1) {
      setGeneratingPath(false);
      return;
    }

    // 清除可能存在的旧定时器
    if (pathAnimationTimer) {
      clearInterval(pathAnimationTimer);
    }

    // 设置当前动画步骤
    setCurrentAnimationStep(1);

    // 开始路径生成动画
    const timerId = setInterval(() => {
      setCurrentAnimationStep((prevStep) => {
        if (prevStep >= path.length) {
          clearInterval(timerId);
          setGeneratingPath(false);

          // 完成路径生成动画后，更新路径
          onPathUpdate(path);
          updatePathLine(path);

          // 创建动画控制器
          pathAnimation.current = createPathAnimation(
            path,
            handleAnimationStep,
            handleAnimationComplete,
            0.02
          );

          return prevStep;
        }

        // 逐步更新生成的路径显示
        const currentVisiblePath = path.slice(0, prevStep + 1);
        setGeneratedPath(currentVisiblePath);
        updatePathLine(currentVisiblePath);

        return prevStep + 1;
      });
    }, 30); // 路径生成动画，每30毫秒一步

    setPathAnimationTimer(timerId);
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (pathAnimationTimer) {
        clearInterval(pathAnimationTimer);
      }
    };
  }, [pathAnimationTimer]);

  // 动画步骤回调
  const handleAnimationStep = (data) => {
    if (!animationSphere) return;

    // 更新球体位置
    animationSphere.position.copy(data.position);
  };

  // 动画完成回调
  const handleAnimationComplete = () => {
    setAnimationPlaying(false);
    setAnimationPaused(false);
  };

  // 开始路径动画
  const startPathAnimation = () => {
    if (!currentPath || currentPath.length < 2 || manualMode) return;

    // 如果没有动画控制器，重新生成路径
    if (!pathAnimation.current) {
      handleGeneratePath(true);
    }

    // 创建球体 (如果不存在)
    if (!animationSphere) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      setAnimationSphere(sphere);
    }

    // 开始动画
    if (pathAnimation.current) {
      pathAnimation.current.start();
      setAnimationPlaying(true);
      setAnimationPaused(false);
    }
  };

  // 暂停路径动画
  const pausePathAnimation = () => {
    if (pathAnimation.current && animationPlaying && !animationPaused) {
      pathAnimation.current.pause();
      setAnimationPaused(true);
    }
  };

  // 恢复路径动画
  const resumePathAnimation = () => {
    if (pathAnimation.current && animationPlaying && animationPaused) {
      pathAnimation.current.resume();
      setAnimationPaused(false);
    }
  };

  // 停止路径动画
  const stopPathAnimation = () => {
    if (pathAnimation.current) {
      pathAnimation.current.stop();
      setAnimationPlaying(false);
      setAnimationPaused(false);
    }
  };

  // 完全解决视角控制问题
  useEffect(() => {
    if (controlsRef.current) {
      // 确保控制器可用性
      controlsRef.current.enabled = orbitEnabled;
    }
  }, [orbitEnabled]);

  // 确保鼠标事件正确传播
  useEffect(() => {
    const handleMouseDown = () => {
      // 确保用户可以通过鼠标拖动旋转视角
      setOrbitEnabled(true);
    };

    const handleMouseUp = () => {
      // 鼠标释放时重新启用控制器
      setOrbitEnabled(true);
    };

    // 添加全局事件监听
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      // 移除事件监听
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // 处理悬停，保持鼠标悬停显示而不干扰控制器
  const handlePointHover = (event) => {
    if (!selectingStartPoint && !manualMode) return;

    // 不需要阻止事件传播，以便OrbitControls可以继续工作
    raycaster.setFromCamera(mouse, camera);

    const allMeshes = Object.values(meshRefs.current);
    const intersects = raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const hoveredObject = intersects[0].object;
      const pointKey = Object.keys(meshRefs.current).find(
        (key) => meshRefs.current[key] === hoveredObject
      );

      if (pointKey) {
        const [x, y, z] = pointKey.split("-").map(Number);
        const point = findPointByIndex(x, y, z);

        if (manualMode && !selectingStartPoint) {
          const isClickable = isPointClickable(point);
          setHoveredPoint(isClickable ? point : null);
        } else {
          setHoveredPoint(point);
        }
      } else {
        setHoveredPoint(null);
      }
    } else {
      setHoveredPoint(null);
    }
  };

  // 添加更新的鼠标移动监听器
  useEffect(() => {
    const canvas = gl.domElement;

    // 不阻止事件冒泡，允许OrbitControls接收事件
    const handlePointerMove = (event) => {
      handlePointHover(event);
    };

    canvas.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [selectingStartPoint, manualMode, currentPath, gl]);

  // 撤回上一步
  const undoLastStep = () => {
    if (!manualMode || currentPath.length <= 1) return;

    // 创建新路径，删除最后一个点
    const newPath = [...currentPath];
    newPath.pop();

    // 更新当前位置为新路径的最后一个点
    setCurrentPosition(newPath[newPath.length - 1]);

    // 更新路径
    onPathUpdate(newPath);

    // 更新路径线
    updatePathLine(newPath);

    // 更新可用方向
    updateEnabledDirections(newPath[newPath.length - 1]);
  };

  // 重置路径
  const resetPath = () => {
    // 保留起点，清除其他点
    if (currentPath.length > 0) {
      const startPoint = currentPath[0];
      onPathUpdate([startPoint]);
      setCurrentPosition(startPoint);
      updateEnabledDirections(startPoint);
      setPathLine(null);
    } else {
      onPathUpdate([]);
      setCurrentPosition(null);
      setEnabledDirections([]);
      setPathLine(null);
    }

    // 停止动画
    stopPathAnimation();
  };

  // 开始绘制路线（清空现有路线，只保留起点）
  const startDrawPath = () => {
    if (currentPath.length > 0) {
      const startPoint = currentPath[0];
      onPathUpdate([startPoint]);
      setCurrentPosition(startPoint);
      updateEnabledDirections(startPoint);
      setPathLine(null);
    }
  };

  // 对外暴露组件API
  useImperativeHandle(ref, () => ({
    generatePath: handleGeneratePath,
    startAnimation: startPathAnimation,
    pauseAnimation: pausePathAnimation,
    resumeAnimation: resumePathAnimation,
    stopAnimation: stopPathAnimation,
    undoLastStep: undoLastStep,
    resetPath: resetPath,
    startDrawPath: startDrawPath,
    setNewStartPoint: handleNewStartPoint,
  }));

  // 在每一帧更新动画
  useFrame(() => {
    if (pathAnimation.current && animationPlaying && !animationPaused) {
      pathAnimation.current.tick();
    }
  });

  // 初始化
  useEffect(() => {
    if (selectedStartPoint && currentPath.length === 0) {
      handlePointSelection(selectedStartPoint);
    }
  }, [selectedStartPoint]);

  // 更新方向箭头
  useEffect(() => {
    if (currentPosition && manualMode) {
      updateEnabledDirections(currentPosition);
    }
  }, [currentPosition, manualMode, currentPath]);

  // 检查一个点是否为临时选择的点
  const isTempSelected = (point) => {
    if (!tempSelectedPoint) return false;
    return (
      point.index.x === tempSelectedPoint.index.x &&
      point.index.y === tempSelectedPoint.index.y &&
      point.index.z === tempSelectedPoint.index.z
    );
  };

  // 检查点是否可被高亮（在手动模式下，只有可点击的点才能高亮）
  const canHighlight = (point) => {
    if (selectingStartPoint) return true;
    if (!manualMode) return true;
    return clickablePoints.some(
      (p) =>
        p.index.x === point.index.x &&
        p.index.y === point.index.y &&
        p.index.z === point.index.z
    );
  };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={orbitEnabled}
        enableDamping={true}
        dampingFactor={0.15}
        rotateSpeed={0.8}
        minDistance={3}
        maxDistance={20}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <group ref={groupRef} onClick={handleCubeClick}>
        {/* 绘制立方体框架 */}
        {gridPoints.current.map((point, index) => (
          <CubeFrame
            key={index}
            position={point.position}
            size={CUBE_SIZE}
            color={0xcccccc}
            isSelected={currentPath.includes(point) && currentPath[0] !== point}
            isStart={currentPath.length > 0 && currentPath[0] === point}
            isEnd={
              currentPath.length > 1 &&
              currentPath[currentPath.length - 1] === point
            }
            isHovered={
              hoveredPoint === point && (canHighlight(point) || !manualMode)
            }
            isTempSelected={isTempSelected(point)}
            isClickable={manualMode ? clickablePoints.includes(point) : true}
            userData={{ isGridPoint: true, index: point.index }}
            setMeshRef={(ref) => storeMeshRef(point.index, ref)}
          />
        ))}

        {/* 绘制路径线 */}
        {pathLine && (
          <Line points={pathLine} color="deepskyblue" lineWidth={3} />
        )}

        {/* 动画球体 - 仅在动画播放时显示 */}
        {animationPlaying && animationSphere && (
          <mesh position={animationSphere.position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={0xff0000} />
          </mesh>
        )}
      </group>

      {/* 方向箭头 */}
      {manualMode && (
        <DirectionArrows
          enabledDirections={enabledDirections}
          onDirectionClick={handleDirectionClick}
        />
      )}
    </>
  );
});

export default CubeNavigation;
