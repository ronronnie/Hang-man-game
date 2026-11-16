import { CATEGORY_IDS } from "./category";
import type { Category, CategoryDefinition, CategoryId } from "./category";

/** Genre names are retained as aliases for existing routes and saved data. */
export const GENRE_IDS = CATEGORY_IDS;
export type GenreId = CategoryId;
export type Genre = Category;
export type GenreDefinition = CategoryDefinition;
