import { NextRequest, NextResponse } from 'next/server'
import { createStage } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const stage = await createStage(params.id, data)
    return NextResponse.json(stage, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
