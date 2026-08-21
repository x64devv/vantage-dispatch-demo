import { DAY } from '@/lib/day';
import CollectionView from './CollectionView';

export function generateStaticParams() {
  return DAY.collections.map((c) => ({ ref: c.ref }));
}

export default async function Page({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return <CollectionView refId={ref} />;
}
