"use client";

import { useState, useEffect } from "react";
import { addFlashcard, getCategories } from "@/utils/localStorage";
import { v4 as uuidv4 } from "uuid";
import { Category } from "@/types";
import { translateText } from "@/utils/translate";

export default function Home() {
  console.log("[Home] Render start");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState<{
    text: string;
    translation: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  
  // Load categories on mount
  useEffect(() => {
    console.log("[Home] useEffect - loading categories");
    setCategories(getCategories());
  }, []);
  
  // Reset success message after 3 seconds
  useEffect(() => {
    if (success) {
      console.log("[Home] Success state set, will reset in 3s");
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  const handleTranslate = async () => {
    console.log("[Home] handleTranslate called", { text });
    if (!text.trim()) {
      setError("Please enter text to translate");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await translateText(text);
      console.log("[Home] Translation result:", result);
      setTranslation(result);
    } catch (err) {
      console.error("[Home] Translation error:", err);
      setError("Failed to translate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Home] handleSubmit called", { text, translation, selectedCategory });
    // Validate form
    if (!text.trim()) {
      setError("Please enter text to translate");
      return;
    }
    
    try {
      console.log("[Home] Creating flashcard with:", { text, categoryId: selectedCategory });
      // Create new flashcard
      const newFlashcard = {
        id: uuidv4(),
        text,
        translation: translation?.translation || "",
        categoryId: selectedCategory,
        readingReviewLevel: 0,
        readingNextReviewDate: new Date().toISOString().split('T')[0],
        listeningReviewLevel: 0,
        listeningNextReviewDate: new Date().toISOString().split('T')[0],
        speakingReviewLevel: 0,
        speakingNextReviewDate: new Date().toISOString().split('T')[0],
        reviewLevel: 0,
        nextReviewDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      console.log("[Home] New flashcard object:", newFlashcard);
      // Add to storage and check for duplicates
      const success = addFlashcard(newFlashcard);
      console.log("[Home] addFlashcard result:", success);
      if (!success) {
        // Duplicate detected
        setError(`A flashcard with the text "${text}" already exists.`);
        return;
      }
      console.log("[Home] Flashcard created successfully:", newFlashcard);
      // Reset form
      setText("");
      setTranslation(null);
      setSuccess(true);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("[Home] Error creating flashcard:", err);
      setError("Failed to create flashcard. Please try again.");
    }
  };

  console.log("[Home] Render before return", { text, translation, isLoading, error, success, categories, selectedCategory });
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-600">
          Create New Flashcard
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="text" className="block text-base font-semibold text-blue-600 mb-2">
                Enter Indonesian Text
              </label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type Indonesian text here..."
                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 min-h-[100px] bg-white"
              />
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={handleTranslate}
                disabled={isLoading || !text.trim()}
                className={`w-full py-2 px-4 rounded-md text-white font-medium border-2 transition-colors duration-200 ${
                  isLoading || !text.trim()
                    ? 'bg-gray-400 border-gray-400 cursor-not-allowed opacity-80'
                    : 'bg-blue-600 border-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? "Translating..." : "Translate"}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-blue-600 text-sm font-semibold">{error}</p>
            )}

            {translation && (
              <div className="bg-gray-50 rounded-lg shadow-md p-6 mb-4">
                <h2 className="text-xl font-semibold mb-4 text-blue-600">Translation</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-600 mb-1 font-semibold">Indonesian</p>
                    <p className="text-lg font-medium text-gray-900">{translation.text}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 mb-1 font-semibold">English</p>
                    <p className="text-gray-900">{translation.translation}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="category" className="block text-base font-semibold text-blue-600 mb-1">
                Category (optional)
              </label>
              <select
                id="category"
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || undefined)}
                className="shadow-sm focus:ring-blue-600 focus:border-blue-600 block w-full sm:text-base border-gray-300 rounded-md text-gray-900 bg-white"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              >
                Create Flashcard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
