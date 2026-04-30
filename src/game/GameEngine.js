// Import game components and constants
import { TILE_MAP, TILE } from "./TileMap";           // Classroom layout and tile types
import { TILE_SIZE, ROWS, COLS, GAME_STATE, LEVEL_CONFIG } from "./constants"; // Game dimensions, states, and level configs
import { Student } from "./Student";                   // Student entity class
import { Beth } from "./Beth";                         // Invigilator (teacher) entity class
import { Thund } from "./Thund";                       // Flying eraser entity class

export class GameEngine {
  constructor(level = 1) {
    // Current game level
    this.level = level;
    
    // Current game state (PLAYING, THROWING, GAME_OVER, LEVEL_COMPLETE)
    this.state = GAME_STATE.PLAYING;

    // Array containing all student entities in the game
    this.students = [];

    // Reference to the flying eraser (null when not in flight)
    this.thund = null;

    // Create students from tile map data
    // TILE_MAP defines where desks are placed in the classroom
    let id = 0; // Unique ID for each student
    TILE_MAP.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === TILE.DESK) {
          // Create a new student at each desk position
          // Note: We invert y so row 0 (top of map) becomes bottom row in game
          // This makes students appear at the bottom of the classroom
          this.students.push(
            new Student(id++, x * TILE_SIZE, (ROWS - 1 - y) * TILE_SIZE)
          );
        }
      });
    });

    // First student (ID 0) starts with the eraser
    this.students[0].hasThund = true;
    this.students[0].hasHadThund = true; // Mark as having received it before

    // Randomly select some students to need the eraser (not all)
    // This creates strategic choice - players must decide which students to help
    const studentsWithoutThund = this.students.filter(s => s.id !== 0);
    const numberOfStudentsToHighlight = Math.max(1, Math.floor(studentsWithoutThund.length * 0.6)); // 60% of students
    
    // Shuffle array randomly and select first N students
    // Math.random() - 0.5 gives equal chance of being positive or negative
    const shuffled = [...studentsWithoutThund].sort(() => Math.random() - 0.5);
    const selectedStudents = shuffled.slice(0, numberOfStudentsToHighlight);
    
    // Mark selected students as needing the eraser (they will be highlighted)
    selectedStudents.forEach(student => {
      student.needsBall = true;
    });

    // Create Beth (invigilator/teacher) at the front/top of classroom
    // Positioned at center horizontally (COLS * TILE_SIZE / 2) and at top (y=0)
    // Subtract 16 pixels to center her within the 32px tile
    // Pass level configuration to adjust her behavior
    const levelConfig = LEVEL_CONFIG[this.level] || LEVEL_CONFIG[1];
    this.beth = new Beth(
      (COLS * TILE_SIZE) / 2 - 16,
      0,
      levelConfig
    );
  }

  // Update game logic - called every frame with time delta since last frame
  update(delta) {
    // Don't update if game is over or completed
    if (this.state === GAME_STATE.GAME_OVER || this.state === GAME_STATE.COMPLETED) return;

    // Update Beth's behavior (watching/not watching patterns)
    this.beth.update(delta);

    // Update flying eraser animation if it exists
    if (this.thund) {
      this.thund.update();

      // If eraser animation is complete, finish the throw
      if (!this.thund.active) {
        this.finishThrow();
      }
    }
  }

  // Attempt to throw eraser from one student to another
  attemptThrow(from, to) {
    // CRITICAL: Check if Beth is watching - if so, the student gets caught!
    if (this.beth.state === "WATCHING") {
      from.isCaught = true; // Mark the throwing student as caught
      this.state = GAME_STATE.GAME_OVER; // End the game
      return; // Don't proceed with the throw
    }

    // Store references to the throwing and receiving students
    this.from = from;
    this.to = to;

    // Create flying eraser animation between the two students
    this.thund = new Thund(from, to);
    this.state = GAME_STATE.THROWING; // Change game state to throwing
  }

  // Check if all students who needed the eraser have received it
  checkGameCompletion() {
    const studentsWhoNeededThund = this.students.filter(s => s.needsBall);
    const studentsWhoHaveHadThund = this.students.filter(s => s.hasHadThund);
    
    // If all students who needed the eraser have had it, level is complete
    if (studentsWhoNeededThund.length > 0 && 
        studentsWhoNeededThund.every(s => s.hasHadThund)) {
      // Check if this is the last level (level 100)
      if (this.level >= 100) {
        this.state = GAME_STATE.COMPLETED; // Game fully completed
      } else {
        this.state = GAME_STATE.LEVEL_COMPLETE; // Current level complete
      }
      return true;
    }
    return false;
  }

  // Called when eraser animation completes - transfer the eraser
  finishThrow() {
    console.log(`Before: from=${this.from.id} needsBall=${this.from.needsBall}, to=${this.to.id} needsBall=${this.to.needsBall}`);
    
    // Transfer eraser from thrower to receiver
    this.from.hasThund = false;
    this.to.hasThund = true;

    // Mark receiver as having had the eraser (for highlight logic)
    this.to.hasHadThund = true;

    // Update needsBall status for highlighting system
    // Thrower now needs the eraser (since they don't have it)
    this.from.needsBall = true;
    
    // Receiver doesn't need the eraser (since they have it)
    this.to.needsBall = false;

    console.log(`After: from=${this.from.id} needsBall=${this.from.needsBall}, to=${this.to.id} needsBall=${this.to.needsBall}`);

    // Check if game is completed (all students who needed eraser have received it)
    this.checkGameCompletion();

    // Clear the flying eraser and return to playing state
    this.thund = null;
    if (this.state !== GAME_STATE.COMPLETED && this.state !== GAME_STATE.LEVEL_COMPLETE) {
      this.state = GAME_STATE.PLAYING;
    }
  }
}
