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
    waveCount: 3500,
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
    background: '#000000',
    color: '#ffffff',
    show: {
      axis: false,
      coordinate: false,
      grid: false
    },
    dots: {
      radius: 2,
      active: true,
      scale: 1,
      opacity: 100
    },
    lineStroke: {
      opacity: 20,
      color: '#ffffff',
      get getColor() {
        return hexToRGB(this.color, this.opacity / 100)
      } 
    },
    ellipseStroke: {
      opacity: 20,
      color: '#ffffff',
      get getColor() {
        return hexToRGB(this.color, this.opacity / 100)
      } 
    },
  }