
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraViewProps {
  onAnalyzeFrame?: (base64: string) => void;
  isAnalyzing?: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onAnalyzeFrame, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gridColor, setGridColor] = useState('#a855f7'); 
  const motionScoreRef = useRef(0);
  const backgroundRef = useRef<Float32Array | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) { console.error("Camera error"); }
  };

  const loop = useCallback(() => {
    if (!videoRef.current || !gridCanvasRef.current || !motionCanvasRef.current) {
      requestAnimationFrame(loop);
      return;
    }
    const mCtx = motionCanvasRef.current.getContext('2d');
    const gCtx = gridCanvasRef.current.getContext('2d');
    if (!mCtx || !gCtx) return;

    mCtx.drawImage(videoRef.current, 0, 0, 64, 36);
    const data = mCtx.getImageData(0, 0, 64, 36).data;
    const pixelCount = 64 * 36;

    if (!backgroundRef.current) {
      backgroundRef.current = new Float32Array(pixelCount);
      for (let i = 0; i < pixelCount; i++) backgroundRef.current[i] = (data[i*4] + data[i*4+1] + data[i*4+2]) / 3;
    } else {
      let diffSum = 0;
      for (let i = 0; i < pixelCount; i++) {
        const lum = (data[i*4] + data[i*4+1] + data[i*4+2]) / 3;
        diffSum += Math.abs(lum - backgroundRef.current[i]);
        backgroundRef.current[i] = backgroundRef.current[i] * 0.95 + lum * 0.05;
      }
      const score = (diffSum / pixelCount) / 128;
      motionScoreRef.current = motionScoreRef.current * 0.8 + score * 0.2;
    }

    // Grid Drawing
    const m = motionScoreRef.current;
    const gW = gridCanvasRef.current.width;
    const gH = gridCanvasRef.current.height;
    gCtx.clearRect(0, 0, gW, gH);

    const isStable = m < 0.2;
    const pulse = Math.sin(Date.now() / (200 - m * 150)) * 0.5 + 0.5;
    const alpha = isStable ? 0.08 : (0.15 + m * 0.6) + (pulse * m * 0.2);

    gCtx.globalAlpha = Math.min(alpha, 0.9);
    gCtx.strokeStyle = m > 0.6 ? '#f43f5e' : gridColor;
    gCtx.lineWidth = isStable ? 1 : 1 + m * 8;

    const density = 10 + Math.floor(m * 20);
    const stepX = gW / density;
    const stepY = gH / (density * (gH/gW));

    gCtx.beginPath();
    for (let x = 0; x <= gW; x += stepX) { gCtx.moveTo(x, 0); gCtx.lineTo(x, gH); }
    for (let y = 0; y <= gH; y += stepY) { gCtx.moveTo(0, y); gCtx.lineTo(gW, y); }
    gCtx.stroke();

    requestAnimationFrame(loop);
  }, [gridColor]);

  useEffect(() => {
    startCamera();
    requestAnimationFrame(loop);
  }, [loop]);

  return (
    <div className="relative w-full aspect-video rounded-[3rem] overflow-hidden bg-black border-4 border-purple-900/40 shadow-2xl group">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      <canvas ref={gridCanvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full pointer-events-none" />
      <canvas ref={motionCanvasRef} width={64} height={36} className="hidden" />
      
      <div className="absolute bottom-10 right-10 z-50 bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 w-64 translate-y-12 group-hover:translate-y-0 transition-transform">
         <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Grid Control</h4>
         <div className="flex flex-wrap gap-2">
            {['#a855f7', '#10b981', '#f43f5e', '#ffffff', '#00d4ff'].map(c => (
              <button key={c} onClick={() => setGridColor(c)} className={`w-8 h-8 rounded-full border-2 ${gridColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}
         </div>
      </div>
    </div>
  );
};

export default CameraView;
