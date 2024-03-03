
let index = 0;
let sketch = {
  data: sketchData,
  options,
  loading: false,
  get color() {
    return this.options.color == 'random' ?
      this.data.p5.color(`rgb(${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)}, ${Math.round(Math.random() * 255)})`)
      : this.data.p5.color(this.options.color)
  },


  get bgColor() {
    return this.data.p5.color(this.options.background)
  },

  optimize: {
    center(canvas, svg) {
      const s = this.scale(canvas, svg)
      svg.width *= s
      svg.height *= s

      return {
        x: ((canvas.width - svg.width) / 2) * 0.65,
        y: ((canvas.height - svg.height) / 2) * 0.65
      }
    },

    scale(canvas, svg) {
      const ws = (canvas.width / svg.width) * 0.6
      const hs = (canvas.height / svg.height) * 0.6
      return Math.min(ws, hs)
    },

    numberOfDots(dotCount) {
      if(navigator.deviceMemory) return navigator.deviceMemory * 512;
      else {
        console.warn("Your browser doesn't support navigator.deviceMemory, so we can't define the optimal number of dots for you.")
        return dotCount
      }
    }
  },

  mount() {
    if (this.data.p5) {
      this.data.p5.loop()
      index = 0;
      this.data.path = []
      this.data.time = 0
      this.data.p5.coordinate()
      this.data.p5.clear()
      this.data.finished = false

    } else {
      new p5(this.drawMachine, 'canvasHolder')
    }
  },

  update(key, value) {
    this[key] = value
  },

  coordinates(coordinate) {
    try {
      index = 0;
      this.data.finished = false;
      this.data.pathCoordinates = new Array();
      const svgContainer = document.querySelector('#svg-content');
      const svgContainerOriginal = document.querySelector('#svg-content-org');
      this.data.svg.original = coordinate;
      this.data.svg.pathologize = pathologize(coordinate);

      svgContainerOriginal.innerHTML = this.data.svg.original;

      const svg = svgContainerOriginal.children[0];
      if(svg.getAttribute('width') && svg.getAttribute('height')) {
        this.data.svg.width = parseFloat(svg.getAttribute('width'));
        this.data.svg.height = parseFloat(svg.getAttribute('height'));
      } else {
        const [,,w,h] = svg.getAttribute('viewBox').split(' ')
        this.data.svg.width = w;
        this.data.svg.height = h;
      }


      svgContainer.innerHTML = this.data.svg.pathologize
      this.data.svg.el = document.querySelector('#svg-content-org > svg')
      this.data.svg.el.setAttribute('width', '100')
      this.data.svg.el.setAttribute('height', '100')
      return this;
    } catch (e) {
      console.error(e)
    }
  },

  calculation() {
    const paths = document.querySelectorAll('#svg-content * path')
    if (this.data.seperate)
      this.data.pathCoordinates = pathsToCoords(paths, this.data.scale, this.data.waveCount, this.data.transformX, this.data.transformY, this.data.seperate)
    else
      this.data.pathCoordinates[0] = pathsToCoords(paths, this.data.scale, this.data.waveCount, this.data.transformX, this.data.transformY, this.data.seperate)

    return this;
  },

  set index(index) {
    this.data.currentIndex = index;
  },

  get drawMachine() {
    return p5 => {

      p5.coordinate = () => {
        const skip = 1;
        this.data.x = [];
        for (let i = 0; i < this.data.pathCoordinates[index].length; i += skip) {
          const coord = this.data.pathCoordinates[index][i]
          const c = new Complex(coord[0], coord[1]);
          // c.color = this.color
          this.data.x.push(c);
        }
        // currentImage = this.data.images[index]

        this.data.fourierX = dft(this.data.x, this.data.p5).map(v => ({ ...v, color: this.color }));
        this.data.fourierX.sort((a, b) => b.amp - a.amp);


      }

      p5.grid = () => {
        p5.push();
        p5.drawingContext.setLineDash([5, 5])

        const squareGridSize = Math.max(this.data.canvas.width, this.data.canvas.height)

        for (let w = 0; w < squareGridSize; w += squareGridSize / 10) {
          for (let h = 0; h < squareGridSize; h += squareGridSize / 10) {
            p5.stroke(192, 75);
            p5.strokeWeight(1);
            p5.line(w, 0, w, squareGridSize);
            p5.line(0, h, squareGridSize, h);
          }
        }
        p5.pop();
      }

      p5.coordinateSystem = () => {
        p5.push()
        p5.fill(0)

        // p5.line(0, 0, 0, this.data.canvas.height)
        p5.line(20, 0, 20, this.data.canvas.height)
        p5.line(0, this.data.canvas.height - 20, this.data.canvas.width, this.data.canvas.height - 20)
        p5.triangle(20, 10, 15, 20, 25, 20)
        p5.triangle(this.data.canvas.width - 10, this.data.canvas.height - 20, this.data.canvas.width - 20, this.data.canvas.height - 15, this.data.canvas.width - 20, this.data.canvas.height - 25)

        p5.pop()
      }

      p5.preload = () => {
        this.loading = false
        this.data.p5 = p5
      }

      p5.setup = () => {
        this.data.canvas.width = p5.windowWidth
        this.data.canvas.height = p5.windowHeight
        p5.createCanvas(this.data.canvas.width, this.data.canvas.height);
        if(this.data.pathCoordinates.length > 0)
          p5.coordinate()
        else
          p5.grid()
        this.loading = false
        // currentImage = this.data.p5.createGraphics(this.data.canvas.width, this.data.canvas.height)
      }

      p5.draw = () => {
        this.data.p5.background(this.bgColor)
        if (this.options.show.axis) p5.coordinateSystem();
        const { x, y } = this.fourier()
        if (this.options.show.coordinate && !this.finished) {
          p5.textSize(18)
          p5.textAlign(p5.RIGHT);
          p5.text(`x: ${x.toFixed(2)}\ny: ${y.toFixed(2)}`, this.data.canvas.width - 40, 36)
        }

        if (this.options.show.grid) p5.grid();

        const dt = p5.TWO_PI / this.data.fourierX.length;
        this.data.time += dt;

        // p5.noLoop()
        // return;
        if (this.data.time > p5.TWO_PI) {
          this.data.time = 0;
          if (this.data.seperate) {
            if (index < this.data.pathCoordinates.length - 1) {
              index += 1;
              p5.coordinate()
            } else {
              this.data.finished = true
            }
          } else {
            this.data.finished = true
          }



          // this.data.path = [];

          // p5.noLoop()
        }
      }
    }
  },

  fourier() {

    this.data.p5.push()
    let v = this.epicycles(this.data.p5.width / 8, this.data.p5.height / 8, 0, this.data.fourierX, this.data.p5);
    this.data.path.unshift(v);


    this.data.p5.strokeWeight(this.options.dots.radius)
    this.data.p5.beginShape(this.options.dots.active ? this.data.p5.POINTS : this.data.p5.LINES);

    // this.data.p5.noFill();
    for (let i = 0; i < this.data.path.length; i++) {
      this.data.p5.stroke(this.color, 100)
      this.data.p5.vertex(this.data.path[i].x, this.data.path[i].y);
    }
    this.data.p5.endShape();
    this.data.p5.pop();
    return v
  },

  epicycles(x, y, rotation, fourier, p5) {
    for (let i = 0; i < fourier.length; i++) {
      let prevx = x;
      let prevy = y;
      let freq = fourier[i].freq;
      let radius = fourier[i].amp;
      let phase = fourier[i].phase;
      x += radius * p5.cos(freq * this.data.time + phase + rotation);
      y += radius * p5.sin(freq * this.data.time + phase + rotation);

      // if (this.data.time > p5.TWO_PI) {
      //   // this.data.time = 0;
      //   break;
      // }

      if (!this.data.finished) {
        p5.stroke(p5.color(this.options.ellipseStroke.getColor));
        p5.noFill();
        p5.ellipse(prevx, prevy, radius * 2);

        p5.stroke(p5.color(this.options.lineStroke.getColor));
        p5.line(prevx, prevy, x, y);
      } else {
        // this.data.p5.noLoop()
      }
    }
    return p5.createVector(x, y);
  },

}