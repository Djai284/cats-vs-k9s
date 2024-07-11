"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const GRID_SIZE = 50;
const ROWS = 6;
const COLS = 9;
const TOTAL_WAVES = 10;

const BASE_WAVE_DURATION = 300; // 5 seconds at 60 fps
const WAVE_DURATION_INCREASE = 60; // 1 second increase per wave
const BASE_DOG_SPAWN_RATE = 0.02;
const DOG_SPAWN_RATE_INCREASE = 0.002;

// Audio context and sounds
let audioContext;
let backgroundMusic;
let projectileSounds = {};
let dogBarkSound;

const initAudio = () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Load background music
  // loadSound('/path/to/background-music.mp3').then(buffer => {
  //   backgroundMusic = buffer;
  // });

  // Load projectile sounds
  loadSound("/sounds/cat-purr.mp3").then((buffer) => {
    projectileSounds["furball"] = buffer;
  });
  loadSound("/sounds/soft-thud.mp3").then((buffer) => {
    projectileSounds["paw"] = buffer;
  });
  loadSound("/sounds/fireball.mp3").then((buffer) => {
    projectileSounds["fire"] = buffer;
  });
  loadSound("/sounds/cat-meow.mp3").then((buffer) => {
    projectileSounds["meow"] = buffer;
  });

  // Load dog bark sound
  loadSound("/sounds/dog-bark.mp3").then((buffer) => {
    dogBarkSound = buffer;
  });
};

const loadSound = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
};

const playSound = (buffer, loop = false) => {
  if (audioContext && buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.loop = loop;
    source.start();
    return source;
  }
};

const catBreeds = {
  tabby: {
    color: "bg-orange-400",
    projectile: "furball",
    health: 100,
    damage: 20,
    cost: 100,
  },
  siamese: {
    color: "bg-amber-200",
    projectile: "paw",
    health: 80,
    damage: 30,
    cost: 175,
  },
  persian: {
    color: "bg-gray-100",
    projectile: "fire",
    health: 120,
    damage: 50,
    cost: 200,
  },
  sphynx: {
    color: "bg-pink-300",
    projectile: "meow",
    health: 90,
    damage: 25,
    cost: 150,
  },
};

const dogBreeds = [
  { color: "bg-brown-500", speed: 0.5, emoji: "🐶", health: 100, damage: 10 },
  { color: "bg-gray-500", speed: 0.7, emoji: "🐺", health: 80, damage: 15 },
  { color: "bg-gray-800", speed: 0.3, emoji: "🐕", health: 150, damage: 5 },
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
        <div
          className="h-full bg-green-500"
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
    </div>
  );
};

const Dog = ({ x, y, breed, health, maxHealth }) => {
  const healthPercentage = Math.max(
    0,
    Math.min(100, (health / maxHealth) * 100)
  );

  return (
    <div
      className={`absolute flex flex-col justify-center items-center w-[50px] h-[50px] ${breed.color} text-2xl`}
      style={{ left: x, top: y }}
    >
      {breed.emoji}
      <div className="w-4/5 h-1 bg-red-500 mt-1">
        <div
          className="h-full bg-green-500"
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
    </div>
  );
};

const ProjectileType = (type) => {
  switch (type) {
    case "furball":
      return "●";
    case "paw":
      return "🐾";
    case "fire":
      return "🔥";
    case "meow":
      return "MEOW";
  }
};

const Projectile = ({ x, y, type }) => {
  let content = ProjectileType(type);

  return (
    <div
      className={`absolute ${
        type === "meow" ? "text-sm" : "text-xl"
      } text-red-500`}
      style={{ left: x, top: y }}
    >
      {content}
    </div>
  );
};

const VictoryScreen = ({ score, onPlayAgain }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500 bg-opacity-75 text-white">
    <h2 className="text-6xl mb-8">🎉 Victory! 🎉</h2>
    <p className="text-4xl mb-8">Your final score: {score}</p>
    <button
      onClick={onPlayAgain}
      className="px-6 py-3 bg-blue-500 text-white text-2xl rounded-lg hover:bg-blue-600 transition-colors"
    >
      Play Again!
    </button>
  </div>
);

const GameOver = ({ score, onRetry }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white">
    <h2 className="text-4xl mb-4">Game Over</h2>
    <p className="text-2xl mb-4">Your score: {score}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Retry
    </button>
  </div>
);

const PauseScreen = ({ score, onResume, onRestart }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-75 text-white">
    <h2 className="text-6xl mb-8">⏸️ Paused</h2>
    <p className="text-4xl mb-8">Current score: {score}</p>
    <div className="flex space-x-4">
      <button
        onClick={onResume}
        className="px-6 py-3 bg-green-500 text-white text-2xl rounded-lg hover:bg-green-600 transition-colors"
      >
        Resume
      </button>
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-blue-500 text-white text-2xl rounded-lg hover:bg-blue-600 transition-colors"
      >
        Restart
      </button>
    </div>
  </div>
);

const FelinesVsCanines = () => {
  const [grid, setGrid] = useState(
    Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(null))
  );
  const [dogs, setDogs] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [selectedBreed, setSelectedBreed] = useState("tabby");
  const [milk, setMilk] = useState(200);
  const [userHealth, setUserHealth] = useState(100);
  const [currentWave, setCurrentWave] = useState(0);
  const [waveTimer, setWaveTimer] = useState(0);
  const [isWaveActive, setIsWaveActive] = useState(false);
  const [allWavesSpawned, setAllWavesSpawned] = useState(false);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const canvasRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const backgroundMusicRef = useRef(null);

  const checkVictory = useCallback(() => {
    if (allWavesSpawned && dogs.length === 0 && !isVictory) {
      setIsVictory(true);
    }
  }, [allWavesSpawned, dogs.length, isVictory]);

  // Initialize audio on first render
  useEffect(() => {
    initAudio();
  }, []);

  // Play background music
  useEffect(() => {
    if (backgroundMusic && !backgroundMusicRef.current && !isMuted) {
      backgroundMusicRef.current = playSound(backgroundMusic, true);
    }

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.stop();
        backgroundMusicRef.current = null;
      }
    };
  }, [isMuted]);

  // Play wave sound
  useEffect(() => {
    if (isWaveActive && currentWave > 0 && !isMuted && !isPaused) {
      playSound(dogBarkSound);
    }
  }, [isWaveActive, currentWave, isMuted, isPaused]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      if (backgroundMusicRef.current) backgroundMusicRef.current.stop();
      backgroundMusicRef.current = null;
    } else {
      backgroundMusicRef.current = playSound(backgroundMusic, true);
    }
  };

  const shootProjectile = (type, x, y, damage) => {
    if (!isMuted) {
      playSound(projectileSounds[type]);
    }
    setProjectiles((prevProjectiles) => [
      ...prevProjectiles,
      { x, y, type, damage },
    ]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const drawGrid = () => {
      ctx.strokeStyle = "lightgray";
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
      if (isPaused || isGameOver || isVictory) return;

      // Generate milk (every 5 seconds)
      setMilk((prevMilk) => {
        if (Date.now() % 5000 < 100) {
          // Check if it's been roughly 5 seconds
          return prevMilk + 50;
        }
        return prevMilk;
      });

      // Move dogs and attack cats
      setDogs((prevDogs) => {
        const updatedDogs = prevDogs
          .map((dog) => {
            const newX = dog.x - dog.breed.speed;
            const gridCol = Math.floor(newX / GRID_SIZE);
            const gridRow = Math.floor(dog.y / GRID_SIZE);

            if (gridCol >= 0 && grid[gridRow][gridCol]) {
              // Dog attacks cat
              setGrid((prevGrid) => {
                const newGrid = [...prevGrid];
                const cat = newGrid[gridRow][gridCol];
                cat.health -= dog.damage;
                if (cat.health <= 0) {
                  newGrid[gridRow][gridCol] = null;
                }
                return newGrid;
              });
              return dog; // Dog stays in place while attacking
            }

            if (newX <= 0) {
              // Dog reached the end, reduce user health
              setUserHealth((prevHealth) => {
                const newHealth = Math.max(0, prevHealth - 10);
                if (newHealth === 0) {
                  setIsGameOver(true);
                }
                return newHealth;
              });
              return null; // Remove the dog
            }

            return { ...dog, x: newX };
          })
          .filter(Boolean);

        if (updatedDogs.length < prevDogs.length) {
          // If a dog left the screen, check for victory
          setTimeout(checkVictory, 0);
        }
        return updatedDogs;
      }); // Remove any null dogs

      // Move projectiles
      setProjectiles((prevProjectiles) =>
        prevProjectiles
          .map((projectile) => ({
            ...projectile,
            x: projectile.x + 5,
          }))
          .filter((projectile) => projectile.x < COLS * GRID_SIZE)
      );

      // Cats shoot
      setGrid((prevGrid) => {
        const newProjectiles = [];
        prevGrid.forEach((row, i) => {
          row.forEach((cat, j) => {
            if (cat && Date.now() - cat.lastShot > 1000) {
              shootProjectile(
                catBreeds[cat.breed].projectile,
                (j + 1) * GRID_SIZE,
                i * GRID_SIZE + GRID_SIZE / 2,
                catBreeds[cat.breed].damage
              );
              cat.lastShot = Date.now();
            }
          });
        });
        return prevGrid;
      });

      // Check collisions
      setDogs((prevDogs) => {
        setProjectiles((prevProjectiles) => {
          return prevProjectiles.filter((projectile) => {
            const hitDog = prevDogs.find(
              (dog) =>
                projectile.x < dog.x + GRID_SIZE &&
                projectile.x + 20 > dog.x &&
                projectile.y < dog.y + GRID_SIZE &&
                projectile.y + 20 > dog.y
            );
            if (hitDog) {
              // Calculate damage based on maxHealth, not current health
              const damageAmount = projectile.damage;
              hitDog.health = Math.max(0, hitDog.health - damageAmount);
              if (hitDog.health <= 0) {
                setScore((prevScore) => prevScore + 10);
              }
              return false;
            }
            return true;
          });
        });
        // Remove dogs with 0 or less health
        const updatedDogs = prevDogs.filter((dog) => dog.health > 0);
        if (updatedDogs.length < prevDogs.length) {
          // If a dog was defeated, check for victory
          setTimeout(checkVictory, 0);
        }
        return updatedDogs;
      });

      // Wave management
      if (isWaveActive) {
        setWaveTimer((prevTimer) => {
          if (prevTimer > 0) {
            return prevTimer - 1;
          } else {
            const nextWave = currentWave + 1;
            if (nextWave >= TOTAL_WAVES) {
              setAllWavesSpawned(true);
            }
            setIsWaveActive(false);
            setCurrentWave(nextWave);
            return 0;
          }
        });
      } else if (currentWave < TOTAL_WAVES) {
        setIsWaveActive(true);
        setWaveTimer(BASE_WAVE_DURATION + currentWave * WAVE_DURATION_INCREASE);
      }

      // Victory check
      if (allWavesSpawned && dogs.length === 0 && !isVictory) {
        setIsVictory(true);
      }

      // Spawn dogs during active wave
      if (isWaveActive && !allWavesSpawned) {
        const spawnRate =
          BASE_DOG_SPAWN_RATE + currentWave * DOG_SPAWN_RATE_INCREASE;
        if (Math.random() < spawnRate) {
          const row = Math.floor(Math.random() * ROWS);
          const breed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)];
          const healthMultiplier = 1 + currentWave * 0.1; // 10% increase per wave
          const damageMultiplier = 1 + currentWave * 0.05; // 5% increase per wave
          const maxHealth = breed.health * healthMultiplier;
          setDogs((prevDogs) => [
            ...prevDogs,
            {
              x: COLS * GRID_SIZE,
              y: row * GRID_SIZE,
              breed,
              health: maxHealth,
              maxHealth: maxHealth,
              damage: breed.damage * damageMultiplier,
            },
          ]);
        }
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [
    grid,
    isWaveActive,
    currentWave,
    isGameOver,
    isVictory,
    isPaused,
    checkVictory,
  ]);

  const handleCanvasClick = (event) => {
    if (isGameOver || isVictory || isPaused) return;

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
          setGrid((prevGrid) => {
            const newGrid = [...prevGrid];
            newGrid[row][col] = {
              breed: selectedBreed,
              lastShot: 0,
              health: catBreeds[selectedBreed].health,
            };
            return newGrid;
          });
          setMilk((prevMilk) => prevMilk - catCost);
        }
      } else {
        // Remove existing cat (no refund in PvZ style)
        setGrid((prevGrid) => {
          const newGrid = [...prevGrid];
          newGrid[row][col] = null;
          return newGrid;
        });
      }
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleRestart = () => {
    resetGame();
    setIsPaused(false);
  };

  const resetGame = () => {
    setGrid(
      Array(ROWS)
        .fill()
        .map(() => Array(COLS).fill(null))
    );
    setDogs([]);
    setProjectiles([]);
    setSelectedBreed("tabby");
    setMilk(200);
    setUserHealth(100);
    setCurrentWave(0);
    setWaveTimer(0);
    setIsWaveActive(false);
    setScore(0);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setAllWavesSpawned(false);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">
        Felines vs. Canines - Wave {currentWave + 1}/{TOTAL_WAVES}
      </h1>
      <div className="mb-4 text-lg flex items-center">
        <span>
          Milk: 🥛 {milk} | User Health: ❤️ {userHealth}% | Score: {score}
        </span>
        {isWaveActive && (
          <span className="ml-4">
            Wave Timer: {Math.ceil(waveTimer / 60)}s /{" "}
            {Math.ceil(
              (BASE_WAVE_DURATION + currentWave * WAVE_DURATION_INCREASE) / 60
            )}
            s
          </span>
        )}
        <button
          onClick={toggleMute}
          className="ml-4 px-2 py-1 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          {isMuted ? "🔇 Unmute" : "🔊 Mute"}
        </button>
        <button
          onClick={togglePause}
          className="ml-4 px-2 py-1 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          {isPaused ? "▶️ Resume" : "⏸️ Pause"}
        </button>
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
          row.map(
            (cat, j) =>
              cat && (
                <Cat
                  key={`${i}-${j}`}
                  x={j * GRID_SIZE}
                  y={i * GRID_SIZE}
                  breed={cat.breed}
                  health={cat.health}
                  onClick={() =>
                    handleCanvasClick({
                      clientX: j * GRID_SIZE + canvasRef.current.offsetLeft,
                      clientY: i * GRID_SIZE + canvasRef.current.offsetTop,
                    })
                  }
                />
              )
          )
        )}
        {dogs.map((dog, index) => (
          <Dog
            key={index}
            x={dog.x}
            y={dog.y}
            breed={dog.breed}
            health={dog.health}
            maxHealth={dog.maxHealth}
          />
        ))}
        {projectiles.map((projectile, index) => (
          <Projectile
            key={index}
            x={projectile.x}
            y={projectile.y}
            type={projectile.type}
          />
        ))}
        {isGameOver && <GameOver score={score} onRetry={handleRestart} />}
        {isVictory && (
          <VictoryScreen score={score} onPlayAgain={handleRestart} />
        )}
        {isPaused && (
          <PauseScreen
            score={score}
            onResume={handleResume}
            onRestart={handleRestart}
          />
        )}
      </div>
      <div className="mt-4">
        <label htmlFor="catBreed" className="mr-2">
          Select cat breed:
        </label>
        <select
          id="catBreed"
          value={selectedBreed}
          onChange={(e) => setSelectedBreed(e.target.value)}
          className="p-2 border border-gray-300 bg-gray-100 text-black rounded"
        >
          {Object.entries(catBreeds).map(([breed, info]) => (
            <option key={breed} value={breed}>
              {breed.charAt(0).toUpperCase() + breed.slice(1)}{" "}
              {ProjectileType(info.projectile)} (Cost: {info.cost} 🥛)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FelinesVsCanines;
