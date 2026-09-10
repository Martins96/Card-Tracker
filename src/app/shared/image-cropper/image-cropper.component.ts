import {
  Component, ElementRef, EventEmitter, Input, Output, ViewChild,
  AfterViewInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { CropRect } from '../utils/image-processing.util';

@Component({
  selector: 'app-image-cropper',
  standalone: true,
  templateUrl: './image-cropper.component.html',
  styleUrl: './image-cropper.component.scss',
})
export class ImageCropperComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) image!: HTMLImageElement;
  @Output() cropChange = new EventEmitter<CropRect>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private displayScale = 1;

  private rect: CropRect = { x: 0, y: 0, width: 0, height: 0 };

  private dragMode: 'move' | 'resize' | null = null;
  private dragStart = { x: 0, y: 0 };
  private rectStart: CropRect = { x: 0, y: 0, width: 0, height: 0 };
  private resizeHandle: 'tl' | 'tr' | 'bl' | 'br' | null = null;

  // dimensione VISIVA del quadratino disegnato
  private readonly HANDLE_SIZE = 10;
  // raggio di tolleranza per il tocco: più largo del quadratino visivo,
  // così su mobile non serve centrare il dito al pixel
  private readonly HANDLE_HIT_RADIUS = 22;
  private readonly MAX_CANVAS_WIDTH = 500;

  // palette coerente col tema dark/viola dell'app
  private readonly COLOR_OVERLAY = 'rgba(10, 10, 15, 0.65)';
  private readonly COLOR_BORDER = '#7c3aed';
  private readonly COLOR_HANDLE_FILL = '#7c3aed';
  private readonly COLOR_HANDLE_STROKE = '#f4f4f5';

  ngAfterViewInit() {
    this.setup();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['image'] && this.canvasRef) {
      this.setup();
    }
  }

  private setup() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.displayScale = Math.min(1, this.MAX_CANVAS_WIDTH / this.image.width);
    canvas.width = this.image.width * this.displayScale;
    canvas.height = this.image.height * this.displayScale;

    const w = this.image.width * 0.8;
    const h = this.image.height * 0.8;
    this.rect = {
      x: (this.image.width - w) / 2,
      y: (this.image.height - h) / 2,
      width: w,
      height: h,
    };

    this.draw();
    this.emitCrop();
  }

  private toDisplay(rect: CropRect): CropRect {
    return {
      x: rect.x * this.displayScale,
      y: rect.y * this.displayScale,
      width: rect.width * this.displayScale,
      height: rect.height * this.displayScale,
    };
  }

  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);

    const d = this.toDisplay(this.rect);

    this.ctx.fillStyle = this.COLOR_OVERLAY;
    this.ctx.fillRect(0, 0, canvas.width, d.y);
    this.ctx.fillRect(0, d.y + d.height, canvas.width, canvas.height - d.y - d.height);
    this.ctx.fillRect(0, d.y, d.x, d.height);
    this.ctx.fillRect(d.x + d.width, d.y, canvas.width - d.x - d.width, d.height);

    this.ctx.strokeStyle = this.COLOR_BORDER;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(d.x, d.y, d.width, d.height);

    const hs = this.HANDLE_SIZE;
    const corners = [
      [d.x, d.y], [d.x + d.width, d.y],
      [d.x, d.y + d.height], [d.x + d.width, d.y + d.height],
    ];
    for (const [cx, cy] of corners) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, hs / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = this.COLOR_HANDLE_FILL;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.COLOR_HANDLE_STROKE;
      this.ctx.stroke();
    }
  }

  private emitCrop() {
    this.cropChange.emit({
      x: Math.round(this.rect.x),
      y: Math.round(this.rect.y),
      width: Math.round(this.rect.width),
      height: Math.round(this.rect.height),
    });
  }

  // legge coordinate sia da MouseEvent che da TouchEvent
  private getPointerPos(event: MouseEvent | TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();

    const clientX = 'touches' in event
      ? (event.touches[0] ?? event.changedTouches[0]).clientX
      : event.clientX;
    const clientY = 'touches' in event
      ? (event.touches[0] ?? event.changedTouches[0]).clientY
      : event.clientY;

    return {
      x: (clientX - bounds.left) * (canvas.width / bounds.width),
      y: (clientY - bounds.top) * (canvas.height / bounds.height),
    };
  }

  private hitTestHandle(pos: { x: number; y: number }): 'tl' | 'tr' | 'bl' | 'br' | null {
    const d = this.toDisplay(this.rect);
    const r = this.HANDLE_HIT_RADIUS;
    const near = (px: number, py: number) =>
      Math.abs(pos.x - px) <= r && Math.abs(pos.y - py) <= r;

    if (near(d.x, d.y)) return 'tl';
    if (near(d.x + d.width, d.y)) return 'tr';
    if (near(d.x, d.y + d.height)) return 'bl';
    if (near(d.x + d.width, d.y + d.height)) return 'br';
    return null;
  }

  private isInsideRect(pos: { x: number; y: number }): boolean {
    const d = this.toDisplay(this.rect);
    return pos.x >= d.x && pos.x <= d.x + d.width && pos.y >= d.y && pos.y <= d.y + d.height;
  }

  onPointerDown(event: MouseEvent | TouchEvent) {
    if ('touches' in event) event.preventDefault();

    const pos = this.getPointerPos(event);
    const handle = this.hitTestHandle(pos);

    if (handle) {
      this.dragMode = 'resize';
      this.resizeHandle = handle;
    } else if (this.isInsideRect(pos)) {
      this.dragMode = 'move';
    } else {
      return;
    }

    this.dragStart = pos;
    this.rectStart = { ...this.rect };
  }

  onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this.dragMode) return;
    if ('touches' in event) event.preventDefault();

    const pos = this.getPointerPos(event);
    const dx = (pos.x - this.dragStart.x) / this.displayScale;
    const dy = (pos.y - this.dragStart.y) / this.displayScale;

    if (this.dragMode === 'move') {
      this.rect.x = this.clamp(this.rectStart.x + dx, 0, this.image.width - this.rect.width);
      this.rect.y = this.clamp(this.rectStart.y + dy, 0, this.image.height - this.rect.height);
    } else if (this.dragMode === 'resize') {
      this.applyResize(dx, dy);
    }

    this.draw();
    this.emitCrop();
  }

  onPointerUp() {
    this.dragMode = null;
    this.resizeHandle = null;
  }

  private applyResize(dx: number, dy: number) {
    const r = this.rectStart;
    const minSize = 20;

    switch (this.resizeHandle) {
      case 'br':
        this.rect.width = this.clamp(r.width + dx, minSize, this.image.width - r.x);
        this.rect.height = this.clamp(r.height + dy, minSize, this.image.height - r.y);
        break;
      case 'tr':
        this.rect.width = this.clamp(r.width + dx, minSize, this.image.width - r.x);
        this.rect.y = this.clamp(r.y + dy, 0, r.y + r.height - minSize);
        this.rect.height = r.y + r.height - this.rect.y;
        break;
      case 'bl':
        this.rect.x = this.clamp(r.x + dx, 0, r.x + r.width - minSize);
        this.rect.width = r.x + r.width - this.rect.x;
        this.rect.height = this.clamp(r.height + dy, minSize, this.image.height - r.y);
        break;
      case 'tl':
        this.rect.x = this.clamp(r.x + dx, 0, r.x + r.width - minSize);
        this.rect.width = r.x + r.width - this.rect.x;
        this.rect.y = this.clamp(r.y + dy, 0, r.y + r.height - minSize);
        this.rect.height = r.y + r.height - this.rect.y;
        break;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}