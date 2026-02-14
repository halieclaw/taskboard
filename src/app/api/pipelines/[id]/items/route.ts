import { NextRequest, NextResponse } from 'next/server'
import { createItem } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const item = await createItem(params.id, data)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
