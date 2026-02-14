import { NextRequest, NextResponse } from 'next/server'
import { getPipelines, createPipeline } from '@/lib/pipeline-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pipelines = await getPipelines()
    return NextResponse.json(pipelines)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const pipeline = await createPipeline(data)
    return NextResponse.json(pipeline, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
