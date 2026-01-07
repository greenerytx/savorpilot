import { Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { usePartyEvent, useRemoveEventMember, getRsvpStatusLabel, getRsvpStatusColor, getMemberRoleLabel } from '../../hooks/usePartyEvents';
import { useToast } from '../ui';
import { EventMemberRole, RsvpStatus } from '../../services/party-events.service';
import { cn } from '../../lib/utils';

interface EventMembersListProps {
  eventId: string;
  compact?: boolean;
}

export function EventMembersList({ eventId, compact }: EventMembersListProps) {
  const toast = useToast();
  const { data: event, isLoading } = usePartyEvent(eventId);
  const removeMember = useRemoveEventMember();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  const members = event?.members || [];
  const displayMembers = compact ? members.slice(0, 5) : members;

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No guests yet. Invite someone!
      </div>
    );
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this guest from the event?')) return;

    try {
      await removeMember.mutateAsync({ eventId, memberId });
      toast.success('Guest removed');
    } catch {
      toast.error('Failed to remove guest');
    }
  };

  // Group by RSVP status
  const grouped = {
    [RsvpStatus.ACCEPTED]: members.filter((m) => m.rsvpStatus === RsvpStatus.ACCEPTED),
    [RsvpStatus.MAYBE]: members.filter((m) => m.rsvpStatus === RsvpStatus.MAYBE),
    [RsvpStatus.PENDING]: members.filter((m) => m.rsvpStatus === RsvpStatus.PENDING),
    [RsvpStatus.DECLINED]: members.filter((m) => m.rsvpStatus === RsvpStatus.DECLINED),
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {displayMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
          >
            <span className="text-2xl">{member.avatarEmoji || '👤'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-800 truncate">{member.name}</p>
              <p className="text-xs text-neutral-500">{getMemberRoleLabel(member.role)}</p>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                getRsvpStatusColor(member.rsvpStatus)
              )}
            >
              {getRsvpStatusLabel(member.rsvpStatus)}
            </span>
          </div>
        ))}
        {members.length > 5 && (
          <p className="text-sm text-neutral-500 text-center pt-2">
            +{members.length - 5} more
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([status, statusMembers]) => {
        if (statusMembers.length === 0) return null;

        return (
          <div key={status}>
            <h4 className="text-sm font-medium text-neutral-500 mb-3 flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  getRsvpStatusColor(status)
                )}
              >
                {getRsvpStatusLabel(status)}
              </span>
              <span>({statusMembers.length})</span>
            </h4>

            <div className="space-y-2">
              {statusMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg group"
                >
                  <span className="text-3xl">{member.avatarEmoji || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-800">{member.name}</p>
                      {member.role !== EventMemberRole.GUEST && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                          {getMemberRoleLabel(member.role)}
                        </span>
                      )}
                    </div>
                    {member.email && (
                      <p className="text-sm text-neutral-500">{member.email}</p>
                    )}
                    {member.rsvpNote && (
                      <p className="text-sm text-neutral-600 mt-1 italic">
                        "{member.rsvpNote}"
                      </p>
                    )}
                    {member.dietaryNotes && (
                      <p className="text-xs text-orange-600 mt-1">
                        Dietary: {member.dietaryNotes}
                      </p>
                    )}
                  </div>

                  {member.role !== EventMemberRole.HOST && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EventMembersList;
