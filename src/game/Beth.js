// Helper to get random duration within a range (in ms)
function randomDuration(min, max) {
  return Math.random() * (max - min) + min;
}

export class Beth {
  constructor(x, y, levelConfig = null) {
    this.x = x;
    this.y = y;
    this.state = "WATCHING";
    this.timer = 0;
    this.levelConfig = levelConfig;
    this.stateDuration = this.getWatchingDuration();
  }

  getWatchingDuration() {
    if (this.levelConfig) {
      return randomDuration(this.levelConfig.watchingMin, this.levelConfig.watchingMax);
    }
    // Default: Random watching: 1-5 seconds (unpredictable - sometimes short, sometimes long)
    return randomDuration(1000, 5000);
  }

  getNotWatchingDuration() {
    if (this.levelConfig) {
      return randomDuration(this.levelConfig.notWatchingMin, this.levelConfig.notWatchingMax);
    }
    // Default: Random not-watching: 0.8-4 seconds (unpredictable window to throw)
    return randomDuration(800, 4000);
  }

  getWarningDuration() {
    if (this.levelConfig) {
      return randomDuration(this.levelConfig.warningMin, this.levelConfig.warningMax);
    }
    // Default: Random warning: 0.5-2 seconds (quick glance back - unpredictable)
    return randomDuration(500, 2000);
  }

  update(delta) {
    this.timer += delta;
    // console.log(`Beth Update: state=${this.state}, timer=${this.timer}, duration=${this.stateDuration}, delta=${delta}`);

    // WATCHING → NOT_WATCHING (random duration each time)
    if (this.state === "WATCHING" && this.timer > this.stateDuration) {
      console.log("Switching to NOT_WATCHING");
      this.state = "NOT_WATCHING";
      this.timer = 0;
      this.stateDuration = this.getNotWatchingDuration();
    }

    // NOT_WATCHING → WARNING (random duration each time)
    if (this.state === "NOT_WATCHING" && this.timer > this.stateDuration) {
      this.state = "WARNING";
      this.timer = 0;
      this.stateDuration = this.getWarningDuration();
    }

    // WARNING → WATCHING (random duration each time)
    if (this.state === "WARNING" && this.timer > this.stateDuration) {
      this.state = "WATCHING";
      this.timer = 0;
      this.stateDuration = this.getWatchingDuration();
    }
  }
}
