// Bad example
const userInput = "alert('Hello')";
eval(userInput);

// Safe example
const output = document.getElementById("output");
output.textContent = userInput;
