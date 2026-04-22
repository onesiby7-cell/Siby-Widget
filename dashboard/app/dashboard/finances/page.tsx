'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancesPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const { data: payData } = await supabase.from('payments').select('*, agents(name)').order('payment_date', { ascending: false });
    const { data: agentData } = await supabase.from('agents').select('id, name');
    
    if (payData) setPayments(payData);
    if (agentData) setAgents(agentData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const totalRevenue = useMemo(() => payments.reduce((acc, p) => acc + Number(p.amount), 0), [payments]);

  const chartData = useMemo(() => {
    const daily: any = {};
    payments.forEach(p => {
      const day = new Date(p.payment_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      daily[day] = (daily[day] || 0) + Number(p.amount);
    });
    return Object.entries(daily).map(([name, total]) => ({ name, total })).reverse();
  }, [payments]);

  const handleAddPayment = async () => {
    if (!amount || !selectedAgent) return;
    setSaving(true);
    const masterId = localStorage.getItem('siby_admin_id') || '00000000-0000-0000-0000-000000000000';
    
    const { error } = await supabase.from('payments').insert({
      user_id: masterId,
      agent_id: selectedAgent,
      amount: parseFloat(amount),
      notes: notes,
      status: 'completed'
    });

    if (!error) {
      setAmount(''); setNotes(''); setSelectedAgent('');
      loadData();
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-muted">Initialisation du protocole financier...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic color-primary">Empire <span className="text-muted not-italic">Finance</span></h1>
          <p className="text-muted text-sm font-medium">Suivi en temps réel de vos revenus et paiements clients.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Revenu Total</div>
          <div className="text-5xl font-black tracking-tighter text-green-500">{totalRevenue.toLocaleString()} $</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique */}
        <div className="lg:col-span-2 card p-8 h-[400px] flex flex-col">
          <h2 className="text-sm font-black uppercase text-muted tracking-widest mb-6">Évolution des Revenus</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#505050" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#505050" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0A0A0A', border: '1px solid #202020', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#22C55E', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Formulaire d'ajout */}
        <div className="card p-8 space-y-6">
          <h2 className="text-sm font-black uppercase text-muted tracking-widest">Enregistrer un Paiement</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase">Séléctionner l'Agent client</label>
              <select className="input w-full" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                <option value="">-- Choisir un agent --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase">Montant ($)</label>
              <input type="number" className="input w-full" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase">Notes / Facture</label>
              <input className="input w-full" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Abonnement Pro Mars 2026" />
            </div>
            <button 
              onClick={handleAddPayment} 
              disabled={saving || !amount || !selectedAgent}
              className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest"
            >
              {saving ? '⏳ Traitement...' : '⚡ Confirmer le Paiement'}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-8 bg-black/40 backdrop-blur-md">
        <h2 className="text-sm font-black uppercase text-muted tracking-widest mb-6">Historique des Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-4 text-[10px] font-black text-muted uppercase tracking-widest">Date</th>
                <th className="pb-4 text-[10px] font-black text-muted uppercase tracking-widest">Agent / Client</th>
                <th className="pb-4 text-[10px] font-black text-muted uppercase tracking-widest">Notes</th>
                <th className="pb-4 text-[10px] font-black text-muted uppercase tracking-widest text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map(p => (
                <tr key={p.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="py-4 text-xs font-mono text-muted">{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="py-4 text-sm font-bold text-primary">{p.agents?.name || 'Inconnu'}</td>
                  <td className="py-4 text-xs text-muted">{p.notes || '—'}</td>
                  <td className="py-4 text-sm font-black text-green-500 text-right">+{p.amount} $</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-10 text-center text-muted text-sm italic">Aucune transaction enregistrée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
