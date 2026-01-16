'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import * as React from 'react'

interface MagicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  delay?: number
}

export const MagicCard = React.forwardRef<HTMLDivElement, MagicCardProps>(
  ({ children, hover = true, delay = 0, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        whileHover={hover ? {
          scale: 1.02,
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        } : undefined}
      >
        <Card className={className} {...props}>
          {children}
        </Card>
      </motion.div>
    )
  }
)

MagicCard.displayName = 'MagicCard'
