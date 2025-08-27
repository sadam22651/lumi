'use client'

import { FC } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CartItemProps {
  id: string
  name: string
  stock: number
  quantity: number
}

interface MiniCartProps {
  items: CartItemProps[]
  updateQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  onCheckout: () => void
}

export const MiniCart: FC<MiniCartProps> = ({
  items,
  updateQty,
  removeItem,
  onCheckout,
}) => {
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
      <h2 className="text-lg font-semibold mb-2">Mini Cart</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">Belum ada item.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <span className="flex-1">{it.name}</span>
              <Input
                type="number"
                min={1}
                max={it.stock}
                value={it.quantity}
                onChange={(e) => updateQty(it.id, +e.target.value)}
                className="w-16"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => removeItem(it.id)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        className="mt-4 w-full"
        disabled={items.length === 0}
        onClick={onCheckout}
      >
        Checkout
      </Button>
    </div>
  )
}
