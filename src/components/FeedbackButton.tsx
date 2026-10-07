import { useState } from 'react';
import { MessageSquare, Star, Heart } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Floating Feedback Button - positioned opposite to chatbox (bottom-left) */}
      <button
        onClick={openModal}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-secondary to-accent rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group hover:shadow-xl"
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        {/* Icon with animated pulse effect */}
        <div className="relative">
          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" />
          
          {/* Animated pulse dot */}
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full animate-pulse flex items-center justify-center">
            <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
          </span>
          
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-secondary to-accent opacity-0 group-hover:opacity-30 group-hover:scale-150 transition-all duration-300 -z-10" />
        </div>
        
        {/* Tooltip - hidden on mobile for better UX */}
        <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none hidden sm:block">
          Share your feedback
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

// Alternative feedback button with different styling
export const FeedbackButtonAlt = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 left-6 z-40 group"
        title="Send Feedback"
      >
        {/* Main button */}
        <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110">
          <Heart className="w-7 h-7 text-white group-hover:animate-pulse" />
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
        
        {/* Small notification badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};