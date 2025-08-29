// src/components/Navbar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'firebase/auth'
import axios from 'axios'
import {
  ShoppingCartIcon,
  TruckIcon,
  MenuIcon,
  LogOutIcon,
  LayoutDashboardIcon,
  HomeIcon,
  PackageIcon,
  InfoIcon,
  BookOpenIcon,
  ChevronDownIcon,
} from 'lucide-react'

import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const adminList = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''
)
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

const NAV_ITEMS = [
  { href: '/',         label: 'Home',   icon: HomeIcon },
  { href: '/products', label: 'Produk', icon: PackageIcon },
  { href: '/about',    label: 'About',  icon: InfoIcon },
  // Tutorial dibuat sebagai dropdown terpisah (desktop) & collapsible (mobile)
] as const

// Tipe minimal untuk respons /api/cart
type CartApiResponse = {
  items?: Array<{
    quantity?: number
    // properti lain diabaikan untuk hitung badge
  }>
}

export default function Navbar() {
  const user = useAuth()
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [openTut, setOpenTut] = useState(false) // mobile: expand/collapse Tutorial

  const isAdmin = Boolean(user?.email && adminList.includes(user.email || ''))

  const initials = useMemo(() => {
    if (!user?.displayName && !user?.email) return 'U'
    const base = user.displayName || user.email || 'U'
    return base?.slice(0, 1)?.toUpperCase()
  }, [user])

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user?.getIdToken) {
        setCartCount(0)
        return
      }
      try {
        const token = await user.getIdToken()
        const res = await axios.get<CartApiResponse>('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const items = res.data.items ?? []
        const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        setCartCount(total)
      } catch {
        setCartCount(0)
      }
    }
    fetchCartCount()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    window.location.href = '/login'
  }

  const ActiveLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={cn(
          'px-3 py-2 rounded-md text-sm font-medium transition-colors',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {children}
      </Link>
    )
  }

  const tutorialActive = pathname.startsWith('/tutorial')

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          {/* Mobile: hamburger */}
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Buka menu">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-left">Widuri Store</SheetTitle>
                </SheetHeader>

                <div className="mt-4 space-y-1">
                  {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setOpen(false)}>
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          pathname === href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                    </Link>
                  ))}

                  {/* Mobile: Collapsible Tutorial */}
                  <button
                    type="button"
                    onClick={() => setOpenTut((v) => !v)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      tutorialActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    aria-expanded={openTut}
                    aria-controls="tutorial-submenu"
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    <span className="flex-1">Tutorial</span>
                    <ChevronDownIcon
                      className={cn('h-4 w-4 transition-transform', openTut ? 'rotate-180' : '')}
                    />
                  </button>
                  {openTut && (
                    <div id="tutorial-submenu" className="ml-8 space-y-1">
                      <Link href="/tutorial/cincin" onClick={() => setOpen(false)}>
                        <div
                          className={cn(
                            'rounded-md px-3 py-2 text-sm transition-colors',
                            pathname === '/tutorial/cincin'
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          Cincin
                        </div>
                      </Link>
                      <Link href="/tutorial/kalung" onClick={() => setOpen(false)}>
                        <div
                          className={cn(
                            'rounded-md px-3 py-2 text-sm transition-colors',
                            pathname === '/tutorial/kalung'
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          Kalung
                        </div>
                      </Link>
                    </div>
                  )}

                  {isAdmin && (
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <div
                        className={cn(
                          'mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          pathname === '/dashboard'
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        <span>Dashboard</span>
                      </div>
                    </Link>
                  )}

                  <Separator className="my-3" />

                  {/* Quick actions (mobile, tanpa History) */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/order" onClick={() => setOpen(false)} aria-label="Orders">
                      <Button variant="outline" className="w-full">
                        <TruckIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/cart" onClick={() => setOpen(false)} aria-label="Keranjang">
                      <Button variant="outline" className="relative w-full">
                        <ShoppingCartIcon className="h-4 w-4" />
                        {cartCount > 0 && (
                          <Badge
                            className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 text-[10px]"
                            variant="destructive"
                          >
                            {cartCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  </div>

                  <Separator className="my-3" />

                  {/* Auth in sheet */}
                  {user ? (
                    <div className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL ?? undefined} alt="avatar" />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                          <p className="truncate text-sm font-medium">{user.displayName || user.email}</p>
                          <p className="truncate text-xs text-muted-foreground">Logged in</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
                        <LogOutIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex">
                      <Link href="/login" onClick={() => setOpen(false)} className="w-full">
                        <Button className="w-full">Login</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Brand */}
          <Link
            href="/"
            className="rounded-md px-2 text-base font-semibold tracking-tight text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Widuri Store
          </Link>

          {/* Desktop nav */}
          <div className="mx-auto hidden md:flex md:items-center md:gap-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <ActiveLink key={href} href={href}>
                {label}
              </ActiveLink>
            ))}

            {/* Desktop: Dropdown Tutorial */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1',
                    tutorialActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  aria-label="Buka menu Tutorial"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  <span>Tutorial</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/tutorial/cincin">Cincin</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/tutorial/kalung">Kalung</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAdmin && <ActiveLink href="/dashboard">Dashboard</ActiveLink>}
          </div>

          {/* Right actions (tanpa History) */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/order" aria-label="Orders">
                <Button variant="outline" size="icon">
                  <TruckIcon className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/cart" className="relative" aria-label="Keranjang">
                <Button variant="outline" size="icon">
                  <ShoppingCartIcon className="h-5 w-5" />
                </Button>
                {cartCount > 0 && (
                  <Badge
                    className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full px-1 text-[10px]"
                    variant="destructive"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </div>

            {/* user menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.photoURL ?? undefined} alt="avatar" />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[140px] truncate text-sm sm:inline">
                      {user.displayName || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Akun</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/order">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cart">Keranjang</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex">
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
