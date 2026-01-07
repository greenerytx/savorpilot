import { useState } from 'react';
import {
  Plus,
  User,
  Crown,
  Shield,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, useToast, useConfirm } from '../ui';
import { AddMemberModal } from './AddMemberModal';
import {
  useCircleMembers,
  useRemoveMember,
} from '../../hooks/useDinnerCircles';
import type { CircleMember } from '../../services/dinner-circles.service';
import { cn } from '../../lib/utils';

interface MembersListProps {
  circleId: string;
}

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const ROLE_COLORS = {
  owner: 'text-amber-600',
  admin: 'text-blue-600',
  member: 'text-neutral-500',
};

export function MembersList({ circleId }: MembersListProps) {
  const toast = useToast();
  const confirmDialog = useConfirm();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CircleMember | null>(null);

  const { data: members, isLoading, error } = useCircleMembers(circleId);
  const removeMember = useRemoveMember();

  const handleRemoveMember = async (member: CircleMember) => {
    const confirmed = await confirmDialog({
      title: 'Remove Member',
      message: `Are you sure you want to remove ${member.name} from this circle?`,
      confirmText: 'Remove',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await removeMember.mutateAsync({ circleId, memberId: member.id });
        toast.success(`${member.name} removed from circle`);
      } catch {
        toast.error('Failed to remove member');
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="w-6 h-6 mr-2" />
          Failed to load members
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-neutral-800">
          Members ({members?.length || 0})
        </h3>
        <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {/* Members list */}
      <div className="divide-y">
        {members?.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] || User;
          const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || 'text-neutral-500';

          return (
            <div
              key={member.id}
              className="p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
                  {member.avatarEmoji || (member.isVirtual ? '👤' : '😀')}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-800">
                      {member.name}
                    </span>
                    <div className={cn('flex items-center gap-1 text-xs', roleColor)}>
                      <RoleIcon className="w-3 h-3" />
                      <span className="capitalize">{member.role}</span>
                    </div>
                    {member.isVirtual && (
                      <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                        Virtual
                      </span>
                    )}
                  </div>

                  {/* Dietary info */}
                  {(member.restrictions.length > 0 || member.allergens.length > 0) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {member.restrictions.map((r) => (
                        <span
                          key={r}
                          className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded"
                        >
                          {r}
                        </span>
                      ))}
                      {member.allergens.map((a) => (
                        <span
                          key={a}
                          className="text-xs px-1.5 py-0.5 bg-red-50 text-red-700 rounded"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {member.dietaryNotes && (
                    <p className="text-xs text-neutral-500 mt-1 truncate">
                      {member.dietaryNotes}
                    </p>
                  )}
                </div>

                {/* Actions - can't remove owner */}
                {member.role !== 'owner' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member)}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {members?.length === 0 && (
          <div className="p-8 text-center text-neutral-500">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No members yet</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        circleId={circleId}
        editMember={null}
        onSuccess={() => {
          setShowAddModal(false);
          toast.success('Member added!');
        }}
      />

      {/* Edit Member Modal */}
      {editingMember && (
        <AddMemberModal
          isOpen={true}
          onClose={() => setEditingMember(null)}
          circleId={circleId}
          editMember={editingMember}
          onSuccess={() => {
            setEditingMember(null);
            toast.success('Member updated!');
          }}
        />
      )}
    </Card>
  );
}
