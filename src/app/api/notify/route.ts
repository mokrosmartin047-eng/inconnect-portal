import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, clientName, detail } = body

    // Get admin email
    const supabase = await createClient()
    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'accountant')

    if (!admins || admins.length === 0) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 })
    }

    const adminEmail = admins[0].email

    // Send email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set, skipping email notification')
      return NextResponse.json({ ok: true, skipped: true })
    }

    const subject = type === 'document'
      ? `Nový dokument od ${clientName}`
      : `Nová správa od ${clientName}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #282828;">${subject}</h2>
        <p style="color: #666;">${detail}</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://inconnect-portal.vercel.app'}/dashboard"
           style="background: #00B4D8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Otvoriť portál
        </a>
        <br/><br/>
        <p style="color: #999; font-size: 12px;">InConnect Účtovníctvo — Klientský portál</p>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'InConnect Portál <onboarding@resend.dev>',
        to: adminEmail,
        subject,
        html,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
