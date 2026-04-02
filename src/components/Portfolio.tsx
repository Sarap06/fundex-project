'use client'

export function Portfolio() {
  const loanTypes = [
    {
      title: "investor management",
      range: "$500K – $50M",
      term: "6–24 months",
      description: "Track all your investors, commitments, and allocations in one place. Eliminate spreadsheets and manual tracking",
      features: ["Quick closing in 7-14 days", "Flexible terms", "Interest-only payments"]
    },
    {
      title: "deal & allocation tracking",
      range: "$100K – $10M",
      term: "6–18 months",
      description: "Acquisition and renovation financing for residential and commercial properties.",
      features: ["Up to 90% LTC", "Rehab draws included", "No prepayment penalties"]
    },
    {
      title: "payments & distributions",
      range: "$1M – $75M",
      term: "12–36 months",
      description: "Ground-up construction financing for single-family, multifamily, and commercial projects.",
      features: ["Phased draw schedule", "Competitive rates", "Experienced builder programs"]
    },
    {
      title: "yo momma",
      range: "$100K – $5M",
      term: "30-year fixed",
      description: "Long-term rental property financing based on property cash flow, not personal income.",
      features: ["No income verification", "Cash-out available", "Portfolio friendly"]
    }
  ]

  return (
    <section id="portfolio" className="relative py-32 bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-emerald)' }} />
            <span className="text-sm font-semibold text-muted-foreground">
              Lending Solutions
            </span>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-blue)' }} />
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
            <span className="block mb-2">Funding That Moves</span>
            <span className="block" style={{ color: 'var(--accent-emerald)' }}>As Fast As You Do</span>
          </h2>
          
          <p className="text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Tailored private lending solutions for real estate investors and developers across Florida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {loanTypes.map((loan) => (
            <div key={loan.title} className="bg-card clean-border rounded-2xl p-8 hover:shadow-lg gentle-animation group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-black text-foreground">{loan.title}</h3>
                <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--accent-emerald)', color: 'white' }}>
                  {loan.term}
                </span>
              </div>
              <div className="text-3xl font-black mb-4" style={{ color: 'var(--accent-emerald)' }}>
                {loan.range}
              </div>
              <p className="text-muted-foreground mb-6">{loan.description}</p>
              <ul className="space-y-2">
                {loan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent-emerald)' }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
