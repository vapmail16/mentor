import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold">Mentor Platform</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Mentor Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

