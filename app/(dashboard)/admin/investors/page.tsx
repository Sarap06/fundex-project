'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Mail, Phone, MoreVertical, X, Tag, Loader, LogOut } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { getCurrentUserCompanyId, logOut } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StaggerContainer, StaggerItem } from '@/components/motion-wrapper';

interface Investor {
  id: string;
  investor_id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Onboarding' | 'Pending';
  sponsor?: string;
  total_invested: number;
  average_return?: number;
  number_of_investments: number;
  onboarded_date: string;
  tags?: string[];
  notes?: string;
}

interface Sponsor {
  id: string;
  name: string;
  company?: string;
}

export default function InvestorsPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddInvestorDrawerOpen, setIsAddInvestorDrawerOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<string>('internal');
  const [showAddSponsorInput, setShowAddSponsorInput] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('Onboarding');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    initialInvestment: '',
    numberOfInvestments: '0',
    notes: '',
    newSponsorName: '',
    newSponsorCompany: '',
  });


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      try {
        // Load company ID
        const cId = await getCurrentUserCompanyId();
        setCompanyId(cId);

        const { data: sponsorsData } = await supabase.from('sponsors').select('*');
        setSponsors(sponsorsData || []);

        let query = supabase
          .from('investors')
          .select(`id, investor_id, full_name, email, phone, status, sponsor_id, total_invested, average_return, number_of_investments, onboarded_date, tags, notes, sponsors(name, company)`);

        // Filter by company if available
        if (cId) {
          query = query.eq('company_id', cId);
        }

        const { data: investorsData } = await query.order('created_at', { ascending: false });

        if (investorsData) {
          const transformed = investorsData.map((inv: any) => ({
            id: inv.id,
            investor_id: inv.investor_id,
            full_name: inv.full_name,
            email: inv.email,
            phone: inv.phone,
            status: inv.status,
            sponsor: inv.sponsors?.company ? `${inv.sponsors.name} – ${inv.sponsors.company}` : inv.sponsors?.name,
            total_invested: inv.total_invested || 0,
            average_return: inv.average_return,
            number_of_investments: inv.number_of_investments || 0,
            onboarded_date: new Date(inv.onboarded_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            tags: inv.tags || [],
            notes: inv.notes,
          }));
          setInvestors(transformed);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = getSupabaseClient();

    if (!companyId) {
      alert('Unable to determine company. Please refresh the page.');
      setIsSubmitting(false);
      return;
    }

    try {
      let sponsorId = undefined;

      if (selectedSponsor === 'add-new' && formData.newSponsorName) {
        const { data: newSponsor } = await supabase
          .from('sponsors')
          .insert([{ name: formData.newSponsorName, company: formData.newSponsorCompany || null }])
          .select()
          .single();
        sponsorId = newSponsor?.id;
      } else {
        const selected = sponsors.find(s =>
          `${s.name}${s.company ? ' – ' + s.company : ''}`.toLowerCase() === selectedSponsor.toLowerCase() ||
          s.name.toLowerCase() === selectedSponsor.toLowerCase()
        );
        sponsorId = selected?.id;
      }

      // Generate investor ID
      const investorId = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: newInvestor } = await supabase
        .from('investors')
        .insert([{
          company_id: companyId,
          investor_id: investorId,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          status: selectedStatus,
          sponsor_id: sponsorId || null,
          initial_investment: formData.initialInvestment ? parseFloat(formData.initialInvestment) : 0,
          number_of_investments: parseInt(formData.numberOfInvestments) || 0,
          notes: formData.notes || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
        }])
        .select(`id, investor_id, full_name, email, phone, status, sponsor_id, total_invested, average_return, number_of_investments, onboarded_date, tags, notes, sponsors(name, company)`)
        .single();

      if (newInvestor) {
        const formatted = {
          id: newInvestor.id,
          investor_id: newInvestor.investor_id,
          full_name: newInvestor.full_name,
          email: newInvestor.email,
          phone: newInvestor.phone,
          status: newInvestor.status,
          sponsor: (newInvestor.sponsors as any)?.company ? `${(newInvestor.sponsors as any).name} – ${(newInvestor.sponsors as any).company}` : (newInvestor.sponsors as any)?.name,
          total_invested: newInvestor.total_invested || 0,
          average_return: newInvestor.average_return,
          number_of_investments: newInvestor.number_of_investments || 0,
          onboarded_date: new Date(newInvestor.onboarded_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          tags: newInvestor.tags || [],
          notes: newInvestor.notes,
        };
        setInvestors([formatted, ...investors]);

        // Log activity for new investor
        try {
          await fetch('/api/activities/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId,
              activityType: 'investor_added',
              title: `${newInvestor.full_name} has been added`,
              description: 'Onboarded new investor',
              investorId: newInvestor.id,
              investorName: newInvestor.full_name,
              metadata: {
                email: newInvestor.email,
                status: newInvestor.status,
              },
            }),
          });
        } catch (err) {
          console.error('Error logging investor creation activity:', err);
        }
      }

      setFormData({ fullName: '', email: '', phone: '', initialInvestment: '', numberOfInvestments: '0', notes: '', newSponsorName: '', newSponsorCompany: '' });
      setSelectedStatus('Onboarding');
      setSelectedTags([]);
      setSelectedSponsor('internal');
      setShowAddSponsorInput(false);
      setIsAddInvestorDrawerOpen(false);
    } catch (error) {
      console.error('Error creating investor:', error);
      alert('Failed to create investor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvestors = investors.filter(inv => {
    const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = inv.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || inv.email.toLowerCase().includes(searchQuery.toLowerCase()) || inv.investor_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  const stats = {
    total: investors.length,
    active: investors.filter(i => i.status === 'Active').length,
    onboarding: investors.filter(i => i.status === 'Onboarding').length,
    pending: investors.filter(i => i.status === 'Pending').length,
  };

  if (loading) {
    return (
      <div className="px-6 py-6 md:px-8 md:py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 " />
          ))}
        </div>
        <Skeleton className="h-11 w-full " />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 " />
          ))}
        </div>
        <Skeleton className="h-64 " />
      </div>
    );
  }

  const handleLogOut = async () => {
    await logOut();
    router.push('/auth/login');
  };

  return (
    <>
      <div>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <PageHeader title="Investors" subtitle="Manage your investor directory" />
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="fdx-card p-5">
                <p className="text-sm text-stone-500 mb-1">Total Investors</p>
                <p className="text-3xl fdx-section-title">{stats.total}</p>
              </div>
              <div className="fdx-card p-5">
                <p className="text-sm text-fundex-gold mb-1">Active</p>
                <p className="text-3xl text-stone-900 font-semibold">{stats.active}</p>
              </div>
              <div className="fdx-card p-5">
                <p className="text-sm text-stone-500 mb-1">Onboarding</p>
                <p className="text-3xl text-stone-900 font-semibold">{stats.onboarding}</p>
              </div>
              <div className="fdx-card p-5">
                <p className="text-sm text-stone-500 mb-1">Pending</p>
                <p className="text-3xl text-stone-900 font-semibold">{stats.pending}</p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-stone-400" />
                  <input placeholder="Search investors by name or email..." className="fdx-input pl-10 h-11" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button className="fdx-btn-secondary gap-2"><Filter className="size-4" />Filter</button>
                  <button className="fdx-btn-primary gap-2" onClick={() => setIsAddInvestorDrawerOpen(true)}><Plus className="size-4" />Add Investor</button>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {['all', 'active', 'onboarding', 'pending'].map((status) => (
                  <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2  text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status ? 'fdx-btn-primary' : 'fdx-btn-secondary'}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="fdx-card">
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="fdx-table-header">Investor</th>
                        <th className="fdx-table-header">Contact</th>
                        <th className="fdx-table-header">Sponsor</th>
                        <th className="fdx-table-header">Status</th>
                        <th className="fdx-table-header">Investments</th>
                        <th className="fdx-table-header">Total Invested</th>
                        <th className="fdx-table-header">Avg. Return</th>
                        <th className="fdx-table-header">Onboarded</th>
                        <th className="fdx-table-header text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvestors.length > 0 ? filteredInvestors.map((investor) => (
                        <tr key={investor.id} className="fdx-table-row">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarFallback className="bg-fundex-gold/20 text-fundex-forest font-medium">{getInitials(investor.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-stone-900">{investor.full_name}</p>
                                <p className="text-sm text-stone-400">{investor.investor_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-stone-600"><Mail className="size-4" /><span>{investor.email}</span></div>
                              {investor.phone && <div className="flex items-center gap-2 text-sm text-stone-600"><Phone className="size-4" /><span>{investor.phone}</span></div>}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-stone-900 font-normal">{investor.sponsor || 'Internal'}</td>
                          <td className="py-4 px-4">
                            <span className={`fdx-badge ${investor.status === 'Active' ? 'fdx-badge-active' : investor.status === 'Onboarding' ? 'fdx-badge-info' : 'fdx-badge-pending'}`}>{investor.status}</span>
                          </td>
                          <td className="py-4 px-4 text-stone-900 font-normal">{investor.number_of_investments}</td>
                          <td className="py-4 px-4 text-stone-900 font-medium">${(investor.total_invested / 1000000).toFixed(1)}M</td>
                          <td className="py-4 px-4"><span className={`font-medium ${investor.average_return ? 'text-fundex-forest' : 'text-stone-400'}`}>{investor.average_return ? `${investor.average_return.toFixed(1)}%` : '-'}</span></td>
                          <td className="py-4 px-4 text-sm text-stone-500">{investor.onboarded_date}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" className="text-fundex-forest hover:text-fundex-forest hover:bg-fundex-gold/10">View</Button>
                              <Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={9} className="py-8 text-center">
                            <p className="text-stone-500">No investors found. {searchQuery ? 'Try adjusting your search.' : 'Add your first investor to get started.'}</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {isAddInvestorDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsAddInvestorDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 border-b border-stone-100 bg-white p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl fdx-section-title">Add Investor</h2>
                <button onClick={() => setIsAddInvestorDrawerOpen(false)} className="p-2 hover:bg-stone-50  transition-colors"><X className="size-5 text-stone-500" /></button>
              </div>
            </div>

            <form onSubmit={handleAddInvestor} className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900 uppercase tracking-wide">Basic Information</h3>
                <div><Label htmlFor="fullName">Full Name *</Label><input id="fullName" placeholder="John Smith" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="fdx-input mt-1.5" /></div>
                <div><Label htmlFor="email">Email Address *</Label><input id="email" type="email" placeholder="john.smith@example.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="fdx-input mt-1.5" /></div>
                <div><Label htmlFor="phone">Phone Number</Label><input id="phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="fdx-input mt-1.5" /></div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900 uppercase tracking-wide">Investor Status</h3>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value)}>
                    <SelectTrigger className="mt-1.5" id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Onboarding">Onboarding</SelectItem><SelectItem value="Pending">Pending</SelectItem></SelectContent>
                  </Select>
                  <p className="text-xs text-stone-400 mt-1.5">Default: Onboarding</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900 uppercase tracking-wide">Sponsor</h3>
                <div>
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Select value={selectedSponsor} onValueChange={(value) => {setSelectedSponsor(value); setShowAddSponsorInput(value === 'add-new');}}>
                    <SelectTrigger className="mt-1.5" id="sponsor"><SelectValue placeholder="Select sponsor" /></SelectTrigger>
                    <SelectContent>
                      {sponsors.map((sponsor) => (<SelectItem key={sponsor.id} value={sponsor.company ? `${sponsor.name} – ${sponsor.company}` : sponsor.name}>{sponsor.company ? `${sponsor.name} – ${sponsor.company}` : sponsor.name}</SelectItem>))}
                      <SelectItem value="add-new">+ Add New Sponsor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-stone-400 mt-1.5">Defaults to &quot;Internal&quot; if not selected</p>
                </div>
                {showAddSponsorInput && (
                  <div className="p-4 bg-fundex-cream/30 border border-fundex-gold/20  space-y-3">
                    <div><Label htmlFor="newSponsorName">Sponsor Name *</Label><input id="newSponsorName" placeholder="e.g., Derek" value={formData.newSponsorName} onChange={(e) => setFormData({...formData, newSponsorName: e.target.value})} className="fdx-input mt-1.5" required={showAddSponsorInput} /></div>
                    <div><Label htmlFor="newSponsorCompany">Company (optional)</Label><input id="newSponsorCompany" placeholder="e.g., 818 Consulting" value={formData.newSponsorCompany} onChange={(e) => setFormData({...formData, newSponsorCompany: e.target.value})} className="fdx-input mt-1.5" /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900 uppercase tracking-wide">Investment Details (Optional)</h3>
                <div><Label htmlFor="initialInvestment">Initial Investment Amount ($)</Label><input id="initialInvestment" type="number" placeholder="0" value={formData.initialInvestment} onChange={(e) => setFormData({...formData, initialInvestment: e.target.value})} className="fdx-input mt-1.5" /></div>
                <div><Label htmlFor="numInvestments">Number of Investments</Label><input id="numInvestments" type="number" placeholder="0" value={formData.numberOfInvestments} onChange={(e) => setFormData({...formData, numberOfInvestments: e.target.value})} className="fdx-input mt-1.5" /></div>
                <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" placeholder="Add any relevant notes about the investor..." rows={4} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="mt-1.5" /></div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-stone-900 uppercase tracking-wide">Tags (Optional)</h3>
                <div className="flex flex-wrap gap-2">
                  {['VIP', 'High Net Worth', 'New Investor', 'Accredited', 'Institutional'].map((tag) => (
                    <button key={tag} type="button" onClick={() => {if (selectedTags.includes(tag)) {setSelectedTags(selectedTags.filter(t => t !== tag));} else {setSelectedTags([...selectedTags, tag]);}}} className={`px-3 py-1.5 text-xs font-medium border transition-colors ${selectedTags.includes(tag) ? 'bg-fundex-gold/10 text-fundex-forest border-fundex-gold/30' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}>
                      <Tag className="size-3 inline mr-1" />{tag}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="sticky bottom-0 bg-white border-t border-stone-100 p-6">
              <div className="flex gap-3">
                <button className="fdx-btn-secondary flex-1" onClick={() => setIsAddInvestorDrawerOpen(false)}>Cancel</button>
                <button className="fdx-btn-primary flex-1" onClick={handleAddInvestor} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="size-4 mr-2 animate-spin" />Creating...</> : <><Plus className="size-4 mr-2" />Create Investor</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
