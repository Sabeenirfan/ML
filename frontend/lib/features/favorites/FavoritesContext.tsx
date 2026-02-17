import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface RecipeItem {
  id: string;
  title: string;
  image?: string;
  time?: number;
  calories?: number;
  difficulty?: string;
  rating?: number;
}

interface FavoritesContextType {
  favorites: RecipeItem[];
  addFavorite: (item: RecipeItem) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (item: RecipeItem) => void;
  isFavorited: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<RecipeItem[]>([]);

  const addFavorite = (item: RecipeItem) => {
    setFavorites((prev) => {
      if (prev.find((f) => f.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleFavorite = (item: RecipeItem) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === item.id);
      if (exists) return prev.filter((f) => f.id !== item.id);
      return [item, ...prev];
    });
  };

  const isFavorited = (id: string) => favorites.some((f) => f.id === id);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, toggleFavorite, isFavorited }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};

export default FavoritesContext;
