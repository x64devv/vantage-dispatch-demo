import { DAY } from '@/lib/day';
import HandoverView from './HandoverView';

export function generateStaticParams() {
  return DAY.loads.map((l) => ({ load: l.id }));
}

export default async function Page({ params }: { params: Promise<{ load: string }> }) {
  const { load } = await params;
  return <HandoverView loadId={load} />;
}
