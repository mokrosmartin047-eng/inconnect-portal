import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, senderName, senderRole, clientId, detail } = body

    const supabase = await createClient()
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not set, skipping email notification')
      return NextResponse.json({ ok: true, skipped: true })
    }

    let recipientEmail: string | null = null
    let subject: string
    let actionLabel: string

    if (senderRole === 'client') {
      // Klient poslal → notifikácia adminovi
      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'accountant')

      if (!admins || admins.length === 0) {
        return NextResponse.json({ error: 'No admin found' }, { status: 404 })
      }
      recipientEmail = admins[0].email
      subject = type === 'document'
        ? `Nový dokument od ${senderName}`
        : `Nová správa od ${senderName}`
      actionLabel = 'Otvoriť portál'
    } else {
      // Admin poslal → notifikácia klientovi
      if (!clientId) {
        return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
      }
      const { data: client } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', clientId)
        .single()

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      recipientEmail = client.email
      subject = type === 'document'
        ? 'Nový dokument od vašej účtovníčky'
        : 'Nová správa od vašej účtovníčky'
      actionLabel = 'Otvoriť portál'
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No recipient' }, { status: 400 })
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px;">
        <h2 style="color: #282828;">${subject}</h2>
        <p style="color: #666;">${detail}</p>
        <br/>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://inconnect-portal.vercel.app'}/dashboard"
           style="background: #00B4D8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
          ${actionLabel}
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
        to: recipientEmail,
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
