import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DIFY_API_BASE = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_RAG_KEY = process.env.DIFY_RAG_WORKFLOW_KEY;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!DIFY_RAG_KEY) {
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

    // Call Dify API
    const difyResponse = await fetch(`${DIFY_API_BASE}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_RAG_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          keyword: project.keyword,
          language: project.language,
          headings: headings,
        },
        response_mode: 'blocking',
        user: 'ai-pisarz',
      }),
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      throw new Error(`Dify API error: ${difyResponse.status} - ${errorText}`);
    }

    const result = await difyResponse.json();

    if (result.data?.status === 'succeeded') {
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

      // Complete workflow run
      await supabase
        .from('pisarz_workflow_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', run?.id);

      return NextResponse.json({ success: true, outputs });
    } else {
      throw new Error(result.data?.error || 'Workflow failed');
    }
  } catch (error) {
    console.error('RAG workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
