declare module 'midtrans-client' {
  export class Snap {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey: string
    })
    createTransactionToken(params: unknown): Promise<string>
  }

  export class Core {
    constructor(options: {
      isProduction: boolean
      serverKey: string
      clientKey?: string
    })
    // tambahkan method lain bila nanti dipakai
  }
}
