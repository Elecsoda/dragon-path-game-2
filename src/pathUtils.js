import * as THREE from 'three';

// 检查两点是否相邻（上下左右前后）
const areAdjacent = (point1, point2) => {
  const { x: x1, y: y1, z: z1 } = point1.index;
  const { x: x2, y: y2, z: z2 } = point2.index;
  
  // 检查是否只有一个维度相差1，其他维度相同
  const xDiff = Math.abs(x1 - x2);
  const yDiff = Math.abs(y1 - y2);
  const zDiff = Math.abs(z1 - z2);
  
  return (
    (xDiff === 1 && yDiff === 0 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 1 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 0 && zDiff === 1)
  );
};

// 获取点的所有相邻点
const getAdjacentPoints = (point, gridPoints) => {
  return gridPoints.filter(p => areAdjacent(point, p));
};

// 随机洗牌数组
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 预设方向顺序 - 针对不同类型起点优化
const getDirectionOrders = (startPoint, gridSize) => {
  // 检测起点类型
  const { x, y, z } = startPoint.index;
  const mid = Math.floor(gridSize / 2);
  
  // 判断起点是顶点、棱心、面心还是体心
  const isCorner = (x === 0 || x === gridSize - 1) && 
                   (y === 0 || y === gridSize - 1) && 
                   (z === 0 || z === gridSize - 1);
  
  const isEdgeCenter = ((x === 0 || x === gridSize - 1) && 
                        (y === 0 || y === gridSize - 1) && 
                        (z > 0 && z < gridSize - 1)) || 
                       ((x === 0 || x === gridSize - 1) && 
                        (y > 0 && y < gridSize - 1) && 
                        (z === 0 || z === gridSize - 1)) || 
                       ((x > 0 && x < gridSize - 1) && 
                        (y === 0 || y === gridSize - 1) && 
                        (z === 0 || z === gridSize - 1));
  
  const isFaceCenter = ((x === 0 || x === gridSize - 1) && 
                        (y > 0 && y < gridSize - 1) && 
                        (z > 0 && z < gridSize - 1)) || 
                       ((x > 0 && x < gridSize - 1) && 
                        (y === 0 || y === gridSize - 1) && 
                        (z > 0 && z < gridSize - 1)) || 
                       ((x > 0 && x < gridSize - 1) && 
                        (y > 0 && y < gridSize - 1) && 
                        (z === 0 || z === gridSize - 1));
  
  const isBodyCenter = (x > 0 && x < gridSize - 1) && 
                       (y > 0 && y < gridSize - 1) && 
                       (z > 0 && z < gridSize - 1);
  
  // 根据起点类型返回合适的方向顺序
  if (isCorner) {
    // 顶点优先移动到内部
    return [
      [0, 1, 2, 3, 4, 5], // 默认顺序
      [1, 0, 3, 2, 5, 4], // 内向顺序
      [2, 3, 0, 1, 4, 5]  // 交替顺序
    ];
  } else if (isEdgeCenter) {
    // 棱心优先沿着所在棱移动
    return [
      [0, 1, 2, 3, 4, 5], // 默认顺序
      [4, 5, 0, 1, 2, 3], // 前后优先
      [2, 3, 4, 5, 0, 1]  // 上下前后优先
    ];
  } else if (isFaceCenter) {
    // 面心优先沿着所在面移动
    return [
      [0, 1, 2, 3, 4, 5], // 默认顺序
      [2, 3, 0, 1, 4, 5], // 上下优先
      [0, 1, 4, 5, 2, 3]  // 左右前后优先
    ];
  } else if (isBodyCenter) {
    // 体心可以任意移动
    return [
      [0, 1, 2, 3, 4, 5], // 默认顺序
      [4, 5, 2, 3, 0, 1], // 前后上下优先
      [3, 2, 0, 1, 5, 4]  // 交替顺序
    ];
  }
  
  // 默认顺序
  return [
    [0, 1, 2, 3, 4, 5], // 默认顺序: 右,左,上,下,前,后
    [2, 3, 0, 1, 4, 5], // 上下优先
    [4, 5, 0, 1, 2, 3]  // 前后优先
  ];
};

/**
 * 改进版的哈密顿路径生成算法 - 优先生成遍历所有点的完整路径
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @param {number} gridSize - 网格大小
 * @returns {Array} - 生成的路径
 */
export const generateCompleteHamiltonianPath = (gridPoints, startPoint, gridSize = 3) => {
  if (!startPoint) return [];
  
  console.log("尝试生成完整路径，总点数:", gridPoints.length);
  
  // 查找起点索引
  const startPointIndex = gridPoints.findIndex(point => 
    point.index.x === startPoint.index.x && 
    point.index.y === startPoint.index.y && 
    point.index.z === startPoint.index.z
  );
  
  if (startPointIndex === -1) {
    console.error('未找到起点，无法生成路径');
    return [startPoint]; // 返回只包含起点的路径
  }
  
  // 对于大于4的网格，直接使用优化版算法，因为回溯算法可能会超时
  if (gridSize > 4) {
    console.log('网格大小大于4，使用优化版算法');
    return generateOptimizedHamiltonianPath(gridPoints, startPoint, gridSize);
  }
  
  // 使用相邻点缓存来提高性能
  const adjacencyCache = new Map();
  
  // 预计算所有点的相邻点关系并缓存
  const getAdjacentPointsCached = (point) => {
    const key = `${point.index.x}-${point.index.y}-${point.index.z}`;
    if (!adjacencyCache.has(key)) {
      adjacencyCache.set(key, getAdjacentPoints(point, gridPoints));
    }
    return adjacencyCache.get(key);
  };
  
  // 预计算所有点的相邻点
  gridPoints.forEach(point => {
    getAdjacentPointsCached(point);
  });
  
  // 尝试使用回溯算法生成完整的哈密顿路径
  const totalPoints = gridPoints.length;
  const visited = new Array(totalPoints).fill(false);
  const path = [];
  
  // 将起点添加到路径中并标记为已访问
  path.push(gridPoints[startPointIndex]);
  visited[startPointIndex] = true;
  
  // 设置超时限制
  const timeoutMs = 5000; // 5秒超时
  const startTime = Date.now();
  
  // 回溯搜索函数
  const backtrack = () => {
    // 检查是否超时
    if (Date.now() - startTime > timeoutMs) {
      console.log('回溯搜索超时，返回当前最佳路径');
      return false;
    }
    
    // 如果已经访问了所有点，返回成功
    if (path.length === totalPoints) {
      return true;
    }
    
    // 获取当前路径的最后一个点
    const currentPoint = path[path.length - 1];
    // 获取相邻点
    const adjacentPoints = getAdjacentPointsCached(currentPoint);
    
    // 尝试不同的方向顺序
    for (let orderIndex = 0; orderIndex < 3; orderIndex++) {
      // 获取当前点的最佳方向顺序
      const directionOrder = getDirectionOrders(currentPoint, gridSize)[orderIndex];
      const sortedAdjacentPoints = [];
      
      // 从相邻点中筛选未访问的点，并按方向顺序排序
      for (let dir = 0; dir < 6; dir++) {
        const dirIndex = directionOrder[dir];
        const direction = ['x+', 'x-', 'y+', 'y-', 'z+', 'z-'][dirIndex];
        
        // 获取当前方向的相邻点
        const { x, y, z } = currentPoint.index;
        let nextPoint = null;
        
        switch (direction) {
          case 'x+': 
            if (x < gridSize - 1) nextPoint = findPointByIndex(gridPoints, x + 1, y, z); 
            break;
          case 'x-': 
            if (x > 0) nextPoint = findPointByIndex(gridPoints, x - 1, y, z); 
            break;
          case 'y+': 
            if (y < gridSize - 1) nextPoint = findPointByIndex(gridPoints, x, y + 1, z); 
            break;
          case 'y-': 
            if (y > 0) nextPoint = findPointByIndex(gridPoints, x, y - 1, z); 
            break;
          case 'z+': 
            if (z < gridSize - 1) nextPoint = findPointByIndex(gridPoints, x, y, z + 1); 
            break;
          case 'z-': 
            if (z > 0) nextPoint = findPointByIndex(gridPoints, x, y, z - 1); 
            break;
        }
        
        if (nextPoint) {
          const nextPointIndex = gridPoints.findIndex(p => 
            p.index.x === nextPoint.index.x && 
            p.index.y === nextPoint.index.y && 
            p.index.z === nextPoint.index.z
          );
          
          if (nextPointIndex !== -1 && !visited[nextPointIndex]) {
            sortedAdjacentPoints.push({ point: nextPoint, index: nextPointIndex });
          }
        }
      }
      
      // 尝试每个未访问的相邻点
      for (const { point, index } of sortedAdjacentPoints) {
        // 标记为已访问并添加到路径
        visited[index] = true;
        path.push(point);
        
        // 递归继续找路径
        if (backtrack()) {
          return true;
        }
        
        // 回溯：从路径中移除并标记为未访问
        path.pop();
        visited[index] = false;
      }
      
      // 如果当前方向顺序找不到解，尝试下一个方向顺序
    }
    
    // 所有方向顺序都尝试失败
    return false;
  };
  
  // 尝试生成完整路径
  console.time('生成完整路径');
  const success = backtrack();
  console.timeEnd('生成完整路径');
  
  if (success) {
    console.log('成功生成完整路径，共', path.length, '个点');
    return path;
  } else {
    console.log('无法生成完整路径，尝试生成次优路径');
    // 如果无法生成完整路径，尝试使用优化版算法生成次优路径
    if (path.length > totalPoints / 2) {
      console.log('当前路径已经包含了一半以上的点，尝试补全路径');
      // 尝试补全已有路径
      return completePartialPath(path, gridPoints, gridSize);
    } else {
      return generateOptimizedHamiltonianPath(gridPoints, startPoint, gridSize);
    }
  }
};

/**
 * 尝试补全部分路径，添加剩余的点
 * @param {Array} partialPath - 已有部分路径
 * @param {Array} gridPoints - 所有网格点
 * @param {number} gridSize - 网格大小
 * @returns {Array} - 补全后的路径
 */
const completePartialPath = (partialPath, gridPoints, gridSize) => {
  if (!partialPath || partialPath.length === 0) return [];
  
  // 复制一份路径，避免修改原始路径
  const completedPath = [...partialPath];
  
  // 创建已访问点集合
  const visitedSet = new Set();
  partialPath.forEach(point => {
    visitedSet.add(`${point.index.x}-${point.index.y}-${point.index.z}`);
  });
  
  // 获取未访问的点
  const unvisitedPoints = gridPoints.filter(point => {
    const key = `${point.index.x}-${point.index.y}-${point.index.z}`;
    return !visitedSet.has(key);
  });
  
  // 尝试将未访问的点添加到路径中
  let currentPoint = completedPath[completedPath.length - 1];
  let madeProgress = true;
  
  while (unvisitedPoints.length > 0 && madeProgress) {
    madeProgress = false;
    
    // 查找一个最近的可以添加的点
    let bestNextPoint = null;
    let bestNextPointIndex = -1;
    let bestDistance = Infinity;
    
    for (let i = 0; i < unvisitedPoints.length; i++) {
      const point = unvisitedPoints[i];
      
      if (areAdjacent(currentPoint, point)) {
        // 找到相邻点，直接添加
        completedPath.push(point);
        visitedSet.add(`${point.index.x}-${point.index.y}-${point.index.z}`);
        unvisitedPoints.splice(i, 1);
        currentPoint = point;
        madeProgress = true;
        break;
      }
      
      // 计算到当前点的距离
      const distance = Math.sqrt(
        Math.pow(point.index.x - currentPoint.index.x, 2) +
        Math.pow(point.index.y - currentPoint.index.y, 2) +
        Math.pow(point.index.z - currentPoint.index.z, 2)
      );
      
      if (distance < bestDistance) {
        bestDistance = distance;
        bestNextPoint = point;
        bestNextPointIndex = i;
      }
    }
    
    // 如果没有找到相邻点，但有最近点，尝试寻找一条路径
    if (!madeProgress && bestNextPoint) {
      const path = findShortestPath(gridPoints, currentPoint, bestNextPoint, visitedSet);
      
      if (path && path.length > 1) {
        // 添加路径中除起点外的所有点
        for (let i = 1; i < path.length; i++) {
          const point = path[i];
          completedPath.push(point);
          visitedSet.add(`${point.index.x}-${point.index.y}-${point.index.z}`);
          
          // 如果添加了目标点，从未访问列表中移除
          if (i === path.length - 1) {
            unvisitedPoints.splice(bestNextPointIndex, 1);
          }
        }
        
        currentPoint = path[path.length - 1];
        madeProgress = true;
      }
    }
  }
  
  console.log(`补全路径结果: ${completedPath.length}/${gridPoints.length} 个点`);
  return completedPath;
};

/**
 * 使用广度优先搜索找到两点间的最短路径
 * @param {Array} gridPoints - 所有网格点
 * @param {Object} start - 起点
 * @param {Object} end - 终点
 * @param {Set} visitedSet - 已访问的点集合
 * @returns {Array} - 路径数组，如果没有路径返回null
 */
const findShortestPath = (gridPoints, start, end, visitedSet) => {
  const queue = [];
  const visited = new Set();
  const prev = new Map();
  
  // 将起点加入队列
  queue.push(start);
  visited.add(`${start.index.x}-${start.index.y}-${start.index.z}`);
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    // 如果到达终点，构建路径
    if (current.index.x === end.index.x && 
        current.index.y === end.index.y && 
        current.index.z === end.index.z) {
      // 构建路径
      const path = [current];
      let prevPoint = prev.get(`${current.index.x}-${current.index.y}-${current.index.z}`);
      
      while (prevPoint) {
        path.unshift(prevPoint);
        prevPoint = prev.get(`${prevPoint.index.x}-${prevPoint.index.y}-${prevPoint.index.z}`);
      }
      
      return path;
    }
    
    // 获取相邻点
    const neighbors = getAdjacentPoints(current, gridPoints);
    
    for (const neighbor of neighbors) {
      const key = `${neighbor.index.x}-${neighbor.index.y}-${neighbor.index.z}`;
      
      // 如果是终点或者未被访问过的点，则加入队列
      if (!visited.has(key) && (
          (neighbor.index.x === end.index.x && 
           neighbor.index.y === end.index.y && 
           neighbor.index.z === end.index.z) || 
          !visitedSet.has(key)
      )) {
        visited.add(key);
        prev.set(key, current);
        queue.push(neighbor);
      }
    }
  }
  
  // 没有找到路径
  return null;
};

// 辅助函数：通过索引查找点
const findPointByIndex = (gridPoints, x, y, z) => {
  return gridPoints.find(p => 
    p.index.x === x && p.index.y === y && p.index.z === z
  );
};

/**
 * 简化版的哈密顿路径生成算法 - 如果无法找到完整路径，则返回部分路径
 * 作为备选算法使用
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @param {number} gridSize - 网格大小
 * @returns {Array} - 生成的路径
 */
export const generateOptimizedHamiltonianPath = (gridPoints, startPoint, gridSize = 3) => {
  if (!startPoint) return [];
  
  // 查找起点索引
  const startPointIndex = gridPoints.findIndex(point => 
    point.index.x === startPoint.index.x && 
    point.index.y === startPoint.index.y && 
    point.index.z === startPoint.index.z
  );
  
  if (startPointIndex === -1) return [];
  
  // 直接尝试生成超长随机路径，然后去除重复点
  let allPoints = [];
  const totalPoints = gridSize * gridSize * gridSize;
  const attempts = Math.max(10, totalPoints * 3); // 尝试次数为总点数的3倍，至少10次
  
  // 使用相邻点缓存来提高性能
  const adjacencyCache = new Map();
  
  // 预计算所有点的相邻点关系并缓存
  const getAdjacentPointsCached = (point) => {
    const key = `${point.index.x}-${point.index.y}-${point.index.z}`;
    if (!adjacencyCache.has(key)) {
      adjacencyCache.set(key, getAdjacentPoints(point, gridPoints));
    }
    return adjacencyCache.get(key);
  };
  
  // 预计算所有点的相邻点
  gridPoints.forEach(point => {
    getAdjacentPointsCached(point);
  });
  
  // 当前点
  let currentPoint = gridPoints[startPointIndex];
  allPoints.push(currentPoint);
  
  // 已访问点集合
  const visited = new Set();
  visited.add(startPointIndex);
  
  // 在整个网格中随机游走，尝试访问尽可能多的点
  for (let i = 0; i < attempts; i++) {
    // 获取当前点的所有相邻点
    const adjacentPoints = getAdjacentPointsCached(currentPoint);
    
    if (!adjacentPoints || adjacentPoints.length === 0) break;
    
    // 随机选择一个相邻点
    const randomAdjacentPoint = adjacentPoints[Math.floor(Math.random() * adjacentPoints.length)];
    
    if (!randomAdjacentPoint) continue;
    
    // 添加到路径
    currentPoint = randomAdjacentPoint;
    allPoints.push(currentPoint);
    
    // 标记为已访问（不强制唯一性）
    const pointIndex = gridPoints.findIndex(p => 
      p.index.x === randomAdjacentPoint.index.x && 
      p.index.y === randomAdjacentPoint.index.y && 
      p.index.z === randomAdjacentPoint.index.z
    );
    
    if (pointIndex >= 0) {
      visited.add(pointIndex);
    }
  }
  
  // 现在我们有一个很长的可能有重复点的路径
  // 1. 先保留起点
  const result = [gridPoints[startPointIndex]];
  // 2. 用集合跟踪已添加的点
  const addedPoints = new Set();
  addedPoints.add(`${startPoint.index.x}-${startPoint.index.y}-${startPoint.index.z}`);
  
  // 3. 遍历长路径，去除重复点，确保每个点只出现一次
  for (let i = 1; i < allPoints.length; i++) {
    const point = allPoints[i];
    const pointKey = `${point.index.x}-${point.index.y}-${point.index.z}`;
    
    // 如果这个点还没添加过，且和前一个点相邻，就添加它
    if (!addedPoints.has(pointKey) && areAdjacent(result[result.length - 1], point)) {
      result.push(point);
      addedPoints.add(pointKey);
      
      // 如果已经找到所有点，提前结束
      if (result.length === gridPoints.length) {
        break;
      }
    }
  }
  
  // 补充缺失的点 - 如果还有未访问的点，尝试找到一条可行的路径添加它们
  if (result.length < gridPoints.length) {
    // 获取所有未访问的点
    const remainingPoints = gridPoints.filter(point => {
      const pointKey = `${point.index.x}-${point.index.y}-${point.index.z}`;
      return !addedPoints.has(pointKey);
    });
    
    // 尝试将剩余点添加到路径中
    let lastAddedPoint = result[result.length - 1];
    let madeProgress = true;
    
    while (remainingPoints.length > 0 && madeProgress) {
      madeProgress = false;
      
      // 尝试查找一个和当前路径末尾相邻的未访问点
      for (let i = 0; i < remainingPoints.length; i++) {
        if (areAdjacent(lastAddedPoint, remainingPoints[i])) {
          // 找到了一个相邻的未访问点，添加到路径
          result.push(remainingPoints[i]);
          lastAddedPoint = remainingPoints[i];
          remainingPoints.splice(i, 1);
          madeProgress = true;
          break;
        }
      }
    }
  }
  
  // 如果仍未生成完整路径，打印警告
  if (result.length < gridPoints.length) {
    console.log(`无法生成完整路径，返回部分路径 (${result.length}/${gridPoints.length})`);
  } else {
    console.log(`成功生成完整路径，共 ${result.length} 个点`);
  }
  
  return result;
};

/**
 * 生成随机路径，只允许相邻移动（上下左右前后）
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @returns {Array} - 随机路径
 */
export const generateRandomPath = (gridPoints, startPoint) => {
  if (!startPoint) return [];
  
  // 查找起点索引
  const startPointIndex = gridPoints.findIndex(point => 
    point.index.x === startPoint.index.x && 
    point.index.y === startPoint.index.y && 
    point.index.z === startPoint.index.z
  );
  
  if (startPointIndex === -1) return [];
  
  // 初始化路径和已访问点
  const path = [gridPoints[startPointIndex]];
  const visited = new Set([startPointIndex]);
  
  let currentPoint = gridPoints[startPointIndex];
  let noMoreMoves = false;
  
  // 随机生成路径直到无法继续移动
  while (!noMoreMoves) {
    // 获取当前点的所有相邻点
    const adjacentPoints = getAdjacentPoints(currentPoint, gridPoints);
    
    // 过滤出未访问的相邻点
    const unvisitedAdjacentPoints = adjacentPoints.filter(p => {
      const index = gridPoints.findIndex(gp => 
        gp.index.x === p.index.x && 
        gp.index.y === p.index.y && 
        gp.index.z === p.index.z
      );
      return !visited.has(index);
    });
    
    if (unvisitedAdjacentPoints.length === 0) {
      // 如果没有未访问的相邻点，结束路径生成
      noMoreMoves = true;
    } else {
      // 随机选择一个未访问的相邻点
      const randomIndex = Math.floor(Math.random() * unvisitedAdjacentPoints.length);
      const nextPoint = unvisitedAdjacentPoints[randomIndex];
      
      // 添加到路径
      path.push(nextPoint);
      
      // 标记为已访问
      const pointIndex = gridPoints.findIndex(p => 
        p.index.x === nextPoint.index.x && 
        p.index.y === nextPoint.index.y && 
        p.index.z === nextPoint.index.z
      );
      visited.add(pointIndex);
      
      // 更新当前点
      currentPoint = nextPoint;
    }
  }
  
  return path;
};

/**
 * 生成确定性的完整路径 - 蛇形遍历算法 (Snake-like pattern)
 * 该算法按照固定的模式遍历所有点，确保每次生成的路径都是相同的
 * 严格遵循哈密顿路径规则：只能上下左右前后移动到相邻格子，不能有岔路，不能走已有路线
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @param {number} gridSize - 网格大小
 * @returns {Array} - 生成的路径
 */
export const generateFixedHamiltonianPath = (gridPoints, startPoint, gridSize = 3) => {
  if (!startPoint) return [];
  
  console.log("生成确定性的完整路径，总点数:", gridPoints.length);
  
  // 创建一个3D索引数组表示立方体网格
  const grid = Array(gridSize).fill().map(() => 
    Array(gridSize).fill().map(() => 
      Array(gridSize).fill(null)
    )
  );
  
  // 将所有点填充到网格中
  gridPoints.forEach(point => {
    const { x, y, z } = point.index;
    grid[x][y][z] = point;
  });
  
  // 初始化路径，先添加起点
  const path = [startPoint];
  
  // 创建一个标记已访问点的3D数组
  const visited = Array(gridSize).fill().map(() => 
    Array(gridSize).fill().map(() => 
      Array(gridSize).fill(false)
    )
  );
  
  // 标记起点为已访问
  visited[startPoint.index.x][startPoint.index.y][startPoint.index.z] = true;
  
  // 当前位置是起点
  let current = { ...startPoint.index };
  
  // 寻找下一个点的方向：上、下、左、右、前、后
  const directions = [
    { dx: 0, dy: 1, dz: 0 }, // 上
    { dx: 0, dy: -1, dz: 0 }, // 下
    { dx: -1, dy: 0, dz: 0 }, // 左
    { dx: 1, dy: 0, dz: 0 }, // 右
    { dx: 0, dy: 0, dz: 1 }, // 前
    { dx: 0, dy: 0, dz: -1 }  // 后
  ];
  
  // 使用固定模式生成路径（逐层蛇形）
  
  // 对于2x2x2及以下的小网格，使用简单的DFS算法
  if (gridSize <= 2) {
    const remainingPoints = gridSize * gridSize * gridSize - 1; // 减去起点
    hamiltonianDFS(current, remainingPoints);
  } else {
    // 对于大型网格，使用预设的蛇形模式
    generateSnakePath();
  }
  
  // 检查是否有未访问的点
  let allVisited = true;
  let unvisitedCount = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        if (!visited[x][y][z]) {
          allVisited = false;
          unvisitedCount++;
          console.warn(`点 (${x},${y},${z}) 未被访问!`);
        }
      }
    }
  }
  
  if (allVisited) {
    console.log(`成功生成完整路径，共 ${path.length} 个点`);
  } else {
    console.warn(`未能访问所有点，有 ${unvisitedCount} 个点未访问，当前路径长度: ${path.length}/${gridSize * gridSize * gridSize}`);
    
    // 如果未能访问所有点，回退到传统的哈密顿路径生成算法
    if (unvisitedCount > 0 && gridSize <= 4) {
      console.log("尝试使用传统回溯算法生成完整路径");
      return generateCompleteHamiltonianPath(gridPoints, startPoint, gridSize);
    }
  }
  
  // 验证路径的连续性
  for (let i = 1; i < path.length; i++) {
    const prev = path[i-1].index;
    const curr = path[i].index;
    
    // 计算两点之间的曼哈顿距离
    const dist = Math.abs(prev.x - curr.x) + Math.abs(prev.y - curr.y) + Math.abs(prev.z - curr.z);
    
    if (dist !== 1) {
      console.error(`路径在位置 ${i} 处不连续! 点 (${prev.x},${prev.y},${prev.z}) 和点 (${curr.x},${curr.y},${curr.z}) 之间的曼哈顿距离为 ${dist}`);
    }
  }
  
  return path;
  
  // 使用DFS寻找哈密顿路径（适用于小网格）
  function hamiltonianDFS(pos, remaining) {
    // 如果所有点都已访问，返回成功
    if (remaining === 0) {
      return true;
    }
    
    // 随机排序方向，以增加成功率和随机性
    const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
    
    // 尝试每个方向
    for (const dir of shuffledDirections) {
      const nextX = pos.x + dir.dx;
      const nextY = pos.y + dir.dy;
      const nextZ = pos.z + dir.dz;
      
      // 检查是否在网格内且未访问
      if (nextX >= 0 && nextX < gridSize && 
          nextY >= 0 && nextY < gridSize && 
          nextZ >= 0 && nextZ < gridSize &&
          !visited[nextX][nextY][nextZ]) {
        
        // 访问下一个点
        const nextPoint = grid[nextX][nextY][nextZ];
        visited[nextX][nextY][nextZ] = true;
        path.push(nextPoint);
        
        // 继续DFS
        if (hamiltonianDFS({ x: nextX, y: nextY, z: nextZ }, remaining - 1)) {
          return true;
        }
        
        // 回溯
        path.pop();
        visited[nextX][nextY][nextZ] = false;
      }
    }
    
    return false;
  }
  
  // 使用预设蛇形模式生成路径（适用于大型网格）
  function generateSnakePath() {
    // 先处理Z=0层的所有XY平面
    processXYPlane(0);
    
    // 然后处理其余Z层
    for (let z = 1; z < gridSize; z++) {
      // 找到一个从前一层到当前层的连接点
      connectToNextLayer(z);
      
      // 处理当前Z层
      processXYPlane(z);
    }
  }
  
  // 处理单个XY平面
  function processXYPlane(z) {
    // 获取当前点在这个平面上的位置
    let x = current.x;
    let y = current.y;
    
    // 确保当前点已访问
    visited[x][y][z] = true;
    
    // 对每一行进行蛇形遍历
    for (let currY = 0; currY < gridSize; currY++) {
      // 跳过当前所在行
      if (currY === y) {
        // 处理当前行的剩余部分
        processCurrentRow(x, y, z);
        continue;
      }
      
      // 移动到新行，找到一个与当前点相邻的未访问点
      const connected = moveToRow(currY, z);
      if (connected) {
        // 更新当前位置
        x = current.x;
        y = current.y;
        
        // 处理新行
        if (y % 2 === 0) {
          // 偶数行从左到右
          processRowLeftToRight(y, z);
        } else {
          // 奇数行从右到左
          processRowRightToLeft(y, z);
        }
      }
    }
  }
  
  // 处理当前行的剩余部分
  function processCurrentRow(startX, y, z) {
    if (y % 2 === 0) {
      // 偶数行从左到右
      for (let x = startX + 1; x < gridSize; x++) {
        if (!visited[x][y][z]) {
          if (tryMove(x, y, z)) {
            // 成功移动
          }
        }
      }
    } else {
      // 奇数行从右到左
      for (let x = startX - 1; x >= 0; x--) {
        if (!visited[x][y][z]) {
          if (tryMove(x, y, z)) {
            // 成功移动
          }
        }
      }
    }
  }
  
  // 偶数行从左到右处理
  function processRowLeftToRight(y, z) {
    for (let x = 0; x < gridSize; x++) {
      if (!visited[x][y][z]) {
        if (tryMove(x, y, z)) {
          // 成功移动
        }
      }
    }
  }
  
  // 奇数行从右到左处理
  function processRowRightToLeft(y, z) {
    for (let x = gridSize - 1; x >= 0; x--) {
      if (!visited[x][y][z]) {
        if (tryMove(x, y, z)) {
          // 成功移动
        }
      }
    }
  }
  
  // 尝试移动到指定位置
  function tryMove(x, y, z) {
    // 检查是否可以从当前位置移动到目标位置
    if (areAdjacentIndices(current.x, current.y, current.z, x, y, z)) {
      const nextPoint = grid[x][y][z];
      path.push(nextPoint);
      visited[x][y][z] = true;
      current = { x, y, z };
      return true;
    }
    
    // 如果当前无法直接移动，尝试找到一条路径
    const intermediatePoints = findPathTo(x, y, z);
    if (intermediatePoints.length > 0) {
      // 沿着路径移动
      for (const point of intermediatePoints) {
        path.push(grid[point.x][point.y][point.z]);
        visited[point.x][point.y][point.z] = true;
      }
      current = { x, y, z };
      return true;
    }
    
    return false;
  }
  
  // 寻找从当前位置到目标位置的路径
  function findPathTo(targetX, targetY, targetZ) {
    // 使用广度优先搜索找最短路径
    const queue = [{ x: current.x, y: current.y, z: current.z, path: [] }];
    const visitedInSearch = new Set([`${current.x},${current.y},${current.z}`]);
    
    while (queue.length > 0) {
      const { x, y, z, path } = queue.shift();
      
      // 检查每个方向
      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        const nz = z + dir.dz;
        
        // 检查是否在网格内且未访问
        if (nx >= 0 && nx < gridSize && 
            ny >= 0 && ny < gridSize && 
            nz >= 0 && nz < gridSize) {
          
          const key = `${nx},${ny},${nz}`;
          
          // 找到目标
          if (nx === targetX && ny === targetY && nz === targetZ) {
            return [...path, { x: nx, y: ny, z: nz }];
          }
          
          // 如果点未被访问（在当前搜索中和全局中）
          if (!visitedInSearch.has(key) && !visited[nx][ny][nz]) {
            visitedInSearch.add(key);
            queue.push({ 
              x: nx, 
              y: ny, 
              z: nz, 
              path: [...path, { x: nx, y: ny, z: nz }]
            });
          }
        }
      }
    }
    
    return []; // 没有找到路径
  }
  
  // 移动到新行
  function moveToRow(targetY, z) {
    // 尝试直接移动
    if (Math.abs(current.y - targetY) === 1) {
      if (tryMove(current.x, targetY, z)) {
        return true;
      }
    }
    
    // 尝试寻找路径
    const x = targetY % 2 === 0 ? 0 : gridSize - 1; // 根据行号确定起始位置
    return tryMove(x, targetY, z);
  }
  
  // 连接到下一层
  function connectToNextLayer(z) {
    // 尝试直接向上移动
    if (tryMove(current.x, current.y, z)) {
      return true;
    }
    
    // 如果不能直接移动，尝试找到可以移动的点
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (areAdjacentIndices(current.x, current.y, current.z, x, y, z) && !visited[x][y][z]) {
          if (tryMove(x, y, z)) {
            return true;
          }
        }
      }
    }
    
    // 如果仍然找不到，使用广度优先搜索
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (!visited[x][y][z]) {
          if (tryMove(x, y, z)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
};

// 辅助函数：检查两个点的索引是否相邻
function areAdjacentIndices(x1, y1, z1, x2, y2, z2) {
  const xDiff = Math.abs(x1 - x2);
  const yDiff = Math.abs(y1 - y2);
  const zDiff = Math.abs(z1 - z2);
  
  return (
    (xDiff === 1 && yDiff === 0 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 1 && zDiff === 0) ||
    (xDiff === 0 && yDiff === 0 && zDiff === 1)
  );
}

/**
 * 生成路径 - 外部接口
 * @param {Array} gridPoints - 网格点列表
 * @param {Object} startPoint - 起始点
 * @param {boolean} useRandomPath - 是否使用随机路径（否则使用哈密顿路径）
 * @param {number} gridSize - 网格大小
 * @returns {Array} - 生成的路径
 */
export const generatePath = (gridPoints, startPoint, useRandomPath = false, gridSize = 3) => {
  if (!startPoint) {
    console.error('未提供起点，无法生成路径');
    return [];
  }
  
  console.log('开始生成路径，使用随机模式:', useRandomPath, '网格大小:', gridSize);
  
  try {
    if (useRandomPath) {
      // 随机路径模式
      return generateRandomPath(gridPoints, startPoint);
    } else {
      // 完整路径模式 - 使用确定性的路径生成算法
      return generateFixedHamiltonianPath(gridPoints, startPoint, gridSize);
    }
  } catch (error) {
    console.error('路径生成出错:', error);
    // 出错时，尝试返回一个只包含起点的路径
    return [startPoint];
  }
};

/**
 * 计算两点之间的距离
 * @param {THREE.Vector3} p1 - 第一个点
 * @param {THREE.Vector3} p2 - 第二个点
 * @returns {number} - 距离
 */
export const calculateDistance = (p1, p2) => {
  return p1.distanceTo(p2);
};

/**
 * 创建路径线几何体
 * @param {Array} path - 路径点数组
 * @returns {THREE.BufferGeometry} - 路径线几何体
 */
export const createPathLineGeometry = (path) => {
  if (!path || path.length < 2) return null;
  
  const points = path.map(p => p.position);
  return points;
};

/**
 * 移动沿路径的动画逻辑
 * @param {Array} path - 路径点数组
 * @param {Function} onStep - 步骤回调
 * @param {Function} onComplete - 完成回调
 * @param {number} speed - 移动速度 (0-1)
 * @returns {Object} - 动画控制器
 */
export const createPathAnimation = (path, onStep, onComplete, speed = 0.02) => {
  if (!path || path.length < 2) return null;
  
  let currentIndex = 0;
  let targetIndex = 1;
  let progress = 0;
  let isPlaying = false;
  
  const updatePosition = () => {
    if (!isPlaying) return;
    
    if (progress >= 1) {
      // 移动到下一段
      progress = 0;
      currentIndex = targetIndex;
      targetIndex++;
      
      // 检查是否到达终点
      if (targetIndex >= path.length) {
        stop();
        if (onComplete) onComplete();
        return;
      }
    }
    
    // 计算当前位置
    const currentPoint = path[currentIndex].position;
    const targetPoint = path[targetIndex].position;
    
    const position = new THREE.Vector3().lerpVectors(
      currentPoint, 
      targetPoint, 
      progress
    );
    
    // 更新进度
    progress += speed;
    
    // 回调当前位置
    if (onStep) {
      onStep({
        position,
        currentIndex,
        targetIndex,
        progress,
        totalSteps: path.length
      });
    }
  };
  
  const start = () => {
    isPlaying = true;
    currentIndex = 0;
    targetIndex = 1;
    progress = 0;
  };
  
  const pause = () => {
    isPlaying = false;
  };
  
  const resume = () => {
    isPlaying = true;
  };
  
  const stop = () => {
    isPlaying = false;
    currentIndex = 0;
    targetIndex = 1;
    progress = 0;
  };
  
  const tick = () => {
    if (isPlaying) {
      updatePosition();
    }
  };
  
  return {
    start,
    pause,
    resume,
    stop,
    tick,
    isPlaying: () => isPlaying
  };
}; 