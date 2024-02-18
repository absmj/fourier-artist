
const sketch = {
  p5: null,
  svg: {
    el: null,
    get sizeOf() {
      return this.el.getBoundingClientRect() ?? null
    }
  },

  get optimize() {
    const rs = this.canvas.width / this.canvas.height
    const ri = this.svg.sizeOf.width / this.svg.sizeOf.height
    return rs > ri ? [(this.svg.sizeOf.width * this.canvas.height/this.svg.sizeOf.height), this.canvas.height] :
                      [this.canvas.width, (this.svg.sizeOf.height * this.canvas.width/this.svg.sizeOf.width)]        
  },

  canvas: {
    id: `fourier-art-${Math.floor(Math.random() * 10 + (10 - 1))}`,
    width: window.screen.width,
    height: window.screen.height,
    transform: {
      x: 0,
      y: 0
    }
  },
  waveCount: 1000,
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
    dots: {
      active: true,
      scale: 1,
      color: 0,
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
  },

  set coordinates(coordinate) {
    const svgContainer = document.querySelector('#svg-content')

    svgContainer.innerHTML = pathologize(coordinate)
    this.svg.el = document.querySelector('#svg-content > svg')
    const paths = document.querySelectorAll('path')

    document.getElementById('coord-content').innerHTML = coordinate

    if(this.seperate)
      this.pathCoordinates = pathsToCoords(paths, 1, this.waveCount, 0, 0, this.seperate)
    else
      this.pathCoordinates[0] = pathsToCoords(paths, 1, this.waveCount, 0, 0, this.seperate)

    if(this.p5) {
      this.p5.clear()
      this.p5.remove()
      this.finished = false
      this.path = []
      this.time = 0
    }

    new p5(this.drawMachine, 'canvasHolder')
  },

  set index(index) {
    this.currentIndex = index;
  },
  
  get drawMachine() {
    return p5 => {
      let index = 0;
      const coordinate = () => {
        const skip = 1;
        this.x = [];
        for (let i = 0; i < this.pathCoordinates[index].length; i += skip) {
          const c = new Complex(this.pathCoordinates[index][i][0], this.pathCoordinates[index][i][1]);
          this.x.push(c);
          
        }
        // currentImage = this.images[index]

        this.fourierX = dft(this.x, this.p5);
        this.fourierX.sort((a, b) => b.amp - a.amp);

   
      }

      p5.preload = () => {
        this.p5 = p5
      }
    
      p5.setup = () => {
        const canvasEl = document.getElementById("canvasHolder")
        this.canvas.width = canvasEl.offsetWidth
        this.canvas.height = canvasEl.offsetHeight
        p5.createCanvas(this.canvas.width, this.canvas.height);

        coordinate()
        alert(1)
        // currentImage = this.p5.createGraphics(this.canvas.width, this.canvas.height)
      }
    
      p5.draw =  () => {
        p5.background(0)
        this.fourier()

        const dt = p5.TWO_PI / this.fourierX.length;
        this.time += dt;

        // p5.noLoop()
        // return;
        if (this.time > p5.TWO_PI) {
          if(index < this.pathCoordinates.length - 1) {    
            if(this.seperate) {
              index += 1;
              coordinate()
            }        

            // for(let i = 0; i < this.images.length; i++) {
            //   // this.images[i].background(22)
            //   p5.image(this.images[i], 0, 0)
            // }
          } else {
            this.finished = true
            // p5.noLoop()
          }
          this.time = 0;
          // this.path = [];

          // p5.noLoop()
        }
      }
    }
  },

  fourier() {
    this.p5.background(this.options.background)
    let v = this.epicycles(this.p5.width / 8, this.p5.height / 8, 0, this.fourierX, this.p5);
    this.path.unshift(v);
    this.p5.stroke(this.options.dots.color,100)
    this.p5.beginShape(this.options.dots.active ? this.p5.POINTS : this.p5.LINES);
    // this.p5.noFill();
    for (let i = 0; i < this.path.length; i++) {
      this.p5.vertex(this.path[i].x, this.path[i].y);
    }
    this.p5.endShape();
  },

  epicycles(x, y, rotation, fourier, p5) {
    for (let i = 0; i < fourier.length; i++) {
      let prevx = x;
      let prevy = y;
      let freq = fourier[i].freq;
      let radius = fourier[i].amp;
      let phase = fourier[i].phase;
      x += radius * p5.cos(freq * this.time + phase + rotation);
      y += radius * p5.sin(freq * this.time + phase + rotation);
  
      // if (this.time > p5.TWO_PI) {
      //   // this.time = 0;
      //   break;
      // }
  
      if(!this.finished){

        p5.stroke(this.options.ellipseStroke.color, this.options.ellipseStroke.opacity);
        p5.noFill();
        p5.ellipse(prevx, prevy, radius * 2);

        p5.stroke(this.options.lineStroke.color, this.options.lineStroke.opacity);
        p5.line(prevx, prevy, x, y);
      }
    }
    return p5.createVector(x, y);
  },


  tryYourSvg(file) {
    try {
      const reader = new FileReader()
      reader.onload = e => {
        if (e.target.result) {
          this.coordinates = e.target.result
        } else throw new Error("File content is empty or isn't readable")
      }

      reader.onerror = e => {
        throw new Error(e)
      }

      reader.readAsText(file.files[0])

    } catch (e) {
      console.error(e)
    }
  },

}