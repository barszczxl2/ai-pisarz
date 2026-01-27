'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tag, ImageOff, Package, Crop } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS, ProductCategory } from '@/types/database';

interface ProductCardProps {
  imageUrl: string | null;
  name: string;
  brand?: string | null;
  price: number | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  unit?: string | null;
  category?: string | null;
  isLoading?: boolean;
  onCropClick?: () => void;       // Handler do otwierania CropEditor
  showCropButton?: boolean;       // Czy pokazywac przycisk kadrowania
}

export function ProductCard({
  imageUrl,
  name,
  brand,
  price,
  originalPrice,
  discountPercent,
  unit,
  category,
  isLoading = false,
  onCropClick,
  showCropButton = false,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Format ceny
  const formatPrice = (value: number | null): string => {
    if (value === null) return '-';
    return `${value.toFixed(2).replace('.', ',')} zl`;
  };

  // Pobierz etykiete kategorii
  const getCategoryLabel = (cat: string | null): string => {
    if (!cat) return 'Inne';
    return PRODUCT_CATEGORY_LABELS[cat as ProductCategory] || cat;
  };

  // Skeleton dla ladowania
  if (isLoading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="aspect-square bg-slate-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-5 bg-slate-200 rounded w-1/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col group">
      {/* Obrazek produktu */}
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            {imageUrl ? (
              <>
                <ImageOff className="h-10 w-10 mb-2" />
                <span className="text-xs">Blad ladowania</span>
              </>
            ) : (
              <>
                <Package className="h-10 w-10 mb-2" />
                <span className="text-xs">Brak obrazka</span>
              </>
            )}
          </div>
        )}

        {/* Badge rabatu w rogu */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white font-bold shadow-md">
              -{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Przycisk kadrowania - widoczny przy hover */}
        {showCropButton && onCropClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCropClick();
            }}
            className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1"
            title="Kadruj obrazek"
          >
            <Crop className="h-4 w-4" />
            <span className="text-xs font-medium">Kadruj</span>
          </button>
        )}
      </div>

      {/* Informacje o produkcie */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Marka */}
        {brand && (
          <span className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            {brand}
          </span>
        )}

        {/* Nazwa produktu */}
        <h3 className="font-medium text-slate-900 text-sm leading-tight line-clamp-2 mb-1">
          {name}
        </h3>

        {/* Gramatura/jednostka */}
        {unit && (
          <span className="text-xs text-slate-500 mb-2">
            {unit}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Ceny */}
        <div className="flex items-end gap-2 mt-2">
          <span className="text-lg font-bold text-green-700">
            {formatPrice(price)}
          </span>
          {originalPrice && originalPrice > (price || 0) && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* Kategoria */}
        {category && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
              <Tag className="h-3 w-3" />
              {getCategoryLabel(category)}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Siatka kart produktow
 */
interface ProductGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function ProductGrid({ children, columns = 4 }: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
