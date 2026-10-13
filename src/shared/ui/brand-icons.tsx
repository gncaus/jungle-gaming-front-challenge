import type { SVGProps } from 'react'

/** Ícones de marcas, que a biblioteca de ícones não fornece. Todos em 24×24 e decorativos. */
function BrandIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.6-1.5h1.4V4.4c-.3 0-1.1-.1-2.1-.1-2.2 0-3.6 1.3-3.6 3.7v2.5H8.3v3h2.5V21h2.7z" />
    </BrandIcon>
  )
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" />
    </BrandIcon>
  )
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M21 6.2c-.7.3-1.4.5-2.1.6.8-.5 1.3-1.2 1.6-2-.7.4-1.5.7-2.3.9a3.6 3.6 0 0 0-6.2 3.3A10.3 10.3 0 0 1 4.5 5.2a3.6 3.6 0 0 0 1.1 4.8c-.6 0-1.1-.2-1.6-.4 0 1.8 1.2 3.3 2.9 3.6-.5.1-1.1.2-1.6.1.5 1.4 1.8 2.5 3.4 2.5A7.3 7.3 0 0 1 3 17.3 10.3 10.3 0 0 0 8.6 19c6.7 0 10.4-5.6 10.4-10.4v-.5c.7-.5 1.4-1.2 2-1.9z" />
    </BrandIcon>
  )
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path d="M6.5 9.5h-3V20h3V9.5zM5 4.5A1.75 1.75 0 1 0 5 8a1.75 1.75 0 0 0 0-3.5zM20.5 20h-3v-5.3c0-1.4-.5-2.3-1.7-2.3-1 0-1.6.7-1.8 1.3-.1.2-.1.6-.1.9V20h-3V9.5h3v1.4c.4-.7 1.2-1.6 3-1.6 2.2 0 3.6 1.4 3.6 4.5V20z" />
    </BrandIcon>
  )
}

export function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path
        fillRule="evenodd"
        d="M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 9.8 2 12 2 12s0 2.2.4 3.8a2.5 2.5 0 0 0 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-3.8.4-3.8s0-2.2-.4-3.8zM10 14.6V9.4l4.5 2.6-4.5 2.6z"
      />
    </BrandIcon>
  )
}

/** "G" do Google, nas cores da marca. */
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BrandIcon {...props}>
      <path
        fill="#4285f4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3H20c2.3-2.1 3.5-5.2 3.5-8.7z"
      />
      <path
        fill="#34a853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#fbbc05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#ea4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </BrandIcon>
  )
}
