import { NextRequest, NextResponse } from 'next/server'
import { updateStage, deleteStage } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string; stageId: string } }) {
  try {
    const data = await req.json()
    const stage = await updateStage(params.stageId, data)
    if (!stage) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(stage)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; stageId: string } }) {
  try {
    const ok = await deleteStage(params.stageId)
    if (!ok) return NextResponse.json({ error: 'Cannot delete (start/end stages are locked)' }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
