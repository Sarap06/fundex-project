'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function BookDemo() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = React.useState('10:00');

  const timeSlots = Array.from({ length: 37 }, (_, i) => {
    const totalMinutes = i * 15;
    const hour = Math.floor(totalMinutes / 60) + 9;
    const minute = totalMinutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const bookedDates = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + 3 + i);
    return d;
  });

  return (
    <section id="book-demo" className="relative py-32 bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight uppercase tracking-tight mb-4">
            Book a <span style={{ color: 'var(--primary)' }}>Demo</span>
          </h2>
          <p className="font-sans text-lg text-muted-foreground max-w-2xl mx-auto">
            Schedule a call with our team to see Fundex in action
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="clean-border rounded-3xl overflow-hidden elevated-shadow">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 flex justify-center border-b md:border-b-0 md:border-r border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={bookedDates}
                    modifiers={{ booked: bookedDates }}
                    modifiersClassNames={{
                      booked: 'line-through opacity-50',
                    }}
                    className="bg-transparent p-0 pointer-events-auto"
                  />
                </div>

                <div className="w-full md:w-64 p-6">
                  <h3 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Select Time</h3>
                  <div className="grid grid-cols-3 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={`w-full shadow-none text-xs ${
                          selectedTime === time ? 'text-white' : ''
                        }`}
                        style={selectedTime === time ? { backgroundColor: 'var(--primary)' } : {}}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border p-6 bg-card/50">
              <p className="font-sans text-sm text-muted-foreground">
                {date && selectedTime ? (
                  <>
                    Your demo is set for{' '}
                    <span className="font-semibold text-foreground">
                      {date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>{' '}
                    at <span className="font-semibold text-foreground">{selectedTime}</span>.
                  </>
                ) : (
                  'Select a date and time for your demo.'
                )}
              </p>
              <Button
                className="text-white font-sans font-semibold px-8 cursor-pointer"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
