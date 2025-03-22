<<<<<<< Updated upstream
// Plotly.js Bar Chart Example for Skills Section
var skillsData = [{
    x: ['Python', 'SQL', 'Excel', 'Tableau', 'Git', 'Minitab'],
    y: [85, 70, 75, 60, 65, 60],
    type: 'bar',
    marker: {
        color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
        line: { width: 1.5 }
=======
function toggleMenu(){
    const menu = document.querySelector('.menu-links');
    const icon = document.querySelector('.hamburger-icon');

    menu.classList.toggle('open');
    icon.classList.toggle('open');
}

function showContent(sectionId) {
    // Hide all content sections
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active");
    });

    // Remove "active" class from all buttons
    document.querySelectorAll(".btn-color-2").forEach(button => {
        button.classList.remove("active");
    });

    // Show the selected content
    document.getElementById(sectionId).classList.add("active");

    // Add "active" class to clicked button
    // event.currentTarget.classList.add("active");
}

function showContent(sectionId) {
    // Hide all content sections
    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.remove("active");
    });

    // Remove "active" class from all buttons
    document.querySelectorAll(".btn-color-2").forEach(button => {
        button.classList.remove("active");
    });

    // Show the selected content
    document.getElementById(sectionId).classList.add("active");

    // Add "active" class to clicked button
    event.currentTarget.classList.add("active");
}
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".sub-content-section").forEach(section => {
        section.classList.remove("sub-active");
    });

    // Show the selected section
    document.getElementById(sectionId).classList.add("sub-active");
}
function getRadarChartData(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    return { labels, values };
}
function toggleInfo(clickedCard) {
    // Get all cards
    const cards = document.querySelectorAll(".card");

    // Remove 'active' class from all cards except the one clicked
    cards.forEach(card => {
        if (card !== clickedCard) {
            card.classList.remove("active");
        }
    });

    // Toggle 'active' on the clicked card
    clickedCard.classList.toggle("active");
}
function sendEmail() {
    // Get input values
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Validate fields
    if (!name || !email || !message) {
        alert("Please fill out all fields.");
        return;
>>>>>>> Stashed changes
    }
}];

var layout = {
    title: 'Skill Proficiency',
    xaxis: { title: 'Skills' },
    yaxis: { title: 'Proficiency (%)' },
    plot_bgcolor: '#f4f4f4',
    paper_bgcolor: '#ffffff'
};

// Render Plot
Plotly.newPlot('mySkillsPlot', skillsData, layout, { responsive: true });
