
import { useEffect, useState } from "react";

interface UserCursorProps {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

export function UserCursor({ userId, userName, x, y, color }: UserCursorProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Hide cursor after 3 seconds of inactivity
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [x, y]);

  if (!isVisible) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-lg"
      >
        <path
          d="M2 2L18 8L8 12L2 18V2Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
}
