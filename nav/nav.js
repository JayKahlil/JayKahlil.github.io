export async function loadNav(currentPath) {
    // Normalize the current path
    if (!currentPath.startsWith('/')) {
        currentPath = '/' + currentPath;
    }
    if (currentPath.length > 1 && currentPath.endsWith('/')) {
        currentPath = currentPath.slice(0, -1);
    }

    const response = await fetch('/nav/nav.html');
    const html = await response.text();
    
    // Create a temporary container and insert HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html;
    
    // Extract and insert nav elements
    const navElement = tempContainer.querySelector('nav');
    const styleElement = tempContainer.querySelector('style');
    document.body.insertAdjacentElement('afterbegin', navElement);
    document.head.appendChild(styleElement);
    
    // Handle navigation highlighting
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        let linkPath;
        if (link.getAttribute('href').startsWith('http')) {
            linkPath = link.href;
        } else {
            linkPath = link.getAttribute('href');
            if (linkPath.length > 1 && linkPath.endsWith('/')) {
                linkPath = linkPath.slice(0, -1);
            }
        }
        
        if (linkPath === currentPath || 
            (currentPath === '/' && (linkPath === '/' || linkPath === '/index.html'))) {
            link.classList.add('active');
        }
    });
    
    // Set up the hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const isExpanded = navLinks.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isExpanded);
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}