// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const messageDiv = document.getElementById("message");
const debugInfoDiv = document.getElementById("debugInfo");
const thiefStatusEl = document.getElementById("thiefStatus");
const bgMusic = document.getElementById("bgMusic");
const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");

// Colors
const WHITE = "#FFFFFF";
const BLACK = "#1F2937";
const RED = "#EF4444";
const BLUE = "#3B82F6";
const GREEN = "#10B981";
const GRAY = "#64748B";
const ORANGE = "#F97316";
const PURPLE = "#9333EA";
const YELLOW = "#FBBF24";

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
let debugInfo = [];
let dangerMode = false; // Track if thief is in danger mode
let showDebug = false; // Toggle for debug info
let soundEnabled = false; // Sound toggle
let moveCount = 0; // Track number of moves

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

  // Add debug toggle button event listener
  const debugToggle = document.getElementById("debugToggle");
  if (debugToggle) {
    debugToggle.addEventListener("click", () => {
      showDebug = !showDebug;
      debugToggle.textContent = showDebug
        ? "Sembunyikan Debug"
        : "Tampilkan Debug";
      debugToggle.innerHTML = showDebug
        ? '<i class="fas fa-bug mr-2"></i> Sembunyikan Debug'
        : '<i class="fas fa-bug mr-2"></i> Tampilkan Debug';
      debugInfoDiv.classList.toggle("hidden", !showDebug);
    });
  }

  // Add restart button event listener
  const restartBtn = document.getElementById("restartGame");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      fetch("/restart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          updateGame(data);
          messageDiv.classList.add("hidden");
          confettiActive = false;
          dangerMode = false;
          moveCount = 0;
        });
    });
  }

  // Add sound toggle button event listener
  const soundToggle = document.getElementById("soundToggle");
  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      soundToggle.innerHTML = soundEnabled
        ? '<i class="fas fa-volume-up"></i>'
        : '<i class="fas fa-volume-mute"></i>';

      if (soundEnabled) {
        bgMusic.volume = 0.3;
        bgMusic.play();
      } else {
        bgMusic.pause();
      }
    });
  }

  // Add fullscreen toggle button event listener
  const fullscreenToggle = document.getElementById("fullscreenToggle");
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
        fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i>';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i>';
        }
      }
    });
  }

  // Show tutorial on first load
  if (!localStorage.getItem("tutorialShown")) {
    setTimeout(showTutorial, 1000);
    localStorage.setItem("tutorialShown", "true");
  }
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

// Update fungsi drawLabirin untuk visualisasi bahaya yang lebih baik
function drawLabirin() {
  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 650);
  gradient.addColorStop(0, "#1e293b");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 650);

  // Draw grid lines for better visualization
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;

  // Horizontal grid lines
  for (let y = 50; y < 650; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Vertical grid lines
  for (let x = 50; x < 600; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 650);
    ctx.stroke();
  }

  // Draw paths with glow effect
  ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const node in posisi) {
    for (const neighbor of jalur[node] || []) {
      ctx.beginPath();
      ctx.moveTo(posisi[node][0], posisi[node][1]);
      ctx.lineTo(posisi[neighbor][0], posisi[neighbor][1]);
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = "rgba(148, 163, 184, 0.5)";
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // Draw danger zone with different levels
  if (dangerMode) {
    const [x, y] = posisi[pencuriPos];

    // Visualisasi tingkat bahaya yang berbeda
    if (dangerMode === "high") {
      // Bahaya tinggi - lingkaran merah yang lebih besar dan lebih pekat
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; // Red with higher opacity
      ctx.fill();

      // Tambahkan lingkaran kedua untuk efek visual
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.3)"; // Red with even higher opacity
      ctx.fill();

      // Update thief status
      if (thiefStatusEl) {
        thiefStatusEl.textContent = "BAHAYA TINGGI!";
        thiefStatusEl.className = "text-red-500 font-bold animate-pulse";
      }
    } else if (dangerMode === "medium") {
      // Bahaya sedang - lingkaran oranye
      ctx.beginPath();
      ctx.arc(x, y, 60, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(249, 115, 22, 0.15)"; // Orange with low opacity
      ctx.fill();

      // Update thief status
      if (thiefStatusEl) {
        thiefStatusEl.textContent = "Waspada!";
        thiefStatusEl.className = "text-orange-500 font-bold";
      }
    }
  } else {
    // Update thief status when safe
    if (thiefStatusEl) {
      thiefStatusEl.textContent = "Bergerak ke HOME";
      thiefStatusEl.className = "text-gray-300";
    }
  }

  // Draw nodes (except HOME which will be drawn separately)
  ctx.font = "bold 20px Poppins, sans-serif";
  ctx.textAlign = "center";
  for (const node in posisi) {
    if (node === "HOME") continue; // Skip HOME node, it will be drawn separately

    // Check if this node is a valid move for the police
    const isValidMove = !gameOver && validMoveNodes.includes(node);
    const isHovered = node === hoverNode;

    // Draw node highlight for valid moves
    if (isValidMove) {
      // Outer glow for valid moves
      ctx.beginPath();
      ctx.arc(posisi[node][0], posisi[node][1], 30, 0, Math.PI * 2);
      ctx.fillStyle = isHovered
        ? "rgba(59, 130, 246, 0.4)" // Blue highlight for police
        : "rgba(59, 130, 246, 0.2)";
      ctx.fill();

      // Pulsing effect for valid moves
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(
          posisi[node][0],
          posisi[node][1],
          35 + Math.sin(Date.now() / 200) * 3,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw node shadow
    ctx.beginPath();
    ctx.arc(posisi[node][0], posisi[node][1] + 3, 20, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fill();

    // Draw node
    ctx.beginPath();
    ctx.arc(posisi[node][0], posisi[node][1], 20, 0, Math.PI * 2);

    if (highlightedNodes.includes(node)) {
      // Highlight nodes in the path
      ctx.fillStyle = PURPLE; // Purple for path
    } else {
      // Gradient fill for nodes
      const nodeGradient = ctx.createRadialGradient(
        posisi[node][0],
        posisi[node][1],
        0,
        posisi[node][0],
        posisi[node][1],
        20
      );
      nodeGradient.addColorStop(0, "#334155");
      nodeGradient.addColorStop(1, "#1e293b");
      ctx.fillStyle = nodeGradient;
    }

    ctx.fill();

    // Add subtle inner border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = WHITE;
    ctx.fillText(node, posisi[node][0], posisi[node][1] + 7);
  }
}

// Draw home
function drawHome() {
  if (!posisi["HOME"]) return;

  const [x, y] = posisi["HOME"];
  const homeSize = 40; // House size

  // Check if HOME is a valid move for the police  = posisi["HOME"]
  const size = 40; // House size

  // Check if HOME is a valid move for the police
  const isValidMove = !gameOver && validMoveNodes.includes("HOME");
  const isHovered = "HOME" === hoverNode;

  // Draw node highlight for valid moves
  if (isValidMove) {
    ctx.beginPath();
    ctx.arc(x, y, 45, 0, Math.PI * 2);
    ctx.fillStyle = isHovered
      ? "rgba(59, 130, 246, 0.4)" // Blue highlight for police
      : "rgba(59, 130, 246, 0.2)";
    ctx.fill();

    // Pulsing effect for valid moves when hovered
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, 50 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Draw shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(x, y + 5, 40, 0, Math.PI * 2);
  ctx.fill();

  // Draw base circle with gradient
  const homeGradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
  homeGradient.addColorStop(0, "#10b981");
  homeGradient.addColorStop(1, "#059669");

  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fillStyle = homeGradient;
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = "rgba(16, 185, 129, 0.7)";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Draw house
  ctx.fillStyle = WHITE;

  // House body
  ctx.fillRect(
    x - homeSize / 3,
    y - homeSize / 4,
    (homeSize * 2) / 3,
    homeSize / 2
  );

  // Roof
  ctx.beginPath();
  ctx.moveTo(x - homeSize / 3 - 5, y - homeSize / 4);
  ctx.lineTo(x, y - homeSize / 2 - 5);
  ctx.lineTo(x + homeSize / 3 + 5, y - homeSize / 4);
  ctx.closePath();
  ctx.fill();

  // Door
  ctx.fillStyle = "#8B5A2B"; // Brown
  ctx.fillRect(x - homeSize / 10, y - homeSize / 8, homeSize / 5, homeSize / 3);

  // Window
  ctx.fillStyle = "#87CEEB"; // Sky blue
  ctx.fillRect(x + homeSize / 6, y - homeSize / 8, homeSize / 6, homeSize / 6);

  // Window frame
  ctx.strokeStyle = "#663300";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    x + homeSize / 6,
    y - homeSize / 8,
    homeSize / 6,
    homeSize / 6
  );
  ctx.beginPath();
  ctx.moveTo(x + homeSize / 6, y - homeSize / 8 + homeSize / 12);
  ctx.lineTo(x + homeSize / 6 + homeSize / 6, y - homeSize / 8 + homeSize / 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + homeSize / 6 + homeSize / 12, y - homeSize / 8);
  ctx.lineTo(x + homeSize / 6 + homeSize / 12, y - homeSize / 8 + homeSize / 6);
  ctx.stroke();

  // Text
  ctx.fillStyle = WHITE;
  ctx.font = "bold 14px Poppins, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HOME", x, y + homeSize / 2 + 10);
}

// Update fungsi drawPencuri untuk visualisasi bahaya yang lebih baik
function drawPencuri(customX, customY) {
  const [defaultX, defaultY] = posisi[pencuriPos];
  const x = customX !== undefined ? customX : defaultX;
  const y = customY !== undefined ? customY : defaultY;

  // Shadow
  ctx.beginPath();
  ctx.arc(x, y + 3, 22, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  // Thief with different colors based on danger level
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);

  // Warna berbeda berdasarkan tingkat bahaya
  if (dangerMode === "high") {
    // Gradient for high danger
    const dangerGradient = ctx.createRadialGradient(x, y, 0, x, y, 22);
    dangerGradient.addColorStop(0, "#ef4444");
    dangerGradient.addColorStop(1, "#b91c1c");
    ctx.fillStyle = dangerGradient;
  } else if (dangerMode === "medium") {
    // Gradient for medium danger
    const warningGradient = ctx.createRadialGradient(x, y, 0, x, y, 22);
    warningGradient.addColorStop(0, "#f97316");
    warningGradient.addColorStop(1, "#c2410c");
    ctx.fillStyle = warningGradient;
  } else {
    // Gradient for safe
    const safeGradient = ctx.createRadialGradient(x, y, 0, x, y, 22);
    safeGradient.addColorStop(0, "#9333ea");
    safeGradient.addColorStop(1, "#7e22ce");
    ctx.fillStyle = safeGradient;
  }

  ctx.fill();

  // Add glow effect based on danger level
  if (dangerMode === "high") {
    ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (dangerMode === "medium") {
    ctx.shadowColor = "rgba(249, 115, 22, 0.7)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Thief icon (simple face)
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(x - 5, y - 3, 4, 0, Math.PI * 2); // Left eye
  ctx.arc(x + 5, y - 3, 4, 0, Math.PI * 2); // Right eye
  ctx.fill();

  // Expression changes based on danger mode
  if (dangerMode === "high") {
    // Ekspresi sangat khawatir
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 8);
    ctx.quadraticCurveTo(x, y + 2, x + 7, y + 8); // Frown besar
    ctx.stroke();

    // Alis mengerut
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x - 2, y - 5);
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x + 2, y - 5);
    ctx.stroke();
  } else if (dangerMode === "medium") {
    // Ekspresi khawatir
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 7);
    ctx.quadraticCurveTo(x, y + 4, x + 7, y + 7); // Frown sedang
    ctx.stroke();
  } else {
    // Ekspresi normal/senang
    ctx.beginPath();
    ctx.moveTo(x - 7, y + 5);
    ctx.quadraticCurveTo(x, y + 10, x + 7, y + 5); // Smile
    ctx.stroke();
  }

  // Add a mask
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 5);
  ctx.lineTo(x + 12, y - 5);
  ctx.lineTo(x + 10, y + 2);
  ctx.lineTo(x - 10, y + 2);
  ctx.closePath();
  ctx.fillStyle = "#111111";
  ctx.fill();

  // Add a pulsing effect based on danger level
  if (dangerMode === "high") {
    // Efek pulsasi cepat untuk bahaya tinggi
    ctx.beginPath();
    ctx.arc(x, y, 25 + Math.sin(Date.now() / 100) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = RED;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Lingkaran kedua untuk efek visual
    ctx.beginPath();
    ctx.arc(x, y, 35 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (dangerMode === "medium") {
    // Efek pulsasi sedang untuk bahaya sedang
    ctx.beginPath();
    ctx.arc(x, y, 25 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
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

  // Police with gradient
  const policeGradient = ctx.createRadialGradient(x, y, 0, x, y, 22);
  policeGradient.addColorStop(0, "#3b82f6");
  policeGradient.addColorStop(1, "#1d4ed8");

  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fillStyle = policeGradient;
  ctx.fill();

  // Add glow effect
  ctx.shadowColor = "rgba(59, 130, 246, 0.7)";
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Police hat
  ctx.fillStyle = "#1E3A8A"; // Darker blue
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Police badge
  ctx.fillStyle = YELLOW; // Yellow
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
    const radius = node === "HOME" ? 40 : 20;
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

  // Play move sound
  if (soundEnabled) {
    moveSound.currentTime = 0;
    moveSound.play();
  }
}

// Update fungsi updateGame untuk mendeteksi tingkat bahaya dengan lebih baik
function updateGame(data) {
  const oldPencuriPos = pencuriPos;
  const oldPolisiPos = polisiPos;

  pencuriPos = data.pencuri_pos;
  polisiPos = data.polisi_pos;
  gameOver = data.game_over;
  moveCount++;

  // Update debug info if available
  if (data.debug_info) {
    debugInfo = data.debug_info;
    updateDebugInfo();

    // Deteksi tingkat bahaya yang lebih baik
    const highDanger = debugInfo.some(
      (info) =>
        info.includes("BAHAYA TINGGI") || info.includes("Polisi berdekatan")
    );

    const mediumDanger = debugInfo.some(
      (info) =>
        info.includes("BAHAYA SEDANG") ||
        info.includes("Polisi dekat") ||
        info.includes("Polisi dapat mencapai")
    );

    // Set tingkat bahaya
    if (highDanger) {
      dangerMode = "high";
    } else if (mediumDanger) {
      dangerMode = "medium";
    } else {
      dangerMode = false;
    }
  }

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
    messageDiv.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="text-3xl font-bold mb-4">${data.message}</div>
        <div class="text-lg mb-6">Total Langkah: ${moveCount}</div>
        <button id="restartBtn" class="restart-btn">
          <i class="fas fa-redo mr-2"></i> Main Lagi
        </button>
      </div>
    `;
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
          dangerMode = false;
          moveCount = 0;
        });
    });

    // Play sound and celebrate with confetti if thief wins
    if (data.message.includes("Pencuri Menang")) {
      if (soundEnabled) {
        loseSound.play();
      }
      createConfetti();
    } else {
      if (soundEnabled) {
        winSound.play();
      }
    }
  }
}

// Update fungsi updateDebugInfo untuk menampilkan tingkat bahaya dengan lebih baik
function updateDebugInfo() {
  if (!debugInfoDiv) return;

  // Clear previous content
  debugInfoDiv.innerHTML = "";

  // Add title
  const title = document.createElement("h3");
  title.className = "font-bold text-lg mb-2";
  title.textContent = "Debug Info (Pemikiran Pencuri)";
  debugInfoDiv.appendChild(title);

  // Add each debug line
  debugInfo.forEach((line) => {
    const p = document.createElement("p");
    p.className = "text-sm mb-1";

    // Highlight important info with better color coding
    if (line.includes("BAHAYA TINGGI")) {
      p.className += " text-red-600 font-bold";
    } else if (line.includes("BAHAYA SEDANG") || line.includes("WASPADA")) {
      p.className += " text-orange-600 font-bold";
    } else if (line.includes("Kasus khusus")) {
      p.className += " text-purple-600 font-bold";
    } else if (line.includes("Memilih")) {
      p.className += " text-green-600 font-bold";
    } else if (line.includes("Evaluasi")) {
      p.className += " text-gray-600";
    }

    p.textContent = line;
    debugInfoDiv.appendChild(p);
  });

  // Tambahkan ringkasan status bahaya
  const dangerSummary = document.createElement("div");
  dangerSummary.className = "mt-3 p-2 rounded-md";

  if (dangerMode === "high") {
    dangerSummary.className += " bg-red-100 border border-red-300";
    dangerSummary.innerHTML =
      "<span class='font-bold text-red-600'>Status: BAHAYA TINGGI</span> - Polisi berdekatan!";
  } else if (dangerMode === "medium") {
    dangerSummary.className += " bg-orange-100 border border-orange-300";
    dangerSummary.innerHTML =
      "<span class='font-bold text-orange-600'>Status: BAHAYA SEDANG</span> - Polisi dekat!";
  } else {
    dangerSummary.className += " bg-green-100 border border-green-300";
    dangerSummary.innerHTML =
      "<span class='font-bold text-green-600'>Status: AMAN</span> - Polisi jauh";
  }

  debugInfoDiv.appendChild(dangerSummary);
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
    "#ffffff",
    "#f97316",
    "#10b981",
  ];
  const totalParticles = 150;
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
  tutorial.className =
    "fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80";
  tutorial.innerHTML = `
    <div class="bg-gray-900 p-8 rounded-xl max-w-lg border border-gray-700 shadow-2xl transform transition-all">
      <h2 class="text-2xl font-bold text-white mb-6 text-center">Cara Bermain</h2>
      
      <div class="space-y-4 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">1</div>
          <p class="text-gray-300">Klik pada node yang terhubung untuk menggerakkan polisi</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">2</div>
          <p class="text-gray-300">Kejar pencuri sebelum dia mencapai rumah (HOME)</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">3</div>
          <p class="text-gray-300">Pencuri bergerak otomatis dengan AI cerdas</p>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">4</div>
          <p class="text-gray-300">Gunakan tombol panah keyboard untuk bergerak lebih cepat</p>
        </div>
      </div>
      
      <div class="text-center">
        <button id="closeTutorial" class="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors">
          Mulai Bermain
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(tutorial);

  document.getElementById("closeTutorial").addEventListener("click", () => {
    tutorial.classList.add("opacity-0");
    setTimeout(() => {
      tutorial.remove();
    }, 300);
  });
}

// Initialize the game
init();
