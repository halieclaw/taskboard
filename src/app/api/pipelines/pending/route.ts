import { NextResponse } from 'next/server'
import { getPendingItems } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pending = await getPendingItems()
    return NextResponse.json(pending)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
