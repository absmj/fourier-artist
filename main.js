const sketchData = {
    p5: null,
    svg: {
      el: null,
      original: null,
      pathologize: null,
      width: 0,
      height: 0,
      get area() {
        return this.width * this.height
      },

      get aspect() {
        return [

        ]
      }
    },

    canvas: {
      id: `fourier-art-${Math.floor(Math.random() * 10 + (10 - 1))}`,
      width: window.screen.width,
      height: window.screen.height,
      get area() {
        return this.width * this.height
      }
    },
    waveCount: 2000,
    scale: 1,
    transformX: 0,
    transformY: 0,
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
  }

  const options = {
    background: 255,
    color: 0,
    show: {
      axis: false,
      coordinate: false,
      grid: false
    },
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