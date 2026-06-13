// API Documentation JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Documentation Navigation
  const navItems = document.querySelectorAll('.docs-nav-item');
  const sections = document.querySelectorAll('.docs-section');

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const section = this.getAttribute('data-section');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      sections.forEach(sec => sec.classList.remove('active'));
      const targetSection = document.getElementById(section);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // Check hash on page load
  const hash = window.location.hash.substring(1);
  if (hash) {
    const targetNav = document.querySelector(`.docs-nav-item[data-section="${hash}"]`);
    if (targetNav) {
      targetNav.click();
    }
  }

  // Code syntax highlighting (basic)
  highlightCode();
});

// Basic syntax highlighting
function highlightCode() {
  const codeBlocks = document.querySelectorAll('code');
  
  codeBlocks.forEach(block => {
    let code = block.innerHTML;
    
    // Highlight strings
    code = code.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
    code = code.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
    
    // Highlight numbers
    code = code.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    
    // Highlight booleans
    code = code.replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>');
    
    // Highlight common keywords
    code = code.replace(/\b(require|export|default|async|await|function|const|let|var|return|if|else|try|catch)\b/g, '<span class="keyword">$1</span>');
    
    block.innerHTML = code;
  });
}

// Copy code to clipboard
function copyCode(button) {
  const codeBlock = button.parentElement.nextElementSibling.querySelector('code');
  const code = codeBlock.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  });
}

// Scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}