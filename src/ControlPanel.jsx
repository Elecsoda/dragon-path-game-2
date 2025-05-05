import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ControlContainer = styled.div`
  position: fixed;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 98%;
  max-height: 80px;
  overflow-y: auto;
  
  @media (max-width: 480px) {
    bottom: 3px;
    padding: 3px;
    max-height: 70px;
    border-radius: 8px;
  }
`;

const MainRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 100%;
  
  @media (max-width: 480px) {
    gap: 2px;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  justify-content: center;
  border-right: 1px solid #ccc;
  padding-right: 5px;
  margin-right: 5px;
  
  @media (max-width: 480px) {
    padding-right: 3px;
    margin-right: 3px;
  }
`;

const RadioLabel = styled.label`
  margin: 0 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 13px;
  
  @media (max-width: 480px) {
    margin: 0 3px;
    font-size: 12px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
  
  @media (max-width: 480px) {
    gap: 2px;
  }
`;

const PathInfo = styled.div`
  font-size: 12px;
  color: #333;
  margin-left: 5px;
  display: flex;
  align-items: center;
  
  @media (max-width: 480px) {
    font-size: 11px;
    margin-left: 3px;
  }
`;

const PositionDisplay = styled.span`
  font-weight: bold;
  color: #2196F3;
`;

const TransparentButton = styled.button`
  &.selecting {
    background-color: rgba(255, 255, 255, 0.6);
  }
`;

const StartPointInfo = styled.span`
  font-size: 11px;
  color: #666;
  margin-left: 5px;
  
  @media (max-width: 480px) {
    font-size: 10px;
    margin-left: 3px;
  }
`;

const ControlPanel = ({ 
  manualMode, 
  drawingMode,
  onModeChange, 
  onStartPointSelectionClick, 
  currentPath,
  selectingStartPoint,
  animationPlaying,
  animationPaused,
  onGeneratePath,
  onStartAnimation,
  onPauseAnimation,
  onResumeAnimation,
  onStopAnimation,
  onUndoLastStep,
  onResetPath,
  onStartDrawPath,
  showPrompt,
  gridSize,
  totalPoints,
  onOpenGridSizeControl
}) => {
  const [selectingStart, setSelectingStart] = useState(false);
  
  // 同步外部选择状态
  useEffect(() => {
    setSelectingStart(selectingStartPoint);
  }, [selectingStartPoint]);
  
  const handleStartSelection = () => {
    setSelectingStart(true);
    onStartPointSelectionClick();
  };
  
  const getPathInfo = () => {
    if (currentPath.length === 0) {
      return '路径: 暂无';
    }
    return `路径: ${currentPath.length} 步`;
  };
  
  const getCurrentPosition = () => {
    if (currentPath.length === 0) {
      return '(?,?,?)';
    }
    const lastPoint = currentPath[currentPath.length - 1];
    return `(${lastPoint.index.x},${lastPoint.index.y},${lastPoint.index.z})`;
  };

  const getStartPointInfo = () => {
    if (currentPath.length === 0) {
      return '';
    }
    const startPoint = currentPath[0];
    return `起点: (${startPoint.index.x},${startPoint.index.y},${startPoint.index.z})`;
  };
  
  // 开始绘制路线
  const handleStartDrawPath = () => {
    onStartDrawPath();
  };

  return (
    <ControlContainer>
      <MainRow>
        <RadioGroup>
          <RadioLabel>
            <input 
              type="radio" 
              name="mode" 
              value="auto" 
              checked={!manualMode} 
              onChange={() => onModeChange('auto')} 
            />
            自动
          </RadioLabel>
          <RadioLabel>
            <input 
              type="radio" 
              name="mode" 
              value="manual" 
              checked={manualMode} 
              onChange={() => onModeChange('manual')} 
            />
            手动
          </RadioLabel>
        </RadioGroup>
        
        <TransparentButton 
          onClick={handleStartSelection}
          disabled={drawingMode || (!manualMode && currentPath.length > 1)}
          className={selectingStart ? 'selecting' : ''}
          title="选择起点位置"
        >
          选择起点
        </TransparentButton>
        
        {manualMode ? (
          <>
            <button
              disabled={currentPath.length === 0 || drawingMode}
              onClick={handleStartDrawPath}
              title={drawingMode ? "已在绘制模式中" : "开始绘制路线"}
            >
              {drawingMode ? "绘制中" : "绘制路线"}
            </button>
            <button
              disabled={currentPath.length <= 1}
              onClick={onUndoLastStep}
              title="撤回上一步操作"
            >
              撤回
            </button>
          </>
        ) : (
          <>
            <button
              disabled={currentPath.length === 0}
              onClick={() => onGeneratePath(true)}
              title="生成随机路径"
            >
              随机路径
            </button>
          </>
        )}
        
        <button 
          onClick={onResetPath}
          title="重置路径，可重新选择起点"
        >
          重置
        </button>
        
        <button 
          onClick={onOpenGridSizeControl}
          title="调整方阵的大小"
        >
          大小({typeof gridSize === 'object' ? 
            `${gridSize.width}×${gridSize.height}×${gridSize.depth}` : 
            `${gridSize}³`})
          {totalPoints && <span style={{ fontSize: '0.8em' }}> ({totalPoints}点)</span>}
        </button>
        
        <PathInfo>{getPathInfo()}{getStartPointInfo() && <StartPointInfo>{getStartPointInfo()}</StartPointInfo>}</PathInfo>
      </MainRow>
    </ControlContainer>
  );
};

export default ControlPanel; 
