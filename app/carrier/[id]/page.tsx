import { DAY } from '@/lib/day';
import CarrierView from './CarrierView';

export function generateStaticParams() {
  return DAY.carrierHandovers.map((h) => ({ id: h.consignment }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CarrierView id={id} />;
}
