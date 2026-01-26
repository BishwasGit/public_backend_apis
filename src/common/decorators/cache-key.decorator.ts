import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';

export const CustomCacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
