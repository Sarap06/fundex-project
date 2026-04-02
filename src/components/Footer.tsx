'use client'

export function Footer() {
  const loanTypes = [
    'Investor Management',
    'Deal & Allocation Tracking',
    'Payments & Distributions',
    'Investor Portal',
    'Commercial Loans',
    'Land Acquisition',
  ]

  return (
    <footer className="relative py-20 bg-foreground text-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-12 md:col-span-4">
            <div>
              <div className="font-bagel text-background text-3xl tracking-wider mb-4">
                FUNDEX
              </div>
              <p className="text-background/70 leading-relaxed mb-6">
                Miami-based private lender providing fast, flexible capital solutions 
                for real estate investors and developers nationwide.
              </p>
              <div className="text-background/60 text-sm space-y-1">
                <p>NMLS #XXXXXX</p>
                <p>Licensed in 50 states</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <h4 className="font-black text-2xl text-background mb-4">LOAN PRODUCTS</h4>
            <div className="grid grid-cols-1 gap-3">
              {loanTypes.map((type) => (
                <div key={type} className="text-background/80 text-sm font-medium">
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-4">
            <h4 className="font-black text-2xl text-background mb-4">CONTACT</h4>
            <div className="space-y-3 text-background/80 text-sm">
              <p>1200 Brickell Avenue, Suite 1500</p>
              <p>Miami, FL 33131</p>
              <p>info@fundex.com</p>
              <p>(305) 555-0199</p>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-16">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-background/70 mb-4 md:mb-0">
              © 2025 Fundex Capital. All rights reserved.
            </div>
            <div className="text-sm text-background/70">
              Private lending involves risk. All loans subject to underwriting approval.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
