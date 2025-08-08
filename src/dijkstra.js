// src/dijkstra.js

const numRows = 21;
const numCols = 31;

const dijkstra = (grid, start, end) => {
  const distances = Array.from({ length: numRows }, () => Array(numCols).fill(Infinity));
  const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
  const prev = Array.from({ length: numRows }, () => Array(numCols).fill(null));

  // This will store the nodes in the order they are visited for animation
  const visitedNodesInOrder = [];

  distances[start.row][start.col] = 0;
  const queue = [{ ...start, dist: 0 }];
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length) {
    queue.sort((a, b) => a.dist - b.dist);
    const { row, col, dist } = queue.shift();
    if (visited[row][col]) continue;
    visited[row][col] = true;

    // Push the current node to our animation array
    if (grid[row] && grid[row][col]) {
      visitedNodesInOrder.push(grid[row][col]);
    }

    if (row === end.row && col === end.col) {
      // Reconstruct path
      const path = [];
      let curr = end;
      while (curr) {
        path.push(curr);
        curr = prev[curr.row][curr.col];
      }
      return { visitedNodesInOrder, path: path.reverse() };
    }

    for (let [dx, dy] of dirs) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (
        newRow >= 0 && newRow < numRows &&
        newCol >= 0 && newCol < numCols &&
        grid[newRow] && grid[newRow][newCol] &&
        !grid[newRow][newCol].isWall &&
        !visited[newRow][newCol]
      ) {
        const newDist = dist + 1;
        if (newDist < distances[newRow][newCol]) {
          distances[newRow][newCol] = newDist;
          prev[newRow][newCol] = { row, col };
          queue.push({ row: newRow, col: newCol, dist: newDist });
        }
      }
    }
  }

  // Return if path not found
  return { visitedNodesInOrder, path: [] };
};

export default dijkstra;