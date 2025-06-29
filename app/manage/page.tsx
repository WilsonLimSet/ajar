"use client";

import { useState, useEffect } from "react";
import {
  getFlashcards,
  deleteFlashcard,
  updateFlashcard,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  downloadDataAsJSON,
} from "@/utils/localStorage";
import { Flashcard, Category } from "@/types";

// Helper: get how many cards are due for review today
function getCardsForReview(flashcards: Flashcard[]): number {
  const today = new Date().toISOString().split('T')[0];
  return flashcards.filter(card => {
    // Reading review due
    return (card.readingNextReviewDate || card.nextReviewDate) <= today;
  }).length;
}

// Helper: get level label
function getLevelLabel(level: number | undefined): string {
  if (level === undefined) return "New";
  switch(level) {
    case 0: return "New";
    case 1: return "Level 1";
    case 2: return "Level 2";
    case 3: return "Level 3";
    case 4: return "Level 4";
    case 5: return "Level 5";
    default: return `Level ${level}`;
  }
}
// Helper: get level days
function getLevelDays(level: number | undefined): string {
  if (level === undefined) return "Today";
  switch(level) {
    case 0: return "Today";
    case 1: return "1 day";
    case 2: return "3 days";
    case 3: return "5 days";
    case 4: return "10 days";
    case 5: return "24 days";
    default: return `${level} days`;
  }
}

export default function ManagePage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Flashcard>({
    id: "",
    text: "",
    translation: "",
    readingReviewLevel: 0,
    readingNextReviewDate: "",
    listeningReviewLevel: 0,
    listeningNextReviewDate: "",
    speakingReviewLevel: 0,
    speakingNextReviewDate: "",
    reviewLevel: 0,
    nextReviewDate: "",
    createdAt: "",
    categoryId: undefined,
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, 'id'>>({ name: "", color: "#2563eb" });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const cardsPerPage = 7;
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editCategoryValues, setEditCategoryValues] = useState<Omit<Category, 'id'>>({ name: '', color: '#2563eb' });
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Calculate cards for review
  const cardsForReview = getCardsForReview(flashcards);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedFlashcards = getFlashcards();
    // Sort flashcards by createdAt in descending order (newest first)
    const sortedFlashcards = [...loadedFlashcards].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const loadedCategories = getCategories();
    setFlashcards(sortedFlashcards);
    setCategories(loadedCategories);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      // User has confirmed deletion
      deleteFlashcard(id);
      // Update state directly instead of reloading
      setFlashcards(flashcards.filter(card => card.id !== id));
      setConfirmDelete(null);
    } else {
      // First click - show confirm button
      setConfirmDelete(id);
    }
  };

  const handleEdit = (card: Flashcard) => {
    setEditValues({
      id: card.id,
      text: card.text || "",
      translation: card.translation || "",
      readingReviewLevel: card.readingReviewLevel ?? card.reviewLevel ?? 0,
      readingNextReviewDate: card.readingNextReviewDate || card.nextReviewDate || "",
      listeningReviewLevel: card.listeningReviewLevel ?? card.reviewLevel ?? 0,
      listeningNextReviewDate: card.listeningNextReviewDate || card.nextReviewDate || "",
      speakingReviewLevel: card.speakingReviewLevel ?? card.reviewLevel ?? 0,
      speakingNextReviewDate: card.speakingNextReviewDate || card.nextReviewDate || "",
      reviewLevel: card.reviewLevel ?? 0,
      nextReviewDate: card.nextReviewDate || "",
      createdAt: card.createdAt || "",
      categoryId: card.categoryId,
    });
    setIsEditing(card.id);
  };

  const handleSaveEdit = () => {
    console.log('[ManagePage] handleSaveEdit called', editValues);
    // Find the original card
    const original = flashcards.find(c => c.id === editValues.id);
    if (!original) {
      console.error('[ManagePage] handleSaveEdit: original card not found', editValues.id);
      return;
    }

    // Calculate next review dates based on levels
    const today = new Date();
    let readingDaysToAdd = 0;
    let listeningDaysToAdd = 0;
    let speakingDaysToAdd = 0;
    
    // Reading days calculation
    switch(editValues.readingReviewLevel) {
      case 0: readingDaysToAdd = 0; break;
      case 1: readingDaysToAdd = 1; break;
      case 2: readingDaysToAdd = 3; break;
      case 3: readingDaysToAdd = 5; break;
      case 4: readingDaysToAdd = 10; break;
      case 5: readingDaysToAdd = 24; break;
      default: readingDaysToAdd = 0;
    }
    
    // Listening days calculation
    switch(editValues.listeningReviewLevel) {
      case 0: listeningDaysToAdd = 0; break;
      case 1: listeningDaysToAdd = 1; break;
      case 2: listeningDaysToAdd = 3; break;
      case 3: listeningDaysToAdd = 5; break;
      case 4: listeningDaysToAdd = 10; break;
      case 5: listeningDaysToAdd = 24; break;
      default: listeningDaysToAdd = 0;
    }
    
    // Speaking days calculation
    switch(editValues.speakingReviewLevel) {
      case 0: speakingDaysToAdd = 0; break;
      case 1: speakingDaysToAdd = 1; break;
      case 2: speakingDaysToAdd = 3; break;
      case 3: speakingDaysToAdd = 5; break;
      case 4: speakingDaysToAdd = 10; break;
      case 5: speakingDaysToAdd = 24; break;
      default: speakingDaysToAdd = 0;
    }
    
    const readingNextReview = new Date(today);
    const listeningNextReview = new Date(today);
    const speakingNextReview = new Date(today);
    
    readingNextReview.setDate(today.getDate() + readingDaysToAdd);
    listeningNextReview.setDate(today.getDate() + listeningDaysToAdd);
    speakingNextReview.setDate(today.getDate() + speakingDaysToAdd);

    // Merge original with edited values and add next review dates
    const updatedCard = {
      ...original,
      text: editValues.text,
      translation: editValues.translation,
      categoryId: editValues.categoryId,
      // Legacy fields (for backward compatibility)
      reviewLevel: editValues.readingReviewLevel,
      nextReviewDate: readingNextReview.toISOString().split('T')[0],
      // Reading fields
      readingReviewLevel: editValues.readingReviewLevel,
      readingNextReviewDate: readingNextReview.toISOString().split('T')[0],
      // Listening fields
      listeningReviewLevel: editValues.listeningReviewLevel,
      listeningNextReviewDate: listeningNextReview.toISOString().split('T')[0],
      // Speaking fields
      speakingReviewLevel: editValues.speakingReviewLevel,
      speakingNextReviewDate: speakingNextReview.toISOString().split('T')[0],
    };
    console.log('[ManagePage] handleSaveEdit: updating card', updatedCard);
    // Update in localStorage
    updateFlashcard(updatedCard);
    
    // Update the state directly
    setFlashcards(flashcards.map(c => 
      c.id === updatedCard.id ? updatedCard : c
    ));
    
    // Exit edit mode
    setIsEditing(null);
    console.log('[ManagePage] handleSaveEdit: done');
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategory({
        id: Date.now().toString(),
        name: newCategory.name,
        color: newCategory.color,
      });
      setNewCategory({ name: "", color: "#2563eb" });
      setIsAddingCategory(false);
      loadData();
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category? All flashcards in this category will become uncategorized.")) {
      deleteCategory(id);
      loadData();
    }
  };

  const filteredFlashcards = flashcards.filter((card) => {
    const matchesSearch =
      (card.text?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (card.translation?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory === null) {
      // All Cards
      matchesCategory = true;
    } else if (selectedCategory === 'uncategorized') {
      matchesCategory = !card.categoryId;
    } else if (selectedCategory) {
      matchesCategory = card.categoryId === selectedCategory;
    }
    return matchesSearch && matchesCategory;
  });

  // Calculate paginated flashcards
  const paginatedFlashcards = filteredFlashcards.slice((page - 1) * cardsPerPage, page * cardsPerPage);
  const totalPages = Math.ceil(filteredFlashcards.length / cardsPerPage);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate the range of pages to show around current page
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);
    
    // Adjust start and end to always show 3 pages when possible
    if (end - start < 2) {
      if (start === 2) {
        end = Math.min(totalPages - 1, start + 2);
      } else if (end === totalPages - 1) {
        start = Math.max(2, end - 2);
      }
    }
    
    // Add ellipsis if needed before current page range
    if (start > 2) {
      pageNumbers.push('...');
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis if needed before last page
    if (end < totalPages - 1) {
      pageNumbers.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  console.log('[ManagePage] render, editValues:', editValues);

  return (
    <div className="container mx-auto px-4 py-6 max-w-md bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-6 text-black">Manage Flashcards</h1>
      <div className="bg-white rounded-lg shadow-md p-3 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-center p-2 bg-blue-50 rounded-lg flex-1 mr-2">
            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">To Review</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{cardsForReview}</p>
          </div>
          <div className="text-center p-2 bg-blue-100 rounded-lg flex-1 ml-2">
            <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Cards</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{flashcards.length}</p>
          </div>
        </div>
      </div>

      {/* Manage Categories Button and Export Button */}
      <div className="flex justify-between items-center mb-2">
        <button
          className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 text-sm font-medium"
          onClick={() => downloadDataAsJSON()}
        >
          Export Data
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 text-black hover:bg-gray-300 text-sm font-medium"
          onClick={() => setShowManageCategories(true)}
        >
          Manage Categories
        </button>
      </div>

      {/* Categories Filter - now above search bar, horizontal scroll, pill style */}
      <div className="flex flex-wrap gap-2 mb-4 pb-2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${selectedCategory === null ? 'bg-red-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
          onClick={() => { setSelectedCategory(null); setPage(1); }}
        >
          All Cards
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${selectedCategory === 'uncategorized' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
          onClick={() => { setSelectedCategory('uncategorized'); setPage(1); }}
        >
          Uncategorized Cards
        </div>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap ${selectedCategory === category.id ? 'text-white' : 'text-black'}`}
            style={{
              backgroundColor: selectedCategory === category.id ? category.color : '#f3f4f6',
              color: selectedCategory === category.id ? 'white' : category.color,
              border: `1px solid ${category.color}`,
            }}
            onClick={() => { setSelectedCategory(category.id); setPage(1); }}
          >
            {category.name}
          </div>
        ))}
        <div
          className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer bg-gray-200 text-black hover:bg-gray-300 whitespace-nowrap"
          onClick={() => setIsAddingCategory(true)}
        >
          + Add Category
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search flashcards..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          className="w-full p-2 border rounded mb-4"
        />
      </div>

      {/* Manage Categories Modal */}
      {showManageCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Manage Categories</h2>
              <button
                className="text-blue-600 font-medium text-sm"
                onClick={() => setShowAddCategory(true)}
              >
                Add New
              </button>
            </div>
            <div className="divide-y">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center py-3">
                  <span className="w-5 h-5 rounded-full mr-3" style={{ backgroundColor: cat.color, display: 'inline-block' }}></span>
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <button
                    className="mr-2 text-blue-600 hover:underline text-sm"
                    onClick={() => {
                      setEditCategory(cat);
                      setEditCategoryValues({ name: cat.name, color: cat.color });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                onClick={() => setShowManageCategories(false)}
              >
                Close
              </button>
            </div>
          </div>
          {/* Edit Category Modal */}
          {editCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80">
                <h3 className="text-lg font-bold mb-4">Edit Category</h3>
                <input
                  type="text"
                  value={editCategoryValues.name}
                  onChange={e => setEditCategoryValues(v => ({ ...v, name: e.target.value }))}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Category Name"
                />
                <input
                  type="color"
                  value={editCategoryValues.color}
                  onChange={e => setEditCategoryValues(v => ({ ...v, color: e.target.value }))}
                  className="w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setEditCategory(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      updateCategory({ ...editCategory, ...editCategoryValues });
                      setCategories(categories.map(c => c.id === editCategory.id ? { ...c, ...editCategoryValues } : c));
                      setEditCategory(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80">
                <h3 className="text-lg font-bold mb-4">Add Category</h3>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={e => setNewCategory(v => ({ ...v, name: e.target.value }))}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Category Name"
                />
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={e => setNewCategory(v => ({ ...v, color: e.target.value }))}
                  className="w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setShowAddCategory(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      if (newCategory.name.trim()) {
                        addCategory({
                          id: Date.now().toString(),
                          name: newCategory.name,
                          color: newCategory.color,
                        });
                        setCategories([...categories, { id: Date.now().toString(), name: newCategory.name, color: newCategory.color }]);
                        setNewCategory({ name: '', color: '#2563eb' });
                        setShowAddCategory(false);
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-4"
            />
            <input
              type="color"
              value={newCategory.color}
              onChange={(e) =>
                setNewCategory({ ...newCategory, color: e.target.value })
              }
              className="w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddingCategory(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flashcards List - paginated */}
      <div className="space-y-4">
        {paginatedFlashcards.map((card) => (
          <div key={card.id} className={`border-2 ${isEditing === card.id ? 'border-blue-600' : 'border-gray-200'} rounded-md p-4 shadow-md bg-white`}>
            {isEditing === card.id && (
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-sm mb-2 inline-block">
                Editing
              </div>
            )}
            {/* Category badge */}
            {card.categoryId && isEditing !== card.id && (
              <div 
                className="inline-block px-2 py-1 rounded-sm mb-2 text-xs font-medium"
                style={{ 
                  backgroundColor: `${categories.find(c => c.id === card.categoryId)?.color}40`,
                  color: categories.find(c => c.id === card.categoryId)?.color
                }}
              >
                {categories.find(c => c.id === card.categoryId)?.name || 'Unknown Category'}
              </div>
            )}
            {isEditing === card.id ? (
              // Edit mode
              <div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-black mb-1">Indonesian</label>
                  <input
                    type="text"
                    value={editValues.text}
                    onChange={(e) => setEditValues((ev: Flashcard) => ({ ...ev, text: e.target.value }))}
                    className="w-full p-2 border rounded-md text-black text-base"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-black mb-1">English</label>
                  <input
                    type="text"
                    value={editValues.translation}
                    onChange={(e) => setEditValues((ev: Flashcard) => ({ ...ev, translation: e.target.value }))}
                    className="w-full p-2 border rounded-md text-black text-base"
                  />
                </div>
                {/* Category selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-black mb-1">Category</label>
                  <select
                    value={editValues.categoryId || ""}
                    onChange={(e) => setEditValues((ev: Flashcard) => ({
                      ...ev,
                      categoryId: e.target.value === "" ? undefined : e.target.value
                    }))}
                    className="w-full p-2 border rounded-md text-black text-base"
                  >
                    <option value="">No Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Reading Review Level</label>
                  <div className="grid grid-cols-6 gap-1">
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditValues((ev: Flashcard) => ({ ...ev, readingReviewLevel: level }))}
                        className={`px-2 py-1 rounded-md text-sm ${
                          editValues.readingReviewLevel === level 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {getLevelLabel(editValues.readingReviewLevel)} - Reading review {getLevelDays(editValues.readingReviewLevel)}
                  </p>
                </div>
                {/* Listening Review Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Listening Review Level</label>
                  <div className="grid grid-cols-6 gap-1">
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditValues((ev: Flashcard) => ({ ...ev, listeningReviewLevel: level }))}
                        className={`px-2 py-1 rounded-md text-sm ${
                          editValues.listeningReviewLevel === level 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {getLevelLabel(editValues.listeningReviewLevel)} - Listening review {getLevelDays(editValues.listeningReviewLevel)}
                  </p>
                </div>
                {/* Speaking Review Level */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black mb-2">Speaking Review Level</label>
                  <div className="grid grid-cols-6 gap-1">
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditValues((ev: Flashcard) => ({ ...ev, speakingReviewLevel: level }))}
                        className={`px-2 py-1 rounded-md text-sm ${
                          editValues.speakingReviewLevel === level 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {getLevelLabel(editValues.speakingReviewLevel)} - Speaking review {getLevelDays(editValues.speakingReviewLevel)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSaveEdit()}
                    className="flex-1 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(null)}
                    className="flex-1 bg-gray-200 text-black py-1 px-3 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div className="mb-3">
                  <h3 className="text-xl font-bold text-black">{card.text}</h3>
                  <p className="text-black">{card.translation}</p>
                </div>
                <div className="text-sm text-black mb-3">
                  {/* Reading review level */}
                  <div className="flex flex-wrap items-center mb-1">
                    <span className="inline-flex items-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Reading Level {card.readingReviewLevel !== undefined ? card.readingReviewLevel : card.reviewLevel}: 
                      {getLevelLabel(card.readingReviewLevel !== undefined ? card.readingReviewLevel : card.reviewLevel)}
                    </span>
                    <span className="text-gray-600">
                      (Next: {card.readingNextReviewDate || card.nextReviewDate})
                    </span>
                  </div>
                  {/* Listening review level */}
                  <div className="flex flex-wrap items-center mb-1">
                    <span className="inline-flex items-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Listening Level {card.listeningReviewLevel !== undefined ? card.listeningReviewLevel : card.reviewLevel}: 
                      {getLevelLabel(card.listeningReviewLevel !== undefined ? card.listeningReviewLevel : card.reviewLevel)}
                    </span>
                    <span className="text-gray-600">
                      (Next: {card.listeningNextReviewDate || card.nextReviewDate})
                    </span>
                  </div>
                  {/* Speaking review level */}
                  <div className="flex flex-wrap items-center mb-1">
                    <span className="inline-flex items-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Speaking Level {card.speakingReviewLevel !== undefined ? card.speakingReviewLevel : card.reviewLevel}: 
                      {getLevelLabel(card.speakingReviewLevel !== undefined ? card.speakingReviewLevel : card.reviewLevel)}
                    </span>
                    <span className="text-gray-600">
                      (Next: {card.speakingNextReviewDate || card.nextReviewDate})
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(card)}
                    className="flex-1 bg-yellow-400 text-black py-1 px-3 rounded-md hover:bg-yellow-500 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(card.id)}
                    className={`flex-1 ${
                      confirmDelete === card.id 
                        ? "bg-red-600 text-white" 
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } py-1 px-3 rounded-md text-sm`}
                  >
                    {confirmDelete === card.id ? "Confirm" : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <div className="flex gap-1">
            {getPageNumbers().map((pageNum, index) => (
              pageNum === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => setPage(Number(pageNum))}
                  className={`px-3 py-1 rounded ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              )
            ))}
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Last
          </button>
        </div>
      )}

      
    </div>
  );
} 