import { getPredictions } from '@/lib/actions'
import { PronosticosClient } from '@/components/pronosticos-client'

export default async function PronosticosPage() {
  const predictions = await getPredictions()

  return <PronosticosClient initialPredictions={predictions} />
}
