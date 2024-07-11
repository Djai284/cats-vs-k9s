"use client"; 

import React, { useState, useEffect, useRef } from 'react';

const GRID_SIZE = 50;
const ROWS = 6;
const COLS = 9;
const TOTAL_WAVES = 10;

const catBreeds = {
  tabby: { color: 'bg-orange-400', projectile: 'furball', health: 100, damage: 20, cost: 100 },
  siamese: { color: 'bg-amber-200', projectile: 'paw', health: 80, damage: 30, cost: 175 },
  persian: { color: 'bg-gray-100', projectile: 'fire', health: 120, damage: 50, cost: 200 },
  sphynx: { color: 'bg-pink-300', projectile: 'meow', health: 90, damage: 25, cost: 150 }
};

const dogBreeds = [
  { color: 'bg-brown-500', speed: 0.5, emoji: '🐶', health: 100, damage: 10 },
  { color: 'bg-gray-500', speed: 0.7, emoji: '🐺', health: 80, damage: 15 },
  { color: 'bg-gray-800', speed: 0.3, emoji: '🐕', health: 150, damage: 5 }
];

const Cat = ({ x, y, breed, health, onClick }) => {
  const maxHealth = catBreeds[breed].health;
  const healthPercentage = (health / maxHealth) * 100;
  
  return (
    <div 
      onClick={onClick}
      className={`absolute flex flex-col justify-center items-center w-[50px] h-[50px] ${catBreeds[breed].color} text-2xl cursor-pointer`}
      style={{ left: x, top: y }}
    >
      🐱
      <div className="w-4/5 h-1 bg-red-500 mt-1">
        <div className="h-full bg-green-500" style={{ width: `${healthPercentage}%` }} />
      </div>
    </div>
  );
};

const Dog = ({ x, y, breed, health }) => {
  const maxHealth = breed.health;
  const healthPercentage = (health / maxHealth) * 100;
  
  return (
    <div className={`absolute flex flex-col justify-center items-center w-[50px] h-[50px] ${breed.color} text-2xl`}
         style={{ left: x, top: y }}>
      {breed.emoji}
      <div className="w-4/5 h-1 bg-red-500 mt-1">
        <div className="h-full bg-green-500" style={{ width: `${healthPercentage}%` }} />
      </div>
    </div>
  );
};

const Projectile = ({ x, y, type }) => {
  let content;
  switch(type) {
    case 'furball':
      content = '●';
      break;
    case 'paw':
      content = '🐾';
      break;
    case 'fire':
      content = '🔥';
      break;
    case 'meow':
      content = 'MEOW';
      break;
  }
  
  return (
    <div className={`absolute ${type === 'meow' ? 'text-sm' : 'text-xl'} text-red-500`}
         style={{ left: x, top: y }}>
      {content}
    </div>
  );
};

const VictoryScreen = ({ score, onPlayAgain }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500 bg-opacity-75 text-white">
    <h2 className="text-6xl mb-8">🎉 Victory! 🎉</h2>
    <p className="text-4xl mb-8">Your final score: {score}</p>
    <button onClick={onPlayAgain} className="px-6 py-3 bg-blue-500 text-white text-2xl rounded-lg hover:bg-blue-600 transition-colors">
      Play Again!
    </button>
  </div>
);

const GameOver = ({ score, onRetry }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white">
    <h2 className="text-4xl mb-4">Game Over</h2>
    <p className="text-2xl mb-4">Your score: {score}</p>
    <button onClick={onRetry} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Retry
    </button>
  </div>
);

const CatsVsCanines = () => {
  const [grid, setGrid] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
  const [dogs, setDogs] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState('tabby');
  const [milk, setMilk] = useState(200);
  const [userHealth, setUserHealth] = useState(100);
  const [currentWave, setCurrentWave] = useState(0);
  const [waveTimer, setWaveTimer] = useState(0);
  const [isWaveActive, setIsWaveActive] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawGrid = () => {
      ctx.strokeStyle = 'lightgray';
      for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
      }
      for (let j = 0; j <= COLS; j++) {
        ctx.beginPath();
        ctx.moveTo(j * GRID_SIZE, 0);
        ctx.lineTo(j * GRID_SIZE, canvas.height);
        ctx.stroke();
      }
    };

    drawGrid();
  }, []);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (isGameOver || isVictory) return;

      // Generate milk (every 5 seconds)
      setMilk(prevMilk => {
        if (Date.now() % 5000 < 100) { // Check if it's been roughly 5 seconds
          return prevMilk + 50;
        }
        return prevMilk;
      });

      // Move dogs and attack cats
      setDogs(prevDogs => prevDogs.map(dog => {
        const newX = dog.x - dog.breed.speed;
        const gridCol = Math.floor(newX / GRID_SIZE);
        const gridRow = Math.floor(dog.y / GRID_SIZE);
        
        if (gridCol >= 0 && grid[gridRow][gridCol]) {
          // Dog attacks cat
          setGrid(prevGrid => {
            const newGrid = [...prevGrid];
            const cat = newGrid[gridRow][gridCol];
            cat.health -= dog.breed.damage;
            if (cat.health <= 0) {
              newGrid[gridRow][gridCol] = null;
            }
            return newGrid;
          });
          return dog; // Dog stays in place while attacking
        }
        
        if (newX <= 0) {
          // Dog reached the end, reduce user health
          setUserHealth(prevHealth => {
            const newHealth = Math.max(0, prevHealth - 10);
            if (newHealth === 0) {
              setIsGameOver(true);
            }
            return newHealth;
          });
          return null; // Remove the dog
        }
        
        return { ...dog, x: newX };
      }).filter(Boolean));

      // Move projectiles
      setProjectiles(prevProjectiles => prevProjectiles.map(projectile => ({
        ...projectile,
        x: projectile.x + 5
      })).filter(projectile => projectile.x < COLS * GRID_SIZE));

      // Cats shoot
      setGrid(prevGrid => {
        const newProjectiles = [];
        prevGrid.forEach((row, i) => {
          row.forEach((cat, j) => {
            if (cat && Date.now() - cat.lastShot > 1000) {
              newProjectiles.push({
                x: (j + 1) * GRID_SIZE,
                y: i * GRID_SIZE + GRID_SIZE / 2,
                type: catBreeds[cat.breed].projectile,
                damage: catBreeds[cat.breed].damage
              });
              cat.lastShot = Date.now();
            }
          });
        });
        setProjectiles(prevProjectiles => [...prevProjectiles, ...newProjectiles]);
        return prevGrid;
      });

      // Check collisions
      setDogs(prevDogs => {
        setProjectiles(prevProjectiles => {
          return prevProjectiles.filter(projectile => {
            const hitDog = prevDogs.find(dog => 
              projectile.x < dog.x + GRID_SIZE &&
              projectile.x + 20 > dog.x &&
              projectile.y < dog.y + GRID_SIZE &&
              projectile.y + 20 > dog.y
            );
            if (hitDog) {
              hitDog.health -= projectile.damage;
              if (hitDog.health <= 0) {
                setScore(prevScore => prevScore + 10);
              }
              return false;
            }
            return true;
          });
        });
        return prevDogs.filter(dog => dog.health > 0);
      });

      // Wave management
      if (isWaveActive) {
        setWaveTimer(prevTimer => {
          if (prevTimer > 0) {
            return prevTimer - 1;
          } else {
            setIsWaveActive(false);
            setCurrentWave(prevWave => prevWave + 1);
            return 0;
          }
        });
      } else if (currentWave < TOTAL_WAVES) {
        setIsWaveActive(true);
        setWaveTimer(300); // 5 seconds (assuming 60 fps)
      } else if (dogs.length === 0) {
        // All waves completed and no dogs left
        setIsVictory(true);
      }

      // Spawn dogs during active wave
      if (isWaveActive && Math.random() < 0.02 + (currentWave * 0.005)) {
        const row = Math.floor(Math.random() * ROWS);
        const breed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
        setDogs(prevDogs => [...prevDogs, { x: COLS * GRID_SIZE, y: row * GRID_SIZE, breed, health: breed.health }]);
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [grid, isWaveActive, currentWave, isGameOver, isVictory]);

  const handleCanvasClick = (event) => {
    if (isGameOver || isVictory) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);

    if (col < COLS) {
      if (!grid[row][col]) {
        // Place new cat
        const catCost = catBreeds[selectedBreed].cost;
        if (milk >= catCost) {
          setGrid(prevGrid => {
            const newGrid = [...prevGrid];
            newGrid[row][col] = { 
              breed: selectedBreed, 
              lastShot: 0, 
              health: catBreeds[selectedBreed].health 
            };
            return newGrid;
          });
          setMilk(prevMilk => prevMilk - catCost);
        }
      } else {
        // Remove existing cat (no refund in PvZ style)
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[row][col] = null;
          return newGrid;
        });
      }
    }
  };

  const handleRetry = () => {
    resetGame();
  };

  const handlePlayAgain = () => {
    resetGame();
  };

  const resetGame = () => {
    setGrid(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
    setDogs([]);
    setProjectiles([]);
    setSelectedBreed('tabby');
    setMilk(200);
    setUserHealth(100);
    setCurrentWave(0);
    setWaveTimer(0);
    setIsWaveActive(false);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Cats vs. Canines - Wave {currentWave + 1}/{TOTAL_WAVES}</h1>
      <div className="mb-4 text-lg">
        Milk: 🥛 {milk} | User Health: ❤️ {userHealth}% | Score: {score}
        {isWaveActive && <span> | Wave Timer: {Math.ceil(waveTimer / 60)}s</span>}
      </div>
      <div className="relative">
        <canvas 
          ref={canvasRef}
          width={COLS * GRID_SIZE} 
          height={ROWS * GRID_SIZE} 
          onClick={handleCanvasClick}
          className="border border-gray-400"
        />
        {grid.map((row, i) => 
          row.map((cat, j) => 
            cat && (
              <Cat 
                key={`${i}-${j}`} 
                x={j * GRID_SIZE} 
                y={i * GRID_SIZE} 
                breed={cat.breed} 
                health={cat.health} 
                onClick={() => handleCanvasClick({ clientX: j * GRID_SIZE + canvasRef.current.offsetLeft, clientY: i * GRID_SIZE + canvasRef.current.offsetTop })}
              />
            )
          )
        )}
        {dogs.map((dog, index) => 
          <Dog key={index} x={dog.x} y={dog.y} breed={dog.breed} health={dog.health} />
        )}
        {projectiles.map((projectile, index) => 
          <Projectile key={index} x={projectile.x} y={projectile.y} type={projectile.type} />
        )}
        {isGameOver && <GameOver score={score} onRetry={handleRetry} />}
        {isVictory && <VictoryScreen score={score} onPlayAgain={handlePlayAgain} />}
      </div>
      <div className="mt-4">
        <label htmlFor="catBreed" className="mr-2">Select cat breed:</label>
        <select 
          id="catBreed"
          value={selectedBreed} 
          onChange={(e) => setSelectedBreed(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        >
          {Object.entries(catBreeds).map(([breed, info]) => (
            <option key={breed} value={breed}>
              {breed.charAt(0).toUpperCase() + breed.slice(1)} (Cost: {info.cost} 🥛)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CatsVsCanines;