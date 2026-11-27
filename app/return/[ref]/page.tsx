import { DAY } from '@/lib/day';
import ReturnView from './ReturnView';

export function generateStaticParams() {
  return DAY.returns.map((r) => ({ ref: r.ref }));
}

export default async function Page({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return <ReturnView refId={ref} />;
}
