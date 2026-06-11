import { cva, type VariantProps } from 'class-variance-authority'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

function initialsFrom(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const userAvatarVariants = cva('!rounded-full shrink-0 after:!rounded-full', {
  variants: {
    size: {
      sm: '!size-6',
      md: '!size-8',
      lg: '!size-20',
    },
    highlight: {
      true: 'after:border-accent',
      false: 'after:border-border',
    },
  },
  defaultVariants: {
    size: 'md',
    highlight: false,
  },
})

const fallbackTextVariants = cva(
  'font-mono uppercase tracking-wide !rounded-full bg-gray-800 text-fg-2',
  {
    variants: {
      size: {
        sm: 'text-[9px]',
        md: 'text-[11px]',
        lg: 'text-2xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

interface UserAvatarProps extends VariantProps<typeof userAvatarVariants> {
  name: string
  imageUrl?: string | null
  className?: string
}

export function UserAvatar({
  name,
  imageUrl,
  size = 'md',
  highlight = false,
  className,
}: UserAvatarProps) {
  return (
    <Avatar className={cn(userAvatarVariants({ size, highlight }), className)}>
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={name} className="!rounded-full object-cover" />
      ) : null}
      <AvatarFallback className={fallbackTextVariants({ size })} delay={0}>
        {initialsFrom(name)}
      </AvatarFallback>
    </Avatar>
  )
}
