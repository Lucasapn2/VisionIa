import { BrainCircuit } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <BrainCircuit className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-3xl font-bold text-primary tracking-tight">Visio AI</h1>
      </div>
    </header>
  );
}
