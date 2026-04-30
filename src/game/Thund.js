export class Thund {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.progress = 0;
    this.active = true;
    this.x = start.x;
    this.y = start.y;
  }

  update() {
    this.progress += 0.04;

    this.x = this.start.x + (this.end.x - this.start.x) * this.progress;
    this.y =
      this.start.y +
      (this.end.y - this.start.y) * this.progress -
      Math.sin(this.progress * Math.PI) * 18;

    if (this.progress >= 1) {
      this.active = false;
    }
  }
}
