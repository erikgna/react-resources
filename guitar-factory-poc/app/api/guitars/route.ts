import { NextRequest, NextResponse } from 'next/server'
import { createGuitar, validateSpec } from '../../../services/guitar-factory.service'
import { addToInventory } from '../../../services/inventory.service'
import type { GuitarSpec } from '../../../domain/types'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const spec = body as Partial<GuitarSpec>
  const validation = validateSpec(spec)
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 422 })
  }

  try {
    const guitar = createGuitar(spec as GuitarSpec)
    addToInventory(guitar)
    return NextResponse.json(guitar, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
