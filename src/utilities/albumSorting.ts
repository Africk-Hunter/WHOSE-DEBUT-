import { Album } from './types';

export function sortAlbumsNewestFirst(list: Album[]): Album[] {
    return [...list].sort((a, b) => new Date(b.year_released).getTime() - new Date(a.year_released).getTime());
}
