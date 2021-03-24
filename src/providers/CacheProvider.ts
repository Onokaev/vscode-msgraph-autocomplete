import { ExtensionContext } from 'vscode';
import { EXTENSION_NAME } from '../constants';

interface CacheObject { [version: string]: { [path: string]: any } }

export class CacheProvider {
  private readonly cacheName = `${EXTENSION_NAME}`;
  private static instance: CacheProvider;
  private cache: CacheObject = {};

  private constructor (private context: ExtensionContext, name: string, defaultData: any) {
    this.cacheName = `${EXTENSION_NAME}_${name}`;
    this.cache = this.context.globalState.get<CacheObject>(this.cacheName, defaultData);
  }

  /**
   * Get the instance of the cache
   * @param context 
   * @param name 
   * @returns 
   */
  public static getInstance(context: ExtensionContext, name: string, defaultData?: any) {
    if (!CacheProvider.instance) {
      CacheProvider.instance = new CacheProvider(context, name, defaultData || {});
    }

    return CacheProvider.instance;
  }

  /**
   * Retrieve the cached API information
   * @param version 
   * @param path 
   * @returns API information
   */
  public async get(version: string, path: string) {
    try {
      if (this.cache[version] && this.cache[version][path]) {
        if (!this.isExpired(this.cache[version][path].expiration)) {
          return this.cache[version][path];
        } else {
          this.put(version, path, null);
        }
      }
    } catch (e) {
      console.log(e.message);
    }
    return null;
  }

  /**
   * Update the data in the cache
   * @param version 
   * @param path 
   * @param apiData
   * @param expiration
   */
  public async put(version: string, path: string, apiData: any, expiration?: Date) {
    if (typeof expiration === "undefined") {
      // Create expiration date - 8 hour
      expiration = new Date();
      expiration.setTime(expiration.getTime() + 8 * 3600000);
    }

    apiData.expiration = expiration;

    if (!this.cache[version]) {
      this.cache[version] = {};
    }

    this.cache[version][path] = apiData;

    await this.context.globalState.update(this.cacheName, this.cache);
  }

  /**
   * Clears the cache
   */
  public async clear() {
    this.cache = {};
    await this.context.globalState.update(this.cacheName, {});
  }

  /**
   * Check if cache value is expired
   * @param expiration 
   * @returns 
   */
  private isExpired(expiration: string) {
    return new Date(expiration) <= new Date();
  }
}