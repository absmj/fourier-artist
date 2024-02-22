const sketchData = {
    p5: null,
    svg: {
      el: null,
      original: null,
      pathologize: null,
    },

    canvas: {
      id: `fourier-art-${Math.floor(Math.random() * 10 + (10 - 1))}`,
      width: window.screen.width,
      height: window.screen.height,
    },
    waveCount: 5000,
    scale: 1,
    transform: {
      x: 0,
      y: 0
    },
    images: [],
    currentIndex: 0,
    pathCoordinates: [],
    x: [],
    fourierX: [],
    path: [],
    time: 0,
    finished: false,
    seperate: false,
    record: false,
    options: {
      background: 255,
      color: 0,
      dots: {
        radius: 1,
        active: true,
        scale: 1,
        opacity: 100
      },
      lineStroke: {
        opacity: 20,
        color: 0
      },
      ellipseStroke: {
        opacity: 20,
        color: 0
      }
    }
  }