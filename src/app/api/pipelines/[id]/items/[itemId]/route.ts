import { NextRequest, NextResponse } from 'next/server'
import { updateItem, moveItem, deleteItem } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const data = await req.json()
    // If move_to_stage is specified, use move logic
    if (data.move_to_stage) {
      const item = await moveItem(params.itemId, data.move_to_stage, data.agent_name)
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(item)
    }
    const item = await updateItem(params.itemId, data)
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const ok = await deleteItem(params.itemId)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
