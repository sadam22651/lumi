export type OrderShipStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED'

export function toOrderStatus(providerStatus?: string): OrderShipStatus {
  const s = (providerStatus || '').toUpperCase()
  if (s.includes('DELIVERED') || s.includes('POD')) return 'DELIVERED'
  if (s.includes('OUT FOR DELIVERY') || s.includes('ON PROCESS') || s.includes('TRANSIT') || s.includes('PICK'))
    return 'SHIPPED'
  if (s.includes('MANIFEST') || s.includes('PACK')) return 'PACKED'
  return 'PENDING'
}
