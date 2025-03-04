export interface SpaceSpace {
    id?: string;
    name?: string;
}
export interface ObjectObject {
    id?: string;
    name?: string;
    type?: string;
    space_id?: string;
    blocks?: Array<{
        text?: {
            text?: string;
            style?: string;
        };
        file?: {
            name?: string;
            type?: string;
            size?: number;
        };
    }>;
    details?: Array<{
        id: string;
        details: any;
    }>;
}
export declare class AnytypeClient {
    private basePath;
    private axiosInstance;
    private appKey?;
    constructor(basePath?: string, appKey?: string);
    /**
     * Check if client has valid authentication tokens
     */
    isAuthenticated(): boolean;
    /**
     * Get all available spaces
     * @returns Promise with spaces data
     */
    getSpaces(): Promise<any>;
    /**
     * Search for objects in a specific space
     * @param spaceId Space ID to search in
     * @param query Search query (empty string for all objects)
     * @param offset Pagination offset
     * @param limit Number of results per page
     * @returns Promise with search results
     */
    searchObjects(spaceId: string, query?: string, offset?: number, limit?: number): Promise<any>;
    /**
     * Get object content by ID
     * @param spaceId Space ID
     * @param objectId Object ID
     * @returns Promise with object data
     */
    getObjectContent(spaceId: string, objectId: string): Promise<any>;
}
