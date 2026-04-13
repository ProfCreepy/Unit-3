/* eslint-disable no-unused-vars */
import { useCanvas } from '../hooks/useCanvas';
import './canvas.css'

export default function Canvas() {
  const { canvasRef, cellCount } = useCanvas();

  return (
    <canvas
      ref={canvasRef}
      className={'canvas'}
    />
  );
}
