export interface SpotRead {
  id: number;
  latitude: number;
  longitude: number;
  owner_id: number;
  created_at: string;
  owner: UserRead;
  reviews: ReviewRead[];
}

export interface UserRead {
  id: number;
  username: string;
}

export interface ReviewRead {
  id: number;
  rating: number;
  comment: string;
}
