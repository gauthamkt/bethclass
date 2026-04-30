export default function HUD({ engine, currentLevel, hearts }) {
  return (
    <div className="hud">
      <div className="status">
        Level: {currentLevel} | Beth: {engine.beth.state}
      </div>

      <div className="hearts" style={{ 
        fontSize: "24px", 
        marginTop: "10px",
        letterSpacing: "5px"
      }}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} style={{ 
            opacity: i < hearts ? 1 : 0.3,
            transition: "opacity 0.3s ease"
          }}>
            ❤️
          </span>
        ))}
      </div>

      {engine.state === "GAME_OVER" && (
        <div className="game-over">
          GAME OVER
        </div>
      )}

      {engine.state === "LEVEL_COMPLETE" && (
        <div className="level-complete">
          LEVEL {currentLevel} COMPLETE!
        </div>
      )}

      {engine.state === "COMPLETED" && (
        <div className="game-completed">
          GAME COMPLETED!
        </div>
      )}
    </div>
  );
}
