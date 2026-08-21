/* ⚠ output: 'export' will not emit a dynamic segment without generateStaticParams.
   The client view lives in a sibling …View.tsx — the same shape the driver app
   uses, and the reason its five stop pages export at all. */
import { DAY } from '@/lib/day';
import ConsignmentView from './ConsignmentView';

export function generateStaticParams() {
  return DAY.consignments.map((c) => ({ id: c.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConsignmentView id={id} />;
}
