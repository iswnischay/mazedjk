import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from 'react-bootstrap';
import { BiCheckCircle, BiSearchAlt, BiRefresh, BiEraser } from 'react-icons/bi';
import dijkstra from './dijkstra';

const numRows = 21;
const numCols = 31;
const ANIMATION_SPEED_MS = 10;
const PATH_ANIMATION_SPEED_MS = 40;

const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];

const isValid = (x, y, maze) =>
  x > 0 && y > 0 && x < numRows - 1 && y < numCols - 1 && maze[x][y] === 1;

const generateMaze = () => {
  const maze = Array.from({ length: numRows }, () => Array(numCols).fill(1));
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
  return Array.from({ length: numRows }, (_, i) =>
    Array.from({ length: numCols }, (_, j) => ({
      row: i, col: j, isStart: false, isEnd: false, isWall: mazeArray[i][j] === 1,
      isTouched: false, matchOptimal: null, isVisited: false,
    }))
  );
};

function App() {
  const [grid, setGrid] = useState([]);
  const [userPath, setUserPath] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectionPhase, setSelectionPhase] = useState('start');
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [optimalPathLength, setOptimalPathLength] = useState(0);
  const [algorithmRuntime, setAlgorithmRuntime] = useState(0);
  const [nodesVisited, setNodesVisited] = useState(0);

  const resetGridState = (currentGrid) => currentGrid.map(row => row.map(cell => ({
    ...cell, isStart: false, isEnd: false, isVisited: false, matchOptimal: null, isTouched: false,
  })));

  const resetSelections = () => {
    setGrid(prevGrid => resetGridState(prevGrid));
    setStartNode(null);
    setEndNode(null);
    setUserPath([]);
    setSelectionPhase('start');
    setOptimalPathLength(0);
    setAlgorithmRuntime(0);
    setNodesVisited(0);
  };

  const initializeMaze = () => {
    setIsAnimating(false);
    const maze = generateMaze();
    setGrid(createGrid(maze));
    resetSelections();
  };

  useEffect(() => { initializeMaze(); }, []);

  const handleGridClick = (cell) => {
    if (isAnimating || cell.isWall) return;
    if (selectionPhase === 'start') {
      setGrid(prevGrid => prevGrid.map(row => row.map(c => c.row === cell.row && c.col === cell.col ? { ...c, isStart: true } : c)));
      setStartNode(cell);
      setSelectionPhase('end');
    } else if (selectionPhase === 'end' && (!startNode || !(cell.row === startNode.row && cell.col === startNode.col))) {
      setGrid(prevGrid => prevGrid.map(row => row.map(c => c.row === cell.row && c.col === cell.col ? { ...c, isEnd: true } : c)));
      setEndNode(cell);
      setSelectionPhase('done');
    }
  };

  const isAdjacent = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

  const handleCellSelect = (cell) => {
    if (selectionPhase !== 'done' || cell.isWall || cell.isStart || cell.isEnd) return;
    const last = userPath.length ? userPath[userPath.length - 1] : startNode;
    if (last && isAdjacent(last, cell) && !userPath.some(p => p.row === cell.row && p.col === cell.col)) {
      setGrid(prevGrid => prevGrid.map(row => row.map(c => c.row === cell.row && c.col === cell.col ? { ...c, isTouched: true } : c)));
      setUserPath(prevPath => [...prevPath, cell]);
    }
  };

  const handleMouseDown = (cell) => { if (isAnimating || selectionPhase !== 'done') return; setIsMouseDown(true); handleCellSelect(cell); };
  const handleMouseEnter = (cell) => { if (isAnimating || !isMouseDown || selectionPhase !== 'done') return; handleCellSelect(cell); };
  const handleMouseUp = () => setIsMouseDown(false);
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const animateSearch = async (visitedNodesInOrder, totalRuntime) => {
    // **FIX 1: Add a guard clause to prevent division by zero**
    if (visitedNodesInOrder.length === 0) return;

    const runtimeIncrement = totalRuntime / visitedNodesInOrder.length;
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
      await sleep(ANIMATION_SPEED_MS);
      const node = visitedNodesInOrder[i];
      setGrid(prevGrid => prevGrid.map(row => row.map(cell =>
        cell.row === node.row && cell.col === node.col ? { ...cell, isVisited: true } : cell
      )));
      setNodesVisited(i + 1);
      setAlgorithmRuntime(prev => prev + runtimeIncrement);
    }
  };

  const animatePath = async (path, comparison = false) => {
    for (let i = 0; i < path.length; i++) {
      await sleep(PATH_ANIMATION_SPEED_MS);
      const node = path[i];
      setGrid(prevGrid => prevGrid.map(row => row.map(cell => {
        if (cell.row === node.row && cell.col === node.col) {
          let matchOptimal = comparison && (cell.isTouched || cell.isStart || cell.isEnd) ? 'both' : 'optimal-only';
          return { ...cell, matchOptimal };
        }
        return cell;
      })));
      if (i > 0 && i < path.length - 1) {
        setOptimalPathLength(i);
      }
    }
  };

  const visualizePath = async (comparison = false) => {
    if (!startNode || !endNode || isAnimating) return;
    setIsAnimating(true);
    setOptimalPathLength(0);
    setAlgorithmRuntime(0);
    setNodesVisited(0);
    setGrid(prevGrid => prevGrid.map(row => row.map(c => ({ ...c, isVisited: false, matchOptimal: null }))));

    const startTime = performance.now();
    const { visitedNodesInOrder, path } = dijkstra(grid, startNode, endNode);
    const endTime = performance.now();
    const finalRuntime = endTime - startTime;
    
    await animateSearch(visitedNodesInOrder, finalRuntime);
    await animatePath(path, comparison);

    setAlgorithmRuntime(finalRuntime);
    setOptimalPathLength(path.length > 1 ? path.length - 2 : 0);

    if (comparison) {
      setGrid(prevGrid => prevGrid.map(row => row.map(cell => cell.isTouched && !cell.matchOptimal ? { ...cell, matchOptimal: 'user-only' } : cell)));
    }
    setIsAnimating(false);
  };

  const getInstructionText = () => {
    if (selectionPhase === 'start') return 'Click any empty cell to set the starting point';
    if (selectionPhase === 'end') return 'Now, select an ending point';
    return 'Draw your path or use the buttons below!';
  };

  const getCellClass = (cell) => {
    const classes = ['cell'];
    if (cell.isWall) classes.push('wall');
    else if (cell.isStart) classes.push('start');
    else if (cell.isEnd) classes.push('end');
    else if (cell.matchOptimal === 'both') classes.push('both-path');
    else if (cell.matchOptimal === 'user-only') classes.push('wrong-user-path');
    else if (cell.matchOptimal === 'optimal-only') classes.push('optimal-path');
    else if (cell.isVisited) classes.push('visited');
    else if (cell.isTouched) classes.push('user-path');
    else if (selectionPhase !== 'done') classes.push('selectable');
    return classes.join(' ');
  };

  return (
    <div className="App bg-dark text-light min-vh-100 p-3" onMouseUp={handleMouseUp}>
      <h1 className="mb-3">Path Validator with Dijkstra’s Algo</h1>
      <h4 className="text-info mb-4">{getInstructionText()}</h4>
      
      <div className="main-layout">
        <div className="grid-container">
          <div className="grid mx-auto">
            {grid.map((row, rowIdx) => (
              <div className="grid-row" key={rowIdx}>
                {row.map((cell) => (
                  <div
                    key={`${cell.row}-${cell.col}`}
                    className={getCellClass(cell)}
                    onClick={() => handleGridClick(cell)}
                    onMouseDown={() => handleMouseDown(cell)}
                    onMouseEnter={() => handleMouseEnter(cell)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 d-flex justify-content-center gap-3">
            <Button variant="outline-info" onClick={() => visualizePath(true)} disabled={isAnimating || !startNode || !endNode}>
              <BiCheckCircle className="me-2" />Check Path
            </Button>
            <Button variant="outline-warning" onClick={() => visualizePath(false)} disabled={isAnimating || !startNode || !endNode}>
              <BiSearchAlt className="me-2" />Show Optimal Path
            </Button>
            <Button variant="outline-secondary" onClick={resetSelections} disabled={isAnimating}>
              <BiEraser className="me-2" />Clear Points
            </Button>
            <Button variant="outline-light" onClick={initializeMaze} disabled={isAnimating}>
              <BiRefresh className="me-2" />New Maze
            </Button>
          </div>
        </div>

        <div className="info-panel">
          <h4 className="text-warning">Real-Time Stats</h4>
          <div className="info-item">
            <span>Your Path (steps):</span>
            <span className="info-value">{userPath.length}</span>
          </div>
          <hr />
          <div className="info-item">
            <span>Shortest Path (steps):</span>
            <span className="info-value">{nodesVisited > 0 ? optimalPathLength : 'N/A'}</span>
          </div>
          <hr />
          <div className="info-item">
            <span>Path Flooded (cells):</span>
            <span className="info-value">{nodesVisited > 0 ? nodesVisited : 'N/A'}</span>
          </div>
          <hr />
          <div className="info-item">
            <span>Algorithm Runtime:</span>
            {/* **FIX 2: Change display condition to depend on nodesVisited** */}
            <span className="info-value">{nodesVisited > 0 ? `${algorithmRuntime.toFixed(2)} ms` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;