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
const CUBE_SIZE = 0.6;
const GRID_SPACING = 1.5;

// 辅助函数 - 生成立方体网格点
const generateGridPoints = (gridSize) => {
  const points = [];
  
  // 处理gridSize可能是对象或数字的情况
  const width = typeof gridSize === 'object' ? gridSize.width : gridSize;
  const height = typeof gridSize === 'object' ? gridSize.height : gridSize;
  const depth = typeof gridSize === 'object' ? gridSize.depth : gridSize;
  
  // 计算每个维度的偏移量，确保方阵居中
  const offsetX = ((width - 1) / 2) * GRID_SPACING;
  const offsetY = ((height - 1) / 2) * GRID_SPACING;
  const offsetZ = ((depth - 1) / 2) * GRID_SPACING;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        points.push({
          index: { x, y, z },
          position: new THREE.Vector3(
            x * GRID_SPACING - offsetX,
            y * GRID_SPACING - offsetY,
            z * GRID_SPACING - offsetZ
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

// 相机初始化组件
const CameraInitializer = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    // 设置更好的视角，不是45度角
    camera.position.set(5, 3, 8);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
};

const CubeNavigation = forwardRef((props, ref) => {
  const {
    manualMode,
    drawingMode,
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
    
    // 获取当前gridSize的各个维度
    const width = typeof gridSize === 'object' ? gridSize.width : gridSize;
    const height = typeof gridSize === 'object' ? gridSize.height : gridSize;
    const depth = typeof gridSize === 'object' ? gridSize.depth : gridSize;

    // 检查六个方向，注意使用不同维度的边界值
    // 右
    if (x < width - 1) {
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
    if (y < height - 1) {
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
    if (z < depth - 1) {
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
    
    // 如果不是绘制模式，不允许添加点（需要先进入绘制模式）
    if (manualMode && !drawingMode && currentPath.length >= 1) return false;

    // 如果是第一个点，允许点击
    if (currentPath.length === 0) return true;

    // 必须是相邻的未访问点
    return areAdjacent(currentPosition, point) && !isPointInPath(point);
  };

  // 处理方向箭头点击
  const handleDirectionClick = (direction) => {
    if (!currentPosition || !manualMode || !drawingMode) return;

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
      // 在绘制路线模式下，使用handleAddPoint而不是handlePointSelection
      handleAddPoint(nextPoint);
    }
  };

  // 通过索引查找点
  const findPointByIndex = (x, y, z) => {
    // 获取当前gridSize的各个维度
    const width = typeof gridSize === 'object' ? gridSize.width : gridSize;
    const height = typeof gridSize === 'object' ? gridSize.height : gridSize;
    const depth = typeof gridSize === 'object' ? gridSize.depth : gridSize;
    
    if (
      x < 0 ||
      x >= width ||
      y < 0 ||
      y >= height ||
      z < 0 ||
      z >= depth
    ) {
      return null;
    }

    return gridPoints.current.find(
      (point) =>
        point.index.x === x && point.index.y === y && point.index.z === z
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
      // 选择起点时，所有格子都可以点击
      event.stopPropagation();
      onStartPointSelect(clickedPoint);
    } else if (manualMode) {
      // 手动模式下
      if (currentPath.length === 0) {
        // 如果路径为空，设置为起点
        event.stopPropagation();
        handleNewStartPoint(clickedPoint);
      } else if (drawingMode && isPointClickable(clickedPoint)) {
        // 如果是绘制模式且点是可点击的点（相邻且未访问），则添加到路径
        event.stopPropagation();
        handleAddPoint(clickedPoint);
      }
    } else {
      // 自动模式下，只有在选择起点模式下才允许点击
      // 无需处理这种情况，因为只有selectingStartPoint为true时才能选择起点
      // 其他情况下什么也不做
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
    const totalPoints = typeof gridSize === 'object' 
      ? gridSize.width * gridSize.height * gridSize.depth 
      : Math.pow(gridSize, 3);

    // 使用路径生成算法，使用请求动画帧确保UI不会被阻塞
    requestAnimationFrame(() => {
      try {
        // 使用路径生成函数，根据useRandomPath参数决定路径生成模式
        let path = [];
        
        // 使用更可靠的错误处理
        try {
          console.log(`开始生成${useRandomPath ? '随机' : '完整'}路径，起点:`, 
            startPoint.index.x, startPoint.index.y, startPoint.index.z);
          
          path = generatePath(
            gridPoints.current,
            startPoint,
            useRandomPath,
            gridSize
          );
        } catch (error) {
          console.error("路径生成出错:", error);
          // 确保至少有一个点（起点）
          path = [startPoint];
        }
        
        // 验证生成的路径
        if (!path || !Array.isArray(path) || path.length === 0) {
          console.error("生成的路径无效");
          path = [startPoint]; // 确保至少有起点
        }

        // 提示生成的路径长度
        console.log(`生成了包含 ${path.length}/${totalPoints} 个点的路径`);

        // 如果是随机路径且路径太短（少于总点数的10%），重试一次
        if (useRandomPath && path.length < Math.max(2, totalPoints * 0.1) && gridPoints.current.length > 1) {
          console.warn("随机路径生成结果太短，尝试重新生成");
          
          // 重新尝试一次生成随机路径，使用不同的随机种子
          setTimeout(() => {
            try {
              // 使用当前时间作为新的随机种子
              const newSeed = Date.now().toString();
              if (typeof Math.seedrandom === 'function') {
                const restore = Math.seedrandom(newSeed);
                console.log('重试使用新的随机种子:', newSeed);
                
                const retryPath = generateRandomPath(gridPoints.current, startPoint);
                
                // 恢复随机数生成器
                if (restore) restore();
                
                if (retryPath && retryPath.length > path.length) {
                  console.log(`重试成功，生成了包含 ${retryPath.length}/${totalPoints} 个点的路径`);
                  path = retryPath;
                } else {
                  console.log('重试未能生成更长的路径，使用原路径');
                }
              }
            } catch (error) {
              console.error("重试生成随机路径出错:", error);
            }
            
            // 无论重试结果如何，都显示最终路径
            setGeneratedPath(path);
            animatePathGeneration(path);
          }, 100);
          return;
        }

        // 设置生成的路径
        setGeneratedPath(path);

        // 开始路径动画展示
        animatePathGeneration(path);
      } catch (error) {
        console.error("处理路径生成过程中出错:", error);
        setGeneratingPath(false);
      }
    });
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
    
    // 计算合适的动画步进时间 - 对于更长的路径，速度更快
    const animationSpeed = Math.max(5, Math.min(30, 200 / path.length));
    
    // 使用更高效的动画方法
    let step = 1;
    const animateStep = () => {
      // 检查是否已完成
      if (step >= path.length) {
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
        
        return;
      }
      
      // 逐步更新生成的路径显示
      const currentVisiblePath = path.slice(0, step + 1);
      setGeneratedPath(currentVisiblePath);
      updatePathLine(currentVisiblePath);
      
      // 递增步骤
      step++;
      
      // 请求下一帧
      const timerId = setTimeout(() => {
        requestAnimationFrame(animateStep);
      }, animationSpeed);
      
      // 保存定时器ID以便清理
      setPathAnimationTimer(timerId);
    };
    
    // 开始动画
    requestAnimationFrame(animateStep);
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
    // 不阻止事件传播，以便OrbitControls可以继续工作
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

        // 在选择起点模式下，允许悬停在任何格子上
        if (selectingStartPoint) {
          setHoveredPoint(point);
        } else if (manualMode && !selectingStartPoint) {
          // 在手动模式下，只有可点击的点才能高亮
          const isClickable = isPointClickable(point);
          setHoveredPoint(isClickable ? point : null);
        } else {
          // 自动模式下都可以高亮
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

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    // 生成路径
    generatePath: (useRandomPath = true) => {
      handleGeneratePath(useRandomPath);
    },
    // 开始动画
    startAnimation: () => {
      startPathAnimation();
    },
    // 暂停动画
    pauseAnimation: () => {
      pausePathAnimation();
    },
    // 恢复动画
    resumeAnimation: () => {
      resumePathAnimation();
    },
    // 停止动画
    stopAnimation: () => {
      stopPathAnimation();
    },
    // 撤回上一步
    undoLastStep: () => {
      undoLastStep();
    },
    // 重置路径
    resetPath: () => {
      resetPath();
    },
    // 设置新起点
    setNewStartPoint: (point) => {
      handleNewStartPoint(point);
    },
    // 开始绘制路径
    startDrawPath: () => {
      startDrawPath();
    }
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
    if (currentPosition && manualMode && drawingMode) {
      updateEnabledDirections(currentPosition);
    } else if (manualMode && !drawingMode) {
      // 如果是手动模式但不是绘制模式，清空方向指示
      setEnabledDirections([]);
      setClickablePoints([]);
    }
  }, [currentPosition, manualMode, drawingMode, currentPath]);

  // 检查一个点是否为临时选择的点
  const isTempSelected = (point) => {
    if (!tempSelectedPoint) return false;
    return (
      point.index.x === tempSelectedPoint.index.x &&
      point.index.y === tempSelectedPoint.index.y &&
      point.index.z === tempSelectedPoint.index.z
    );
  };

  // 检查点是否可被高亮（在手动模式下，只有可点击的点才能高亮，选择起点模式下所有点都可高亮）
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
    <group ref={groupRef} onClick={handleCubeClick}>
      <OrbitControls
        ref={controlsRef}
        enabled={orbitEnabled}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        // 设置初始相机位置
        makeDefault
      />
      
      {/* 初始化相机位置 */}
      <CameraInitializer />
      
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
          isClickable={selectingStartPoint || manualMode ? (selectingStartPoint || clickablePoints.includes(point)) : true}
          inSelectionMode={selectingStartPoint}
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

      {/* 方向箭头 - 只在手动绘制模式下显示 */}
      {manualMode && drawingMode && (
        <DirectionArrows
          enabledDirections={enabledDirections}
          onDirectionClick={handleDirectionClick}
        />
      )}
    </group>
  );
});

export default CubeNavigation;
