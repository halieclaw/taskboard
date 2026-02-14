import { NextRequest, NextResponse } from 'next/server'
import { writeItemResult, moveItem } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  try {
    const data = await req.json()

    // Write the processing result
    const item = await writeItemResult(params.itemId, {
      output: data.output,
      payload_updates: data.payload_updates,
    }, data.agent_name || 'pipeline-engine')

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

    // Auto-move if requested and next_stage_id provided
    if (data.move_to_next && data.next_stage_id) {
      const moved = await moveItem(params.itemId, data.next_stage_id, data.agent_name || 'pipeline-engine')
      return NextResponse.json(moved)
    }

    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
