document.addEventListener('DOMContentLoaded', () => {
    const mazeContainer = document.getElementById('maze');
    const startBtn = document.getElementById('startBtn');
    const scoreDisplay = document.getElementById('score');
    const gameMessage = document.getElementById('gameMessage');
    const shortestPathDisplay = document.getElementById('shortestPathDisplay');
    const mazeSize = 10;
    const maze = [];
    let playerPosition = { x: 0, y: 0 };
    let moveCount = 0;
    let shortestPathLength = 0;

    function initMaze() {
        mazeContainer.innerHTML = '';
        gameMessage.textContent = '';
        shortestPathDisplay.textContent = '';
        maze.length = 0;
        moveCount = 0;
        updateScore();

        for (let y = 0; y < mazeSize; y++) {
            maze[y] = [];
            for (let x = 0; x < mazeSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                mazeContainer.appendChild(cell);
                maze[y][x] = cell;
            }
        }

        maze[0][0].classList.add('start');
        maze[mazeSize - 1][mazeSize - 1].classList.add('end');
        playerPosition = { x: 0, y: 0 };
        updatePlayerPosition();

        generateMaze();
    }

    function generateMaze() {
        const stack = [{ x: 0, y: 0 }];
        const visited = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(false));
        visited[0][0] = true;

        function carvePath(x, y) {
            const directions = [
                { dx: 2, dy: 0 }, // Right
                { dx: -2, dy: 0 }, // Left
                { dx: 0, dy: 2 }, // Down
                { dx: 0, dy: -2 } // Up
            ];

            directions.sort(() => Math.random() - 0.5);

            for (const { dx, dy } of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const mx = x + dx / 2;
                const my = y + dy / 2;

                if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && !visited[ny][nx]) {
                    visited[ny][nx] = true;
                    maze[my][mx].classList.remove('obstacle');
                    maze[ny][nx].classList.remove('obstacle');
                    stack.push({ x: nx, y: ny });
                    carvePath(nx, ny);
                }
            }
        }

        carvePath(0, 0);

        let placedObstacles = 0;
        while (placedObstacles < 10) {
            let x, y;
            do {
                x = Math.floor(Math.random() * mazeSize);
                y = Math.floor(Math.random() * mazeSize);
            } while ((x === 0 && y === 0) || (x === mazeSize - 1 && y === mazeSize - 1) || maze[y][x].classList.contains('obstacle'));

            maze[y][x].classList.add('obstacle');
            placedObstacles++;
        }
    }

    function updatePlayerPosition() {
        maze[playerPosition.y][playerPosition.x].classList.add('player');
        maze[playerPosition.y][playerPosition.x].classList.add('visited');
    }

    window.movePlayer = function(dx, dy) {
        const newX = playerPosition.x + dx;
        const newY = playerPosition.y + dy;

        if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize) {
            if (!maze[newY][newX].classList.contains('obstacle')) {
                maze[playerPosition.y][playerPosition.x].classList.remove('player');
                playerPosition = { x: newX, y: newY };
                updatePlayerPosition();
                moveCount++;
                updateScore();

                if (playerPosition.x === mazeSize - 1 && playerPosition.y === mazeSize - 1) {
                    showBestPath();
                    if (moveCount <= shortestPathLength) {
                        gameMessage.textContent = 'Congratulations! You found the shortest path!';
                    } else {
                        gameMessage.textContent = 'YOU LOST! You didn\'t use the shortest path.';
                    }
                    shortestPathDisplay.textContent = `Shortest Path Moves: ${shortestPathLength}`;
                }
            } else {
                alert('Blocked by an obstacle!');
            }
        }
    }

    function updateScore() {
        scoreDisplay.textContent = `Moves: ${moveCount}`;
    }

    function heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function showBestPath() {
        const start = { x: 0, y: 0 };
        const end = { x: mazeSize - 1, y: mazeSize - 1 };
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(Infinity));
        const fScore = Array.from({ length: mazeSize }, () => Array(mazeSize).fill(Infinity));

        gScore[start.y][start.x] = 0;
        fScore[start.y][start.x] = heuristic(start, end);

        while (openSet.length > 0) {
            let current = openSet.reduce((a, b) => (fScore[a.y][a.x] < fScore[b.y][b.x] ? a : b));

            if (current.x === end.x && current.y === end.y) {
                reconstructPath(cameFrom, current);
                shortestPathLength = gScore[current.y][current.x];
                return;
            }

            openSet.splice(openSet.indexOf(current), 1);

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 },
            ];

            for (let neighbor of neighbors) {
                if (neighbor.x >= 0 && neighbor.x < mazeSize && neighbor.y >= 0 && neighbor.y < mazeSize) {
                    if (maze[neighbor.y][neighbor.x].classList.contains('obstacle')) continue;

                    let tentative_gScore = gScore[current.y][current.x] + 1;

                    if (tentative_gScore < gScore[neighbor.y][neighbor.x]) {
                        cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
                        gScore[neighbor.y][neighbor.x] = tentative_gScore;
                        fScore[neighbor.y][neighbor.x] = tentative_gScore + heuristic(neighbor, end);
                        if (!openSet.some((pos) => pos.x === neighbor.x && pos.y === neighbor.y)) {
                            openSet.push(neighbor);
                        }
                    }
                }
            }
        }
    }

    function reconstructPath(cameFrom, current) {
        while (cameFrom.has(`${current.x},${current.y}`)) {
            current = cameFrom.get(`${current.x},${current.y}`);
            if (!(current.x === 0 && current.y === 0)) {
                maze[current.y][current.x].classList.add('best-path');
            }
        }
    }

    startBtn.addEventListener('click', initMaze);

    // Mobile controls
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchend', handleTouchEnd, false);

    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) {
                movePlayer(1, 0); // Move right
            } else {
                movePlayer(-1, 0); // Move left
            }
        } else {
            if (dy > 0) {
                movePlayer(0, 1); // Move down
            } else {
                movePlayer(0, -1); // Move up
            }
        }
    }
});
