import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const products = await db.product.findMany()
    const settings = await db.appSettings.findUnique({ where: { id: 'app' } })
    const sessions = await db.session.findMany()
    const consumptionLogs = await db.consumptionLog.findMany()

    const exportData = {
      products,
      settings,
      sessions,
      consumptionLogs,
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, data } = body

    if (!mode || !data) {
      return NextResponse.json(
        { error: 'Mode and data are required' },
        { status: 400 }
      )
    }

    if (!['replace', 'merge'].includes(mode)) {
      return NextResponse.json(
        { error: 'Mode must be "replace" or "merge"' },
        { status: 400 }
      )
    }

    if (mode === 'replace') {
      // Delete all existing data
      await db.consumptionLog.deleteMany()
      await db.session.deleteMany()
      await db.product.deleteMany()

      // Import new products
      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          await db.product.create({
            data: {
              id: product.id,
              name: product.name,
              strain: product.strain ?? '',
              type: product.type ?? 'hybrid',
              thc: product.thc ?? 0,
              cbd: product.cbd ?? 0,
              amount: product.amount ?? 0,
              price: product.price ?? 0,
              picture: product.picture ?? null,
              notes: product.notes ?? null,
              rating: product.rating ?? 0,
              brand: product.brand ?? null,
              consumptionCount: product.consumptionCount ?? 0,
              lastConsumed: product.lastConsumed
                ? new Date(product.lastConsumed)
                : null,
              favorite: product.favorite ?? false,
              tags: product.tags ?? '',
              effects: product.effects ?? '',
              createdAt: product.createdAt
                ? new Date(product.createdAt)
                : new Date(),
              updatedAt: product.updatedAt
                ? new Date(product.updatedAt)
                : new Date(),
            },
          })
        }
      }

      // Import sessions
      if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          await db.session.create({
            data: {
              id: session.id,
              productId: session.productId,
              amount: session.amount ?? 0,
              people: session.people ?? 1,
              hitsCount: session.hitsCount ?? 0,
              notes: session.notes ?? null,
              bowlsPerPerson: session.bowlsPerPerson ?? 0,
              personHits: session.personHits ?? '',
              rotationEnabled: session.rotationEnabled ?? false,
              date: session.date ? new Date(session.date) : new Date(),
              createdAt: session.createdAt
                ? new Date(session.createdAt)
                : new Date(),
            },
          })
        }
      }

      // Import consumption logs
      if (data.consumptionLogs && Array.isArray(data.consumptionLogs)) {
        for (const log of data.consumptionLogs) {
          await db.consumptionLog.create({
            data: {
              id: log.id,
              productId: log.productId,
              sessionId: log.sessionId ?? null,
              amount: log.amount,
              consumedAt: log.consumedAt
                ? new Date(log.consumedAt)
                : new Date(),
              type: log.type ?? 'consume',
              note: log.note ?? null,
              createdAt: log.createdAt
                ? new Date(log.createdAt)
                : new Date(),
            },
          })
        }
      }

      // Update settings
      if (data.settings) {
        const settingsData: Record<string, unknown> = {}
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
          if (data.settings[field] !== undefined) {
            settingsData[field] = data.settings[field]
          }
        }

        const jsonFields = [
          'statsVisibility',
          'sessionDefaults',
          'favoriteBrands',
          'recentBrands',
        ] as const

        for (const field of jsonFields) {
          if (data.settings[field] !== undefined) {
            settingsData[field] =
              typeof data.settings[field] === 'object'
                ? JSON.stringify(data.settings[field])
                : data.settings[field]
          }
        }

        if (Object.keys(settingsData).length > 0) {
          await db.appSettings.upsert({
            where: { id: 'app' },
            update: settingsData,
            create: { id: 'app', ...settingsData },
          })
        }
      }
    } else if (mode === 'merge') {
      // Get existing product IDs to avoid duplicates
      const existingProducts = await db.product.findMany({ select: { id: true } })
      const existingIds = new Set(existingProducts.map((p) => p.id))

      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          if (existingIds.has(product.id)) {
            // Update existing
            await db.product.update({
              where: { id: product.id },
              data: {
                name: product.name,
                strain: product.strain ?? '',
                type: product.type ?? 'hybrid',
                thc: product.thc ?? 0,
                cbd: product.cbd ?? 0,
                amount: product.amount ?? 0,
                price: product.price ?? 0,
                picture: product.picture ?? null,
                notes: product.notes ?? null,
                rating: product.rating ?? 0,
                brand: product.brand ?? null,
                consumptionCount: product.consumptionCount ?? 0,
                lastConsumed: product.lastConsumed
                  ? new Date(product.lastConsumed)
                  : null,
                favorite: product.favorite ?? false,
                tags: product.tags ?? '',
                effects: product.effects ?? '',
              },
            })
          } else {
            // Create new
            await db.product.create({
              data: {
                id: product.id,
                name: product.name,
                strain: product.strain ?? '',
                type: product.type ?? 'hybrid',
                thc: product.thc ?? 0,
                cbd: product.cbd ?? 0,
                amount: product.amount ?? 0,
                price: product.price ?? 0,
                picture: product.picture ?? null,
                notes: product.notes ?? null,
                rating: product.rating ?? 0,
                brand: product.brand ?? null,
                consumptionCount: product.consumptionCount ?? 0,
                lastConsumed: product.lastConsumed
                  ? new Date(product.lastConsumed)
                  : null,
                favorite: product.favorite ?? false,
                tags: product.tags ?? '',
                effects: product.effects ?? '',
                createdAt: product.createdAt
                  ? new Date(product.createdAt)
                  : new Date(),
                updatedAt: product.updatedAt
                  ? new Date(product.updatedAt)
                  : new Date(),
              },
            })
          }
        }
      }

      // Merge settings if provided
      if (data.settings) {
        const settingsData: Record<string, unknown> = {}
        const jsonFields = [
          'statsVisibility',
          'sessionDefaults',
          'favoriteBrands',
          'recentBrands',
        ] as const

        for (const field of jsonFields) {
          if (data.settings[field] !== undefined) {
            settingsData[field] =
              typeof data.settings[field] === 'object'
                ? JSON.stringify(data.settings[field])
                : data.settings[field]
          }
        }

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
          if (data.settings[field] !== undefined) {
            settingsData[field] = data.settings[field]
          }
        }

        if (Object.keys(settingsData).length > 0) {
          const existing = await db.appSettings.findUnique({
            where: { id: 'app' },
          })
          if (existing) {
            await db.appSettings.update({
              where: { id: 'app' },
              data: settingsData,
            })
          } else {
            await db.appSettings.create({
              data: { id: 'app', ...settingsData },
            })
          }
        }
      }
    }

    const result = {
      success: true,
      mode,
      productsImported: data.products?.length ?? 0,
      sessionsImported: data.sessions?.length ?? 0,
      consumptionLogsImported: data.consumptionLogs?.length ?? 0,
      settingsImported: !!data.settings,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}
