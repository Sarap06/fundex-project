'use client'

import { useEffect, useState } from 'react'

export function About() {
  const [isVisible, setIsVisible] = useState(false)

  const processSteps = [
    {
      number: "01",
      title: "Apply Online",
      description: "Submit your loan request in minutes with our streamlined digital application.",
    },
    {
      number: "02", 
      title: "Quick Review",
      description: "Our team reviews your deal within 24 hours and provides a term sheet.",
    },
    {
      number: "03",
      title: "Underwriting",
      description: "Fast, transparent underwriting focused on the asset and your experience.",
    },
    {
      number: "04",
      title: "Closing & Funding",
      description: "Close in as few as 7 days with our streamlined closing process.",
    },
    {
      number: "05",
      title: "Ongoing Support",
      description: "Dedicated account management throughout the life of your loan.",
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="about" className="relative py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-emerald)' }} />
            <span className="text-sm font-semibold text-muted-foreground">
              How It Works
            </span>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-blue)' }} />
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground">
            From Application to Funding
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            A simple, transparent process designed to get you funded fast
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {processSteps.map((step, index) => (
            <div
              key={step.number}
              className={`flex items-start gap-6 mb-12 last:mb-0 transform transition-all duration-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl"
                   style={{ backgroundColor: 'var(--accent-emerald)' }}>
                {step.number}
              </div>
              <div className="pt-2">
                <h3 className="font-black text-xl text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < processSteps.length - 1 && (
                <div className="absolute left-[2.5rem] mt-16 w-0.5 h-8" style={{ backgroundColor: 'var(--accent-emerald)', opacity: 0.3 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
