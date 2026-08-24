/* ⚠ output: 'export' will not emit a dynamic segment without generateStaticParams.
   The client view lives in a sibling …View.tsx. */
import { DAY } from '@/lib/day';
import ScanView from './ScanView';

export function generateStaticParams() {
  return DAY.consignments.map((c) => ({ id: c.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScanView id={id} />;
}
