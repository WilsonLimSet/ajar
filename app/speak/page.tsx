"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getFlashcardsForSpeakingReview, 
  updateSpeakingReviewLevel, 
  getCategories 
} from "@/utils/localStorage";
import Link from "next/link";
import { Flashcard, Category } from "@/types";
import AudioButton from "@/app/components/AudioButton";
import { isSpeechSupported } from "@/utils/audioUtils";

export default function SpeakPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null | undefined>(undefined);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  
  const loadCardsForReview = useCallback(() => {
    let cardsToReview: Flashcard[] = [];
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log("Loading cards for speaking review date:", today);
    console.log("Current selected category:", selectedCategory);
    
    // First get all cards due for speaking review
    const allDueCards = getFlashcardsForSpeakingReview(today);
    console.log(`Found ${allDueCards.length} total cards due for speaking review`);
    
    // Then apply category filter
    if (selectedCategory === undefined) {
      // All categories
      cardsToReview = allDueCards;
      console.log("Showing all categories");
    } else if (selectedCategory === null) {
      // No category
      cardsToReview = allDueCards.filter(card => !card.categoryId);
      console.log("Filtering to show only cards with no category");
    } else {
      // Specific category
      cardsToReview = allDueCards.filter(card => card.categoryId === selectedCategory);
      console.log(`Filtering to show only cards with category ID: ${selectedCategory}`);
    }
    
    console.log(`After filtering: ${cardsToReview.length} cards for speaking review`);
    
    // Log each card for debugging
    cardsToReview.forEach(card => {
      console.log(`Card: ${card.text}, Category: ${card.categoryId || 'none'}, Reading Level: ${card.readingReviewLevel}`);
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
    setSpeechSupported(isSpeechSupported());
    
    // Load categories
    const allCategories = getCategories();
    setCategories(allCategories);
    
    // Load initial cards for review (all categories)
    loadCardsForReview();
  }, [loadCardsForReview]);
  
  // Effect to handle changes to the cards array
  useEffect(() => {
    // If we have no cards, mark as finished
    if (cards.length === 0) {
      setIsFinished(true);
    } else if (isFinished) {
      // If we have cards but isFinished is true, set it to false
      setIsFinished(false);
    }
    
    // If we've removed a card and the currentCardIndex is now out of bounds,
    // adjust it to the last card in the array
    if (currentCardIndex >= cards.length && cards.length > 0) {
      setCurrentCardIndex(cards.length - 1);
    }
  }, [cards.length, currentCardIndex, isFinished]);
  
  // Add a useEffect to reload cards when selectedCategory changes
  useEffect(() => {
    console.log("Selected category changed to:", selectedCategory);
    loadCardsForReview();
  }, [selectedCategory, loadCardsForReview]);
  
  // Get current card
  const currentCard = cards.length > 0 && currentCardIndex < cards.length 
    ? cards[currentCardIndex] 
    : null;
  
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };
  
  const handleResult = (successful: boolean) => {
    if (!currentCard) return;
    // Update speaking review level in localStorage
    updateSpeakingReviewLevel(currentCard.id, successful);
    setReviewedCards(prev => new Set(prev).add(currentCard.id));
    if (successful) {
      // Remove the card from the queue
      setCards(prevCards => {
        const updatedCards = prevCards.filter((_, index) => index !== currentCardIndex);
        if (currentCardIndex >= updatedCards.length && updatedCards.length > 0) {
          setCurrentCardIndex(updatedCards.length - 1);
        } else if (updatedCards.length === 0) {
          setIsFinished(true);
        }
        return updatedCards;
      });
    } else {
      // Move the current card to the back of the queue
      setCards(prevCards => {
        if (prevCards.length <= 1) {
          return prevCards;
        }
        const currentCard = prevCards[currentCardIndex];
        const remainingCards = prevCards.filter((_, index) => index !== currentCardIndex);
        const updatedCards = [...remainingCards, currentCard];
        return updatedCards;
      });
      if (currentCardIndex >= cards.length - 1) {
        setCurrentCardIndex(0);
      }
    }
    setShowAnswer(false);
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
  
  // Update the category filter modal buttons to ensure they properly set the category
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
                  console.log("Setting category to undefined (all categories)");
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
                  console.log("Setting category to null (no category)");
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
                    console.log(`Setting category to: ${category.id} (${category.name})`);
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
        <h1 className="text-2xl font-bold text-black">Speaking Practice</h1>
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
              {Math.max(0, cards.length - currentCardIndex)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-between mb-6">
        <div className="flex space-x-2">
          {renderFilterButton()}
        </div>
      </div>
      
      {/* Finished state */}
      {isFinished && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h2 className="text-xl font-bold mb-4 text-black">All Done!</h2>
          <p className="mb-6 text-gray-600">You reviewed all the cards due for today in this category.</p>
          <div className="flex flex-col space-y-3">
            <Link href="/">
              <button className="w-full py-3 px-4 bg-fl-salmon text-white rounded-md hover:bg-fl-salmon/90">
                Create New Flashcard
              </button>
            </Link>
            <button 
              onClick={() => {
                console.log("Review All Categories button clicked");
                setSelectedCategory(undefined);
                // Force a reload of all cards
                setTimeout(() => {
                  loadCardsForReview();
                }, 100);
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
          
          {/* Card content - REVERSED: showing English first */}
          <div className="p-6">
            <div className="mb-6 text-center">
              {/* Show English meaning first */}
              <h2 className="text-2xl font-bold mb-2 text-black">{currentCard.translation}</h2>
              
              {showAnswer && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-3xl font-bold mb-2 text-black">{currentCard.text}</h3>
                  
                  {/* Add audio button for pronunciation help */}
                  {speechSupported && (
                    <div className="mt-4 flex justify-center">
                      <AudioButton text={currentCard.text} />
                    </div>
                  )}
                </div>
              )}
            </div>
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