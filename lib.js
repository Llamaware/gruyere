// Swaps the display settings of two elements.
// Before calling, exactly one of the two elements should have style="display:none"
function _showHide(showId, hideId, snippetId) {
  // Retrieve elements by their IDs
  const showButton = document.getElementById(showId);
  const hideSection = document.getElementById(hideId);
  const snippet = document.getElementById(snippetId);

  // Toggle visibility for each element
  if (showButton.style.display === 'none') {
    showButton.style.display = ''; // Show the Show button
    hideSection.style.display = 'none'; // Hide the Hide button and snippet section
    snippet.style.display = 'none';
  } else {
    showButton.style.display = 'none'; // Hide the Show button
    hideSection.style.display = ''; // Show the Hide button and snippet section
    snippet.style.display = ''; // Display the private snippet
  }
}

// Simulates refreshing the home feed
function _refreshHome() {
  loadTemplate('home.gtl');
}

function _refreshSnippets() {
  loadTemplate('snippets.gtl');
}
