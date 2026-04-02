'use client';

import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Shield, Lock, Eye, FileCheck, Users, BarChart3, Award, CheckCircle, ArrowRight } from 'lucide-react';

function StatCounter({ icon, value, label, suffix, delay }: { icon: React.ReactNode; value: number; label: string; suffix: string; delay: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  const [hasAnimated, setHasAnimated] = useState(false);
  const springValue = useSpring(0, { stiffness: 50, damping: 10 });

  useEffect(() => {
    if (isInView && !hasAnimated) { springValue.set(value); setHasAnimated(true); }
    else if (!isInView && hasAnimated) { springValue.set(0); setHasAnimated(false); }
  }, [isInView, value, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className="text-center p-6">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>{icon}</div>
      <div className="font-display text-3xl font-black text-foreground"><motion.span>{displayValue}</motion.span>{suffix}</div>
      <p className="font-body text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export function SecurityControl() {
  const services = [
    { icon: <Shield className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Bank-Grade Security', description: 'SOC 2 Type II compliant infrastructure with end-to-end encryption for all loan data and investor information.' },
    { icon: <Lock className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Role-Based Access', description: 'Granular permissions for every team member. Control who sees what, from deal pipeline to investor details.' },
    { icon: <Eye className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Audit Trail', description: 'Complete visibility into every action taken on your platform. Full compliance-ready audit logging.' },
    { icon: <FileCheck className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Regulatory Compliance', description: 'Built-in compliance workflows for state and federal lending regulations. Stay ahead of regulatory changes.' },
    { icon: <Users className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Investor Verification', description: 'Automated accredited investor verification and KYC/AML checks integrated directly into onboarding.' },
    { icon: <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, title: 'Real-Time Monitoring', description: 'Live dashboards for portfolio health, risk metrics, and performance analytics across all your deals.' },
  ];

  const stats = [
    { icon: <Award className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, value: 99, label: 'Uptime SLA', suffix: '.9%' },
    { icon: <Shield className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, value: 256, label: 'Bit Encryption', suffix: '' },
    { icon: <Users className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, value: 500, label: 'Active Firms', suffix: '+' },
    { icon: <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} />, value: 100, label: 'Compliance Rate', suffix: '%' },
  ];

  return (
    <section id="security" className="relative py-32 w-full overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
            Security & <span style={{ color: 'var(--accent-emerald)' }}>Control</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade security built for the demands of private lending
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <div className="lg:col-span-1 space-y-4">
            {services.slice(0, 3).map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-background clean-border rounded-xl p-5 hover:shadow-md gentle-animation group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>{s.icon}</div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">{s.title}</h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                    <span className="inline-flex items-center gap-1 font-body text-sm mt-2 opacity-0 group-hover:opacity-100 gentle-animation" style={{ color: 'var(--accent-emerald)' }}>Learn more <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden w-full h-80 lg:h-full">
              <img src="https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&h=800&fit=crop" alt="Digital security and encryption" className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display text-white font-black text-xl uppercase">Enterprise Security</p>
                <p className="font-body text-white/80 text-sm">Bank-grade protection for your lending operations</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            {services.slice(3).map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-background clean-border rounded-xl p-5 hover:shadow-md gentle-animation group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>{s.icon}</div>
                  <div>
                    <h3 className="font-display font-bold text-foreground mb-1">{s.title}</h3>
                    <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                    <span className="inline-flex items-center gap-1 font-body text-sm mt-2 opacity-0 group-hover:opacity-100 gentle-animation" style={{ color: 'var(--accent-emerald)' }}>Learn more <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <StatCounter key={stat.label} {...stat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
