import { Star } from 'lucide-react'

/**
 * UI component responsible for rendering rating stars.
 */
export function RatingStars({ rating, hoverRating, onRate, onHover }) {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex items-center justify-center space-x-2 sm:space-x-3" role="group">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="group focus:outline-none transition-transform hover:scale-110 focus:scale-110 p-1"
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
          >
            <Star
              className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-200 
                ${star <= (hoverRating || rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-transparent text-gray-300 group-hover:text-gray-400'
                }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs sm:text-sm text-gray-400 font-medium">
        {rating > 0 ? (
          <span className="text-yellow-600 font-semibold">
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Very Poor'}
          </span>
        ) : 'Cliquez pour évaluer'}
      </span>
    </div>
  )
}