import { useState } from 'react';
import { Loader2, Plus, Check, Hand, ClipboardList } from 'lucide-react';
import { Button, Input } from '../ui';
import {
  usePartyEvent,
  useCreateAssignment,
  useClaimAssignment,
  useCompleteAssignment,
} from '../../hooks/usePartyEvents';
import { useToast } from '../ui';
import { cn } from '../../lib/utils';

interface EventAssignmentsListProps {
  eventId: string;
  compact?: boolean;
  showCreate?: boolean;
}

export function EventAssignmentsList({
  eventId,
  compact,
  showCreate,
}: EventAssignmentsListProps) {
  const toast = useToast();
  const { data: event, isLoading } = usePartyEvent(eventId);
  const createAssignment = useCreateAssignment();
  const claimAssignment = useClaimAssignment();
  const completeAssignment = useCompleteAssignment();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const assignments = event?.assignments || [];
  const displayAssignments = compact ? assignments.slice(0, 4) : assignments;

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createAssignment.mutateAsync({
        eventId,
        dto: { title: newTaskTitle.trim() },
      });
      toast.success('Task added!');
      setNewTaskTitle('');
      setShowForm(false);
    } catch {
      toast.error('Failed to add task');
    }
  };

  const handleClaim = async (assignmentId: string) => {
    try {
      await claimAssignment.mutateAsync({ eventId, assignmentId });
      toast.success("You're on it!");
    } catch {
      toast.error('Failed to claim task');
    }
  };

  const handleComplete = async (assignmentId: string) => {
    try {
      await completeAssignment.mutateAsync({ eventId, assignmentId });
      toast.success('Task completed!');
    } catch {
      toast.error('Failed to complete task');
    }
  };

  if (assignments.length === 0 && !showCreate) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p>No tasks yet</p>
      </div>
    );
  }

  const pendingTasks = assignments.filter((a) => !a.isCompleted);
  const completedTasks = assignments.filter((a) => a.isCompleted);

  if (compact) {
    return (
      <div className="space-y-2">
        {displayAssignments.map((task) => (
          <div
            key={task.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              task.isCompleted ? 'bg-green-50' : 'bg-neutral-50'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                task.isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-neutral-300'
              )}
            >
              {task.isCompleted && <Check className="w-3 h-3" />}
            </div>
            <span
              className={cn(
                'flex-1 text-sm',
                task.isCompleted && 'line-through text-neutral-400'
              )}
            >
              {task.title}
            </span>
            {task.assignedTo && (
              <span className="text-lg">{task.assignedTo.avatarEmoji || '👤'}</span>
            )}
          </div>
        ))}
        {assignments.length > 4 && (
          <p className="text-sm text-neutral-500 text-center pt-2">
            +{assignments.length - 4} more tasks
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Form */}
      {showCreate && (
        <div className="mb-6">
          {showForm ? (
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              <Button onClick={handleCreate} disabled={createAssignment.isPending}>
                {createAssignment.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Add'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setNewTaskTitle('');
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          )}
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-3">
            To Do ({pendingTasks.length})
          </h4>
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg group"
              >
                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-6 h-6 rounded-full border-2 border-neutral-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center transition-colors"
                >
                  <Check className="w-4 h-4 text-transparent group-hover:text-green-500" />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-800">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-neutral-500">{task.description}</p>
                  )}
                </div>

                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.assignedTo.avatarEmoji || '👤'}</span>
                    <span className="text-sm text-neutral-600">{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleClaim(task.id)}
                    disabled={claimAssignment.isPending}
                  >
                    <Hand className="w-4 h-4" />
                    Claim
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-500 mb-3">
            Completed ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-neutral-500 line-through">{task.title}</p>
                </div>

                {task.assignedTo && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.assignedTo.avatarEmoji || '👤'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {assignments.length === 0 && !showCreate && (
        <div className="text-center py-8 text-neutral-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>No tasks yet</p>
        </div>
      )}
    </div>
  );
}

export default EventAssignmentsList;
