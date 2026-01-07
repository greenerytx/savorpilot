import { Injectable, Logger } from '@nestjs/common';

interface InstagramCookies {
  sessionId: string;
  csrfToken: string;
  dsUserId?: string;
  igWwwClaim?: string;
}

interface InstagramPost {
  id: string;
  shortcode: string;
  caption?: string;
  imageUrl?: string;
  videoUrl?: string;
  ownerUsername: string;
  ownerFullName?: string;
  ownerId: string;
  postedAt?: Date;
  isVideo: boolean;
  likeCount?: number;
  commentCount?: number;
}

interface SavedPostsResponse {
  posts: InstagramPost[];
  hasMore: boolean;
  endCursor?: string;
}

export interface CollectionInfo {
  id: string;
  name: string;
  mediaCount?: number;
  coverUrl?: string;
}

@Injectable()
export class InstagramApiService {
  private readonly logger = new Logger(InstagramApiService.name);
  private readonly baseUrl = 'https://www.instagram.com';

  // Rate limit configuration
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_WAIT_MS = 60000; // 60 seconds

  /**
   * Fetch user's saved posts from Instagram using the mobile API
   * Includes automatic retry with backoff for rate limits
   */
  async fetchSavedPosts(
    cookies: InstagramCookies,
    endCursor?: string,
    count: number = 50,
  ): Promise<SavedPostsResponse> {
    return this.fetchWithRetry(cookies, endCursor, count, 0);
  }

  /**
   * Internal fetch with retry logic for rate limits
   */
  private async fetchWithRetry(
    cookies: InstagramCookies,
    endCursor?: string,
    count: number = 50,
    retryCount: number = 0,
  ): Promise<SavedPostsResponse> {
    this.logger.log(`Fetching saved posts${endCursor ? ' (continuing)' : ''}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

    const headers = this.buildHeaders(cookies);

    // Use Instagram's private API endpoint (more stable than GraphQL)
    let url = `https://www.instagram.com/api/v1/feed/saved/posts/`;
    if (endCursor) {
      url += `?max_id=${endCursor}`;
    }

    try {
      const response = await fetch(url, { headers });

      // Check for rate limit (429, 500, 503)
      if (response.status === 429 || response.status === 500 || response.status === 503) {
        if (retryCount < this.MAX_RETRIES) {
          const waitTime = this.RATE_LIMIT_WAIT_MS * (retryCount + 1); // Exponential backoff
          this.logger.warn(`Rate limit hit (${response.status}). Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.MAX_RETRIES}...`);
          await this.delay(waitTime);
          return this.fetchWithRetry(cookies, endCursor, count, retryCount + 1);
        } else {
          this.logger.error(`Max retries (${this.MAX_RETRIES}) reached. Giving up.`);
          throw new Error(`Rate limit exceeded after ${this.MAX_RETRIES} retries`);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Instagram API error: ${response.status} - ${errorText.substring(0, 200)}`);

        // If private API fails, try GraphQL as fallback
        return this.fetchSavedPostsGraphQL(cookies, endCursor, count);
      }

      const data = await response.json();
      this.logger.debug(`API response keys: ${Object.keys(data).join(', ')}`);

      const items = data.items || [];

      if (items.length === 0) {
        // Could be rate limit returning empty - check if we should retry
        if (retryCount < this.MAX_RETRIES && endCursor) {
          // If we have a cursor but got empty results, likely rate limit
          const waitTime = this.RATE_LIMIT_WAIT_MS;
          this.logger.warn(`Empty response with cursor (possible rate limit). Waiting ${waitTime / 1000}s before retry...`);
          await this.delay(waitTime);
          return this.fetchWithRetry(cookies, endCursor, count, retryCount + 1);
        }

        this.logger.warn('No saved items in API response');
        // Try GraphQL as fallback
        return this.fetchSavedPostsGraphQL(cookies, endCursor, count);
      }

      const posts = items.map((item: any) => this.parseApiMediaItem(item));

      return {
        posts,
        hasMore: data.more_available || false,
        endCursor: data.next_max_id,
      };
    } catch (error: any) {
      // Check for network errors that might indicate rate limiting
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('fetch failed')) {
        if (retryCount < this.MAX_RETRIES) {
          const waitTime = this.RATE_LIMIT_WAIT_MS * (retryCount + 1);
          this.logger.warn(`Network error (${error.code || error.message}). Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${this.MAX_RETRIES}...`);
          await this.delay(waitTime);
          return this.fetchWithRetry(cookies, endCursor, count, retryCount + 1);
        }
      }

      this.logger.error('Failed to fetch saved posts from API, trying GraphQL', error);
      return this.fetchSavedPostsGraphQL(cookies, endCursor, count);
    }
  }

  /**
   * Fallback: Fetch saved posts using GraphQL
   */
  private async fetchSavedPostsGraphQL(
    cookies: InstagramCookies,
    endCursor?: string,
    count: number = 50,
  ): Promise<SavedPostsResponse> {
    this.logger.log('Trying GraphQL endpoint as fallback');

    const headers = this.buildHeaders(cookies);

    // Instagram GraphQL query for saved posts
    const variables = {
      first: count,
      after: endCursor || null,
    };

    // Try multiple query hashes (Instagram rotates these)
    const queryHashes = [
      '2ce1d673055b99c67dc10f0f4f5844f8', // Newer hash
      'bcf25849b310cf449cfb47cd58c3c01f', // Older hash
      '8c86fed24fa03a8a2eea2a70a80c7b6b', // Alternative
    ];

    for (const queryHash of queryHashes) {
      const url = `${this.baseUrl}/graphql/query/?query_hash=${queryHash}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

      try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
          this.logger.debug(`GraphQL hash ${queryHash} failed: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const savedMedia = data?.data?.user?.edge_saved_media;

        if (savedMedia && savedMedia.edges && savedMedia.edges.length > 0) {
          this.logger.log(`GraphQL hash ${queryHash} worked, found ${savedMedia.edges.length} posts`);
          const posts = savedMedia.edges.map((edge: any) => this.parseMediaNode(edge.node));

          return {
            posts,
            hasMore: savedMedia.page_info?.has_next_page || false,
            endCursor: savedMedia.page_info?.end_cursor,
          };
        }
      } catch (error) {
        this.logger.debug(`GraphQL hash ${queryHash} error:`, error);
      }
    }

    this.logger.warn('All GraphQL hashes failed, no saved posts found');
    return { posts: [], hasMore: false };
  }

  /**
   * Parse media item from Instagram's private API
   */
  private parseApiMediaItem(item: any): InstagramPost {
    const media = item.media || item;
    const isVideo = media.media_type === 2 || media.video_versions;

    return {
      id: media.pk || media.id,
      shortcode: media.code,
      caption: media.caption?.text || undefined,
      imageUrl: media.image_versions2?.candidates?.[0]?.url || media.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url,
      videoUrl: isVideo ? media.video_versions?.[0]?.url : undefined,
      ownerUsername: media.user?.username || 'unknown',
      ownerFullName: media.user?.full_name,
      ownerId: String(media.user?.pk || media.user?.id || 'unknown'),
      postedAt: media.taken_at ? new Date(media.taken_at * 1000) : undefined,
      isVideo,
      likeCount: media.like_count,
      commentCount: media.comment_count,
    };
  }

  /**
   * Fetch all saved posts with pagination
   */
  async fetchAllSavedPosts(
    cookies: InstagramCookies,
    maxPosts: number = 500,
    onProgress?: (fetched: number) => void,
  ): Promise<InstagramPost[]> {
    const allPosts: InstagramPost[] = [];
    let endCursor: string | undefined;
    let hasMore = true;

    while (hasMore && allPosts.length < maxPosts) {
      const result = await this.fetchSavedPosts(cookies, endCursor);
      allPosts.push(...result.posts);
      hasMore = result.hasMore;
      endCursor = result.endCursor;

      if (onProgress) {
        onProgress(allPosts.length);
      }

      // Rate limiting - wait between requests
      if (hasMore) {
        await this.delay(1000 + Math.random() * 1000);
      }
    }

    this.logger.log(`Fetched ${allPosts.length} saved posts total`);
    return allPosts.slice(0, maxPosts);
  }

  /**
   * Fetch saved collections list - tries REST API first, then GraphQL
   */
  async fetchCollections(cookies: InstagramCookies): Promise<CollectionInfo[]> {
    this.logger.log('Fetching saved collections');

    // Try REST API first - it's more reliable
    const restCollections = await this.fetchCollectionsRest(cookies);
    if (restCollections.length > 0) {
      this.logger.log(`REST API returned ${restCollections.length} collections`);
      return restCollections;
    }

    // Fallback to GraphQL
    this.logger.log('REST API returned no collections, trying GraphQL');
    return this.fetchCollectionsGraphQL(cookies);
  }

  /**
   * Fetch collections via GraphQL API
   */
  private async fetchCollectionsGraphQL(cookies: InstagramCookies): Promise<CollectionInfo[]> {
    const headers = {
      ...this.buildHeaders(cookies),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // GraphQL variables for collections list - don't filter by type to get all collections
    const variables = {
      count: 100,
      get_cover_media_lists: true,
    };

    const body = new URLSearchParams({
      variables: JSON.stringify(variables),
      doc_id: '9528375833937865', // Collections list query
    });

    try {
      const response = await fetch(`${this.baseUrl}/graphql/query`, {
        method: 'POST',
        headers,
        body: body.toString(),
      });

      if (!response.ok) {
        this.logger.warn(`GraphQL collections failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      this.logger.debug(`GraphQL response keys: ${JSON.stringify(Object.keys(data?.data || {}))}`);

      const edges = data?.data?.xdt_api__v1__collections__list_graphql_connection?.edges || [];

      const collections: CollectionInfo[] = edges.map((edge: any) => {
        const node = edge.node;
        const coverUrl = node.cover_media_list?.[0]?.image_versions2?.candidates?.[0]?.url;

        return {
          id: node.collection_id,
          name: node.collection_name,
          mediaCount: node.collection_media_count,
          coverUrl,
        };
      });

      this.logger.log(`GraphQL found ${collections.length} collections`);
      return collections;
    } catch (error) {
      this.logger.warn('Failed to fetch collections via GraphQL', error);
      return [];
    }
  }

  /**
   * Fetch collections via REST API with pagination
   */
  private async fetchCollectionsRest(cookies: InstagramCookies): Promise<CollectionInfo[]> {
    const headers = this.buildHeaders(cookies);
    const allCollections: CollectionInfo[] = [];
    let cursor: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10; // Safety limit

    try {
      while (hasMore && pageCount < maxPages) {
        let url = `${this.baseUrl}/api/v1/collections/list/`;
        if (cursor) {
          url += `?max_id=${cursor}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.warn(`REST collections API failed: ${response.status} - ${errorText.substring(0, 200)}`);
          break;
        }

        const data = await response.json();
        const items = data?.items || [];

        this.logger.log(`REST API page ${pageCount + 1}: ${items.length} items, more_available: ${data.more_available}`);

        for (const item of items) {
          this.logger.debug(`Collection: ${item.collection_name} (${item.collection_id}) - type: ${item.collection_type}`);
          allCollections.push({
            id: item.collection_id,
            name: item.collection_name,
            mediaCount: item.collection_media_count,
            coverUrl: item.cover_media?.image_versions2?.candidates?.[0]?.url,
          });
        }

        hasMore = data.more_available || false;
        cursor = data.next_max_id;
        pageCount++;

        if (hasMore && cursor) {
          await this.delay(500); // Small delay between requests
        }
      }

      this.logger.log(`REST API total: ${allCollections.length} collections fetched`);
      return allCollections;
    } catch (error) {
      this.logger.warn('Failed to fetch collections via REST', error);
      return allCollections; // Return what we got so far
    }
  }

  /**
   * Fetch posts from a specific collection using REST API
   */
  async fetchCollectionPosts(
    cookies: InstagramCookies,
    collectionId: string,
    collectionName: string,
    endCursor?: string,
  ): Promise<SavedPostsResponse & { collectionName: string }> {
    this.logger.log(`Fetching collection: ${collectionName} (${collectionId})`);

    const headers = this.buildHeaders(cookies);

    // Use REST API endpoint for collection posts
    let url = `${this.baseUrl}/api/v1/feed/collection/${collectionId}/posts/`;
    if (endCursor) {
      url += `?max_id=${encodeURIComponent(endCursor)}`;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        this.logger.error(`Instagram API error: ${response.status}`);
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.items || [];

      if (items.length === 0) {
        return { posts: [], hasMore: false, collectionName };
      }

      const posts = items.map((item: any) => ({
        ...this.parseApiMediaItem(item),
        collectionId,
        collectionName,
      }));

      return {
        posts,
        hasMore: data.more_available || false,
        endCursor: data.next_max_id,
        collectionName,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch collection ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * Parse Instagram media node into our format
   */
  private parseMediaNode(node: any): InstagramPost {
    const isVideo = node.__typename === 'GraphVideo' || node.is_video;

    return {
      id: node.id,
      shortcode: node.shortcode,
      caption: node.edge_media_to_caption?.edges?.[0]?.node?.text || undefined,
      imageUrl: node.display_url || node.thumbnail_src,
      videoUrl: isVideo ? node.video_url : undefined,
      ownerUsername: node.owner?.username || 'unknown',
      ownerFullName: node.owner?.full_name,
      ownerId: node.owner?.id || 'unknown',
      postedAt: node.taken_at_timestamp
        ? new Date(node.taken_at_timestamp * 1000)
        : undefined,
      isVideo,
      likeCount: node.edge_media_preview_like?.count,
      commentCount: node.edge_media_to_comment?.count,
    };
  }

  /**
   * Build request headers with Instagram cookies
   */
  private buildHeaders(cookies: InstagramCookies): Record<string, string> {
    const cookieString = [
      `sessionid=${cookies.sessionId}`,
      `csrftoken=${cookies.csrfToken}`,
      cookies.dsUserId ? `ds_user_id=${cookies.dsUserId}` : '',
      cookies.igWwwClaim ? `ig_www_claim=${cookies.igWwwClaim}` : '',
    ].filter(Boolean).join('; ');

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': cookieString,
      'X-CSRFToken': cookies.csrfToken,
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '359341',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://www.instagram.com/',
      'Origin': 'https://www.instagram.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };

    // Add claim header if available
    if (cookies.igWwwClaim) {
      headers['X-IG-WWW-Claim'] = cookies.igWwwClaim;
    }

    return headers;
  }

  /**
   * Fetch fresh post data by shortcode to get updated image URL
   */
  async fetchPostByShortcode(
    cookies: InstagramCookies,
    shortcode: string,
  ): Promise<InstagramPost | null> {
    this.logger.log(`Fetching post by shortcode: ${shortcode}`);

    const headers = this.buildHeaders(cookies);

    try {
      // Try REST API first
      const url = `${this.baseUrl}/api/v1/media/${shortcode}/info/`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        this.logger.warn(`REST API failed for shortcode ${shortcode}: ${response.status}`);
        // Try GraphQL as fallback
        return this.fetchPostByShortcodeGraphQL(cookies, shortcode);
      }

      const data = await response.json();
      const items = data.items || [];

      if (items.length === 0) {
        return this.fetchPostByShortcodeGraphQL(cookies, shortcode);
      }

      return this.parseApiMediaItem(items[0]);
    } catch (error) {
      this.logger.error(`Failed to fetch post by shortcode: ${shortcode}`, error);
      return this.fetchPostByShortcodeGraphQL(cookies, shortcode);
    }
  }

  /**
   * Convert Instagram shortcode to media ID
   */
  private shortcodeToMediaId(shortcode: string): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let mediaId = BigInt(0);
    for (const char of shortcode) {
      mediaId = mediaId * BigInt(64) + BigInt(alphabet.indexOf(char));
    }
    return mediaId.toString();
  }

  /**
   * Fetch post by shortcode using GraphQL
   */
  private async fetchPostByShortcodeGraphQL(
    cookies: InstagramCookies,
    shortcode: string,
  ): Promise<InstagramPost | null> {
    const headers = this.buildHeaders(cookies);

    // First try: Convert shortcode to media_id and use REST API
    try {
      const mediaId = this.shortcodeToMediaId(shortcode);
      this.logger.log(`Converted shortcode ${shortcode} to media_id ${mediaId}`);

      const restUrl = `${this.baseUrl}/api/v1/media/${mediaId}/info/`;
      this.logger.log(`Fetching post via REST API: ${restUrl}`);

      const restResponse = await fetch(restUrl, { headers });

      if (restResponse.ok) {
        const restData = await restResponse.json();
        if (restData.items && restData.items.length > 0) {
          const item = restData.items[0];
          this.logger.log(`REST API success - media_type: ${item.media_type}, has video_versions: ${!!item.video_versions}`);
          return this.parseApiMediaItem(item);
        }
      } else {
        this.logger.warn(`REST API failed for media_id ${mediaId}: ${restResponse.status}`);
      }
    } catch (error) {
      this.logger.warn(`REST API error for shortcode ${shortcode}:`, error);
    }

    // Second try: Use GraphQL query endpoint
    try {
      const graphqlHeaders = {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const variables = {
        shortcode: shortcode,
        child_comment_count: 0,
        fetch_comment_count: 0,
        parent_comment_count: 0,
        has_threaded_comments: false,
      };

      const body = new URLSearchParams({
        variables: JSON.stringify(variables),
        doc_id: '8845758582119845', // PolarisPostActionLoadPostQueryQuery
      });

      this.logger.log(`Fetching post via GraphQL query for shortcode: ${shortcode}`);
      const response = await fetch(`${this.baseUrl}/graphql/query`, {
        method: 'POST',
        headers: graphqlHeaders,
        body: body.toString(),
      });

      if (!response.ok) {
        this.logger.warn(`GraphQL query failed for shortcode ${shortcode}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const media = data?.data?.xdt_shortcode_media;

      if (!media) {
        this.logger.warn(`No media found in GraphQL response for ${shortcode}`);
        return null;
      }

      this.logger.log(`GraphQL success - typename: ${media.__typename}, is_video: ${media.is_video}`);

      // Parse the GraphQL response
      const isVideo = media.__typename === 'XDTGraphVideo' || media.is_video;
      return {
        id: media.id || media.pk,
        shortcode: media.shortcode || shortcode,
        caption: media.edge_media_to_caption?.edges?.[0]?.node?.text || media.caption?.text,
        imageUrl: media.display_url || media.image_versions2?.candidates?.[0]?.url,
        videoUrl: isVideo ? (media.video_url || media.video_versions?.[0]?.url) : undefined,
        ownerUsername: media.owner?.username || 'unknown',
        ownerFullName: media.owner?.full_name,
        ownerId: media.owner?.id || 'unknown',
        postedAt: media.taken_at_timestamp ? new Date(media.taken_at_timestamp * 1000) : undefined,
        isVideo,
        likeCount: media.edge_media_preview_like?.count || media.like_count,
        commentCount: media.edge_media_to_comment?.count || media.comment_count,
      };
    } catch (error) {
      this.logger.error(`GraphQL fetch failed for shortcode: ${shortcode}`, error);
      return null;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
