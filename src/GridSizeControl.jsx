import React, { useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.22);
  min-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 17px;
  color: #333;
`;

const DimensionsRow = styled.div`
  display: flex;
  gap: 18px;
  justify-content: center;
`;

const DimCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const DimLabel = styled.div`
  font-size: 13px;
  color: #666;
  font-weight: 600;
`;

const StepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StepBtn = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid #bbb;
  background: #f5f5f5;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  color: #333;
  &:active:not(:disabled) { background: #e0e0e0; }
  &:disabled { color: #ccc; border-color: #e8e8e8; }
`;

const ValueDisplay = styled.div`
  width: 36px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #222;
`;

const ErrorText = styled.p`
  color: #f44336;
  font-size: 13px;
  margin: 0;
  text-align: center;
`;

const HelpText = styled.p`
  font-size: 12px;
  color: #888;
  margin: 0;
  text-align: center;
  line-height: 1.5;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const ActionBtn = styled.button`
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  background: ${p => p.primary ? '#2196F3' : '#f0f0f0'};
  color: ${p => p.primary ? '#fff' : '#333'};
  &:active { filter: brightness(0.92); }
`;

const MIN = 2;
const MAX = 8;

const Stepper = ({ label, value, onChange }) => (
  <DimCol>
    <DimLabel>{label}</DimLabel>
    <StepperRow>
      <StepBtn onClick={() => onChange(value - 1)} disabled={value <= MIN}>－</StepBtn>
      <ValueDisplay>{value}</ValueDisplay>
      <StepBtn onClick={() => onChange(value + 1)} disabled={value >= MAX}>＋</StepBtn>
    </StepperRow>
  </DimCol>
);

const GridSizeControl = ({ currentSize, onSizeChange, onClose }) => {
  const initial = typeof currentSize === 'object'
    ? currentSize
    : { width: currentSize, height: currentSize, depth: currentSize };

  const [size, setSize] = useState(initial);

  const set = (dim) => (val) => {
    const v = Math.max(MIN, Math.min(MAX, val));
    setSize(prev => ({ ...prev, [dim]: v }));
  };

  const handleConfirm = () => {
    onSizeChange(size);
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={e => e.stopPropagation()}>
        <Title>调整方阵大小</Title>

        <DimensionsRow>
          <Stepper label="长 X" value={size.width}  onChange={set('width')} />
          <Stepper label="宽 Z" value={size.depth}  onChange={set('depth')} />
          <Stepper label="高 Y" value={size.height} onChange={set('height')} />
        </DimensionsRow>

        <HelpText>
          范围 2–8｜更改将重置当前路径
        </HelpText>

        <BtnRow>
          <ActionBtn onClick={onClose}>取消</ActionBtn>
          <ActionBtn primary onClick={handleConfirm}>确定</ActionBtn>
        </BtnRow>
      </Panel>
    </Overlay>
  );
};

export default GridSizeControl;
