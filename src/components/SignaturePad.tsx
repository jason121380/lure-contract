import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

export interface SignaturePadHandle {
  clear: () => void;
  toDataURL: () => string;
  isEmpty: () => boolean;
}

interface Props {
  height?: number;
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { height = 200 },
  ref
) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const emptyRef = useRef(true);
  const [, setTick] = useState(0);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const width = wrapper.clientWidth || 600;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111';
  }, [height]);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = pos(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = pos(e);
    const last = lastRef.current!;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
    if (emptyRef.current) {
      emptyRef.current = false;
      setTick((t) => t + 1);
    }
  };

  const onPointerUp = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      emptyRef.current = true;
      setTick((t) => t + 1);
    },
    toDataURL: () => canvasRef.current!.toDataURL('image/png'),
    isEmpty: () => emptyRef.current
  }));

  return (
    <div ref={wrapperRef} className="signature-pad">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: 'none', cursor: 'crosshair' }}
      />
    </div>
  );
});

export default SignaturePad;
