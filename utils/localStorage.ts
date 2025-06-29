import { Flashcard, Category } from "@/types";

const FLASHCARDS_KEY = "flashcards";
const CATEGORIES_KEY = "categories";

export function getFlashcards(): Flashcard[] {
  if (typeof window === "undefined") return [];
  const cards = localStorage.getItem(FLASHCARDS_KEY);
  return cards ? JSON.parse(cards) : [];
}

export function saveFlashcards(cards: Flashcard[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
}

export function addFlashcard(card: Flashcard): boolean {
  const cards = getFlashcards();
  
  // Check if a flashcard with the same text already exists
  const existingCard = cards.find(
    c => c.text.trim().toLowerCase() === card.text.trim().toLowerCase()
  );
  
  if (existingCard) {
    return false;
  }
  
  cards.push(card);
  saveFlashcards(cards);
  return true;
}

export function updateFlashcard(updatedCard: Flashcard): void {
  console.log('Updating flashcard in localStorage:', updatedCard);
  const cards = getFlashcards();
  const index = cards.findIndex(c => c.id === updatedCard.id);
  
  if (index !== -1) {
    cards[index] = updatedCard;
    localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards));
    console.log('Flashcard updated successfully');
  } else {
    console.error('Could not find flashcard to update:', updatedCard.id);
  }
}

export function deleteFlashcard(id: string): void {
  console.log('Deleting flashcard from localStorage:', id);
  const cards = getFlashcards();
  const filteredCards = cards.filter(c => c.id !== id);
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(filteredCards));
  console.log('Flashcard deleted successfully');
}

export function clearAllFlashcards(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(FLASHCARDS_KEY);
}

export function getFlashcardsForReview(dateString: string = new Date().toISOString().split('T')[0]): Flashcard[] {
  // This function is now deprecated - use getFlashcardsForReadingReview or getFlashcardsForListeningReview instead
  return getFlashcardsForReadingReview(dateString);
}

export function updateReviewStatus(id: string, successful: boolean): void {
  // This function is now deprecated - use updateReadingReviewLevel or updateListeningReviewLevel instead
  updateReadingReviewLevel(id, successful);
}

export function getFlashcard(id: string): Flashcard | null {
  const cards = getFlashcards();
  return cards.find(card => card.id === id) || null;
}

/**
 * Updates a flashcard's review level based on whether the review was successful
 * @param id The flashcard ID
 * @param successful Whether the review was successful
 * @deprecated Use updateReadingReviewLevel or updateListeningReviewLevel instead
 */
export function updateFlashcardReviewLevel(id: string, successful: boolean): void {
  // This function is now deprecated - use updateReadingReviewLevel or updateListeningReviewLevel instead
  updateReadingReviewLevel(id, successful);
}

// Category Management Functions
export function getCategories(): Category[] {
  if (typeof window === "undefined") return [];
  const categories = localStorage.getItem(CATEGORIES_KEY);
  return categories ? JSON.parse(categories) : [];
}

export function saveCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function addCategory(category: Category): void {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
}

export function updateCategory(updatedCategory: Category): void {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === updatedCategory.id);
  
  if (index !== -1) {
    categories[index] = updatedCategory;
    saveCategories(categories);
  }
}

export function deleteCategory(id: string): void {
  const categories = getCategories();
  const filteredCategories = categories.filter(c => c.id !== id);
  saveCategories(filteredCategories);
  
  // Update flashcards to remove the deleted category
  const cards = getFlashcards();
  const updatedCards = cards.map(card => {
    if (card.categoryId === id) {
      return { ...card, categoryId: undefined };
    }
    return card;
  });
  saveFlashcards(updatedCards);
}

export function getCategory(id: string): Category | null {
  const categories = getCategories();
  return categories.find(category => category.id === id) || null;
}

export function getFlashcardsByCategory(categoryId: string | null): Flashcard[] {
  const flashcards = getFlashcards();
  
  if (categoryId === null) {
    // Return cards without a category
    return flashcards.filter(card => !card.categoryId);
  }
  
  return flashcards.filter(card => card.categoryId === categoryId);
}

/**
 * Gets flashcards due for reading review on the specified date
 * @param dateString The date to check for reviews (YYYY-MM-DD format)
 * @returns Array of flashcards due for reading review
 */
export function getFlashcardsForReadingReview(dateString: string = new Date().toISOString().split('T')[0]): Flashcard[] {
  const cards = getFlashcards();
  const today = new Date(dateString);
  today.setHours(0, 0, 0, 0); // Set to beginning of day
  
  console.log(`Getting flashcards for reading review on ${dateString}`);
  
  const cardsForReview = cards.filter(card => {
    // Level 0 cards should always be included
    if (card.readingReviewLevel === 0) {
      return true;
    }
    
    // For other cards, compare dates properly
    const reviewDate = new Date(card.readingNextReviewDate);
    reviewDate.setHours(0, 0, 0, 0); // Set to beginning of day
    
    return reviewDate <= today;
  });
  
  console.log(`Found ${cardsForReview.length} cards for reading review`);
  
  return cardsForReview;
}

/**
 * Gets flashcards due for listening review on the specified date
 * @param dateString The date to check for reviews (YYYY-MM-DD format)
 * @returns Array of flashcards due for listening review
 */
export function getFlashcardsForListeningReview(currentDate: string): Flashcard[] {
  try {
    const flashcards = getFlashcards();
    console.log(`Total flashcards in storage: ${flashcards.length}`);
    
    // Filter cards that are due for listening review
    const cardsForReview = flashcards.filter(card => {
      // Always include cards with listening level 0 (new cards)
      if (card.listeningReviewLevel === 0) {
        return true;
      }
      
      // For other levels, check if the review date is today or earlier
      if (card.listeningReviewLevel > 0 && card.listeningNextReviewDate) {
        return card.listeningNextReviewDate <= currentDate;
      }
      
      return false;
    });
    
    console.log(`Found ${cardsForReview.length} cards due for listening review on ${currentDate}`);
    
    // Log each card's category for debugging
    cardsForReview.forEach(card => {
      console.log(`Due card: ${card.text}, Category: ${card.categoryId || 'none'}, Listening Level: ${card.listeningReviewLevel}`);
    });
    
    return cardsForReview;
  } catch (error) {
    console.error('Error getting flashcards for listening review:', error);
    return [];
  }
}

/**
 * Updates a flashcard's reading review level based on whether the review was successful
 * @param id The flashcard ID
 * @param successful Whether the review was successful
 */
export function updateReadingReviewLevel(id: string, successful: boolean): void {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);
  
  if (cardIndex === -1) return;
  
  const card = flashcards[cardIndex];
  
  // Update the reading review level
  if (successful) {
    // If successful, move up one level (max level is 5)
    if (card.readingReviewLevel === 0) {
      card.readingReviewLevel = 1;
    } else {
      card.readingReviewLevel = Math.min(card.readingReviewLevel + 1, 5);
    }
  } else {
    // If unsuccessful, reset to level 0
    card.readingReviewLevel = 0;
  }
  
  // Calculate the next review date based on the new level
  const today = new Date();
  const nextReview = new Date(today);
  
  // Set the next review date based on the new level
  let daysToAdd = 0;
  switch(card.readingReviewLevel) {
    case 0: daysToAdd = 0; break;    // today (review again in the same session)
    case 1: daysToAdd = 1; break;    // in 1 day
    case 2: daysToAdd = 3; break;    // in 3 days
    case 3: daysToAdd = 5; break;    // in 5 days
    case 4: daysToAdd = 10; break;   // in 10 days
    case 5: daysToAdd = 24; break;   // in 24 days
    default: daysToAdd = 1; // fallback to 1 day
  }
  
  nextReview.setDate(today.getDate() + daysToAdd);
  
  // Format the date as YYYY-MM-DD
  card.readingNextReviewDate = nextReview.toISOString().split('T')[0];
  
  // For debugging
  console.log(`Updated card ${card.text} reading level to ${card.readingReviewLevel}, next review on ${card.readingNextReviewDate}`);
  
  // Update the flashcard in storage
  flashcards[cardIndex] = card;
  saveFlashcards(flashcards);
}

/**
 * Updates a flashcard's listening review level based on whether the review was successful
 * @param id The flashcard ID
 * @param successful Whether the review was successful
 */
export function updateListeningReviewLevel(id: string, successful: boolean): void {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);
  
  if (cardIndex === -1) return;
  
  const card = flashcards[cardIndex];
  
  // Update the listening review level
  if (successful) {
    // If successful, move up one level (max level is 5)
    if (card.listeningReviewLevel === 0) {
      card.listeningReviewLevel = 1;
    } else {
      card.listeningReviewLevel = Math.min(card.listeningReviewLevel + 1, 5);
    }
  } else {
    // If unsuccessful, reset to level 0
    card.listeningReviewLevel = 0;
  }
  
  // Calculate the next review date based on the new level
  const today = new Date();
  const nextReview = new Date(today);
  
  // Set the next review date based on the new level
  let daysToAdd = 0;
  switch(card.listeningReviewLevel) {
    case 0: daysToAdd = 0; break;    // today (review again in the same session)
    case 1: daysToAdd = 1; break;    // in 1 day
    case 2: daysToAdd = 3; break;    // in 3 days
    case 3: daysToAdd = 5; break;    // in 5 days
    case 4: daysToAdd = 10; break;   // in 10 days
    case 5: daysToAdd = 24; break;   // in 24 days
    default: daysToAdd = 1; // fallback to 1 day
  }
  
  nextReview.setDate(today.getDate() + daysToAdd);
  
  // Format the date as YYYY-MM-DD
  card.listeningNextReviewDate = nextReview.toISOString().split('T')[0];
  
  // For debugging
  console.log(`Updated card ${card.text} listening level to ${card.listeningReviewLevel}, next review on ${card.listeningNextReviewDate}`);
  
  // Update the flashcard in storage
  flashcards[cardIndex] = card;
  saveFlashcards(flashcards);
}

/**
 * Gets flashcards due for speaking review on the specified date
 * @param dateString The date to check for reviews (YYYY-MM-DD format)
 * @returns Array of flashcards due for speaking review
 */
export function getFlashcardsForSpeakingReview(currentDate: string): Flashcard[] {
  try {
    const flashcards = getFlashcards();
    console.log(`Total flashcards in storage: ${flashcards.length}`);
    
    // Filter cards that are due for speaking review
    const cardsForReview = flashcards.filter(card => {
      // Check if the card has speaking review fields
      if (card.speakingReviewLevel === undefined || card.speakingNextReviewDate === undefined) {
        // If not, initialize them based on reading review (for backward compatibility)
        card.speakingReviewLevel = card.readingReviewLevel || 0;
        card.speakingNextReviewDate = card.readingNextReviewDate || currentDate;
        // Save the updated card
        updateFlashcard(card);
      }
      
      // Always include cards with speaking level 0 (new cards)
      if (card.speakingReviewLevel === 0) {
        return true;
      }
      
      // For other levels, check if the review date is today or earlier
      if (card.speakingReviewLevel > 0 && card.speakingNextReviewDate) {
        return card.speakingNextReviewDate <= currentDate;
      }
      
      return false;
    });
    
    console.log(`Found ${cardsForReview.length} cards due for speaking review on ${currentDate}`);
    
    // Log each card's category for debugging
    cardsForReview.forEach(card => {
      console.log(`Due card: ${card.text}, Category: ${card.categoryId || 'none'}, Speaking Level: ${card.speakingReviewLevel}`);
    });
    
    return cardsForReview;
  } catch (error) {
    console.error('Error getting flashcards for speaking review:', error);
    return [];
  }
}

/**
 * Updates a flashcard's speaking review level based on whether the review was successful
 * @param id The flashcard ID
 * @param successful Whether the review was successful
 */
export function updateSpeakingReviewLevel(id: string, successful: boolean): void {
  const flashcards = getFlashcards();
  const cardIndex = flashcards.findIndex(card => card.id === id);
  
  if (cardIndex === -1) return;
  
  const card = flashcards[cardIndex];
  
  // Initialize speaking review fields if they don't exist
  if (card.speakingReviewLevel === undefined) {
    card.speakingReviewLevel = card.readingReviewLevel || 0;
  }
  
  // Update the speaking review level
  if (successful) {
    // If successful, move up one level (max level is 5)
    if (card.speakingReviewLevel === 0) {
      card.speakingReviewLevel = 1;
    } else {
      card.speakingReviewLevel = Math.min(card.speakingReviewLevel + 1, 5);
    }
  } else {
    // If unsuccessful, reset to level 0
    card.speakingReviewLevel = 0;
  }
  
  // Calculate the next review date based on the new level
  const today = new Date();
  const nextReview = new Date(today);
  
  // Set the next review date based on the new level
  let daysToAdd = 0;
  switch(card.speakingReviewLevel) {
    case 0: daysToAdd = 0; break;    // today (review again in the same session)
    case 1: daysToAdd = 1; break;    // in 1 day
    case 2: daysToAdd = 3; break;    // in 3 days
    case 3: daysToAdd = 5; break;    // in 5 days
    case 4: daysToAdd = 10; break;   // in 10 days
    case 5: daysToAdd = 24; break;   // in 24 days
    default: daysToAdd = 1; // fallback to 1 day
  }
  
  nextReview.setDate(today.getDate() + daysToAdd);
  
  // Format the date as YYYY-MM-DD
  card.speakingNextReviewDate = nextReview.toISOString().split('T')[0];
  
  // For debugging
  console.log(`Updated card ${card.text} speaking level to ${card.speakingReviewLevel}, next review on ${card.speakingNextReviewDate}`);
  
  // Update the flashcard in storage
  flashcards[cardIndex] = card;
  saveFlashcards(flashcards);
}

// Review functions
export function getDueCards(): Flashcard[] {
  const cards = getFlashcards();
  const now = new Date().toISOString();
  
  return cards.filter(card => {
    const isReadingDue = new Date(card.readingNextReviewDate) <= new Date(now);
    const isListeningDue = new Date(card.listeningNextReviewDate) <= new Date(now);
    const isSpeakingDue = new Date(card.speakingNextReviewDate) <= new Date(now);
    
    return isReadingDue || isListeningDue || isSpeakingDue;
  });
}

export function updateReadingReview(card: Flashcard, success: boolean): void {
  const cards = getFlashcards();
  const cardIndex = cards.findIndex(c => c.id === card.id);
  
  if (cardIndex === -1) return;
  
  // Update review level
  if (success) {
    card.readingReviewLevel = Math.min(card.readingReviewLevel + 1, 5);
  } else {
    card.readingReviewLevel = Math.max(card.readingReviewLevel - 1, 0);
  }
  
  // Calculate next review date
  const days = Math.pow(2, card.readingReviewLevel);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + days);
  card.readingNextReviewDate = nextReview.toISOString();
  
  // Update the flashcard in storage
  cards[cardIndex] = card;
  saveFlashcards(cards);
}

export function updateListeningReview(card: Flashcard, success: boolean): void {
  const cards = getFlashcards();
  const cardIndex = cards.findIndex(c => c.id === card.id);
  
  if (cardIndex === -1) return;
  
  // Update review level
  if (success) {
    card.listeningReviewLevel = Math.min(card.listeningReviewLevel + 1, 5);
  } else {
    card.listeningReviewLevel = Math.max(card.listeningReviewLevel - 1, 0);
  }
  
  // Calculate next review date
  const days = Math.pow(2, card.listeningReviewLevel);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + days);
  card.listeningNextReviewDate = nextReview.toISOString();
  
  // Update the flashcard in storage
  cards[cardIndex] = card;
  saveFlashcards(cards);
}

export function updateSpeakingReview(card: Flashcard, success: boolean): void {
  const cards = getFlashcards();
  const cardIndex = cards.findIndex(c => c.id === card.id);
  
  if (cardIndex === -1) return;
  
  // Update review level
  if (success) {
    card.speakingReviewLevel = Math.min(card.speakingReviewLevel + 1, 5);
  } else {
    card.speakingReviewLevel = Math.max(card.speakingReviewLevel - 1, 0);
  }
  
  // Calculate next review date
  const days = Math.pow(2, card.speakingReviewLevel);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + days);
  card.speakingNextReviewDate = nextReview.toISOString();
  
  // Update the flashcard in storage
  cards[cardIndex] = card;
  saveFlashcards(cards);
}

/**
 * Exports all flashcards and categories as a JSON object
 * @returns Object containing all flashcards and categories
 */
export function exportAllData(): { flashcards: Flashcard[], categories: Category[] } {
  const flashcards = getFlashcards();
  const categories = getCategories();
  
  return {
    flashcards,
    categories
  };
}

/**
 * Downloads all flashcards and categories as a JSON file
 * @param filename Optional filename (defaults to 'flashcards_export_YYYY-MM-DD.json')
 */
export function downloadDataAsJSON(filename?: string): void {
  const data = exportAllData();
  const jsonString = JSON.stringify(data, null, 2);
  
  // Create a blob from the JSON string
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Set filename with current date if not provided
  if (!filename) {
    const date = new Date().toISOString().split('T')[0];
    filename = `flashcards_export_${date}.json`;
  }
  
  link.href = url;
  link.download = filename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 