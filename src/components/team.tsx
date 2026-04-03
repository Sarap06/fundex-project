'use client';

import { motion } from 'framer-motion';

export function Team() {
  const team = [
    {
      name: "Nigel Jaimes",
      title: "Co-Founder & CEO",
      description: "Visionary leader driving innovation in private lending infrastructure with deep expertise in fintech and capital markets.",
    },
    {
      name: "Sara Pedron",
      title: "Co-Founder",
      description: "Operations strategist streamlining the lending lifecycle, from origination to servicing, with precision and scale.",
    },
  ];

  return (
    <div className="relative py-32 w-full">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground uppercase tracking-tight mb-4">
            Our <span style={{ color: 'var(--primary)' }}>Team</span>
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            The people building the future of private lending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-background clean-border rounded-2xl p-8 text-center hover:shadow-lg gentle-animation"
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-2xl font-display font-black"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="font-display font-black text-lg text-foreground mb-1">{member.name}</h3>
              <p className="font-sans text-sm font-semibold mb-4" style={{ color: 'var(--primary)' }}>{member.title}</p>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed">{member.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
