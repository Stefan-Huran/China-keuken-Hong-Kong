document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer');
    if (footer) {
        // Zoek of er al een copyright is, anders voeg toe
        if (!footer.innerHTML.includes('&copy;')) {
            footer.innerHTML += `<br>&copy; ${new Date().getFullYear()} Chinees restaurant Hong Kong`;
        } else {
            footer.innerHTML = footer.innerHTML.replace(
                /&copy;\s*\d{4}/,
                `&copy; ${new Date().getFullYear()}`
            );
        }
}});