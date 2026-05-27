import { NextRequest, NextResponse } from 'next/server'
import { getInventory, filterInventory } from '../../../services/inventory.service'
import type { GuitarSpec, GuitarType, ModelSeries } from '../../../domain/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') as GuitarType | null
  const model = searchParams.get('model') as ModelSeries | null

  const filter: Partial<GuitarSpec> = {}
  if (type) filter.type = type
  if (model) filter.modelSeries = model

  const guitars = Object.keys(filter).length > 0
    ? filterInventory(filter)
    : getInventory()

  return NextResponse.json(guitars)
}
