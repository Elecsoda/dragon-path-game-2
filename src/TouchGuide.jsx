import React from 'react';
import styled from 'styled-components';

const GuideContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  border-radius: 0 0 5px 5px;
  font-size: 12px;
  z-index: 100;
  text-align: center;
  max-height: 80px;
  overflow: auto;
  
  @media (max-width: 480px) {
    padding: 3px;
    max-height: 60px;
    font-size: 11px;
  }
`;

const Title = styled.h4`
  margin: 0 0 4px;
  color: #fff;
  font-size: 13px;
  
  @media (max-width: 480px) {
    margin: 0 0 2px;
    font-size: 12px;
  }
`;

const List = styled.ul`
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  
  @media (max-width: 480px) {
    gap: 6px;
  }
`;

const ListItem = styled.li`
  margin: 0;
`;

const TouchGuide = () => {
  return (
    <GuideContainer>
      <Title>触摸操作指南</Title>
      <List>
        <ListItem>单指拖动: 旋转立方体</ListItem>
        <ListItem>双指拖动: 平移视图</ListItem>
        <ListItem>捏合/展开: 缩放视图</ListItem>
        <ListItem>点击立方体节点: 选择路径点</ListItem>
      </List>
    </GuideContainer>
  );
};

export default TouchGuide; 