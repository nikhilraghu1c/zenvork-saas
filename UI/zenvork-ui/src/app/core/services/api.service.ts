import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type ApiQuery = Record<string, string | number | boolean | readonly string[] | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly domain = 'http://localhost:4001';
  private readonly defaultUrl = `${this.domain}/api`;

  constructor(private readonly http: HttpClient) {}

  get<TResponse>(path: string): Observable<TResponse> {
    return this.http.get<TResponse>(this.url(path));
  }

  query<TResponse>(path: string, query: ApiQuery): Observable<TResponse> {
    return this.http.get<TResponse>(this.url(path), { params: this.params(query) });
  }

  post<TResponse, TBody>(path: string, body: TBody): Observable<TResponse> {
    return this.http.post<TResponse>(this.url(path), body);
  }

  put<TResponse, TBody>(path: string, body: TBody): Observable<TResponse> {
    return this.http.put<TResponse>(this.url(path), body);
  }

  delete<TResponse>(path: string): Observable<TResponse> {
    return this.http.delete<TResponse>(this.url(path));
  }

  private url(path: string): string {
    return `${this.defaultUrl}/${path.replace(/^\/+/, '')}`;
  }

  private params(query: ApiQuery): HttpParams {
    return Object.entries(query).reduce((params, [key, value]) => {
      if (value === null || value === undefined) return params;
      return params.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }, new HttpParams());
  }
}
