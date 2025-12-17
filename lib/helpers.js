// Shared helper utilities

export const splitIntoTokens = (value = '') => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .split(/[^a-zA-Z0-9]+/)
  .filter(Boolean);

export const toPascalCase = (value = '') => {
  const tokens = splitIntoTokens(value);
  if (tokens.length === 0) return '';
  return tokens
    .map(token => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join('');
};

export const toCamelCase = (value = '') => {
  const pascal = toPascalCase(value);
  if (!pascal) return '';
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const toValidFunctionName = (value = '') => {
  const fallback = 'Generated';
  const pascal = toPascalCase(value);
  return pascal || fallback;
};

export const toValidVariableName = (value = '') => {
  const fallback = 'item';
  const camel = toCamelCase(value);
  return camel || fallback;
};

export const extractEntityName = (eventTitle = '') => eventTitle.trim();

export const isSafeIdentifier = (value = '') => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value);

export const toObjectPropertyKey = (value = '') => isSafeIdentifier(value) ? value : `'${value}'`;

export const toDataAccessor = (base, property = '') => isSafeIdentifier(property)
  ? `${base}.${property}`
  : `${base}['${property}']`;

export const deriveIdPrefix = (fieldName = '') => {
  const withoutId = fieldName.replace(/Id$/i, '');
  const tokens = splitIntoTokens(withoutId);
  const base = tokens.length > 0 ? tokens.join('') : 'id';
  return base.toLowerCase();
};

export const inferTodoAction = (eventTitle = '') => {
  const normalized = eventTitle.toLowerCase();
  const removalKeywords = ['removed', 'cancelled', 'canceled', 'rejected', 'completed', 'finished', 'fulfilled', 'served', 'delivered'];
  return removalKeywords.some(keyword => normalized.includes(keyword)) ? 'REMOVE' : 'ADD';
};
