
// Converts a string to a format suitable for a function name (e.g., "My Event" -> "MyEvent")
export const toValidFunctionName = (str) => (str || '').replace(/\s+/g, '');

// Converts a string to Title Case (e.g., "helloWorld" -> "Hello World")
export const toTitleCase = (str) => {
    if (!str) return '';
    const result = str.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
};

// Converts a string to kebab-case (e.g., "OrderCappuccino" -> "order-cappuccino")
export const toKebabCase = (str) => {
    if (!str) return '';
    return str
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/^-/, ''); // remove leading dash if any
};

// Converts a string to PascalCase (e.g., "my-event" -> "MyEvent")
export const toPascalCase = (str) => {
    if (!str) return '';
    return (str || '')
        .split(/[-_ ]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
};

// Converts a string to camelCase (e.g., "My Event" -> "myEvent")
export const toCamelCase = (str) => {
  if (!str) return '';
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Converts a string to a format suitable for a variable name (e.g., "My Event" -> "myEvent")
export const toValidVariableName = (str) => {
    if (!str) return '';
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

// Extracts the base entity name from an event title (e.g., "CappuccinoOrdered" -> "Cappuccino")
export const extractEntityName = (eventTitle) => {
    if (!eventTitle) return '';
    // This is a simplified regex, might need to be more robust
    return eventTitle.replace(/(Ordered|Created|Updated|Deleted|Added|Removed|Attempted|Prepared|Completed|Failed)$/, '');
};

// Formats a key for use in an object literal, quoting if necessary
export const toObjectPropertyKey = (key) => {
    // A simple regex to check if a string is a valid identifier
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        return key;
    }
    // If not a valid identifier, wrap it in quotes
    return `'${key}'`;
};

// Creates a data accessor string (e.g., "event.data", "user.name" -> "event.data['user.name']")
export const toDataAccessor = (base, field) => {
    // If the field name is a valid identifier, use dot notation
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field)) {
        return `${base}.${field}`;
    }
    // Otherwise, use bracket notation
    return `${base}['${field}']`;
};

// Infers a "todo" list action (ADD/REMOVE) from an event name
export const inferTodoAction = (eventTitle) => {
    if (!eventTitle) return 'ADD'; // Default action
    const lowerTitle = (eventTitle || '').toLowerCase();
    if (lowerTitle.includes('removed') || lowerTitle.includes('deleted') || lowerTitle.includes('cancelled')) {
        return 'REMOVE';
    }
    return 'ADD';
};

// Derives a short prefix from a string, typically for ID generation
export const deriveIdPrefix = (str) => {
    if (!str) return '';
    return str.substring(0, 3).toLowerCase();
};
