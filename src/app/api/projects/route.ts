import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createProjectSchema, validateRequest } from '@/lib/validations/api';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('pisarz_projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validation = validateRequest(createProjectSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { keyword, language, ai_overview_content } = validation.data;

    const { data, error } = await supabase
      .from('pisarz_projects')
      .insert({
        keyword,
        language,
        ai_overview_content: ai_overview_content || null,
        status: 'draft',
        current_stage: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
