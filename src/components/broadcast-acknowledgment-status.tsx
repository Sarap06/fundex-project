'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type AcknowledgmentStatus = 'all' | 'pending' | 'opened' | 'acknowledged';

interface AcknowledgmentRecipient {
  id: string;
  investor_id: string;
  email: string;
  delivery_status: 'pending' | 'sent' | 'failed' | 'opened' | 'acknowledged';
  sent_at?: string;
  opened_at?: string;
  acknowledged_at?: string;
  acknowledgment_notes?: string;
}

interface BroadcastAcknowledgmentStatusProps {
  updateId?: string; // If provided, shows acknowledgments for that update; otherwise shows latest
  dealId: string;
  onSendReminder?: (recipientIds: string[]) => void;
}

export function BroadcastAcknowledgmentStatus({
  updateId,
  dealId,
  onSendReminder,
}: BroadcastAcknowledgmentStatusProps) {
  const [recipients, setRecipients] = useState<AcknowledgmentRecipient[]>([]);
  const [selectedTab, setSelectedTab] = useState<AcknowledgmentStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAcknowledgments();
  }, [updateId, dealId]);

  const fetchAcknowledgments = async () => {
    try {
      setLoading(true);
      
      // If updateId is provided, fetch recipients for that specific update
      if (updateId) {
        const url = new URL(
          `/api/broadcasts/deals/${dealId}/acknowledgments`,
          window.location.origin
        );
        url.searchParams.append('updateId', updateId);

        console.log('[COMPONENT] Fetching acknowledgments for update:', url.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
          const errorData = await response.text();
          console.error('[COMPONENT] API Error:', response.status, errorData);
          throw new Error(`Failed to fetch acknowledgments (${response.status})`);
        }

        const data = await response.json();
        console.log('[COMPONENT] Acknowledgments data:', data);

        setRecipients(data.recipients || []);
      } else {
        // Otherwise fetch all deal investors and show them as pending
        console.log('[COMPONENT] Fetching all deal investors');
        
        const response = await fetch(`/api/broadcasts/deals/${dealId}/investors`);

        if (!response.ok) {
          throw new Error('Failed to fetch investors');
        }

        const data = await response.json();
        console.log('[COMPONENT] Investors data:', data);

        // Convert deal investors to recipient format with pending status
        const investorRecipients: AcknowledgmentRecipient[] = (data.investors || []).map(
          (investor: any) => ({
            id: investor.id,
            investor_id: investor.investor_id,
            email: investor.email,
            delivery_status: 'pending' as const,
            sent_at: undefined,
            opened_at: undefined,
            acknowledged_at: undefined,
          })
        );

        setRecipients(investorRecipients);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching acknowledgments:', err);
      setError('Failed to load acknowledgments');
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecipients = () => {
    if (selectedTab === 'all') return recipients;
    return recipients.filter((r) => {
      if (selectedTab === 'pending') return r.delivery_status === 'pending' || r.delivery_status === 'sent';
      return r.delivery_status === selectedTab;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return 'bg-primary/10 text-primary';
      case 'opened':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'sent') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = recipients.filter(
    (r) => r.delivery_status === 'pending' || r.delivery_status === 'sent'
  ).length;
  const openedCount = recipients.filter((r) => r.delivery_status === 'opened').length;
  const acknowledgedCount = recipients.filter(
    (r) => r.delivery_status === 'acknowledged'
  ).length;

  const handleSendReminder = () => {
    const pendingIds = recipients
      .filter((r) => r.delivery_status === 'pending' || r.delivery_status === 'sent')
      .map((r) => r.id);
    onSendReminder?.(pendingIds);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-background border border-border">
        <div className="text-center text-muted-foreground">Loading acknowledgments...</div>
      </Card>
    );
  }

  const filteredRecipients = getFilteredRecipients();

  return (
    <Card className="overflow-hidden bg-background border border-border">
      <div className="p-6">
        {/* Header with Send Reminder */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Acknowledgment Status</h3>
          {pendingCount > 0 && (
            <Button
              onClick={handleSendReminder}
              variant="default"
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              Send Reminder
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border pb-4">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'all'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'pending'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setSelectedTab('opened')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'opened'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Opened ({openedCount})
          </button>
          <button
            onClick={() => setSelectedTab('acknowledged')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'acknowledged'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Acknowledged ({acknowledgedCount})
          </button>
        </div>

        {/* Recipients List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredRecipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recipients in this category
            </div>
          ) : (
            filteredRecipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-border transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                      {recipient.email
                        .split('@')[0]
                        .split('.')
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {recipient.email.split('@')[0].toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">{recipient.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      recipient.delivery_status
                    )}`}
                  >
                    {getStatusLabel(recipient.delivery_status)}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {recipient.acknowledged_at
                      ? formatTime(recipient.acknowledged_at)
                      : recipient.opened_at
                        ? formatTime(recipient.opened_at)
                        : recipient.sent_at
                          ? formatTime(recipient.sent_at)
                          : '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
