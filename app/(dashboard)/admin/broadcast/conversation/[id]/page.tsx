'use client';

import { ArrowLeft, Send, MoreVertical, User, Building2, Paperclip } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function InvestorConversationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [messageText, setMessageText] = useState('');

  // Mock data — would come from API
  const conversation = {
    id: id || 'INV-001',
    investorName: 'Daniel Moris',
    investorEmail: 'daniel@example.com',
    investorType: 'Accredited Investor',
    relatedDeal: 'Salamanca Bridge Loan',
    investmentAmount: '$250,000',
    dealId: 'SAL-2024-001',
  };

  const messages = [
    { id: 1, sender: 'investor', text: 'Hi, can you clarify when the first payout will occur?', timestamp: 'Mar 8, 2:15 PM' },
    { id: 2, sender: 'admin', text: 'Yes, the first payout is scheduled for July 1st, 2025.', timestamp: 'Mar 8, 2:18 PM' },
    { id: 3, sender: 'investor', text: 'Perfect, thank you.', timestamp: 'Mar 8, 2:20 PM' },
    { id: 4, sender: 'admin', text: "You're welcome. Let us know if you need anything else.", timestamp: 'Mar 8, 2:21 PM' },
    { id: 5, sender: 'investor', text: 'Can you clarify the payout schedule? I want to ensure I understand the distribution timeline correctly.', timestamp: 'Mar 9, 1:30 PM' },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      setMessageText('');
    }
  };

  return (
    <div className="min-h-full bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/broadcast')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors -ml-2"
              >
                <ArrowLeft className="size-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{conversation.investorName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-neutral-600 font-medium">{conversation.relatedDeal}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-sm" onClick={() => router.push('/admin/investors')}>
                <User className="size-4 mr-2" />
                View Profile
              </Button>
              <Button variant="outline" size="sm" className="text-sm" onClick={() => router.push(`/admin/broadcast/${conversation.dealId}`)}>
                <Building2 className="size-4 mr-2" />
                View Deal
              </Button>
              <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <MoreVertical className="size-5 text-neutral-600" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-600 ml-14">
            <span className="font-medium">{conversation.investorType}</span>
            <span className="text-neutral-300">&bull;</span>
            <span className="font-medium">Invested {conversation.investmentAmount}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message Thread */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl ${message.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-4 py-3 rounded-lg ${
                      message.sender === 'admin'
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-white border border-neutral-200'
                    }`}>
                      <p className="text-sm text-neutral-900 leading-relaxed">{message.text}</p>
                    </div>
                    <div className="mt-1 px-1">
                      <span className="text-xs text-neutral-500">{message.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Composer */}
          <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-6 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <button className="p-2.5 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600 mb-1">
                  <Paperclip className="size-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Write a message to the investor..."
                    rows={1}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={!messageText.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 mb-1">
                  <Send className="size-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Investor Context Panel */}
        <div className="w-80 bg-white border-l border-neutral-200 flex-shrink-0 overflow-y-auto hidden lg:block">
          <div className="p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-6">Investor Profile</h2>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Name</label>
                <p className="text-sm font-semibold text-neutral-900">{conversation.investorName}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Investor Type</label>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-semibold">{conversation.investorType}</Badge>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5 block">Email</label>
                <p className="text-sm text-neutral-900">{conversation.investorEmail}</p>
              </div>
              <div className="border-t border-neutral-200 my-6" />
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 block">Invested Deals</label>
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug mb-2">{conversation.relatedDeal}</h3>
                  <p className="text-lg font-bold text-emerald-600 mb-1">{conversation.investmentAmount}</p>
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 text-xs">ACTIVE</Badge>
                </div>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/admin/investors')}>
                  <User className="size-4 mr-2" />
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
