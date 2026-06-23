'use client'
import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface Props extends Omit<ImageProps, 'onError'> {
  fallbackName?: string
}

export function CelebrityImage({ src, alt, fallbackName, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src)
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || alt || 'Star')}&size=400&background=1a1a2e&color=f59e0b&bold=true`

  return (
    <Image
      {...props}
      src={imgSrc || fallback}
      alt={alt}
      onError={() => setImgSrc(fallback)}
    />
  )
}
