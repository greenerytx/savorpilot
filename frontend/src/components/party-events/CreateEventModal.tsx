import { useState } from 'react';
import { X, Calendar, MapPin, Loader2, Users } from 'lucide-react';
import { Button, Input, Card } from '../ui';
import { useEventOptions, useCirclesForEventCreation } from '../../hooks/usePartyEvents';
import type { CreatePartyEventDto, CircleSummary } from '../../services/party-events.service';
import { cn } from '../../lib/utils';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreatePartyEventDto) => void;
  isLoading?: boolean;
}

export function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateEventModalProps) {
  const { data: options } = useEventOptions();
  const { data: circles } = useCirclesForEventCreation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎉');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [selectedCircle, setSelectedCircle] = useState<CircleSummary | null>(null);
  const [importMembers, setImportMembers] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !eventDate) return;

    const dateTime = new Date(`${eventDate}T${eventTime}`);

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      emoji,
      eventDate: dateTime.toISOString(),
      location: location.trim() || undefined,
      circleId: selectedCircle?.id,
      importCircleMembers: selectedCircle ? importMembers : undefined,
    });
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setEmoji('🎉');
    setEventDate('');
    setEventTime('18:00');
    setLocation('');
    setSelectedCircle(null);
    setImportMembers(true);
    onClose();
  };

  const handleCircleSelect = (circle: CircleSummary | null) => {
    setSelectedCircle(circle);
    if (circle?.emoji && !emoji) {
      setEmoji(circle.emoji);
    }
  };

  const emojis = options?.emojis || [
    '🎉', '🦃', '🎄', '🎃', '🥘',
    '🍕', '🌮', '🎂', '🏠', '🔥',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-neutral-800">Create Event</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Emoji Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Event Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-10 h-10 text-xl rounded-lg border-2 transition-colors',
                    emoji === e
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Event Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friendsgiving 2026"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the occasion?"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Time
              </label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="123 Main St, City"
            />
          </div>

          {/* Dinner Circle Selection */}
          {circles && circles.length > 0 && (
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Link to Dinner Circle (optional)
              </label>
              <p className="text-xs text-neutral-500 mb-3">
                Connect this event to a Dinner Circle to track dietary needs and auto-invite members.
              </p>
              <div className="space-y-2">
                {/* No circle option */}
                <button
                  type="button"
                  onClick={() => handleCircleSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                    !selectedCircle
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                    -
                  </span>
                  <div>
                    <div className="font-medium text-sm">No circle</div>
                    <div className="text-xs text-neutral-500">Standalone event</div>
                  </div>
                </button>

                {/* Circle options */}
                {circles.map((circle) => (
                  <button
                    key={circle.id}
                    type="button"
                    onClick={() => handleCircleSelect(circle)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left',
                      selectedCircle?.id === circle.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    <span className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-lg">
                      {circle.emoji || '👥'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{circle.name}</div>
                      <div className="text-xs text-neutral-500">
                        {circle.memberCount} member{circle.memberCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Import members toggle */}
              {selectedCircle && (
                <label className="flex items-center gap-2 mt-3 p-3 bg-primary-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importMembers}
                    onChange={(e) => setImportMembers(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-700">
                      Auto-invite circle members
                    </span>
                    <p className="text-xs text-neutral-500">
                      Invite all {selectedCircle.memberCount} members with their dietary info
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-neutral-50">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !eventDate || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default CreateEventModal;
