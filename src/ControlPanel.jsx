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
  max-width: 95%;
  max-height: 130px;
  overflow-y: auto;
  
  @media (max-width: 480px) {
    bottom: 3px;
    padding: 3px;
    max-height: 110px;
    border-radius: 8px;
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

const RadioGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
  
  @media (max-width: 480px) {
    margin-bottom: 3px;
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

const PathInfo = styled.div`
  margin-top: 5px;
  font-size: 12px;
  color: #333;
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

const StartPointInfo = styled.div`
  margin-top: 3px;
  font-size: 11px;
  color: #666;
`;

const AnimationControls = styled.div`
  display: flex;
  justify-content: center;
  gap: 3px;
  margin-top: 5px;
`;

const HelpText = styled.div`
  margin-top: 5px;
  font-size: 11px;
  color: #666;
  font-style: italic;
  text-align: center;
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
      return '尚未选择起点';
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
      <ButtonGroup>
        <button 
          onClick={onOpenGridSizeControl}
          title="调整方阵的大小 (立方体个数)"
        >
          调整方阵大小 ({gridSize}×{gridSize}×{gridSize})
        </button>
      </ButtonGroup>
      
      <RadioGroup>
        <RadioLabel>
          <input 
            type="radio" 
            name="mode" 
            value="manual" 
            checked={manualMode} 
            onChange={() => onModeChange('manual')} 
          />
          手动模式
        </RadioLabel>
        <RadioLabel>
          <input 
            type="radio" 
            name="mode" 
            value="auto" 
            checked={!manualMode} 
            onChange={() => onModeChange('auto')} 
          />
          自动模式
        </RadioLabel>
      </RadioGroup>
      
      <ButtonGroup>
        <TransparentButton 
          onClick={handleStartSelection}
          disabled={drawingMode || (!manualMode && currentPath.length > 1)}
          className={selectingStart ? 'selecting' : ''}
          title={
            drawingMode ? "绘制模式下无法更改起点" :
            (!manualMode && currentPath.length > 1) ? "已生成路径，需先重新选择起点" :
            "选择起点位置"
          }
        >
          选择起点位置
        </TransparentButton>
        
        {manualMode ? (
          <>
            <button
              disabled={currentPath.length === 0 || drawingMode}
              onClick={handleStartDrawPath}
              title={
                currentPath.length === 0 ? "请先选择起点" :
                drawingMode ? "已在绘制模式中" :
                "开始绘制路线"
              }
            >
              {drawingMode ? "正在绘制路线" : "开始绘制路线"}
            </button>
            <button
              disabled={currentPath.length <= 1}
              onClick={onUndoLastStep}
              title="撤回上一步操作"
            >
              撤回上一步
            </button>
            <button 
              onClick={onResetPath}
              title="重置路径，可重新选择起点"
            >
              重新选择起点
            </button>
          </>
        ) : (
          <>
            <button
              disabled={currentPath.length === 0}
              onClick={() => onGeneratePath(true)}
              title="生成随机路径，不需要遍历所有格子"
            >
              随机路径
            </button>
            <button
              disabled={currentPath.length === 0}
              onClick={() => onGeneratePath(false)}
              title="生成完整路径，遍历所有的格子"
            >
              完整路径
            </button>
            <button 
              onClick={onResetPath}
              title="清空当前路径，重新选择起点"
            >
              重新选择起点
            </button>
          </>
        )}
      </ButtonGroup>
      
      <PathInfo>
        {getPathInfo()}
        {manualMode && (
          <div>
            当前位置: <PositionDisplay>{getCurrentPosition()}</PositionDisplay>
          </div>
        )}
        <StartPointInfo>{getStartPointInfo()}</StartPointInfo>
      </PathInfo>
      
      {manualMode && (
        <HelpText>
          {drawingMode 
            ? "提示: 绘制路线时无法更改起点，只能点击相邻的格子"
            : "提示: 选择起点后，需点击\"开始绘制路线\"按钮进入绘制模式"}
        </HelpText>
      )}
      
      {!manualMode && (
        <HelpText>
          {currentPath.length <= 1 
            ? "提示: 选择起点后，点击\"随机路径\"或\"完整路径\"按钮生成路线" 
            : "提示: 已生成路径，如需更换起点，请点击\"重新选择起点\"按钮或\"选择起点位置\"按钮"}
        </HelpText>
      )}
    </ControlContainer>
  );
};

export default ControlPanel; 
