'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Loader2, ZoomIn, ZoomOut, RotateCcw, Check, Crop as CropIcon } from 'lucide-react';

interface CropEditorProps {
  sourceImageUrl: string;
  productName: string;
  productIndex: number;
  initialCrop?: { x: number; y: number; width: number; height: number };
  onCropComplete: (productIndex: number, croppedImageUrl: string) => void;
  onCancel: () => void;
}

/**
 * Modal z edytorem kadrowania produktu z gazetki
 */
export function CropEditor({
  sourceImageUrl,
  productName,
  productIndex,
  initialCrop,
  onCropComplete,
  onCancel,
}: CropEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCropping, setIsCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Uzyj proxy dla zewnetrznych obrazow (omija CORS)
  const proxyImageUrl = sourceImageUrl.startsWith('data:')
    ? sourceImageUrl
    : `/api/proxy-image?url=${encodeURIComponent(sourceImageUrl)}`;

  // Ustaw domyslny crop na srodku obrazka
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setImageLoaded(true);
      setIsLoading(false);
      setImageError(null);

      // Jesli mamy initialCrop, uzyj go (przelicz na procenty)
      if (initialCrop && imgRef.current) {
        const imgWidth = imgRef.current.naturalWidth;
        const imgHeight = imgRef.current.naturalHeight;

        setCrop({
          unit: '%',
          x: (initialCrop.x / imgWidth) * 100,
          y: (initialCrop.y / imgHeight) * 100,
          width: (initialCrop.width / imgWidth) * 100,
          height: (initialCrop.height / imgHeight) * 100,
        });
      } else {
        // Domyslny crop - 30% w centrum
        const defaultCrop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 30,
            },
            1,
            width,
            height
          ),
          width,
          height
        );
        setCrop(defaultCrop);
      }
    },
    [initialCrop]
  );

  // Obsluga bledu ladowania obrazu
  const onImageError = useCallback(() => {
    setIsLoading(false);
    setImageError('Nie udalo sie zaladowac obrazu. Sprawdz URL.');
  }, []);

  // Generuj podglad w czasie rzeczywistym
  useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    // Ustaw rozmiar canvas na 150x150 dla podgladu
    const previewSize = 150;
    canvas.width = previewSize;
    canvas.height = previewSize;

    // Wypelnij bialym tlem
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, previewSize, previewSize);

    // Oblicz skalowanie z zachowaniem proporcji
    const cropAspect = pixelCrop.width / pixelCrop.height;
    let drawWidth = previewSize;
    let drawHeight = previewSize;
    let offsetX = 0;
    let offsetY = 0;

    if (cropAspect > 1) {
      drawHeight = previewSize / cropAspect;
      offsetY = (previewSize - drawHeight) / 2;
    } else {
      drawWidth = previewSize * cropAspect;
      offsetX = (previewSize - drawWidth) / 2;
    }

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );

    // Generuj URL podgladu
    setPreviewUrl(canvas.toDataURL('image/webp', 0.85));
  }, [completedCrop]);

  // Wyslij crop do API
  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) {
      console.error('No crop or image');
      return;
    }

    setIsCropping(true);

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Przelicz crop na piksele obrazka zrodlowego
      const bbox: [number, number, number, number] = [
        Math.round(completedCrop.x * scaleX),
        Math.round(completedCrop.y * scaleY),
        Math.round((completedCrop.x + completedCrop.width) * scaleX),
        Math.round((completedCrop.y + completedCrop.height) * scaleY),
      ];

      console.log('Sending crop request with bbox:', bbox);

      const response = await fetch('/api/crop-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImageUrl,
          products: [{ id: `product_${productIndex}`, bbox }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Blad wycinania');
      }

      const data = await response.json();

      if (data.croppedImages && data.croppedImages.length > 0) {
        const croppedImageUrl = data.croppedImages[0].imageUrl;
        onCropComplete(productIndex, croppedImageUrl);
      } else {
        throw new Error('Brak wycietetego obrazka w odpowiedzi');
      }
    } catch (err) {
      console.error('Crop error:', err);
      alert(err instanceof Error ? err.message : 'Nieznany blad wycinania');
    } finally {
      setIsCropping(false);
    }
  };

  // Reset crop do domyslnego
  const handleReset = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current;
    const defaultCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 30 }, 1, width, height),
      width,
      height
    );
    setCrop(defaultCrop);
  };

  // Zoom kontrolki
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CropIcon className="h-5 w-5 text-purple-600" />
              Kadruj: {productName}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Zoom kontrolki */}
              <div className="flex items-center gap-1 border rounded-lg px-2 py-1 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="h-7 w-7 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="h-7 w-7 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2"
                title="Resetuj kadrowanie"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden p-4 flex gap-4">
          {/* Obraz zrodlowy z crop selection */}
          <div className="flex-1 overflow-auto bg-slate-100 rounded-lg flex items-center justify-center">
            {isLoading && (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Ladowanie obrazu...</span>
              </div>
            )}
            {imageError && (
              <div className="flex flex-col items-center gap-2 text-red-500 p-4 text-center">
                <X className="h-8 w-8" />
                <span className="text-sm">{imageError}</span>
              </div>
            )}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
                display: isLoading || imageError ? 'none' : 'block',
              }}
            >
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={proxyImageUrl}
                  alt="Strona gazetki"
                  onLoad={onImageLoad}
                  onError={onImageError}
                  className="max-w-full max-h-[65vh] object-contain"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Panel podgladu */}
          <div className="w-48 flex-shrink-0 flex flex-col gap-4">
            {/* Podglad wyciecia */}
            <div className="bg-slate-50 rounded-lg p-3 border">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Podglad</h4>
              <div className="aspect-square bg-white rounded border overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Podglad"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">
                    Zaznacz obszar
                  </span>
                )}
              </div>
              <canvas ref={previewCanvasRef} className="hidden" />
            </div>

            {/* Instrukcje */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-xs text-purple-700">
              <p className="font-medium mb-1">Jak kadrowac:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Przeciagnij ramke na produkt</li>
                <li>Uzyj rogow do zmiany rozmiaru</li>
                <li>Podglad aktualizuje sie na zywo</li>
              </ul>
            </div>

            {/* Przyciski akcji */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={handleCropConfirm}
                disabled={!completedCrop || isCropping}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isCropping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wycinanie...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Zatwierdz
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isCropping}
                className="w-full"
              >
                Anuluj
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
