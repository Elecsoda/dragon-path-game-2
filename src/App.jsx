import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import styled from "styled-components";
import CubeNavigation from "./CubeNavigation";
import TouchGuide from "./TouchGuide";
import ControlPanel from "./ControlPanel";
import LayerSelector from "./LayerSelector";
import GridSizeControl from "./GridSizeControl";
import "./App.css";

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  // 将默认模式设置为自动模式
  const [manualMode, setManualMode] = useState(false);
  const [selectedStartPoint, setSelectedStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectingStartPoint, setSelectingStartPoint] = useState(false);
  // 添加绘制模式状态，用于手动模式下控制是否在绘制路线
  const [drawingMode, setDrawingMode] = useState(false);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [tempSelectedPoint, setTempSelectedPoint] = useState(null);
  const [showPrompt, setShowPrompt] = useState(true);

  // 添加方阵大小状态
  const [gridSize, setGridSize] = useState(3);
  const [showGridSizeControl, setShowGridSizeControl] = useState(false);

  // 引用立方体导航组件
  const cubeNavigationRef = useRef();

  // 初始化自动提示选择起点，但不直接弹出选择界面
  useEffect(() => {
    if (showPrompt) {
      // 仅显示提示，不自动弹出选择器
      setTimeout(() => {
        setShowPrompt(false);
      }, 2000);
    }
  }, []);

  const handleModeChange = (mode) => {
    const isManual = mode === "manual";

    // 停止当前可能正在进行的动画
    if (cubeNavigationRef.current && cubeNavigationRef.current.stopAnimation) {
      cubeNavigationRef.current.stopAnimation();
    }

    // 清空路径和起点
    setManualMode(isManual);
    // 退出绘制模式
    setDrawingMode(false);
    setCurrentPath([]);
    setSelectedStartPoint(null);
    setAnimationPlaying(false);
    setAnimationPaused(false);
    setTempSelectedPoint(null);

    // 切换模式时显示提示
    setShowPrompt(true);
    setTimeout(() => {
      setShowPrompt(false);
    }, 2000);
  };

  const handleStartPointSelect = (point) => {
    console.log("选择了起点:", point.index);
    setSelectedStartPoint(point);
    setSelectingStartPoint(false);
    setShowLayerSelector(false);
    setTempSelectedPoint(null);

    // 确保选择了新起点后，路径中只包含这一个点
    if (
      cubeNavigationRef.current &&
      cubeNavigationRef.current.setNewStartPoint
    ) {
      cubeNavigationRef.current.setNewStartPoint(point);
    } else {
      // 如果没有专门的方法，就直接更新路径
      setCurrentPath([point]);
    }
  };

  const handleStartPointSelectionClick = () => {
    // 在绘制模式下，不允许更改起点
    if (drawingMode && currentPath.length > 1) {
      alert("绘制路线时不能更换起点，请先重置路线");
      return;
    }

    // 自动模式下如果已经生成了路径，也不允许更改起点
    if (!manualMode && currentPath.length > 1) {
      alert("已生成路径，如需更换起点，请先重置路径");
      return;
    }

    // 清空已有路径和临时选择点
    setTempSelectedPoint(null);
    setSelectingStartPoint(true);
    setShowLayerSelector(true);
  };

  const handlePathUpdate = (newPath) => {
    setCurrentPath(newPath);
  };

  // 生成路径
  const handleGeneratePath = (useRandomPath = true) => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.generatePath)
      return;

    // 确保有起点
    if (currentPath.length === 0 && !selectedStartPoint) {
      alert("请先选择起点位置");
      return;
    }

    cubeNavigationRef.current.generatePath(useRandomPath);
  };

  // 开始动画
  const handleStartAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.startAnimation)
      return;
    cubeNavigationRef.current.startAnimation();
    setAnimationPlaying(true);
    setAnimationPaused(false);
  };

  // 暂停动画
  const handlePauseAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.pauseAnimation)
      return;
    cubeNavigationRef.current.pauseAnimation();
    setAnimationPaused(true);
  };

  // 恢复动画
  const handleResumeAnimation = () => {
    if (
      !cubeNavigationRef.current ||
      !cubeNavigationRef.current.resumeAnimation
    )
      return;
    cubeNavigationRef.current.resumeAnimation();
    setAnimationPaused(false);
  };

  // 停止动画
  const handleStopAnimation = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.stopAnimation)
      return;
    cubeNavigationRef.current.stopAnimation();
    setAnimationPlaying(false);
    setAnimationPaused(false);
  };

  // 撤回上一步
  const handleUndoLastStep = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.undoLastStep)
      return;
    cubeNavigationRef.current.undoLastStep();
  };

  // 重置路径
  const handleResetPath = () => {
    if (!cubeNavigationRef.current || !cubeNavigationRef.current.resetPath)
      return;
    cubeNavigationRef.current.resetPath();

    // 退出绘制模式
    setDrawingMode(false);
  };

  // 开始绘制路线
  const handleStartDrawPath = () => {
    // 如果当前没有起点，提示选择起点
    if (currentPath.length === 0 && !selectedStartPoint) {
      alert("请先选择起点位置");
      return;
    }

    // 使用CubeNavigation组件的startDrawPath方法清空路线，只保留起点
    if (cubeNavigationRef.current && cubeNavigationRef.current.startDrawPath) {
      cubeNavigationRef.current.startDrawPath();
      // 进入绘制模式
      setDrawingMode(true);
    }
  };

  // 取消选择
  const handleCancelSelection = () => {
    setShowLayerSelector(false);
    setTempSelectedPoint(null);
  };

  // 临时选择点（预览）
  const handleTempPointSelect = (point) => {
    setTempSelectedPoint(point);
  };

  // 在任何情况下设置新起点
  const handleDirectPathPoint = (point) => {
    // 在绘制模式下，不允许更改起点
    if (drawingMode) {
      return;
    }

    // 自动模式下如果已经生成了路径，也不允许更改起点
    if (!manualMode && currentPath.length > 1) {
      return;
    }

    // 手动模式下不允许直接点击更换起点
    if (manualMode && currentPath.length >= 1) {
      return;
    }

    if (!point) return;

    // 停止可能正在进行的动画
    if (cubeNavigationRef.current && cubeNavigationRef.current.stopAnimation) {
      cubeNavigationRef.current.stopAnimation();
    }

    setSelectedStartPoint(point);
    setCurrentPath([point]);
  };

  // 处理打开方阵大小调节控制面板
  const handleOpenGridSizeControl = () => {
    setShowGridSizeControl(true);
  };

  // 处理关闭方阵大小调节控制面板
  const handleCloseGridSizeControl = () => {
    setShowGridSizeControl(false);
  };

  // 处理方阵大小变更
  const handleGridSizeChange = (newSize) => {
    // 检查是否是有效的大小值
    if (newSize >= 2 && newSize <= 8) {
      setGridSize(newSize);

      // 重置路径和其他状态
      setCurrentPath([]);
      setSelectedStartPoint(null);
      setAnimationPlaying(false);
      setAnimationPaused(false);
      setTempSelectedPoint(null);
      setDrawingMode(false);

      // 提示用户选择新的起点
      setShowPrompt(true);
      setTimeout(() => {
        setShowPrompt(false);
      }, 2000);
    }
  };

  return (
    <AppContainer>
      <TouchGuide />

      <CanvasContainer>
        <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          <CubeNavigation
            ref={cubeNavigationRef}
            manualMode={manualMode}
            drawingMode={drawingMode}
            selectedStartPoint={selectedStartPoint}
            currentPath={currentPath}
            onPathUpdate={handlePathUpdate}
            selectingStartPoint={selectingStartPoint}
            onStartPointSelect={handleStartPointSelect}
            tempSelectedPoint={tempSelectedPoint}
            onDirectPathPoint={handleDirectPathPoint}
            gridSize={gridSize}
          />
        </Canvas>
      </CanvasContainer>

      <ControlPanel
        manualMode={manualMode}
        drawingMode={drawingMode}
        onModeChange={handleModeChange}
        onStartPointSelectionClick={handleStartPointSelectionClick}
        currentPath={currentPath}
        selectingStartPoint={selectingStartPoint}
        animationPlaying={animationPlaying}
        animationPaused={animationPaused}
        onGeneratePath={handleGeneratePath}
        onStartAnimation={handleStartAnimation}
        onPauseAnimation={handlePauseAnimation}
        onResumeAnimation={handleResumeAnimation}
        onStopAnimation={handleStopAnimation}
        onUndoLastStep={handleUndoLastStep}
        onResetPath={handleResetPath}
        onStartDrawPath={handleStartDrawPath}
        showPrompt={showPrompt}
        gridSize={gridSize}
        onOpenGridSizeControl={handleOpenGridSizeControl}
      />

      {showLayerSelector && (
        <LayerSelector
          onSelect={handleStartPointSelect}
          onCancel={handleCancelSelection}
          onTempSelect={handleTempPointSelect}
          gridSize={gridSize}
        />
      )}

      {showGridSizeControl && (
        <GridSizeControl
          currentSize={gridSize}
          onSizeChange={handleGridSizeChange}
          onClose={handleCloseGridSizeControl}
        />
      )}

      {showPrompt && (
        <PromptOverlay>
          <PromptText>
            {manualMode
              ? "请选择起点位置开始绘制路线"
              : "请选择起点位置生成自动路径"}
          </PromptText>
        </PromptOverlay>
      )}
    </AppContainer>
  );
}

// 添加提示样式
const PromptOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px 30px;
  border-radius: 10px;
  z-index: 100;
`;

const PromptText = styled.p`
  color: white;
  font-size: 18px;
  margin: 0;
  text-align: center;
`;

export default App;
