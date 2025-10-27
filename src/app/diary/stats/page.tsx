
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDiaryStore, useSyncDiaryStore } from '@/hooks/use-diary-store';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Tag, Book, BarChart3, TrendingUp } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const moodColors: { [key: string]: string } = {
  happy: 'hsl(var(--chart-1))',
  sad: 'hsl(var(--chart-2))',
  neutral: 'hsl(var(--chart-3))',
  excited: 'hsl(var(--chart-4))',
  tired: 'hsl(var(--chart-5))',
};

const calculateJournalingStreak = (entries: { date: string }[]): number => {
    if (entries.length === 0) return 0;
  
    const sortedDates = entries
      .map(entry => parseISO(entry.date))
      .sort((a, b) => b.getTime() - a.getTime());
  
    let streak = 1;
    let lastDate = sortedDates[0];
  
    // Check if the latest entry is today or yesterday
    const today = new Date();
    if (differenceInCalendarDays(today, lastDate) > 1) {
      return 0; // Streak is broken if the last entry was more than one day ago
    }
  
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = sortedDates[i];
      const diff = differenceInCalendarDays(lastDate, currentDate);
      
      if (diff === 1) {
        streak++;
      } else if (diff > 1) {
        break; // Gap in dates, streak is broken
      }
      // If diff is 0, it's the same day, so we continue without incrementing streak
      lastDate = currentDate;
    }
  
    return streak;
};

export default function StatsPage() {
  useSyncDiaryStore();
  const { entries } = useDiaryStore();

  const moodData = useMemo(() => {
    const moodCounts: { [key: string]: number } = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    return Object.entries(moodCounts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const totalEntries = entries.length;
  const totalTags = useMemo(() => new Set(entries.flatMap(e => e.tags || [])).size, [entries]);
  const journalingStreak = useMemo(() => calculateJournalingStreak(entries), [entries]);
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
            <h1 className="font-headline text-3xl font-bold">Your Journaling Statistics</h1>
            <p className="text-muted-foreground">A look into your thoughts and feelings over time.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                    <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalEntries}</div>
                    <p className="text-xs text-muted-foreground">entries written so far</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Journaling Streak</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{journalingStreak} days</div>
                    <p className="text-xs text-muted-foreground">consecutive days of writing</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Unique Tags</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalTags}</div>
                    <p className="text-xs text-muted-foreground">tags used to categorize</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Mood Distribution
            </CardTitle>
            <CardDescription>
                A breakdown of your recorded moods.
            </CardDescription>
            </CardHeader>
            <CardContent>
                {moodData.length > 0 ? (
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={moodData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {moodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={moodColors[entry.name]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)"
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>No mood data recorded yet.</p>
                        <p className="text-sm">Start adding moods to your entries to see your stats!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
