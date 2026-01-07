import { useState } from 'react';
import {
  Plus,
  Users,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button, Card, useToast, useConfirm } from '../../components/ui';
import { CreateCircleModal, EditCircleModal, MembersList } from '../../components/circles';
import {
  useCircles,
  useCircle,
  useDeleteCircle,
  useCircleDietaryInfo,
} from '../../hooks/useDinnerCircles';
import { cn } from '../../lib/utils';
import type { DinnerCircle } from '../../services/dinner-circles.service';

export function DinnerCirclesPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const { data: circles, isLoading, error } = useCircles();
  const { data: selectedCircle } = useCircle(selectedCircleId || '');
  const { data: dietaryInfo } = useCircleDietaryInfo(selectedCircleId || '');
  const deleteCircle = useDeleteCircle();

  const handleDeleteCircle = async (circle: DinnerCircle) => {
    const confirmed = await confirmDialog({
      title: 'Delete Circle',
      message: `Are you sure you want to delete "${circle.name}"? This will remove all members.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteCircle.mutateAsync(circle.id);
        if (selectedCircleId === circle.id) {
          setSelectedCircleId(null);
        }
        toast.success('Circle deleted');
      } catch {
        toast.error('Failed to delete circle');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <AlertTriangle className="w-12 h-12 mb-3" />
        <p>Failed to load circles</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Dinner Circles</h1>
          <p className="text-neutral-500 mt-1">
            Manage your household groups and dietary preferences
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Circle
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Circles List */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
            Your Circles
          </h2>

          {circles?.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 font-medium">No circles yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Create a circle to manage your household's preferences
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Circle
              </Button>
            </Card>
          ) : (
            circles?.map((circle) => (
              <button
                key={circle.id}
                onClick={() => setSelectedCircleId(circle.id)}
                className={cn(
                  'w-full text-left p-4 rounded-xl border transition-all',
                  selectedCircleId === circle.id
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{circle.emoji || '👨‍👩‍👧‍👦'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-800 truncate">
                      {circle.name}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {circle.memberCount} member{circle.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Circle Detail */}
        <div className="lg:col-span-2">
          {selectedCircle ? (
            <div className="space-y-6">
              {/* Circle Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{selectedCircle.emoji || '👨‍👩‍👧‍👦'}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-800">
                        {selectedCircle.name}
                      </h2>
                      {selectedCircle.description && (
                        <p className="text-neutral-500 mt-1">
                          {selectedCircle.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                      title="Edit circle"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCircle(selectedCircle)}
                      title="Delete circle"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Dietary Summary */}
                {dietaryInfo && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-neutral-600 mb-2">
                      Dietary Summary
                    </h3>
                    <p className="text-sm text-neutral-700">
                      {dietaryInfo.summary}
                    </p>
                    {dietaryInfo.restrictions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietaryInfo.restrictions.map((r) => (
                          <span
                            key={r}
                            className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                    {dietaryInfo.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietaryInfo.allergens.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Members */}
              <MembersList circleId={selectedCircle.id} />
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-600">
                Select a circle
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Choose a circle from the list to view and manage members
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateCircleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(circle) => {
          setShowCreateModal(false);
          setSelectedCircleId(circle.id);
          toast.success('Circle created!');
        }}
      />

      {/* Edit Modal */}
      <EditCircleModal
        isOpen={showEditModal}
        circle={selectedCircle || null}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          toast.success('Circle updated!');
        }}
      />
    </div>
  );
}
