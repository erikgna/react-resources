import { NextRequest, NextResponse } from 'next/server'
import { getGuitarById, removeFromInventory } from '../../../../services/inventory.service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const guitar = getGuitarById(id)
  if (!guitar) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(guitar)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const guitar = getGuitarById(id)
  if (!guitar) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    removeFromInventory(id)
    return NextResponse.json({ deleted: id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
