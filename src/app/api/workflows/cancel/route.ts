import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { runId, projectId } = await request.json();

    if (!runId || !projectId) {
      return NextResponse.json(
        { error: 'Run ID and Project ID are required' },
        { status: 400 }
      );
    }

    // Get the workflow run
    const { data: run, error: runError } = await supabase
      .from('pisarz_workflow_runs')
      .select('*')
      .eq('id', runId)
      .eq('project_id', projectId)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Workflow run not found' },
        { status: 404 }
      );
    }

    if (run.status !== 'running') {
      return NextResponse.json(
        { error: 'Workflow is not running' },
        { status: 400 }
      );
    }

    // Update workflow run to cancelled
    await supabase
      .from('pisarz_workflow_runs')
      .update({
        status: 'cancelled',
        error_message: 'Anulowano przez użytkownika',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Reset project status based on previous completed stage
    const previousStageStatus: Record<number, string> = {
      1: 'draft',
      2: 'knowledge_built',
      3: 'headers_selected',
      4: 'rag_created',
      5: 'brief_created',
    };

    const previousStage = run.stage - 1;
    const newStatus = previousStageStatus[run.stage] || 'draft';

    await supabase
      .from('pisarz_projects')
      .update({
        status: newStatus,
        current_stage: previousStage >= 0 ? previousStage : 0,
      })
      .eq('id', projectId);

    return NextResponse.json({
      success: true,
      message: 'Workflow cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
