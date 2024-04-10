import { Request, Response, NextFunction } from 'express';

// Create a Map to store cached data
const cache = new Map<any, any>();

export const cacheMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = req.originalUrl;

    // Check if data exists in cache
    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      try {
        // Try to parse the cached data as JSON
        const jsonData = JSON.parse(cachedData);
        return res.json(jsonData); // Return the parsed JSON data
      } catch (error) {
        // If parsing fails, return the cached data as is
        return res.send(cachedData);
      }
    }

    // If data not found in cache, proceed with the route handler
    const originalSend = res.send.bind(res);

    res.send = function (body: any) {
      if (res.statusCode === 200) {
        // Cache the response data as JSON string
        const jsonData = JSON.stringify(body);
        cache.set(cacheKey, jsonData);
      }
      return originalSend(body); // Ensure that res.send returns the response object
    };

    next();
  };
};
