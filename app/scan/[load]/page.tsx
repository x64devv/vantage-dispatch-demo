import { DAY } from '@/lib/day';
import ScanView from './ScanView';

export function generateStaticParams() {
  return DAY.loads.map((l) => ({ load: l.id }));
}

export default async function Page({ params }: { params: Promise<{ load: string }> }) {
  const { load } = await params;
  return <ScanView loadId={load} />;
}
