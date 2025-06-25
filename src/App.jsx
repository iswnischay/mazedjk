// App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { BiCheckCircle, BiSearchAlt, BiRefresh } from 'react-icons/bi';
import dijkstra from './dijkstra';

const numRows = 21;
const numCols = 31;

const directions = [
  [0, 2], [2, 0], [0, -2], [-2, 0]
];

const isValid = (x, y, maze) =>
  x > 0 && y > 0 && x < numRows - 1 && y < numCols - 1 && maze[x][y] === 1;

const generateMaze = () => {
  const maze = Array.from({ length: numRows }, () =>
    Array(numCols).fill(1)
  );

  const carve = (x, y) => {
    maze[x][y] = 0;
    const dirs = [...directions].sort(() => Math.random() - 0.5);
    for (let [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (isValid(nx, ny, maze)) {
        maze[x + dx / 2][y + dy / 2] = 0;
        carve(nx, ny);
      }
    }
  };

  carve(1, 1);
  for (let i = 0; i < 30; i++) {
    const rx = Math.floor(Math.random() * (numRows - 2)) + 1;
    const ry = Math.floor(Math.random() * (numCols - 2)) + 1;
    if (maze[rx][ry] === 1) maze[rx][ry] = 0;
  }
  maze[1][1] = 0;
  maze[numRows - 2][numCols - 2] = 0;
  return maze;
};

const createGrid = (mazeArray) => {
  const grid = [];
  for (let i = 0; i < numRows; i++) {
    const row = [];
    for (let j = 0; j < numCols; j++) {
      row.push({
        row: i,
        col: j,
        isStart: i === 1 && j === 1,
        isEnd: i === numRows - 2 && j === numCols - 2,
        isWall: mazeArray[i][j] === 1,
        isTouched: false,
        matchOptimal: null
      });
    }
    grid.push(row);
  }
  return grid;
};

function App() {
  const [grid, setGrid] = useState([]);
  const [userPath, setUserPath] = useState([]);
  const [optimalPath, setOptimalPath] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const initializeMaze = () => {
    const maze = generateMaze();
    setGrid(createGrid(maze));
    setUserPath([]);
    setOptimalPath([]);
  };

  useEffect(() => {
    initializeMaze();
  }, []);

  const start = grid.flat().find(cell => cell.isStart);
  const end = grid.flat().find(cell => cell.isEnd);

  const isAdjacent = (a, b) =>
    Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

  const handleCellSelect = (cell) => {
    if (cell.isWall || cell.isStart || cell.isEnd) return;
    const last = userPath.length ? userPath[userPath.length - 1] : start;
    if (isAdjacent(last, cell)) {
      const newGrid = grid.map(row =>
        row.map(c =>
          c.row === cell.row && c.col === cell.col ? { ...c, isTouched: true } : c
        )
      );
      setGrid(newGrid);
      setUserPath([...userPath, cell]);
    }
  };

  const handleMouseDown = (cell) => {
    setIsMouseDown(true);
    handleCellSelect(cell);
  };

  const handleMouseEnter = (cell) => {
    if (!isMouseDown) return;
    handleCellSelect(cell);
  };

  const handleMouseUp = () => setIsMouseDown(false);

  const checkPath = () => {
    if (!start || !end) return;
    const dijkstraPath = dijkstra(grid, start, end);
    const updatedGrid = grid.map(row =>
      row.map(cell => {
        const isInOptimal = dijkstraPath.some(p => p.row === cell.row && p.col === cell.col);
        const isInUser = cell.isTouched;
        let matchOptimal = null;
        if (isInUser && isInOptimal) matchOptimal = 'both';
        else if (isInUser) matchOptimal = 'user-only';
        else if (isInOptimal) matchOptimal = 'optimal-only';
        return { ...cell, matchOptimal };
      })
    );
    setGrid(updatedGrid);
    setOptimalPath(dijkstraPath);
  };

  const showOptimal = () => {
    if (!start || !end) return;
    const dijkstraPath = dijkstra(grid, start, end);
    const updatedGrid = grid.map(row =>
      row.map(cell => {
        const isInOptimal = dijkstraPath.some(p => p.row === cell.row && p.col === cell.col);
        return { ...cell, matchOptimal: isInOptimal ? 'optimal-only' : null };
      })
    );
    setGrid(updatedGrid);
    setOptimalPath(dijkstraPath);
  };

  const getCellClass = (cell) => {
    if (cell.isWall) return 'cell wall';
    if (cell.isStart) return 'cell start';
    if (cell.isEnd) return 'cell end';
    if (cell.matchOptimal === 'both') return 'cell both-path';
    if (cell.matchOptimal === 'user-only') return 'cell wrong-user-path';
    if (cell.matchOptimal === 'optimal-only') return 'cell optimal-path';
    if (cell.isTouched) return 'cell user-path';
    return 'cell';
  };

  return (
    <div className="App bg-dark text-light min-vh-100 p-3" onMouseUp={handleMouseUp}>
      <br></br><br></br><br></br>
      <h1 className="mb-4">Path Validator with Dijkstra’s Algo</h1>
      <div className="grid mx-auto">
        {grid.map((row, rowIdx) => (
          <div className="grid-row" key={rowIdx}>
            {row.map((cell, colIdx) => (
              <div
                key={colIdx}
                className={getCellClass(cell)}
                onMouseDown={() => handleMouseDown(cell)}
                onMouseEnter={() => handleMouseEnter(cell)}
                onClick={() => handleCellSelect(cell)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 d-flex justify-content-center gap-3">
        <Button variant="outline-info" onClick={checkPath}><BiCheckCircle className="me-2" />Check Path</Button>
        <Button variant="outline-warning" onClick={showOptimal}><BiSearchAlt className="me-2" />Show Optimal Path</Button>
        <Button variant="outline-light" onClick={initializeMaze}><BiRefresh className="me-2" />Reset</Button>
      </div>
    </div>
  );
}

export default App;
