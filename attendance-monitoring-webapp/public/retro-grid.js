// RetroGrid component in vanilla JavaScript
class RetroGrid {
  constructor({
    container,
    angle = 65,
    cellSize = 60,
    opacity = 0.5,
    lightLineColor = "gray",
    darkLineColor = "gray",
  } = {}) {
    this.container = container;
    this.angle = angle;
    this.cellSize = cellSize;
    this.opacity = opacity;
    this.lightLineColor = lightLineColor;
    this.darkLineColor = darkLineColor;
    
    this.init();
  }

  init() {
    // Create the main container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'retro-grid';
    gridContainer.style.cssText = `
      --grid-angle: ${this.angle}deg;
      --cell-size: ${this.cellSize}px;
      --opacity: ${this.opacity};
      --light-line: ${this.lightLineColor};
      --dark-line: ${this.darkLineColor};
    `;

    // Create the grid element
    const gridElement = document.createElement('div');
    gridElement.className = 'retro-grid-inner';
    
    // Create the grid lines
    const gridLines = document.createElement('div');
    gridLines.className = 'retro-grid-lines';
    
    // Create the gradient overlay
    const gradientOverlay = document.createElement('div');
    gradientOverlay.className = 'retro-grid-overlay';
    
    // Append elements
    gridElement.appendChild(gridLines);
    gridContainer.appendChild(gridElement);
    gridContainer.appendChild(gradientOverlay);
    
    // Append to the container
    this.container.appendChild(gridContainer);
  }
}

// Initialize RetroGrid when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add RetroGrid to the background of the app container
  const appContainer = document.getElementById('app-container');
  
  if (appContainer) {
    // Make sure the app container has position relative for proper positioning
    appContainer.style.position = 'relative';
    
    // Create RetroGrid instance
    new RetroGrid({
      container: appContainer,
      angle: 65,
      cellSize: 60,
      opacity: 0.3,
      lightLineColor: 'rgba(200, 200, 200, 0.8)',
      darkLineColor: 'rgba(100, 100, 100, 0.8)'
    });
  }
});