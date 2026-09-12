import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initials',
  standalone: true,
  pure: true,
})
export class InitialsPipe implements PipeTransform {
  /** Returns uppercase first and last initials, or one initial for a single-word name. */
  transform(name: string | null | undefined): string {
    const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
    if (!parts.length) return '';

    const first = Array.from(parts[0])[0];
    const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
    return `${first}${last}`.toUpperCase();
  }
}
