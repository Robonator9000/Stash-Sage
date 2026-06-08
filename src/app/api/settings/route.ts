import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const JSON_FIELDS = [
  'statsVisibility',
  'sessionDefaults',
  'favoriteBrands',
  'recentBrands',
] as const

export async function GET() {
  try {
    let settings = await db.appSettings.findUnique({ where: { id: 'app' } })

    if (!settings) {
      settings = await db.appSettings.create({ data: { id: 'app' } })
    }

    // Parse JSON fields for the response
    const parsed = { ...settings }
    for (const field of JSON_FIELDS) {
      try {
        (parsed as Record<string, unknown>)[field] = JSON.parse(
          settings[field] as string
        )
      } catch {
        // Keep raw string if parsing fails
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    let settings = await db.appSettings.findUnique({ where: { id: 'app' } })

    if (!settings) {
      settings = await db.appSettings.create({ data: { id: 'app' } })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    // Handle simple fields
    const simpleFields = [
      'language',
      'theme',
      'onboardingDone',
      'currency',
      'decimalPrecision',
      'showTimerMs',
      'pinEnabled',
      'pinHash',
      'lowStockThreshold',
      'budgetLimit',
      'budgetPeriod',
    ] as const

    for (const field of simpleFields) {
      if (body[field] !== undefined) {
        data[field] = body[field]
      }
    }

    // Handle JSON fields - merge with existing and stringify
    for (const field of JSON_FIELDS) {
      if (body[field] !== undefined) {
        let existingParsed: Record<string, unknown> = {}
        try {
          existingParsed = JSON.parse(settings[field] as string)
        } catch {
          // Use empty object as fallback
        }

        const merged =
          typeof body[field] === 'object' && body[field] !== null
            ? { ...existingParsed, ...body[field] }
            : body[field]

        data[field] = typeof merged === 'object' ? JSON.stringify(merged) : merged
      }
    }

    const updated = await db.appSettings.update({
      where: { id: 'app' },
      data,
    })

    // Parse JSON fields for the response
    const parsed = { ...updated }
    for (const field of JSON_FIELDS) {
      try {
        (parsed as Record<string, unknown>)[field] = JSON.parse(
          updated[field] as string
        )
      } catch {
        // Keep raw string if parsing fails
      }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
