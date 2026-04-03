import { ArrowRight } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
}

interface Feature73Props {
  heading?: string;
  description?: string;
  linkUrl?: string;
  linkText?: string;
  features?: Feature[];
}

export const Feature73 = ({
  heading = "Powerful Features",
  description = "Discover the powerful features that make our platform stand out.",
  linkUrl = "#",
  linkText = "Book a demo",
  features = [],
}: Feature73Props) => {
  return (
    <div className="py-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h3 className="font-display text-3xl sm:text-4xl font-black text-foreground uppercase tracking-tight mb-4">
              {heading}
            </h3>
            <p className="font-sans text-muted-foreground leading-relaxed">
              {description}
            </p>
            <a
              href={linkUrl}
              className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {linkText}
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features[0] && (
            <div className="rounded-2xl clean-border bg-background overflow-hidden md:row-span-2">
              <div className="h-64 md:h-80 overflow-hidden">
                <img
                  src={features[0].image}
                  alt={features[0].title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-8">
                <h4 className="font-display font-black text-xl text-foreground mb-2">
                  {features[0].title}
                </h4>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {features[0].description}
                </p>
              </div>
            </div>
          )}
          {features.slice(1).map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col sm:flex-row gap-4 rounded-2xl clean-border bg-background overflow-hidden"
            >
              <div className="h-48 sm:h-auto sm:w-1/3 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-center">
                <h4 className="font-display font-black text-lg text-foreground mb-2">
                  {feature.title}
                </h4>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
