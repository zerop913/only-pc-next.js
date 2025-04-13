import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";

interface CircularProgressBarProps {
  progress: number;
  isPlaying: boolean;
  size?: number;
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  progress,
  isPlaying,
  size = 36,
}) => {
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = (progress * circumference) / 100;

  return (
    <div className="relative flex items-center justify-center group">
      <div className="absolute inset-0 bg-black/50 rounded-full backdrop-blur-sm opacity-70 group-hover:opacity-90 transition-opacity"></div>

      <svg
        width={size}
        height={size}
        className="transform -rotate-90 relative z-10"
      >
        {/* Фоновый круг */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={strokeWidth}
        />

        {/* Прогресс */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(96, 165, 250, 0.7)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - dash}
          strokeLinecap="round"
        />
      </svg>

      {/* Иконка паузы/воспроизведения */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isPlaying ? (
          <Pause size={size / 3} className="text-white relative z-10" />
        ) : (
          <Play size={size / 3} className="text-white relative z-10 ml-0.5" />
        )}
      </div>
    </div>
  );
};
