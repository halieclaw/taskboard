import { NextRequest, NextResponse } from 'next/server'
import { getPipeline, updatePipeline, deletePipeline } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pipeline = await getPipeline(params.id)
    if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(pipeline)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const pipeline = await updatePipeline(params.id, data)
    if (!pipeline) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(pipeline)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = await deletePipeline(params.id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
