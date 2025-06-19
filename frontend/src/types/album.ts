import type { Image } from './image';
import type { User } from './user';

export interface Album {
    id: number;
    name: string;
    description: string | null;
    owner: User;
    images: Image[];
}