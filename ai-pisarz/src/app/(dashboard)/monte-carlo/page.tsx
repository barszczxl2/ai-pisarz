'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dices,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  Target,
  Clock,
  LineChart,
  Calculator,
  Play,
  Circle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const PYTHON_CODE = `import numpy as np

def monte_carlo_seo_forecast(
    current_position: float,
    position_std: float,
    monthly_volume: int,
    simulations: int = 10000
) -> dict:
    """
    Symulacja Monte Carlo dla predykcji ruchu SEO.

    Args:
        current_position: Aktualna srednia pozycja (np. 4.5)
        position_std: Odchylenie standardowe pozycji (np. 2.0)
        monthly_volume: Miesieczny wolumen wyszukiwan
        simulations: Liczba symulacji (domyslnie 10,000)

    Returns:
        Slownik z percentylami ruchu (P10, P50, P90)
    """
    # CTR dla pozycji 1-10 (dane branzowe 2024)
    ctr_by_position = {
        1: 0.316, 2: 0.158, 3: 0.110, 4: 0.078, 5: 0.053,
        6: 0.038, 7: 0.029, 8: 0.022, 9: 0.018, 10: 0.014
    }

    traffic_results = []

    for _ in range(simulations):
        # Losuj pozycje z rozkladu normalnego
        simulated_position = np.random.normal(current_position, position_std)

        # Ogranicz do zakresu 1-10
        simulated_position = max(1, min(10, round(simulated_position)))

        # Pobierz CTR dla pozycji
        ctr = ctr_by_position.get(simulated_position, 0.01)

        # Oblicz ruch
        traffic = monthly_volume * ctr
        traffic_results.append(traffic)

    # Oblicz percentyle
    return {
        'pessimistic_p10': int(np.percentile(traffic_results, 10)),
        'realistic_p50': int(np.percentile(traffic_results, 50)),
        'optimistic_p90': int(np.percentile(traffic_results, 90)),
        'mean': int(np.mean(traffic_results)),
        'std': int(np.std(traffic_results))
    }

# Przyklad uzycia
result = monte_carlo_seo_forecast(
    current_position=4,
    position_std=2,
    monthly_volume=12000,
    simulations=10000
)

print(f"Predykcja ruchu dla 'buty nike':")
print(f"  Pesymistyczna (P10): {result['pessimistic_p10']} wizyt/mies.")
print(f"  Realistyczna (P50):  {result['realistic_p50']} wizyt/mies.")
print(f"  Optymistyczna (P90): {result['optimistic_p90']} wizyt/mies.")`;

const PI_PYTHON_CODE = `import random
import time

def monte_carlo_pi(square_side: float, radius: float, samples: int) -> dict:
    """
    Oblicz Pi metoda Monte Carlo - kolo wpisane w kwadrat.

    Args:
        square_side: Bok kwadratu
        radius: Promien kola (srodek w centrum kwadratu)
        samples: Liczba losowych punktow

    Returns:
        Slownik z wynikami symulacji
    """
    center_x = square_side / 2
    center_y = square_side / 2
    inside = 0

    start = time.time()

    for _ in range(samples):
        x = random.uniform(0, square_side)
        y = random.uniform(0, square_side)
        distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
        if distance <= radius:
            inside += 1

    end = time.time()
    elapsed_ms = (end - start) * 1000

    calculated_pi = 4 * (inside / samples)
    real_pi = 3.141592653589793

    return {
        'calculated_pi': calculated_pi,
        'real_pi': real_pi,
        'error_percent': abs((calculated_pi - real_pi) / real_pi) * 100,
        'time_ms': elapsed_ms,
        'samples_per_second': int(samples / (elapsed_ms / 1000)),
        'points_inside': inside,
        'points_outside': samples - inside
    }

# Przyklad uzycia - benchmark
result = monte_carlo_pi(
    square_side=100,
    radius=50,
    samples=1_000_000
)

print(f"Obliczone Pi: {result['calculated_pi']:.6f}")
print(f"Prawdziwe Pi: {result['real_pi']:.6f}")
print(f"Blad: {result['error_percent']:.4f}%")
print(f"Czas: {result['time_ms']:.0f} ms")
print(f"Wydajnosc: {result['samples_per_second']:,} prob/sek")`;

const CTR_BY_POSITION = {
  1: 0.316,
  2: 0.158,
  3: 0.110,
  4: 0.078,
  5: 0.053,
  6: 0.038,
  7: 0.029,
  8: 0.022,
  9: 0.018,
  10: 0.014,
};

const MONTE_CARLO_DESCRIPTION = `Symulacja Monte Carlo to potezna metoda statystyczna, ktora pozwala modelowac
niepewnosc i zmiennosc w prognozach. W kontekscie SEO, gdzie pozycje w Google
zmieniaja sie dynamicznie, Monte Carlo daje realistyczny obraz mozliwych scenariuszy
ruchu organicznego.

Zamiast pojedynczej prognozy "bedziesz miec 1000 wizyt", otrzymujesz rozklad
prawdopodobienstwa: "z 90% prawdopodobienstwem ruch bedzie miedzy 600 a 1400 wizyt".`;

const SEO_APPLICATIONS = [
  {
    icon: TrendingUp,
    title: 'Predykcja ruchu',
    description: 'Uwzglednij niepewnosc pozycji w prognozach ruchu organicznego',
  },
  {
    icon: Calculator,
    title: 'Szacowanie ROI',
    description: 'Oblicz zwrot z inwestycji w SEO z przedzialami ufnosci',
  },
  {
    icon: BarChart3,
    title: 'Analiza ryzyka',
    description: 'Identyfikuj slowa kluczowe o wysokiej zmiennosci pozycji',
  },
  {
    icon: LineChart,
    title: 'Modelowanie scenariuszy',
    description: 'Porownuj potencjal roznych fraz kluczowych',
  },
];

const SIMULATION_STEPS = [
  'Losuj pozycje z rozkladu normalnego',
  'Przypisz CTR na podstawie pozycji',
  'Oblicz ruch = Volume x CTR',
  'Powtorz 10,000 razy',
  'Wyznacz percentyle (P10, P50, P90)',
];

const PRACTICAL_APPLICATIONS = [
  {
    title: 'Budzetowanie SEO',
    description: 'Oszacuj ROI z przedzialami ufnosci',
  },
  {
    title: 'Priorytetyzacja slow kluczowych',
    description: 'Porownaj potencjal roznych fraz',
  },
  {
    title: 'Raportowanie do klienta',
    description: 'Pokaz realistyczne scenariusze zamiast "obiecywac"',
  },
  {
    title: 'Analiza ryzyka',
    description: 'Zidentyfikuj slowa o wysokiej zmiennosci pozycji',
  },
  {
    title: 'Planowanie contentu',
    description: 'Wybierz tematy z najlepszym stosunkiem ryzyko/zysk',
  },
];

// Types for Pi simulation
interface PiSimulationResult {
  calculatedPi: number;
  error: number;
  timeMs: number;
  samplesPerSecond: number;
  pointsInside: number;
  pointsOutside: number;
}

interface VisualPoint {
  x: number;
  y: number;
  inside: boolean;
}

// Maximum points to visualize for performance
const MAX_VISUAL_POINTS = 5000;

export default function MonteCarloPage() {
  const [copied, setCopied] = useState(false);
  const [piCodeCopied, setPiCodeCopied] = useState(false);

  // Pi simulation states
  const [squareSide, setSquareSide] = useState(100);
  const [radius, setRadius] = useState(50);
  const [samples, setSamples] = useState(1000000);
  const [piResult, setPiResult] = useState<PiSimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [visualPoints, setVisualPoints] = useState<VisualPoint[]>([]);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(PYTHON_CODE);
      setCopied(true);
      toast.success('Skopiowano kod do schowka');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nie udalo sie skopiowac');
    }
  }

  async function copyPiCode() {
    try {
      await navigator.clipboard.writeText(PI_PYTHON_CODE);
      setPiCodeCopied(true);
      toast.success('Skopiowano kod Python do schowka');
      setTimeout(() => setPiCodeCopied(false), 2000);
    } catch {
      toast.error('Nie udalo sie skopiowac');
    }
  }

  // Handle radius validation when square side changes
  const handleSquareSideChange = (value: number) => {
    const newSide = Math.max(10, Math.min(1000, value));
    setSquareSide(newSide);
    // Auto-correct radius if too large
    if (radius > newSide / 2) {
      setRadius(newSide / 2);
    }
  };

  // Handle radius change with validation
  const handleRadiusChange = (value: number) => {
    const maxRadius = squareSide / 2;
    setRadius(Math.max(1, Math.min(maxRadius, value)));
  };

  // Handle samples change with validation
  const handleSamplesChange = (value: number) => {
    setSamples(Math.max(1000, Math.min(100000000, value)));
  };

  // Run Pi simulation
  const runPiSimulation = useCallback(() => {
    setIsRunning(true);
    setPiResult(null);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const start = performance.now();

      const centerX = squareSide / 2;
      const centerY = squareSide / 2;
      let inside = 0;

      // Calculate sampling rate for visualization
      const sampleRate = samples > MAX_VISUAL_POINTS ? Math.floor(samples / MAX_VISUAL_POINTS) : 1;
      const newVisualPoints: VisualPoint[] = [];

      for (let i = 0; i < samples; i++) {
        const x = Math.random() * squareSide;
        const y = Math.random() * squareSide;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const isInside = distance <= radius;

        if (isInside) inside++;

        // Sample points for visualization
        if (i % sampleRate === 0 && newVisualPoints.length < MAX_VISUAL_POINTS) {
          newVisualPoints.push({ x, y, inside: isInside });
        }
      }

      const end = performance.now();
      const timeMs = end - start;
      const calculatedPi = 4 * (inside / samples);

      setVisualPoints(newVisualPoints);
      setPiResult({
        calculatedPi,
        error: Math.abs((calculatedPi - Math.PI) / Math.PI) * 100,
        timeMs,
        samplesPerSecond: Math.round(samples / (timeMs / 1000)),
        pointsInside: inside,
        pointsOutside: samples - inside,
      });
      setIsRunning(false);
    }, 50);
  }, [squareSide, radius, samples]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const scale = size / squareSide;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw square background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);

    // Draw circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius * scale, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    visualPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * scale, point.y * scale, 2, 0, 2 * Math.PI);
      ctx.fillStyle = point.inside ? '#22c55e' : '#ef4444';
      ctx.fill();
    });
  }, [squareSide, radius, visualPoints]);

  // Update canvas when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Format large numbers with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <Dices className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ANALIZA MONTE CARLO</h2>
            <p className="text-slate-500">Predykcja ruchu SEO z uwzglednieniem niepewnosci</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="px-3 py-1.5">
            Predykcja SEO
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5">
            Symulacje
          </Badge>
          <Badge variant="secondary" className="px-3 py-1.5">
            Python
          </Badge>
        </div>
      </div>

      {/* What is Monte Carlo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dices className="h-5 w-5 text-purple-600" />
            Czym jest Monte Carlo w SEO?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600 whitespace-pre-line">{MONTE_CARLO_DESCRIPTION}</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SEO_APPLICATIONS.map((app) => (
              <div
                key={app.title}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <app.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{app.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{app.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Measure Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Jak mierzyc i prognozowac ruch organiczny?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Data */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                <Target className="h-4 w-4 text-blue-600" />
                Dane wejsciowe do symulacji
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Aktualna pozycja w SERP
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Miesieczny wolumen wyszukiwan (Search Volume)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Historyczny CTR dla pozycji 1-10
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  Zmiennosc pozycji (odchylenie standardowe)
                </li>
              </ul>
            </div>

            {/* Simulation Process */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                <LineChart className="h-4 w-4 text-green-600" />
                Proces symulacji
              </h3>
              <ol className="space-y-2 text-sm text-slate-600">
                {SIMULATION_STEPS.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* CTR Table */}
          <div className="mt-6">
            <h3 className="font-semibold text-slate-900 mb-3">Wspolczynniki CTR dla pozycji (dane branzowe 2024)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-left font-medium text-slate-600">Pozycja</th>
                    {Object.keys(CTR_BY_POSITION).map((pos) => (
                      <th key={pos} className="py-2 px-3 text-center font-medium text-slate-600">
                        {pos}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-700">CTR</td>
                    {Object.values(CTR_BY_POSITION).map((ctr, index) => (
                      <td key={index} className="py-2 px-3 text-center text-slate-600">
                        {(ctr * 100).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Pi Calculation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5 text-green-600" />
            Klasyczny przyklad - Oblicz Pi
          </CardTitle>
          <CardDescription>
            Kolo wpisane w kwadrat - benchmark Twojego komputera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Explanation Section */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
              📐 Zasada dzialania
            </h3>
            <p className="text-sm text-slate-600">
              Wpisujemy kolo o promieniu <strong>r</strong> w kwadrat o boku <strong>2r</strong>.
              Losujemy punkty i sprawdzamy czy trafiaja w kolo.
            </p>
            <div className="mt-2 p-2 bg-white rounded border border-slate-200 font-mono text-sm text-center">
              Pi ≈ 4 × (punkty_w_kole / wszystkie_punkty)
            </div>
          </div>

          {/* Parameters and Visualization */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Parameters Column */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Parametry</h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="squareSide" className="text-sm text-slate-600">
                    Bok kwadratu
                  </Label>
                  <Input
                    id="squareSide"
                    type="number"
                    value={squareSide}
                    onChange={(e) => handleSquareSideChange(Number(e.target.value))}
                    min={10}
                    max={1000}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="radius" className="text-sm text-slate-600">
                    Promien kola (max: {squareSide / 2})
                  </Label>
                  <Input
                    id="radius"
                    type="number"
                    value={radius}
                    onChange={(e) => handleRadiusChange(Number(e.target.value))}
                    min={1}
                    max={squareSide / 2}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="samples" className="text-sm text-slate-600">
                    Liczba prob (1K - 100M)
                  </Label>
                  <Input
                    id="samples"
                    type="number"
                    value={samples}
                    onChange={(e) => handleSamplesChange(Number(e.target.value))}
                    min={1000}
                    max={100000000}
                    step={10000}
                    className="h-9"
                  />
                </div>
              </div>

              <Button
                onClick={runPiSimulation}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Obliczanie...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Uruchom symulacje
                  </>
                )}
              </Button>
            </div>

            {/* Visualization Column */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Wizualizacja</h3>
              <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="rounded-lg border border-slate-200 w-full h-full"
                />
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>w kole</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span>poza kolem</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {piResult && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Wyniki</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="text-xs text-green-700 mb-1">Obliczone Pi</div>
                  <div className="font-mono text-lg font-semibold text-green-900">
                    {piResult.calculatedPi.toFixed(6)}
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="text-xs text-blue-700 mb-1">Prawdziwe Pi</div>
                  <div className="font-mono text-lg font-semibold text-blue-900">
                    {Math.PI.toFixed(6)}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="text-xs text-orange-700 mb-1">Blad</div>
                  <div className="font-mono text-lg font-semibold text-orange-900">
                    {piResult.error.toFixed(4)}%
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600 mb-1">Czas wykonania</div>
                  <div className="font-mono text-lg font-semibold text-slate-900">
                    {piResult.timeMs.toFixed(0)} ms
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600 mb-1">Wydajnosc</div>
                  <div className="font-mono text-lg font-semibold text-slate-900">
                    {formatNumber(piResult.samplesPerSecond)} prob/sek
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600 mb-1">Punkty w kole</div>
                  <div className="font-mono text-lg font-semibold text-slate-900">
                    {formatNumber(piResult.pointsInside)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Python Code Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                🐍 Kod Python
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={copyPiCode}
              >
                {piCodeCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Skopiowano
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopiuj kod
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 max-h-[300px]">
                <code>{PI_PYTHON_CODE}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Python Code Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Przyklad Python
          </CardTitle>
          <CardDescription>
            Kompletny kod do uruchomienia symulacji Monte Carlo dla SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Code Column */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  Kod symulacji
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      Skopiowano
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Kopiuj kod
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 max-h-[500px]">
                  <code>{PYTHON_CODE}</code>
                </pre>
              </div>
            </div>

            {/* Example Result Column */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                Przykladowy wynik
              </h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Keyword:</span>
                    <span className="font-medium text-slate-900">&quot;buty nike air max&quot;</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Volume:</span>
                    <span className="font-medium text-slate-900">12,000 / miesiac</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pozycja:</span>
                    <span className="font-medium text-slate-900">4 (±2)</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Predykcja ruchu:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 p-3">
                      <span className="text-sm text-red-700">Pesymistyczna (P10)</span>
                      <span className="font-semibold text-red-900">420 wizyt</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <span className="text-sm text-blue-700">Realistyczna (P50)</span>
                      <span className="font-semibold text-blue-900">780 wizyt</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 p-3">
                      <span className="text-sm text-green-700">Optymistyczna (P90)</span>
                      <span className="font-semibold text-green-900">1,200 wizyt</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
                  Wyniki symulacji (10,000 iteracji)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Applications Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Zastosowania praktyczne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICAL_APPLICATIONS.map((app) => (
              <div
                key={app.title}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50 transition-colors"
              >
                <h3 className="font-semibold text-slate-900">{app.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{app.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI PISARZ Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Dices className="h-5 w-5 text-purple-600" />
              Zastosowania w AI PISARZ
            </CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-3 w-3 mr-1" />
              Wkrotce
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
              <Dices className="h-7 w-7 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">Planowane funkcje:</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• Automatyczna predykcja ruchu dla projektow</li>
                <li>• Wizualizacja rozkladu prawdopodobienstwa</li>
                <li>• Porownanie scenariuszy dla roznych slow kluczowych</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
