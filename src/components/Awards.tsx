'use client'

export function Awards() {
  const stats = [
    { value: "$2B+", label: "Loans Funded" },
    { value: "500+", label: "Projects Completed" },
    { value: "7 Days", label: "Average Closing" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "15+", label: "Years Experience" },
    { value: "50", label: "States Covered" }
  ]

  return (
    <section id="awards" className="relative py-20 overflow-hidden" style={{ backgroundColor: 'var(--accent-blue)', color: 'white' }}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-white">
            Numbers That Speak
          </h2>
          <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
            Trusted by hundreds of real estate investors and developers nationwide
          </p>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl lg:text-5xl font-black text-white mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
