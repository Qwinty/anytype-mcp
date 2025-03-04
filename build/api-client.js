import axios from 'axios';
export class AnytypeClient {
    constructor(basePath = 'http://localhost:31009/v1', appKey) {
        this.basePath = basePath;
        this.appKey = appKey;
        this.axiosInstance = axios.create({
            baseURL: this.basePath,
            headers: {
                'Content-Type': 'application/json',
                ...(this.appKey && { 'Authorization': `Bearer ${this.appKey}` })
            }
        });
        // Set up error handling for better debugging
        this.axiosInstance.interceptors.response.use(response => response, error => {
            console.error('API Error:', error.response?.data?.error?.message || error.message);
            return Promise.reject(error);
        });
    }
    /**
     * Check if client has valid authentication tokens
     */
    isAuthenticated() {
        return !!this.appKey;
    }
    /**
     * Get all available spaces
     * @returns Promise with spaces data
     */
    async getSpaces() {
        try {
            const response = await this.axiosInstance.get('/spaces');
            return response.data;
        }
        catch (error) {
            console.error('Error getting spaces:', error);
            throw error;
        }
    }
    /**
     * Search for objects in a specific space
     * @param spaceId Space ID to search in
     * @param query Search query (empty string for all objects)
     * @param offset Pagination offset
     * @param limit Number of results per page
     * @returns Promise with search results
     */
    async searchObjects(spaceId, query = '', offset = 0, limit = 50) {
        try {
            const response = await this.axiosInstance.post(`/spaces/${spaceId}/search`, {
                query,
            }, {
                params: {
                    offset,
                    limit
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error searching objects:', error);
            throw error;
        }
    }
    /**
     * Get object content by ID
     * @param spaceId Space ID
     * @param objectId Object ID
     * @returns Promise with object data
     */
    async getObjectContent(spaceId, objectId) {
        try {
            const response = await this.axiosInstance.get(`/spaces/${spaceId}/objects/${objectId}`);
            return response.data;
        }
        catch (error) {
            console.error('Error getting object content:', error);
            throw error;
        }
    }
}
