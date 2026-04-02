'use client'

import { useEffect } from 'react'

export function Contact() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  return (
    <section id="contact" className="relative py-32 bg-card/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-emerald)' }} />
            <span className="text-sm font-semibold text-muted-foreground">
              Let's Talk Funding
            </span>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-blue)' }} />
          </div>
          
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
            <span className="block mb-2">Ready to Get Funded?</span>
          </h2>
          
          <p className="text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Schedule a call with our lending team to discuss your next deal
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-background clean-border rounded-3xl overflow-hidden elevated-shadow">
            <div className="bg-card/50 px-8 py-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground mb-1">
                    Fundex Lending Consultation
                  </h3>
                  <p className="text-muted-foreground">
                    30 minutes • Video call • Free consultation
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent-emerald)' }} />
                  <span className="text-sm text-muted-foreground font-medium">Available now</span>
                </div>
              </div>
            </div>
            
            <div className="p-0 bg-white">
              <div 
                className="calendly-inline-widget"
                data-url="https://calendly.com/d/cvb4-btv-mxp/introduction-with-zeroqode"
                style={{ width: '100%', height: '660px', overflow: 'hidden' }} 
              />
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--accent-emerald)' }} />
              </div>
              <h4 className="font-black text-foreground mb-2">Discuss Your Deal</h4>
              <p className="text-muted-foreground text-sm">Share your project details with our lending experts</p>
            </div>
            
            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)' }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--accent-blue)' }} />
              </div>
              <h4 className="font-black text-foreground mb-2">Get a Term Sheet</h4>
              <p className="text-muted-foreground text-sm">Receive competitive terms tailored to your project</p>
            </div>
            
            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(4, 120, 87, 0.1)' }}>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--accent-purple)' }} />
              </div>
              <h4 className="font-black text-foreground mb-2">Close & Fund</h4>
              <p className="text-muted-foreground text-sm">Fast closing with dedicated support throughout</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
