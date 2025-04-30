import React from 'react';
import styled from 'styled-components';

const GuideContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 100;
  text-align: center;
`;

const Title = styled.h4`
  margin: 0 0 8px;
  color: #fff;
  font-size: 16px;
`;

const List = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const ListItem = styled.li`
  margin-bottom: 5px;
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