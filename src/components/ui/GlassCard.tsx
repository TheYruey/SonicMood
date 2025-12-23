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
                "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20",
                className
            )}
            {...props}
        >
            {children}
        </motion.div >
    )
}
