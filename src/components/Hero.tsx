'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Hero() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0;
      videoRef.current.muted = true;
      videoRef.current.defaultMuted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { href: '#services-section', label: 'Services' },
    { href: '#use-cases-section', label: 'Use Cases' },
    { href: '#product-section', label: 'Platform' },
    { href: '#security-section', label: 'Security' },
    { href: '#why-fundex-section', label: 'Why Fundex' },
    { href: '#team-section', label: 'Team' },
    { href: '#book-demo-section', label: 'Book Demo' },
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-110"
        autoPlay
        muted
        loop
        playsInline>
        <source src="https://videos.pexels.com/video-files/10931363/10931363-uhd_2560_1440_30fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/40" />

      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="fixed top-0 left-0 right-0 w-full z-[110]">
        <div className={`w-full px-6 sm:px-8 lg:px-12 py-4 transition-all duration-300 ease-out ${
          isScrolled ? 'bg-white/90 backdrop-blur-xl border-b border-border shadow-sm' : 'bg-transparent'
        }`}>
          <div className="flex items-center justify-between gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer flex-shrink-0"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="font-display text-2xl font-extrabold tracking-tight">FUNDEX</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8 flex-1 justify-center">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`font-body font-medium gentle-animation hover:scale-105 whitespace-nowrap ${
                    isScrolled ? 'text-foreground hover:text-accent-emerald' : 'text-white hover:text-white/80'
                  }`}>
                  {link.label}
                </a>
              ))}
            </div>

            <div className={`hidden lg:flex items-center space-x-2 transition-colors flex-shrink-0 ${isScrolled ? 'text-foreground' : 'text-white'}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('book-demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={`font-body font-semibold px-5 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm ${isScrolled ? 'bg-accent-emerald text-white' : 'bg-accent-emerald text-white'}`}
                style={{ backgroundColor: 'var(--accent-emerald)' }}>
                Book Demo
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/login"
                className={`font-body font-semibold px-5 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm border ${isScrolled ? 'text-foreground border-foreground/30 hover:border-foreground/60' : 'text-white border-white/30 hover:border-white/60'}`}
              >
                Login
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/signup"
                className={`font-body font-semibold px-5 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm border ${isScrolled ? 'text-foreground border-foreground/30 hover:border-foreground/60' : 'text-white border-white/30 hover:border-white/60'}`}
              >
                Sign Up
              </motion.a>
            </div>

            <div className={`hidden md:flex lg:hidden items-center space-x-2 transition-colors flex-shrink-0 ${isScrolled ? 'text-foreground' : 'text-white'}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById('book-demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                className={`font-body font-semibold px-4 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm ${isScrolled ? 'bg-accent-emerald text-white' : 'bg-accent-emerald text-white'}`}
                style={{ backgroundColor: 'var(--accent-emerald)' }}>
                Demo
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/login"
                className={`font-body font-semibold px-4 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm border ${isScrolled ? 'text-foreground border-foreground/30 hover:border-foreground/60' : 'text-white border-white/30 hover:border-white/60'}`}
              >
                Login
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/signup"
                className={`font-body font-semibold px-4 py-2 rounded-md hover:opacity-90 gentle-animation cursor-pointer text-sm border ${isScrolled ? 'text-foreground border-foreground/30 hover:border-foreground/60' : 'text-white border-white/30 hover:border-white/60'}`}
              >
                Sign Up
              </motion.a>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden glass-effect p-3 rounded-full text-white hover:bg-white/20 gentle-animation cursor-pointer z-[120] relative">
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[80]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? '0%' : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white/95 backdrop-blur-xl border-l border-border z-[90]">
        <div className="flex flex-col h-full">
          <div className="flex justify-end p-4">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 rounded-full text-foreground hover:bg-muted gentle-animation cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col px-6 pb-6 h-full">
            <div className="flex flex-col space-y-4 text-foreground">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="px-4 py-3 hover:bg-muted rounded-lg gentle-animation font-body font-medium text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col space-y-3 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { document.getElementById('book-demo-section')?.scrollIntoView({ behavior: 'smooth' }); setIsMobileMenuOpen(false); }}
                className="text-white font-body font-semibold px-6 py-3 rounded-lg gentle-animation cursor-pointer"
                style={{ backgroundColor: 'var(--accent-emerald)' }}>
                Book Demo
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center text-white font-body font-semibold px-6 py-3 rounded-lg gentle-animation cursor-pointer border border-foreground/20"
              >
                Login
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/auth/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-center text-white font-body font-semibold px-6 py-3 rounded-lg gentle-animation cursor-pointer border border-foreground/20"
              >
                Sign Up
              </motion.a>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-6 sm:left-8 lg:left-12 z-40">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight text-white uppercase">
            <span className="block">Modern</span>
            <span className="block">Infrastructure</span>
            <span className="block">for <span style={{ color: 'var(--accent-emerald)' }}>Private</span></span>
            <span className="block" style={{ color: 'var(--accent-emerald)' }}>Credit</span>
          </h1>
          <p className="mt-4 font-body text-lg sm:text-xl text-white/80 max-w-lg">
            yoooo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
