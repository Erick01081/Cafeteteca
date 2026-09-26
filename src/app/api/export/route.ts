import { NextResponse } from 'next/server';
import { exportAll } from '@/lib/repo';

export async function GET() {
  try {
    const data = await exportAll();
    const filename = `cafeteca-export-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
