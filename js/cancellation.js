const searchResultsContainer = document.getElementById("searchResults");
        
function displayResult(resultText, isGoing) {
    const resultDiv = document.createElement("div");
    resultDiv.className = isGoing ? "bold-green" : "bold-red";
    resultDiv.textContent = resultText;

    searchResultsContainer.appendChild(resultDiv);
}

const loadingIndicator = document.getElementById("loadingIndicator");

async function searchAndDisplayResults(query) {
    // Show loading indicator
    loadingIndicator.style.display = "block";

    searchResultsContainer.innerHTML = ""; // Clear previous results
    let resultsFound = false; // Flag to track if any results were found

    if (!query.trim()) {
        displayResult("Please enter a postcode to search.");
        return; // Exit the function if the query is blank
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const fetchPromises = [];

    for (const day of days) {
        fetchPromises.push(
            Promise.all([
                database.ref(`going/${day}`).once("value"),
                database.ref(`cancellation/${day}`).once("value")
            ]).then(([goingSnapshot, cancellationSnapshot]) => {
                const goingList = goingSnapshot.val();
                const cancellationList = cancellationSnapshot.val();

                if (goingList && goingList.includes(query)) {
                    displayResult(`Day: In ${day}\nVan/Going List: ${query}`, true);
                    resultsFound = true;
                }

                if (cancellationList) {
                    const lines = cancellationList.split('\n');
                    for (const line of lines) {
                        if (line.includes(query)) {
                            displayResult(`Day: ${day}\nCancellation: ${line}`, false);
                            resultsFound = true;
                        }
                    }
                }
            }).catch(error => {
                console.error("Error fetching data:", error);
            })
        );
    }

    // Wait for all fetch operations to complete
    await Promise.all(fetchPromises);

    // Hide loading indicator
    loadingIndicator.style.display = "none";

    // Display error message if no results were found
    if (!resultsFound) {
        displayResult("Contact Ameer if postcode not found.");
    }
}




// Handle form submission
const searchForm = document.getElementById("searchForm");
searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const searchQuery = document.getElementById("searchQuery").value;
    searchAndDisplayResults(searchQuery);
});

// Helper function to get the next day
function getNextDay(currentDay) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const currentIndex = days.indexOf(currentDay);
    const nextIndex = (currentIndex + 1) % 7;
    return days[nextIndex];
}
