import { useEffect, useRef, useState } from "react";
import { GameEngine } from "../game/GameEngine";
import { TILE_SIZE, ROWS, COLS, GAME_STATE } from "../game/constants";
import { TILE_MAP, TILE } from "../game/TileMap";
import mapSrc from "../assets/map.jpg";
import bethFrontSrc from "../assets/beth-front.png";
import bethBackSrc from "../assets/beth-back.png";
import bethWarningSrc from "../assets/beth-warning.png";
import bethCaughtSrc from "../assets/beth-caught.png";
// Student images - rename these files as needed
import studentStillSrc from "../assets/student-still.png";
import studentThrowingSrc from "../assets/student-throwing.png";
import studentCaughtSrc from "../assets/student-caught.png";
import caughtBannerSrc from "../assets/caught-banner.png";
import tryAgainBtnSrc from "../assets/try-again-btn.png";
import thundSrc from "../assets/thund.png";
import highlightSrc from "../assets/student-highlight.png";
import eraserIndicatorSrc from "../assets/eraser-indicator.png";
import HUD from "./HUD";

// Offset to move students up slightly
const STUDENT_Y_OFFSET = -5;

function drawStudent(ctx, student, studentImgs, isThrowing, isCaught, highlightImg, eraserIndicatorImg) {
  // Choose pose based on state: caught > throwing > still
  let img;
  if (isCaught) {
    img = studentImgs.caught;
  } else if (isThrowing) {
    img = studentImgs.throwing;
  } else {
    img = studentImgs.still;
  }
  const drawY = student.y + STUDENT_Y_OFFSET;

  // Draw highlight image for students who need the eraser AND have never had it before
  if (student.needsBall && !student.isCaught && !student.hasHadThund && highlightImg && highlightImg.naturalWidth) {
    // Draw highlight image instead of student image
    ctx.drawImage(highlightImg, student.x - 2, drawY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
  } else {
    // Draw normal student image when not highlighted
    if (img && img.naturalWidth) {
      // Enable high-quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, student.x, drawY, TILE_SIZE, TILE_SIZE);
    } else {
      // Fallback: draw simple shape
      ctx.fillStyle = "#2E86C1";
      ctx.fillRect(student.x + 8, drawY + 14, 16, 14);
      ctx.fillStyle = "#F5CBA7";
      ctx.fillRect(student.x + 10, drawY + 2, 12, 12);
      ctx.fillStyle = "#000";
      ctx.fillRect(student.x + 13, drawY + 6, 2, 2);
      ctx.fillRect(student.x + 17, drawY + 6, 2, 2);
    }
  }

  // Eraser indicator (player focus)
  if (student.hasThund && eraserIndicatorImg && eraserIndicatorImg.naturalWidth) {
    ctx.drawImage(eraserIndicatorImg, student.x - 2, drawY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
  }
}

function drawBethShape(ctx, beth) {
  // Robe / body
  let color = "#006400"; // Green (Not Watching)
  if (beth.state === "WATCHING") color = "#8B0000"; // Red (Watching)
  else if (beth.state === "WARNING") color = "#FF8C00"; // Orange (Warning)

  ctx.fillStyle = color;
  ctx.fillRect(beth.x + 6, beth.y + 14, 20, 18);

  // Head
  ctx.fillStyle = "#FAD7A0";
  ctx.fillRect(beth.x + 8, beth.y + 2, 16, 14);

  // Eyes
  ctx.fillStyle = "#000";
  ctx.fillRect(beth.x + 11, beth.y + 7, 2, 2);
  ctx.fillRect(beth.x + 17, beth.y + 7, 2, 2);

  // Authority outline
  ctx.strokeStyle = "#000";
  ctx.strokeRect(beth.x, beth.y, 32, 32);
}

function drawTileMap(ctx, width, height) {
  // Floor
  ctx.fillStyle = "#BCAAA4";
  ctx.fillRect(0, 0, width, height);

  // Tiles
  TILE_MAP.forEach((row, r) => {
    row.forEach((cell, c) => {
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      if (cell === TILE.DESK) {
        // desk top
        ctx.fillStyle = "#8B5A2B";
        ctx.fillRect(x + 4, y + 8, TILE_SIZE - 8, TILE_SIZE - 12);
        // legs
        ctx.fillStyle = "#6D4C41";
        ctx.fillRect(x + 6, y + 18, 4, 4);
        ctx.fillRect(x + TILE_SIZE - 10, y + 18, 4, 4);
      } else if (cell === TILE.FRONT) {
        ctx.fillStyle = "#6D4C41";
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    });
  });

  // grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, height);
    ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * TILE_SIZE);
    ctx.lineTo(width, j * TILE_SIZE);
    ctx.stroke();
  }
}

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const engineRef = useRef(new GameEngine());
  const bethImgsRef = useRef({ front: null, back: null, warning: null });
  const studentImgsRef = useRef({ still: null, throwing: null });
  const caughtBannerRef = useRef(null);
  const thundImgRef = useRef(null);
  const highlightImgRef = useRef(null);
  const eraserIndicatorImgRef = useRef(null);

  // React state to track engine state for HUD updates (e.g., GAME_OVER)
  const [engineState, setEngineState] = useState(engineRef.current.state);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [hearts, setHearts] = useState(3);
  const [wrongPassHighlight, setWrongPassHighlight] = useState(false);
  const prevEngineStateRef = useRef(engineRef.current.state);
  
  // Blinking banner state
  const [bannerVisible, setBannerVisible] = useState(true);
  const blinkIntervalRef = useRef(null);
  const blinkTimeoutRef = useRef(null);

  let lastTime = 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Disable blur → pixel-art look
    ctx.imageSmoothingEnabled = false;

    // Beth images - load into persistent ref for drawing
    const frontImg = new Image();
    frontImg.src = bethFrontSrc;
    frontImg.onload = () => (bethImgsRef.current.front = frontImg);
    frontImg.onerror = () => (bethImgsRef.current.front = null);

    const backImg = new Image();
    backImg.src = bethBackSrc;
    backImg.onload = () => (bethImgsRef.current.back = backImg);
    backImg.onerror = () => (bethImgsRef.current.back = null);

    const warningImg = new Image();
    warningImg.src = bethWarningSrc;
    warningImg.onload = () => (bethImgsRef.current.warning = warningImg);
    warningImg.onerror = () => (bethImgsRef.current.warning = null);

    const caughtBethImg = new Image();
    caughtBethImg.src = bethCaughtSrc;
    caughtBethImg.onload = () => (bethImgsRef.current.caught = caughtBethImg);
    caughtBethImg.onerror = () => (bethImgsRef.current.caught = null);

    // Student images - load into persistent ref for drawing
    const stillImg = new Image();
    stillImg.src = studentStillSrc;
    stillImg.onload = () => (studentImgsRef.current.still = stillImg);
    stillImg.onerror = () => (studentImgsRef.current.still = null);

    const throwingImg = new Image();
    throwingImg.src = studentThrowingSrc;
    throwingImg.onload = () => (studentImgsRef.current.throwing = throwingImg);
    throwingImg.onerror = () => (studentImgsRef.current.throwing = null);

    const caughtImg = new Image();
    caughtImg.src = studentCaughtSrc;
    caughtImg.onload = () => (studentImgsRef.current.caught = caughtImg);
    caughtImg.onerror = () => (studentImgsRef.current.caught = null);

    // Load caught banner
    const bannerImg = new Image();
    bannerImg.src = caughtBannerSrc;
    bannerImg.onload = () => (caughtBannerRef.current = bannerImg);
    bannerImg.onerror = () => (caughtBannerRef.current = null);

    // Load eraser image
    const thundImg = new Image();
    thundImg.src = thundSrc;
    thundImg.onload = () => (thundImgRef.current = thundImg);
    thundImg.onerror = () => (thundImgRef.current = null);

    // Load highlight image
    const highlightImg = new Image();
    highlightImg.src = highlightSrc;
    highlightImg.onload = () => (highlightImgRef.current = highlightImg);
    highlightImg.onerror = () => (highlightImgRef.current = null);

    // Load eraser indicator image
    const eraserIndicatorImg = new Image();
    eraserIndicatorImg.src = eraserIndicatorSrc;
    eraserIndicatorImg.onload = () => (eraserIndicatorImgRef.current = eraserIndicatorImg);
    eraserIndicatorImg.onerror = () => (eraserIndicatorImgRef.current = null);

    // Background canvas (image map with fallback)
    const bgCanvas = bgCanvasRef.current;
    if (bgCanvas) {
      bgCanvas.width = COLS * TILE_SIZE;
      bgCanvas.height = ROWS * TILE_SIZE;
      const bgCtx = bgCanvas.getContext("2d");
      bgCtx.imageSmoothingEnabled = false;

      const mapImg = new Image();
      mapImg.src = mapSrc;
      mapImg.onload = () => {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(mapImg, 0, 0, bgCanvas.width, bgCanvas.height);
      };
      mapImg.onerror = () => {
        // Fallback to programmatic tile renderer
        drawTileMap(bgCtx, bgCanvas.width, bgCanvas.height);
      };

      // In case the image is cached and already loaded
      if (mapImg.complete && mapImg.naturalWidth) {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(mapImg, 0, 0, bgCanvas.width, bgCanvas.height);
      }
    }

    // 🔁 Game loop
    function loop(time) {
      if (lastTime === 0) {
        lastTime = time;
        requestAnimationFrame(loop);
        return;
      }
      const delta = time - lastTime;
      lastTime = time;

      engineRef.current.update(delta);
      draw(ctx);

      // If engine state changed, update React state once so HUD can react (e.g. show GAME OVER)
      const current = engineRef.current.state;
      if (current !== prevEngineStateRef.current) {
        prevEngineStateRef.current = current;
        setEngineState(current);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    // 🖱️ CLICK / TAP HANDLER
    canvas.addEventListener("click", handleClick);

    return () => canvas.removeEventListener("click", handleClick);
  }, []);

  // 💫 Banner blinking effect when caught
  useEffect(() => {
    if (engineState === GAME_STATE.GAME_OVER) {
      // Start blinking
      setBannerVisible(true);
      let blinkCount = 0;
      blinkIntervalRef.current = setInterval(() => {
        setBannerVisible(prev => !prev);
        blinkCount++;
      }, 150); // Blink every 150ms

      // Stop blinking after 1 second (visible state)
      blinkTimeoutRef.current = setTimeout(() => {
        clearInterval(blinkIntervalRef.current);
        setBannerVisible(true); // Keep it visible
      }, 1000);
    }

    return () => {
      if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, [engineState]);

  // 🔄 Reset game function
  function handleTryAgain() {
    // Reset engine from level 1
    engineRef.current = new GameEngine(1);
    setCurrentLevel(1);
    setHearts(3);
    
    // Reset states
    setEngineState(GAME_STATE.PLAYING);
    prevEngineStateRef.current = GAME_STATE.PLAYING;
    setBannerVisible(true);
    
    // Clear any pending animations
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
  }

  // 🔄 Resume from current level function
  function handleResumeLevel() {
    // Reset engine with current level
    engineRef.current = new GameEngine(currentLevel);
    setHearts(3);
    
    // Reset states
    setEngineState(GAME_STATE.PLAYING);
    prevEngineStateRef.current = GAME_STATE.PLAYING;
    setBannerVisible(true);
    
    // Clear any pending animations
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
  }

  // 🎯 Next level function
  function handleNextLevel() {
    const nextLevelNum = currentLevel + 1;
    // Create new engine with next level
    engineRef.current = new GameEngine(nextLevelNum);
    
    // Update states
    setCurrentLevel(nextLevelNum);
    setHearts(3);
    setEngineState(GAME_STATE.PLAYING);
    prevEngineStateRef.current = GAME_STATE.PLAYING;
    setBannerVisible(true);
    
    // Clear any pending animations
    if (blinkIntervalRef.current) clearInterval(blinkIntervalRef.current);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
  }

  // 🧠 Convert mouse click → grid position → student
  function handleClick(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Map mouse (CSS pixels) → canvas pixels (accounts for CSS transform / DPR)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const engine = engineRef.current;

    // Find student that was clicked
    const targetStudent = engine.students.find(
      s =>
        x >= s.x &&
        x <= s.x + TILE_SIZE &&
        y >= s.y &&
        y <= s.y + TILE_SIZE
    );

    // Find who currently has eraser
    const fromStudent = engine.students.find(s => s.hasThund);

    // Valid throw
    if (targetStudent && fromStudent && targetStudent !== fromStudent) {
      // Check if this is a wrong pass (to student who doesn't need eraser)
      if (!targetStudent.needsBall) {
        // Show red highlight briefly
        setWrongPassHighlight(true);
        setTimeout(() => setWrongPassHighlight(false), 500);
        
        // Remove a heart
        setHearts(prev => {
          const newHearts = prev - 1;
          // If no hearts left, game over
          if (newHearts <= 0) {
            engine.state = GAME_STATE.GAME_OVER;
            setEngineState(GAME_STATE.GAME_OVER);
          }
          return Math.max(0, newHearts);
        });
      }
      
      engine.attemptThrow(fromStudent, targetStudent);
    }
  }

  // 🎨 Drawing everything
  function draw(ctx) {
    // Enable high-quality smoothing for best quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Use actual canvas size so clearing and drawing match scaled display
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const engine = engineRef.current;

    // 👨‍🎓 Students
    const throwingStudentId = engine.from?.id; // Student currently throwing
    engine.students.forEach(s => {
      const isThrowing = engine.state === GAME_STATE.THROWING && s.id === throwingStudentId;
      const isCaught = s.isCaught || false; // Flag for caught pose
      drawStudent(ctx, s, studentImgsRef.current, isThrowing, isCaught, highlightImgRef.current, eraserIndicatorImgRef.current);
    });

    // 👩‍🏫 Beth (image if available, else fallback)
    let bethKey = "back"; // Don't update if game is over or completed
    if (engine.state === GAME_STATE.GAME_OVER || engine.state === GAME_STATE.COMPLETED) return;
    if (engine.beth.state === "WATCHING") bethKey = "front";
    else if (engine.beth.state === "WARNING") bethKey = "warning";

    const bethImg = bethImgsRef.current[bethKey];

    if (bethImg && bethImg.naturalWidth) {
      // Enable high-quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bethImg, engine.beth.x, engine.beth.y, TILE_SIZE, TILE_SIZE);
    } else {
      drawBethShape(ctx, engine.beth);
    }

    // 🧻 Eraser
    if (engine.thund) {
      const thundImg = thundImgRef.current;
      if (thundImg && thundImg.naturalWidth) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(thundImg, engine.thund.x - 4, engine.thund.y - 4, 16, 16);
      } else {
        // Fallback: draw simple rectangle
        ctx.fillStyle = "#EEE";
        ctx.fillRect(engine.thund.x, engine.thund.y, 8, 8);
      }
    }
  }

  return (
    <>
      <HUD engine={engineRef.current} currentLevel={currentLevel} hearts={hearts} />
      
      {/* 📖 Instruction Banner - Only show on level 1 */}
      {currentLevel === 1 && (
        <div
          style={{
            position: "fixed",
            left: "20px",
            top: "35%",
            transform: "translateY(-50%)",
            width: "250px",
            padding: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            border: "2px solid #333",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            fontSize: "14px",
            lineHeight: "1.4",
            color: "#333",
            zIndex: 10,
            fontFamily: "'Space Grotesk', sans-serif"
          }}
        >
          <h3 style={{ 
            margin: "0 0 10px 0", 
            fontSize: "16px", 
            fontWeight: "600", 
            color: "#8B0000",
            fontFamily: "'Poppins', sans-serif",
            letterSpacing: "0.5px"
          }}>
            How to Play:
          </h3>
          <p style={{ 
            margin: 0, 
            fontStyle: "italic",
            fontFamily: "'Playfair Display', serif",
            fontSize: "13px",
            lineHeight: "1.5",
            color: "#2c3e50",
            fontWeight: "bold"
          }}>
            "Share your eraser with those in need—but beware! The staff isn't a fan of sharing. Keep an eye on her surveillance and make your move only when she's facing the board. Tap on the students that have thier hands behind to pass the eraser! The higher the level, the quicker Beth checks!"
          </p>
        </div>
      )}
      
      {/* 🔄 Try Again button image - page level */}
      {(engineState === GAME_STATE.GAME_OVER || engineState === GAME_STATE.COMPLETED) && (
        <img
          src={tryAgainBtnSrc}
          alt="Try Again"
          onClick={handleTryAgain}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            width: "150px",
            height: "auto",
            cursor: "pointer",
            zIndex: 1000,
            transition: "transform 0.2s, filter 0.2s"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.filter = "brightness(1.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.filter = "brightness(1)";
          }}
        />
      )}
      
      <div
        className="canvas-wrap"
        style={{ 
          width: COLS * TILE_SIZE, 
          height: ROWS * TILE_SIZE,
          position: "relative"
        }}
      >
        <canvas
          ref={bgCanvasRef}
          className="background-canvas"
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
        />
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={COLS * TILE_SIZE}
          height={ROWS * TILE_SIZE}
        />
        
        {/* 🚨 Caught banner overlay with options */}
        {engineState === GAME_STATE.GAME_OVER && bannerVisible && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(255, 0, 0, 0.9)",
              color: "white",
              padding: "40px 60px",
              borderRadius: "15px",
              fontSize: "24px",
              fontWeight: "bold",
              textAlign: "center",
              zIndex: 100,
              boxShadow: "0 8px 32px rgba(255, 0, 0, 0.3)",
              border: "3px solid #FF0000",
              fontFamily: "'Poppins', sans-serif",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ marginBottom: "25px" }}>
              CAUGHT!
            </div>
            <div style={{ marginBottom: "20px", fontSize: "16px", fontWeight: "normal" }}>
              Choose your option:
            </div>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button
                onClick={handleTryAgain}
                style={{
                  backgroundColor: "#FF6B6B",
                  color: "white",
                  border: "2px solid #FF5252",
                  padding: "12px 25px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "all 0.3s ease",
                  textShadow: "none"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#FF5252";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#FF6B6B";
                  e.target.style.transform = "scale(1)";
                }}
              >
                Start from Level 1
              </button>
              <button
                onClick={handleResumeLevel}
                style={{
                  backgroundColor: "#4ECDC4",
                  color: "white",
                  border: "2px solid #45B7AA",
                  padding: "12px 25px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontFamily: "'Poppins', sans-serif",
                  transition: "all 0.3s ease",
                  textShadow: "none"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#45B7AA";
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#4ECDC4";
                  e.target.style.transform = "scale(1)";
                }}
              >
                Resume Level {currentLevel}
              </button>
            </div>
          </div>
        )}

        {/* 🎉 Level Complete banner overlay */}
        {engineState === GAME_STATE.LEVEL_COMPLETE && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0, 150, 255, 0.9)",
              color: "white",
              padding: "40px 60px",
              borderRadius: "15px",
              fontSize: "32px",
              fontWeight: "bold",
              textAlign: "center",
              zIndex: 100,
              boxShadow: "0 8px 32px rgba(0, 150, 255, 0.3)",
              border: "3px solid #0096FF",
              fontFamily: "'Poppins', sans-serif",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              LEVEL {currentLevel} COMPLETE!
            </div>
            <button
              onClick={handleNextLevel}
              style={{
                backgroundColor: "#00FF00",
                color: "#000",
                border: "2px solid #00CC00",
                padding: "15px 30px",
                fontSize: "18px",
                fontWeight: "bold",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "'Poppins', sans-serif",
                transition: "all 0.3s ease",
                textShadow: "none"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#00CC00";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#00FF00";
                e.target.style.transform = "scale(1)";
              }}
            >
              NEXT LEVEL →
            </button>
          </div>
        )}

        {/* 🎉 Completed banner overlay */}
        {engineState === GAME_STATE.COMPLETED && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0, 200, 0, 0.9)",
              color: "white",
              padding: "30px 50px",
              borderRadius: "15px",
              fontSize: "36px",
              fontWeight: "bold",
              textAlign: "center",
              zIndex: 100,
              boxShadow: "0 8px 32px rgba(0, 200, 0, 0.3)",
              border: "3px solid #00FF00",
              fontFamily: "'Poppins', sans-serif",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}
          >
            GAME COMPLETED!
          </div>
        )}
        
        {/* 🔴 Red highlight for wrong pass - only on game canvas */}
        {wrongPassHighlight && (
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255, 0, 0, 0.15)",
              zIndex: 50,
              pointerEvents: "none",
              animation: "pulse 0.5s ease-in-out"
            }}
          />
        )}
      </div>
    </>
  );
}
