import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const { allowed, remaining, resetIn } = checkRateLimit(ip)

  if (!allowed) {
    const minutes = Math.ceil(resetIn / 60000)
    return NextResponse.json(
      { error: `Príliš veľa pokusov. Skúste znova o ${minutes} minút.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return NextResponse.json({ allowed: true, remaining })
}
