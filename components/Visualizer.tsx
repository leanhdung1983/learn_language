
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  stream: MediaStream | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !stream || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 64; // Smaller for cleaner mobile look
    source.connect(analyzer);

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!ctx) return;
      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = isActive ? '#3b82f6' : '#cbd5e1';
        
        // Draw rounded bars
        const radius = 2;
        ctx.beginPath();
        ctx.roundRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight, radius);
        ctx.fill();
        
        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [isActive, stream]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-8"
      width={200} 
      height={40}
    />
  );
};

export default Visualizer;
