/**
 * UI component responsible for rendering avatar.
 */
export function Avatar({ src, alt, isOnline, size = 'md' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    }
    return (
        <div className="relative inline-block flex-shrink-0">
            <img
                src={src}
                alt={alt}
                className={`${sizeClasses[size]} rounded-full object-cover border border-gray-100 shadow-sm`}
            />
            {isOnline && (
                <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
            )}
        </div>
    )
}