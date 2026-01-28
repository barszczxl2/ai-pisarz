import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDifyClient } from '@/lib/dify/client';
import { workflowProjectIdSchema, validateRequest } from '@/lib/validations/api';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(workflowProjectIdSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { projectId } = validation.data;

    if (!process.env.DIFY_RAG_WORKFLOW_KEY) {
      return NextResponse.json({ error: 'Dify API key not configured' }, { status: 500 });
    }

    // Get project and selected headers
    const { data: project } = await supabase
      .from('pisarz_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Use limit to handle potential duplicates
    const { data: shArr } = await supabase
      .from('pisarz_generated_headers')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .limit(1);
    const selectedHeaders = shArr?.[0];

    if (!project || !selectedHeaders) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Check for already running workflows
    const { data: runningWorkflows } = await supabase
      .from('pisarz_workflow_runs')
      .select('id, stage_name')
      .eq('project_id', projectId)
      .eq('status', 'running');

    if (runningWorkflows && runningWorkflows.length > 0) {
      return NextResponse.json(
        { error: `Workflow "${runningWorkflows[0].stage_name}" jest już uruchomiony. Zatrzymaj go najpierw.` },
        { status: 409 }
      );
    }

    // Create workflow run
    const { data: run } = await supabase
      .from('pisarz_workflow_runs')
      .insert({
        project_id: projectId,
        stage: 3,
        stage_name: 'Budowa RAG',
        status: 'running',
      })
      .select()
      .single();

    // Get headings and log size
    let headings = selectedHeaders.headers_html || '';
    console.log(`RAG workflow - headings size: ${headings.length} chars`);

    // Truncate if too large (max ~50k chars to stay under token limits)
    const MAX_HEADINGS_LENGTH = 50000;
    if (headings.length > MAX_HEADINGS_LENGTH) {
      console.warn(`Headings too long (${headings.length}), truncating to ${MAX_HEADINGS_LENGTH}`);
      headings = headings.substring(0, MAX_HEADINGS_LENGTH);
    }

    // Call Dify API with streaming to get detailed token info
    const difyClient = getDifyClient();
    const { result, tokenDetails, totalTokens } = await difyClient.runWorkflowStreaming(
      'rag',
      {
        keyword: project.keyword,
        language: project.language,
        headings: headings,
      },
      'ai-pisarz'
    );

    if (result?.data?.status === 'succeeded') {
      const outputs = result.data.outputs || {};

      // Handle different output formats from Dify workflow
      // Old format: dokladne + ogolne separately
      // New format: output (combined from Szablon node)
      let detailedQa = outputs.dokladne || '';
      let generalQa = outputs.ogolne || '';

      // If we have combined output, use it
      if (outputs.output && !detailedQa && !generalQa) {
        // Combined output contains both - store in both fields or split
        const combined = outputs.output as string;
        // Try to split by '+' separator used in Szablon template
        const parts = combined.split('+');
        if (parts.length >= 2) {
          generalQa = parts[0].trim();
          detailedQa = parts.slice(1).join('+').trim();
        } else {
          // If can't split, store in both
          detailedQa = combined;
          generalQa = combined;
        }
      }

      // Save RAG data
      await supabase.from('pisarz_rag_data').insert({
        project_id: projectId,
        detailed_qa: detailedQa,
        general_qa: generalQa,
      });

      // Update project status
      await supabase
        .from('pisarz_projects')
        .update({ status: 'rag_created', current_stage: 3 })
        .eq('id', projectId);

      // Complete workflow run with detailed token info
      await supabase
        .from('pisarz_workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_tokens: totalTokens || result.data.total_tokens || 0,
          token_details: tokenDetails,
        })
        .eq('id', run?.id);

      return NextResponse.json({ success: true, outputs, tokenDetails });
    } else {
      throw new Error(result?.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('RAG workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
