"use client";

import { useState, useEffect} from "react";
import { getFlashcards, getCategories, updateFlashcard } from "@/utils/localStorage";
import { speakIndonesian } from "@/utils/audioUtils";
import { Category, Flashcard } from "@/types";

export default function ListenPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    setCategories(getCategories());
    const allFlashcards = getFlashcards();
    let filtered = allFlashcards;
    if (selectedCategory === undefined) {
      // All categories
      filtered = allFlashcards;
    } else if (selectedCategory === null) {
      // No category
      filtered = allFlashcards.filter(card => !card.categoryId);
    } else {
      // Specific category
      filtered = allFlashcards.filter(card => card.categoryId === selectedCategory);
    }
    // Only show cards due for listening review today
    const today = new Date().toISOString().split('T')[0];
    filtered = filtered.filter(card => (card.listeningNextReviewDate || card.nextReviewDate) <= today);
    setFlashcards(filtered);
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsFinished(filtered.length === 0);
    setReviewedCards(new Set());
  }, [selectedCategory]);

  useEffect(() => {
    if (flashcards.length === 0) {
      setIsFinished(true);
    } else if (isFinished) {
      setIsFinished(false);
    }
    if (currentIndex >= flashcards.length && flashcards.length > 0) {
      setCurrentIndex(flashcards.length - 1);
    }
  }, [flashcards.length, currentIndex, isFinished]);

  const currentCard = flashcards.length > 0 && currentIndex < flashcards.length 
    ? flashcards[currentIndex] 
    : null;

  const handleSpeak = () => {
    if (currentCard) {
      setIsPlaying(true);
      speakIndonesian(currentCard.text)
        .then(() => setIsPlaying(false))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleResult = (successful: boolean) => {
    if (!currentCard) return;
    // Update listening review level in localStorage
    const updatedCard = { ...currentCard };
    let level = updatedCard.listeningReviewLevel ?? updatedCard.reviewLevel ?? 0;
    if (successful) {
      level = Math.min(level + 1, 5);
    } else {
      level = 0;
    }
    updatedCard.listeningReviewLevel = level;
    // Calculate next review date
    let daysToAdd = 0;
    switch(level) {
      case 0: daysToAdd = 0; break;
      case 1: daysToAdd = 1; break;
      case 2: daysToAdd = 3; break;
      case 3: daysToAdd = 5; break;
      case 4: daysToAdd = 10; break;
      case 5: daysToAdd = 24; break;
      default: daysToAdd = 0;
    }
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    updatedCard.listeningNextReviewDate = nextReview.toISOString().split('T')[0];
    // Legacy fields
    updatedCard.reviewLevel = updatedCard.listeningReviewLevel;
    updatedCard.nextReviewDate = updatedCard.listeningNextReviewDate;
    updateFlashcard(updatedCard);
    setReviewedCards(prev => new Set(prev).add(currentCard.id));
    if (successful) {
      // Remove the card from the queue
      setFlashcards(prev => {
        const updated = prev.filter((_, idx) => idx !== currentIndex);
        // Adjust currentIndex if needed
        if (currentIndex >= updated.length && updated.length > 0) {
          setCurrentIndex(updated.length - 1);
        } else if (updated.length === 0) {
          setIsFinished(true);
        }
        return updated;
      });
    } else {
      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }
    setShowAnswer(false);
  };

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
                className={`px-3 py-2 rounded-md text-sm ${selectedCategory === undefined ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                All Categories
              </button>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setShowCategoryFilter(false);
                }}
                className={`px-3 py-2 rounded-md text-sm ${selectedCategory === null ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
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
                  className={`px-3 py-2 rounded-md text-sm ${selectedCategory === category.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
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

  const renderFilterButton = () => {
    return (
      <button
        onClick={() => setShowCategoryFilter(true)}
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

  if (flashcards.length === 0 || isFinished) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Listen</h1>
          {/* Stats Bar */}
          <div className="bg-white rounded-lg shadow-md p-3 mb-6">
            <div className="flex justify-between items-center">
              <div className="text-center p-2 bg-blue-50 rounded-lg flex-1 mr-2">
                <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Reviewed</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{reviewedCards.size}</p>
              </div>
              <div className="text-center p-2 bg-blue-100 rounded-lg flex-1 ml-2">
                <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">To Review</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{Math.max(0, flashcards.length - reviewedCards.size)}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end mb-6">{renderFilterButton()}</div>
          <p>No flashcards due for listening review. Please add or review more flashcards.</p>
          {renderCategoryFilterModal()}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Listen</h1>
        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-6">
          <div className="flex justify-between items-center">
            <div className="text-center p-2 bg-blue-50 rounded-lg flex-1 mr-2">
              <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Reviewed</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{reviewedCards.size}</p>
            </div>
            <div className="text-center p-2 bg-blue-100 rounded-lg flex-1 ml-2">
              <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">To Review</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{Math.max(0, flashcards.length - reviewedCards.size)}</p>
            </div>
          </div>
        </div>
        {/* Filter Button */}
        <div className="flex justify-end mb-6">{renderFilterButton()}</div>
        {renderCategoryFilterModal()}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            {/* Only show sound button before answer is revealed */}
            {!showAnswer && (
              <button
                onClick={handleSpeak}
                disabled={isPlaying}
                className={`text-4xl mb-4 ${isPlaying ? 'opacity-50' : 'hover:text-blue-600'}`}
                title="Listen"
              >
                🔊
              </button>
            )}
            {/* Show answer: reveal text and translation */}
            {showAnswer && currentCard && (
              <>
                <p className="text-xl text-black font-medium mb-2">{currentCard.text}</p>
                <p className="text-black mb-4">{currentCard.translation}</p>
              </>
            )}
          </div>
          {/* Show Answer or Result Buttons */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Show Answer
            </button>
          ) : (
            <div className="flex space-x-4 justify-center w-full">
              <button
                onClick={() => handleResult(false)}
                className="flex-1 max-w-xs bg-gradient-to-r from-blue-400 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-blue-400 font-medium shadow-md transition-all duration-300 flex items-center justify-center"
              >
                Again
              </button>
              <button
                onClick={() => handleResult(true)}
                className="flex-1 max-w-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-md transition-all duration-300 flex items-center justify-center"
              >
                Got It
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 