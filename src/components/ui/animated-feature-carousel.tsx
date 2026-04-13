'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import { cn } from '@/lib/utils';

const placeholderImage = (text = 'Image') =>
  `https://placehold.co/600x400/1a1a1a/ffffff?text=${text}`;

type StaticImageData = string;

type WrapperStyle = MotionStyle & {
  '--x': MotionValue;
  '--y': MotionValue;
};

export interface ImageSet {
  step1img1: StaticImageData;
  step1img2: StaticImageData;
  step2img1: StaticImageData;
  step2img2: StaticImageData;
  step3img: StaticImageData;
  step4img: StaticImageData;
  alt: string;
}

interface FeatureCarouselProps {
  bgClass?: string;
  step1img1Class?: string;
  step1img2Class?: string;
  step2img1Class?: string;
  step2img2Class?: string;
  step3imgClass?: string;
  step4imgClass?: string;
  image: ImageSet;
  steps?: Step[];
}

interface StepImageProps {
  src: StaticImageData;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

interface Step {
  id: string;
  name: string;
  title: string;
  description: string;
}

const TOTAL_STEPS = 4;

const defaultSteps: readonly Step[] = [
  { id: '1', name: 'Step 1', title: 'Seamless Integration', description: 'Connect your tools and workflows effortlessly.' },
  { id: '2', name: 'Step 2', title: 'Powerful Analytics', description: 'Gain deep insights with our advanced analytics dashboard.' },
  { id: '3', name: 'Step 3', title: 'Collaborative Workspace', description: 'Work together in real-time from anywhere.' },
  { id: '4', name: 'Step 4', title: 'Automated Workflows', description: 'Put your tasks on autopilot with custom automations.' },
];

const ANIMATION_PRESETS = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.5 },
  },
} as const;

type AnimationPreset = keyof typeof ANIMATION_PRESETS;

interface AnimatedStepImageProps extends StepImageProps {
  preset?: AnimationPreset;
  delay?: number;
}

function useNumberCycler(totalSteps: number = TOTAL_STEPS, interval: number = 5000) {
  const [currentNumber, setCurrentNumber] = useState(0);
  useEffect(() => {
    const timerId = setTimeout(() => {
      setCurrentNumber((prev) => (prev + 1) % totalSteps);
    }, interval);
    return () => clearTimeout(timerId);
  }, [currentNumber, totalSteps, interval]);

  const setStep = useCallback((stepIndex: number) => {
    setCurrentNumber(stepIndex % totalSteps);
  }, [totalSteps]);

  return { currentNumber, setStep };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function IconCheck({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg className={cn('size-3', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const stepVariants: Variants = {
  inactive: { scale: 0.9, opacity: 0.7 },
  active: { scale: 1, opacity: 1 },
};

const StepImage = forwardRef<HTMLImageElement, StepImageProps>(
  ({ src, alt, className, style, ...props }, ref) => (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      style={style}
      onError={(e) => (e.currentTarget.src = placeholderImage(alt))}
      {...props}
    />
  )
);
StepImage.displayName = 'StepImage';

const MotionStepImage = motion(StepImage);

const AnimatedStepImage = ({ preset = 'fadeInScale', delay = 0, ...props }: AnimatedStepImageProps) => {
  const config = ANIMATION_PRESETS[preset];
  return <MotionStepImage {...config} transition={{ ...config.transition, delay }} {...props} />;
};

function FeatureCard({ children, step, steps: stepItems }: { children: React.ReactNode; step: number; steps: readonly Step[] }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (isMobile) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      style={{ '--x': mouseX, '--y': mouseY } as WrapperStyle}
      className="group relative w-full overflow-hidden  border border-border bg-gradient-to-b from-card/80 to-card p-2"
    >
      <div className="absolute right-5 top-0 h-px w-80 bg-gradient-to-l from-transparent via-primary/30 via-10% to-transparent" />
      <div className=" p-6">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
          <motion.div initial="inactive" animate="active" variants={stepVariants} className="flex flex-col gap-2 md:w-1/2">
            <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{stepItems[step].name}</span>
            <h3 className="font-display text-xl font-display font-bold text-foreground">{stepItems[step].title}</h3>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed">{stepItems[step].description}</p>
          </motion.div>
          {children}
        </div>
      </div>
    </motion.div>
  );
}

function StepsNav({ steps: stepItems, current, onChange }: { steps: readonly Step[]; current: number; onChange: (i: number) => void }) {
  return (
    <nav aria-label="Steps" className="flex justify-center gap-4 mt-6">
      <ol className="flex gap-2 items-center">
        {stepItems.map((step, idx) => {
          const isCompleted = current > idx;
          const isCurrent = current === idx;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                className={cn(
                  'flex items-center gap-2  px-3 py-1.5 text-sm font-medium transition-all',
                  isCurrent ? 'bg-primary text-white' : isCompleted ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onChange(idx)}
              >
                <span className={cn(
                  'flex size-5 items-center justify-center  text-xs',
                  isCurrent ? 'bg-white/20' : isCompleted ? 'bg-primary text-white' : 'bg-muted'
                )}>
                  {isCompleted ? <IconCheck /> : <span>{idx + 1}</span>}
                </span>
                {step.name}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const defaultClasses = {
  img: ' border border-border shadow-2xl shadow-black/10',
  step1img1: 'w-[50%] left-0 top-[15%]',
  step1img2: 'w-[60%] left-[40%] top-[35%]',
  step2img1: 'w-[50%] left-[5%] top-[20%]',
  step2img2: 'w-[40%] left-[55%] top-[45%]',
  step3img: 'w-[90%] left-[5%] top-[25%]',
  step4img: 'w-[90%] left-[5%] top-[25%]',
} as const;

export function FeatureCarousel({
  image,
  steps: customSteps,
  step1img1Class = defaultClasses.step1img1,
  step1img2Class = defaultClasses.step1img2,
  step2img1Class = defaultClasses.step2img1,
  step2img2Class = defaultClasses.step2img2,
  step3imgClass = defaultClasses.step3img,
  step4imgClass = defaultClasses.step4img,
}: FeatureCarouselProps) {
  const stepsData = customSteps || defaultSteps;
  const { currentNumber: step, setStep } = useNumberCycler();

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="relative h-[300px] md:w-1/2">
            <AnimatedStepImage src={image.step1img1} alt={image.alt} className={cn('absolute', defaultClasses.img, step1img1Class)} />
            <AnimatedStepImage src={image.step1img2} alt={image.alt} preset="slideInRight" delay={0.15} className={cn('absolute', defaultClasses.img, step1img2Class)} />
          </div>
        );
      case 1:
        return (
          <div className="relative h-[300px] md:w-1/2">
            <AnimatedStepImage src={image.step2img1} alt={image.alt} preset="slideInLeft" className={cn('absolute', defaultClasses.img, step2img1Class)} />
            <AnimatedStepImage src={image.step2img2} alt={image.alt} preset="slideInRight" delay={0.15} className={cn('absolute', defaultClasses.img, step2img2Class)} />
          </div>
        );
      case 2:
        return <AnimatedStepImage src={image.step3img} alt={image.alt} className={cn('absolute', defaultClasses.img, step3imgClass)} />;
      case 3:
        return <AnimatedStepImage src={image.step4img} alt={image.alt} className={cn('absolute', defaultClasses.img, step4imgClass)} />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <FeatureCard step={step} steps={stepsData}>
        <AnimatePresence mode="wait">
          <motion.div key={step} className="relative md:w-1/2 h-[300px]">
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </FeatureCard>
      <StepsNav steps={stepsData} current={step} onChange={setStep} />
    </div>
  );
}
