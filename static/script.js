// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const messageDiv = document.getElementById("message");

// Colors
const WHITE = "#FFFFFF";
const BLACK = "#1F2937";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const GRAY = "#64748B";

// Game state
let pencuriPos = "A";
let polisiPos = "HOME";
let gameOver = false;
let scale = 1;
let animationFrame;
let highlightedNodes = [];
let confettiActive = false;
let validMoveNodes = [];
let hoverNode = null;

// Animation state for thief
let isAnimating = false;
let animationProgress = 0;
let animationStartPos = null;
let animationEndPos = null;
let animationStartTime = 0;
const animationDuration = 500; // ms

// Animation state for police
let isPolisiAnimating = false;
let polisiAnimationProgress = 0;
let polisiAnimationStartPos = null;
let polisiAnimationEndPos = null;
let polisiAnimationStartTime = 0;
const polisiAnimationDuration = 500; // ms

// Define the graph structure and node positions
const jalur = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "F"],
  D: ["B", "G"],
  E: ["B", "F", "H"],
  F: ["C", "E", "I"],
  G: ["D"],
  H: ["E", "I", "J"],
  I: ["F", "H", "K"],
  J: ["H", "L"],
  K: ["I", "L"],
  L: ["J", "K", "HOME"],
  HOME: ["L"],
};

// Adjust positions to fix the overlap between L and HOME
const posisi = {
  A: [300, 100],
  B: [200, 200],
  C: [400, 200],
  D: [150, 300],
  E: [250, 300],
  F: [400, 300],
  G: [100, 400],
  H: [300, 400],
  I: [450, 400],
  J: [250, 500],
  K: [400, 500],
  L: [325, 520], // Moved L up a bit
  HOME: [325, 600], // Kept HOME at the bottom
};

// Initialize
function init() {
  // Handle responsive canvas
  handleResize();
  window.addEventListener("resize", handleResize);

  // Start game loop
  gameLoop();

  // Update valid moves
  updateValidMoves();
}

// Handle window resize for responsiveness
function handleResize() {
  const container = document.querySelector(".game-container");
  if (!container) return;

  const containerWidth = container.clientWidth;
  scale = Math.min(1, containerWidth / 600);

  // Update canvas display size (CSS)
  canvas.style.width = `${600 * scale}px`;
  canvas.style.height = `${650 * scale}px`;
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw game elements
  drawLabirin();
  drawHome();

  // Draw characters based on animation state
  if (isAnimating) {
    const currentTime = Date.now();
    const elapsed = currentTime - animationStartTime;
    animationProgress = Math.min(elapsed / animationDuration, 1);

    if (animationProgress >= 1) {
      isAnimating = false;
    } else {
      // Draw animated pencuri
      const startX = animationStartPos[0];
      const startY = animationStartPos[1];
      const endX = animationEndPos[0];
      const endY = animationEndPos[1];

      // Use easeInOutQuad for smoother animation
      const progress = easeInOutQuad(animationProgress);
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      drawPencuri(currentX, currentY);
    }
  }

  if (!isAnimating) {
    drawPencuri();
  }

  // Draw police with animation
  if (isPolisiAnimating) {
    const currentTime = Date.now();
    const elapsed = currentTime - polisiAnimationStartTime;
    polisiAnimationProgress = Math.min(elapsed / polisiAnimationDuration, 1);

    if (polisiAnimationProgress >= 1) {
      isPolisiAnimating = false;
    } else {
      // Draw animated polisi
      const startX = polisiAnimationStartPos[0];
      const startY = polisiAnimationStartPos[1];
      const endX = polisiAnimationEndPos[0];
      const endY = polisiAnimationEndPos[1];

      // Use easeInOutQuad for smoother animation
      const progress = easeInOutQuad(polisiAnimationProgress);
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      drawPolisi(currentX, currentY);
    }
  }

  if (!isPolisiAnimating) {
    drawPolisi();
  }

  // Continue animation
  animationFrame = requestAnimationFrame(gameLoop);
}

// Easing function for smoother animation
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Update valid moves - MODIFIED to show police valid moves
function updateValidMoves() {
  validMoveNodes = jalur[polisiPos] || [];
}

// Draw maze
function drawLabirin() {
  // Background
  ctx.fillStyle = "#F8FAFC"; // Light background
  ctx.fillRect(0, 0, 600, 650);

  // Draw paths
  ctx.strokeStyle = GRAY;
  ctx.lineWidth = 3;
  for (const node in posisi) {
    for (const neighbor of jalur[node] || []) {
      ctx.beginPath();
      ctx.moveTo(posisi[node][0], posisi[node][1]);
      ctx.lineTo(posisi[neighbor][0], posisi[neighbor][1]);
      ctx.stroke();
    }
  }

  // Draw nodes (except HOME which will be drawn separately)
  ctx.font = "20px Inter, sans-serif";
  ctx.textAlign = "center";
  for (const node in posisi) {
    if (node === "HOME") continue; // Skip HOME node, it will be drawn separately

    // Check if this node is a valid move for the police
    const isValidMove = !gameOver && validMoveNodes.includes(node);
    const isHovered = node === hoverNode;

    // Draw node highlight for valid moves
    if (isValidMove) {
      ctx.beginPath();
      ctx.arc(posisi[node][0], posisi[node][1], 22, 0, Math.PI * 2);
      ctx.fillStyle = isHovered
        ? "rgba(59, 130, 246, 0.4)" // Blue highlight for police
        : "rgba(59, 130, 246, 0.2)";
      ctx.fill();
    }

    // Draw node shadow
    ctx.beginPath();
    ctx.arc(posisi[node][0], posisi[node][1] + 3, 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();

    // Draw node
    ctx.beginPath();
    ctx.arc(posisi[node][0], posisi[node][1], 20, 0, Math.PI * 2);

    if (highlightedNodes.includes(node)) {
      // Highlight nodes in the path
      ctx.fillStyle = "#9333EA"; // Purple for path
    } else {
      ctx.fillStyle = BLACK;
    }

    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.fillText(node, posisi[node][0], posisi[node][1] + 7);
  }
}

// Draw home
function drawHome() {
  if (!posisi["HOME"]) return;

  const [x, y] = posisi["HOME"];
  const size = 40; // House size

  // Check if HOME is a valid move for the police
  const isValidMove = !gameOver && validMoveNodes.includes("HOME");
  const isHovered = "HOME" === hoverNode;

  // Draw node highlight for valid moves
  if (isValidMove) {
    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fillStyle = isHovered
      ? "rgba(59, 130, 246, 0.4)" // Blue highlight for police
      : "rgba(59, 130, 246, 0.2)";
    ctx.fill();
  }

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.arc(x, y + 5, 35, 0, Math.PI * 2);
  ctx.fill();

  // Draw base circle
  ctx.beginPath();
  ctx.arc(x, y, 35, 0, Math.PI * 2);
  ctx.fillStyle = GREEN;
  ctx.fill();

  // Draw house
  ctx.fillStyle = WHITE;

  // House body
  ctx.fillRect(x - size / 3, y - size / 4, (size * 2) / 3, size / 2);

  // Roof
  ctx.beginPath();
  ctx.moveTo(x - size / 3 - 5, y - size / 4);
  ctx.lineTo(x, y - size / 2 - 5);
  ctx.lineTo(x + size / 3 + 5, y - size / 4);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = "#8B5A2B"; // Brown
  ctx.fillRect(x - size / 10, y - size / 8, size / 5, size / 3);

  // Window
  ctx.fillStyle = "#87CEEB"; // Sky blue
  ctx.fillRect(x + size / 6, y - size / 8, size / 6, size / 6);

  // Window frame
  ctx.strokeStyle = "#663300";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + size / 6, y - size / 8, size / 6, size / 6);
  ctx.beginPath();
  ctx.moveTo(x + size / 6, y - size / 8 + size / 12);
  ctx.lineTo(x + size / 6 + size / 6, y - size / 8 + size / 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size / 6 + size / 12, y - size / 8);
  ctx.lineTo(x + size / 6 + size / 12, y - size / 8 + size / 6);
  ctx.stroke();

  // Text
  ctx.fillStyle = BLACK;
  ctx.font = "bold 14px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HOME", x, y + size / 2 + 5);
}

// Draw thief
function drawPencuri(customX, customY) {
  const [defaultX, defaultY] = posisi[pencuriPos];
  const x = customX !== undefined ? customX : defaultX;
  const y = customY !== undefined ? customY : defaultY;

  // Shadow
  ctx.beginPath();
  ctx.arc(x, y + 3, 22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  // Thief
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = RED;
  ctx.fill();

  // Thief icon (simple face)
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(x - 5, y - 3, 4, 0, Math.PI * 2); // Left eye
  ctx.arc(x + 5, y - 3, 4, 0, Math.PI * 2); // Right eye
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 7, y + 5);
  ctx.quadraticCurveTo(x, y + 10, x + 7, y + 5); // Smile
  ctx.stroke();

  // Add a mask
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 5);
  ctx.lineTo(x + 12, y - 5);
  ctx.lineTo(x + 10, y + 2);
  ctx.lineTo(x - 10, y + 2);
  ctx.closePath();
  ctx.fillStyle = "#111111";
  ctx.fill();
}

// Draw police
function drawPolisi(customX, customY) {
  const [defaultX, defaultY] = posisi[polisiPos];
  const x = customX !== undefined ? customX : defaultX;
  const y = customY !== undefined ? customY : defaultY;

  // Shadow
  ctx.beginPath();
  ctx.arc(x, y + 3, 22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  // Police
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = BLUE;
  ctx.fill();

  // Police hat
  ctx.fillStyle = "#1E3A8A"; // Darker blue
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Police badge
  ctx.fillStyle = "#FBBF24"; // Yellow
  ctx.beginPath();
  ctx.arc(x, y + 5, 5, 0, Math.PI * 2);
  ctx.fill();

  // Police eyes
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(x - 5, y - 3, 3, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Get clicked node
function getClickedNode(x, y) {
  for (const node in posisi) {
    const [nx, ny] = posisi[node];
    const distance = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
    const radius = node === "HOME" ? 35 : 20;
    if (distance <= radius) {
      return node;
    }
  }
  return null;
}

// Start animation between nodes for thief
function startAnimation(startNode, endNode) {
  if (!posisi[startNode] || !posisi[endNode]) return;

  animationStartPos = posisi[startNode];
  animationEndPos = posisi[endNode];
  animationProgress = 0;
  animationStartTime = Date.now();
  isAnimating = true;
}

// Start animation between nodes for police
function startPolisiAnimation(startNode, endNode) {
  if (!posisi[startNode] || !posisi[endNode]) return;

  polisiAnimationStartPos = posisi[startNode];
  polisiAnimationEndPos = posisi[endNode];
  polisiAnimationProgress = 0;
  polisiAnimationStartTime = Date.now();
  isPolisiAnimating = true;
}

// Update game state
function updateGame(data) {
  const oldPencuriPos = pencuriPos;
  const oldPolisiPos = polisiPos;

  pencuriPos = data.pencuri_pos;
  polisiPos = data.polisi_pos;
  gameOver = data.game_over;

  // Start animation for pencuri movement
  if (oldPencuriPos !== pencuriPos) {
    startAnimation(oldPencuriPos, pencuriPos);
  }

  // Start animation for polisi movement
  if (oldPolisiPos !== polisiPos) {
    startPolisiAnimation(oldPolisiPos, polisiPos);
  }

  // Update valid moves
  updateValidMoves();

  if (gameOver) {
    // Create message content with button inside
    messageDiv.innerHTML =
      data.message +
      '<button id="restartBtn" class="restart-btn">Main Lagi</button>';
    messageDiv.classList.remove("hidden");

    // Add event listener to the new button
    document.getElementById("restartBtn").addEventListener("click", () => {
      fetch("/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          updateGame(data);
          messageDiv.classList.add("hidden");
          confettiActive = false;
        });
    });

    // Celebrate with confetti if thief wins
    if (data.message.includes("Pencuri Menang")) {
      createConfetti();
    }
  }
}

// Create confetti effect
function createConfetti() {
  if (confettiActive) return;
  confettiActive = true;

  const colors = [
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];
  const totalParticles = 100;
  const particles = [];

  // Create particles
  for (let i = 0; i < totalParticles; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: Math.random() * 10 - 5,
      speedY: Math.random() * -15 - 5,
      gravity: 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
    });
  }

  // Animate confetti
  function animateConfetti() {
    if (!confettiActive) return;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += p.gravity;
      p.rotation += p.rotationSpeed;

      // Draw confetti
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      // Remove particles that are off-screen
      if (p.y > canvas.height) {
        particles.splice(i, 1);
        i--;
      }
    }

    // Stop animation when all particles are gone
    if (particles.length === 0) {
      confettiActive = false;
    } else {
      requestAnimationFrame(animateConfetti);
    }
  }

  animateConfetti();
}

// Find path using BFS
function findPath(start, end) {
  const queue = [[start]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === end) {
      return path;
    }

    if (!visited.has(node)) {
      visited.add(node);
      for (const neighbor of jalur[node] || []) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null;
}

// Highlight path
function showPath(path) {
  if (!path) return;

  highlightedNodes = path;

  // Clear highlight after a delay
  setTimeout(() => {
    highlightedNodes = [];
  }, 1000);
}

// Handle mouse move for hover effects
function handleMouseMove(e) {
  if (gameOver || isPolisiAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const hoveredNode = getClickedNode(x, y);

  // Only update if it's a valid move
  if (hoveredNode && validMoveNodes.includes(hoveredNode)) {
    hoverNode = hoveredNode;
    canvas.style.cursor = "pointer";
  } else {
    hoverNode = null;
    canvas.style.cursor = "default";
  }
}

// Event listeners
canvas.addEventListener("click", (e) => {
  if (gameOver || isPolisiAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;

  const clickedNode = getClickedNode(x, y);
  if (clickedNode && validMoveNodes.includes(clickedNode)) {
    // Show path before moving
    const path = findPath(polisiPos, clickedNode);
    showPath(path);

    fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: clickedNode }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== "invalid_move") {
          updateGame(data);
        }
      });
  }
});

canvas.addEventListener("mousemove", handleMouseMove);

// Touch support for mobile
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent scrolling

  if (gameOver || isPolisiAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = (touch.clientX - rect.left) / scale;
  const y = (touch.clientY - rect.top) / scale;

  const clickedNode = getClickedNode(x, y);
  if (clickedNode && validMoveNodes.includes(clickedNode)) {
    // Show path before moving
    const path = findPath(polisiPos, clickedNode);
    showPath(path);

    fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: clickedNode }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== "invalid_move") {
          updateGame(data);
        }
      });
  }
});

// Add keyboard support
document.addEventListener("keydown", (e) => {
  if (gameOver || isPolisiAnimating) {
    if (e.key === "Enter" || e.key === " ") {
      // Find and click the restart button if it exists
      const restartBtn = document.getElementById("restartBtn");
      if (restartBtn) restartBtn.click();
    }
    return;
  }

  // Get current position coordinates
  const [currentX, currentY] = posisi[polisiPos];

  // Find the closest valid move in each direction
  let closestUp = null,
    closestDown = null,
    closestLeft = null,
    closestRight = null;
  let minUpDist = Number.POSITIVE_INFINITY,
    minDownDist = Number.POSITIVE_INFINITY,
    minLeftDist = Number.POSITIVE_INFINITY,
    minRightDist = Number.POSITIVE_INFINITY;

  for (const node of validMoveNodes) {
    const [nodeX, nodeY] = posisi[node];
    const dx = nodeX - currentX;
    const dy = nodeY - currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Up
    if (nodeY < currentY && dist < minUpDist) {
      minUpDist = dist;
      closestUp = node;
    }
    // Down
    if (nodeY > currentY && dist < minDownDist) {
      minDownDist = dist;
      closestDown = node;
    }
    // Left
    if (nodeX < currentX && dist < minLeftDist) {
      minLeftDist = dist;
      closestLeft = node;
    }
    // Right
    if (nodeX > currentX && dist < minRightDist) {
      minRightDist = dist;
      closestRight = node;
    }
  }

  let targetNode = null;

  // Handle arrow keys
  switch (e.key) {
    case "ArrowUp":
      targetNode = closestUp;
      break;
    case "ArrowDown":
      targetNode = closestDown;
      break;
    case "ArrowLeft":
      targetNode = closestLeft;
      break;
    case "ArrowRight":
      targetNode = closestRight;
      break;
  }

  if (targetNode) {
    // Show path before moving
    const path = findPath(polisiPos, targetNode);
    showPath(path);

    fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ node: targetNode }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== "invalid_move") {
          updateGame(data);
        }
      });
  }
});

// Add a simple tutorial
function showTutorial() {
  const tutorial = document.createElement("div");
  tutorial.className = "tutorial";
  tutorial.innerHTML = `
        <div class="tutorial-content">
            <h2>Cara Bermain</h2>
            <p>1. Klik pada node yang terhubung untuk menggerakkan polisi</p>
            <p>2. Kejar pencuri sebelum dia mencapai rumah (HOME)</p>
            <p>3. Pencuri bergerak otomatis menuju HOME</p>
            <button id="closeTutorial">Mulai Bermain</button>
        </div>
    `;

  document.body.appendChild(tutorial);

  document.getElementById("closeTutorial").addEventListener("click", () => {
    tutorial.remove();
  });
}

// Show tutorial on first load
if (!localStorage.getItem("tutorialShown")) {
  setTimeout(showTutorial, 1000);
  localStorage.setItem("tutorialShown", "true");
}

// Initialize the game
init();
