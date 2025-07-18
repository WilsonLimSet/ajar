"use client";

import { useState, useEffect, useCallback } from "react";
import { getFlashcardsForReadingReview, updateReadingReviewLevel, getCategories, getFlashcard } from "@/utils/localStorage";
import Link from "next/link";
import { Flashcard, Category } from "@/types";

export default function ReviewPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState<"chineseToEnglish" | "englishToChinese">("chineseToEnglish");
  const [displayMode, setDisplayMode] = useState<"normal" | "chineseOnly">("normal");
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null | undefined>(undefined);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  const loadCardsForReview = useCallback(() => {
    let cardsToReview: Flashcard[] = [];
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log("Loading cards for reading review date:", today);
    
    // Always get fresh data from localStorage
    if (selectedCategory === undefined) {
      // All categories
      cardsToReview = getFlashcardsForReadingReview(today);
    } else if (selectedCategory === null) {
      // No category
      cardsToReview = getFlashcardsForReadingReview(today).filter(card => !card.categoryId);
    } else {
      // Specific category
      cardsToReview = getFlashcardsForReadingReview(today).filter(card => card.categoryId === selectedCategory);
    }
    
    console.log(`Found ${cardsToReview.length} cards for reading review`);
    cardsToReview.forEach(card => {
      console.log(`Card: ${card.text}, Reading Level: ${card.readingReviewLevel}, Next reading review: ${card.readingNextReviewDate}`);
    });
    
    // Shuffle the cards
    const shuffled = [...cardsToReview].sort(() => Math.random() - 0.5);
    
    // Reset all state
    setCards(shuffled);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsFinished(shuffled.length === 0); // Only set finished if there are no cards
    setReviewedCards(new Set());
  }, [selectedCategory]);
  
  useEffect(() => {
    // Check if speech synthesis is supported
    
    // Load categories
    const allCategories = getCategories();
    setCategories(allCategories);
      
    
    // Load initial cards for review (all categories)
    loadCardsForReview();
    
    // Set up a refresh interval to check for new cards
    const refreshInterval = setInterval(() => {
      // Check if there are any new cards to review
      const today = new Date().toISOString().split('T')[0];
      let cardsToReview = getFlashcardsForReadingReview(today);
      
      // Apply category filter if needed
      if (selectedCategory === null) {
        // No category
        cardsToReview = cardsToReview.filter(card => !card.categoryId);
      } else if (selectedCategory !== undefined) {
        // Specific category
        cardsToReview = cardsToReview.filter(card => card.categoryId === selectedCategory);
      }
      
      // If we're showing "all done" but there are cards to review, refresh
      if (isFinished && cardsToReview.length > 0) {
        console.log(`Found ${cardsToReview.length} new cards to review, refreshing...`);
        loadCardsForReview();
      }
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(refreshInterval);
  }, [isFinished, selectedCategory, loadCardsForReview]);
  
  // Effect to handle changes to the cards array
  useEffect(() => {
    // If we have no cards, mark as finished
    if (cards.length === 0) {
      console.log("No cards to review, marking as finished");
      setIsFinished(true);
    } else if (isFinished) {
      // If we have cards but isFinished is true, set it to false
      console.log("Cards available but marked as finished, correcting...");
      setIsFinished(false);
    }
    
    // If we've removed a card and the currentCardIndex is now out of bounds,
    // adjust it to the last card in the array
    if (currentCardIndex >= cards.length && cards.length > 0) {
      console.log(`Current index (${currentCardIndex}) is beyond cards length (${cards.length}), adjusting...`);
      setCurrentCardIndex(cards.length - 1);
    }
  }, [cards.length, currentCardIndex, isFinished]); // Depend on cards.length, currentCardIndex, and isFinished
  
  
  // Get current card
  const currentCard = cards.length > 0 && currentCardIndex < cards.length 
    ? cards[currentCardIndex] 
    : null;
  
  // Debug log for card state
  useEffect(() => {
    if (cards.length > 0) {
      console.log(`Cards state updated: ${cards.length} cards, current index: ${currentCardIndex}`);
      if (currentCard) {
        console.log(`Current card: ${currentCard.text}`);
      } else {
        console.log(`No current card at index ${currentCardIndex}`);
      }
    }
  }, [cards, currentCardIndex, currentCard]);
  
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleResult = (successful: boolean) => {
    if (!currentCard) return;
    
    // Update reading review level in localStorage
    updateReadingReviewLevel(currentCard.id, successful);
    
    // Add to reviewed cards set
    setReviewedCards(prev => new Set(prev).add(currentCard.id));
    
    if (!successful) {
      // If marked as "Again", get the updated card and add to end of queue
      const updatedCard = getFlashcard(currentCard.id);
      
      if (updatedCard) {
        console.log(`Card "${updatedCard.text}" marked as "Again" - adding back to queue with reading level ${updatedCard.readingReviewLevel}`);
        
        // Update our cards array with the modified card at the end
        setCards(prevCards => {
          // First, find the current index of the card
          const currentIndex = prevCards.findIndex(card => card.id === currentCard.id);
          
          // Create a new array without the current card
          const newCards = prevCards.filter((_, index) => index !== currentIndex);
          
          // Add the updated card to the end
          const updatedCards = [...newCards, updatedCard];
          
          console.log(`Cards queue updated: ${updatedCards.length} cards total`);
          
          return updatedCards;
        });
        
        // If we're at the last card, we need to adjust the index
        if (currentCardIndex >= cards.length - 1) {
          // We're at the end, so we need to adjust to show the next card
          // which will be the last card in the array after our update
          setCurrentCardIndex(cards.length - 2);
        }
      } else {
        console.error(`Could not find card ${currentCard.id} in localStorage`);
        // Just move to the next card
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex(prev => prev + 1);
        } else {
          setIsFinished(true);
        }
      }
    } else {
      // If marked as "Got It", remove the card from the queue
      setCards(prevCards => {
        const currentIndex = prevCards.findIndex(card => card.id === currentCard.id);
        const updatedCards = prevCards.filter((_, index) => index !== currentIndex);
        if (currentCardIndex >= updatedCards.length && updatedCards.length > 0) {
          setCurrentCardIndex(updatedCards.length - 1);
        } else if (updatedCards.length === 0) {
          setIsFinished(true);
        }
        return updatedCards;
      });
    }
    
    // Reset showAnswer for the next card
    setShowAnswer(false);
  };

  const toggleReviewMode = () => {
    setReviewMode(prev => 
      prev === "chineseToEnglish" ? "englishToChinese" : "chineseToEnglish"
    );
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => 
      prev === "normal" ? "chineseOnly" : "normal"
    );
  };
  
  // Get category for current card
  const getCurrentCardCategory = () => {
    if (!currentCard || !currentCard.categoryId) return null;
    return categories.find(cat => cat.id === currentCard.categoryId) || null;
  };
  
  // Toggle category filter modal
  const toggleCategoryFilter = () => {
    setShowCategoryFilter(!showCategoryFilter);
  };
  
  // Category filter modal
  const renderCategoryFilterModal = () => {
    if (!showCategoryFilter) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-black">Filter by Category</h2>
          
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => {
                  setSelectedCategory(undefined);
                  setShowCategoryFilter(false);
                }}
                className={`px-3 py-2 rounded-md text-sm ${
                  selectedCategory === undefined
                    ? 'bg-fl-red text-white'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                All Categories
              </button>
              
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryFilter(false);
                }}
                className={`px-3 py-2 rounded-md text-sm ${
                  selectedCategory === null
                    ? 'bg-fl-red text-white'
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                No Category
              </button>
              
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setShowCategoryFilter(false);
                  }}
                  className={`px-3 py-2 rounded-md text-sm ${
                    selectedCategory === category.id
                      ? 'bg-fl-red text-white'
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}
                  style={selectedCategory === category.id ? {} : { backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowCategoryFilter(false)}
              className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render the review mode toggle button
  const renderReviewModeToggle = () => {
    return (
      <button
        onClick={toggleReviewMode}
        className="flex items-center justify-center p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title={reviewMode === "chineseToEnglish" ? "Currently: Chinese → English" : "Currently: English → Chinese"}
      >
        {reviewMode === "chineseToEnglish" ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    );
  };

  const renderDisplayModeToggle = () => {
    return (
      <button
        onClick={toggleDisplayMode}
        className="flex items-center justify-center p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        title={displayMode === "normal" ? "Currently: Normal Display" : "Currently: Chinese Only"}
      >
        {displayMode === "normal" ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
        )}
      </button>
    );
  };

  // Render the filter button
  const renderFilterButton = () => {
    return (
      <button
        onClick={toggleCategoryFilter}
        className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-md text-black text-sm hover:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter
        {selectedCategory !== undefined && selectedCategory !== null && (
          <span className="ml-1 w-2 h-2 rounded-full" style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color || '#ccc' }}></span>
        )}
      </button>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-md bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Review Flashcards</h1>
      </div>
      
      {/* Stats */}
      <div className="bg-white rounded-lg shadow-md p-3 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-center p-2 bg-blue-50 rounded-lg flex-1 mr-2">
            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Reviewed</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{reviewedCards.size}</p>
          </div>
          <div className="text-center p-2 bg-blue-100 rounded-lg flex-1 ml-2">
            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">To Review</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {/* Show remaining cards count (total - current index) */}
              {Math.max(0, cards.length - currentCardIndex)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          {renderReviewModeToggle()}
          {renderDisplayModeToggle()}
          {renderFilterButton()}
        </div>
      </div>
      
      {/* Finished state */}
      {isFinished && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h2 className="text-xl font-bold mb-4 text-black">All Done!</h2>
          <p className="mb-6 text-gray-600">You&apos;ve reviewed all the cards due for today in this category.</p>
          <div className="flex flex-col space-y-3">
            <Link href="/">
              <button className="w-full py-3 px-4 bg-fl-salmon text-white rounded-md hover:bg-fl-salmon/90">
                Create New Flashcard
              </button>
            </Link>
            <button 
              onClick={() => {
                setSelectedCategory(undefined);
                loadCardsForReview();
              }}
              className="w-full py-3 px-4 bg-fl-yellow text-white rounded-md hover:bg-fl-yellow/90"
            >
              Review All Categories
            </button>
          </div>
        </div>
      )}
      
      {/* Card */}
      {!isFinished && currentCard && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Card header with category if available */}
          {getCurrentCardCategory() && (
            <div 
              className="px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: getCurrentCardCategory()?.color || '#ccc' }}
            >
              {getCurrentCardCategory()?.name}
            </div>
          )}
          
          {/* Card content */}
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2 text-black">{currentCard.text}</h2>
            </div>
            
            {showAnswer && (
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-lg font-medium text-black">{currentCard.translation}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      {!isFinished && currentCard && (
        <div className="flex flex-col items-center">
          {!showAnswer ? (
            <button
              onClick={handleShowAnswer}
              className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-md transition-all duration-300 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Show Answer
            </button>
          ) : (
            <div className="flex space-x-4 justify-center w-full">
              <button
                onClick={() => handleResult(false)}
                className="flex-1 max-w-xs bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-400 font-medium shadow-md transition-all duration-300 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Again
              </button>
              <button
                onClick={() => handleResult(true)}
                className="flex-1 max-w-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-md transition-all duration-300 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Got It
              </button>
            </div>
          )}
        </div>
      )}
      
      {renderCategoryFilterModal()}
    </div>
  );
} 