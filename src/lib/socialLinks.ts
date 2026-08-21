export interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
}

function storageKey(userId: string) {
  return `workzen-social-media-links-${userId}`;
}

export function getSocialMediaLinks(userId: string): SocialMediaLink[] {
  try {
    const storedLinks = localStorage.getItem(storageKey(userId));

    if (!storedLinks) return [];

    const links = JSON.parse(storedLinks) as SocialMediaLink[];

    if (!Array.isArray(links)) return [];

    return links.filter(
      (link) =>
        typeof link?.id === 'string' &&
        typeof link?.platform === 'string' &&
        typeof link?.url === 'string'
    );
  } catch {
    return [];
  }
}

export function saveSocialMediaLinks(
  userId: string,
  links: SocialMediaLink[]
) {
  localStorage.setItem(storageKey(userId), JSON.stringify(links));
}