'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { ChartTooltip, ChartTooltipContent, ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { subDays, format } from 'date-fns';

const chartData = Array.from({ length: 7 }, (_, i) => {
  const date = subDays(new Date(), 6 - i);
  return {
    date: format(date, 'MMM d'),
    safe: Math.floor(Math.random() * 200) + 50,
    phishing: Math.floor(Math.random() * 50),
  };
});

const chartConfig = {
  safe: {
    label: 'Safe Emails',
    color: 'hsl(var(--chart-2))',
  },
  phishing: {
    label: 'Phishing',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function EmailAnalyticsChart() {
  const { theme } = useTheme();

  const tickColor = useMemo(() => {
    return theme === 'dark' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))';
  }, [theme]);


  return (
    <div className="h-64 w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              stroke={tickColor}
              fontSize={12}
            />
             <YAxis
              tickLine={false}
              axisLine={false}
              stroke={tickColor}
              fontSize={12}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="safe" fill="var(--color-safe)" radius={4} />
            <Bar dataKey="phishing" fill="var(--color-phishing)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
