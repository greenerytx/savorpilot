import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ChefHat,
  Share2,
  Settings,
  Loader2,
  Copy,
  Check,
  Plus,
  UserPlus,
  ClipboardList,
  ShoppingCart,
  Download,
} from 'lucide-react';
import { Button, Card, useToast } from '../../components/ui';
import { InviteMemberModal } from '../../components/party-events/InviteMemberModal';
import { PinRecipeModal } from '../../components/party-events/PinRecipeModal';
import { EventMembersList } from '../../components/party-events/EventMembersList';
import { EventRecipeBoard } from '../../components/party-events/EventRecipeBoard';
import { EventAssignmentsList } from '../../components/party-events/EventAssignmentsList';
import { EventShoppingList } from '../../components/party-events/EventShoppingList';
import {
  usePartyEvent,
  useUpdatePartyEvent,
  useDeletePartyEvent,
  useImportCircleMembers,
  formatEventDate,
  formatEventTime,
  getCountdown,
  getEventStatusLabel,
  getEventStatusColor,
  getRsvpStatusLabel,
  getRsvpStatusColor,
} from '../../hooks/usePartyEvents';
import { EventStatus, RsvpStatus } from '../../services/party-events.service';
import { cn } from '../../lib/utils';

type Tab = 'overview' | 'recipes' | 'members' | 'tasks' | 'shopping';

export function PartyEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPinRecipeModal, setShowPinRecipeModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: event, isLoading } = usePartyEvent(id || '');
  const updateEvent = useUpdatePartyEvent();
  const deleteEvent = useDeletePartyEvent();
  const importCircleMembers = useImportCircleMembers();

  const handlePublish = async () => {
    if (!event) return;
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        dto: { status: EventStatus.ACTIVE },
      });
      toast.success('Event published!');
    } catch {
      toast.error('Failed to publish event');
    }
  };

  const handleChangeStatus = async (newStatus: EventStatus) => {
    if (!event) return;
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        dto: { status: newStatus },
      });
      toast.success(`Event ${newStatus.toLowerCase()}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Event not found</p>
        <Link to="/events" className="text-primary-500 hover:underline mt-2 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  const countdown = getCountdown(event.eventDate);
  const inviteLink = `${window.location.origin}/events/join/${event.inviteCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success('Event deleted');
      navigate('/events');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const handleImportCircleMembers = async () => {
    if (!event?.circleId) return;

    try {
      const result = await importCircleMembers.mutateAsync(event.id);
      if (result.imported > 0) {
        toast.success(`Imported ${result.imported} member${result.imported > 1 ? 's' : ''} from circle`);
      } else if (result.skipped > 0) {
        toast.success('All circle members are already in this event');
      }
    } catch {
      toast.error('Failed to import members');
    }
  };

  const acceptedCount = event.members?.filter(
    (m) => m.rsvpStatus === RsvpStatus.ACCEPTED
  ).length || 0;
  const pendingCount = event.members?.filter(
    (m) => m.rsvpStatus === RsvpStatus.PENDING
  ).length || 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'recipes', label: 'Recipes', count: event.recipeCount },
    { id: 'members', label: 'Guests', count: event.memberCount },
    { id: 'tasks', label: 'Tasks', count: event.assignments?.length || 0 },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/events"
        className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Header Card */}
      <Card className="overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-br from-primary-400 to-primary-600 relative">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl">{event.emoji || '🎉'}</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-2">
            {event.status === EventStatus.DRAFT && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={updateEvent.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updateEvent.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Publish Event'
                )}
              </Button>
            )}
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                getEventStatusColor(event.status)
              )}
            >
              {getEventStatusLabel(event.status)}
            </span>
          </div>
        </div>

        {/* Event Info */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-display text-neutral-900 mb-2">
                {event.name}
              </h1>

              {event.description && (
                <p className="text-neutral-600 mb-4">{event.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-neutral-700">
                  <Calendar className="w-4 h-4 text-primary-500" />
                  <span>{formatEventDate(event.eventDate)}</span>
                  <span className="text-neutral-400">at</span>
                  <span>{formatEventTime(event.eventDate)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-neutral-700">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Countdown */}
            {!countdown.isPast && (
              <div className="text-center px-6 py-3 bg-primary-50 rounded-xl">
                {countdown.days > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-primary-600">{countdown.days}</p>
                    <p className="text-sm text-primary-500">days to go</p>
                  </>
                ) : countdown.hours > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-primary-600">{countdown.hours}</p>
                    <p className="text-sm text-primary-500">hours to go</p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-primary-600">Today!</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="font-medium">{acceptedCount} going</span>
              {pendingCount > 0 && (
                <span className="text-neutral-400">({pendingCount} pending)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <span className="font-medium">{event.recipeCount} recipes</span>
            </div>
            {event.circle && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{event.circle.emoji || '👥'}</span>
                <Link
                  to={`/circles/${event.circleId}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {event.circle.name}
                </Link>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4" />
              Invite Guests
            </Button>
            <Button variant="outline" onClick={handleCopyLink}>
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Link
                </>
              )}
            </Button>
            {event.circleId && (
              <Button
                variant="outline"
                onClick={handleImportCircleMembers}
                disabled={importCircleMembers.isPending}
              >
                {importCircleMembers.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Import Circle Members
              </Button>
            )}

            {/* Status change buttons for host */}
            {event.status === EventStatus.ACTIVE && (
              <Button
                variant="outline"
                onClick={() => handleChangeStatus(EventStatus.COMPLETED)}
                disabled={updateEvent.isPending}
              >
                Mark as Completed
              </Button>
            )}
            {(event.status === EventStatus.DRAFT || event.status === EventStatus.ACTIVE) && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this event?')) {
                    handleChangeStatus(EventStatus.CANCELLED);
                  }
                }}
                disabled={updateEvent.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Cancel Event
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-100 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Recipe Preview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Recipes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPinRecipeModal(true)}
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </Button>
            </div>
            <EventRecipeBoard eventId={event.id} compact />
          </Card>

          {/* Quick Tasks Preview */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Tasks</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('tasks')}
              >
                <ClipboardList className="w-4 h-4" />
                Manage
              </Button>
            </div>
            <EventAssignmentsList eventId={event.id} compact />
          </Card>

          {/* Quick Guest Preview */}
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Guest List</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteModal(true)}
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </Button>
            </div>
            <EventMembersList eventId={event.id} compact />
          </Card>
        </div>
      )}

      {activeTab === 'recipes' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Recipe Board</h3>
            <Button onClick={() => setShowPinRecipeModal(true)}>
              <Plus className="w-4 h-4" />
              Pin Recipe
            </Button>
          </div>
          <EventRecipeBoard eventId={event.id} />
        </Card>
      )}

      {activeTab === 'members' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Guest List</h3>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4" />
              Invite Guest
            </Button>
          </div>
          <EventMembersList eventId={event.id} />
        </Card>
      )}

      {activeTab === 'tasks' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Tasks & Assignments</h3>
          </div>
          <EventAssignmentsList eventId={event.id} showCreate />
        </Card>
      )}

      {activeTab === 'shopping' && (
        <Card className="p-6">
          <EventShoppingList eventId={event.id} recipeCount={event.recipeCount} />
        </Card>
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        eventId={event.id}
      />

      <PinRecipeModal
        isOpen={showPinRecipeModal}
        onClose={() => setShowPinRecipeModal(false)}
        eventId={event.id}
      />
    </div>
  );
}

export default PartyEventDetailPage;
