function initializeLocalStorage() {
    // Initialize _db from DEFAULT_DATA
    const db = { ...DEFAULT_DATA }; // Create a copy of DEFAULT_DATA

    // Set a sample cookie for the user named "Llama"
    const sampleCookie = {
        uid: 'llamaware', // User ID set to "llama"
        is_admin: true, // User is an admin
        is_author: true   // User is an author
    };
    localStorage.setItem('_cookie', JSON.stringify(sampleCookie));

    // Set the profile for the user based on the "llama" identifier
    const sampleUserProfile = {
        name: 'Llama',
        pw: 'llamaPassword', // You can set any password you prefer
        is_author: true,
        is_admin: true,
        private_snippet: 'I am Llama, the author!',
        web_site: 'https://llamawa.re',
        color: 'purple',
        snippets: []
    };

    // Add the Llama profile to the database
    db['llamaware'] = sampleUserProfile;

    // Set the updated database in local storage
    localStorage.setItem('_db', JSON.stringify(db));

    // Optionally set the profile separately if needed (not necessary if already in db)
    localStorage.setItem('_profile', JSON.stringify(sampleUserProfile));
}


// Function to get a special value based on the variable name
function getSpecialValue(varName) {
    const specials = {
        _key: null, // This will be set during iteration context
        _this: null, // This will also be set during iteration context
        _db: JSON.parse(localStorage.getItem('_db')),
        _cookie: JSON.parse(localStorage.getItem('_cookie')),
        _profile: JSON.parse(localStorage.getItem('_profile')),
    };

    return specials[varName];
}

async function loadTemplate(templateFile, userProfile = null) {
    try {
        const response = await fetch(templateFile);
        if (!response.ok) {
            throw new Error('Failed to load template');
        }

        const template = await response.text();

        // If userProfile is provided, use it, otherwise get the default profiles
        const specials = {
            _db: getSpecialValue('_db'), // Get the simulated database
            _cookie: getSpecialValue('_cookie'), // Get user cookie data
            _profile: userProfile || getSpecialValue('_profile'), // Use passed userProfile if available
        };

        const params = {};

        // Render and inject template into content div
        const renderedTemplate = await expandTemplate(template, specials, params); // Await the Promise here
        document.getElementById('content').innerHTML = renderedTemplate;
		setupAllSnippetsListener();

    } catch (error) {
        console.error('Error loading GTL template:', error);
        document.getElementById('content').textContent = 'Error loading template.';
    }
}



// Initialize local storage with sample data (run this once, or check if data exists)
if (!localStorage.getItem('_db')) {
    initializeLocalStorage();
}

// Event listener for links that load templates
document.addEventListener('click', async function(event) { // Add async here
    const target = event.target.closest('a'); // Get the closest anchor element
    if (!target) return; // Exit if it's not a link

    const id = target.getAttribute('id'); // Get the id of the clicked link

    try {
        // Check if the id matches various sections
        if (id === 'login') {
            await loadTemplate('login.gtl'); // Load the login template
            setupLoginButtonListener();
        } else if (id === 'newaccount') {
            await loadTemplate('newaccount.gtl'); // Load the signup template
            setupNewAccountButtonListener(); // Setup listener for signup
        } else if (id === 'home') {
            await loadTemplate('home.gtl'); // Load the home template
			setupAllSnippetsListener();
        } else if (id === 'snippets') {
            await loadTemplate('snippets.gtl'); // Load the snippets template
        } else if (id === 'newsnippet') {
            await loadTemplate('newsnippet.gtl'); // Load the new snippet template
            setupSubmitSnippetListener();
        } else if (id === 'upload') {
            await loadTemplate('upload.gtl'); // Load the upload template
            setupUploadButtonListener();
        } else if (id === 'manage') {
            await loadTemplate('manage.gtl'); // Load the manage template
			setupServerActionListeners();
        } else if (id === 'editprofile') {
            await loadTemplate('editprofile.gtl'); // Load the edit profile template
            setupUpdateProfileButtonListener();
        } else if (id === 'logout') {
            localStorage.removeItem('_cookie'); // Clear the stored cookie data
            localStorage.removeItem('_profile');
            await loadTemplate('home.gtl'); // Load the logout template
			setupAllSnippetsListener();
        }
        // If the id doesn't match, it will just act as normal
    } catch (error) {
        console.error('Error loading template:', error); // Handle any errors
    }
});

function setupAllSnippetsListener() {
    const allSnippetLinks = document.querySelectorAll('.all-snippets');
    //console.log('All Snippet Links:', allSnippetLinks); // Debug log
    allSnippetLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const userId = this.getAttribute('data-user-id');
            //console.log('User ID:', userId); // Debug log
            loadUserProfile(userId);
        });
    });
}


async function loadUserProfile(userId) {
    //console.log('Loading user profile for ID:', userId);
    const storedDb = JSON.parse(localStorage.getItem('_db'));
    const userProfile = storedDb[userId];

    if (userProfile) {
        //console.log('User Profile Found:', userProfile); // Debug log
        await loadTemplate('snippets.gtl', userProfile);
    } else {
        console.error('User profile not found for ID:', userId);
    }
}


// Function to setup event listeners for server actions
function setupServerActionListeners() {
    // Reset server button
    const resetButton = document.getElementById('reset');
    if (resetButton) {
        resetButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            resetLocalData(); // Call the function to reset local data
        });
    }

    // Quit server button
    const quitButton = document.getElementById('quitserver');
    if (quitButton) {
        quitButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            quitServer(); // Call the function to quit the server
        });
    }
}


// Function to reset local data
function resetLocalData() {
    localStorage.clear(); // Clear all local storage data
	initializeLocalStorage();
    alert('Server reset to default values...'); // Notify the user
}

// Function to quit server and display message
function quitServer() {
    // Set a flag in local storage indicating the server has been quit
    localStorage.setItem('serverStatus', 'quit');

    // Clear the content of the page
    document.body.innerHTML = 'Server quit.'; // Display server quit message

    // Optionally, you could add a reload or navigation prevention logic here
    // For example, disable any links/buttons or prevent loading any new templates
}

// Function to check server status and prevent loading if server is quit
function checkServerStatus() {
    const serverStatus = localStorage.getItem('serverStatus');
    if (serverStatus === 'quit') {
        return false; // Indicate that loading should not proceed
    }
    return true; // Indicate that loading can proceed
}

// Call this function before any template load or page initialization
function initializePage() {
    if (!checkServerStatus()) {
        return; // Stop execution if the server is quit
    }

    // Normal page initialization code goes here
    loadTemplate('home.gtl');
	//setupAllSnippetsListener();
}


// Setup event listener for the login button
function setupLoginButtonListener() {
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            const loginForm = document.getElementById('login-form');
            const username = loginForm.uid.value; // Get username value
            const password = loginForm.pw.value; // Get password value
            fakeLogin(username, password); // Call the fake login function
        });
    }
}


function setupUploadButtonListener() {
    const uploadButton = document.getElementById('upload-button');
    if (uploadButton) {
        uploadButton.addEventListener('click', function() {
            loadTemplate('upload2.gtl');
        });
    }
}

// Setup event listener for the "Create account" button
function setupNewAccountButtonListener() {
    const newAccountButton = document.getElementById('new-account');
    if (newAccountButton) {
        newAccountButton.addEventListener('click', function() {
            const uidInput = document.getElementById('uid');
            const pwInput = document.getElementById('pw');
            const username = uidInput.value.trim();  // Get username value
            const password = pwInput.value.trim();   // Get password value
            
            if (!username || !password) {
                alert("Please enter both a username and a password.");
                return;
            }

            // Create a new session cookie in localStorage
            const newSession = {
                uid: username,
                is_admin: false,  // New accounts are not admins by default
                is_author: true   // Set this as needed, assumed true here
            };
            localStorage.setItem('_cookie', JSON.stringify(newSession));

            // Optionally add the new user to the _db in localStorage
            _db[username] = {
                name: username,
                pw: password,
                is_author: true,
                is_admin: false,
                private_snippet: 'This is a private snippet.',
                web_site: 'https://example.com/',
			  color: 'green',
                snippets: []
            };
		  
            localStorage.setItem('_db', JSON.stringify(_db));
		  localStorage.setItem('_profile', JSON.stringify(_db[username]));

            // Load the home.gtl template after account creation
            loadTemplate('home.gtl');
        });
    }
}

// Update profile function
function setupUpdateProfileButtonListener() {
    const updateButton = document.getElementById('update-profile');
    if (updateButton) {
        updateButton.addEventListener('click', function() {
            const form = document.getElementById('profile-form');
            // Retrieve the cookie from local storage and parse it
            const cookie = JSON.parse(localStorage.getItem('_cookie'));
            const currentUser = cookie.uid; // Get the uid from cookie
		    const storedDb = JSON.parse(localStorage.getItem('_db')); // Parse the stored DB
            const profileData = storedDb[currentUser];

            const username = form.name.value;
            const oldPassword = form.oldpw.value;
            const newPassword = form.pw.value;
            const icon = form.icon.value;
            const homepage = form.web_site.value;
            const color = form.color.value;
            const privateSnippet = form.private_snippet.value;

            // Validate old password only if it is provided
            if (oldPassword && oldPassword !== profileData.pw) {
                alert('Incorrect old password. Please try again.');
                return;
            }

            // Update profile in the fake database
            profileData.name = username;
            profileData.icon = icon;
            profileData.web_site = homepage;
            profileData.color = color;
            profileData.private_snippet = privateSnippet;

            // Update password if new password is provided
            if (newPassword) {
                profileData.pw = newPassword;
            }

            // Save updated profile back to local storage (simulating database save)
            localStorage.setItem('_profile', JSON.stringify(profileData));

            storedDb[currentUser] = profileData;
          
            // Set the updated database in local storage
            localStorage.setItem('_db', JSON.stringify(storedDb));

            //alert('Profile updated successfully!');
            loadTemplate('home.gtl'); // Redirect to home page or refresh as needed
        });
    }
}

function setupSubmitSnippetListener() {
    const submitButton = document.getElementById('submit-snippet');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            console.log("Submit button clicked"); // Debug log

            const snippetInput = document.getElementById('snippet-input');
            const newSnippet = snippetInput.value.trim(); // Get and trim the snippet

            console.log("New Snippet:", newSnippet); // Debug log

            if (newSnippet) {
                const cookie = JSON.parse(localStorage.getItem('_cookie'));
                const currentUser = cookie.uid; // Get the uid from cookie
                const storedDb = JSON.parse(localStorage.getItem('_db')); // Parse the stored DB
                const profileData = storedDb[currentUser]; // Get profile data for the current user

                if (profileData) {
                    profileData.snippets.unshift(newSnippet); // Add the new snippet
                    localStorage.setItem('_db', JSON.stringify(storedDb)); // Save updated db back to local storage
					localStorage.setItem('_profile', JSON.stringify(profileData));
                    snippetInput.value = ''; // Clear the input after submission
                    console.log("Snippet added successfully!"); // Debug log
                    loadTemplate('home.gtl'); // Redirect to home page or refresh as needed
                } else {
                    console.error('Profile data not found for user:', currentUser);
                }
            } else {
                alert('Please enter a snippet before submitting.'); // Optional: notify user about empty input
            }
        });
    }
}


// Fake login function to be called when the button is clicked
function fakeLogin(username, password) {
    console.log('Fake login attempt with username:', username, 'and password:', password);
    const storedDb = JSON.parse(localStorage.getItem('_db')); // Parse the stored DB

    // Check if username exists in the database
    const userProfile = storedDb[username];
    if (userProfile && userProfile.pw === password) {
        // Successful login - store user information in local storage to simulate a session cookie
        const userCookie = {
            uid: username,
            is_admin: userProfile.is_admin,
            is_author: userProfile.is_author
        };
        localStorage.setItem('_cookie', JSON.stringify(userCookie)); // Simulate session cookie storage
        localStorage.setItem('_profile', JSON.stringify(userProfile)); // Store user profile for access

        // Load the home template with the logged-in user data
        loadTemplate('home.gtl');
        console.log('Login successful! User:', userCookie);
    } else {
        // Failed login - show an error message
        //alert('Login failed. Please check your username and password.');
        console.log('Login failed for user:', username);
    }
}


// Function to delete a snippet from the user's profile
function deleteSnippet(index) {
    // Retrieve the cookie from local storage and parse it
    const cookie = JSON.parse(localStorage.getItem('_cookie'));
    const currentUser = cookie.uid; // Get the uid from cookie
    const storedDb = JSON.parse(localStorage.getItem('_db')); // Parse the stored DB
    const profileData = storedDb[currentUser]; // Get profile data for the current user

    if (profileData) {
        // Remove the snippet at the specified index
        if (index >= 0 && index < profileData.snippets.length) {
            profileData.snippets.splice(index, 1); // Remove snippet at the index
            localStorage.setItem('_db', JSON.stringify(storedDb)); // Save updated db back to local storage
			localStorage.setItem('_profile', JSON.stringify(profileData));
            console.log("Snippet deleted successfully!"); // Debug log
            
            // Optionally, refresh the snippet list to reflect changes
            loadTemplate('snippets.gtl'); // Reload the snippets page
        } else {
            console.error('Invalid index for snippet deletion:', index);
        }
    } else {
        console.error('Profile data not found for user:', currentUser);
    }
}