import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
    duration: number;
    isFinished: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ duration, isFinished }) => {
    const [progress, setProgress] = React.useState(0);

  useEffect(() => {
    setProgress(0);
    if (isFinished){
        setProgress(100);
    }else {
      const interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(interval);
            return 100;
          }
          const newProgress = oldProgress + 100 / (duration / 100);
          return Math.min((newProgress), 100)
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [duration, isFinished]);

  return (
    <div className="w-full h-4 bg-gray-200 rounded-full mt-4">
      <div
        style={{ width: `${Math.round(progress)}%` }}
        className="h-full text-center text-xs text-white bg-blue-500 rounded-full"
      >
        {Math.round(progress)}%
      </div>
    </div>
  );
};
