import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface OllamaModel {
  id: string;
  name: string;
  size: string;
  isCloud: boolean;
  isVision: boolean;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
}

// Modele OpenRouter z vision
const OPENROUTER_VISION_MODELS: OpenRouterModel[] = [
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', description: 'Bardzo szybki i tani' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Najnowszy Gemini' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Wysoka jakość' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI multimodal' },
  { id: 'meta-llama/llama-3.2-90b-vision-instruct', name: 'Llama 3.2 90B Vision', description: 'Open source' },
];

// Modele Ollama które mają vision
const VISION_MODEL_PATTERNS = [
  'qwen3-vl',
  'llava',
  'gemma3',
  'minicpm-v',
  'bakllava',
  'moondream',
  'cogvlm',
  'deepseek-vl',
  'deepseek-ocr',
  'internvl',
  'devstral',
  'ministral',
  'mistral-large',
  'glm',
];

// Modele Ollama Cloud (hardcoded - dostępne w subskrypcji Turbo $20/mies)
const OLLAMA_CLOUD_MODELS: OllamaModel[] = [
  { id: 'qwen3-vl:235b-instruct-cloud', name: 'Qwen3 VL 235B (Cloud)', size: '235B', isCloud: true, isVision: true },
  { id: 'qwen3-vl:8b-cloud', name: 'Qwen3 VL 8B (Cloud)', size: '8B', isCloud: true, isVision: true },
  { id: 'gemma3:27b-cloud', name: 'Gemma3 27B (Cloud)', size: '27B', isCloud: true, isVision: true },
  { id: 'devstral-small-2:24b-cloud', name: 'Devstral Small 2 (Cloud)', size: '24B', isCloud: true, isVision: true },
  { id: 'ministral-3:8b-cloud', name: 'Ministral 3 (Cloud)', size: '8B', isCloud: true, isVision: true },
  { id: 'mistral-large-3:675b-cloud', name: 'Mistral Large 3 (Cloud)', size: '675B', isCloud: true, isVision: true },
];

function isVisionModel(modelName: string): boolean {
  const lower = modelName.toLowerCase();
  return VISION_MODEL_PATTERNS.some(pattern => lower.includes(pattern));
}

async function getOllamaModels(): Promise<OllamaModel[]> {
  try {
    const { stdout } = await execAsync('ollama list', { timeout: 5000 });
    const lines = stdout.trim().split('\n').slice(1); // Skip header

    return lines.map(line => {
      const parts = line.split(/\s+/);
      const fullName = parts[0]; // e.g., "qwen3-vl:8b" or "mistral-large-3:675b-cloud"
      const size = parts[2] || '';

      const isCloud = fullName.includes('-cloud') || size === '405' || size === '406' || size === '384' || size === '366';
      const isVision = isVisionModel(fullName);

      // Clean name for display
      const displayName = fullName
        .replace(':latest', '')
        .replace('-cloud', ' (Cloud)');

      return {
        id: fullName,
        name: displayName,
        size,
        isCloud,
        isVision,
      };
    });
  } catch (error) {
    console.error('Failed to get Ollama models:', error);
    return [];
  }
}

/**
 * GET: Get available OCR models from Ollama (local + cloud) and OpenRouter
 */
export async function GET() {
  const ollamaModels = await getOllamaModels();

  // Filter vision models
  const ollamaVisionModels = ollamaModels.filter(m => m.isVision);

  // Check if OpenRouter is configured
  const openrouterConfigured = !!process.env.OPENROUTER_API_KEY;
  const ollamaConfigured = ollamaModels.length > 0;

  // Combine local models from ollama list with hardcoded cloud models
  const localModels = ollamaModels.filter(m => !m.isCloud);
  const allCloudModels = OLLAMA_CLOUD_MODELS;

  // Build response
  const models = {
    ollama: {
      configured: ollamaConfigured || allCloudModels.length > 0,
      all: [...localModels, ...allCloudModels],
      vision: [...ollamaVisionModels, ...allCloudModels.filter(m => m.isVision)],
      local: localModels,
      cloud: allCloudModels,
    },
    openrouter: {
      configured: openrouterConfigured,
      models: openrouterConfigured ? OPENROUTER_VISION_MODELS : [],
    },
  };

  // Default model
  const defaultModel = process.env.OLLAMA_VISION_MODEL || 'qwen3-vl:8b';

  return NextResponse.json({
    status: 'ok',
    models,
    defaultModel,
    visionModelsCount: ollamaVisionModels.length + (openrouterConfigured ? OPENROUTER_VISION_MODELS.length : 0),
  });
}
