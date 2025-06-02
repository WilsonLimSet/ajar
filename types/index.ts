export interface Flashcard {
  id: string;
  text: string;
  translation: string;
  categoryId?: string;
  readingReviewLevel: number;
  readingNextReviewDate: string;
  listeningReviewLevel: number;
  listeningNextReviewDate: string;
  speakingReviewLevel: number;
  speakingNextReviewDate: string;
  reviewLevel: number;
  nextReviewDate: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
} 