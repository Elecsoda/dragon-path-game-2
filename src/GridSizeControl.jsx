import React, { useState } from 'react';
import styled from 'styled-components';

const ControlContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 300px;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #2196F3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.primary ? '#2196F3' : '#f5f5f5'};
  color: ${props => props.primary ? 'white' : '#333'};
  cursor: pointer;
  font-weight: bold;
  &:hover {
    background-color: ${props => props.primary ? '#0b7dda' : '#e0e0e0'};
  }
`;

const HelpText = styled.p`
  margin-top: 15px;
  font-size: 12px;
  color: #666;
  text-align: center;
`;

const ErrorText = styled.p`
  color: #f44336;
  font-size: 14px;
  margin-top: 5px;
  margin-bottom: 0;
`;

const GridSizeControl = ({ currentSize, onSizeChange, onClose }) => {
  // 由于我们的方阵是立方体，所以长宽高相等
  const [size, setSize] = useState(currentSize);
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证输入
    if (size < 2 || size > 8) {
      setError('方阵大小必须在2到8之间');
      return;
    }
    
    // 将新的大小传递给父组件
    onSizeChange(size);
    onClose();
  };
  
  const handleSizeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSize(value);
      // 清除之前的错误
      setError('');
    }
  };
  
  return (
    <ControlContainer>
      <Title>调整方阵大小</Title>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>方阵大小 (长=宽=高)</Label>
          <Input 
            type="number" 
            value={size} 
            onChange={handleSizeChange}
            min="2"
            max="8"
          />
          {error && <ErrorText>{error}</ErrorText>}
        </FormGroup>
        
        <ButtonGroup>
          <Button type="button" onClick={onClose}>取消</Button>
          <Button type="submit" primary>确定</Button>
        </ButtonGroup>
      </Form>
      
      <HelpText>
        注意：更改方阵大小将会重置当前的路径。
        <br />
        建议值：2~5为简单模式，6~8为挑战模式。
      </HelpText>
    </ControlContainer>
  );
};

export default GridSizeControl; 