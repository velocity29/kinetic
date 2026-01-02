
import { CurriculumDay, Task, SyllabusModule, TrackCategory } from './types';

export const DAILY_ROUTINE = [
  { time: '08:00', task: 'Awaken', detail: 'Hydrate & Set Intention' },
  { time: '08:30', task: 'Flow State: Mastery', detail: 'QuickBooks / Financial Modeling (90 Mins)' },
  { time: '10:15', task: 'Strategic Outreach', detail: '2 Connections + 2 Growth Opportunities' },
  { time: '11:30', task: 'Insight Lab', detail: 'Excel Visualization & Data Storytelling' },
  { time: '12:45', task: 'Wisdom Block', detail: 'Insurance Knowledge & Regulatory Synthesis' },
  { time: '13:45', task: 'System Architecture', detail: 'Discord Frameworks & Process Design' },
  { time: '14:45', task: 'Resonance Lab', detail: 'Vocal Clarity & Communication Presence' },
  { time: '15:45', task: 'Reflection', detail: 'Finalizing Daily Progress Log' },
];

export const MASTER_SYLLABUS: SyllabusModule[] = [
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `qb-${i + 1}`,
    title: `Accounting Mastery ${i + 1}: ${['Onboarding', 'Ledger Integrity', 'A/R Flow', 'A/P Efficiency', 'Payroll Systems', 'Tax Readiness', 'Strategic Reporting', 'Process Verification', 'Reconciliation Flow', 'Asset Management', 'Class Architecture', 'Estimates & Forecasting', 'Journal Integrity', 'Data Feeds', 'Financial Closing'][i]}`,
    track: 'QuickBooks' as TrackCategory
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `xl-${i + 1}`,
    title: `Excel Fluency ${i + 1}: ${['Pivots', 'Data Lookup', 'Advanced Logic', 'Power Flow', 'Visual Storytelling', 'Data Refinement', 'Styling', 'Automation', 'Interactive Dashboards', 'Statistical Analysis', 'Problem Solving', 'Modeling', 'Trend Forecasting', 'Data Integrity', 'Fluid Arrays'][i]}`,
    track: 'Excel' as TrackCategory
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `ins-${i + 1}`,
    title: `Industry Knowledge ${i + 1}: ${['Fundamentals', 'General Liability', 'Property Assets', 'Vehicle Risks', 'Employee Wellness', 'Life Planning', 'Health Frameworks', 'Certification Path', 'Integrity Laws', 'Ethics & Presence', 'Resolution Process', 'Opportunity Management', 'Assessment', 'Risk Sharing', 'Global Standards'][i]}`,
    track: 'Insurance' as TrackCategory
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `sp-${i + 1}`,
    title: `Communication Lab ${i + 1}: ${['Projection', 'Vocal Presence', 'Enunciation', 'Narrative Reading', 'Fluidity', 'Transcription Synthesis', 'Rhythm & Cadence', 'Impact', 'Clarity', 'Final Expression'][i]}`,
    track: 'Speech' as TrackCategory
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `tech-${i + 1}`,
    title: `System Design ${i + 1}: ${['Collaboration SOPs', 'Automation Flow', 'Integration Logic', 'Knowledge Base', 'Environment Safety', 'Experience Design', 'Intelligent Prompting', 'System Wellness', 'Logic Mapping', 'Deployment'][i]}`,
    track: 'Tech' as TrackCategory
  }))
];

export const UNARGUABLE_DAILY_5: Pick<Task, 'id' | 'title' | 'category'>[] = [
  { id: 'd1', title: 'Strategic Outreach', category: 'Growth' as any },
  { id: 'd2', title: 'Flow State Mastery', category: 'Deep Work' },
  { id: 'd3', title: 'Insight Lab Session', category: 'Deep Work' },
  { id: 'd4', title: 'Resonance Practice', category: 'Vocal' },
  { id: 'd5', title: 'Progress Audit', category: 'Audit' },
];

export const CURRICULUM_30_DAY: CurriculumDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const focus = day <= 10 ? 'Phase 1: Foundation' : day <= 20 ? 'Phase 2: Integration' : 'Phase 3: Realization';
  
  const qbIdx = Math.floor(i / 2);
  const xlIdx = Math.floor(i / 2);
  const insIdx = Math.floor(i / 2);
  const spIdx = Math.floor(i / 3);
  const techIdx = Math.floor(i / 3);

  const moduleIds = [
    `qb-${(qbIdx % 15) + 1}`,
    `xl-${(xlIdx % 15) + 1}`,
    `ins-${(insIdx % 15) + 1}`,
    `sp-${(spIdx % 10) + 1}`,
    `tech-${(techIdx % 10) + 1}`
  ];

  return { 
    day, 
    focus, 
    summary: `Enhancing professional clarity through focused ${focus.split(': ')[1]} exercises and module synthesis.`,
    moduleIds 
  };
});
