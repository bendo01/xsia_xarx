// Shapes shared by server functions and UI. No server imports here.

/** The Rust API's list envelope. */
export interface ApiPage<T> {
  page?: number;
  page_size?: number;
  total_pages?: number;
  total?: number;
  data: T[];
}

export interface PaginationQuery {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  [filter: string]: string | number | undefined;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_page: number;
  total_data: number;
}

export interface Paginated<T> {
  pagination: Pagination;
  data: T[];
}
