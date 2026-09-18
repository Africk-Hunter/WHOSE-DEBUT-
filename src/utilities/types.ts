export interface Album {
    id: string;
    name: string;
    artist: string;
    image_url: string;
    year_released: string;
    artist_review: string;
    from_a_peer: string;
    genres: string[];
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    rank?: number;
}
