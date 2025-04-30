import React, { useState } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.6);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 300px;
  backdrop-filter: blur(3px);
  max-height: 80vh;
  overflow-y: auto;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-weight: bold;
`;

const LayerButtons = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const LayerButton = styled.button`
  padding: 8px 15px;
  background-color: ${props => props.active ? 'rgba(74, 144, 226, 0.9)' : 'rgba(225, 225, 225, 0.7)'};
  color: ${props => props.active ? 'white' : 'black'};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(74, 144, 226, 0.9)' : 'rgba(209, 209, 209, 0.7)'};
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: ${props => `repeat(${props.gridSize}, 1fr)`};
  grid-template-rows: ${props => `repeat(${props.gridSize}, 1fr)`};
  grid-gap: 10px;
  margin-bottom: 15px;
`;

const GridCell = styled.button`
  width: ${props => props.gridSize > 5 ? '40px' : '60px'};
  height: ${props => props.gridSize > 5 ? '40px' : '60px'};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(240, 240, 240, 0.7);
  border: 1px solid rgba(204, 204, 204, 0.7);
  border-radius: 5px;
  cursor: pointer;
  font-size: ${props => props.gridSize > 5 ? '11px' : '14px'};
  font-weight: bold;
  color: #555;
  
  &:hover {
    background-color: rgba(224, 224, 224, 0.9);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
`;

const CancelButton = styled.button`
  padding: 8px 15px;
  background-color: rgba(240, 240, 240, 0.7);
  border: 1px solid rgba(204, 204, 204, 0.7);
  border-radius: 5px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(224, 224, 224, 0.9);
  }
`;

const LayerSelector = ({ onSelect, onCancel, onTempSelect, gridSize = 3 }) => {
  const [selectedLayer, setSelectedLayer] = useState(1);
  
  const handleLayerSelect = (layer) => {
    setSelectedLayer(layer);
  };
  
  const handleCellSelect = (x, z) => {
    // 选择了具体的格子，y 为层级，x 和 z 为格子坐标
    const point = {
      index: { x, y: selectedLayer - 1, z },
      position: calculatePosition(x, selectedLayer - 1, z, gridSize)
    };
    
    onSelect(point);
  };
  
  const handleCellHover = (x, z) => {
    if (onTempSelect) {
      const point = {
        index: { x, y: selectedLayer - 1, z },
        position: calculatePosition(x, selectedLayer - 1, z, gridSize)
      };
      onTempSelect(point);
    }
  };
  
  const handleCellLeave = () => {
    if (onTempSelect) {
      onTempSelect(null);
    }
  };
  
  // 计算点的三维位置
  const calculatePosition = (x, y, z, gridSize) => {
    const GRID_SPACING = 2.0;
    const offset = ((gridSize - 1) / 2) * GRID_SPACING;
    
    return {
      x: x * GRID_SPACING - offset,
      y: y * GRID_SPACING - offset,
      z: z * GRID_SPACING - offset
    };
  };
  
  // 生成层级按钮
  const renderLayerButtons = () => {
    const buttons = [];
    for (let i = 1; i <= gridSize; i++) {
      buttons.push(
        <LayerButton
          key={i}
          active={selectedLayer === i}
          onClick={() => handleLayerSelect(i)}
        >
          层 {i}
        </LayerButton>
      );
    }
    return buttons;
  };
  
  // 生成网格按钮
  const renderGrid = () => {
    const grid = [];
    
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        grid.push(
          <GridCell 
            key={`${x}-${z}`}
            onClick={() => handleCellSelect(x, z)}
            onMouseEnter={() => handleCellHover(x, z)}
            onMouseLeave={handleCellLeave}
            gridSize={gridSize}
          >
            ({x},{z})
          </GridCell>
        );
      }
    }
    
    return grid;
  };

  return (
    <SelectorContainer>
      <Title>选择起点位置</Title>
      
      <LayerButtons>
        {renderLayerButtons()}
      </LayerButtons>
      
      <GridContainer gridSize={gridSize}>
        {renderGrid()}
      </GridContainer>
      
      <ButtonRow>
        <CancelButton onClick={onCancel}>取消</CancelButton>
      </ButtonRow>
    </SelectorContainer>
  );
};

export default LayerSelector; 