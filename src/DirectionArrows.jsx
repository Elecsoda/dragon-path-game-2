import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 箭头颜色定义
const arrowColors = {
  'x+': 0xFF2222, // 更亮的红色
  'x-': 0xFF8888, // 浅红色
  'y+': 0x22FF22, // 更亮的绿色
  'y-': 0x88FF88, // 浅绿色
  'z+': 0x2222FF, // 更亮的蓝色
  'z-': 0x8888FF  // 浅蓝色
};

// 不可用箭头颜色
const disabledColor = 0xAAAAAA; // 灰色

// 箭头位置定义 - 进一步增加距离，避免与立方体重合
const arrowPositions = {
  'x+': new THREE.Vector3(4, 0, 0),   // 右侧
  'x-': new THREE.Vector3(-4, 0, 0),  // 左侧
  'y+': new THREE.Vector3(0, 4, 0),   // 上方
  'y-': new THREE.Vector3(0, -4, 0),  // 下方
  'z+': new THREE.Vector3(0, 0, 4),   // 前方
  'z-': new THREE.Vector3(0, 0, -4)   // 后方
};

// 箭头方向定义
const arrowDirections = {
  'x+': new THREE.Vector3(1, 0, 0),
  'x-': new THREE.Vector3(-1, 0, 0),
  'y+': new THREE.Vector3(0, 1, 0),
  'y-': new THREE.Vector3(0, -1, 0),
  'z+': new THREE.Vector3(0, 0, 1),
  'z-': new THREE.Vector3(0, 0, -1)
};

const Arrow = ({ direction, position, color, enabled, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const arrowRef = useRef();
  
  // 箭头参数 - 稍微增大箭头尺寸
  const arrowLength = 0.9;
  const arrowHeadLength = 0.3;
  const arrowHeadWidth = 0.2;
  
  // 处理悬停状态
  const handlePointerEnter = () => {
    if (enabled) {
      setHovered(true);
    }
  };
  
  const handlePointerLeave = () => {
    setHovered(false);
  };
  
  // 计算显示颜色和透明度
  const displayColor = enabled ? color : disabledColor;
  const baseOpacity = enabled ? 0.7 : 0.3;
  const opacity = hovered ? 0.9 : baseOpacity;
  const scale = hovered ? 1.2 : 1.0;
  
  // 应用悬停效果
  useFrame(() => {
    if (arrowRef.current) {
      arrowRef.current.scale.set(scale, scale, scale);
    }
    if (meshRef.current) {
      meshRef.current.material.opacity = opacity;
    }
  });
  
  return (
    <group 
      position={position}
      onClick={enabled ? () => onClick(direction) : null}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      ref={arrowRef}
      style={{ cursor: enabled ? 'pointer' : 'default' }}
    >
      <arrowHelper
        args={[
          arrowDirections[direction].normalize(),
          new THREE.Vector3(0, 0, 0),
          arrowLength,
          displayColor,
          arrowHeadLength,
          arrowHeadWidth
        ]}
      />
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial 
          color={displayColor} 
          transparent={true} 
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};

const DirectionArrows = ({ enabledDirections, onDirectionClick }) => {
  const directions = ['x+', 'x-', 'y+', 'y-', 'z+', 'z-'];
  
  return (
    <group>
      {directions.map(direction => (
        <Arrow
          key={direction}
          direction={direction}
          position={arrowPositions[direction]}
          color={arrowColors[direction]}
          enabled={enabledDirections.includes(direction)}
          onClick={onDirectionClick}
        />
      ))}
    </group>
  );
};

export default DirectionArrows; 