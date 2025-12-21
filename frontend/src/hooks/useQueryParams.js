import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to parse URL query parameters
 * @returns {URLSearchParams} Parsed query parameters
 */
export const useQueryParams = () => {
    const { search } = useLocation();

    return useMemo(() => new URLSearchParams(search), [search]);
};

/**
 * Get a specific query parameter value
 * @param {string} key - The parameter key to retrieve
 * @returns {string|null} The parameter value or null if not found
 */
export const useQueryParam = (key) => {
    const queryParams = useQueryParams();
    return queryParams.get(key);
};

export default useQueryParams;
