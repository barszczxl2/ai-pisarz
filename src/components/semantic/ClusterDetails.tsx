'use client';

import { useMemo } from 'react';
import { ClusterNode, GraphData } from '@/types/database';
import { getClusterColor, getClusterStats, generateClusterName } from '@/lib/clustering';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Newspaper, Hash, Users } from 'lucide-react';

interface ClusterDetailsProps {
  data: GraphData;
  selectedNode: ClusterNode | null;
  onNodeSelect?: (node: ClusterNode) => void;
}

export default function ClusterDetails({
  data,
  selectedNode,
  onNodeSelect,
}: ClusterDetailsProps) {
  // Get unique clusters
  const clusters = useMemo(() => {
    const clusterMap = new Map<number, ClusterNode[]>();

    for (const node of data.nodes) {
      if (!clusterMap.has(node.cluster)) {
        clusterMap.set(node.cluster, []);
      }
      clusterMap.get(node.cluster)!.push(node);
    }

    // Sort clusters by total traffic
    return Array.from(clusterMap.entries())
      .map(([clusterId, nodes]) => ({
        id: clusterId,
        nodes: nodes.sort((a, b) => b.traffic - a.traffic),
        stats: getClusterStats(data.nodes, clusterId),
        name: generateClusterName(data.nodes, clusterId),
      }))
      .sort((a, b) => b.stats.totalTraffic - a.stats.totalTraffic);
  }, [data.nodes]);

  // Find selected cluster
  const selectedCluster = selectedNode
    ? clusters.find(c => c.id === selectedNode.cluster)
    : null;

  // Find related clusters (connected by links)
  const relatedClusters = useMemo(() => {
    if (!selectedNode) return [];

    const relatedIds = new Set<number>();

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as ClusterNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as ClusterNode).id;

      if (sourceId === selectedNode.id) {
        const targetNode = data.nodes.find(n => n.id === targetId);
        if (targetNode && targetNode.cluster !== selectedNode.cluster) {
          relatedIds.add(targetNode.cluster);
        }
      } else if (targetId === selectedNode.id) {
        const sourceNode = data.nodes.find(n => n.id === sourceId);
        if (sourceNode && sourceNode.cluster !== selectedNode.cluster) {
          relatedIds.add(sourceNode.cluster);
        }
      }
    }

    return clusters.filter(c => relatedIds.has(c.id));
  }, [selectedNode, data, clusters]);

  if (data.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 p-6">
        <p className="text-center">Brak grup tematycznych do wyświetlenia</p>
      </div>
    );
  }

  // Show selected cluster details or cluster list
  if (selectedCluster) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Cluster header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getClusterColor(selectedCluster.id) }}
            />
            <h3 className="font-semibold text-slate-900 truncate" title={selectedCluster.name}>
              Grupa: {selectedCluster.name}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs mb-2">
            {selectedCluster.stats.count} trendów w grupie
          </Badge>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-slate-600">
              <TrendingUp className="w-3 h-3" />
              <span>{selectedCluster.stats.totalTraffic}K traffic</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Newspaper className="w-3 h-3" />
              <span>{selectedCluster.stats.interiaPercentage}% z Interią</span>
            </div>
          </div>
        </div>

        {/* Trends list */}
        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Trendy w grupie
          </h4>
          <div className="space-y-2">
            {selectedCluster.nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => onNodeSelect?.(node)}
                className={`w-full text-left p-2 rounded-lg border transition-colors ${
                  selectedNode?.id === node.id
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 truncate">
                    {node.keyword}
                  </span>
                  {node.hasInteria && (
                    <span className="text-xs text-green-600 whitespace-nowrap ml-2">
                      Interia
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{node.traffic}K</span>
                  {node.description && (
                    <span className="truncate">{node.description}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Related clusters */}
          {relatedClusters.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Powiązane grupy
              </h4>
              <div className="flex flex-wrap gap-2">
                {relatedClusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    onClick={() => onNodeSelect?.(cluster.nodes[0])}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border border-slate-200 hover:bg-slate-50 transition-colors"
                    title={cluster.name}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getClusterColor(cluster.id) }}
                    />
                    <span className="truncate max-w-[100px]">{cluster.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: show all clusters
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Przegląd grup tematycznych
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {clusters.length} grup • {data.nodes.length} trendów
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {clusters.map((cluster) => (
          <button
            key={cluster.id}
            onClick={() => onNodeSelect?.(cluster.nodes[0])}
            className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getClusterColor(cluster.id) }}
              />
              <span className="font-medium text-slate-900 truncate" title={cluster.name}>
                {cluster.name}
              </span>
              <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                {cluster.stats.count}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {cluster.stats.totalTraffic}K
              </span>
              <span className="flex items-center gap-1">
                <Newspaper className="w-3 h-3" />
                {cluster.stats.interiaPercentage}%
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.nodes.slice(0, 3).map((node) => (
                <span
                  key={node.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700"
                >
                  <Hash className="w-2 h-2" />
                  {node.keyword}
                </span>
              ))}
              {cluster.nodes.length > 3 && (
                <span className="text-xs text-slate-400">
                  +{cluster.nodes.length - 3}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
