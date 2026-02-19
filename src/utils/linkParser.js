// Link parsing utility (ESM)

export const extractLinks = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const extractInstagramLink = (text) => {
  if (!text) return null;

  const regex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(regex);

  if (!matches) return null;

  return matches.find(link =>
    link.includes("instagram.com")
  );
};

export const parseInstagramLink = (url) => {
  // TODO: Parse Instagram link structure
  return null;
};
