import { cn } from "@/lib/utils";

interface GlassCardProps {
  title: string;
  description: string;
  className?: string;
}

const GlassCard = ({ title, description, className }: GlassCardProps) => {
  return (
    <div className={cn("p-8 rounded-lg gentle-animation", className)}>
      <h3 className="text-2xl font-semibold mb-4 text-shadow-medium">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      
      {/* Decorative elements */}
      <div className="mt-6 flex space-x-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        ></div>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: 'var(--accent-emerald)' }}
        ></div>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: 'var(--accent-purple)' }}
        ></div>
      </div>
    </div>
  );
};

export default GlassCard;