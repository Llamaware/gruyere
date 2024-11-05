const BLOCK_OPEN = '[[';
const END_BLOCK_OPEN = '[[/';
const BLOCK_CLOSE = ']]';
const VAR_OPEN = '{{';
const VAR_CLOSE = '}}';

async function expandTemplate(template, specials, params, name = '') {
  let expandedTemplate = await expandBlocks(template, specials, params, name); // Await if expandBlocks is async
  expandedTemplate = expandVariables(expandedTemplate, specials, params, name); // Assuming expandVariables is sync
  return expandedTemplate;
}

FOR_TAG = 'for'
IF_TAG = 'if'
INCLUDE_TAG = 'include'

function expandVariables(template, specials, params, name) {
  const result = [];  // Change to an array for efficiency
  let rest = template;

  while (rest) {
    const [tag, beforeTag, afterTag] = findTag(rest, VAR_OPEN, VAR_CLOSE);
    if (tag === null) break;

    result.push(rest.substring(0, beforeTag));  // Append before tag
    result.push(String(expandVariable(tag, specials, params, name)));  // Ensure it's a string
    rest = rest.substring(afterTag);  // Update the remaining template
  }

  return result.join('') + rest;  // Join the result array into a string
}

async function expandBlocks(template, specials, params, name) {
    let result = '';
    let rest = template;

    //console.log('Starting expandBlocks with template:', template);

    while (rest) {
        const [tag, beforeTag, afterTag] = findTag(rest, BLOCK_OPEN, BLOCK_CLOSE);
        //console.log(`Found tag: ${tag}, beforeTag: ${beforeTag}, afterTag: ${afterTag}`);
        
        if (tag === null) break;

        const endTag = END_BLOCK_OPEN + tag + BLOCK_CLOSE;
        const beforeEnd = rest.indexOf(endTag, afterTag);
        //console.log(`End tag: ${endTag}, beforeEnd: ${beforeEnd}`);

        if (beforeEnd < 0) break;

        const afterEnd = beforeEnd + endTag.length;

        // Append the text before the tag
        result += rest.substring(0, beforeTag);
        //console.log(`Appending text before tag, result so far:`, result);
        
        // Extract the block content and expand it
        const blockContent = rest.substring(afterTag, beforeEnd);
        //console.log(`Expanding block content:`, blockContent);

        // Await the expanded block result
        const expandedBlock = await expandBlock(tag, blockContent, specials, params, name);
        //console.log(`Expanded block result:`, expandedBlock);
        
        result += expandedBlock;

        // Update the rest of the string
        rest = rest.substring(afterEnd);
        //console.log(`Updated rest of the template for next iteration:`, rest);
    }

    // Append any remaining text after the last tag
    //console.log(`Final result after all expansions:`, result + rest);
    return result + rest;
}

async function expandBlock(tag, template, specials, params, name) {
  //console.log(`Expanding block with tag: ${tag} and template:`, template);
  
  const [tagType, blockVar] = tag.split(':');
  //console.log(`Parsed tag type: ${tagType}, block variable: ${blockVar}`);

  if (tagType === INCLUDE_TAG) {
    const includeResult = await expandInclude(tag, blockVar, template, specials, params, name);
    //console.log(`Include result:`, includeResult);
    return includeResult;
  } else if (tagType === IF_TAG) {
    const blockData = expandVariable(blockVar, specials, params, name);
    //console.log(`IF block data:`, blockData);
    
    if (blockData) {
      const expandedTemplate = await expandTemplate(template, specials, params, name);
      //console.log(`Expanded template for IF block:`, expandedTemplate);
      return expandedTemplate;
    }
    //console.log(`IF block not rendered as blockData is falsy.`);
    return '';
  } else if (tagType === FOR_TAG) {
    const blockData = expandVariable(blockVar, specials, params, name);
    //console.log(`FOR block data:`, blockData);
    const forResult = expandFor(tag, template, specials, blockData);
    //console.log(`Expanded FOR result:`, forResult);
    return forResult;
  } else {
    console.warn(`Error: Invalid block: ${tag}`);
    return '';
  }
}



async function expandInclude(tag, filename, template, specials, params, name) {
  try {
    // Ensure that the filename is a relative path from your server's root
    const response = await fetch(filename);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
    }

    const includedContent = await response.text();
    return await expandTemplate(includedContent, specials, params, name); // Or process it further if needed
  } catch (error) {
    console.warn(`Error including file: ${filename}`, error);
    return template; // Fallback to the original template on error
  }
}

function expandVariable(varName, specials, params, name, defaultValue = '') {
  // Check for comments
  if (varName.startsWith('#')) {
    return ''; // This is a comment
  }

  // Strip out leading ! which negates value
  const inverted = varName.startsWith('!');
  if (inverted) {
    varName = varName.slice(1);
  }

  // Strip out trailing :<escaper>
  let escaperName = null;
  const escaperMatch = varName.match(/:(\w+)$/);
  if (escaperMatch) {
    escaperName = escaperMatch[1];
    varName = varName.slice(0, varName.lastIndexOf(':'));
  }

  // Expand value
  let value = expandValue(varName, specials, params, name, defaultValue);
  if (inverted) {
    value = !value; // Negate the value
  }

  // Apply escaper logic
  if (escaperName === 'text') {
    value = escapeHtml(value); // Escape special characters for text
  } else if (escaperName === 'html') {
    // No sanitization; return raw HTML or escape if necessary
    value = escapeHtml(value); // You may implement a custom sanitizer if needed
  } else if (escaperName === 'pprint') {
    // For debugging, convert to pretty print
    value = '<pre>' + escapeHtml(JSON.stringify(value, null, 2)) + '</pre>';
  }

  return value == null ? '' : value; // Return empty string if value is null or undefined
}

function expandValue(varName, specials, params, name, defaultValue) {
  // Handle special variable names
  if (varName === '_key') {
    return name;
  } else if (varName === '_this') {
    return params;
  }

  let value;
  if (varName.startsWith('_')) {
    value = specials;
  } else {
    value = params;
  }

  for (const field of varName.split('.')) {
    if (field === '*_this') {
      field = params; // Assign params if using *_this
    }
    if (field.startsWith('*')) {
      field = getValue(specials['_params'], field.slice(1)); // Get value of parameter
      if (Array.isArray(field)) {
        field = field[0]; // Reduce repeated URL param to a single value
      }
    }
    value = getValue(value, String(field), defaultValue); // Get value from collection
  }
  return value;
}


function getValue(collection, index, defaultValue = '') {
  // Get a single indexed value out of a collection
  if (typeof collection === 'object' && collection !== null && index in collection) {
    return collection[index]; // Check for key in object
  } else if (Array.isArray(collection) && !isNaN(index) && parseInt(index) < collection.length) {
    return collection[parseInt(index)]; // Check for numeric index in array
  } else {
    return defaultValue; // Return default if no match found
  }
}


async function expandFor(tag, template, specials, blockData) {
  let result = '';

  // Check if blockData is a valid type
  if (Array.isArray(blockData)) {
    // Iterate over array
    for (const item of blockData) {
      result += await expandTemplate(template, specials, item, blockData.indexOf(item).toString());
    }
  } else if (typeof blockData === 'object' && blockData !== null) {
    // Iterate over object
    for (const key in blockData) {
      if (blockData.hasOwnProperty(key)) {
        result += await expandTemplate(template, specials, blockData[key], key);
      }
    }
  } else if (typeof blockData === 'string') {
    // Handle the case where blockData is a string
    // Convert string to array of single character strings for iteration
    for (let i = 0; i < blockData.length; i++) {
      result += await expandTemplate(template, specials, blockData[i], i.toString());
    }
  } else {
    console.warn(`Error: Invalid type for "for" block data: ${typeof blockData}`);
  }

  return result;
}

// Example escapeText function for demonstration
function escapeText(text) {
  const div = document.createElement('div');
  div.innerText = text; // This escapes HTML characters
  return div.innerHTML; // Returns the escaped HTML
}

// Optionally, if you want to escape HTML manually
function escapeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html; // Set HTML directly, allowing the browser to parse it
  return div.innerHTML; // This will give you the encoded version of the input
}

function findTag(template, openMarker, closeMarker) {
    const openPos = template.indexOf(openMarker);
    const closePos = template.indexOf(closeMarker, openPos);
    
    if (openPos < 0 || closePos < 0 || openPos > closePos) {
        return [null, null, null]; // No tag found, return array of nulls
    }

    const tag = template.slice(openPos + openMarker.length, closePos);
    return [tag, openPos, closePos + closeMarker.length]; // Return as an array
}