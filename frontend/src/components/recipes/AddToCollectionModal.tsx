import { useState } from 'react';
import { FolderPlus, Check, Loader2, X } from 'lucide-react';
import { Dialog, Button, useToast } from '../ui';
import { useGroups, useAddRecipesToGroup } from '../../hooks';

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
}: AddToCollectionModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { data: groupsData, isLoading } = useGroups({ limit: 50 });
  const addToGroup = useAddRecipesToGroup();
  const toast = useToast();

  const groups = groupsData?.data || [];

  const handleAdd = async () => {
    if (!selectedGroupId) return;

    try {
      await addToGroup.mutateAsync({
        groupId: selectedGroupId,
        recipeIds: [recipeId],
      });
      toast.success('Recipe added to collection!');
      onClose();
      setSelectedGroupId(null);
    } catch (err) {
      console.error('Failed to add to collection:', err);
      toast.error('Failed to add to collection');
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add to Collection">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Add "<span className="font-medium">{recipeTitle}</span>" to a collection:
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8">
            <FolderPlus className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-500">No collections yet</p>
            <p className="text-sm text-neutral-400">Create a collection first</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedGroupId === group.id
                    ? 'bg-primary-50 border-2 border-primary-500'
                    : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: group.color || '#f3f4f6' }}
                >
                  {group.icon || '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{group.name}</p>
                  <p className="text-sm text-neutral-500">
                    {group.recipeCount || 0} recipe{group.recipeCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {selectedGroupId === group.id && (
                  <Check className="w-5 h-5 text-primary-500" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedGroupId || addToGroup.isPending}
          >
            {addToGroup.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <FolderPlus className="w-4 h-4 mr-2" />
                Add to Collection
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
