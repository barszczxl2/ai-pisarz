'use client';

import { cn } from '@/lib/utils';
import {
  Brain,
  Heading,
  Database,
  FileText,
  PenTool,
  Check,
  Loader2,
  AlertCircle,
  Circle,
} from 'lucide-react';
import { STAGE_NAMES } from '@/types/database';

interface PipelineStage {
  id: number;
  name: string;
  icon: React.ElementType;
  description: string;
}

const stages: PipelineStage[] = [
  {
    id: 1,
    name: STAGE_NAMES[1],
    icon: Brain,
    description: 'Analiza tematu i budowa grafu wiedzy',
  },
  {
    id: 2,
    name: STAGE_NAMES[2],
    icon: Heading,
    description: 'Generowanie 3 wariantów nagłówków',
  },
  {
    id: 3,
    name: STAGE_NAMES[3],
    icon: Database,
    description: 'Tworzenie bazy wiedzy RAG',
  },
  {
    id: 4,
    name: STAGE_NAMES[4],
    icon: FileText,
    description: 'Przygotowanie briefu dla każdej sekcji',
  },
  {
    id: 5,
    name: STAGE_NAMES[5],
    icon: PenTool,
    description: 'Iteracyjna generacja treści',
  },
];

type StageStatus = 'pending' | 'running' | 'completed' | 'error' | 'waiting';

interface PipelineProps {
  currentStage: number;
  status: string;
  onStageClick?: (stageId: number) => void;
  interactive?: boolean;
}

function getStageStatus(stageId: number, currentStage: number, projectStatus: string): StageStatus {
  if (projectStatus === 'error') {
    if (stageId === currentStage) return 'error';
    if (stageId < currentStage) return 'completed';
    return 'pending';
  }

  if (stageId < currentStage) return 'completed';
  if (stageId === currentStage) {
    // Check if stage is actively running
    if (projectStatus.includes('building') || projectStatus.includes('generating') || projectStatus.includes('creating')) {
      return 'running';
    }
    // Stage is completed but waiting for next action
    if (projectStatus === 'headers_generated' || projectStatus === 'headers_selected' ||
        projectStatus === 'rag_created' || projectStatus === 'brief_created') {
      return 'waiting';
    }
    return 'running';
  }
  return 'pending';
}

export function Pipeline({ currentStage, status, onStageClick, interactive = true }: PipelineProps) {
  return (
    <div className="w-full">
      <div className="relative flex justify-between">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-6 h-0.5 bg-slate-200" />
        <div
          className="absolute left-0 top-6 h-0.5 bg-blue-500 transition-all duration-500"
          style={{
            width: `${Math.max(0, ((currentStage - 1) / (stages.length - 1)) * 100)}%`,
          }}
        />

        {stages.map((stage) => {
          const stageStatus = getStageStatus(stage.id, currentStage, status);
          const Icon = stage.icon;

          const isClickable = interactive && (
            stageStatus === 'completed' ||
            stageStatus === 'waiting' ||
            (stageStatus === 'pending' && stage.id === currentStage + 1)
          );

          return (
            <div
              key={stage.id}
              className={cn(
                'relative flex flex-col items-center',
                isClickable && 'cursor-pointer'
              )}
              onClick={() => isClickable && onStageClick?.(stage.id)}
            >
              {/* Stage circle */}
              <div
                className={cn(
                  'relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                  stageStatus === 'completed' && 'border-green-500 bg-green-500 text-white',
                  stageStatus === 'running' && 'border-blue-500 bg-blue-500 text-white',
                  stageStatus === 'waiting' && 'border-amber-500 bg-amber-500 text-white',
                  stageStatus === 'error' && 'border-red-500 bg-red-500 text-white',
                  stageStatus === 'pending' && 'border-slate-300 bg-white text-slate-400',
                  isClickable && 'hover:scale-110'
                )}
              >
                {stageStatus === 'completed' ? (
                  <Check className="h-5 w-5" />
                ) : stageStatus === 'running' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : stageStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : stageStatus === 'waiting' ? (
                  <Circle className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Stage info */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    'text-sm font-medium',
                    stageStatus === 'completed' && 'text-green-600',
                    stageStatus === 'running' && 'text-blue-600',
                    stageStatus === 'waiting' && 'text-amber-600',
                    stageStatus === 'error' && 'text-red-600',
                    stageStatus === 'pending' && 'text-slate-400'
                  )}
                >
                  {stage.name}
                </p>
                <p className="mt-1 max-w-[120px] text-xs text-slate-500">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for cards
export function PipelineCompact({ currentStage, status }: { currentStage: number; status: string }) {
  return (
    <div className="flex items-center gap-1">
      {stages.map((stage) => {
        const stageStatus = getStageStatus(stage.id, currentStage, status);

        return (
          <div
            key={stage.id}
            className={cn(
              'h-2 w-8 rounded-full transition-colors',
              stageStatus === 'completed' && 'bg-green-500',
              stageStatus === 'running' && 'bg-blue-500 animate-pulse',
              stageStatus === 'waiting' && 'bg-amber-500',
              stageStatus === 'error' && 'bg-red-500',
              stageStatus === 'pending' && 'bg-slate-200'
            )}
            title={`${stage.name}: ${stageStatus}`}
          />
        );
      })}
    </div>
  );
}
