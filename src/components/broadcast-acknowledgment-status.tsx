'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AcknowledgmentStatus = 'all' | 'pending' | 'opened' | 'acknowledged';

interface AcknowledgmentRecipient {
  id: string;
  investor_id: string;
  name?: string;
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
    if (!updateId) {
      setRecipients([]);
      setError(null);
      setLoading(false);
      return;
    }
    fetchAcknowledgments();
  }, [updateId, dealId]);

  const fetchAcknowledgments = async () => {
    if (!updateId) return;

    try {
      setLoading(true);

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

      const fetchedRecipients: AcknowledgmentRecipient[] = (data.recipients || []).map(
        (r: any) => ({
          ...r,
          name: r.name || r.investor_name,
        })
      );

      setRecipients(fetchedRecipients);
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

  if (!updateId) {
    return (
      <Card className="p-6 bg-background border border-border">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Acknowledgment Status</h3>
        <div className="text-center py-8 text-muted-foreground">No updates sent yet</div>
      </Card>
    );
  }

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
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as AcknowledgmentStatus)} className="mb-6">
          <TabsList className="h-auto gap-4 rounded-none border-b border-border bg-transparent p-0 pb-4">
            <TabsTrigger value="all" className="rounded-none bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-none bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="opened" className="rounded-none bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Opened ({openedCount})
            </TabsTrigger>
            <TabsTrigger value="acknowledged" className="rounded-none bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none">
              Acknowledged ({acknowledgedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                className="flex items-center justify-between p-4 bg-background border border-border  hover:border-border transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8  bg-fundex-gold/20 flex items-center justify-center text-xs font-semibold text-fundex-forest">
                      {(recipient.name || recipient.email.split('@')[0])
                        .split(' ')
                        .slice(0, 2)
                        .map((w: string) => w[0]?.toUpperCase() ?? '')
                        .join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {recipient.name || recipient.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">{recipient.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1  text-xs font-medium ${getStatusColor(
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
