import { Logger } from './logger';
const logger = Logger.getInstance();

export async function fetchContent(url: string): Promise<any> {
  try { 
    const response = await fetch(url);
    if (!response.ok) {
      logger.error(`Failed to fetch resource at ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.log("fetchContent() error:", error);
    logger.error(`Error fetching resource at ${url}: ${error}`);
      throw Error(`Error fetching resource at ${url}: ${error}`);
  }
}