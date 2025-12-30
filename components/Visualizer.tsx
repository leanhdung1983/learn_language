
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  stream: MediaStream | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Added initial value null to useRef to resolve 'Expected 1 arguments' error
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !stream || !canvasRef.current) return;

    // Fix: Added AudioContextOptions to constructor to resolve 'Expected 1 arguments' error
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
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
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;
        const blue = 150 + (barHeight * 2);
        const green = 50 + (barHeight * 1);
        ctx.fillStyle = `rgb(59, 130, 246)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
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
      className="w-full h-24 rounded-lg bg-gray-100"
      width={400} 
      height={100}
    />
  );
};

export default Visualizer;