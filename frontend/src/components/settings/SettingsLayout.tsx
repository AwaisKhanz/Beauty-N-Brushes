import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface SettingsLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsLayout({ title, description, children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/provider/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Content Card */}
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
