import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  ChefHat,
  Loader2,
  PartyPopper,
} from 'lucide-react';
import { Button, Card, useToast } from '../../components/ui';
import { CreateEventModal } from '../../components/party-events/CreateEventModal';
import {
  usePartyEvents,
  useCreatePartyEvent,
  useUpdatePartyEvent,
  formatEventDate,
  getCountdown,
  getEventStatusLabel,
  getEventStatusColor,
} from '../../hooks/usePartyEvents';
import type { CreatePartyEventDto, PartyEventResponse } from '../../services/party-events.service';
import { EventStatus } from '../../services/party-events.service';
import { cn } from '../../lib/utils';

export function PartyEventsPage() {
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: events, isLoading } = usePartyEvents();
  const createEvent = useCreatePartyEvent();

  const handleCreateEvent = async (dto: CreatePartyEventDto) => {
    try {
      await createEvent.mutateAsync(dto);
      toast.success('Event created!');
      setShowCreateModal(false);
    } catch {
      toast.error('Failed to create event');
    }
  };

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = events?.filter(
    (e) => new Date(e.eventDate) >= now && e.status !== EventStatus.CANCELLED
  ) || [];
  const pastEvents = events?.filter(
    (e) => new Date(e.eventDate) < now || e.status === EventStatus.COMPLETED || e.status === EventStatus.CANCELLED
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-primary-900">Party Mode</h1>
          <p className="text-primary-600">Plan collaborative events with friends</p>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          New Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : events && events.length > 0 ? (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-800 mb-4">
                Upcoming Events
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-neutral-500 mb-4">
                Past Events
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <PartyPopper className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">
            No Events Yet
          </h3>
          <p className="text-neutral-500 mb-6 max-w-md mx-auto">
            Create your first event to start planning collaborative meals with
            friends. Perfect for potlucks, holiday dinners, and gatherings!
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Event
          </Button>
        </Card>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        isLoading={createEvent.isPending}
      />
    </div>
  );
}

// Event Card Component
function EventCard({ event }: { event: PartyEventResponse }) {
  const toast = useToast();
  const updateEvent = useUpdatePartyEvent();
  const countdown = getCountdown(event.eventDate);

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleStatusChange = async (e: React.MouseEvent, newStatus: EventStatus) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        {/* Cover/Header */}
        <div className="h-24 bg-gradient-to-br from-primary-400 to-primary-600 relative">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">{event.emoji || '🎉'}</span>
            </div>
          )}

          {/* Status Badge & Actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {event.status === EventStatus.DRAFT && (
              <button
                onClick={handlePublish}
                disabled={updateEvent.isPending}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                {updateEvent.isPending ? '...' : 'Publish'}
              </button>
            )}
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                getEventStatusColor(event.status)
              )}
            >
              {getEventStatusLabel(event.status)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-800 mb-2 line-clamp-1">
            {event.name}
          </h3>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
            <Calendar className="w-4 h-4" />
            <span>{formatEventDate(event.eventDate)}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-neutral-600">
              <Users className="w-4 h-4" />
              <span>{event.memberCount}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-600">
              <ChefHat className="w-4 h-4" />
              <span>{event.recipeCount} recipes</span>
            </div>
          </div>

          {/* Countdown or Status Actions */}
          {!countdown.isPast && event.status === EventStatus.ACTIVE ? (
            <div className="mt-3 pt-3 border-t text-center">
              <span className="text-sm font-medium text-primary-600">
                {countdown.days > 0
                  ? `${countdown.days} days to go`
                  : countdown.hours > 0
                  ? `${countdown.hours} hours to go`
                  : 'Today!'}
              </span>
            </div>
          ) : event.status === EventStatus.ACTIVE ? (
            <div className="mt-3 pt-3 border-t">
              <button
                onClick={(e) => handleStatusChange(e, EventStatus.COMPLETED)}
                disabled={updateEvent.isPending}
                className="w-full text-sm text-neutral-500 hover:text-neutral-700"
              >
                Mark as Completed
              </button>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

export default PartyEventsPage;
