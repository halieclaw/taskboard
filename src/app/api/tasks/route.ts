import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const tasks = await getTasks()
    return NextResponse.json(tasks)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const task = await createTask(data)
    return NextResponse.json(task, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
