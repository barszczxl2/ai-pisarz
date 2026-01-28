'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { GraphData, ClusterNode } from '@/types/database';
import { getClusterColor } from '@/lib/clustering';

interface ClusterGraphProps {
  data: GraphData;
  onNodeClick?: (node: ClusterNode) => void;
  onNodeHover?: (node: ClusterNode | null) => void;
  width?: number;
  height?: number;
}

// Extended types for force graph
interface GraphNode extends NodeObject {
  id: string;
  keyword: string;
  traffic: number;
  cluster: number;
  hasInteria: boolean;
  description: string | null;
}

interface GraphLink extends LinkObject {
  source: string | GraphNode;
  target: string | GraphNode;
  similarity: number;
}

export default function ClusterGraph({
  data,
  onNodeClick,
  onNodeHover,
  width,
  height = 500,
}: ClusterGraphProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        setDimensions({
          width: width || containerRef.current.clientWidth,
          height,
        });
      }
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);

  // Center graph when data changes
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [data]);

  // Node size based on traffic (log scale for better distribution)
  const getNodeSize = useCallback((node: GraphNode) => {
    const minSize = 5;
    const maxSize = 25;
    const traffic = node.traffic || 1;
    const size = minSize + Math.log10(traffic + 1) * 4;
    return Math.min(maxSize, Math.max(minSize, size));
  }, []);

  // Draw node with custom styling
  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = getNodeSize(node);
      const fontSize = Math.max(10 / globalScale, 3);
      const isHovered = hoveredNode?.id === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
      ctx.fillStyle = getClusterColor(node.cluster);
      ctx.fill();

      // Interia indicator (ring)
      if (node.hasInteria) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Hover effect
      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Label (only when zoomed in enough or hovered)
      if (globalScale > 0.8 || isHovered) {
        ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1e293b';

        // Background for text
        const textWidth = ctx.measureText(node.keyword).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
          (node.x || 0) - textWidth / 2 - 2,
          (node.y || 0) + size + 2,
          textWidth + 4,
          fontSize + 2
        );

        ctx.fillStyle = '#1e293b';
        ctx.fillText(node.keyword, node.x || 0, (node.y || 0) + size + 3);
      }
    },
    [getNodeSize, hoveredNode]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (onNodeClick) {
        onNodeClick(node as ClusterNode);
      }
    },
    [onNodeClick]
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      setHoveredNode(node);
      if (onNodeHover) {
        onNodeHover(node as ClusterNode | null);
      }
    },
    [onNodeHover]
  );

  // Link styling
  const getLinkWidth = useCallback((link: GraphLink) => {
    return 1 + link.similarity * 3;
  }, []);

  const getLinkColor = useCallback((link: GraphLink) => {
    const alpha = 0.2 + link.similarity * 0.4;
    return `rgba(100, 116, 139, ${alpha})`;
  }, []);

  if (data.nodes.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center bg-slate-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-slate-500">
          <p className="text-lg font-medium">Brak danych do wyświetlenia</p>
          <p className="text-sm">Trendy z embeddingami pojawią się tutaj</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data as { nodes: GraphNode[]; links: GraphLink[] }}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={(node: GraphNode, color, ctx) => {
            const size = getNodeSize(node);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, size + 2, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkWidth={getLinkWidth}
          linkColor={getLinkColor}
          linkCurvature={0.1}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          minZoom={0.5}
          maxZoom={5}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-slate-300" />
          <span className="text-slate-600">Ma Interię</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getClusterColor(i) }}
              />
            ))}
          </div>
          <span className="text-slate-600">Grupy tematyczne</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredNode && (
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-[250px] text-sm">
          <p className="font-semibold text-slate-900">{hoveredNode.keyword}</p>
          <div className="mt-1 space-y-1 text-slate-600">
            <p>Traffic: {hoveredNode.traffic ? `${hoveredNode.traffic}K` : 'N/A'}</p>
            <p>Grupa: {hoveredNode.cluster + 1}</p>
            {hoveredNode.hasInteria && (
              <p className="text-green-600">Ma artykuł w Interia</p>
            )}
          </div>
          {hoveredNode.description && (
            <p className="mt-2 text-xs text-slate-500 line-clamp-2">
              {hoveredNode.description}
            </p>
          )}
          <p className="mt-2 text-xs text-purple-600">Kliknij, aby zobaczyć szczegóły</p>
        </div>
      )}
    </div>
  );
}
