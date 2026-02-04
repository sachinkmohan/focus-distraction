import { motion } from 'framer-motion';
import type { TimerStatus } from '@/types';
import { SEED_TO_PLANT_DURATION } from '@/utils/constants';
import {
  groundY,
  seedCx,
  seedCy,
  stemPath,
  sproutLeaves,
  trunkPath,
  branches,
  canopyLeaves,
} from './treePaths';

interface TreeAnimationProps {
  elapsedSeconds: number;
  totalDuration: number;
  status: TimerStatus;
}

function getAnimationState(elapsed: number, total: number, status: TimerStatus) {
  if (status === 'idle') return { phase: 'seed' as const, progress: 0 };
  if (status === 'completed') return { phase: 'complete' as const, progress: 1 };

  if (elapsed <= SEED_TO_PLANT_DURATION) {
    return { phase: 'sprouting' as const, progress: Math.min(1, elapsed / SEED_TO_PLANT_DURATION) };
  }

  const growDuration = total - SEED_TO_PLANT_DURATION;
  const growElapsed = elapsed - SEED_TO_PLANT_DURATION;
  return {
    phase: 'growing' as const,
    progress: growDuration > 0 ? Math.min(1, growElapsed / growDuration) : 1,
  };
}

export function TreeAnimation({ elapsedSeconds, totalDuration, status }: TreeAnimationProps) {
  const { phase, progress } = getAnimationState(elapsedSeconds, totalDuration, status);

  const showSprout = phase !== 'seed';
  const showTree = phase === 'growing' || phase === 'complete';
  const sproutProgress = phase === 'sprouting' ? progress : 1;
  const treeProgress = phase === 'growing' ? progress : phase === 'complete' ? 1 : 0;

  return (
    <div className="flex items-center justify-center py-4">
      <svg viewBox="0 0 200 300" className="h-48 w-48">
        {/* Ground */}
        <line
          x1={40}
          y1={groundY}
          x2={160}
          y2={groundY}
          stroke="#a3784a"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Seed */}
        <motion.ellipse
          cx={seedCx}
          cy={seedCy}
          rx={8}
          ry={5}
          fill="#8B4513"
          animate={{ scale: showSprout ? 0.6 : 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* Sprout stem */}
        {showSprout && (
          <motion.path
            d={stemPath}
            stroke="#228B22"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: sproutProgress }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        {/* Sprout leaves */}
        {showSprout &&
          sproutLeaves.map((leaf, i) => (
            <motion.ellipse
              key={`sprout-${i}`}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              fill="#4ade80"
              transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: sproutProgress >= leaf.threshold ? 1 : 0,
                opacity: sproutProgress >= leaf.threshold ? 0.85 : 0,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ))}

        {/* Tree trunk */}
        {showTree && (
          <motion.path
            d={trunkPath}
            stroke="#6b4226"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.min(1, treeProgress * 3) }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}

        {/* Tree branches */}
        {showTree &&
          branches.map((branch, i) => (
            <motion.path
              key={`branch-${i}`}
              d={branch.d}
              stroke="#6b4226"
              strokeWidth={2.5}
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: treeProgress >= branch.threshold ? 1 : 0,
                opacity: treeProgress >= branch.threshold ? 1 : 0,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ))}

        {/* Canopy leaves */}
        {showTree &&
          canopyLeaves.map((leaf, i) => (
            <motion.circle
              key={`canopy-${i}`}
              cx={leaf.cx}
              cy={leaf.cy}
              r={leaf.r}
              fill="#22c55e"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: treeProgress >= leaf.threshold ? 1 : 0,
                opacity: treeProgress >= leaf.threshold ? 0.8 : 0,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ))}
      </svg>
    </div>
  );
}
