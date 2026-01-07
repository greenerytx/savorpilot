import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitFork,
  ChevronDown,
  ChevronRight,
  Star,
  Users,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useGenealogyTree } from '../../hooks/useForkEnhancements';
import type { GenealogyTreeNode } from '../../services/fork-enhancements.service';
import { Card, Badge, Button } from '../ui';
import { cn, getImageUrl } from '../../lib/utils';

interface RecipeGenealogyTreeProps {
  recipeId: string;
  className?: string;
}

interface TreeNodeProps {
  node: GenealogyTreeNode;
  currentPath: string[];
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  level: number;
  isLast: boolean;
  parentLines: boolean[];
}

/**
 * Single tree node component
 */
function TreeNode({
  node,
  currentPath,
  expandedNodes,
  onToggleExpand,
  level,
  isLast,
  parentLines,
}: TreeNodeProps) {
  const navigate = useNavigate();
  const isInPath = currentPath.includes(node.id);
  const isCurrent = currentPath[currentPath.length - 1] === node.id;
  const isRoot = level === 0;
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;

  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(`/recipes/${node.id}`);
    },
    [navigate, node.id]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onToggleExpand(node.id);
    },
    [onToggleExpand, node.id]
  );

  return (
    <div className="relative">
      {/* Connection lines */}
      <div className="flex">
        {/* Vertical lines from parent levels */}
        {parentLines.map((showLine, idx) => (
          <div
            key={idx}
            className={cn(
              'w-6 flex-shrink-0',
              showLine && 'border-l-2 border-neutral-200'
            )}
          />
        ))}

        {/* Horizontal connector + vertical line for this node */}
        {level > 0 && (
          <div className="flex-shrink-0 relative">
            {/* Horizontal line */}
            <div
              className={cn(
                'absolute top-4 w-6 h-0.5',
                isInPath ? 'bg-primary-400' : 'bg-neutral-200'
              )}
              style={{ left: '-24px' }}
            />
            {/* Vertical line segment */}
            {!isLast && (
              <div
                className="absolute left-0 w-0.5 bg-neutral-200"
                style={{ top: '16px', bottom: '-100%', left: '-24px' }}
              />
            )}
          </div>
        )}

        {/* Node content */}
        <div
          className={cn(
            'flex-1 min-w-0 mb-2 group cursor-pointer',
            level > 0 && 'ml-2'
          )}
        >
          <div
            onClick={handleNodeClick}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border-2 transition-all',
              isCurrent
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md'
                : isInPath
                  ? 'border-primary-300 bg-primary-50/50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
            )}
          >
            {/* Expand/collapse button for nodes with children */}
            {hasChildren ? (
              <button
                onClick={handleToggle}
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                  'hover:bg-neutral-100',
                  isExpanded && 'bg-neutral-100'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-300" />
              </div>
            )}

            {/* Recipe image */}
            {node.imageUrl ? (
              <img
                src={getImageUrl(node.imageUrl)}
                alt={node.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center flex-shrink-0">
                <GitFork className="w-5 h-5 text-neutral-400" />
              </div>
            )}

            {/* Recipe info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={cn(
                    'font-medium text-sm truncate',
                    isCurrent ? 'text-primary-700' : 'text-neutral-900'
                  )}
                >
                  {node.title}
                </h4>
                {isRoot && (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                    <Crown className="w-3 h-3" />
                    Original
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="bg-primary-100 text-primary-700 text-[10px] px-1.5 py-0 flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" />
                    You're here
                  </Badge>
                )}
              </div>

              {/* Author */}
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                by {node.author.firstName} {node.author.lastName}
              </p>

              {/* Fork note */}
              {node.forkNote && !isRoot && (
                <p className="text-xs text-neutral-500 mt-1 italic line-clamp-1">
                  "{node.forkNote}"
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 mt-1.5">
                {node.forkCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <GitFork className="w-3 h-3" />
                    {node.forkCount}
                  </span>
                )}
                {node.voteCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Star className="w-3 h-3" />
                    {node.voteCount}
                  </span>
                )}
              </div>

              {/* Fork tags */}
              {node.forkTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {node.forkTags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {node.forkTags.length > 3 && (
                    <span className="text-[10px] text-neutral-400">
                      +{node.forkTags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              currentPath={currentPath}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              isLast={idx === node.children.length - 1}
              parentLines={[...parentLines, !isLast]}
            />
          ))}

          {node.hasMoreChildren && (
            <div className="ml-8 pl-6 text-xs text-neutral-400 italic mb-2">
              + more forks not shown...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Recipe Genealogy Tree - Interactive visualization of fork family tree
 */
export function RecipeGenealogyTree({
  recipeId,
  className,
}: RecipeGenealogyTreeProps) {
  const { data, isLoading, error } = useGenealogyTree(recipeId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Auto-expand nodes in the current path
  useMemo(() => {
    if (data?.currentPath) {
      setExpandedNodes(new Set(data.currentPath));
    }
  }, [data?.currentPath]);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!data?.root) return;

    const collectAllIds = (node: GenealogyTreeNode): string[] => {
      return [node.id, ...node.children.flatMap(collectAllIds)];
    };

    setExpandedNodes(new Set(collectAllIds(data.root)));
  }, [data]);

  const handleCollapseAll = useCallback(() => {
    if (!data?.currentPath) return;
    // Keep only the path to current recipe expanded
    setExpandedNodes(new Set(data.currentPath));
  }, [data?.currentPath]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      </Card>
    );
  }

  if (error || !data?.root) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center py-8 text-neutral-500">
          <GitFork className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No genealogy data available</p>
          <p className="text-xs mt-1">
            This recipe hasn't been forked yet or is the original.
          </p>
        </div>
      </Card>
    );
  }

  const treeContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-neutral-900">Recipe Family Tree</h3>
          <Badge variant="secondary" className="text-xs">
            {data.totalNodes} recipes
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            title="Expand all"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            title="Collapse all"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-primary-500 bg-primary-50" />
          <span>Current recipe</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-primary-300 bg-primary-50/50" />
          <span>Ancestry path</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1 py-0">
            <Crown className="w-2.5 h-2.5" />
          </Badge>
          <span>Original recipe</span>
        </div>
      </div>

      {/* Tree */}
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          <TreeNode
            node={data.root}
            currentPath={data.currentPath}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            level={0}
            isLast={true}
            parentLines={[]}
          />
        </div>
      </div>

      {/* Warning if max depth reached */}
      {data.maxDepthReached && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          Some deeply nested branches are not shown to keep the tree readable.
        </div>
      )}
    </>
  );

  // Fullscreen modal
  if (isFullScreen) {
    return (
      <>
        <Card className={cn('p-6', className)}>
          <Button
            variant="outline"
            onClick={() => setIsFullScreen(true)}
            className="w-full"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            View Full Family Tree
          </Button>
        </Card>

        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">
                Recipe Family Tree
              </h2>
              <Button variant="outline" onClick={() => setIsFullScreen(false)}>
                Close
              </Button>
            </div>
            {treeContent}
          </div>
        </div>
      </>
    );
  }

  return <Card className={cn('p-6', className)}>{treeContent}</Card>;
}

export default RecipeGenealogyTree;
