import { motion, type HTMLMotionProps } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface GlassCardProps extends HTMLMotionProps<"div"> {
    className?: string
    children: React.ReactNode
}

export const GlassCard = ({ className, children, ...props }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-glass backdrop-blur-lg border border-glassBorder rounded-xl p-6 shadow-xl",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    )
}
