import type { Metadata } from 'next';
import './globals.css';
import './dispatch.css';
import { DeskProvider } from '@/lib/state';
import Shell from '@/components/Shell';

export const metadata: Metadata = {
  title: 'Vantage Dispatch',
  description:
    'Demo build of the Vantage Dispatch tablet for TVSH Transport. Seeded day, no server, not the production module.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DeskProvider>
          <Shell>{children}</Shell>
        </DeskProvider>
      </body>
    </html>
  );
}
