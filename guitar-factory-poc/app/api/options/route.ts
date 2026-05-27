import { NextResponse } from 'next/server'
import { GUITAR_OPTIONS } from '../../../domain/types'

export async function GET() {
  return NextResponse.json(GUITAR_OPTIONS)
}
