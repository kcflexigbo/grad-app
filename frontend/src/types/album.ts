import type { Media } from './media.ts';
import type { User } from './user';

export interface Album {
    id: number;
    name: string;
    description: string | null;
    owner: User;
    media: Media[];
}