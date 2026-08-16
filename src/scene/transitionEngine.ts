import type { SceneMode } from "../config/scenes";

export const REPAINT_MS = 700;
export const SEAL_MS = 150;
export const MASK_SCALE = 4;
export const MAX_DPR = 2;

export type TransitionOrigin = { x: number; y: number };

export type SceneTransitionOptions = {
  canvas: HTMLCanvasElement;
  fromImage: HTMLImageElement;
  toImage: HTMLImageElement;
  targetMode: SceneMode;
  origin: TransitionOrigin;
  width: number;
  height: number;
  reducedMotion: boolean;
  onComplete: () => void;
};

export type SceneTransitionController = {
  cancel: () => void;
};

type Streak = {
  angle: number;
  offset: number;
  length: number;
  width: number;
  alpha: number;
  rotation: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function easeInOutCubic(value: number): number {
  const p = clamp(value, 0, 1);
  return p < 0.5
    ? 4 * p * p * p
    : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function maxRadiusFromOrigin(
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  );
}

export function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  scale = 1,
  focalX = 0.5,
  focalY = 0.5,
): void {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight || width <= 0 || height <= 0) return;

  const viewportRatio = width / height;
  const imageRatio = imageWidth / imageHeight;
  let sourceWidth: number;
  let sourceHeight: number;
  let sourceX = 0;
  let sourceY = 0;

  if (imageRatio > viewportRatio) {
    sourceHeight = imageHeight;
    sourceWidth = sourceHeight * viewportRatio;
    sourceX = clamp(
      (imageWidth - sourceWidth) * focalX,
      0,
      imageWidth - sourceWidth,
    );
  } else {
    sourceWidth = imageWidth;
    sourceHeight = sourceWidth / viewportRatio;
    sourceY = clamp(
      (imageHeight - sourceHeight) * focalY,
      0,
      imageHeight - sourceHeight,
    );
  }

  const destinationWidth = width * scale;
  const destinationHeight = height * scale;
  const destinationX = (width - destinationWidth) / 2;
  const destinationY = (height - destinationHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    destinationX,
    destinationY,
    destinationWidth,
    destinationHeight,
  );
}

function blobPath(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  waveTime: number,
  phases: readonly [number, number, number],
): void {
  const points = 72;
  const amplitude = Math.min(60, Math.max(0, radius) * 0.16 + 5);

  context.beginPath();
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2;
    const wave =
      Math.sin(angle * 3 + waveTime * 1.1 + phases[0]) * 0.45 +
      Math.sin(angle * 5 - waveTime * 0.8 + phases[1]) * 0.3 +
      Math.sin(angle * 9 + waveTime * 1.6 + phases[2]) * 0.25;
    const warpedRadius = Math.max(0, radius + wave * amplitude);
    const x = centerX + Math.cos(angle) * warpedRadius;
    const y = centerY + Math.sin(angle) * warpedRadius;

    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function featherFill(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  waveTime: number,
  feather: number,
  phases: readonly [number, number, number],
): void {
  context.save();
  context.lineJoin = "round";
  context.lineCap = "round";
  context.strokeStyle = "#fff";
  context.fillStyle = "#fff";
  blobPath(context, centerX, centerY, radius, waveTime, phases);

  const passes: ReadonlyArray<readonly [number, number]> = [
    [feather * 2.6, 0.1],
    [feather * 1.6, 0.16],
    [feather * 0.8, 0.26],
  ];

  for (const [lineWidth, alpha] of passes) {
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    context.stroke();
  }

  context.globalAlpha = 1;
  context.fill();
  context.restore();
}

function createBrush(): HTMLCanvasElement | null {
  const brush = document.createElement("canvas");
  brush.width = 256;
  brush.height = 256;
  const context = brush.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(128, 128, 6, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,.9)");
  gradient.addColorStop(0.78, "rgba(255,255,255,.45)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return brush;
}

function createStreaks(): Streak[] {
  return Array.from({ length: 16 }, () => ({
    angle: Math.random() * Math.PI * 2,
    offset: 40 + Math.random() * 150,
    length: 70 + Math.random() * 130,
    width: 12 + Math.random() * 26,
    alpha: 0.08 + Math.random() * 0.12,
    rotation: (Math.random() - 0.5) * 0.7,
  }));
}

function configureCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
): CanvasRenderingContext2D | null {
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}

export function startSceneTransition(
  options: SceneTransitionOptions,
): SceneTransitionController {
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
  const context = configureCanvas(options.canvas, width, height, dpr);
  let cancelled = false;
  let animationFrame = 0;

  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    options.onComplete();
  };

  if (!context) {
    const timeout = window.setTimeout(finish, 600);
    return {
      cancel() {
        cancelled = true;
        window.clearTimeout(timeout);
      },
    };
  }

  const start = performance.now();

  if (options.reducedMotion) {
    const tickReduced = (now: number) => {
      if (cancelled) return;
      const progress = Math.min(1, (now - start) / 560);
      context.clearRect(0, 0, width, height);
      drawCover(context, options.fromImage, width, height, 1);
      context.save();
      context.globalAlpha = easeInOutCubic(progress);
      drawCover(context, options.toImage, width, height, 1);
      context.restore();

      if (progress >= 1) {
        finish();
        return;
      }
      animationFrame = requestAnimationFrame(tickReduced);
    };

    animationFrame = requestAnimationFrame(tickReduced);
    return {
      cancel() {
        cancelled = true;
        cancelAnimationFrame(animationFrame);
      },
    };
  }

  const maskCanvas = document.createElement("canvas");
  const maskWidth = Math.max(1, Math.ceil(width / MASK_SCALE));
  const maskHeight = Math.max(1, Math.ceil(height / MASK_SCALE));
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskContext = maskCanvas.getContext("2d");

  const workCanvas = document.createElement("canvas");
  const workContext = configureCanvas(workCanvas, width, height, dpr);

  if (!maskContext || !workContext) {
    const timeout = window.setTimeout(finish, 600);
    return {
      cancel() {
        cancelled = true;
        window.clearTimeout(timeout);
      },
    };
  }

  const phases: [number, number, number] = [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
  ];
  const streaks = createStreaks();
  const brush = createBrush();
  const origin = {
    x: clamp(options.origin.x, 0, width),
    y: clamp(options.origin.y, 0, height),
  };
  const maxRadius = maxRadiusFromOrigin(width, height, origin.x, origin.y);

  const tick = (now: number) => {
    if (cancelled) return;
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / REPAINT_MS);
    const eased = easeInOutCubic(progress);
    const feather = Math.max(50, Math.min(110, Math.min(width, height) * 0.09));
    const radius =
      -feather * 1.5 + (maxRadius + feather * 2.5) * eased;
    const waveTime = elapsed / 1000;

    maskContext.clearRect(0, 0, maskWidth, maskHeight);
    featherFill(
      maskContext,
      origin.x / MASK_SCALE,
      origin.y / MASK_SCALE,
      radius / MASK_SCALE,
      waveTime,
      feather / MASK_SCALE,
      phases,
    );

    workContext.globalCompositeOperation = "source-over";
    workContext.clearRect(0, 0, width, height);
    drawCover(workContext, options.toImage, width, height, 1.06 - 0.06 * eased);
    workContext.globalCompositeOperation = "destination-in";
    workContext.drawImage(
      maskCanvas,
      0,
      0,
      maskWidth,
      maskHeight,
      0,
      0,
      width,
      height,
    );
    workContext.globalCompositeOperation = "source-over";

    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, width, height);
    drawCover(context, options.fromImage, width, height, 1 + 0.035 * eased);
    context.drawImage(workCanvas, 0, 0, workCanvas.width, workCanvas.height, 0, 0, width, height);

    const rimAlpha = Math.sin(Math.PI * progress) * 0.32;
    if (rimAlpha > 0.012) {
      const colour = options.targetMode === "night" ? "150,175,255" : "255,205,140";
      context.save();
      context.globalCompositeOperation = "lighter";
      context.lineJoin = "round";
      context.lineCap = "round";
      context.strokeStyle = `rgba(${colour},${rimAlpha})`;
      context.lineWidth = feather * 0.85;
      context.shadowColor = `rgba(${colour},${rimAlpha * 0.8})`;
      context.shadowBlur = feather * 0.9;
      blobPath(context, origin.x, origin.y, radius, waveTime, phases);
      context.stroke();
      context.restore();
    }

    if (brush) {
      context.save();
      context.globalCompositeOperation = "lighter";
      for (const streak of streaks) {
        const streakRadius = radius - streak.offset;
        if (streakRadius <= 0) continue;
        const x = origin.x + Math.cos(streak.angle) * streakRadius;
        const y = origin.y + Math.sin(streak.angle) * streakRadius;
        context.save();
        context.translate(x, y);
        context.rotate(streak.angle + Math.PI / 2 + streak.rotation);
        context.globalAlpha = streak.alpha * (1 - progress);
        context.drawImage(
          brush,
          -streak.length / 2,
          -streak.width / 2,
          streak.length,
          streak.width,
        );
        context.restore();
      }
      context.restore();
    }

    if (progress >= 1) {
      const sealProgress = Math.min(1, (elapsed - REPAINT_MS) / SEAL_MS);
      context.save();
      context.globalAlpha = sealProgress;
      drawCover(context, options.toImage, width, height, 1);
      context.restore();

      if (sealProgress >= 1) {
        context.clearRect(0, 0, width, height);
        drawCover(context, options.toImage, width, height, 1);
        finish();
        return;
      }
    }

    animationFrame = requestAnimationFrame(tick);
  };

  animationFrame = requestAnimationFrame(tick);

  return {
    cancel() {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
    },
  };
}
