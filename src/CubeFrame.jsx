import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const CubeFrame = ({ 
  position, 
  size = 0.8, 
  color = 0xcccccc, 
  isSelected = false,
  isStart = false,
  isEnd = false,
  isHovered = false,
  isTempSelected = false,
  isClickable = true,
  inSelectionMode = false,
  userData = {},
  setMeshRef = null
}) => {
  const meshRef = useRef();
  
  // 回调meshRef
  useEffect(() => {
    if (setMeshRef && meshRef.current) {
      setMeshRef(meshRef.current);
    }
  }, [setMeshRef]);
  
  // 确定颜色
  let cubeColor = color;
  if (isStart) {
    cubeColor = 0x4CAF50; // 更鲜明的绿色作为起点
  } else if (isEnd) {
    cubeColor = 0xFF5722; // 更鲜明的橙红色作为终点
  } else if (isSelected) {
    cubeColor = 0x2196F3; // 更鲜明的蓝色作为路径
  } else if (isTempSelected) {
    cubeColor = 0x9C27B0; // 更鲜明的紫色作为临时选择点
  } else if (isHovered) {
    cubeColor = 0xFFEB3B; // 更鲜明的黄色作为悬停效果
  }
  
  // 创建立方体几何体
  const edges = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
  }, [size]);
  
  // 确定线条颜色和透明度 - 加深手动模式下的颜色
  // 选择起点模式下，所有格子都用明显颜色
  const lineColor = inSelectionMode ? 0x4169E1 : // 选择模式下用皇家蓝
                   isTempSelected ? 0x9370DB : 
                   isClickable ? 0x000000 : 0x555555; // 加深非可点击的颜色
                   
  const lineOpacity = inSelectionMode ? 0.8 : // 选择模式下增加透明度
                     isTempSelected ? 0.8 : 
                     isClickable ? 0.7 : 0.3; // 加深手动模式下线条的透明度
                     
  const lineWidth = inSelectionMode ? 2 : 
                   isTempSelected ? 2 : 1;
  
  // 起点球体大小 - 增大起点的球体
  const sphereSize = isStart ? size * 0.2 : size * 0.15;
  
  // 添加起点光晕效果 - 增大起点的光晕
  const startGlowSize = size * 0.3;
  
  // 添加脉动动画的状态 - 让起点更显眼
  const startPulseSize = isStart ? size * 0.35 : size * 0.3;
  
  return (
    <group position={position}>
      {/* 立方体框架 - 显示起点、终点、路径上的点和临时选择点 */}
      {(isSelected || isStart || isEnd || isTempSelected) && (
        <mesh ref={meshRef} userData={userData}>
          <sphereGeometry args={[sphereSize, 16, 16]} />
          <meshBasicMaterial color={cubeColor} />
        </mesh>
      )}
      
      {/* 起点光晕效果 - 更明显 */}
      {isStart && (
        <>
          <mesh>
            <sphereGeometry args={[startGlowSize, 16, 16]} />
            <meshBasicMaterial color={cubeColor} transparent={true} opacity={0.3} />
          </mesh>
          <mesh>
            <sphereGeometry args={[startPulseSize, 16, 16]} />
            <meshBasicMaterial color={cubeColor} transparent={true} opacity={0.15} />
          </mesh>
        </>
      )}
      
      {/* 隐藏的点击区域 - 用于点击检测 */}
      {!isSelected && !isStart && !isEnd && !isTempSelected && (
        <mesh ref={meshRef} userData={userData} visible={false}>
          <sphereGeometry args={[size * 0.4, 16, 16]} />
          <meshBasicMaterial transparent={true} opacity={0} />
        </mesh>
      )}
      
      {/* 立方体边框 */}
      <lineSegments>
        <primitive object={edges} attach="geometry" />
        <lineBasicMaterial 
          color={isStart ? cubeColor : lineColor}
          opacity={isStart ? 0.9 : lineOpacity} 
          transparent={true}
          linewidth={isStart ? 2 : lineWidth}
        />
      </lineSegments>
      
      {/* 可点击提示 - 在悬停时显示 */}
      {isClickable && isHovered && !isSelected && !isStart && !isEnd && (
        <>
          <mesh>
            <sphereGeometry args={[size * 0.2, 16, 16]} />
            <meshBasicMaterial color={0xFFD700} /> {/* 金色，增大尺寸 */}
          </mesh>
          {/* 坐标文本显示 - 添加坐标指示器，显示在格子中心 */}
          <mesh position={[0, 0, size * 0.5]}>
            <boxGeometry args={[size * 0.5, size * 0.25, 0.01]} />
            <meshBasicMaterial color={0x000000} opacity={0.8} transparent={true} />
          </mesh>
        </>
      )}
      
      {/* 在选择起点模式下，为所有格子添加微弱的亮光效果 */}
      {inSelectionMode && !isHovered && !isSelected && !isStart && !isEnd && (
        <mesh>
          <sphereGeometry args={[size * 0.1, 16, 16]} />
          <meshBasicMaterial color={0x4169E1} opacity={0.3} transparent={true} />
        </mesh>
      )}
    </group>
  );
};

export default CubeFrame; 